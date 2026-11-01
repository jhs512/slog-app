// 실험 한 번의 실행. 엔진마다 다른 실행 방식을 같은 RunSink 계약 뒤로 숨긴다.
// 모든 컴파일·실행은 브라우저 안(호스트 워커, sandbox iframe, iframe 안 워커)에서만 일어난다.
import type { LabDefinition, LabEngine } from "./lab";
import type { MemoryDoc } from "./memoryDoc";
import {
  CompileRequest,
  CompileResponse,
  CompileTarget,
  ConsoleEntry,
  Diagnostic,
  DomNode,
  RunStatus,
  SANDBOX_LIMITS,
  SandboxConfig,
  VdomNode,
  parseSandboxMessage,
} from "./protocol";

export interface RunSink {
  status(status: RunStatus): void;
  console(entry: ConsoleEntry): void;
  diagnostics(items: Diagnostic[]): void;
  dom(tree: DomNode, mutations: number): void;
  vdom(trees: VdomNode[], commits: number, renderer: string): void;
  memory(doc: MemoryDoc): void;
}

export interface RunRequest {
  lab: LabDefinition;
  source: string;
  input: string[];
  /** 렌더링 iframe 을 붙일 자리. 렌더링 패널이 닫혀 있어도 실행은 이 안에서 일어난다. */
  frameHost: HTMLElement;
}

/** 실행을 멈추고 실행 자원(iframe·워커·리스너)을 모두 정리한다. 여러 번 불러도 같다. */
export type StopRun = () => void;

const ASSET_DIR = "/code-lab/";
const assetUrl = (file: string) =>
  `${window.location.origin}${ASSET_DIR}${file}`;

// ─── 컴파일 워커 (Babel) ─────────────────────────────────
// 변환은 상태가 없으므로 워커 하나를 재사용한다. 오래된 응답은 id 로 버린다.

let compiler: Worker | null = null;
let nextCompileId = 1;
const pending = new Map<number, (response: CompileResponse) => void>();

const COMPILE_TIMEOUT_MS = 20_000;

const compileError = (id: number, message: string): CompileResponse => ({
  id,
  ok: false,
  diagnostics: [{ line: 1, col: 1, severity: "error", message }],
});

function resetCompiler(message: string) {
  for (const [id, resolve] of pending) resolve(compileError(id, message));
  pending.clear();
  compiler?.terminate();
  compiler = null;
}

function compile(
  target: CompileTarget,
  source: string,
  loopGuard: boolean,
): Promise<CompileResponse> {
  if (!compiler) {
    compiler = new Worker(assetUrl("compiler.js"), {
      name: "slog-code-lab-compiler",
    });
    compiler.onmessage = (event: MessageEvent<CompileResponse>) => {
      pending.get(event.data.id)?.(event.data);
      pending.delete(event.data.id);
    };
    compiler.onerror = (event) => {
      event.preventDefault();
      resetCompiler("컴파일러를 불러오지 못했습니다.");
    };
  }
  const request: CompileRequest = {
    id: nextCompileId++,
    target,
    source,
    loopGuard,
  };
  return new Promise((resolve) => {
    // 응답 없는 컴파일러가 이후 요청을 막지 않도록 시간이 지나면 새로 띄운다.
    const timer = window.setTimeout(
      () => resetCompiler("컴파일이 너무 오래 걸려 중단했습니다."),
      COMPILE_TIMEOUT_MS,
    );
    pending.set(request.id, (response) => {
      window.clearTimeout(timer);
      resolve(response);
    });
    compiler!.postMessage(request);
  });
}

// ─── sandbox iframe (HTML·JS·TS·React) ───────────────────

const FONT_CSS = () =>
  `@font-face{font-family:"Pretendard Variable";src:url("${assetUrl("PretendardVariable.woff2")}") format("woff2-variations");font-weight:45 920;font-display:swap}` +
  `html{font-family:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,system-ui,sans-serif}`;

function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

type SandboxEngine = Exclude<LabEngine, "c" | "cpp">;

const SANDBOX_ENGINES: Record<
  SandboxEngine,
  { target: CompileTarget; mode: SandboxConfig["mode"]; mainThread: boolean }
> = {
  html: { target: "html", mode: "html", mainThread: true },
  javascript: { target: "javascript", mode: "worker", mainThread: false },
  typescript: { target: "typescript", mode: "worker", mainThread: false },
  react: { target: "react", mode: "react", mainThread: true },
};

const KIT_SCRIPTS = { react: "react-19.js", tailwind: "tailwind-4.js" };

