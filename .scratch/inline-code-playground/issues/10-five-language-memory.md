# 10: JavaScript·Python·Java·C·C++ 메모리 비주얼라이저 필수 지원

**What to build:** 사용자 최종 지시에 따라 다섯 언어를 모두 지원한다. 사용자가 운영하는 Java-memory-visualizer(`codex/cloudflare-sharing` 5762765)의 실행기·추적기·TraceView를 재사용해 슬로그 공통 팝업에 연결한다.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] Java(CheerpJ 공식 CDN + ECJ + ASM)·Python(Pyodide)·JavaScript(`js memory`)·C(JSCPP)·C++(browsercc)를 브라우저 안에서 컴파일·실행·추적한다. 서버 실행 없음.
- [ ] 선입력, 콘솔, 독립 메모리 패널, 수정 재실행, 중지, 재열기 초기화, 런타임 재사용 시 상태 누출 없음.
- [ ] 기존 `js run`·HTML·React 렌더링/DOM/VDOM 보존, 입력 없는 C scanf의 `Memory overflow`를 입력 부족으로 안내.
- [ ] 운영 테스트 글 14927에서 다섯 언어의 출력·시각화·선입력·재실행을 검증한다.
