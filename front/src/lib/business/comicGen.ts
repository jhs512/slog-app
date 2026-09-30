import { mountComicCard } from "./comicViewer";
import { escapeHtml } from "./markdownUtils";

/** Toast UI의 코드 블록 AST를 사용하므로 중첩된 예제 펜스는 변환하지 않는다. */
export function comicBlockHTML(info: string, source: string): string | null {
  if (info.trim().split(/\s+/)[0].toLowerCase() !== "comic-gen") return null;
  return `<div class="comic-gen" data-comic-source="${escapeHtml(source)}" role="group" aria-label="만화" aria-busy="true"><p role="status">만화를 불러오는 중...</p></div>`;
}

/** 각 뷰어 안에서만 실행하며 삭제된 블록과 언마운트 시 이미지 URL을 해제한다. */
export function observeComicBlocks(root: HTMLElement): () => void {
  const blocks = new Map<HTMLElement, (() => void)[]>();
  let disposed = false;

  const release = (cleanups: (() => void)[]) =>
    cleanups.forEach((cleanup) => cleanup());
  const scan = () => {
    for (const [block, cleanups] of blocks) {
      if (!root.contains(block)) {
        release(cleanups);
        blocks.delete(block);
      }
    }
    root
      .querySelectorAll<HTMLElement>("[data-comic-source]")
      .forEach((block) => {
        if (blocks.has(block)) return;
        const cleanups: (() => void)[] = [];
        blocks.set(block, cleanups);
        const active = () =>
          !disposed && root.contains(block) && blocks.get(block) === cleanups;
        void (async () => {
          try {
            const { renderComic } = await import("./vendor/comic-gen");
            await document.fonts.ready;
            if (!active()) return;
            // 기본 원본 배치를 유지하고 모바일에서도 컷을 재배열하지 않는다.
            const result = renderComic(block.dataset.comicSource ?? "");
            if (result.diagnostics.length)
              throw new Error(result.diagnostics.join("\n"));
            cleanups.push(mountComicCard(block, result));
            block.dataset.comicState = "ready";
          } catch (error) {
            if (!active()) return;
            release(cleanups.splice(0));
            const message = document.createElement("p");
            message.setAttribute("role", "alert");
            message.textContent = `만화를 표시할 수 없습니다: ${error instanceof Error ? error.message : "잠시 후 다시 시도하세요."}`;
            block.replaceChildren(message);
            block.dataset.comicState = "error";
          } finally {
            if (active()) block.setAttribute("aria-busy", "false");
          }
        })();
      });
  };
  const observer = new MutationObserver(scan);
  observer.observe(root, { childList: true, subtree: true });
  scan();
  return () => {
    disposed = true;
    observer.disconnect();
    blocks.forEach(release);
    blocks.clear();
  };
}
