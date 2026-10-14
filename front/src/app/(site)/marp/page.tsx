"use client";

import { useState } from "react";

import MarpDeck from "@/lib/business/components/MarpDeck";
import { MARP_BLOCK_SAMPLE, getMarpDecks } from "@/lib/business/marpSource";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// 저장 없이 Marp를 작성하고 발표할 수 있는 진입점. 공개 샘플/운영 검증에도 사용한다.
export default function Page() {
  const [source, setSource] = useState(MARP_BLOCK_SAMPLE);
  const [preview, setPreview] = useState(MARP_BLOCK_SAMPLE);
  const [presenting, setPresenting] = useState(false);
  const markdown = getMarpDecks(preview)[0]?.source ?? preview;
  return (
    <div className="container mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold">Marp 만들기</h1>
      <p className="text-sm text-muted-foreground">
        Markdown으로 슬라이드를 만들고 발표하세요. 글에 저장하려면 본문에 원문을
        붙여 넣으세요.
      </p>
      <Textarea
        aria-label="Marp 원문"
        className="font-mono min-h-72"
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />
      <div className="flex gap-2">
        <Button type="button" onClick={() => setPreview(source)}>
          미리보기
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPreview(source);
            setPresenting(true);
          }}
        >
          Marp 발표 열기
        </Button>
      </div>
      <MarpDeck key={preview} source={markdown} title="Marp 미리보기" />
      {presenting && (
        <div>
          <MarpDeck
            key={preview}
            source={markdown}
            title="Marp 발표"
            presentation
            onClose={() => setPresenting(false)}
          />
        </div>
      )}
    </div>
  );
}
