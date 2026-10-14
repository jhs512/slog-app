import { Marp } from "@marp-team/marp-core";
import { randomBytes } from "node:crypto";

import { MARP_MAX_LENGTH } from "./marpSource";

export interface RenderedMarp {
  html: string;
  css: string;
  count: number;
  width: number;
  height: number;
  nonce: string;
}

// 서버에서만 변환한다. 원문 HTML은 실행하지 않고 스타일은 iframe 안에 격리한다.
export function renderMarp(source: string): RenderedMarp {
  if (!source.trim() || source.length > MARP_MAX_LENGTH)
    throw new Error("Marp 문서는 20만 자 이내로 입력하세요.");
  const nonce = randomBytes(18).toString("base64url");
  const marp = new Marp({
    html: false,
    script: { source: "inline", nonce },
    math: "katex",
    emoji: { unicode: false, shortcode: false },
  });
  const result = marp.render(source.replace(/^\uFEFF/, ""));
  const count = result.comments.length;
  if (count > 200) throw new Error("Marp 문서는 200장 이내로 입력하세요.");
  const size = result.html.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return {
    html: result.html,
    css: result.css,
    nonce,
    count,
    width: Number(size?.[1] ?? 1280),
    height: Number(size?.[2] ?? 720),
  };
}
