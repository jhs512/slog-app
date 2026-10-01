import type { ComicResult } from "./vendor/comic-gen";

let nextId = 0;

/** 코믹젠 embed의 UX를 Slog 수명주기와 Blob 이미지 방식에 맞게 적용한다. */
export function mountComicCard(
  block: HTMLElement,
  result: ComicResult,
): () => void {
  const urls: string[] = [];
  const image = (svg: string, width: number, height: number, alt: string) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    urls.push(url);
    Object.assign(img, { src: url, width, height, alt, decoding: "async" });
    return img;
  };
  const title =
    new DOMParser()
      .parseFromString(result.svg, "image/svg+xml")
      .documentElement.getAttribute("aria-label") ?? "만화";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "comic-card";
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-label", `${title} · 만화 읽기`);
  const thumbnail = document.createElement("span");
  thumbnail.className = "comic-card-thumbnail";
  thumbnail.setAttribute("aria-hidden", "true");
  const first = result.panels[0];
  thumbnail.append(
    image(
      first.svg,
      first.width,
      first.height,
      `${title} · 1/${result.panels.length}`,
    ),
  );
  const copy = document.createElement("span");
  copy.className = "comic-card-copy";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const caption = document.createElement("span");
  caption.textContent = `${result.panels.length}컷 · 만화 읽기 ↗`;
  copy.append(heading, caption);
  button.append(thumbnail, copy);
  block.replaceChildren(button);
  let dialog: HTMLDialogElement | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let updateSize: (() => void) | undefined;
  let previousOverflow: string | undefined;
  const restore = () => {
    if (previousOverflow === undefined) return;
    document.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
    if (button.isConnected) button.focus();
  };
  const open = () => {
    if (!dialog) {
      const id = `slog-comic-viewer-${++nextId}`;
      dialog = document.createElement("dialog");
      dialog.className = "comic-viewer";
      dialog.setAttribute("aria-labelledby", `${id}-title`);
      dialog.setAttribute("aria-describedby", `${id}-help`);
      // 정적 UI만 HTML로 삽입한다. 사용자 제목과 SVG는 textContent와 img로 표시한다.
      dialog.innerHTML = `<div class="comic-viewer-toolbar"><h2 class="comic-viewer-title" id="${id}-title"></h2><button type="button" autofocus>닫기</button><div class="comic-viewer-controls"><label><input type="checkbox" checked>화면 넘침 방지</label><label>보기 크기 <select><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option></select></label></div></div><p class="comic-viewer-help" id="${id}-help">화면 넘침 방지를 끄면 가로·세로로 스크롤해 읽을 수 있습니다. 원래 컷 배치는 유지됩니다.</p><div class="comic-viewer-viewport" tabindex="0" role="region" aria-label="만화 읽기 영역"><div class="comic-viewer-artwork"></div></div>`;
      dialog.querySelector("h2")!.textContent = title;
      const viewport = dialog.querySelector<HTMLElement>(
        ".comic-viewer-viewport",
      )!;
      const artwork = dialog.querySelector<HTMLElement>(
        ".comic-viewer-artwork",
      )!;
      artwork.append(image(result.svg, result.width, result.height, title));
      const zoom = dialog.querySelector("select")!;
      const preventOverflow = dialog.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )!;
      updateSize = () => {
        if (!dialog?.open) return;
        viewport.dataset.preventOverflow = String(preventOverflow.checked);
        const targetWidth = result.width * Number(zoom.value);
        let width = targetWidth;
        if (preventOverflow.checked) {
          const style = getComputedStyle(viewport);
          const availableWidth = Math.max(
            0,
            viewport.clientWidth -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight),
          );
          const availableHeight = Math.max(
            0,
            viewport.clientHeight -
              parseFloat(style.paddingTop) -
              parseFloat(style.paddingBottom),
          );
          // 렌더 결과의 크기를 사용하므로 비동기 이미지 로딩 전에도 비율이 같다.
          width = Math.min(
            targetWidth,
            availableWidth,
            (availableHeight * result.width) / result.height,
          );
          viewport.scrollTo(0, 0);
        }
        artwork.style.width = `${width}px`;
      };
      zoom.addEventListener("change", updateSize);
      preventOverflow.addEventListener("change", updateSize);
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(viewport);
      dialog.querySelector("button")!.addEventListener("click", () => {
        dialog!.close();
        restore();
      });
      dialog.addEventListener("cancel", () => {
        dialog!.close();
        restore();
      });
      dialog.addEventListener("close", () => {
        if (!dialog?.open) restore();
      });
      dialog.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const controls = dialog!.querySelectorAll<HTMLElement>(
          "button, input, select, [tabindex='0']",
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (
          (!event.shiftKey && document.activeElement === last) ||
          (event.shiftKey && document.activeElement === first)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      });
      document.body.append(dialog);
    }
    dialog.querySelector("select")!.value = "1";
    dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked =
      true;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    updateSize!();
    dialog.querySelector(".comic-viewer-viewport")!.scrollTo(0, 0);
  };
  button.addEventListener("click", open);
  return () => {
    button.removeEventListener("click", open);
    resizeObserver?.disconnect();
    if (dialog?.open) dialog.close();
    restore();
    dialog?.remove();
    urls.forEach(URL.revokeObjectURL);
  };
}
