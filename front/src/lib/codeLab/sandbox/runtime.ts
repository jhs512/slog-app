// 출처가 없는(null origin) sandbox iframe 안에서 실행된다. 사용자 코드보다 먼저 로드되어
// 콘솔·DOM·React Fiber 관찰값을 부모 창에 보낸다. public/code-lab/runtime.js 로 묶인다.
import {
  CHANNEL,
  ConsoleLevel,
  DomNode,
  SandboxConfig,
  SandboxMessage,
  VdomNode,
} from "../protocol";

declare global {
  interface Window {
    __SLOG_LAB_CONFIG__: SandboxConfig;
    __slogLoop: { start(): number; check(started: number, line: number): void };
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
    React?: unknown;
    ReactDOMClient?: {
      createRoot(
        el: Element,
        options?: Record<string, unknown>,
      ): { render(node: unknown): void };
    };
  }
}

const config = window.__SLOG_LAB_CONFIG__;
const { limits } = config;

function post(message: SandboxMessage) {
  window.parent.postMessage(
    { channel: CHANNEL, token: config.token, message },
    config.hostOrigin,
  );
}

/** 워커 안에서도 그대로 쓰도록 바깥 변수를 참조하지 않는다. */
function formatValue(value: unknown): string {
  const seen = new WeakSet<object>();
  const walk = (item: unknown, depth: number): string => {
    if (typeof item === "string")
      return depth === 0 ? item : JSON.stringify(item);
    if (typeof item === "function") return `ƒ ${item.name || "anonymous"}()`;
    if (typeof item === "bigint") return `${item}n`;
    if (typeof item === "symbol") return item.toString();
    if (item === null || typeof item !== "object") return String(item);
    if (item instanceof Error)
      return item.stack || `${item.name}: ${item.message}`;
    if (seen.has(item)) return "[Circular]";
    if (depth > 3) return Array.isArray(item) ? "[…]" : "{…}";
    seen.add(item);
    if (Array.isArray(item)) {
      return `[${item
        .slice(0, 50)
        .map((v) => walk(v, depth + 1))
        .join(", ")}${item.length > 50 ? ", …" : ""}]`;
    }
    if (typeof Node !== "undefined" && item instanceof Node) {
      return `<${item.nodeName.toLowerCase()}>`;
    }
    const entries = Object.entries(item).slice(0, 30);
    const name =
      item.constructor && item.constructor !== Object
        ? `${item.constructor.name} `
        : "";
    return `${name}{${entries.map(([k, v]) => `${k}: ${walk(v, depth + 1)}`).join(", ")}}`;
  };
  try {
    return walk(value, 0);
  } catch {
    return String(value);
  }
}

let consoleCount = 0;
function emitConsole(level: ConsoleLevel, text: string) {
  if (consoleCount > limits.consoleEntries) return;
  consoleCount++;
  if (consoleCount > limits.consoleEntries) {
    post({
      type: "console",
      entry: {
        level: "system",
        text: `출력이 ${limits.consoleEntries}개를 넘어 이후 출력은 생략합니다.`,
      },
    });
    return;
  }
  const clipped =
    text.length > limits.consoleChars
      ? `${text.slice(0, limits.consoleChars)}… (${text.length - limits.consoleChars}자 생략)`
      : text;
  post({ type: "console", entry: { level, text: clipped } });
}

function hookConsole() {
  const levels: ConsoleLevel[] = ["log", "info", "warn", "error"];
  for (const level of levels) {
    const original = console[level as "log"].bind(console);
    console[level as "log"] = (...args: unknown[]) => {
      emitConsole(level, args.map(formatValue).join(" "));
      original(...args);
    };
  }
  console.debug = console.log;
  window.addEventListener("error", (event) => {
    const where = event.lineno ? ` (${event.lineno}행)` : "";
    emitConsole("error", `${event.message}${where}`);
  });
  window.addEventListener("unhandledrejection", (event) => {
    emitConsole(
      "error",
      `처리되지 않은 Promise 거부: ${formatValue(event.reason)}`,
    );
  });
}

window.__slogLoop = {
  start: () => performance.now(),
  check(started, line) {
    if (performance.now() - started > limits.loopMs) {
      throw new RangeError(
        `${line}행 반복문이 ${limits.loopMs / 1000}초를 넘어 중단했습니다. 무한 반복인지 확인하세요.`,
      );
    }
  },
};

// ─── 실시간 DOM ──────────────────────────────────────────

