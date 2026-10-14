import { post } from "./fixtures.mjs";

export const marpSource = `---
marp: true
theme: gaia
size: 4:3
paginate: true
---

# 한글 Marp 발표

기존 PPT와 함께 사용합니다.

---

## 이미지와 코드

![bg right:40%](/globe.svg)

\`\`\`javascript
const separator = "---";
/*
---
*/
console.log("Marp 코드");
\`\`\`

---

<!-- _backgroundColor: #123456 -->
<!-- _color: white -->

# 마지막 슬라이드

슬라이드 안의 HTML은 실행하지 않습니다.

<script>parent.alert("실행 금지")</script>`;

export const marpPost = {
  ...post,
  id: 5,
  title: "Marp 검증 문서",
  content: marpSource,
};

export const mixedPost = {
  ...post,
  id: 6,
  title: "PPT와 Marp 함께 쓰기",
  content: `앞 문단

[기존 PPT 링크](surl:ppt/old#2)

<details ppt-id="old">
<summary>기존 PPT</summary>
<div markdown="1">

---
marp: true
theme: default
---
# 기존 첫 슬라이드

---

# 기존 두 번째 슬라이드

</div>
</details>

<details marp-id="new">
<summary>새 Marp</summary>
<div markdown="1">

${marpSource}

</div>
</details>

뒤 문단`,
};

export const fencedMarpPost = {
  ...post,
  id: 7,
  title: "백틱 Marp 문서",
  content: `앞 문단\n\n\`\`\`marp\n${marpSource}\n\`\`\`\n\n중간 문단\n\n\`\`\`marp\n---\nmarp: true\ntheme: uncover\n---\n# 또 다른 Marp\n\`\`\`\n\n뒤 문단`,
};
