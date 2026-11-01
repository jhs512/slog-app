// C·C++·Python·Java·JavaScript(메모리) 실행. 사용자가 운영하는 Java-memory-visualizer 의
// language-runtime.js·runtime.js 를 그대로 띄운 실행기 iframe 에 실행 요청만 보낸다.
//
// 실행기는 슬로그와 다른 사이트(운영: Vercel 기본 도메인, 개발: localhost↔127.0.0.1)에서 연다.
// Python·JS 는 Worker 안에서, Java 는 CheerpJ 가 사용자 코드를 실행하므로 같은 출처에 두면
// 독자의 슬로그 쿠키로 API 를 부를 수 있다. 다른 사이트이면 쿠키와 CORS 가 모두 막힌다.
// CheerpJ 는 출처 없는(sandbox) 문서 안에서 동작하지 않아 실제 출처가 있는 iframe 을 쓴다.
import { MEMORY_LANGUAGES, type MemoryEngine } from "./lab";
import type { MemoryDoc } from "./memoryDoc";
import type { Diagnostic } from "./protocol";
import type { RunRequest, RunSink } from "./run";

const CHANNEL = "slog-jmv-runner";
const MAX_BYTES = 2 * 1024 * 1024;
/** 원본 language-runtime.js 가 언어별 시간 제한을 두지만 Java 는 제한이 없어 부팅까지 넉넉히 기다린다. */
const JAVA_LIMIT_MS = 10 * 60_000;
const RUNNER_READY_MS = 60_000;

const PRODUCTION_RUNNER = "https://slog-2026-02-15.vercel.app";

/** 실행기 주소. 슬로그와 같은 출처가 되면 격리가 없으므로 null 을 돌려 실행을 거부한다. */
export function runnerOrigin(
  location: Location = window.location,
): string | null {
  const configured = process.env.NEXT_PUBLIC_CODE_LAB_RUNNER_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");
  const { protocol, hostname, port } = location;
  const suffix = port ? `:${port}` : "";
  if (hostname === "www.slog.gg" || hostname === "slog.gg") {
    return PRODUCTION_RUNNER;
  }
  if (hostname === "localhost") return `${protocol}//127.0.0.1${suffix}`;
  if (hostname === "127.0.0.1") return `${protocol}//localhost${suffix}`;
  return null;
}

type RunnerMessage =
  | { type: "ready" }
  | { type: "status"; id: number; text: string }
  | { type: "result"; id: number; doc: MemoryDoc }
  | { type: "error"; id: number; message: string };

interface Runner {
  frame: HTMLIFrameElement;
  origin: string;
  ready: Promise<void>;
  listeners: Set<(message: RunnerMessage) => void>;
  dispose(): void;
}

let runner: Runner | null = null;
let nextId = 1;

function parseRunnerMessage(data: unknown): RunnerMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const message = data as Record<string, unknown>;
  if (message.channel !== CHANNEL) return null;
  if (message.type === "ready") return { type: "ready" };
  if (typeof message.id !== "number") return null;
  if (message.type === "status" && typeof message.text === "string") {
    return { type: "status", id: message.id, text: message.text };
  }
  if (message.type === "error" && typeof message.message === "string") {
    return { type: "error", id: message.id, message: message.message };
  }
  const doc = message.doc as Record<string, unknown> | null;
  if (
    message.type === "result" &&
    typeof doc === "object" &&
    doc !== null &&
    typeof doc.status === "string" &&
    typeof doc.code === "string" &&
    Array.isArray(doc.trace) &&
    (doc.problems === undefined || Array.isArray(doc.problems))
  ) {
    return { type: "result", id: message.id, doc: doc as unknown as MemoryDoc };
  }
  return null;
}

/**
 * 팝업 하나가 열려 있는 동안 실행기 하나를 띄워 두고 다시 실행할 때 재사용한다(Python·JVM 예열).
 * 원본은 C·Python·JS Worker 를 실행 뒤에도 살려 두므로, 다른 글·블록의 코드가 남긴 상태가
 * 이어지지 않게 팝업을 닫을 때 버린다. 중지하면 Java 를 끊기 위해서도 버린다.
 */
function ensureRunner(origin: string): Runner {
  if (runner) return runner;
  const frame = document.createElement("iframe");
  // 다른 사이트이므로 allow-same-origin 은 실행기 자신의 출처를 유지할 뿐 슬로그 출처를 주지 않는다.
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.title = "코드 실험 실행기";
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;visibility:hidden;";
  frame.src = `${origin}/code-lab/jmv/runner.html?host=${encodeURIComponent(window.location.origin)}`;
  const listeners = new Set<(message: RunnerMessage) => void>();
  let resolveReady = () => {};
  const ready = new Promise<void>((resolve) => (resolveReady = resolve));
  const onMessage = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow || event.origin !== origin) return;
    const message = parseRunnerMessage(event.data);
    if (!message) return;
    if (message.type === "ready") resolveReady();
    listeners.forEach((listener) => listener(message));
  };
  window.addEventListener("message", onMessage);
  document.body.append(frame);
  const created: Runner = {
    frame,
    origin,
    ready,
    listeners,
    dispose() {
      window.removeEventListener("message", onMessage);
      frame.remove();
      if (runner === created) runner = null;
    },
  };
  runner = created;
  return created;
}

