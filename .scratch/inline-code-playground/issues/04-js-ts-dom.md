# 04: JavaScript·TypeScript 실행과 실시간 DOM

**What to build:** 실행용 JavaScript·TypeScript 예제를 브라우저에서 실행하고 웹 예제의 실제 DOM 변화를 별도 패널에서 관찰한다.

**Blocked by:** 01: 브라우저 컴파일과 시각화 후보 검증; 02: 실행용 웹 블록에서 팝업 실험 완주

**Status:** resolved

- [x] TypeScript 변환을 포함해 모든 실행이 브라우저 내에서 이뤄진다.
- [x] 웹 버튼 상호작용의 결과와 DOM 변화가 서로 다른 패널에 나타난다.
- [x] 콘솔·진단·제한 초과·중지 및 오래된 결과 폐기를 검증한다.

## Comments

- 2026-11-01 Claude: JS·TS는 null-origin iframe 안 Worker에서 실행, TS는 Babel 타입 제거(타입 검사 없음). 선입력 `prompt()`, 출력 500개 제한, 무한 반복 중 호스트 응답·중지, 오래된 setTimeout 결과 폐기, TS 컴파일 오류를 e2e로 확인. HTML 클릭 결과(렌더링)와 실제 DOM 패널 변화를 분리 확인.
