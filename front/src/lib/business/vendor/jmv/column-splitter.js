const KEY = 'jmv.code-memory-ratio.v1';
const DEFAULT = 0.4;
const GUTTER = 22; // 14px handle and two 4px grid gaps.

export function installColumnSplitter(root, bar, left) {
  let ratio = DEFAULT, drag = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Number.isFinite(saved) && saved > 0 && saved < 1) ratio = saved;
  } catch { /* Optional layout preference. */ }
  const bounds = () => {
    const available = Math.max(1, root.getBoundingClientRect().width - GUTTER);
    const min = Math.min(260, available / 2);
    return { available, min, max: available - min };
  };
  function apply() {
    const {available, min, max} = bounds();
    const width = Math.max(min, Math.min(max, ratio * available));
    root.style.setProperty('--code-pane-width', `${width}px`);
    const percent = Math.round(width / available * 100);
    bar.setAttribute('aria-valuemin', String(Math.round(min / available * 100)));
    bar.setAttribute('aria-valuemax', String(Math.round(max / available * 100)));
    bar.setAttribute('aria-valuenow', String(percent));
    bar.setAttribute('aria-valuetext', `코드 ${percent}% · 메모리 ${100-percent}%`);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(ratio)); } catch { /* Optional layout preference. */ }
  }
  function resize(width) {
    const {available, min, max} = bounds();
    ratio = Math.max(min, Math.min(max, width)) / available;
    apply();
  }
  function reset() { ratio = DEFAULT; save(); apply(); }
  bar.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); bar.focus();
    drag = {id:event.pointerId, x:event.clientX, width:left.getBoundingClientRect().width, previous:ratio};
    bar.setPointerCapture(event.pointerId);
    root.classList.add('column-dragging');
  });
  bar.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) resize(drag.width + event.clientX - drag.x);
  });
  function finish(event) {
    if (drag?.id !== event.pointerId) return;
    if (event.type !== 'pointerup') { ratio = drag.previous; apply(); }
    drag = null; save(); root.classList.remove('column-dragging');
    if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
  }
  for (const type of ['pointerup','pointercancel','lostpointercapture']) bar.addEventListener(type,finish);
  bar.addEventListener('dblclick', reset);
  bar.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End','Enter'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    if (event.key === 'Enter') { reset(); return; }
    const {available,min,max} = bounds();
    resize(event.key === 'Home' ? min : event.key === 'End' ? max
      : left.getBoundingClientRect().width + (event.key === 'ArrowRight' ? 1 : -1) * available * (event.shiftKey ? 0.08 : 0.02));
    save();
  });
  const observer = new ResizeObserver(apply);
  observer.observe(root); apply();
  return () => {
    observer.disconnect();
    if (drag) {
      const id=drag.id; drag=null;
      if (bar.hasPointerCapture(id)) bar.releasePointerCapture(id);
    }
    root.classList.remove('column-dragging');
  };
}
