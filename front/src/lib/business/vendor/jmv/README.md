# Java-memory-visualizer C·C++ 추적기 (복사본)

출처: 사용자가 운영하는 Java-memory-visualizer, 브랜치 `codex/cloudflare-sharing` 커밋 `5762765`의 `web/app/`. `git show 5762765:web/app/<파일>`로 그대로 복사했다. 이 폴더 파일은 고치지 않는다.

| 파일 | 역할 |
|---|---|
| `c-tracer.js`, `c-structs.js`, `c-memory.js`, `c-printf.js`, `c-live-input.js`, `limits.js` | JSCPP 디버거로 C를 실행하고 struct·malloc/free·ILP32 가상 주소를 공통 snapshot doc으로 기록 |
| `c-engine.js` | 원본 `prepare.mjs`가 만든 JSCPP 2.0.9 브라우저 번들 |
| `cpp-tracer.js`, `cpp-instrument.js`, `cpp-runtime.hpp` | browsercc(Clang 20 + LLD → WASM32/WASI)로 C++을 컴파일하고 Clang AST 범위 계측으로 생성·소멸·new/delete 기록 |
| `cpp-engine.js` | `@bjorn3/browser_wasi_shim` 0.4.2와 browsercc의 sysroot 도구 번들 |
| `render.js`, `highlight.js`, `streams.js`, `column-splitter.js`, `panel-height.js`, `panel-focus.js`, `style.css` | 실행 기록을 그리는 TraceView |
| `licenses/` | 원본 `web/app/multilang-licenses/` (Pyodide·Python 제외) |

컴파일러 바이너리(`clang.wasm`, `lld.wasm`, `sysroot.tar`)는 git에 넣지 않는다. devDependency `browsercc@0.1.1`에서 `scripts/build-code-lab.mjs`가 gzip으로 만들어 `public/code-lab/jmv/browsercc-0.1.1/`에 둔다. 원본 운영 자산과 같은 npm 버전이며 clang·lld(.js·.wasm)·sysroot 내용이 원본 vendor와 같음을 확인했다.

복사할 때 `build-code-lab.mjs`의 `PATCHES`만 적용한다.

- `cpp-tracer.js`의 런타임 경로를 모듈 옆 폴더로 바꾼다.
- C++ AST 단계 컴파일 오류의 줄 번호가 감싸기 앞부분만큼 밀리는 원본 버그를 원래 줄로 되돌린다.

원본을 다시 가져올 때는 같은 방식으로 복사하고 패치 기준 문자열이 남아 있는지 빌드로 확인한다.
