# 코드 실험 (실행용 코드 블록)

글의 코드 블록 중 작성자가 실행용으로 표시한 블록에만 오른쪽 위 ▶ 버튼이 붙는다. 버튼은 같은 페이지에 레이어 팝업을 열고 원문 코드를 한 번 실행한다. 이후 수정한 코드는 **실행** 버튼으로 다시 실행한다. 수정본·입력·출력은 저장하지 않으며, 닫았다가 다시 열면 원문과 초기 상태로 시작한다. 패널 배치·크기·열림 상태만 브라우저 `localStorage`(`slog.codeLab.settings.v1.<엔진>`)에 남는다.

컴파일·실행·추적은 모두 브라우저 안에서 일어난다(ADR 0003). 서버로 코드를 보내지 않는다. 내려받는 것은 `/code-lab/` 아래의 정적 런타임 파일뿐이다.

## 작성법

````markdown
```html run
<button onclick="this.textContent++">0</button>
```

```js run
console.log("안녕", prompt());
```

```ts run
const add = (a: number, b: number): number => a + b;
console.log(add(1, 2));
```

```c run
#include <stdio.h>
int main(void) { int n; scanf("%d", &n); printf("%d\n", n * 2); }
```

```react-starter-1
import { useState } from "react";
export default function App() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

```react-tailwind-starter-1
export default function App() {
  return <p className="p-4 font-bold text-red-600">Tailwind</p>;
}
```
````

- 스타터킷 이름(`react-starter-1`)은 그 자체가 실행용 표시다(인터뷰 Q9). 언어 펜스는 뒤에 `run`을 붙여야 실행용이 된다. 그냥 `c`, `js` 블록은 기존처럼 하이라이트만 한다.
- 메모리 시각화 언어는 `c run`, `cpp run`, `python run`, `java run`, `js memory`다. Java는 `public class Main`의 `main`부터 실행한다.
- 지원하지 않는 언어에 `run`을 붙이거나(`rust run`) 없는 킷 버전을 쓰면(`react-starter-9`) 재생 버튼 대신 안내 문구가 나온다.
- 한 파일 예제만 지원한다. HTML 예제는 CSS와 `<script>`를 한 문서에 담는다.
- 프로그램 입력은 **입력** 패널에 실행 전에 적는다(선입력). 한 줄씩 C `scanf`/`getchar`, JS·TS `prompt()`에 전달되고, 다 쓰면 EOF(`null`)가 된다. 실행 중 대화형 입력은 지원하지 않는다.

## 엔진별 지원 범위

| 펜스 | 실행 위치 | 변환 | 패널 |
|---|---|---|---|
| `html run` | sandbox iframe 메인 스레드 | 인라인 `<script>`에 반복 제한만 삽입 | 코드·렌더링·실시간 DOM·콘솔 |
| `js run` / `javascript run` | sandbox iframe 안 Worker | 문법 검사만 | 코드·콘솔·입력 |
| `ts run` / `typescript run` | sandbox iframe 안 Worker | Babel `preset-typescript`로 타입 제거만 한다. **타입 검사는 하지 않는다** | 코드·콘솔·입력 |
| `react-starter-1` | sandbox iframe 메인 스레드 | Babel TS+JSX(classic)+CommonJS, 반복 제한 | 코드·렌더링·실시간 DOM·React VDOM·콘솔 |
| `react-tailwind-starter-1` | 위와 같음 + Tailwind CSS 4 브라우저 런타임 | 위와 같음 | 위와 같음 |
| `c run` | 실행기 iframe의 Worker, JSCPP 2.0.9 (Java-memory-visualizer C 추적기) | JSCPP AST 인터프리터 + struct 선언 lowering | 코드·메모리·콘솔·입력 |
| `cpp run` / `c++ run` / `cxx run` | 실행기 iframe의 Worker, browsercc 0.1.1 (Java-memory-visualizer C++ 추적기) | Clang 20 + LLD → WASM32/WASI, Clang AST 범위 계측 | 코드·메모리·콘솔·입력 |
| `python run` / `py run` | 실행기 iframe의 Worker, Pyodide 314.0.7 CPython 3.14 (Java-memory-visualizer Python 추적기) | `sys.settrace` 기록 | 코드·메모리·콘솔·입력 |
| `java run` | 실행기 iframe의 CheerpJ 4.3 JVM(공식 CDN) + ECJ 3.33.0 + ASM 9.7.1 (Java-memory-visualizer Java 추적기) | ECJ로 Java 17 컴파일 → ASM 계측 → JVM 실행 | 코드·메모리·콘솔·입력 |
| `js memory` / `javascript memory` | 실행기 iframe의 Worker (Java-memory-visualizer JS 추적기) | Babel로 관측 코드 삽입 | 코드·메모리·콘솔·입력 |

`js run`은 위의 브라우저 실행(비동기·타이머 지원, 콘솔·입력)이고 `js memory`는 메모리 추적용이다. 메모리 추적기는 async/generator·DOM을 추적하지 않고 2000단계에서 멈추므로 두 모드를 나눴다. HTML·React의 렌더링·DOM·VDOM은 그대로다.

Rust·Go는 아직 재생 버튼을 주지 않는다(`run`을 붙이면 안내 문구만 나온다). 실측 근거는 `.scratch/inline-code-playground/runtime-proofs.md`에 있다.

- Go: GopherJS(BSD-2)로 브라우저 소스 컴파일·실행을 확인했다. stdin이 없고 자체 호스팅·중지는 미검증이다.
- Rust: 브라우저 rustc(rubrc)는 동작하지만 COOP/COEP가 필요하다. 호스트 전체 격리 헤더를 바꾸지 않는다는 결정 때문에 팝업 안에서 쓸 수 없어 제외한다.

### 패널이 보여 주는 데이터

- **렌더링**: 실제 sandbox 문서. 기본 글꼴은 Pretendard이고 작성자 CSS가 덮어쓴다. 편집기·콘솔은 고정폭 글꼴이다.
- **실시간 DOM**: sandbox 문서를 `MutationObserver`로 관찰해 직렬화한 실제 DOM 트리. 런타임이 넣은 요소(`data-slog-lab`)는 뺀다.
- **React VDOM**: React DevTools 전역 훅(`__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`)으로 받은 Fiber 트리. 컴포넌트 이름·props·`useState`/`useReducer` 값이 나온다. Fiber tag 번호와 훅 연결 리스트는 React 내부 구조라서 **킷이 고정한 React 19.2에서만 보장**한다. 킷의 React를 올릴 때는 `e2e/rendering/code-lab.spec.ts`의 React 테스트로 다시 확인한다.
- **메모리**: 사용자가 운영하는 Java-memory-visualizer(`codex/cloudflare-sharing` 5762765)의 추적기가 만든 실행 기록을 같은 프로젝트의 TraceView로 그린다. 방금 실행한 줄·다음 줄, 호출 스택, 힙 객체와 포인터 화살표, 단계 이동이 원본과 같다. 렌더러는 출처 없는 iframe 안에서 실행 기록만 메시지로 받아 그린다.
  - C: JSCPP 디버거의 실행 기록. struct·typedef·malloc/free의 할당·해제·누수를 추적하고 ILP32 논리 주소를 쓴다. 호스트 주소나 실제 RAM 배치가 아니다.
  - C++: 실제 Clang 20으로 컴파일한 WASM을 WASI로 실행하고, 계측으로 지역 변수·참조·공개 필드·단일 객체 new/delete·생성자/소멸자를 기록한다. private 필드·라이브러리 내부·new[]/delete[]·예외 등은 완전 추적 대상이 아니다(원본 `docs/memory-models.md`).
  - Python: Pyodide CPython의 `sys.settrace` 기록. 실행마다 새 globals를 쓰고 리스트·딕셔너리·인스턴스를 공통 힙 형식으로 보여 준다.
  - Java: ASM으로 계측한 바이트코드 실행 기록. 사용자 클래스의 호출 스택·지역 변수·static 필드·도달 가능한 객체·배열·컬렉션을 보여 준다. JVM 주소·GC는 표시하지 않는다.
  - JavaScript(`js memory`): 객체 identity·블록 스코프·호출·클로저 값, var의 undefined와 let/const의 TDZ를 구분한다.

### 메모리 언어 실행기 (Java-memory-visualizer 재사용)

원본 `web/app/`의 실행기(`language-runtime.js`, `language-worker.js`, `runtime.js`)·추적기·렌더러를 `front/src/lib/business/vendor/jmv/`에 그대로 복사했다(출처·파일 목록·빌드 패치는 그 폴더 `README.md`). 슬로그 쪽은 실행기 페이지(`sandbox/jmv-runner.html`·`jmv-runner.js`), 연결(`memoryRunner.ts`), 메모리 패널(`sandbox/jmv-memory.js`, `MemoryFrame.tsx`)만 새로 만들었다.

- 실행기는 숨긴 iframe 하나로 팝업이 열려 있는 동안 재사용한다(다시 실행할 때 Python 런타임과 Java JVM 예열을 살린다). 실행마다 원본 추적기가 새 globals(Python)·새 클래스(Java)·새 디버거(C)를 쓴다. 원본은 C·Python·JS Worker를 실행 뒤에도 살려 두므로 사용자 코드가 런타임 자체(예: Python `builtins`)를 바꾸면 같은 팝업의 다음 실행에는 남는다. 다른 블록·글로 이어지지 않도록 팝업을 닫으면 실행기를 버린다. 테스트로 Python 전역·Java static이 다음 실행에 남지 않고, `builtins` 변경이 다음 팝업에 남지 않음을 확인한다.
- 중지하면 C·C++·Python·JS는 원본 `cancelLanguageRun`으로 Worker를 끝낸다. Java는 원본에 실행 취소가 없어 실행기 iframe을 버리고 다음 실행에서 새로 띄운다.
- 실행 기록 메시지는 `status`·`code`·`trace` 형태를 확인한 뒤에만 그린다. 실행기가 60초 안에 준비되지 않으면 버리고 오류로 알린다.
- 시간 제한은 원본 `language-runtime.js`와 같다(런타임 준비 120초, C 40초, C++ 60초, Python·JS 12초). Java는 원본에 제한이 없어 첫 JVM 다운로드까지 고려해 10분 뒤 실행기를 버린다. Java 추적은 원본 기본값인 1000단계까지 기록한다.
- 원본의 실행 중 입력 기능은 쓰지 않고 선입력만 전달한다. C는 `scanf`·`getchar`, C++는 `cin`, Python은 `input()`·`sys.stdin`, Java는 `Scanner(System.in)`, JS는 `prompt()`로 읽는다.
- 자산: C++ 컴파일러(gzip 약 29MB, `browsercc@0.1.1`), Pyodide 314.0.7(약 12MB, npm `pyodide`), Java 클래스패스(`tracer.jar`·ECJ·ASM·Java 17 API 서명, 약 5.8MB, 저장소에 포함)를 빌드 때 `public/code-lab/jmv/`에 둔다. CheerpJ JVM은 복사하지 않고 공식 CDN(`cjrtnc.leaningtech.com/4.3`)에서 받는다. 각 언어 첫 실행 때만 내려받고 이후 브라우저 캐시를 쓴다.
- CheerpJ는 Community 라이선스로 쓴다. 공식 문서 기준 "개인·교육·취미 용도"와 "개인 또는 1인 회사가 공개하는 소프트웨어(유료 포함)"는 CDN에서 불러오고 "Built with CheerpJ" 표시를 하면 무료다(<https://cheerpj.com/docs/licensing>). 슬로그는 개인이 운영하는 교육용 블로그(광고 포함)라 이 조건으로 판단했고 Java 팝업 아래에 표시한다. 운영 주체가 회사로 바뀌면 Application 라이선스를 다시 확인해야 한다. 자체 호스팅은 유료라 하지 않는다.
- 코드와 선입력은 합쳐서 2MB까지 받는다(원본 제한과 같음).
- C에서 선입력이 모자라 `scanf`가 EOF를 만나면 원본 JSCPP는 `Memory overflow`로 멈춘다. 그 줄이 입력 함수를 부르면 `입력 부족: N행 scanf가 읽을 입력이 없습니다`로 바꿔 알린다.
- 이전 c-it 엔진은 제거했다. 같은 회귀 예제(선입력·배열·포인터·malloc/free·컴파일 오류·중지·재열기)를 새 엔진으로 다시 통과시켰다.


## 격리와 제한

- iframe은 `sandbox="allow-scripts"`만 받는다. 출처가 `null`이라 슬로그 쿠키·`localStorage`·부모 DOM에 접근할 수 없고, 슬로그 API는 CORS로 막힌다. 호스트는 `event.source`와 `origin === "null"`, 실행마다 새로 만든 토큰, 메시지 형태를 모두 확인한 뒤에만 받는다(`protocol.ts`).
- sandbox 문서 맨 앞에 CSP를 둔다(`connect-src 'none'`, 스크립트·글꼴은 `/code-lab/`만). 사용자 코드의 `fetch`·XHR·WebSocket 요청은 보내지기 전에 막힌다(테스트에서 슬로그 API 요청이 나가지 않음을 확인). 이미지·미디어는 `https:`를 허용하므로 이미지 주소로 외부에 신호를 보내는 것까지는 막지 않는다.
- 메시지 토큰은 사용자 코드도 읽을 수 있다. 토큰은 다른 실행의 늦은 메시지를 거르는 용도이고, 사용자 코드가 자기 패널에 거짓 값을 보내는 것은 막지 않는다. 호스트는 형태를 검증하고 화면에 텍스트로만 그린다.
- 작성자 코드는 독자가 팝업을 열면 자동으로 한 번 실행된다. 위 sandbox·CSP 경계 안에서만 돈다.
- C·C++·Python·Java·`js memory` 코드는 슬로그와 **다른 사이트**의 실행기 iframe에서 돈다. 운영은 Vercel 기본 도메인 `https://slog-2026-02-15.vercel.app`, 개발·테스트는 `localhost`↔`127.0.0.1`을 바꾼 주소다(`NEXT_PUBLIC_CODE_LAB_RUNNER_ORIGIN`으로 바꿀 수 있다). 그 밖의 주소에서 다른 사이트를 정할 수 없으면 실행하지 않는다(같은 출처 실행기는 격리가 없으므로). Python·JS는 사용자 코드를 JavaScript로 실행하고 Java는 CheerpJ의 JS 연동이 있으므로 슬로그와 같은 출처에 두지 않는다. 실행기에서는 슬로그 DOM·`localStorage`에 닿지 않는다. CheerpJ는 출처 없는 sandbox 문서에서 동작하지 않아(실측: 내부 CDN iframe과 postMessage 실패) 실제 출처가 있는 iframe을 쓴다. 실행기는 `?host=`로 받은 부모 출처의 메시지만 받고, 슬로그는 실행기 출처·`event.source`와 실행 기록 형태를 확인한다.
- 슬로그 로그인 쿠키는 `SameSite=None; Partitioned`라 최상위 사이트가 슬로그인 iframe에서 보낸 요청에도 붙을 수 있다. 그래서 `/code-lab/jmv/` 응답에 CSP 헤더(`connect-src 'self' https://cjrtnc.leaningtech.com`)를 붙여 실행기 문서와 Worker의 사용자 코드가 실행기 자산과 CheerpJ CDN 밖으로 요청하지 못하게 한다(Worker에는 meta CSP가 적용되지 않아 응답 헤더로 둔다). 테스트로 Python `open_url`의 슬로그 API 요청이 서버에 도달하지 않음(서버 측 집계 0)을 확인한다. 이 경계를 넘더라도 `api.slog.gg`는 응답 읽기를 CORS로, 쓰기 요청을 Origin 검사로 거절한다.
- 실행기가 운영 Vercel 기본 도메인에 의존한다. 프로젝트 이름을 바꾸거나 그 도메인에 배포 보호를 켜면 메모리 언어가 멈추므로 실행기 주소를 함께 바꿔야 한다. 서드파티 저장소를 막는 브라우저에서 CheerpJ 캐시 동작은 확인하지 않았다.
- 메모리 패널 렌더러는 CSP(`connect-src 'none'`)가 걸린 출처 없는 iframe에서 실행 기록만 받아 그린다.
- Babel 컴파일 워커는 하나를 재사용한다. 소스를 변환만 하고 실행하지 않으며 요청마다 독립 호출이라 이전 원문이 남지 않는다(닫고 다시 열면 원문과 출력이 처음 상태인지 테스트로 확인). 20초 안에 응답이 없으면 워커를 새로 띄운다. 실행 런타임(iframe·Worker)은 실행마다 새로 만든다.
- 호스트 앱 전체의 COOP/COEP 같은 격리 헤더는 바꾸지 않았다. `next.config.ts`는 `/code-lab/*` 경로에만 `Access-Control-Allow-Origin: *`를 붙인다(null 출처 iframe의 글꼴 요청과 메모리 패널의 module 스크립트용).
- sandbox iframe은 Chromium에서 부모와 같은 프로세스·스레드를 쓴다(실측: iframe 안 무한 반복이 부모 타이머를 멈춤). 그래서 메인 스레드에서 도는 HTML·React 코드에는 Babel로 반복문마다 1.5초 제한을 넣는다. 이 제한은 `await`를 포함한 반복에도 누적 시간으로 걸린다. JS·TS는 Worker에서 돌아 화면을 막지 않으며 8초 뒤 종료한다.
- 콘솔은 실행당 500항목, 항목당 4000자까지 받는다. DOM·VDOM 트리는 2000노드까지 보낸다.
- 다시 실행·중지·닫기·문서 교체 때는 iframe·Worker·리스너를 모두 제거한다. 늦게 도착한 메시지는 토큰과 실행 번호가 달라 버려진다.

