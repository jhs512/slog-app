import { parseDocument } from "yaml";

export const MARP_MAX_LENGTH = 200_000;

export function isMarpDocument(source: string): boolean {
  const header = source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!header || header[1].length > MARP_MAX_LENGTH) return false;
  try {
    const doc = parseDocument(header[1]);
    return doc.errors.length === 0 && doc.get("marp") === true;
  } catch {
    return false;
  }
}

export type MarpPart =
  | { kind: "markdown"; source: string }
  | { kind: "marp"; source: string; id: string; title: string };

// 코드 예제 안의 details는 실제 덱으로 취급하지 않는다.
function fenceRanges(source: string) {
  const ranges: {
    start: number;
    end: number;
    bodyStart: number;
    bodyEnd: number;
    language: string;
    closed: boolean;
  }[] = [];
  let offset = 0;
  let open:
    | {
        start: number;
        marker: string;
        bodyStart: number;
        language: string;
        innerMarker?: string;
      }
    | undefined;
  for (const line of source.split(/(?<=\n)/)) {
    if (open) {
      if (open.language === "marp") {
        if (open.innerMarker) {
          if (
            new RegExp(
              `^ {0,3}${open.innerMarker[0]}{${open.innerMarker.length},}[ \\t\\r\\n]*$`,
            ).test(line)
          )
            open.innerMarker = undefined;
          offset += line.length;
          continue;
        }
        const nested = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
        if (nested && nested[2].trim()) {
          open.innerMarker = nested[1];
          offset += line.length;
          continue;
        }
      }
      if (
        new RegExp(
          `^ {0,3}${open.marker[0]}{${open.marker.length},}[ \\t\\r\\n]*$`,
        ).test(line)
      ) {
        ranges.push({
          start: open.start,
          end: offset + line.length,
          bodyStart: open.bodyStart,
          bodyEnd: offset,
          language: open.language,
          closed: true,
        });
        open = undefined;
      }
    } else {
      const match = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
      if (match)
        open = {
          start: offset,
          marker: match[1],
          bodyStart: offset + line.length,
          language: match[2].trim().toLowerCase(),
        };
    }
    offset += line.length;
  }
  if (open)
    ranges.push({
      ...open,
      end: source.length,
      bodyEnd: source.length,
      closed: false,
    });
  return ranges;
}

export function getMarpParts(source: string): MarpPart[] {
  if (isMarpDocument(source)) {
    return [{ kind: "marp", id: "document", title: "Marp", source }];
  }
  const ranges = fenceRanges(source);
  const detailsRanges: [number, number][] = [];
  const decks: {
    start: number;
    end: number;
    part: Extract<MarpPart, { kind: "marp" }>;
  }[] = [];
  const parts: MarpPart[] = [];
  const tags = /<details\b[^>]*>|<\/details\s*>/gi;
  let depth = 0;
  let opening = { start: 0, end: 0, tag: "" };
  let cursor = 0;
  for (const match of source.matchAll(tags)) {
    const start = match.index!;
    if (ranges.some((range) => start >= range.start && start < range.end))
      continue;
    if (!/^<\//.test(match[0])) {
      if (depth === 0)
        opening = { start, end: start + match[0].length, tag: match[0] };
      depth++;
      continue;
    }
    if (depth === 0 || --depth !== 0) continue;
    detailsRanges.push([opening.start, start + match[0].length]);
    const id = opening.tag.match(/\smarp-id\s*=\s*["']([\w-]{1,64})["']/i)?.[1];
    if (!id) continue;
    const inner = source.slice(opening.end, start);
    const summary = inner.match(
      /^\s*<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/i,
    );
    if (!summary) continue;
    let markdown = inner.slice(summary[0].length).trim();
    markdown = markdown
      .replace(/^<div\s+markdown=["']1["']\s*>([\s\S]*)<\/div>\s*$/i, "$1")
      .trim();
    decks.push({
      start: opening.start,
      end: start + match[0].length,
      part: {
        kind: "marp",
        id,
        title: summary[1].replace(/<[^>]*>/g, "").trim() || "Marp",
        source: markdown,
      },
    });
  }
  const ids = new Set(decks.map((deck) => deck.part.id));
  let block = 1;
  for (const range of ranges) {
    if (
      range.language !== "marp" ||
      !range.closed ||
      detailsRanges.some(
        ([from, to]) => range.start >= from && range.start < to,
      )
    )
      continue;
    while (ids.has(`block-${block}`)) block++;
    const id = `block-${block}`;
    ids.add(id);
    decks.push({
      start: range.start,
      end: range.end,
      part: {
        kind: "marp",
        id,
        title: `Marp ${block++}`,
        source: source.slice(range.bodyStart, range.bodyEnd).trim(),
      },
    });
  }
  for (const deck of decks.sort((a, b) => a.start - b.start)) {
    if (deck.start > cursor)
      parts.push({
        kind: "markdown",
        source: source.slice(cursor, deck.start),
      });
    parts.push(deck.part);
    cursor = deck.end;
  }
  if (cursor < source.length)
    parts.push({ kind: "markdown", source: source.slice(cursor) });
  return parts;
}

export function getMarpDecks(source: string) {
  return getMarpParts(source).filter((part) => part.kind === "marp");
}

export const MARP_SAMPLE = `---
marp: true
theme: default
size: 16:9
paginate: true
---

# 발표 제목

한글과 Markdown으로 만드는 프레젠테이션

---

## 두 번째 슬라이드

- 첫 번째 이야기
- 두 번째 이야기

~~~javascript
console.log("Hello, Marp!");
~~~`;

export const MARP_BLOCK_SAMPLE = `\`\`\`marp\n${MARP_SAMPLE}\n\`\`\``;

export function appendMarpTemplate(source: string): string {
  if (!source.trim()) return MARP_BLOCK_SAMPLE;
  if (isMarpDocument(source))
    return `${source}\n\n---\n\n# 새 슬라이드\n\n내용을 입력하세요.\n`;
  return `${source}\n\n${MARP_BLOCK_SAMPLE}\n`;
}