function serializeDom(root: Element): DomNode {
  let budget = limits.domNodes;
  const visit = (node: Node, depth: number): DomNode | null => {
    if (budget <= 0) return null;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text.trim()) return null;
      budget--;
      return {
        t: "text",
        v: text.length > 200 ? `${text.slice(0, 200)}…` : text,
      };
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as Element;
    if (el.hasAttribute("data-slog-lab")) return null;
    budget--;
    const children: DomNode[] = [];
    if (depth < 60) {
      for (const child of el.childNodes) {
        const serialized = visit(child, depth + 1);
        if (serialized) children.push(serialized);
      }
    }
    return {
      t: "el",
      tag: el.tagName.toLowerCase(),
      attrs: [...el.attributes].map((a) => [a.name, a.value.slice(0, 300)]),
      c: children,
    };
  };
  return visit(root, 0) ?? { t: "el", tag: "html", attrs: [], c: [] };
}

function observeDom() {
  let mutations = 0;
  let timer: number | null = null;
  const flush = () => {
    timer = null;
    post({
      type: "dom",
      tree: serializeDom(document.documentElement),
      mutations,
    });
  };
  const schedule = () => {
    if (timer === null) timer = window.setTimeout(flush, 80);
  };
  new MutationObserver((records) => {
    mutations += records.length;
    schedule();
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  schedule();
}

// ─── React VDOM (Fiber) ──────────────────────────────────
// React DevTools 가 쓰는 전역 훅으로 커밋된 Fiber 루트를 받는다. Fiber 의 tag 번호와
// 훅 연결 리스트는 React 내부 구조이므로 킷이 고정한 React 19.2 에서만 보장한다.

interface Fiber {
  tag: number;
  type: unknown;
  memoizedProps: Record<string, unknown> | string | null;
  memoizedState: unknown;
  child: Fiber | null;
  sibling: Fiber | null;
}

const COMPONENT_TAGS = new Set([0, 1, 11, 14, 15]);
const HOST_TAGS = new Set([5, 26, 27]);

function fiberName(fiber: Fiber): string {
  const type = fiber.type as
    | string
    | {
        displayName?: string;
        name?: string;
        render?: { name?: string };
        type?: { name?: string };
      }
    | null;
  if (typeof type === "string") return type;
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return fn.displayName || fn.name || "Anonymous";
  }
  if (type && typeof type === "object") {
    return (
      type.displayName || type.render?.name || type.type?.name || "Anonymous"
    );
  }
  return "Anonymous";
}

function describeProps(props: Fiber["memoizedProps"]): string | undefined {
  if (!props || typeof props !== "object") return undefined;
  const parts = Object.entries(props)
    .filter(([key]) => key !== "children")
    .map(([key, value]) =>
      typeof value === "function"
        ? `${key}=ƒ`
        : `${key}=${formatValue(typeof value === "string" ? JSON.stringify(value) : value)}`,
    );
  return parts.length ? parts.join(" ").slice(0, 300) : undefined;
}

function hookStates(fiber: Fiber): string[] | undefined {
  if (fiber.tag === 1)
    return fiber.memoizedState ? [formatValue(fiber.memoizedState)] : undefined;
  const states: string[] = [];
  let hook = fiber.memoizedState as {
    memoizedState: unknown;
    queue: unknown;
    next: unknown;
  } | null;
  for (let i = 0; hook && i < 50; i++) {
    const queue = hook.queue as { dispatch?: unknown } | null;
    if (queue && typeof queue === "object" && "dispatch" in queue) {
      states.push(formatValue(hook.memoizedState));
    }
    hook = hook.next as typeof hook;
  }
  return states.length ? states : undefined;
}

function walkFiber(fiber: Fiber | null, budget: { n: number }): VdomNode[] {
  const nodes: VdomNode[] = [];
  for (
    let current = fiber;
    current && budget.n > 0;
    current = current.sibling
  ) {
    const children = walkFiber(current.child, budget);
    if (COMPONENT_TAGS.has(current.tag)) {
      budget.n--;
      nodes.push({
        kind: "component",
        name: fiberName(current),
        props: describeProps(current.memoizedProps),
        state: hookStates(current),
        c: children,
      });
    } else if (HOST_TAGS.has(current.tag)) {
      budget.n--;
      nodes.push({
        kind: "host",
        name: fiberName(current),
        props: describeProps(current.memoizedProps),
        c: children,
      });
    } else if (current.tag === 6) {
      budget.n--;
      nodes.push({
        kind: "text",
        name: String(current.memoizedProps ?? "").slice(0, 200),
        c: [],
      });
    } else {
      nodes.push(...children);
    }
  }
  return nodes;
}

function installReactHook() {
  const roots = new Set<{ current: Fiber }>();
  let commits = 0;
  let renderer = "React";
  let timer: number | null = null;
  const flush = () => {
    timer = null;
    const trees = [...roots].map((root) => ({
      kind: "other" as const,
      name: "Root",
      c: walkFiber(root.current.child, { n: limits.domNodes }),
    }));
    post({ type: "vdom", trees, commits, renderer });
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    isDisabled: false,
    renderers: new Map(),
    inject(internals: { version?: string; rendererPackageName?: string }) {
      renderer =
        `${internals.rendererPackageName ?? "react-dom"} ${internals.version ?? ""}`.trim();
      return 1;
    },
    checkDCE() {},
    onScheduleFiberRoot() {},
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onCommitFiberRoot(_id: number, root: { current: Fiber }) {
      roots.add(root);
      commits++;
      if (timer === null) timer = window.setTimeout(flush, 50);
    },
  };
}

// ─── 실행 모드 ───────────────────────────────────────────

const MODULES: Record<string, () => unknown> = {
  react: () => window.React,
  "react-dom/client": () => window.ReactDOMClient,
};

function runReact() {
  const commonjs = { exports: {} as Record<string, unknown> };
  const require = (name: string) => {
    const resolve = MODULES[name];
    if (!resolve) throw new Error(`스타터킷에 없는 모듈입니다: ${name}`);
    return resolve();
  };
  try {
    new Function("require", "module", "exports", "React", config.code)(
      require,
      commonjs,
      commonjs.exports,
      window.React,
    );
    const App = commonjs.exports.default ?? commonjs.exports.App;
    if (typeof App !== "function" && typeof App !== "object") {
      throw new Error("App 컴포넌트를 export default 로 내보내세요.");
    }
    const container = document.getElementById("root");
    if (!container || !window.ReactDOMClient || !window.React) {
      throw new Error("React 스타터킷을 불러오지 못했습니다.");
    }
    const React = window.React as { createElement(type: unknown): unknown };
    window.ReactDOMClient.createRoot(container, {
      onUncaughtError(error: unknown) {
        emitConsole("error", formatValue(error));
        post({
          type: "status",
          status: { phase: "error", message: "렌더링 중 오류가 발생했습니다." },
        });
      },
    }).render(React.createElement(App));
    post({ type: "status", status: { phase: "done" } });
  } catch (error) {
    emitConsole("error", formatValue(error));
    post({
      type: "status",
      status: {
        phase: "error",
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function workerSource(code: string, input: string[]): string {
  return `"use strict";
const __format = ${formatValue.toString()};
const __lines = ${JSON.stringify(input)};
let __next = 0;
self.prompt = () => (__next < __lines.length ? __lines[__next++] : null);
for (const level of ["log", "info", "warn", "error"]) {
  console[level] = (...args) => postMessage({ type: "console", level, text: args.map(__format).join(" ") });
}
console.debug = console.log;
self.addEventListener("unhandledrejection", (e) => postMessage({ type: "console", level: "error", text: "처리되지 않은 Promise 거부: " + __format(e.reason) }));
(async () => {
${code}
})().then(() => postMessage({ type: "done" }), (e) => postMessage({ type: "error", text: __format(e) }));
`;
}

function runWorker() {
  const url = URL.createObjectURL(
    new Blob([workerSource(config.code, config.input)], {
      type: "text/javascript",
    }),
  );
  const worker = new Worker(url);
  const timer = window.setTimeout(() => {
    worker.terminate();
    emitConsole(
      "system",
      `실행 시간이 ${limits.workerMs / 1000}초를 넘어 중지했습니다.`,
    );
    post({
      type: "status",
      status: { phase: "stopped", message: "시간 제한으로 중지" },
    });
  }, limits.workerMs);
  worker.onmessage = (
    event: MessageEvent<{ type: string; level?: ConsoleLevel; text?: string }>,
  ) => {
    const data = event.data;
    if (data.type === "console")
      emitConsole(data.level ?? "log", data.text ?? "");
    if (data.type === "done") {
      window.clearTimeout(timer);
      post({ type: "status", status: { phase: "done" } });
    }
    if (data.type === "error") {
      window.clearTimeout(timer);
      emitConsole("error", data.text ?? "");
      post({
        type: "status",
        status: { phase: "error", message: "실행 중 오류가 발생했습니다." },
      });
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    window.clearTimeout(timer);
    emitConsole("error", event.message);
    post({
      type: "status",
      status: { phase: "error", message: "실행 중 오류가 발생했습니다." },
    });
  };
}

hookConsole();
post({ type: "status", status: { phase: "running" } });
if (config.mode === "worker") {
  runWorker();
} else {
  if (config.mode === "react") installReactHook();
  observeDom();
  if (config.mode === "react") {
    document.addEventListener("DOMContentLoaded", runReact);
  } else {
    window.addEventListener("load", () =>
      post({ type: "status", status: { phase: "done" } }),
    );
  }
}
