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
      dialog.innerHTML = `<div class="comic-viewer-toolbar"><h2 class="comic-viewer-title" id="${id}-title"></h2><button type="button" autofocus>닫기</button><label>보기 크기 <select><option value="fit">화면 너비 맞춤</option><option value="1">원본 크기 (100%)</option><option value="1.5">확대 (150%)</option><option value="2">확대 (200%)</option></select></label></div><p class="comic-viewer-help" id="${id}-help">확대하면 가로·세로로 스크롤해 읽을 수 있습니다. 원래 컷 배치는 유지됩니다.</p><div class="comic-viewer-viewport" tabindex="0" role="region" aria-label="만화 읽기 영역"><div class="comic-viewer-artwork"></div></div>`;
      dialog.querySelector("h2")!.textContent = title;
      const artwork = dialog.querySelector<HTMLElement>(
        ".comic-viewer-artwork",
      )!;
      artwork.append(image(result.svg, result.width, result.height, title));
      const zoom = dialog.querySelector("select")!;
      zoom.addEventListener("change", () => {
        artwork.style.width =
          zoom.value === "fit"
            ? "100%"
            : `${result.width * Number(zoom.value)}px`;
      });
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
          "button, select, [tabindex='0']",
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
    dialog.querySelector("select")!.value = "fit";
    dialog.querySelector<HTMLElement>(".comic-viewer-artwork")!.style.width =
      "100%";
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector(".comic-viewer-viewport")!.scrollTo(0, 0);
  };
  button.addEventListener("click", open);
  return () => {
    button.removeEventListener("click", open);
    if (dialog?.open) dialog.close();
    restore();
    dialog?.remove();
    urls.forEach(URL.revokeObjectURL);
  };
}
