export interface PanelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 사용자 SVG를 실행하지 않고 프레임과 상위 변환에서 컷 좌표를 읽는다. */
export function readPanelBounds(source: string): PanelBounds[] {
  const xml = new DOMParser().parseFromString(source, "image/svg+xml");
  return [...xml.querySelectorAll("g[data-panel]")].map((group) => {
    const rect = group.querySelector("rect")!;
    let matrix = new DOMMatrix();
    for (
      let node: Element | null = rect;
      node && node !== xml.documentElement;
      node = node.parentElement
    ) {
      let local = new DOMMatrix();
      for (const match of (node.getAttribute("transform") ?? "").matchAll(
        /(matrix|translate|scale|rotate|skewX|skewY)\(([^)]*)\)/g,
      )) {
        const values = match[2]
          .trim()
          .split(/[\s,]+/)
          .map(Number);
        const [a, b = 0, c = 0] = values;
        switch (match[1]) {
          case "matrix":
            local = local.multiply(new DOMMatrix(values));
            break;
          case "translate":
            local = local.translate(a, b);
            break;
          case "scale":
            local = local.scale(a, values[1] ?? a);
            break;
          case "rotate":
            local = local.translate(b, c).rotate(a).translate(-b, -c);
            break;
          case "skewX":
            local = local.skewX(a);
            break;
          case "skewY":
            local = local.skewY(a);
            break;
        }
      }
      matrix = local.multiply(matrix);
    }
    const x = Number(rect.getAttribute("x")),
      y = Number(rect.getAttribute("y"));
    const w = Number(rect.getAttribute("width")),
      h = Number(rect.getAttribute("height"));
    const points = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ].map(([px, py]) => matrix.transformPoint(new DOMPoint(px, py)));
    const left = Math.min(...points.map((p) => p.x)),
      top = Math.min(...points.map((p) => p.y));
    return {
      x: left,
      y: top,
      width: Math.max(...points.map((p) => p.x)) - left,
      height: Math.max(...points.map((p) => p.y)) - top,
    };
  });
}

export function mountPanelNavigation(
  viewport: HTMLElement,
  img: HTMLImageElement,
  panels: PanelBounds[],
  originalWidth: number,
  previous: HTMLButtonElement,
  next: HTMLButtonElement,
  status: HTMLElement,
): { dispose: () => void; reset: () => void } {
  let current = 0,
    moving = false,
    frame = 0;
  const screenPanels = () => {
    const bounds = img.getBoundingClientRect(),
      scale = bounds.width / originalWidth;
    return panels.map((p) => ({
      x: bounds.x + p.x * scale,
      y: bounds.y + p.y * scale,
      width: p.width * scale,
      height: p.height * scale,
    }));
  };
  const announce = () => {
    previous.disabled = current === 0;
    next.disabled = current === panels.length - 1;
    if (
      (document.activeElement === previous && previous.disabled) ||
      (document.activeElement === next && next.disabled)
    )
      viewport.focus();
    const label = `${current + 1} / ${panels.length}컷`;
    if (status.textContent !== label) status.textContent = label;
  };
  const onScroll = () => {
    if (moving) return;
    const bounds = viewport.getBoundingClientRect(),
      style = getComputedStyle(viewport);
    const x =
      bounds.x + viewport.clientLeft + parseFloat(style.paddingLeft) + 1;
    const y = bounds.y + viewport.clientTop + parseFloat(style.paddingTop) + 1;
    let nearest = Infinity;
    screenPanels().forEach((p, index) => {
      const distance = Math.hypot(
        Math.max(p.x - x, 0, x - p.x - p.width),
        Math.max(p.y - y, 0, y - p.y - p.height),
      );
      if (distance < nearest) {
        nearest = distance;
        current = index;
      }
    });
    announce();
  };
  const go = (direction: number, from = current) => {
    const target = Math.max(0, Math.min(panels.length - 1, from + direction));
    current = target;
    if (target === from) {
      announce();
      return;
    }
    const p = screenPanels()[current],
      bounds = viewport.getBoundingClientRect(),
      style = getComputedStyle(viewport);
    moving = true;
    viewport.scrollTo({
      left:
        viewport.scrollLeft +
        p.x -
        bounds.x -
        viewport.clientLeft -
        parseFloat(style.paddingLeft),
      top:
        viewport.scrollTop +
        p.y -
        bounds.y -
        viewport.clientTop -
        parseFloat(style.paddingTop),
      behavior: "instant",
    });
    announce();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        moving = false;
      });
    });
  };
  const back = () => go(-1),
    forward = () => go(1);
  const keyboard = (e: KeyboardEvent) => {
    if (
      e.target !== viewport ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey
    )
      return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    }
  };
  let pointer: { id: number; x: number; y: number; moved: boolean } | undefined;
  let tap = false;
  const down = (e: PointerEvent) => {
    tap = false;
    if (!e.isPrimary || e.button !== 0) {
      pointer = undefined;
      return;
    }
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  };
  const move = (e: PointerEvent) => {
    if (
      pointer &&
      pointer.id === e.pointerId &&
      Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 8
    )
      pointer.moved = true;
  };
  const up = (e: PointerEvent) => {
    tap = Boolean(pointer && pointer.id === e.pointerId && !pointer.moved);
    pointer = undefined;
  };
  const cancel = () => {
    pointer = undefined;
    tap = false;
  };
  const click = (e: MouseEvent) => {
    const valid = tap;
    tap = false;
    if (
      !valid ||
      e.detail > 1 ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.shiftKey ||
      e.target !== img
    )
      return;
    const bounds = screenPanels();
    const index = bounds.findIndex(
      (p) =>
        e.clientX >= p.x &&
        e.clientX <= p.x + p.width &&
        e.clientY >= p.y &&
        e.clientY <= p.y + p.height,
    );
    if (index >= 0)
      go(e.clientX < bounds[index].x + bounds[index].width / 2 ? -1 : 1, index);
  };
  img.draggable = false;
  previous.addEventListener("click", back);
  next.addEventListener("click", forward);
  viewport.addEventListener("scroll", onScroll);
  viewport.addEventListener("keydown", keyboard);
  viewport.addEventListener("pointerdown", down);
  viewport.addEventListener("pointermove", move);
  viewport.addEventListener("pointerup", up);
  viewport.addEventListener("pointercancel", cancel);
  viewport.addEventListener("click", click);
  announce();
  return {
    reset: () => {
      cancelAnimationFrame(frame);
      moving = false;
      current = 0;
      announce();
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      previous.removeEventListener("click", back);
      next.removeEventListener("click", forward);
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("keydown", keyboard);
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", cancel);
      viewport.removeEventListener("click", click);
    },
  };
}