/** 사용자 코드의 네트워크 요청을 막는다. 런타임 자산과 이미지만 불러온다. */
const CSP = () =>
  [
    "default-src 'none'",
    `script-src 'unsafe-inline' 'unsafe-eval' ${window.location.origin}${ASSET_DIR}`,
    "style-src 'unsafe-inline'",
    `font-src ${window.location.origin}${ASSET_DIR}`,
    "img-src data: blob: https:",
    "media-src data: blob: https:",
    "worker-src blob:",
    "connect-src 'none'",
    "form-action 'none'",
  ].join("; ");

function sandboxDocument(
  config: SandboxConfig,
  scripts: string[],
  head: string,
  body: string,
): string {
  const tags = scripts
    .map((file) => `<script data-slog-lab src="${assetUrl(file)}"></script>`)
    .join("");
  return (
    `<!doctype html><meta charset="utf-8" data-slog-lab>` +
    `<meta http-equiv="Content-Security-Policy" content="${CSP()}" data-slog-lab>` +
    `<style data-slog-lab>${FONT_CSS()}</style>` +
    `<script data-slog-lab>window.__SLOG_LAB_CONFIG__=${inlineJson(config)}</script>` +
    `<script data-slog-lab src="${assetUrl("runtime.js")}"></script>${tags}${head}${body}`
  );
}

function stripDoctype(html: string): string {
  return html.replace(/^\s*<!doctype[^>]*>/i, "");
}

async function startSandbox(
  request: RunRequest,
  sink: RunSink,
  isStopped: () => boolean,
  onCleanup: (cleanup: () => void) => void,
) {
  const { lab, source, input, frameHost } = request;
  const engine = SANDBOX_ENGINES[lab.engine as SandboxEngine];
  const result = await compile(engine.target, source, engine.mainThread);
  if (isStopped()) return;
  if (!result.ok) {
    sink.diagnostics(result.diagnostics);
    sink.status({ phase: "error", message: "컴파일 오류" });
    return;
  }

  const token = crypto.randomUUID();
  const config: SandboxConfig = {
    token,
    hostOrigin: window.location.origin,
    mode: engine.mode,
    code: engine.mode === "html" ? "" : result.code,
    input,
    limits: SANDBOX_LIMITS,
  };
  let srcdoc: string;
  if (engine.mode === "html") {
    srcdoc = sandboxDocument(config, [], "", stripDoctype(result.code));
  } else if (lab.kit) {
    srcdoc = sandboxDocument(
      config,
      lab.kit.assets.map((asset) => KIT_SCRIPTS[asset]),
      `<style>${lab.kit.style}</style>`,
      lab.kit.body,
    );
  } else {
    srcdoc = sandboxDocument(config, [], "", "");
  }

  const iframe = document.createElement("iframe");
  // allow-same-origin 을 주지 않아 사용자 코드가 슬로그 쿠키·저장소·DOM 에 닿지 못한다.
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.title = "코드 실험 렌더링 화면";
  iframe.className = "code-lab-frame";
  iframe.srcdoc = srcdoc;

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow || event.origin !== "null")
      return;
    const message = parseSandboxMessage(event.data, token);
    if (!message) return;
    switch (message.type) {
      case "console":
        sink.console(message.entry);
        break;
      case "status":
        sink.status(message.status);
        break;
      case "dom":
        sink.dom(message.tree, message.mutations);
        break;
      case "vdom":
        sink.vdom(message.trees, message.commits, message.renderer);
        break;
    }
  };
  window.addEventListener("message", onMessage);
  onCleanup(() => {
    window.removeEventListener("message", onMessage);
    iframe.remove();
  });
  frameHost.replaceChildren(iframe);
}

// ─── C·C++ (Java-memory-visualizer 추적기) ─────────────────
// C 는 JSCPP 인터프리터, C++ 는 browsercc(Clang 20 + LLD → WASM32/WASI)로 실행한다.
// 사용자 코드는 JSCPP 가 해석하거나 WASI 가져오기만 받은 WASM 으로 돌아 JS·네트워크에 닿지 않는다.
// 시간 제한은 원본 language-runtime.js 와 같다. 실행마다 새 워커를 만들고 끝나면 종료한다.

const JMV_MAX_BYTES = 2 * 1024 * 1024;

const JMV_LIMITS = {
  loadMs: 120_000,
  c: 40_000,
  cpp: 60_000,
};

const JMV_SUMMARY: Record<string, string> = {
  ok: "정상 종료",
  uncaught_exception: "예외로 종료",
  step_limit: "단계 제한으로 중단",
};

