import Link from "next/link";

import MarpDeck from "@/lib/business/components/MarpDeck";
import { getMarpPost } from "@/lib/business/marpPost";
import { getMarpDecks } from "@/lib/business/marpSource";
import { renderMarp } from "@/lib/business/renderMarp";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; marpId: string }>;
}) {
  const { id, marpId } = await params;
  const post = await getMarpPost(id);
  const deck =
    post && getMarpDecks(post.content).find((item) => item.id === marpId);
  if (!deck)
    return (
      <div className="p-6">
        <p>Marp 문서를 찾을 수 없습니다.</p>
        <Link href={`/p/${id}`} className="underline">
          글로 돌아가기
        </Link>
      </div>
    );
  let rendered: ReturnType<typeof renderMarp> | null = null;
  try {
    rendered = renderMarp(deck.source);
  } catch {
    /* 잘못된 Marp 문서는 글로 돌아갈 수 있게 안내한다. */
  }
  if (!rendered) {
    return (
      <div className="p-6" role="alert">
        Marp를 표시할 수 없습니다. 문법과 문서 크기를 확인하세요.{" "}
        <Link href={`/p/${id}`} className="underline">
          글로 돌아가기
        </Link>
      </div>
    );
  }
  return (
    <MarpDeck
      source={deck.source}
      title={deck.id === "document" ? post.title : deck.title}
      postId={post.id}
      presentation
      initialRender={rendered}
    />
  );
}
