/* KOF 2002 — 1인 플레이 페이지
 *
 * 에뮬레이터: EmulatorJS 4.2.3 (FBNeo 아케이드 코어)
 * 게임 ROM과 BIOS는 사용자가 로컬에서 선택하며, 이 브라우저 밖으로 나가지 않습니다.
 *
 * [BIOS 처리 방식 — 4.2.3 소스 확인 결과]
 * FBNeo(libretro)는 locate_archive()에서 "neogeo.zip" 이라는 이름의 압축 파일만
 * 엽니다(g_rom_dir, g_system_dir, g_system_dir/fbneo). 압축을 풀어 둔 개별 파일
 * (sm1.sm1, sfix.sfix, 000-lo.lo ...)은 읽지 않습니다. 따라서 BIOS는 반드시
 * 하나의 완전한 ZIP으로 가상 파일시스템의 "/neogeo.zip"에 있어야 합니다.
 *
 * 그런데 EmulatorJS 4.2.3의 EJS_GameManager.loadExternalFiles()는
 *   this.writeFile(path, res.data)   // res.data는 ArrayBuffer
 * 로 씁니다. 이 호출은 이 Emscripten FS에서 0바이트 파일을 만듭니다.
 * (Uint8Array로 감싸야 함) 그래서 아래에서 writeFile을 감싸는 패치를 설치하고,
 * 실행 직전에 /neogeo.zip 크기를 실제 바이트 수와 대조해 필요하면 다시 씁니다.
 */
