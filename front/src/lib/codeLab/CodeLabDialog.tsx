"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import MemoryFrame from "./MemoryFrame";
import Split, { SplitItem } from "./Split";
import { ENGINE_PANELS, LabDefinition, PANEL_LABELS, PanelId } from "./lab";
import type { MemoryDoc } from "./memoryDoc";
import { ConsoleView, DomView, VdomView } from "./panels";
import type {
  ConsoleEntry,
  Diagnostic,
  DomNode,
  RunStatus,
  VdomNode,
} from "./protocol";
import { RunSink, StopRun, startRun } from "./run";
import {
  LAYOUTS,
  LAYOUT_LABELS,
  WorkspaceSettings,
  loadSettings,
  saveSettings,
} from "./settings";

/** 한 번의 실행이 만든 관찰값. 실행마다 처음부터 다시 만든다. */
interface RunOutput {
  id: number;
  status: RunStatus | null;
  console: ConsoleEntry[];
  diagnostics: Diagnostic[];
  dom: { tree: DomNode; mutations: number } | null;
  vdom: { trees: VdomNode[]; commits: number; renderer: string } | null;
  memory: MemoryDoc | null;
}

const MAX_CONSOLE = 1000;

const emptyOutput = (id: number): RunOutput => ({
  id,
  status: null,
  console: [],
  diagnostics: [],
  dom: null,
  vdom: null,
  memory: null,
});

const STATUS_TEXT: Record<RunStatus["phase"], string> = {
  preparing: "런타임 준비 중",
  running: "실행 중",
  done: "완료",
  error: "오류",
  stopped: "중지됨",
};

function statusText(status: RunStatus | null) {
  if (!status) return "대기";
  const base = STATUS_TEXT[status.phase];
  return "message" in status && status.message
    ? `${base} · ${status.message}`
    : base;
}

