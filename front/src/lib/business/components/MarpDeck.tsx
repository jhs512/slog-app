"use client";

import Link from "next/link";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Home,
  Presentation,
} from "lucide-react";

import type { RenderedMarp } from "../renderMarp";

export default function MarpDeck({
  source,
  title = "Marp",
  href,
  postId,
  presentation = false,
  initialRender,
  onClose,
}: {
  source: string;
  title?: string;
  href?: string;
  postId?: number;
  presentation?: boolean;
  initialRender?: RenderedMarp;
  onClose?: () => void;
}) {
  const [rendered, setRendered] = useState<RenderedMarp | null>(
    initialRender ?? null,
  );
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (initialRender) return;
    const controller = new AbortController();
    let active = true;
    fetch("/api/marp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: source }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Marp를 표시할 수 없습니다.");
        if (active) {
          setRendered(result);
          setError("");
          setCurrent(0);
        }
      })
      .catch((failure) => {
        if (active && failure.name !== "AbortError")
          setError("Marp를 표시할 수 없습니다. 문법과 문서 크기를 확인하세요.");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [source, initialRender]);

  const count = rendered?.count ?? 0;
  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(count - 1, index));
      setCurrent(next);
      if (presentation && count) history.replaceState(null, "", `#${next + 1}`);
    },
    [count, presentation],
  );

  useEffect(() => {
    if (!presentation || !count) return;
    const fromHash = () => {
      const requested = Number(window.location.hash.slice(1));
      goTo(Number.isInteger(requested) && requested > 0 ? requested - 1 : 0);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [presentation, count, goTo]);

  useEffect(() => {
    if (!presentation) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape" && onClose) onClose();
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goTo(current + 1);
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goTo(current - 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goTo(count - 1);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [presentation, current, count, goTo, onClose]);

  useEffect(() => {
    const change = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  const ratio = rendered ? rendered.width / rendered.height : 16 / 9;
  const doc = rendered
    ? `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${rendered.nonce}'; img-src https: http: data:; style-src 'unsafe-inline'; font-src https: data:; base-uri 'none'; form-action 'none'"><style>${rendered.css.replace(/</g, "\\3c ")}
html,body{margin:0;padding:0;background:transparent} .marpit>svg[data-marpit-svg]{display:none;width:100%;height:auto;margin:0}.marpit>svg[data-marpit-svg]:nth-of-type(${current + 1}){display:block}</style></head><body>${rendered.html}</body></html>`
    : undefined;

  return (
    <div
      ref={root}
      className={
        presentation
          ? "fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white"
          : "not-prose rounded-lg border overflow-hidden bg-card"
      }
      aria-label={`${title} 슬라이드`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b">
        <span className="font-semibold truncate">{title}</span>
        <div className="flex items-center gap-2">
          {href && (
            <Button asChild type="button" variant="outline" size="sm">
              <Link href={href}>
                <Presentation className="w-4 h-4" />
                Marp 발표 열기
              </Link>
            </Button>
          )}
          {presentation && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    if (fullscreen) await document.exitFullscreen();
                    else await root.current?.requestFullscreen();
                  } catch {
                    setError("전체 화면을 사용할 수 없습니다.");
                  }
                }}
                aria-label={fullscreen ? "전체 화면 종료" : "전체 화면"}
              >
                <Expand className="w-4 h-4" />
              </Button>
              {postId !== undefined && (
                <Button asChild type="button" variant="secondary" size="sm">
                  <Link href={`/p/${postId}`}>
                    <Home className="w-4 h-4" />
                    글로 돌아가기
                  </Link>
                </Button>
              )}
              {onClose && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                >
                  발표 닫기
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <div
        style={presentation ? { containerType: "size" } : undefined}
        className={
          presentation
            ? "flex-1 min-h-0 flex items-center justify-center overflow-hidden p-2"
            : "w-full"
        }
      >
        {error ? (
          <p role="alert" className="p-4">
            {error}
          </p>
        ) : !rendered ? (
          <p role="status" className="p-4">
            Marp 불러오는 중...
          </p>
        ) : (
          <iframe
            ref={frame}
            title={`${title} · ${current + 1}/${count}`}
            sandbox="allow-scripts"
            srcDoc={doc}
            scrolling="no"
            tabIndex={-1}
            className={
              presentation
                ? "border-0 pointer-events-none bg-white"
                : "block w-full border-0 bg-white"
            }
            style={
              presentation
                ? {
                    width: `min(100cqw, calc(100cqh * ${ratio}))`,
                    aspectRatio: ratio,
                  }
                : { aspectRatio: ratio }
            }
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-4 p-3 border-t">
        <Button
          type="button"
          variant={presentation ? "secondary" : "outline"}
          size="sm"
          aria-label="이전 슬라이드"
          disabled={!count || current === 0}
          onClick={() => goTo(current - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span aria-live="polite" className="text-sm tabular-nums">
          {count ? `${current + 1} / ${count}` : "—"}
        </span>
        <Button
          type="button"
          variant={presentation ? "secondary" : "outline"}
          size="sm"
          aria-label="다음 슬라이드"
          disabled={!count || current >= count - 1}
          onClick={() => goTo(current + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
