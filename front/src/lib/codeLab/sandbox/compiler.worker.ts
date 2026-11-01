// 호스트 출처의 워커에서 Babel로 소스를 변환만 한다. 코드는 여기서 실행하지 않는다.
// scripts/build-code-lab.mjs 가 public/code-lab/compiler.js 로 묶는다.
import type { CompileRequest, CompileResponse, Diagnostic } from "../protocol";

interface BabelApi {
  transform(
    code: string,
    options: Record<string, unknown>,
  ): { code: string | null };
}

interface WorkerScope {
  importScripts(...urls: string[]): void;
  postMessage(message: CompileResponse): void;
  onmessage: ((event: MessageEvent<CompileRequest>) => void) | null;
  Babel: BabelApi;
}

const scope = globalThis as unknown as WorkerScope;
scope.importScripts("./babel.min.js");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** 반복문마다 진입 시각을 잡고 본문 시작에서 제한 시간을 검사한다. */
function loopGuardPlugin({ types: t }: Any) {
  const guard = (method: string, args: Any[]) =>
    t.callExpression(
      t.memberExpression(t.identifier("__slogLoop"), t.identifier(method)),
      args,
    );
  const visit = (path: Any) => {
    const started = path.scope.generateUidIdentifier("loopStart");
    const line = t.numericLiteral(path.node.loc?.start.line ?? 0);
    const check = t.expressionStatement(guard("check", [started, line]));
    const body = path.node.body;
    path.node.body = t.blockStatement(
      t.isBlockStatement(body) ? [check, ...body.body] : [check, body],
    );
    const target = path.parentPath.isLabeledStatement()
      ? path.parentPath
      : path;
    target.insertBefore(
      t.variableDeclaration("let", [
        t.variableDeclarator(started, guard("start", [])),
      ]),
    );
  };
  return {
    visitor: {
      WhileStatement: visit,
      DoWhileStatement: visit,
      ForStatement: visit,
      ForInStatement: visit,
      ForOfStatement: visit,
    },
  };
}

function presetsFor(target: CompileRequest["target"]) {
  switch (target) {
    case "typescript":
      return ["typescript"];
    case "react":
      return ["typescript", ["react", { runtime: "classic" }]];
    default:
      return [];
  }
}

function transform(
  source: string,
  request: CompileRequest,
  sourceType: "script" | "module",
): string {
  const plugins: Any[] = request.loopGuard ? [loopGuardPlugin] : [];
  if (request.target === "react") plugins.push("transform-modules-commonjs");
  const result = scope.Babel.transform(source, {
    filename: request.target === "react" ? "App.tsx" : "main.ts",
    presets: presetsFor(request.target),
    plugins,
    sourceType,
    retainLines: true,
    babelrc: false,
    configFile: false,
  });
  return result.code ?? "";
}

function toDiagnostic(error: unknown, lineOffset = 0): Diagnostic {
  const loc = (error as { loc?: { line: number; column: number } }).loc;
  const message = error instanceof Error ? error.message : String(error);
  return {
    line: (loc?.line ?? 1) + lineOffset,
    col: (loc?.column ?? 0) + 1,
    severity: "error",
    message: message.replace(/^[^:]*: /, "").split("\n")[0],
  };
}

const SCRIPT_PATTERN = /<script(\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi;

/** HTML 안의 인라인 스크립트에만 무한 반복 방지를 넣는다. 외부 src 스크립트는 그대로 둔다. */
function compileHtml(request: CompileRequest): CompileResponse {
  const diagnostics: Diagnostic[] = [];
  const code = request.source.replace(
    SCRIPT_PATTERN,
    (whole, attrs: string | undefined, body: string, offset: number) => {
      const attributes = attrs ?? "";
      if (/\ssrc\s*=/i.test(attributes)) return whole;
      const type = attributes.match(/\stype\s*=\s*["']?([^"'\s>]+)/i)?.[1];
      const isModule = type === "module";
      if (type && !isModule && !/javascript|ecmascript/i.test(type)) {
        return whole;
      }
      const startLine =
        request.source.slice(0, offset + whole.indexOf(">") + 1).split("\n")
          .length - 1;
      try {
        const compiled = transform(
          body,
          { ...request, target: "javascript" },
          isModule ? "module" : "script",
        );
        return `<script${attributes}>${compiled.replace(/<\/script/gi, "<\\/script")}</script>`;
      } catch (error) {
        diagnostics.push(toDiagnostic(error, startLine));
        return whole;
      }
    },
  );
  return diagnostics.length
    ? { id: request.id, ok: false, diagnostics }
    : { id: request.id, ok: true, code };
}

scope.onmessage = (event) => {
  const request = event.data;
  if (request.target === "html") {
    scope.postMessage(compileHtml(request));
    return;
  }
  try {
    scope.postMessage({
      id: request.id,
      ok: true,
      code: transform(request.source, request, "module"),
    });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      ok: false,
      diagnostics: [toDiagnostic(error)],
    });
  }
};