export default function CodeLabDialog({
  lab,
  source,
  onClose,
}: {
  lab: LabDefinition;
  source: string;
  onClose: () => void;
}) {
  const available = ENGINE_PANELS[lab.engine];
  const [code, setCode] = useState(source);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<WorkspaceSettings>(() =>
    loadSettings(lab.engine),
  );
  const [output, setOutput] = useState<RunOutput>(() => emptyOutput(0));
  const stopRef = useRef<StopRun | null>(null);
  const frameHostRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const renderSlotRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);

  const updateSettings = (next: WorkspaceSettings) => {
    setSettings(next);
    saveSettings(lab.engine, next);
  };

  const run = (sourceToRun: string, inputText: string) => {
    stopRef.current?.();
    const frameHost = frameHostRef.current;
    if (!frameHost) return;
    const id = ++runIdRef.current;
    setOutput(emptyOutput(id));
    const update = (patch: (current: RunOutput) => Partial<RunOutput>) =>
      setOutput((current) =>
        current.id === id ? { ...current, ...patch(current) } : current,
      );
    const sink: RunSink = {
      status: (status) => update(() => ({ status })),
      console: (entry) =>
        update((current) =>
          current.console.length >= MAX_CONSOLE
            ? {}
            : { console: [...current.console, entry] },
        ),
      diagnostics: (diagnostics) => update(() => ({ diagnostics })),
      dom: (tree, mutations) => update(() => ({ dom: { tree, mutations } })),
      vdom: (trees, commits, renderer) =>
        update(() => ({ vdom: { trees, commits, renderer } })),
      memory: (memory) => update(() => ({ memory })),
    };
    stopRef.current = startRun(
      {
        lab,
        source: sourceToRun,
        input:
          inputText === "" ? [] : inputText.replace(/\r\n/g, "\n").split("\n"),
        frameHost,
      },
      sink,
    );
  };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setOutput((current) =>
      current.status?.phase === "preparing" ||
      current.status?.phase === "running"
        ? { ...current, status: { phase: "stopped", message: "사용자가 중지" } }
        : current,
    );
  };

  // 처음 열 때 원문을 한 번 실행하고, 닫을 때 실행 자원을 모두 정리한다.
  useEffect(() => {
    run(source, "");
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // 렌더링 iframe 은 옮기면 다시 로드되므로 한 자리에 두고 렌더링 패널 위치에 겹쳐 놓는다.
  const isOpen = (id: PanelId) => settings.open.includes(id);
  const renderVisible = available.includes("render") && isOpen("render");
  useLayoutEffect(() => {
    const host = frameHostRef.current;
    const body = bodyRef.current;
    if (!host || !body) return;
    const place = () => {
      const slot = renderSlotRef.current;
      if (!renderVisible || !slot) {
        host.style.cssText =
          "position:absolute;left:-10000px;top:0;width:800px;height:600px;visibility:hidden;";
        return;
      }
      const a = slot.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      host.style.cssText = `position:absolute;left:${a.left - b.left}px;top:${a.top - b.top}px;width:${a.width}px;height:${a.height}px;`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(body);
    if (renderSlotRef.current) observer.observe(renderSlotRef.current);
    return () => observer.disconnect();
  }, [renderVisible, settings]);

  const togglePanel = (id: PanelId) => {
    const open = isOpen(id)
      ? settings.open.filter((item) => item !== id)
      : [...settings.open, id];
    updateSettings({
      ...settings,
      open: available.filter((item) => open.includes(item)),
    });
  };

  const resize = (weights: Record<string, number>) =>
    updateSettings({
      ...settings,
      weights: { ...settings.weights, ...weights },
    });

  const running =
    output.status?.phase === "preparing" || output.status?.phase === "running";

  const panelBody = (id: PanelId): ReactNode => {
    switch (id) {
      case "code":
        return (
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            aria-label="실험 코드"
            data-testid="code-lab-editor"
            className="code-lab-mono h-full w-full resize-none bg-transparent p-2 text-xs outline-none"
          />
        );
      case "input":
        return (
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            aria-label="프로그램 입력"
            placeholder="실행 전에 입력을 미리 적습니다. 한 줄씩 프로그램에 전달됩니다."
            data-testid="code-lab-input"
            className="code-lab-mono h-full w-full resize-none bg-transparent p-2 text-xs outline-none"
          />
        );
      case "render":
        return <div ref={renderSlotRef} className="h-full w-full bg-white" />;
      case "dom":
        return <DomView dom={output.dom} />;
      case "vdom":
        return <VdomView vdom={output.vdom} />;
      case "memory":
        return <MemoryFrame doc={output.memory} />;
      case "console":
        return (
          <ConsoleView
            entries={output.console}
            diagnostics={output.diagnostics}
          />
        );
    }
  };

  const panel = (id: PanelId): SplitItem => ({
    key: id,
    label: PANEL_LABELS[id],
    weight: settings.weights[id] ?? 1,
    node: (
      <section
        aria-label={PANEL_LABELS[id]}
        data-panel={id}
        className="flex h-full min-h-0 flex-col rounded border border-border bg-background"
      >
        <header className="flex items-center justify-between border-b border-border px-2 py-1 text-xs font-semibold">
          <h3>{PANEL_LABELS[id]}</h3>
          <button
            type="button"
            className="code-lab-tool"
            aria-label={`${PANEL_LABELS[id]} 패널 닫기`}
            onClick={() => togglePanel(id)}
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{panelBody(id)}</div>
      </section>
    ),
  });

  const open = available.filter(isOpen);
  const others = open.filter((id) => id !== "code");
  let layout: ReactNode;
  if (!open.length) {
    layout = (
      <p className="m-auto text-sm text-muted-foreground">
        위 패널 버튼으로 볼 패널을 켜세요.
      </p>
    );
  } else if (
    settings.layout === "columns" ||
    !isOpen("code") ||
    !others.length
  ) {
    layout = (
      <Split direction="row" items={open.map(panel)} onResize={resize} />
    );
  } else {
    const horizontal = settings.layout === "side";
    const rest: SplitItem = {
      key: "rest",
      label: "결과 패널 묶음",
      weight: settings.weights.rest ?? 1.4,
      node: (
        <Split
          direction={horizontal ? "column" : "row"}
          items={others.map(panel)}
          onResize={resize}
        />
      ),
    };
    layout = (
      <Split
        direction={horizontal ? "row" : "column"}
        items={[panel("code"), rest]}
        onResize={resize}
      />
    );
  }

  return createPortal(
    <div className="code-lab-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-lab-title"
        data-testid="code-lab-dialog"
        className="flex h-full w-full max-w-[1600px] flex-col rounded-lg border border-border bg-background text-foreground shadow-xl"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
            return;
          }
          if (event.key !== "Tab") return;
          const focusables = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not([disabled]), select, textarea, input, summary, [tabindex='0']",
            ),
          ];
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
          <h2 id="code-lab-title" className="mr-2 text-sm font-semibold">
            코드 실험 · {lab.title}
          </h2>
          <button
            type="button"
            className="code-lab-action"
            data-autofocus
            onClick={() => run(code, input)}
            data-testid="code-lab-run"
          >
            ▶ 실행
          </button>
          <button
            type="button"
            className="code-lab-action"
            onClick={stop}
            disabled={!running}
            data-testid="code-lab-stop"
          >
            ■ 중지
          </button>
          <span
            className="text-xs text-muted-foreground"
            role="status"
            data-testid="code-lab-status"
          >
            {statusText(output.status)}
          </span>
          <div
            className="ml-auto flex flex-wrap items-center gap-1"
            role="group"
            aria-label="패널 표시"
          >
            {available.map((id) => (
              <button
                key={id}
                type="button"
                className="code-lab-toggle"
                aria-pressed={isOpen(id)}
                onClick={() => togglePanel(id)}
              >
                {PANEL_LABELS[id]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs">
            배치
            <select
              value={settings.layout}
              onChange={(event) =>
                updateSettings({
                  ...settings,
                  layout:
                    LAYOUTS.find((item) => item === event.target.value) ??
                    settings.layout,
                })
              }
              className="rounded border border-border bg-background px-1 py-0.5"
              data-testid="code-lab-layout"
            >
              {LAYOUTS.map((item) => (
                <option key={item} value={item}>
                  {LAYOUT_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="code-lab-action"
            onClick={onClose}
            aria-label="코드 실험 닫기"
            data-testid="code-lab-close"
          >
            닫기
          </button>
        </div>
        <div ref={bodyRef} className="relative flex min-h-0 flex-1 p-2">
          {layout}
          <div ref={frameHostRef} aria-hidden={!renderVisible} />
        </div>
        <p className="border-t border-border px-2 py-1 text-[11px] text-muted-foreground">
          모든 컴파일·실행은 이 브라우저 안에서만 일어나며 서버로 코드를 보내지
          않습니다. 수정한 코드는 저장되지 않고 닫으면 원문으로 돌아갑니다.
        </p>
      </div>
    </div>,
    document.body,
  );
}
