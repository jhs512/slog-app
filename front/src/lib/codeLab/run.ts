// 실험 한 번의 실행. 엔진마다 다른 실행 방식을 같은 RunSink 계약 뒤로 숨긴다.
// 모든 컴파일·실행은 브라우저 안(호스트 워커, sandbox iframe, iframe 안 워커)에서만 일어난다.
import type { Diagnostic as CDiagnostic } from "../business/vendor/c-it/engine/diagnostics";
import type {
  DoneInfo,
  FromWorker,
  OutKind,
  ToWorker,
} from "../business/vendor/c-it/engine/protocol";
import { Timeline } from "../business/vendor/c-it/viewmodel/timeline";
import type { LabDefinition, LabEngine } from "./lab";
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

export interface MemoryTrace {
  timeline: Timeline;
  /** 추적이 추가될 때마다 늘어 화면 갱신 기준이 된다. */
  revision: number;
  finished: boolean;
}

export interface RunSink {
  status(status: RunStatus): void;
  console(entry: ConsoleEntry): void;
  diagnostics(items: Diagnostic[]): void;
  dom(tree: DomNode, mutations: number): void;
  vdom(trees: VdomNode[], commits: number, renderer: string): void;
  memory(trace: MemoryTrace): void;
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

type SandboxEngine = Exclude<LabEngine, "c">;

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

// ─── C (c-it 인터프리터) ────────────────────────────────

const C_WALL_MS = 15_000;

const OUTPUT_LEVELS: Record<OutKind, ConsoleEntry["level"]> = {
  out: "log",
  err: "error",
  in: "info",
  sys: "system",
};

function cDiagnostics(items: CDiagnostic[]): Diagnostic[] {
  return items
    .filter((item) => item.file === undefined || item.file === "main.c")
    .map((item) => ({
      line: item.line,
      col: item.col,
      message: item.message,
      severity: item.severity === "error" ? "error" : "warning",
    }));
}

function describeDone(done: DoneInfo): {
  entry: ConsoleEntry;
  status: RunStatus;
} {
  switch (done.reason) {
    case "exit":
      return {
        entry: {
          level: "system",
          text: `프로그램 종료 (종료 코드 ${done.exitCode ?? 0})`,
        },
        status: { phase: "done" },
      };
    case "error": {
      const error = done.error;
      const text = error
        ? `${error.line}행 실행 오류: ${error.message}`
        : "실행 오류";
      return {
        entry: { level: "error", text },
        status: { phase: "error", message: text },
      };
    }
    case "limit":
      return {
        entry: {
          level: "system",
          text: "실행 단계 제한을 넘어 중지했습니다. 무한 반복인지 확인하세요.",
        },
        status: { phase: "stopped", message: "실행 단계 제한" },
      };
    case "stopped":
      return {
        entry: { level: "system", text: "실행을 중지했습니다." },
        status: { phase: "stopped", message: "중지" },
      };
  }
}

function startC(
  request: RunRequest,
  sink: RunSink,
  onCleanup: (cleanup: () => void) => void,
) {
  // 실행마다 새 워커를 만들어 이전 실행의 메모리·입력이 남지 않게 한다.
  const worker = new Worker(assetUrl("c-worker.js"), {
    name: "slog-code-lab-c",
  });
  const timeline = new Timeline();
  const trace: MemoryTrace = { timeline, revision: 0, finished: false };
  const lines = [...request.input];
  const id = 1;
  const send = (message: ToWorker) => worker.postMessage(message);
  const finish = () => {
    window.clearTimeout(wall);
    worker.terminate();
  };
  const wall = window.setTimeout(() => {
    finish();
    trace.finished = true;
    sink.memory({ ...trace, revision: ++trace.revision });
    sink.console({
      level: "system",
      text: `실행 시간이 ${C_WALL_MS / 1000}초를 넘어 중지했습니다.`,
    });
    sink.status({ phase: "stopped", message: "시간 제한" });
  }, C_WALL_MS);
  onCleanup(finish);

  worker.onmessage = (event: MessageEvent<FromWorker>) => {
    const message = event.data;
    if (message.id !== id) return;
    switch (message.type) {
      case "diagnostics":
        sink.diagnostics(cDiagnostics(message.diagnostics));
        break;
      case "program":
        timeline.setProgram(message.program);
        sink.memory({ ...trace, revision: ++trace.revision });
        break;
      case "trace":
        timeline.addTypes(message.types);
        timeline.addSteps(message.steps);
        for (const step of message.steps) {
          for (const segment of step.out ?? []) {
            sink.console({
              level: OUTPUT_LEVELS[segment.k],
              text: segment.s,
            });
          }
        }
        sink.memory({ ...trace, revision: ++trace.revision });
        break;
      case "needInput":
        send({ type: "input", id, text: lines.length ? lines.shift()! : null });
        break;
      case "done": {
        finish();
        trace.finished = true;
        sink.memory({ ...trace, revision: ++trace.revision });
        if (message.done.error?.kind === "compile") {
          sink.status({ phase: "error", message: "컴파일 오류" });
          break;
        }
        const { entry, status } = describeDone(message.done);
        for (const leak of message.done.leaks) {
          sink.console({
            level: "warn",
            text: `해제하지 않은 메모리: ${leak.size}바이트 (${leak.line}행에서 할당)`,
          });
        }
        sink.console(entry);
        sink.status(status);
        break;
      }
      case "fatal":
        finish();
        sink.console({ level: "error", text: message.message });
        sink.status({ phase: "error", message: "C 엔진 오류" });
        break;
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    finish();
    sink.status({ phase: "error", message: "C 엔진을 불러오지 못했습니다." });
  };
  send({ type: "run", id, code: request.source });
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
  if (request.lab.engine === "c") {
    guarded.status({ phase: "running" });
    startC(request, guarded, onCleanup);
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
