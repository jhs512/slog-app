import { StarterKitVersion, lookupKit } from "./kits";

export const PANEL_IDS = [
  "code",
  "render",
  "dom",
  "vdom",
  "memory",
  "console",
  "input",
] as const;
export type PanelId = (typeof PANEL_IDS)[number];

export const PANEL_LABELS: Record<PanelId, string> = {
  code: "코드",
  render: "렌더링",
  dom: "실시간 DOM",
  vdom: "React VDOM",
  memory: "메모리",
  console: "콘솔",
  input: "입력",
};

export type LabEngine =
  | "html"
  | "javascript"
  | "typescript"
  | "react"
  | "c"
  | "cpp"
  | "jsMemory"
  | "python"
  | "java";

/** 엔진별로 실제 데이터를 공급할 수 있는 패널만 노출한다. */
export const ENGINE_PANELS: Record<LabEngine, PanelId[]> = {
  html: ["code", "render", "dom", "console"],
  javascript: ["code", "console", "input"],
  typescript: ["code", "console", "input"],
  react: ["code", "render", "dom", "vdom", "console"],
  c: ["code", "memory", "console", "input"],
  cpp: ["code", "memory", "console", "input"],
  jsMemory: ["code", "memory", "console", "input"],
  python: ["code", "memory", "console", "input"],
  java: ["code", "memory", "console", "input"],
};

/** Java-memory-visualizer 실행기로 돌리는 엔진과 원본의 언어 이름 */
export const MEMORY_LANGUAGES = {
  c: "c",
  cpp: "cpp",
  jsMemory: "js",
  python: "python",
  java: "java",
} as const satisfies Partial<Record<LabEngine, string>>;

export type MemoryEngine = keyof typeof MEMORY_LANGUAGES;

export function isMemoryEngine(engine: LabEngine): engine is MemoryEngine {
  return engine in MEMORY_LANGUAGES;
}

export const ENGINE_TITLES: Record<LabEngine, string> = {
  html: "HTML",
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  c: "C",
  cpp: "C++",
  jsMemory: "JavaScript 메모리",
  python: "Python",
  java: "Java",
};

export interface LabDefinition {
  engine: LabEngine;
  /** Prism 하이라이트에 쓸 언어 */
  highlight: string;
  kit?: StarterKitVersion & { name: string; version: number };
  title: string;
}

export type FenceResult =
  | { kind: "runnable"; lab: LabDefinition }
  | { kind: "unsupported"; reason: string; highlight: string }
  | null;

const RUN_LANGUAGES: Record<string, { engine: LabEngine; highlight: string }> =
  {
    html: { engine: "html", highlight: "html" },
    js: { engine: "javascript", highlight: "javascript" },
    javascript: { engine: "javascript", highlight: "javascript" },
    ts: { engine: "typescript", highlight: "typescript" },
    typescript: { engine: "typescript", highlight: "typescript" },
    c: { engine: "c", highlight: "c" },
    cpp: { engine: "cpp", highlight: "cpp" },
    "c++": { engine: "cpp", highlight: "cpp" },
    cxx: { engine: "cpp", highlight: "cpp" },
    python: { engine: "python", highlight: "python" },
    py: { engine: "python", highlight: "python" },
    java: { engine: "java", highlight: "java" },
  };

/** `js memory`는 브라우저 실행(`js run`)과 달리 Java-memory-visualizer JS 추적기로 메모리를 기록한다. */
const MEMORY_MODE_LANGUAGES: Record<
  string,
  { engine: LabEngine; highlight: string }
> = {
  js: { engine: "jsMemory", highlight: "javascript" },
  javascript: { engine: "jsMemory", highlight: "javascript" },
};

/**
 * 작성자가 실행용으로 명시한 펜스만 실험으로 해석한다.
 * `c run`, `html run`처럼 언어 뒤에 `run`을 적거나 스타터킷 이름(`react-starter-1`)을 쓴다.
 * JavaScript 메모리 추적은 `js memory`로 쓴다.
 */
export function parseLabFence(info: string): FenceResult {
  const words = info.trim().split(/\s+/);
  const name = (words[0] ?? "").toLowerCase();
  if (!name) return null;

  const kit = lookupKit(name);
  if (kit?.ok) {
    return {
      kind: "runnable",
      lab: {
        engine: "react",
        highlight: "jsx",
        kit: { ...kit.kit, name: kit.name, version: kit.version },
        title: `${kit.kit.title} (${name})`,
      },
    };
  }
  if (kit) {
    return {
      kind: "unsupported",
      highlight: "jsx",
      reason: `스타터킷 ${kit.name}에는 버전 ${kit.version}이 없습니다. 사용 가능한 버전: ${kit.known.join(", ")}`,
    };
  }

  const modes = words.slice(1).map((word) => word.toLowerCase());
  const memoryMode = modes.includes("memory") && MEMORY_MODE_LANGUAGES[name];
  if (memoryMode) {
    return {
      kind: "runnable",
      lab: { ...memoryMode, title: ENGINE_TITLES[memoryMode.engine] },
    };
  }
  if (!modes.includes("run")) {
    return null;
  }
  const language = RUN_LANGUAGES[name];
  if (!language) {
    return {
      kind: "unsupported",
      highlight: name,
      reason: `${words[0]} 코드는 브라우저 실행을 지원하지 않습니다.`,
    };
  }
  return {
    kind: "runnable",
    lab: { ...language, title: ENGINE_TITLES[language.engine] },
  };
}