const SUMMARY: Record<string, string> = {
  ok: "정상 종료",
  uncaught_exception: "예외로 종료",
  step_limit: "단계 제한으로 중단",
};

const INPUT_CALL = /\b(scanf|getchar|getc|fgets|gets|fscanf)\s*\(/;

/**
 * 원본 JSCPP 경로는 선입력이 모자라 scanf 가 EOF 를 만나면 `Memory overflow` 로 멈춘다.
 * 그 줄이 입력 함수를 부르면 입력 부족으로 알려 준다.
 */
export function inputShortage(doc: MemoryDoc): string | null {
  if (doc.language !== "c" || doc.status !== "uncaught_exception") return null;
  const message = doc.message ?? doc.trace?.at(-1)?.exception_msg ?? "";
  const match = message.match(/^(\d+):\d+\s+Memory overflow/);
  if (!match) return null;
  const line = Number(match[1]);
  const call = doc.code?.split("\n")[line - 1]?.match(INPUT_CALL)?.[1];
  if (!call) return null;
  return `${line}행 ${call}가 읽을 입력이 없습니다. 입력 패널에 값을 적고 다시 실행하세요.`;
}

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
  const shortage = inputShortage(doc);
  const failure = last?.exception_msg ?? doc.message;
  if (shortage) {
    sink.console({ level: "error", text: `입력 부족: ${shortage}` });
  } else if (doc.status !== "ok" && doc.status !== "compile_error" && failure) {
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
  const summary = shortage ? "입력 부족" : (SUMMARY[doc.status] ?? doc.status);
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

export function startMemoryRun(
  request: RunRequest,
  engine: MemoryEngine,
  sink: RunSink,
  onCleanup: (cleanup: () => void) => void,
) {
  const language = MEMORY_LANGUAGES[engine];
  const stdin = request.input.length ? request.input.join("\n") + "\n" : "";
  // 원본 language-runtime.js 와 같은 코드+입력 크기 제한
  if (new TextEncoder().encode(request.source + stdin).length > MAX_BYTES) {
    sink.console({
      level: "error",
      text: "코드와 입력은 합쳐서 2MB까지 지원합니다.",
    });
    sink.status({ phase: "error", message: "크기 제한" });
    return;
  }
  const origin = runnerOrigin();
  if (!origin) {
    sink.console({
      level: "error",
      text: "이 주소에서는 격리된 실행기 주소를 정할 수 없어 실행하지 않습니다. NEXT_PUBLIC_CODE_LAB_RUNNER_ORIGIN 에 슬로그와 다른 사이트를 지정하세요.",
    });
    sink.status({ phase: "error", message: "실행기 없음" });
    return;
  }
  const current = ensureRunner(origin);
  const id = nextId++;
  let finished = false;
  let javaTimer = 0;
  const listener = (message: RunnerMessage) => {
    if (message.type === "ready" || message.id !== id) return;
    if (message.type === "status") {
      sink.status({ phase: "running" });
      sink.console({ level: "system", text: message.text });
      return;
    }
    finish();
    if (message.type === "result") {
      try {
        reportMemoryDoc(message.doc, sink);
      } catch (error) {
        sink.console({ level: "error", text: String(error) });
        sink.status({ phase: "error", message: "실행 기록 해석 실패" });
      }
    } else {
      sink.console({ level: "error", text: message.message });
      sink.status({ phase: "error", message: "실행 오류" });
    }
  };
  const finish = () => {
    finished = true;
    window.clearTimeout(javaTimer);
    current.listeners.delete(listener);
  };
  current.listeners.add(listener);
  onCleanup(() => {
    if (finished) return;
    finish();
    // 원본 실행기는 Java 실행을 끊는 방법이 없어 실행기를 버린다. 다른 언어는 워커만 끝낸다.
    if (language === "java") current.dispose();
    else post(current, { type: "cancel" });
  });
  if (language === "java") {
    javaTimer = window.setTimeout(() => {
      finish();
      current.dispose();
      sink.console({
        level: "system",
        text: `Java 실행이 ${JAVA_LIMIT_MS / 60_000}분 안에 끝나지 않아 중지했습니다.`,
      });
      sink.status({ phase: "stopped", message: "시간 제한" });
    }, JAVA_LIMIT_MS);
  }
  // iframe 은 불러오기 실패를 알려 주지 않으므로 준비 신호가 없으면 실행기를 버리고 알린다.
  const readyTimer = window.setTimeout(() => {
    if (finished) return;
    finish();
    current.dispose();
    sink.console({
      level: "error",
      text: `실행기(${current.origin})를 불러오지 못했습니다. 네트워크를 확인하고 다시 실행하세요.`,
    });
    sink.status({ phase: "error", message: "실행기 연결 실패" });
  }, RUNNER_READY_MS);
  current.ready.then(() => {
    window.clearTimeout(readyTimer);
    if (finished) return;
    // 이전 실행이 남아 있으면 원본 runLanguage 가 거절하므로 먼저 끝낸다.
    post(current, { type: "cancel" });
    post(current, {
      type: "run",
      id,
      language,
      source: request.source,
      stdin,
    });
  });
}

/** 팝업을 닫을 때 부른다. */
export function releaseMemoryRunner() {
  runner?.dispose();
}

function post(target: Runner, message: Record<string, unknown>) {
  target.frame.contentWindow?.postMessage(
    { channel: CHANNEL, ...message },
    target.origin,
  );
}