function reportMemoryDoc(doc: MemoryDoc, sink: RunSink) {
  const diagnostics: Diagnostic[] = (doc.problems ?? []).map((problem) => ({
    line: problem.line,
    col: 1,
    message: problem.message,
    severity: problem.error ? "error" : "warning",
  }));
  if (diagnostics.length) sink.diagnostics(diagnostics);
  const last = doc.trace?.at(-1);
  if (last?.stdout) sink.console({ level: "log", text: last.stdout });
  const failure = last?.exception_msg ?? doc.message;
  if (doc.status !== "ok" && doc.status !== "compile_error" && failure) {
    sink.console({ level: "error", text: failure });
  }
  if (doc.traceStride && doc.traceStride > 1) {
    sink.console({
      level: "system",
      text: `반복 구간은 최대 ${doc.traceStride}단계 간격으로 기록했습니다 (전체 ${doc.traceTotalSteps}단계).`,
    });
  }
  sink.memory(doc);
  if (doc.status === "compile_error") {
    sink.status({ phase: "error", message: "컴파일 오류" });
    return;
  }
  const summary = JMV_SUMMARY[doc.status] ?? doc.status;
  sink.console({
    level: "system",
    text: `${summary} · ${doc.trace?.length ?? 0}단계`,
  });
  sink.status(
    doc.status === "ok"
      ? { phase: "done" }
      : doc.status === "step_limit"
        ? { phase: "stopped", message: summary }
        : { phase: "error", message: summary },
  );
}

function startMemoryVisualizer(
  request: RunRequest,
  language: "c" | "cpp",
  sink: RunSink,
  onCleanup: (cleanup: () => void) => void,
) {
  const stdin = request.input.length ? request.input.join("\n") + "\n" : "";
  // 원본 language-runtime.js 와 같은 코드+입력 크기 제한
  if (new TextEncoder().encode(request.source + stdin).length > JMV_MAX_BYTES) {
    sink.console({
      level: "error",
      text: "코드와 입력은 합쳐서 2MB까지 지원합니다.",
    });
    sink.status({ phase: "error", message: "크기 제한" });
    return;
  }
  const worker = new Worker(assetUrl("jmv/jmv-worker.js"), {
    type: "module",
    name: `slog-code-lab-${language}`,
  });
  let timer = 0;
  const finish = () => {
    window.clearTimeout(timer);
    worker.terminate();
  };
  const limit = (ms: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      finish();
      sink.console({
        level: "system",
        text: `실행 시간이 ${ms / 1000}초를 넘어 중지했습니다.`,
      });
      sink.status({ phase: "stopped", message: "시간 제한" });
    }, ms);
  };
  onCleanup(finish);
  sink.console({
    level: "system",
    text:
      language === "cpp"
        ? "C++ 컴파일러(Clang/WASM)를 준비합니다. 처음 실행할 때 약 30MB를 내려받습니다."
        : "C 인터프리터를 준비합니다.",
  });
  worker.onmessage = (
    event: MessageEvent<
      | { type: "ready" }
      | { type: "result"; doc: MemoryDoc }
      | { type: "error"; message: string }
    >,
  ) => {
    const message = event.data;
    if (message.type === "ready") {
      sink.status({ phase: "running" });
      limit(JMV_LIMITS[language]);
    } else if (message.type === "result") {
      finish();
      reportMemoryDoc(message.doc, sink);
    } else if (message.type === "error") {
      finish();
      sink.console({ level: "error", text: message.message });
      sink.status({ phase: "error", message: "실행 오류" });
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    finish();
    sink.status({
      phase: "error",
      message: "실행 엔진을 불러오지 못했습니다.",
    });
  };
  limit(JMV_LIMITS.loadMs);
  worker.postMessage({ language, source: request.source, stdin });
}

export function startRun(request: RunRequest, sink: RunSink): StopRun {
  let stopped = false;
  const cleanups: (() => void)[] = [];
  const onCleanup = (cleanup: () => void) => {
    if (stopped) cleanup();
    else cleanups.push(cleanup);
  };
  // 정리 이후에 도착한 결과는 버린다.
  const guarded: RunSink = {
    status: (s) => !stopped && sink.status(s),
    console: (e) => !stopped && sink.console(e),
    diagnostics: (d) => !stopped && sink.diagnostics(d),
    dom: (t, m) => !stopped && sink.dom(t, m),
    vdom: (t, c, r) => !stopped && sink.vdom(t, c, r),
    memory: (m) => !stopped && sink.memory(m),
  };

  guarded.status({ phase: "preparing" });
  if (request.lab.engine === "c" || request.lab.engine === "cpp") {
    startMemoryVisualizer(request, request.lab.engine, guarded, onCleanup);
  } else {
    startSandbox(request, guarded, () => stopped, onCleanup).catch((error) => {
      guarded.status({ phase: "error", message: String(error) });
    });
  }

  return () => {
    if (stopped) return;
    stopped = true;
    cleanups.splice(0).forEach((cleanup) => cleanup());
  };
}
