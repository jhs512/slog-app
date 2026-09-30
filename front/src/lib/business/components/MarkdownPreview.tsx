"use client";

import { useTheme } from "next-themes";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import ToastUIEditorViewer from "./ToastUIEditorViewer";

export default function MarkdownPreview({
  content,
  postId,
  onOpenChange,
}: {
  content: string;
  postId: number;
  onOpenChange?: (open: boolean) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(content);
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setPreview(content), 250);
    return () => clearTimeout(timer);
  }, [content, open]);
  return (
    <section className="min-w-0" aria-label="본문 미리보기">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        onClick={() => {
          if (!open) setPreview(content);
          setOpen(!open);
          onOpenChange?.(!open);
        }}
      >
        {open ? "미리보기 닫기" : "미리보기"}
      </Button>
      {open && (
        <div className="mt-4">
          <ToastUIEditorViewer
            key={preview + resolvedTheme}
            initialValue={preview}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            postId={postId}
          />
        </div>
      )}
    </section>
  );
}
