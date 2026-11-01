# 05: 버전별 React 킷과 독립 VDOM 관찰

**What to build:** React 기본 및 React+Tailwind 킷을 선택하고 렌더링·실제 DOM·React VDOM을 따로 관찰한다.

**Blocked by:** 04: JavaScript·TypeScript 실행과 실시간 DOM; 03: 독립 패널 배치와 브라우저 설정 복원

**Status:** resolved

- [x] 개발 코드로만 킷을 추가하며 관리 화면을 만들지 않는다.
- [x] 같은 버전 수정은 반영하고 새 버전은 기존 문서에 자동 적용하지 않는다.
- [x] 기본 React와 React+Tailwind가 별도 킷으로 실행된다.
- [x] 클릭에 따른 React 상태 변화에서 렌더링·실제 DOM·React 트리를 검증하고 데이터 출처·버전 제약을 명시한다.

## Comments

- 2026-11-01 Claude: `kits.ts` 레지스트리(react-starter-1, react-tailwind-starter-1), 없는 버전은 안내 문구. 클릭 후 렌더링 `count 2`, DOM 패널은 실제 텍스트 노드(`"count ""2"`), VDOM 패널은 DevTools 훅 Fiber(`<Counter>`, `step=2`, `state[0]=2`, react-dom 19.2.3)로 서로 다름을 e2e 확인. Fiber 구조는 React 19.2 한정임을 `docs/code-lab.md`에 기록. Tailwind 클래스 적용 확인.
