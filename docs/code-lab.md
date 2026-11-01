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

- 언어 펜스 뒤에 `run`을 붙여야 실행용이 된다. 그냥 `c`, `js` 블록은 기존처럼 하이라이트만 한다.
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
| `c run` | 호스트 Worker의 c-it 인터프리터 | c-it 컴파일러(바이트코드) → VM 해석 실행 | 코드·메모리·콘솔·입력 |

Java·C++·Rust·Go는 지원하지 않는다. 판단 근거는 `.scratch/inline-code-playground/runtime-proofs.md`에 있다.

### 패널이 보여 주는 데이터

- **렌더링**: 실제 sandbox 문서. 기본 글꼴은 Pretendard이고 작성자 CSS가 덮어쓴다. 편집기·콘솔은 고정폭 글꼴이다.
- **실시간 DOM**: sandbox 문서를 `MutationObserver`로 관찰해 직렬화한 실제 DOM 트리. 런타임이 넣은 요소(`data-slog-lab`)는 뺀다.
- **React VDOM**: React DevTools 전역 훅(`__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`)으로 받은 Fiber 트리. 컴포넌트 이름·props·`useState`/`useReducer` 값이 나온다. Fiber tag 번호와 훅 연결 리스트는 React 내부 구조라서 **킷이 고정한 React 19.2에서만 보장**한다. 킷의 React를 올릴 때는 `e2e/rendering/code-lab.spec.ts`의 React 테스트로 다시 확인한다.
- **메모리**: c-it VM이 실행하며 기록한 추적(쓰기·호출·할당/해제)을 되감아 만든 스택·전역·힙. 주소는 c-it 가상 주소이고 네이티브 기계의 메모리가 아니다. 줄 단위 단계로 앞뒤 이동할 수 있다.

### C 엔진(c-it)

`front/src/lib/business/vendor/c-it/`(MIT, John Jandayan). 전처리기·파서·컴파일러가 C를 자체 바이트코드로 바꾸고 VM이 해석 실행한다. 표준 헤더는 내장 구현(`headers.ts`, `stdlib.ts`)만 쓸 수 있다. 실행 단계 20만, 명령 3천만, 출력 64KB 제한이 있고 15초가 지나면 워커를 종료한다. 실행할 때마다 워커를 새로 만들어 이전 실행 상태가 남지 않게 한다.

## 격리와 제한

- iframe은 `sandbox="allow-scripts"`만 받는다. 출처가 `null`이라 슬로그 쿠키·`localStorage`·부모 DOM에 접근할 수 없고, 슬로그 API는 CORS로 막힌다. 호스트는 `event.source`와 `origin === "null"`, 실행마다 새로 만든 토큰, 메시지 형태를 모두 확인한 뒤에만 받는다(`protocol.ts`).
- 호스트 앱 전체의 COOP/COEP 같은 격리 헤더는 바꾸지 않았다. `next.config.ts`는 `/code-lab/*` 경로에만 `Access-Control-Allow-Origin: *`를 붙인다(null 출처 iframe의 글꼴 요청용).
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
(읽기 전용 fixture 글 8번. 버튼 노출 범위, 자동 첫 실행·수동 재실행·원문 초기화, 외부 요청 없음, Pretendard, JS 선입력·과다 출력·중지·오래된 결과, TS 오류, React 세 화면 차이·반복 제한, Tailwind, C 메모리·단계 이동·오류·단계 제한, 패널 설정 복원·키보드 크기 조절, 접힌 블록·모바일)
