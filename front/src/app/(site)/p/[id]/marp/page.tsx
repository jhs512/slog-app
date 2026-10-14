import Link from "next/link";
import { redirect } from "next/navigation";

import { getMarpPost } from "@/lib/business/marpPost";
import { getMarpDecks } from "@/lib/business/marpSource";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getMarpPost(id);
  const decks = post ? getMarpDecks(post.content) : [];
  if (decks.length === 1)
    redirect(`/p/${id}/marp/${encodeURIComponent(decks[0].id)}`);
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">{post?.title} · Marp</h1>
      {!decks.length && <p>Marp 문서를 찾을 수 없습니다.</p>}
      <ul className="space-y-3">
        {decks.map((deck) => (
          <li key={deck.id}>
            <Link
              className="text-primary underline"
              href={`/p/${id}/marp/${encodeURIComponent(deck.id)}`}
            >
              {deck.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link href={`/p/${id}`} className="underline">
        글로 돌아가기
      </Link>
    </div>
  );
}
