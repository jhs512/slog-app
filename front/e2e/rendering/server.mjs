// 실제 저장/로그인 없이 SSR과 편집 화면에 동일한 고정 데이터를 제공한다.
import { createServer } from "node:http";

import { bilingualPost, post, speechPost, umlPost } from "./fixtures.mjs";

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3007");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Content-Type", "application/json");
  const path = new URL(req.url, "http://localhost:8097").pathname;
  if (path === "/post/api/v1/posts/1" && req.method === "GET") {
    res.end(JSON.stringify(post));
  } else if (path === "/post/api/v1/posts/2" && req.method === "GET") {
    res.end(JSON.stringify(bilingualPost));
  } else if (path === "/post/api/v1/posts/3" && req.method === "GET") {
    res.end(JSON.stringify(umlPost));
  } else if (path === "/post/api/v1/posts/4" && req.method === "GET") {
    res.end(JSON.stringify(speechPost));
  } else if (path === "/member/api/v1/auth/me") {
    res.end(
      JSON.stringify({
        id: 1,
        name: "렌더링 테스트",
        isAdmin: false,
        profileImageUrl: "",
        createdAt: post.createdAt,
        modifiedAt: post.modifiedAt,
      }),
    );
  } else if (path.endsWith("/comments")) {
    res.end("[]");
  } else {
    res.end(JSON.stringify({ resultCode: "200-1", msg: "테스트 응답" }));
  }
}).listen(8097, "127.0.0.1");
