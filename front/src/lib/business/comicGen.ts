import { escapeHtml } from "./markdownUtils";

/** Toast UI의 코드 블록 AST를 사용하므로 중첩된 예제 펜스는 변환하지 않는다. */
export function comicBlockHTML(info: string, source: string): string | null {
  if (info.trim().split(/\s+/)[0].toLowerCase() !== "comic-gen") return null;
  return `<div class="comic-gen" data-comic-source="${escapeHtml(source)}" role="group" aria-label="만화" aria-busy="true"><p role="status">만화를 불러오는 중...</p></div>`;
}

/** 각 뷰어 안에서만 실행하며 삭제된 블록과 언마운트 시 이미지 URL을 해제한다. */
export function observeComicBlocks(root: HTMLElement): () => void {
  const blocks = new Map<HTMLElement, string[]>();
  let disposed = false;

  const release = (urls: string[]) => urls.forEach(URL.revokeObjectURL);
  const scan = () => {
    for (const [block, urls] of blocks) {
      if (!root.contains(block)) {
        release(urls);
        blocks.delete(block);
      }
    }
    root
      .querySelectorAll<HTMLElement>("[data-comic-source]")
      .forEach((block) => {
        if (blocks.has(block)) return;
        const urls: string[] = [];
        blocks.set(block, urls);
        const active = () =>
          !disposed && root.contains(block) && blocks.get(block) === urls;
        void (async () => {
          try {
            const { renderPanels } = await import("./vendor/comic-gen");
            await document.fonts.ready;
            if (!active()) return;
            const result = renderPanels(block.dataset.comicSource ?? "", {
              width: 720,
              panelFormat: "phone",
            });
            if (result.diagnostics.length)
              throw new Error(result.diagnostics.join("\n"));
            const images = result.panels.map((panel, index) => {
              const img = document.createElement("img");
              const url = URL.createObjectURL(
                new Blob([panel.svg], { type: "image/svg+xml" }),
              );
              urls.push(url);
              img.src = url;
              img.width = panel.width;
              img.height = panel.height;
              const svg = new DOMParser().parseFromString(
                panel.svg,
                "image/svg+xml",
              );
              img.alt =
                svg.querySelector("title")?.textContent ??
                `만화 ${index + 1}컷`;
              img.decoding = "async";
              return img;
            });
            // SVG를 img로 표시하면 사용자 대사/이름표가 DOM 코드로 실행되지 않는다.
            block.replaceChildren(...images);
            block.dataset.comicState = "ready";
          } catch (error) {
            if (!active()) return;
            release(urls.splice(0));
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
