"use client";

import "../vendor/topcit-speech/speech.css";

import { type RefObject, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Volume2 } from "lucide-react";

export default function PostSpeech({
  contentRoot,
}: {
  contentRoot: RefObject<HTMLDivElement | null>;
}) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled || !contentRoot.current) return;
    const root = contentRoot.current;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import("../postSpeech")
      .then(({ mountPostSpeech }) => {
        if (!disposed) cleanup = mountPostSpeech(root);
      })
      .catch(() => {
        if (!disposed)
          setError("읽어주기를 불러오지 못했습니다. 다시 켜 주세요.");
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [enabled, contentRoot]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        aria-pressed={enabled}
        onClick={() => {
          setError("");
          setEnabled(!enabled);
        }}
      >
        <Volume2 className="h-4 w-4" />
        {enabled ? "읽어주기 끄기" : "읽어주기 켜기"}
      </Button>
      <span className="text-xs text-muted-foreground">
        {enabled
          ? "본문 옆의 재생 버튼을 누르세요."
          : "기기의 한국어 음성으로 읽습니다."}
      </span>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
