# 10: JavaScript·Python·Java·C·C++ 메모리 비주얼라이저 필수 지원

**What to build:** 사용자 최종 지시에 따라 다섯 언어를 모두 지원한다. 사용자가 운영하는 Java-memory-visualizer(`codex/cloudflare-sharing` 5762765)의 실행기·추적기·TraceView를 재사용해 슬로그 공통 팝업에 연결한다.

**Blocked by:** 06, 07

**Status:** resolved

- [x] Java(CheerpJ 공식 CDN + ECJ + ASM)·Python(Pyodide)·JavaScript(`js memory`)·C(JSCPP)·C++(browsercc)를 브라우저 안에서 컴파일·실행·추적한다. 서버 실행 없음.
- [x] 선입력, 콘솔, 독립 메모리 패널, 수정 재실행, 중지, 재열기 초기화, 런타임 재사용 시 상태 누출 없음.
- [x] 기존 `js run`·HTML·React 렌더링/DOM/VDOM 보존, 입력 없는 C scanf의 `Memory overflow`를 입력 부족으로 안내.
- [x] 운영 테스트 글 14927에서 다섯 언어의 출력·시각화·선입력·재실행을 검증한다.

## Comments

- 2026-11-01 Claude: main 5496335 Vercel 배포 성공. 운영 테스트 글 14927(공개·목록 미노출, 다섯 언어 예제로 갱신, 다른 글 변경 없음)을 별도 headless Chromium으로 검증했다. JS 메모리 `민수 10 2`(첫 실행 2.3초), Python `민수 10 2`(2.5초), Java `5 10 [5, 6] runs=1`(첫 실행 23.3초, CheerpJ CDN), C 연결 리스트 `10 20 30`·malloc 3/free 3, C 선입력 없을 때 "입력 부족" 후 4 → `n=4 last=9`, C++ `11 10`·해제 표시. 모든 언어에서 메모리 패널 기대 항목 확인, 코드가 담긴 네트워크 요청 0건. 증거 `../evidence/production-5langs.json`, `prod-{js,python,java,cStruct,cInput,cpp}.png`. 로컬: code-lab e2e 20건(dev·운영 빌드), 전체 렌더링 회귀 63건, tsc·eslint 통과. 독립 리뷰 지적(같은 출처 폴백, 팝업 간 런타임 상태, 쿠키 문구·CSP, 메시지 검증, 캐시)은 반영했다.
