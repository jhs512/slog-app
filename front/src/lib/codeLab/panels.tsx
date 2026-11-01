"use client";

import { useState } from "react";

import type { ValueNode } from "../business/vendor/c-it/viewmodel/view";
import {
  buildView,
  describeTarget,
  hex,
} from "../business/vendor/c-it/viewmodel/view";
import type { ConsoleEntry, Diagnostic, DomNode, VdomNode } from "./protocol";
import type { MemoryTrace } from "./run";

const LEVEL_CLASS: Record<ConsoleEntry["level"], string> = {
  log: "",
  info: "text-sky-700 dark:text-sky-300",
  warn: "text-amber-700 dark:text-amber-300",
  error: "text-red-700 dark:text-red-300",
  system: "text-muted-foreground italic",
};

export function ConsoleView({
  entries,
  diagnostics,
}: {
  entries: ConsoleEntry[];
  diagnostics: Diagnostic[];
}) {
  return (
    <div
      className="code-lab-mono h-full overflow-auto p-2 text-xs whitespace-pre-wrap"
      role="log"
      aria-live="polite"
      data-testid="code-lab-console"
    >
      {diagnostics.map((item, index) => (
        <div
          key={`d${index}`}
          className={
            item.severity === "error" ? LEVEL_CLASS.error : LEVEL_CLASS.warn
          }
        >
          {`${item.line}행 ${item.col}열 ${item.severity === "error" ? "오류" : "경고"}: ${item.message}`}
        </div>
      ))}
      {entries.map((entry, index) => (
        <div
          key={index}
          className={LEVEL_CLASS[entry.level]}
          data-level={entry.level}
        >
          {entry.text}
        </div>
      ))}
      {!entries.length && !diagnostics.length && (
        <p className="text-muted-foreground">출력이 없습니다.</p>
      )}
    </div>
  );
}

