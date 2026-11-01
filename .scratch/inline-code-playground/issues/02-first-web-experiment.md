# 02: 실행용 웹 블록에서 팝업 실험 완주

**What to build:** 실행용 HTML 블록을 누르면 격리된 팝업에서 원문이 실행되고 임시 수정과 수동 재실행을 할 수 있다.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] 일반 코드 블록에는 재생 버튼이 없다.
- [x] 팝업 최초 열기 한 번 실행, 수정 후 수동 실행, 닫고 재열기 초기화를 실제 문서에서 검증한다.
- [x] 렌더링과 콘솔을 각각 표시하고 원문을 저장하지 않는다.
- [x] 웹 렌더링만 Pretendard 기본 글꼴을 쓰며 작성 CSS로 덮어쓸 수 있다.

## Comments

- 2026-11-01 Claude: `html run` 블록만 재생 버튼(일반 `c` 블록 제외). 최초 자동 실행·수정 후 수동 실행·Escape 닫기 후 포커스 복귀·재열기 원문 초기화, 렌더링/콘솔 분리, 외부 요청 없음, Pretendard 기본·작성 CSS 우선·편집기 고정폭을 `front/e2e/rendering/code-lab.spec.ts`(dev·운영 빌드 모두 통과)로 확인.
