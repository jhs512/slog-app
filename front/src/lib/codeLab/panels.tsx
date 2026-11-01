"use client";

import type { ConsoleEntry, Diagnostic, DomNode, VdomNode } from "./protocol";

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

function Empty({ text }: { text: string }) {
  return <p className="p-3 text-sm text-muted-foreground">{text}</p>;
}