function DomTreeNode({ node, depth }: { node: DomNode; depth: number }) {
  if (node.t === "text") {
    return <div className="text-muted-foreground">&quot;{node.v}&quot;</div>;
  }
  const attrs = node.attrs
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("");
  if (!node.c.length) {
    return <div>{`<${node.tag}${attrs}></${node.tag}>`}</div>;
  }
  return (
    <details open={depth < 6}>
      <summary className="cursor-pointer">{`<${node.tag}${attrs}>`}</summary>
      <div className="border-l border-border pl-3">
        {node.c.map((child, index) => (
          <DomTreeNode key={index} node={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

export function DomView({
  dom,
}: {
  dom: { tree: DomNode; mutations: number } | null;
}) {
  if (!dom) return <Empty text="실행 후 문서의 실제 DOM이 표시됩니다." />;
  return (
    <div
      className="code-lab-mono h-full overflow-auto p-2 text-xs"
      data-testid="code-lab-dom"
    >
      <p className="mb-1 text-muted-foreground">
        sandbox 문서의 실제 DOM · 관찰한 변경 {dom.mutations}회
      </p>
      <DomTreeNode node={dom.tree} depth={0} />
    </div>
  );
}

function VdomTreeNode({ node, depth }: { node: VdomNode; depth: number }) {
  const label =
    node.kind === "component"
      ? `<${node.name}>`
      : node.kind === "text"
        ? `"${node.name}"`
        : node.name;
  const tone =
    node.kind === "component"
      ? "text-violet-700 dark:text-violet-300 font-semibold"
      : node.kind === "text"
        ? "text-muted-foreground"
        : "";
  const details = (
    <>
      <span className={tone}>{label}</span>
      {node.props && (
        <span className="text-muted-foreground"> {node.props}</span>
      )}
      {node.state?.map((value, index) => (
        <span
          key={index}
          className="ml-1 rounded bg-violet-100 px-1 text-violet-800 dark:bg-violet-900 dark:text-violet-100"
        >
          state[{index}]={value}
        </span>
      ))}
    </>
  );
  if (!node.c.length) return <div>{details}</div>;
  return (
    <details open={depth < 8}>
      <summary className="cursor-pointer">{details}</summary>
      <div className="border-l border-border pl-3">
        {node.c.map((child, index) => (
          <VdomTreeNode key={index} node={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

export function VdomView({
  vdom,
}: {
  vdom: { trees: VdomNode[]; commits: number; renderer: string } | null;
}) {
  if (!vdom)
    return <Empty text="React가 화면을 커밋하면 렌더 트리가 표시됩니다." />;
  return (
    <div
      className="code-lab-mono h-full overflow-auto p-2 text-xs"
      data-testid="code-lab-vdom"
    >
      <p className="mb-1 text-muted-foreground">
        React Fiber 트리 · {vdom.renderer} · 커밋 {vdom.commits}회. 실제 DOM이
        아닌 React 내부 렌더 트리이며 이 킷의 React 버전 구조에 맞춰 읽습니다.
      </p>
      {vdom.trees.map((tree, index) => (
        <VdomTreeNode key={index} node={tree} depth={0} />
      ))}
    </div>
  );
}

function ValueLine({
  label,
  node,
  target,
}: {
  label: string;
  node: ValueNode;
  target: (node: ValueNode) => string;
}) {
  const value =
    node.kind === "pointer"
      ? `${node.text} → ${target(node)}`
      : node.uninit
        ? "(초기화 안 됨)"
        : node.text;
  return (
    <li
      className={node.changed ? "bg-amber-100 dark:bg-amber-900/50" : undefined}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-muted-foreground">
        {" "}
        {node.type.str} @{hex(node.addr)}
      </span>
      {node.kind !== "array" && node.kind !== "struct" && (
        <span> = {value}</span>
      )}
      {node.children && (
        <ul className="border-l border-border pl-3">
          {node.children.map((child) => (
            <ValueLine
              key={child.label}
              label={child.label}
              node={child.node}
              target={target}
            />
          ))}
          {node.more ? (
            <li className="text-muted-foreground">… {node.more}개 더</li>
          ) : null}
        </ul>
      )}
    </li>
  );
}

export function MemoryView({ trace }: { trace: MemoryTrace | null }) {
  // null 은 "끝을 따라감", 숫자는 사용자가 고른 줄 단위 단계 위치다.
  const [picked, setPicked] = useState<number | null>(null);
  if (!trace?.timeline.program) {
    return (
      <Empty text="C 프로그램을 실행하면 실제 실행 추적의 메모리가 표시됩니다." />
    );
  }
  const { timeline } = trace;
  const stops = timeline.lineSteps;
  const last = stops.length - 1;
  const position = picked === null ? last : Math.min(picked, last);
  timeline.seek(position >= 0 ? stops[position] : -1);
  const view = buildView(timeline, true);
  const target = (node: ValueNode) =>
    describeTarget(view, node.target, node.targetSize);
  const go = (next: number) => setPicked(Math.max(0, Math.min(next, last)));

  return (
    <div
      className="code-lab-mono flex h-full flex-col text-xs"
      data-testid="code-lab-memory"
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
        <button
          type="button"
          className="code-lab-tool"
          onClick={() => go(0)}
          aria-label="처음 단계"
        >
          ⏮
        </button>
        <button
          type="button"
          className="code-lab-tool"
          onClick={() => go(position - 1)}
          aria-label="이전 단계"
        >
          ◀
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(last, 0)}
          value={Math.max(position, 0)}
          onChange={(event) => go(Number(event.target.value))}
          aria-label="실행 단계"
          className="w-28"
        />
        <button
          type="button"
          className="code-lab-tool"
          onClick={() => go(position + 1)}
          aria-label="다음 단계"
        >
          ▶
        </button>
        <button
          type="button"
          className="code-lab-tool"
          onClick={() => setPicked(null)}
          aria-label="마지막 단계"
        >
          ⏭
        </button>
        <span data-testid="code-lab-memory-step">
          단계 {position + 1}/{stops.length}
          {view.step ? ` · ${view.step.l}행` : ""}
          {trace.finished ? "" : " · 실행 중"}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <p className="mb-2 text-muted-foreground">
          c-it 인터프리터가 실제 실행하며 기록한 가상 메모리(스택·힙)입니다.
          네이티브 기계의 주소가 아닙니다.
        </p>
        <section aria-label="스택">
          <h4 className="font-semibold">스택</h4>
          {[...view.frames].reverse().map((frame) => (
            <div
              key={frame.id}
              className="mb-2 rounded border border-border p-1"
            >
              <div
                className={
                  frame.isCurrent
                    ? "font-semibold text-primary"
                    : "font-semibold"
                }
              >
                {frame.fn}()
              </div>
              <ul>
                {frame.vars.map((item) => (
                  <ValueLine
                    key={item.name}
                    label={item.name}
                    node={item.node}
                    target={target}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
        {view.globals.length > 0 && (
          <section aria-label="전역">
            <h4 className="font-semibold">전역</h4>
            <ul>
              {view.globals.map((item) => (
                <ValueLine
                  key={item.name}
                  label={item.name}
                  node={item.node}
                  target={target}
                />
              ))}
            </ul>
          </section>
        )}
        <section aria-label="힙">
          <h4 className="font-semibold">힙</h4>
          {view.heap.length === 0 && (
            <p className="text-muted-foreground">할당된 블록 없음</p>
          )}
          <ul>
            {view.heap.map((block) => (
              <li key={block.id} data-freed={block.freed} className="mb-1">
                <span className="font-semibold">heap#{block.id}</span> @
                {hex(block.addr)} · {block.size}바이트 · {block.line}행 할당
                {block.freed ? ` · ${block.freedLine ?? "?"}행 해제됨` : ""}
                {block.node && !block.freed && (
                  <ul className="border-l border-border pl-3">
                    <ValueLine
                      label={block.typeLabel}
                      node={block.node}
                      target={target}
                    />
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="p-3 text-sm text-muted-foreground">{text}</p>;
}
