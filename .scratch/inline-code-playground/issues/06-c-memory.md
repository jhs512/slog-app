# 06: C 선입력 실행과 실제 메모리 관찰

**What to build:** C 단일 파일을 선입력과 함께 실행하고 코드·메모리·콘솔·입력 조합으로 학습한다.

**Blocked by:** 01: 브라우저 컴파일과 시각화 후보 검증; 03: 독립 패널 배치와 브라우저 설정 복원

**Status:** resolved

- [x] 배열·포인터·할당/해제 예제의 실제 실행 데이터로 메모리를 표시한다.
- [x] 지원 C 문법과 엔진의 해석/컴파일 방식을 정확히 설명한다.
- [x] 선입력·출력·오류·추적 탐색·중지 및 재열기 초기화를 검증한다.

## Comments

- 2026-11-01 Claude: c-it(MIT, 바이트코드 컴파일 후 VM 해석) 워커. 선입력 scanf, 배열·포인터(`→ arr[1]`)·malloc/free(`heap#1`, 해제 표시)를 VM 실행 추적으로 표시, 단계 처음/다음 이동, 컴파일 오류, 단계 제한 중지, 실행 중 닫기 후 재열기 초기화를 e2e로 확인. 주소는 c-it 가상 주소임을 패널·문서에 명시.
- 2026-11-01 Claude (사용자 지시 반영): C 엔진을 c-it에서 Java-memory-visualizer의 JSCPP 2.0.9 추적기(struct·typedef·malloc/free·ILP32 논리 주소)와 TraceView 렌더러로 교체했다. c-it은 제거했다. 같은 회귀 예제(선입력·배열·포인터·malloc/free·컴파일 오류·중지·재열기)와 typedef struct 연결 리스트(malloc 3·free 3)를 실제 브라우저 e2e로 통과했다. 선입력 없이 scanf가 EOF를 만나면 원본과 같이 `Memory overflow` 오류로 끝난다.
