"use client";

import { useTheme } from "next-themes";

import { useRouter } from "next/navigation";

import { use, useEffect, useRef, useState } from "react";

import usePost from "@/domain/post/hooks/usePost";
import withLogin from "@/global/auth/hoc/withLogin";
import client from "@/global/backend/client";
import { toast } from "sonner";

import HeaderActionSlot from "@/lib/business/components/HeaderActionSlot";
import MarkdownPreview from "@/lib/business/components/MarkdownPreview";
import MonacoEditor from "@/lib/business/components/MonacoEditor";
import {
  parsePostEditorContent,
  withPostEditorConfig,
} from "@/lib/business/postEditorConfig";

import { Button } from "@/components/ui/button";

import { ArrowLeft, Save } from "lucide-react";

export default withLogin(function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const { id: idStr } = use(params);
  const id = parseInt(idStr);

  const { post } = usePost(id);

  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const isFirstLoad = useRef(true);

  const contentRef = useRef("");

  useEffect(() => {
    if (post) {
      if (isFirstLoad.current) {
        const content = withPostEditorConfig(post, post.content || "");
        setInitialContent(content);
        contentRef.current = content;
        setPreviewContent(post.content || "");
        isFirstLoad.current = false;
      }
    }
  }, [post]);

  const handleEditorChange = (value: string) => {
    contentRef.current = value;
    setPreviewContent(parsePostEditorContent(value, post ?? undefined).content);
  };

  const savePostRef = useRef<((value: string) => void) | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.code === "KeyS")) {
        e.preventDefault();
        savePostRef.current?.(contentRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const savePost = async (value: string) => {
    if (!post) return;
    try {
      if (initialContent !== null && value.trim() === initialContent.trim()) {
        toast.info("변경사항이 없습니다.");
        return;
      }

      const { title, published, listed, content } = parsePostEditorContent(
        value.trim(),
        post,
      );

      const response = await client.PUT("/post/api/v1/posts/{id}", {
        params: {
          path: {
            id: post.id,
          },
        },
        body: {
          title: title,
          content: content,
          published: published,
          listed: listed,
        },
      });

      if (response.error) {
        toast.error(response.error.msg);
        return;
      }

      if (response.data) {
        toast.success(response.data.msg);
        setInitialContent(value);
      }
    } catch {
      toast.error("저장 실패");
    }
  };
  savePostRef.current = savePost;

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <HeaderActionSlot>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="font-semibold">에디터</span>
            <span className="text-muted-foreground">(Ctrl+S로 저장)</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => savePost(contentRef.current)}
          >
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/p/${id}/edit`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </HeaderActionSlot>

      {post == null && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-muted-foreground">로딩중...</div>
        </div>
      )}

      {post != null && !initialContent && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-muted-foreground">에디터 준비중...</div>
        </div>
      )}

      {post != null && initialContent && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <MonacoEditor
            theme={resolvedTheme as "light" | "dark"}
            initialValue={initialContent}
            onSave={savePost}
            onChange={handleEditorChange}
            className="flex-1 min-h-[35dvh] md:min-h-0"
          />
          <div
            className={`${previewOpen ? "md:w-1/2" : "md:w-auto"} max-h-[50dvh] md:max-h-none overflow-auto p-4`}
          >
            <MarkdownPreview
              content={previewContent}
              postId={id}
              onOpenChange={setPreviewOpen}
            />
          </div>
        </div>
      )}
    </div>
  );
});
