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
