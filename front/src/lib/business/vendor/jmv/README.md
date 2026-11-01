# Java-memory-visualizer 실행기·추적기 (복사본)

출처: 사용자가 운영하는 Java-memory-visualizer, 브랜치 `codex/cloudflare-sharing` 커밋 `5762765`의 `web/app/`. `git show 5762765:web/app/<파일>`로 그대로 복사했다. 이 폴더 파일은 고치지 않는다.

| 파일 | 역할 |
|---|---|
| `language-runtime.js`, `language-worker.js`, `limits.js` | C·C++·Python·JS 실행 Worker와 시간 제한 |
| `runtime.js`, `runtime-config.js`, `preload-profile.js`, `vendor-cache.js` | CheerpJ 4.3(공식 CDN)에서 상주 ECJ 컴파일러와 Java 추적기를 띄움 |
| `c-tracer.js`, `c-structs.js`, `c-memory.js`, `c-printf.js`, `c-live-input.js` | JSCPP 디버거로 C 실행, struct·malloc/free·ILP32 가상 주소 기록 |
| `c-engine.js` | 원본 `prepare.mjs`가 만든 JSCPP 2.0.9 브라우저 번들 |
| `cpp-tracer.js`, `cpp-instrument.js`, `cpp-runtime.hpp`, `cpp-engine.js` | browsercc(Clang 20 + LLD → WASM32/WASI)로 C++ 컴파일·계측 |
| `python-tracer.py` | Pyodide CPython `sys.settrace` 추적기 |
| `js-tracer.js`, `js-engine.js` | Babel 계측 JS 추적기(`js-engine.js`는 원본 번들) |
| `render.js`, `highlight.js`, `streams.js`, `column-splitter.js`, `panel-height.js`, `panel-focus.js`, `style.css` | 실행 기록을 그리는 TraceView |
| `java/` | Java 클래스패스(아래) |
| `licenses/` | 원본 `web/app/multilang-licenses/`, `licenses/java/`는 원본 운영 배포의 Java 고지(ASM, EPL-2.0, ECJ about, OpenJDK legal) |

## Java 클래스패스 (`java/`)

| 파일 | 출처 |
|---|---|
| `tracer.jar` | 5762765의 `tracer/jmv/*.java`를 JDK 25.0.3 `javac --release 17`로 컴파일. 원본 운영 빌드와 같은 29개 클래스·같은 크기 |
| `ecj-3.33.0.jar` | Maven Central. SHA256 `f7686c4960cf70c2ebc5c500a73a8cfc04541b730c18f1c5c21329889b137f45` (원본 고정값과 같음). EPL-2.0 |
| `asm/asm-9.7.1.jar`, `asm/asm-tree-9.7.1.jar` | Maven Central. BSD-3-Clause |
| `java17-api.jar` | 원본 `scripts/prepare_java17_api.py`가 OpenJDK `ct.sym`에서 추출한 Java 17 API 서명. GPLv2 + Classpath Exception. 대응 소스는 OpenJDK 소스와 원본 운영 배포의 `/licenses/sources/` |

CheerpJ 런타임은 복사하지 않는다. 공식 CDN(`https://cjrtnc.leaningtech.com/4.3/loader.js`)만 쓴다.

## 빌드 때 만드는 자산 (git 미포함)

- `browsercc-0.1.1/`: devDependency `browsercc@0.1.1`의 clang·lld·sysroot를 gzip으로. 원본 운영 vendor와 내용이 같음을 확인했다.
- `pyodide-314.0.7/`: devDependency `pyodide@314.0.7`의 5개 파일(원본 `prepare.mjs`와 같은 목록).

## 복사할 때 적용하는 패치 (`scripts/build-code-lab.mjs` `PATCHES`)

- `runtime-config.js`: CheerpJ `/app/` 아래 Java 자산 경로를 `/app/code-lab/jmv/java`로.
- `language-worker.js`: Pyodide 경로를 모듈 옆 `pyodide-314.0.7/`로.
- `cpp-tracer.js`: browsercc 경로를 모듈 옆 폴더로, AST 단계 컴파일 오류 줄 번호가 감싸기 앞부분만큼 밀리는 원본 버그 보정.

원본을 다시 가져올 때는 같은 방식으로 복사하고 패치 기준 문자열이 남아 있는지 빌드로 확인한다.
