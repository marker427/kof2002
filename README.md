# KOF 2002 — 1인 플레이 (GitHub Pages용)

본인이 보유한 KOF 2002 ROM과 Neo Geo BIOS를 브라우저에서 직접 선택해, CPU와 1:1로 즐기는 최소 구성의 정적 페이지입니다.
에뮬레이터는 [EmulatorJS](https://emulatorjs.org) 4.2.3(FBNeo 아케이드 코어)을 CDN에서 불러와 사용합니다.

## 폴더 구성

```
index.html   화면(한국어 UI)
style.css    스타일
app.js       파일 선택 → 에뮬레이터 실행 로직
README.md    이 문서
```

빌드 과정이 없습니다. 위 파일을 그대로 올리면 됩니다.

## GitHub Pages 배포

1. GitHub에서 새 저장소를 만듭니다(공개 저장소, 이름 예: `kof2002`).
2. 이 폴더의 파일 4개를 저장소 최상위(`README.md` 포함)에 업로드합니다.
   - 웹 UI: **Add file → Upload files** 로 끌어다 놓고 **Commit changes**.
   - 또는 터미널에서:
     ```bash
     git init
     git add index.html style.css app.js README.md
     git commit -m "KOF 2002 single player page"
     git branch -M main
     git remote add origin https://github.com/<사용자명>/kof2002.git
     git push -u origin main
     ```
3. 저장소 **Settings → Pages** 로 이동합니다.
4. **Build and deployment → Source** 를 `Deploy from a branch` 로 두고,
   Branch 를 `main`, Folder 를 `/ (root)` 로 선택한 뒤 **Save**.
5. 1~2분 뒤 `https://<사용자명>.github.io/kof2002/` 에서 열립니다.

`index.html`이 최상위에 있으므로 별도 설정이나 빌드 작업은 필요 없습니다.

## 게임 파일 준비 (본인 책임)

- **게임 ROM**: FBNeo 롬셋 기준 `kof2002.zip`.
  파일 이름이 다르면 페이지가 실행 시 `kof2002.zip` 이름으로 전달합니다.
- **BIOS**: Neo Geo 공통 BIOS `neogeo.zip` (KOF 2002 실행에 필수).
- 두 파일 모두 **정당하게 보유한 것**만 사용하세요. 이 저장소에는 게임·BIOS 파일이 포함되지 않으며,
  페이지는 그 파일을 제공하거나 내려받도록 안내하지 않습니다.

> 중요: ROM과 BIOS를 저장소에 커밋하지 마세요. GitHub Pages는 저장소 내용을 전부 공개 배포하므로
> 저작권 있는 파일을 올리면 공개 배포가 됩니다. 이 페이지는 방문자의 컴퓨터에서 파일을 고르는 방식만 사용합니다.

## 사용 흐름

1. 페이지에서 `kof2002.zip` 선택 → `neogeo.zip` 선택 → **게임 시작**.
2. 에뮬레이터가 뜨면 **플레이** 버튼을 누릅니다(첫 실행은 코어 내려받기로 수십 초 소요).
3. 게임 내에서 `Enter`(START)로 모드를 고르고 CPU 대전을 선택합니다.

파일은 `File`/Blob으로만 에뮬레이터에 전달되며 서버로 업로드되지 않습니다.
단, 에뮬레이터 본체(코어 포함)는 CDN에서 내려받으므로 인터넷 연결이 필요합니다.

## 조작 키 (1P 기본값)

| 동작 | 키 |
| --- | --- |
| 이동 | 방향키 |
| A 약손 | Z |
| B 약발 | X |
| C 강손 | A |
| D 강발 | S |
| START | Enter |
| SELECT(코인) | V |

에뮬레이터 화면의 설정(톱니바퀴) → *Control Settings* 에서 변경할 수 있습니다.

## 알아둘 점

- 이 페이지는 HTTPS 정적 호스팅을 전제로 합니다. GitHub Pages는 HTTPS이므로 그대로 동작합니다.
- GitHub Pages는 `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` 헤더를 보낼 수 없어
  멀티스레드(`EJS_threads`) 옵션은 사용하지 않습니다. 단일 스레드로 동작합니다.
- 저장(세이브 스테이트)은 브라우저 저장소에 남습니다. 브라우저 데이터를 지우면 함께 사라집니다.
- 모바일에서는 터치 가상 패드가 표시되지만, 1인 플레이 기준으로는 키보드·게임패드를 권장합니다.

## 검증 범위

정적 검사만 수행했습니다. HTML/CSS/JS 문법, 에뮬레이터 옵션 이름과 CDN 경로(loader.js, 한국어 언어팩,
fbneo 코어 파일)가 실제로 응답하는지 확인했습니다. **ROM과 BIOS가 없어 실제 게임 실행(부팅·대전)은
검증하지 못했습니다.** 실행이 되지 않는다면 파일 이름(`kof2002.zip`, `neogeo.zip`)과 롬셋 일치 여부를
먼저 확인하세요.

kof 웹 사이트
