"use client";

import { Fragment, ReactNode, useRef } from "react";

export interface SplitItem {
  key: string;
  label: string;
  weight: number;
  node: ReactNode;
}

const KEY_STEP = 0.05;
const MIN_SHARE = 0.08;

/** 경계 핸들을 끌거나 방향키로 이웃한 두 영역의 상대 크기를 바꾼다. */
export default function Split({
  direction,
  items,
  onResize,
}: {
  direction: "row" | "column";
  items: SplitItem[];
  onResize: (weights: Record<string, number>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const horizontal = direction === "row";

  /** 끌기 중에는 시작 시점의 크기(base)를 기준으로 누적 이동량을 적용한다. */
  const move = (
    index: number,
    deltaShare: number,
    base = items[index].weight,
  ) => {
    const a = items[index];
    const b = items[index + 1];
    const pair = a.weight + b.weight;
    const min = MIN_SHARE * total;
    const next = Math.min(Math.max(base + deltaShare * total, min), pair - min);
    onResize({ [a.key]: next, [b.key]: pair - next });
  };

  const startDrag = (index: number, event: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    const size = horizontal ? container.clientWidth : container.clientHeight;
    const start = horizontal ? event.clientX : event.clientY;
    const base = items[index].weight;
    const onMove = (moveEvent: PointerEvent) => {
      const position = horizontal ? moveEvent.clientX : moveEvent.clientY;
      if (size > 0) move(index, (position - start) / size, base);
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 min-w-0 flex-1 ${horizontal ? "flex-row" : "flex-col"}`}
    >
      {items.map((item, index) => (
        <Fragment key={item.key}>
          <div
            className="flex min-h-0 min-w-0 flex-col overflow-hidden"
            style={{ flex: `${item.weight} 1 0` }}
          >
            {item.node}
          </div>
          {index < items.length - 1 && (
            <div
              role="separator"
              tabIndex={0}
              aria-orientation={horizontal ? "vertical" : "horizontal"}
              aria-label={`${item.label}와 ${items[index + 1].label} 크기 조절`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                (item.weight / (item.weight + items[index + 1].weight)) * 100,
              )}
              className={`code-lab-handle shrink-0 bg-border hover:bg-primary/50 focus-visible:bg-primary focus-visible:outline-none ${
                horizontal
                  ? "w-1.5 cursor-col-resize"
                  : "h-1.5 cursor-row-resize"
              }`}
              onPointerDown={(event) => startDrag(index, event)}
              onKeyDown={(event) => {
                const back = horizontal ? "ArrowLeft" : "ArrowUp";
                const forward = horizontal ? "ArrowRight" : "ArrowDown";
                if (event.key !== back && event.key !== forward) return;
                event.preventDefault();
                move(index, event.key === back ? -KEY_STEP : KEY_STEP);
              }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
