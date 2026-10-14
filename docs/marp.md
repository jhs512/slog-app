# Marp

## 사용법

상단 메뉴 **Marp**(모바일: 전체 메뉴 → **Marp 만들기**)에서 원문을 작성하고 **미리보기**, **Marp 발표 열기**를 누른다. 이 화면은 저장하지 않는다. 글에 보관하려면 원문을 글 본문에 넣는다.

글 편집 화면의 **Marp 추가**는 ` ```marp `로 여는 코드 블록을 삽입한다. 여는 줄은 백틱 세 개와 `marp`, 닫는 줄은 백틱 세 개다. 기본 에디터와 VS CODE 모두 **미리보기**를 지원한다. 저장된 글의 **Marp 보기** 또는 미리보기의 **Marp 발표 열기**로 발표한다.

````markdown
```marp
---
marp: true
theme: default
size: 16:9
paginate: true
---

# 발표 제목

첫 번째 슬라이드

---

## 두 번째 슬라이드

- Markdown 목록
- 코드, 이미지도 사용 가능
```
````

블록 안에 일반 코드 예제를 넣을 때는 `~~~javascript`와 `~~~`를 쓰면 바깥 펜스와 쉽게 구분된다. 언어 이름이 있는 내부 백틱 코드 펜스도 보존한다. 한 글에 여러 Marp 코드 블록을 넣으면 각각 독립된 덱이 된다. 문서 앞의 `marp: true` frontmatter로 글 전체를 Marp 문서로 만드는 Marp 표준 입력 방식도 지원하며, 이 경우 편집 화면의 **슬라이드 추가**로 새 장을 붙인다.

공식 테마 `default`, `gaia`, `uncover`, 크기 `16:9`·`4:3`, 슬라이드 구분선 `---`, 코드 강조, 배경/이미지 지시문을 지원한다. 발표 중 이전/다음 버튼, 방향키, PageUp/PageDown, Home/End, 전체 화면을 사용할 수 있다. `#2`처럼 슬라이드 번호를 URL에 붙여 공유한다.

## 한 글에 PPT와 Marp 함께 넣기

기존 `<details ppt-id="...">`, `/p/{id}/ppt/{pptId}`, `surl:ppt/...`는 그대로 동작한다. 기존 PPT 안에 있던 `marp` 헤더도 기존 방식으로 처리한다. 보통은 위의 Marp 코드 블록을 사용하고, 고정 식별자가 필요하면 별도 `marp-id`를 사용할 수 있다.

```markdown
<details marp-id="intro">
<summary>Marp 소개</summary>

---
marp: true
theme: gaia
size: 4:3
---

# 소개

---

# 다음 슬라이드

</details>
```

`marp-id`는 한 글에서 고유한 영문·숫자·밑줄·하이픈 1~64자다. 기존 방식의 `<div markdown="1">` 래퍼도 사용할 수 있다. 코드 예제 펜스 안의 블록은 발표 문서로 인식하지 않는다.

글 전체의 Marp 문서: `/p/{id}/marp/document`. 코드 블록 덱은 등장 순서에 따라 `/p/{id}/marp/block-1`, `block-2` 등으로 열린다. 고정 식별자가 필요하면 위의 `marp-id` 형식을 사용한다. `/p/{id}/marp`는 덱 하나면 바로 열고 여러 개면 선택 목록을 보여준다. 미리보기는 현재 수정한 원문을 표시하고, 저장된 글의 발표 링크는 마지막 저장본을 연다.

## 렌더링과 제한

`@marp-team/marp-core` 4.4.0을 서버에서 사용한다. PDF/PPTX 내보내기는 이번 지원 범위에 포함하지 않는다. 문서당 20만 자·200장까지 렌더링한다. 임의 HTML 스크립트는 실행하지 않는다. 공식 브라우저 보조 코드만 nonce를 가진 CSP와 별도 origin의 sandbox iframe에서 실행해 코드 자동 축소와 Safari SVG 보정을 적용한다. 작성한 스타일은 슬라이드 프레임에만 영향을 준다.

VS CODE가 생성하는 글 설정은 `$$config` 블록으로 분리한다. 기존 ` ```yml ` 글 설정도 계속 읽되 `marp:`가 있는 블록과 일반 yml 예제는 본문으로 보존한다. 설정 헤더 없이 Marp 문서만 붙여 넣으면 기존 글의 제목·공개·목록 상태를 유지한다.

## 검증

`front/`에서 `pnpm exec playwright test --config playwright.rendering.config.ts e2e/rendering/marp.spec.ts`. 실제 광고·저장·로그인 없이 읽기 전용 fixture와 모의 저장 요청을 사용한다. 전체 렌더링 회귀는 동일한 명령에서 파일 이름을 생략한다.

운영 빌드 검사: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8097`로 `pnpm build` 후 `PLAYWRIGHT_RENDERING_PRODUCTION=1`을 지정해 같은 Marp 검사를 실행한다. 개발 서버와 달리 빌드된 `/api/marp`와 발표 경로를 검증한다.

2026-10-15 검증: 운영 빌드의 전체 렌더링 검사 43개 통과(Marp 9개·기존 PPT 재생·만화·읽어주기 포함). PC/모바일 이미지 로딩·4:3 배치·코드 강조·키보드·전체 화면·저장 원문 보존을 확인했다. TypeScript, ESLint, 변경 파일 포맷 검사, 캐시 없는 Docker CI 빌드도 통과했다.

## 공식 문서

- [Marp Core v4: 렌더러·테마·크기·코드 자동 축소](https://github.com/marp-team/marp-core/blob/v4/README.md)
- [Marpit 지시문과 frontmatter](https://marpit.marp.app/directives)
- [Marpit 이미지 문법](https://marpit.marp.app/image-syntax)
