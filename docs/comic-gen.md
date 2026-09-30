# Markdown에서 만화 쓰기

코드 블록 언어를 `comic-gen`으로 지정하면 코드 대신 제목·첫 컷 썸네일 카드 하나가 표시됩니다. 카드를 누르면 만화 뷰어가 열립니다.

````markdown
```comic-gen
title: 요청과 응답
cast:
  web: {asset: server, label: 웹 서버}
  db: {asset: database, label: DB}
panels:
  - actors: [web, db]
    dialogue: [{from: web, to: db, text: "데이터를 부탁해!"}]
  - mode: before
    actors: [{id: db, expression: happy, holding: data}]
    dialogue: [{from: db, to: web, text: "찾았어!"}]
  - mode: before
    transfer: [{from: db, to: web, prop: data}]
  - mode: before
    actors: [{id: web, gesture: wave}]
    dialogue: [{from: web, text: "고마워!"}]
```
````

게시물·PPT 보기와 기본/VS CODE 편집기의 **미리보기**에서 같은 방식으로 렌더링됩니다. 미리보기는 저장하지 않은 본문도 반영합니다. 원문 저장·Raw 보기에는 YAML이 그대로 남습니다.

뷰어는 코믹젠 기본 원본 배치와 읽는 순서를 유지합니다. PC에서는 넓은 모달, 모바일에서는 전체 화면으로 표시하며 배경 본문은 가려집니다. 화면 너비 맞춤·원본 크기·150%/200% 확대와 가로·세로 스크롤을 지원합니다. Enter/Space로 열고, Tab으로 이동하며, 닫기 버튼 또는 Escape로 닫으면 카드로 초점이 돌아옵니다. 한 글에 여러 `comic-gen` 블록을 넣을 수 있습니다. `<details>` 안에서도 동작합니다. 문법 오류는 해당 블록에만 표시되며 다른 만화와 문단은 유지됩니다. 예제 문법 자체를 보여주려면 위처럼 바깥 펜스를 백틱 네 개로 감싸세요.

Comic Gen **v0.2.1** 공개 SDK를 버전 고정해 번들에 포함합니다. YAML 데이터만 해석하고 SVG를 이미지로 표시하므로 대사 속 HTML이나 JavaScript를 실행하지 않습니다. 최대 30컷, 입력 100,000자이며 임의 에셋 업로드는 지원하지 않습니다.

- [문법 가이드](https://jhs512.github.io/comic-gen/guide.html)
- [예제 갤러리](https://jhs512.github.io/comic-gen/gallery.html)
- [SDK 출처와 해시](../front/src/lib/business/vendor/README.md)

## 검증

`front/`에서 `pnpm exec playwright test --config playwright.rendering.config.ts`를 실행합니다. 포트 3007/8097에서 읽기 전용 고정 데이터를 사용하며 DB·계정·운영 글을 변경하지 않습니다. 게시물, 네 컷, 여러 블록, 오류 격리, 중첩 펜스, 접이식 영역, HTML 이스케이프, PC/모바일 카드·뷰어, 확대·스크롤·키보드·초점 복귀, 편집 중 오류 복구·삭제와 열린 뷰어 정리를 검증합니다.
