import { MARP_MAX_LENGTH } from "@/lib/business/marpSource";
import { renderMarp } from "@/lib/business/renderMarp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Content-Length에 의존하지 않고 청크 단위로 상한을 적용한다.
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Marp 본문이 필요합니다." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MARP_MAX_LENGTH * 4) {
      await reader.cancel();
      return Response.json(
        { error: "Marp 문서가 너무 큽니다." },
        { status: 413 },
      );
    }
    chunks.push(value);
  }
  try {
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (typeof payload?.markdown !== "string")
      throw new Error("Marp 본문이 필요합니다.");
    return Response.json(renderMarp(payload.markdown), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Marp를 표시할 수 없습니다.",
      },
      { status: 400 },
    );
  }
}
