/* KOF 2002 — 1인 플레이 페이지
 *
 * 에뮬레이터: EmulatorJS 4.2.3 (FBNeo 아케이드 코어)
 * 게임 ROM과 BIOS는 사용자가 로컬에서 선택하며, 이 브라우저 밖으로 나가지 않습니다.
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

    window.EJS_player = "#game";
    window.EJS_core = "arcade";
    window.EJS_gameUrl = gameFile;
    window.EJS_biosUrl = URL.createObjectURL(bios); // Blob URL은 문자열 경로로 처리됩니다.
    window.EJS_pathtodata = EJS_DATA;
    window.EJS_language = "ko-KO";
    window.EJS_color = "#e01f36";
    window.EJS_backgroundColor = "#08080c";
    window.EJS_startOnLoaded = false;

    window.EJS_ready = function () {
      setStatus("에뮬레이터 준비 완료. 화면의 ‘플레이’ 버튼을 누르세요.");
    };

    window.EJS_onGameStart = function () {
      setStatus("실행 중입니다.");
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

