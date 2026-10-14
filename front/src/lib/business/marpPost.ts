import { cookies } from "next/headers";

export async function getMarpPost(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/post/api/v1/posts/${id}`,
    {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store",
    },
  );
  if (!response.ok) return null;
  return response.json() as Promise<{
    id: number;
    title: string;
    content: string;
  }>;
}