(function () {
  "use strict";

  var EJS_VERSION = "4.2.3";
  var EJS_DATA = "https://cdn.emulatorjs.org/" + EJS_VERSION + "/data/";

  var romInput = document.getElementById("romInput");
  var biosInput = document.getElementById("biosInput");
  var romFile = document.getElementById("romFile");
  var biosFile = document.getElementById("biosFile");
  var startBtn = document.getElementById("startBtn");
  var statusEl = document.getElementById("status");
  var stage = document.getElementById("stage");
  var setup = document.getElementById("setup");
  var resetBtn = document.getElementById("resetBtn");

  var rom = null;
  var bios = null;
  var launched = false;

  function setStatus(text, isError) {
    statusEl.textContent = text || "";
    statusEl.classList.toggle("is-error", !!isError);
  }

  function describe(file) {
    var mb = (file.size / (1024 * 1024)).toFixed(1);
    return file.name + " · " + mb + " MB";
  }

  function refresh() {
    var ready = !!(rom && bios);
    startBtn.disabled = !ready;
    if (!ready) {
      if (rom || bios) setStatus("두 파일을 모두 선택해야 시작할 수 있습니다.");
      else setStatus("");
    } else {
      setStatus("준비되었습니다. ‘게임 시작’을 누르세요.");
    }
  }

  function isZip(file) {
    return /\.zip$/i.test(file.name);
  }

  function pickRom() {
    var file = romInput.files && romInput.files[0];
    rom = null;
    if (!file) {
      romFile.textContent = "선택된 파일 없음";
      romFile.classList.remove("is-set");
      refresh();
      return;
    }
    if (!isZip(file)) {
      romFile.textContent = "ZIP 파일이 아닙니다: " + file.name;
      romFile.classList.remove("is-set");
      romInput.value = "";
      setStatus("게임 ROM은 .zip 파일이어야 합니다.", true);
      refresh();
      return;
    }
    rom = file;
    romFile.textContent = describe(file);
    romFile.classList.add("is-set");
    if (!/^kof2002\.zip$/i.test(file.name)) {
      setStatus("파일 이름이 kof2002.zip이 아닙니다. 실행 시 kof2002.zip 이름으로 전달됩니다.");
    }
    refresh();
  }

  function pickBios() {
    var file = biosInput.files && biosInput.files[0];
    bios = null;
    if (!file) {
      biosFile.textContent = "선택된 파일 없음";
      biosFile.classList.remove("is-set");
      refresh();
      return;
    }
    if (!isZip(file)) {
      biosFile.textContent = "ZIP 파일이 아닙니다: " + file.name;
      biosFile.classList.remove("is-set");
      biosInput.value = "";
      setStatus("Neo Geo BIOS는 .zip 파일이어야 합니다.", true);
      refresh();
      return;
    }
    bios = file;
    biosFile.textContent = describe(file);
    biosFile.classList.add("is-set");
    refresh();
  }

  /* --- 4.2.3 버그 우회: ArrayBuffer → Uint8Array ------------------------- */

  function patchWriteFile() {
    var GM = window.EJS_GameManager;
    if (!GM || !GM.prototype || GM.prototype.__ejsArrayBufferFix) return !!GM;

    var original = GM.prototype.writeFile;
    GM.prototype.writeFile = function (path, data) {
      if (data && data.constructor === ArrayBuffer) {
        data = new Uint8Array(data);
      } else if (typeof SharedArrayBuffer !== "undefined" && data && data.constructor === SharedArrayBuffer) {
        data = new Uint8Array(data);
      }
      return original.call(this, path, data);
    };
    GM.prototype.__ejsArrayBufferFix = true;
    return true;
  }

  function installWriteFilePatch() {
    if (patchWriteFile()) return;
    var deadline = Date.now() + 15000;
    var timer = setInterval(function () {
      if (patchWriteFile() || Date.now() > deadline) clearInterval(timer);
    }, 10);
  }

  function biosBytes() {
    return bios.arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }

  /* 실행 직전 /neogeo.zip 이 실제 BIOS 바이트와 같은지 확인하고, 다르면 다시 씁니다. */
  function verifyBiosArchive(bytes) {
    var deadline = Date.now() + 30000;
    var timer = setInterval(function () {
      var ejs = window.EJS_emulator;
      var gm = ejs && ejs.gameManager;
      if (!gm || !gm.FS) {
        if (Date.now() > deadline) clearInterval(timer);
        return;
      }
      clearInterval(timer);

      var size = -1;
      try { size = gm.FS.stat("/neogeo.zip").size; } catch (e) { size = -1; }

      if (size === bytes.length) {
        console.info("[KOF2002] /neogeo.zip 정상:", size, "bytes");
        return;
      }
      console.warn("[KOF2002] /neogeo.zip 크기 불일치(" + size + " → " + bytes.length + "), 다시 씁니다.");
      try {
        gm.writeFile("/neogeo.zip", bytes);
        var after = gm.FS.stat("/neogeo.zip").size;
        console.info("[KOF2002] /neogeo.zip 재기록 완료:", after, "bytes");
      } catch (e) {
        console.warn("[KOF2002] /neogeo.zip 재기록 실패:", e);
      }
    }, 20);
  }

  /* ----------------------------------------------------------------------- */

  function launch() {
    if (!rom || !bios || launched) return;
    launched = true;

    startBtn.disabled = true;
    romInput.disabled = true;
    biosInput.disabled = true;
    stage.hidden = false;
    setStatus("에뮬레이터를 불러오는 중입니다… (첫 실행은 수십 초 걸릴 수 있습니다)");

    // FBNeo는 아카이브 파일 이름을 롬셋 이름으로 인식하므로 이름을 고정합니다.
    var gameFile = new File([rom], "kof2002.zip", { type: "application/zip" });

    // BIOS는 두 경로로 넘깁니다.
    //  - externalFiles: "/neogeo.zip" 이라는 완전한 ZIP으로 배치 (FBNeo가 실제로 여는 것)
    //  - biosUrl:       개별 파일 추출용 (FBNeo에는 필요 없지만 다른 코어 호환용으로 유지)
    var biosUrlForZip = URL.createObjectURL(bios);
    var biosUrlForExtract = URL.createObjectURL(bios);
    var bytesPromise = biosBytes();

    installWriteFilePatch();

    window.EJS_player = "#game";
    window.EJS_core = "arcade";
    window.EJS_gameUrl = gameFile;
    window.EJS_biosUrl = biosUrlForExtract;
    window.EJS_externalFiles = { "/neogeo.zip": biosUrlForZip };
    window.EJS_pathtodata = EJS_DATA;
    window.EJS_language = "ko-KO";
    window.EJS_color = "#e01f36";
    window.EJS_backgroundColor = "#08080c";
    window.EJS_startOnLoaded = false;

    window.EJS_ready = function () {
      patchWriteFile();
      setStatus("에뮬레이터 준비 완료. 화면의 ‘플레이’ 버튼을 누르세요.");
      bytesPromise.then(function (bytes) { verifyBiosArchive(bytes); });
    };

    window.EJS_onGameStart = function () {
      var gm = window.EJS_emulator && window.EJS_emulator.gameManager;
      var size = -1;
      try { size = gm.FS.stat("/neogeo.zip").size; } catch (e) {}
      var expected = bios.size;
      if (size === expected) {
        setStatus("실행 중입니다.");
      } else {
        setStatus("실행 중입니다. (BIOS 확인 필요: /neogeo.zip " + size + " bytes / 원본 " + expected + " bytes)", true);
      }
    };

    var script = document.createElement("script");
    script.src = EJS_DATA + "loader.js";
    script.onerror = function () {
      launched = false;
      startBtn.disabled = false;
      setStatus(
        "에뮬레이터 파일을 내려받지 못했습니다. 인터넷 연결 또는 CDN 차단 여부를 확인하세요.",
        true
      );
    };
    document.head.appendChild(script);

    stage.scrollIntoView({ behavior: "smooth", block: "start" });
    setup.querySelector("h2").textContent = "선택한 파일";
  }

  romInput.addEventListener("change", pickRom);
  biosInput.addEventListener("change", pickBios);
  startBtn.addEventListener("click", launch);
  resetBtn.addEventListener("click", function () {
    if (window.confirm("페이지를 새로 고쳐 파일을 다시 선택할까요? 진행 중인 게임은 사라집니다.")) {
      window.location.reload();
    }
  });

  refresh();
})();


