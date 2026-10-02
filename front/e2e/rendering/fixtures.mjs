export const source = `title: 요청과 응답
cast:
  web: {asset: server, label: 웹 서버}
  db: {asset: database, label: DB}
panels:
  - actors: [web, db]
    dialogue: [{from: web, to: db, text: '데이터를 부탁해! <script>alert(1)</script>'}]
  - mode: before
    actors: [{id: db, expression: happy, holding: data}]
    dialogue: [{from: db, to: web, text: '찾았어!'}]
  - mode: before
    transfer: [{from: db, to: web, prop: data}]
  - mode: before
    actors: [{id: web, gesture: wave}]
    dialogue: [{from: web, text: '고마워!'}]`;
export const fence = (code, language = "comic-gen") =>
  `\`\`\`${language}\n${code}\n\`\`\``;
export const content = [
  "앞 문단",
  fence(source),
  fence(source.replace("요청과 응답", "다른 만화")),
  fence("cast: [잘못된 입력"),
  fence("cast: {}\npanels: [{actors: [missing]}]"),
  "<details>\n<summary>안쪽 만화</summary>",
  "",
  fence(source),
  "",
  "</details>",
  "````markdown",
  fence(source),
  "````",
  fence("<s>코드 문자열</s>", "text"),
  "뒤 문단",
].join("\n\n");

export const post = {
  id: 1,
  title: "Comic Gen 렌더링 검증",
  content,
  createdAt: "2026-10-01T00:00:00",
  modifiedAt: "2026-10-01T00:00:00",
  authorId: 1,
  authorName: "렌더링 테스트",
  authorProfileImgUrl: "",
  published: true,
  listed: false,
  hitCount: 0,
  likesCount: 0,
  commentsCount: 0,
  actorHasLiked: false,
  actorCanModify: true,
  actorCanDelete: true,
};

// 영어 fixture와 식별자·대사·상태가 같은 한글 문법. 문자열 내용은 치환하지 않는다.
export const koreanSource = `제목: 요청과 응답
등장인물:
  web: {그림: 서버, 이름표: 웹 서버}
  db: {그림: 데이터베이스, 이름표: DB}
컷:
  - 인물: [web, db]
    대사: [{화자: web, 상대: db, 내용: '데이터를 부탁해! <script>alert(1)</script>'}]
  - 구성: 이전
    인물: [{식별자: db, 표정: 기쁨, 든소품: 데이터}]
    대사: [{화자: db, 상대: web, 내용: '찾았어!'}]
  - 구성: 이전
    전달: [{주는인물: db, 받는인물: web, 소품: 데이터}]
  - 구성: 이전
    인물: [{식별자: web, 손모양: 인사손}]
    대사: [{화자: web, 내용: '고마워!'}]`;

export const bilingualPost = {
  ...post,
  id: 2,
  content: [fence(source), fence(koreanSource)].join("\n\n"),
};

export const umlSource = `제목: UML 설명
등장인물:
  teacher: {그림: 서버, 이름표: 선생님}
  student: {그림: 클라이언트, 이름표: 학생}
컷:
  - 인물: [teacher, student]
    대사: [{화자: teacher, 상대: student, 내용: 회원 한 명이 여러 주문을 만들어요.}]
    다이어그램:
      종류: 머메이드
      제목: 회원과 주문
      원문: |-
        classDiagram
          Member "1" --> "many" Order
          Member : +String name
          Order : +int amount
  - 구성: 이전
    대사: [{화자: student, 상대: teacher, 내용: 요청과 응답 순서도 이해했어요.}]
    다이어그램:
      종류: 머메이드
      제목: 요청 순서
      높이: 450
      원문: |-
        sequenceDiagram
          participant Client as 방문자
          participant Server as 서버
          Client->>Server: 요청
          Server-->>Client: 응답`;
export const umlPost = { ...post, id: 3, content: fence(umlSource) };

export const speechPost = {
  ...post,
  id: 4,
  title: "읽어주기 검증",
  content: [
    "## 읽기 제목",
    "첫 문장입니다. API와 DB를 설명합니다. 마지막 문장입니다.",
    "연산은 2²과 3 × 4입니다. [설명 링크](https://example.com)를 읽습니다.",
    fence("console.log('코드는 읽지 않음');", "javascript"),
    fence(source),
    "<details>\n<summary>접힌 설명</summary>\n\n접힌 문장은 읽지 않습니다.\n\n</details>",
    "<span hidden>숨겨진 정보</span>",
    '<span aria-hidden="true">보조 UI 정보</span>',
    "| 항목 | 설명 |\n| --- | --- |\n| 한국어 | 표의 내용을 읽습니다. |",
    '<figure><img alt="이미지 설명" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E"><figcaption>이미지 설명 캡션</figcaption></figure>',
    "본문 끝 문장입니다.",
  ].join("\n\n"),
};

export const umlEnglishSource = umlSource
  .replaceAll("제목:", "title:")
  .replaceAll("등장인물:", "cast:")
  .replaceAll("그림: 서버", "asset: server")
  .replaceAll("그림: 클라이언트", "asset: client")
  .replaceAll("이름표:", "label:")
  .replaceAll("컷:", "panels:")
  .replaceAll("인물:", "actors:")
  .replaceAll("대사:", "dialogue:")
  .replaceAll("화자:", "from:")
  .replaceAll("상대:", "to:")
  .replaceAll("내용:", "text:")
  .replaceAll("다이어그램:", "diagram:")
  .replaceAll("종류: 머메이드", "type: mermaid")
  .replaceAll("원문:", "source:")
  .replaceAll("높이:", "height:")
  .replaceAll("구성: 이전", "mode: before");