## 스타터킷 추가·수정

`front/src/lib/codeLab/kits.ts`의 `STARTER_KITS`를 고친다. 관리자 화면은 없다.

- 같은 번호를 고치면 그 번호를 쓰는 모든 글에 반영된다.
- 새 동작이 기존 글을 깨뜨릴 수 있으면 새 번호를 추가한다. 기존 글은 자동으로 옮겨가지 않는다.
- 킷 자산은 `scripts/build-code-lab.mjs`가 `public/code-lab/`에 만든다(`pnpm dev`·`pnpm build` 전에 자동 실행, 산출물은 git에 넣지 않음).

## 검증

`pnpm exec playwright test --config playwright.rendering.config.ts e2e/rendering/code-lab.spec.ts`
(읽기 전용 fixture 글 8번. 버튼 노출 범위, sandbox 네트워크 차단, C 중간 닫기 후 재열기, 자동 첫 실행·수동 재실행·원문 초기화, 외부 요청 없음, Pretendard, JS 선입력·과다 출력·중지·오래된 결과, TS 오류, React 세 화면 차이·반복 제한, Tailwind, C 배열·포인터·malloc/free·typedef struct 연결 리스트 메모리·EOF 오류·컴파일 오류·중지, C++ 브라우저 Clang 컴파일·선입력·참조·new/delete 해제·컴파일 오류 줄 번호, JS 메모리 추적·선입력·단계 제한, Python 선입력·전역 격리·중지 후 재실행, Java CheerpJ 컴파일·Scanner 선입력·static 비누출·컴파일 오류·재열기 후 중지·재실행, C 입력 부족 안내, 패널 설정 복원·키보드 크기 조절, 접힌 블록·모바일)
