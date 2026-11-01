"use client";

import { useEffect, useRef, useState } from "react";

import type { MemoryDoc } from "./memoryDoc";

const CHANNEL = "slog-code-lab-memory";

/** 출처 없는 iframe 에 Java-memory-visualizer 렌더러를 띄우고 실행 기록만 넘긴다. */
function memoryDocument(token: string): string {
  const origin = window.location.origin;
  const base = `${origin}/code-lab/jmv/`;
  const csp = [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${base}`,
    `style-src 'unsafe-inline' ${base}`,
    "img-src data:",
    "connect-src 'none'",
    "form-action 'none'",
  ].join("; ");
  const config = JSON.stringify({ token, hostOrigin: origin }).replace(
    /</g,
    "\\u003c",
  );
  return (
    `<!doctype html><html lang="ko"><head><meta charset="utf-8">` +
    `<meta http-equiv="Content-Security-Policy" content="${csp}">` +
    `<link rel="stylesheet" href="${base}style.css">` +
    // 원본의 높이 조절 모드(trace-resized)로 패널 높이를 꽉 채운다.
    `<style>main{padding:8px}main.trace-resized{--trace-height:calc(100vh - 16px)}</style>` +
    `<script>window.__SLOG_JMV__=${config}</script>` +
    `<script type="module" src="${base}jmv-memory.js"></script>` +
    `</head><body><main class="trace-resized"><section id="viz" class="viz" aria-label="실행 단계와 메모리"></section></main></body></html>`
  );
}

export default function MemoryFrame({ doc }: { doc: MemoryDoc | null }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [token] = useState(() => crypto.randomUUID());
  const [srcDoc] = useState(() => memoryDocument(token));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.origin !== "null") return;
      const data = event.data;
      if (
        data?.channel === CHANNEL &&
        data.token === token &&
        data.type === "ready"
      ) {
        setReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [token]);

  useEffect(() => {
    if (!ready || !doc) return;
    frameRef.current?.contentWindow?.postMessage(
      { channel: CHANNEL, token, doc },
      "*",
    );
  }, [ready, doc, token]);

  return (
    <div className="relative h-full w-full" data-testid="code-lab-memory">
      {!doc && (
        <p className="absolute inset-x-0 top-0 p-3 text-sm text-muted-foreground">
          실행하면 Java-memory-visualizer 추적기가 기록한 호출 스택과 메모리가
          표시됩니다.
        </p>
      )}
      <iframe
        ref={frameRef}
        title="메모리 시각화"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        className="h-full w-full border-0"
        style={{ visibility: doc ? "visible" : "hidden" }}
      />
    </div>
  );
}
