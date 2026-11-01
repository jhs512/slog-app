// 실행 샌드박스(iframe)·컴파일 워커와 작업 공간 사이의 메시지 형태.
// 샌드박스 쪽 메시지는 사용자 코드가 위조할 수 있으므로 호스트에서 다시 검증한다.

export const CHANNEL = "slog-code-lab";

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "system";

export interface ConsoleEntry {
  level: ConsoleLevel;
  text: string;
}

export interface Diagnostic {
  line: number;
  col: number;
  message: string;
  severity: "error" | "warning";
}

export type DomNode =
  | { t: "el"; tag: string; attrs: [string, string][]; c: DomNode[] }
  | { t: "text"; v: string };

/** React Fiber에서 읽은 트리. 실제 DOM 복사본이 아니다. */
export interface VdomNode {
  kind: "component" | "host" | "text" | "other";
  name: string;
  props?: string;
  /** useState/useReducer 훅의 현재 값 */
  state?: string[];
  c: VdomNode[];
}

export type RunStatus =
  | { phase: "preparing" }
  | { phase: "running" }
  | { phase: "done" }
  | { phase: "error"; message: string }
  | { phase: "stopped"; message: string };

export type SandboxMessage =
  | { type: "console"; entry: ConsoleEntry }
  | { type: "status"; status: RunStatus }
  | { type: "dom"; tree: DomNode; mutations: number }
  | { type: "vdom"; trees: VdomNode[]; commits: number; renderer: string };

export interface SandboxEnvelope {
  channel: typeof CHANNEL;
  token: string;
  message: SandboxMessage;
}

export interface SandboxConfig {
  token: string;
  hostOrigin: string;
  mode: "html" | "worker" | "react";
  /** 변환된 실행 코드. html 모드에서는 문서 자체가 코드이므로 비어 있다. */
  code: string;
  input: string[];
  limits: SandboxLimits;
}

export interface SandboxLimits {
  consoleEntries: number;
  consoleChars: number;
  domNodes: number;
  loopMs: number;
  workerMs: number;
}

export const SANDBOX_LIMITS: SandboxLimits = {
  consoleEntries: 500,
  consoleChars: 4000,
  domNodes: 2000,
  loopMs: 1500,
  workerMs: 8000,
};

export type CompileTarget = "html" | "javascript" | "typescript" | "react";

export interface CompileRequest {
  id: number;
  target: CompileTarget;
  source: string;
  /** iframe 메인 스레드에서 도는 코드에만 무한 반복 방지를 넣는다. */
  loopGuard: boolean;
}

export type CompileResponse =
  | { id: number; ok: true; code: string }
  | { id: number; ok: false; diagnostics: Diagnostic[] };

const PHASES = ["preparing", "running", "done", "error", "stopped"];
const LEVELS = ["log", "info", "warn", "error", "system"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDomNode(value: unknown, depth = 0): value is DomNode {
  if (!isObject(value) || depth > 64) return false;
  if (value.t === "text") return typeof value.v === "string";
  return (
    value.t === "el" &&
    typeof value.tag === "string" &&
    Array.isArray(value.attrs) &&
    value.attrs.every(
      (pair) =>
        Array.isArray(pair) &&
        typeof pair[0] === "string" &&
        typeof pair[1] === "string",
    ) &&
    Array.isArray(value.c) &&
    value.c.every((child) => isDomNode(child, depth + 1))
  );
}

function isVdomNode(value: unknown, depth = 0): value is VdomNode {
  return (
    isObject(value) &&
    depth <= 128 &&
    typeof value.kind === "string" &&
    ["component", "host", "text", "other"].includes(value.kind) &&
    typeof value.name === "string" &&
    (value.props === undefined || typeof value.props === "string") &&
    (value.state === undefined ||
      (Array.isArray(value.state) &&
        value.state.every((item) => typeof item === "string"))) &&
    Array.isArray(value.c) &&
    value.c.every((child) => isVdomNode(child, depth + 1))
  );
}

/** 현재 실행의 토큰과 형태가 맞는 메시지만 통과시킨다. */
export function parseSandboxMessage(
  data: unknown,
  token: string,
): SandboxMessage | null {
  if (!isObject(data) || data.channel !== CHANNEL || data.token !== token) {
    return null;
  }
  const message = data.message;
  if (!isObject(message)) return null;
  switch (message.type) {
    case "console": {
      const entry = message.entry;
      if (
        isObject(entry) &&
        typeof entry.level === "string" &&
        LEVELS.includes(entry.level) &&
        typeof entry.text === "string"
      ) {
        return {
          type: "console",
          entry: { level: entry.level as ConsoleLevel, text: entry.text },
        };
      }
      return null;
    }
    case "status": {
      const status = message.status;
      if (
        !isObject(status) ||
        typeof status.phase !== "string" ||
        !PHASES.includes(status.phase)
      ) {
        return null;
      }
      const text = typeof status.message === "string" ? status.message : "";
      if (status.phase === "error" || status.phase === "stopped") {
        return {
          type: "status",
          status: { phase: status.phase, message: text },
        };
      }
      return {
        type: "status",
        status: { phase: status.phase as "preparing" | "running" | "done" },
      };
    }
    case "dom":
      return isDomNode(message.tree) && typeof message.mutations === "number"
        ? { type: "dom", tree: message.tree, mutations: message.mutations }
        : null;
    case "vdom":
      return Array.isArray(message.trees) &&
        message.trees.every((tree) => isVdomNode(tree)) &&
        typeof message.commits === "number" &&
        typeof message.renderer === "string"
        ? {
            type: "vdom",
            trees: message.trees,
            commits: message.commits,
            renderer: message.renderer,
          }
        : null;
    default:
      return null;
  }
}
