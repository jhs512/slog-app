export interface PostEditorConfig {
  title: string;
  published: boolean;
  listed: boolean;
}

// 글 설정만 분리한다. Marp frontmatter와 일반 yml 예제는 본문 그대로 보존한다.
export function parsePostEditorContent(
  source: string,
  fallback: PostEditorConfig = { title: "", published: false, listed: false },
) {
  const match = source.match(
    /^(?:\$\$config\s*\r?\n([\s\S]*?)\r?\n\$\$|```yml\s*\r?\n([\s\S]*?)\r?\n```)(?:\r?\n|$)/,
  );
  const header = match?.[1] ?? match?.[2];
  if (
    !match ||
    !header ||
    /^marp\s*:/m.test(header) ||
    (!match[1] && !/^(published|listed)\s*:/m.test(header))
  ) {
    return { ...fallback, content: source.trim() };
  }
  const config = { ...fallback };
  for (const line of header.split(/\r?\n/)) {
    const field = line.match(/^(title|published|listed):\s*(.*)$/);
    if (!field) continue;
    if (field[1] === "title") {
      try {
        const parsed = JSON.parse(field[2]);
        config.title = typeof parsed === "string" ? parsed : field[2];
      } catch {
        config.title = field[2];
      }
    } else {
      config[field[1] as "published" | "listed"] = field[2] === "true";
    }
  }
  return { ...config, content: source.slice(match[0].length).trim() };
}

export function withPostEditorConfig(
  config: PostEditorConfig,
  content: string,
) {
  return `$$config\ntitle: ${JSON.stringify(config.title)}\npublished: ${config.published}\nlisted: ${config.listed}\n$$\n\n${content}`;
}
