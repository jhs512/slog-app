/*! Comic Gen browser SDK v0.5.0
*/
function I(e, o = 0) {
  return [...e.querySelectorAll("g[data-panel]")].map((r, s) => {
    if (r.getAttribute("data-panel") !== String(s + o))
      throw new TypeError("만화의 컷 순서가 올바르지 않습니다.");
    const a = r.querySelector("rect");
    if (!a) throw new TypeError("만화에 컷 프레임이 없습니다.");
    let c = new DOMMatrix();
    for (let d = a; d && d !== e.documentElement; d = d.parentElement) {
      let g = new DOMMatrix();
      const T = d.getAttribute("transform") ?? "", N = /(matrix|translate|scale|rotate|skewX|skewY)\(([^)]*)\)/g;
      let M = T;
      for (const F of T.matchAll(N)) {
        const y = F[2].trim().split(/[\s,]+/).map(Number);
        if (!y.length || y.some((q) => !Number.isFinite(q)))
          throw new TypeError("만화의 컷 변환이 올바르지 않습니다.");
        const [f, A = 0, P = 0] = y;
        switch (F[1]) {
          case "matrix":
            if (y.length !== 6)
              throw new TypeError("올바른 컷 행렬이 필요합니다.");
            g = g.multiply(new DOMMatrix(y));
            break;
          case "translate":
            g = g.translate(f, A);
            break;
          case "scale":
            g = g.scale(f, y[1] ?? f);
            break;
          case "rotate":
            g = g.translate(A, P).rotate(f).translate(-A, -P);
            break;
          case "skewX":
            g = g.skewX(f);
            break;
          case "skewY":
            g = g.skewY(f);
            break;
        }
        M = M.replace(F[0], "");
      }
      if (M.trim()) throw new TypeError("지원하지 않는 컷 변환입니다.");
      c = g.multiply(c);
    }
    const l = Number(a.getAttribute("x") ?? 0), i = Number(a.getAttribute("y") ?? 0), p = Number(a.getAttribute("width")), n = Number(a.getAttribute("height"));
    if (![l, i, p, n].every(Number.isFinite) || p <= 0 || n <= 0)
      throw new TypeError("만화의 컷 크기가 올바르지 않습니다.");
    const u = [
      [l, i],
      [l + p, i],
      [l, i + n],
      [l + p, i + n]
    ].map(([d, g]) => c.transformPoint(new DOMPoint(d, g))), E = Math.min(...u.map((d) => d.x)), x = Math.min(...u.map((d) => d.y));
    return {
      x: E,
      y: x,
      width: Math.max(...u.map((d) => d.x)) - E,
      height: Math.max(...u.map((d) => d.y)) - x
    };
  });
}
function H(e, o, r, s, a, c, l) {
  let i = 0, p = !1, n = 0;
  const u = () => {
    const t = e.getBoundingClientRect(), h = getComputedStyle(e);
    return {
      x: t.x + e.clientLeft + (parseFloat(h.paddingLeft) || 0),
      y: t.y + e.clientTop + (parseFloat(h.paddingTop) || 0)
    };
  }, E = () => {
    const t = o.getBoundingClientRect(), h = t.width / s;
    return r.map((v) => ({
      x: t.x + v.x * h,
      y: t.y + v.y * h,
      width: v.width * h,
      height: v.height * h
    }));
  }, x = () => {
    a.disabled = i === 0, c.disabled = i === r.length - 1, (document.activeElement === a && a.disabled || document.activeElement === c && c.disabled) && e.focus();
    const t = `${i + 1} / ${r.length}컷`;
    l.textContent !== t && (l.textContent = t);
  }, d = () => {
    if (p) return;
    const t = u(), h = e.clientWidth - (parseFloat(getComputedStyle(e).paddingLeft) || 0) - (parseFloat(getComputedStyle(e).paddingRight) || 0), v = e.clientHeight - (parseFloat(getComputedStyle(e).paddingTop) || 0) - (parseFloat(getComputedStyle(e).paddingBottom) || 0);
    let k = -1, C = 1 / 0;
    E().forEach((L, Y) => {
      const B = Math.max(
        0,
        Math.min(L.x + L.width, t.x + h) - Math.max(L.x, t.x)
      ) * Math.max(
        0,
        Math.min(L.y + L.height, t.y + v) - Math.max(L.y, t.y)
      ), z = Math.hypot(
        Math.max(L.x - t.x, 0, t.x - L.x - L.width),
        Math.max(L.y - t.y, 0, t.y - L.y - L.height)
      );
      (B > k || B === k && z < C) && (k = B, C = z, i = Y);
    }), x();
  }, g = () => {
    cancelAnimationFrame(n), p = !0;
    const t = e.scrollLeft, h = e.scrollTop;
    n = requestAnimationFrame(() => {
      n = requestAnimationFrame(() => {
        p = !1, (e.scrollLeft !== t || e.scrollTop !== h) && d();
      });
    });
  }, T = (t, h = i) => {
    if (i = Math.max(0, Math.min(r.length - 1, h + t)), i === h) {
      x();
      return;
    }
    const v = E()[i], k = u();
    e.scrollTo({
      left: e.scrollLeft + v.x - k.x,
      top: e.scrollTop + v.y - k.y,
      behavior: "instant"
    }), g(), x();
  }, N = () => T(-1), M = () => T(1), F = (t) => {
    t.target !== e || t.altKey || t.ctrlKey || t.metaKey || t.shiftKey || (t.key === "ArrowLeft" || t.key === "ArrowRight") && (t.preventDefault(), T(t.key === "ArrowLeft" ? -1 : 1));
  }, y = /* @__PURE__ */ new Set();
  let f, A = !1;
  const P = (t) => {
    if (y.add(t.pointerId), A = !1, y.size !== 1 || !t.isPrimary || t.button !== 0) {
      f = void 0;
      return;
    }
    f = {
      id: t.pointerId,
      x: t.clientX,
      y: t.clientY,
      moved: !1
    };
  }, q = (t) => {
    f?.id === t.pointerId && Math.hypot(t.clientX - f.x, t.clientY - f.y) > 8 && (f.moved = !0);
  }, m = (t) => {
    A = y.size === 1 && f?.id === t.pointerId && !f.moved, y.delete(t.pointerId), f = void 0;
  }, b = (t) => {
    t ? y.delete(t.pointerId) : y.clear(), f = void 0, A = !1;
  }, w = (t) => {
    const h = A;
    if (A = !1, !h || t.detail > 1 || t.ctrlKey || t.metaKey || t.altKey || t.shiftKey || t.target !== o)
      return;
    const v = E(), k = v.findIndex(
      (C) => t.clientX >= C.x && t.clientX <= C.x + C.width && t.clientY >= C.y && t.clientY <= C.y + C.height
    );
    k >= 0 && (e.focus({ preventScroll: !0 }), T(
      t.clientX < v[k].x + v[k].width / 2 ? -1 : 1,
      k
    ));
  }, S = (t) => {
    e.contains(t.target) || b(t);
  };
  return o.draggable = !1, a.addEventListener("click", N), c.addEventListener("click", M), e.addEventListener("scroll", d), e.addEventListener("keydown", F), e.addEventListener("pointerdown", P), e.addEventListener("pointermove", q), e.addEventListener("pointerup", m), e.addEventListener("pointercancel", b), e.addEventListener("click", w), document.addEventListener("pointerup", S), document.addEventListener("pointercancel", S), x(), {
    capturePosition: () => {
      const t = u(), h = o.getBoundingClientRect(), v = h.width / s;
      return { x: (t.x - h.x) / v, y: (t.y - h.y) / v };
    },
    restorePosition: (t) => {
      const h = e.scrollLeft, v = e.scrollTop, k = o.getBoundingClientRect(), C = u(), L = k.width / s;
      e.scrollTo({
        left: e.scrollLeft + k.x + t.x * L - C.x,
        top: e.scrollTop + k.y + t.y * L - C.y,
        behavior: "instant"
      }), (e.scrollLeft !== h || e.scrollTop !== v) && g(), x();
    },
    reset: () => {
      cancelAnimationFrame(n), p = !1, i = 0, b(), x();
    },
    dispose: () => {
      cancelAnimationFrame(n), a.removeEventListener("click", N), c.removeEventListener("click", M), e.removeEventListener("scroll", d), e.removeEventListener("keydown", F), e.removeEventListener("pointerdown", P), e.removeEventListener("pointermove", q), e.removeEventListener("pointerup", m), e.removeEventListener("pointercancel", b), e.removeEventListener("click", w), document.removeEventListener("pointerup", S), document.removeEventListener("pointercancel", S), b();
    }
  };
}
const U = `
.comic-card[data-comic-gen-card] { box-sizing:border-box; display:flex; align-items:center; gap:18px; width:100%; max-width:540px; padding:16px; border:1px solid #dbe3ee; border-radius:16px; background:white; color:#233044; text-align:left; font:14px/1.6 system-ui,sans-serif; cursor:pointer; }
.comic-card[data-comic-gen-card]:hover { background:#f8faff; border-color:#4c64e8; }
.comic-card[data-comic-gen-card]:focus-visible, .comic-viewer[data-comic-gen-viewer] :is(button,input,select,.comic-viewer-viewport):focus-visible { outline:3px solid #8096ff; outline-offset:3px; }
[data-comic-gen-card] .comic-card-thumbnail { display:block; flex:0 0 112px; width:112px; height:96px; overflow:hidden; border-radius:10px; background:#f5f7fb; }
[data-comic-gen-card] .comic-card-thumbnail img { display:block; width:100%; max-width:none; height:auto; margin:0; }
[data-comic-gen-card] .comic-card-copy { display:grid; gap:6px; min-width:0; overflow-wrap:anywhere; }
[data-comic-gen-card] .comic-card-copy strong { font-size:17px; }
[data-comic-gen-card] .comic-card-copy span { color:#526fea; font-size:13px; }
.comic-viewer[data-comic-gen-viewer] { box-sizing:border-box; margin:auto; width:calc(100vw - 48px); max-width:1800px; height:calc(100dvh - 48px); max-height:none; padding:0; border:1px solid #dbe3ee; border-radius:16px; background:#f5f7fb; color:#233044; font:14px/1.6 system-ui,sans-serif; overflow:hidden; }
.comic-viewer[data-comic-gen-viewer][open] { display:flex; flex-direction:column; }
.comic-viewer[data-comic-gen-viewer]::backdrop { background:#162339b3; }
[data-comic-gen-viewer] .comic-viewer-toolbar { flex:none; display:flex; align-items:center; flex-wrap:wrap; gap:12px; padding:16px 20px; background:white; border-bottom:1px solid #dbe3ee; }
[data-comic-gen-viewer] .comic-viewer-title { margin:0 auto 0 0; min-width:0; font-size:18px; color:inherit; letter-spacing:0; overflow-wrap:anywhere; }
[data-comic-gen-viewer] .comic-viewer-controls { display:flex; align-items:center; flex-wrap:wrap; gap:12px; max-width:100%; }
[data-comic-gen-viewer] .comic-viewer-navigation { display:flex; align-items:center; gap:12px; }
[data-comic-gen-viewer] .comic-viewer-controls label { display:flex; align-items:center; gap:8px; margin:0; color:inherit; font-size:13px; white-space:nowrap; }
[data-comic-gen-viewer] .comic-viewer-checkbox input { flex:none; width:16px; height:16px; margin:0; padding:0; accent-color:#526fea; cursor:pointer; }
[data-comic-gen-viewer] :is(button,select) { border:1px solid #dbe3ee; border-radius:8px; background:white; color:#344055; padding:8px 12px; font:inherit; cursor:pointer; }
[data-comic-gen-viewer] button:disabled { opacity:.4; cursor:default; }
[data-comic-gen-viewer] .comic-position { min-width:5rem; text-align:center; font-variant-numeric:tabular-nums; }
[data-comic-gen-viewer] .comic-viewer-help { flex:none; margin:0; padding:8px 20px; font-size:12px; color:#69778b; }
[data-comic-gen-viewer] .comic-viewer-viewport { box-sizing:border-box; flex:1; min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain; padding:16px; }
[data-comic-gen-viewer] .comic-viewer-viewport[data-prevent-overflow="true"] { overflow-x:hidden; overflow-y:auto; }
[data-comic-gen-viewer] .comic-viewer-artwork { margin:0 auto; }
[data-comic-gen-viewer] .comic-viewer-artwork img { display:block; width:100%; max-width:none; height:auto; margin:0; user-select:none; }
@media (max-width:600px) {
  .comic-viewer[data-comic-gen-viewer] { width:100vw; max-width:none; height:100dvh; margin:0; border:0; border-radius:0; }
  [data-comic-gen-viewer] .comic-viewer-toolbar { padding:12px; gap:10px; }
  [data-comic-gen-viewer] .comic-viewer-title { flex-basis:calc(100% - 80px); font-size:16px; }
  [data-comic-gen-viewer] .comic-viewer-controls { width:100%; }
  [data-comic-gen-viewer] .comic-viewer-navigation { flex-basis:100%; justify-content:center; }
  [data-comic-gen-viewer] .comic-viewer-help { padding:8px 12px; }
  [data-comic-gen-viewer] .comic-viewer-viewport { padding:8px; }
  .comic-card[data-comic-gen-card] { gap:12px; padding:12px; }
  [data-comic-gen-card] .comic-card-thumbnail { flex-basis:88px; width:88px; height:80px; }
}
`, G = "http://www.w3.org/2000/svg", O = /^#[\p{L}_][\p{L}\p{N}_:.-]*$/u, j = /* @__PURE__ */ new Set([
  "fill",
  "stroke",
  "filter",
  "mask",
  "clip-path",
  "marker-start",
  "marker-mid",
  "marker-end",
  "cursor"
]), W = /* @__PURE__ */ new Set([
  "svg",
  "g",
  "defs",
  "title",
  "desc",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "textPath",
  "use",
  "symbol",
  "marker",
  "clipPath",
  "mask",
  "pattern",
  "linearGradient",
  "radialGradient",
  "stop",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix",
  "feComposite",
  "feFlood",
  "feMerge",
  "feMergeNode",
  "feDropShadow",
  "feComponentTransfer",
  "feFuncA",
  "feFuncR",
  "feFuncG",
  "feFuncB",
  "feMorphology",
  "feConvolveMatrix",
  "feDisplacementMap",
  "feTurbulence",
  "feDiffuseLighting",
  "feSpecularLighting",
  "feDistantLight",
  "fePointLight",
  "feSpotLight",
  "feTile"
]);
function D(e) {
  if (!e || typeof e.svg != "string" || !e.svg || e.svg.length > 64e6 || !Number.isFinite(e.width) || e.width <= 0 || e.width > 1e6 || !Number.isFinite(e.height) || e.height <= 0 || e.height > 1e6 || e.diagnostics !== void 0 && (!Array.isArray(e.diagnostics) || e.diagnostics.length))
    throw new TypeError("완성된 코믹젠 렌더 결과가 필요합니다.");
  if (/<!DOCTYPE|<!ENTITY|<\?/i.test(e.svg))
    throw new TypeError("정적 코믹젠 SVG만 뷰어에 전달하세요.");
  const o = new DOMParser().parseFromString(e.svg, "image/svg+xml"), r = o.documentElement, s = (r.getAttribute("viewBox") ?? `0 0 ${e.width} ${e.height}`).trim().split(/[\s,]+/).map(Number);
  if (r.localName !== "svg" || r.namespaceURI !== G || o.querySelector("parsererror") || s.length !== 4 || s[0] !== 0 || s[1] !== 0 || s[2] !== e.width || s[3] !== e.height || Number(r.getAttribute("width")) !== e.width || Number(r.getAttribute("height")) !== e.height)
    throw new TypeError("만화 SVG와 렌더 결과의 크기가 일치해야 합니다.");
  for (const a of [r, ...r.querySelectorAll("*")]) {
    if (a.namespaceURI !== G || !W.has(a.localName))
      throw new TypeError("외부 리소스나 실행 가능한 SVG는 지원하지 않습니다.");
    for (const c of a.attributes) {
      const l = c.localName.toLowerCase(), i = c.value;
      if (l.startsWith("on") || l === "base" && c.namespaceURI === "http://www.w3.org/XML/1998/namespace" || l === "href" && !O.test(i))
        throw new TypeError(
          "외부 링크나 이벤트가 포함된 SVG는 지원하지 않습니다."
        );
      if (l === "style" && /@|javascript\s*:|vbscript\s*:|expression\s*\(|[\\<>]/i.test(i))
        throw new TypeError("정적 코믹젠 SVG 스타일만 지원합니다.");
      if (j.has(l) && /[\\<>@]/.test(i))
        throw new TypeError("정적 코믹젠 SVG 색상과 참조만 지원합니다.");
      for (const p of i.matchAll(/url\s*\(([^)]*)\)/gi)) {
        const n = p[1].trim().replace(/^(['"])(.*)\1$/, "$2");
        if (!O.test(n))
          throw new TypeError("SVG의 외부 리소스는 지원하지 않습니다.");
      }
    }
  }
  return o;
}
function V(e) {
  const o = D(e);
  if (!Array.isArray(e.panels) || e.panels.length < 1 || e.panels.length > 30)
    throw new TypeError("만화에는 실제 렌더된 1~30개의 컷이 필요합니다.");
  const r = [], s = e.panels.map((i, p) => {
    if (i.index !== p)
      throw new TypeError("만화의 개별 컷 순서가 일치해야 합니다.");
    const n = I(D(i), p);
    if (n.length !== 1 || ![n[0].x, n[0].y, n[0].width, n[0].height].every(
      Number.isFinite
    ) || n[0].width <= 0 || n[0].height <= 0 || n[0].x < 0 || n[0].y < 0 || n[0].x + n[0].width > i.width + 1 || n[0].y + n[0].height > i.height + 1)
      throw new TypeError("개별 컷 SVG에는 한 개의 컷 프레임이 필요합니다.");
    return r.push(n[0]), { ...i };
  }), a = I(o);
  if (a.length !== s.length || a.some(
    (i) => ![i.x, i.y, i.width, i.height].every(Number.isFinite) || i.width <= 0 || i.height <= 0 || i.x < 0 || i.y < 0 || i.x + i.width > e.width + 1 || i.y + i.height > e.height + 1
  ))
    throw new TypeError("만화의 컷 프레임과 렌더 결과가 일치해야 합니다.");
  const c = o.documentElement.getAttribute("aria-label") ?? o.documentElement.querySelector("title")?.textContent ?? "만화", l = s.map((i, p) => {
    const n = a[p], u = r[p], E = Math.max(
      n.width / u.width,
      n.height / u.height
    );
    return { width: i.width * E, height: i.height * E };
  });
  return {
    result: { ...e, panels: s },
    title: c,
    bounds: a,
    panelWidth: Math.max(...l.map((i) => i.width)),
    panelHeight: Math.max(...l.map((i) => i.height))
  };
}
const R = /* @__PURE__ */ Symbol.for("comic-gen.viewer.document-state.v1");
function $() {
  const e = document;
  return e[R] || Object.defineProperty(e, R, {
    value: { bodyLocks: /* @__PURE__ */ new WeakMap(), nextId: 0 }
  }), e[R];
}
function K() {
  const e = $();
  let o = e.styles;
  if (o)
    o.element.isConnected || document.head.append(o.element);
  else {
    const s = document.createElement("style");
    s.dataset.comicGenViewerStyles = "", s.textContent = U, document.head.append(s), o = { element: s, count: 0 }, e.styles = o;
  }
  o.count++;
  let r = !1;
  return () => {
    r || (r = !0, --o.count === 0 && (o.element.remove(), e.styles = void 0));
  };
}
function _() {
  const e = $().bodyLocks, o = document.body;
  let r = e.get(o);
  r || (r = {
    count: 0,
    value: o.style.getPropertyValue("overflow"),
    priority: o.style.getPropertyPriority("overflow")
  }, e.set(o, r), o.style.setProperty("overflow", "hidden", "important")), r.count++;
  let s = !1;
  return () => {
    s || (s = !0, --r.count === 0 && (r.value ? o.style.setProperty("overflow", r.value, r.priority) : o.style.removeProperty("overflow"), e.delete(o)));
  };
}
function X(e, o, r, s) {
  const a = document.createElement("img"), c = URL.createObjectURL(new Blob([e], { type: "image/svg+xml" }));
  Object.assign(a, {
    src: c,
    width: o,
    height: r,
    alt: s,
    decoding: "async",
    draggable: !1
  });
  let l = !1;
  return {
    image: a,
    revoke: () => {
      l || (l = !0, URL.revokeObjectURL(c));
    }
  };
}
function J() {
  let e, o, r, s, a, c, l, i, p, n, u, E, x, d, g, T, N = !1;
  const M = () => {
    if (!e?.open || !n) return;
    const m = u?.capturePosition();
    o.dataset.preventOverflow = String(c.checked);
    const b = n.result;
    let w = b.width * Number(a.value);
    if (c.checked) {
      const S = getComputedStyle(o), t = Math.max(
        0,
        o.clientWidth - (parseFloat(S.paddingLeft) || 0) - (parseFloat(S.paddingRight) || 0)
      ), h = Math.max(
        0,
        o.clientHeight - (parseFloat(S.paddingTop) || 0) - (parseFloat(S.paddingBottom) || 0)
      );
      w = Math.min(
        w,
        t * b.width / n.panelWidth,
        h * b.width / n.panelHeight
      );
    }
    r.style.width = `${Math.max(0, w)}px`, m && Number.isFinite(m.x) && Number.isFinite(m.y) && u?.restorePosition(m);
  }, F = () => {
    u?.dispose(), u = void 0, x?.(), x = void 0, r?.replaceChildren(), n = void 0, d?.(), d = void 0;
    const m = T;
    T = void 0;
    const b = [
      ...document.querySelectorAll("dialog[open]")
    ].find((w) => w !== e);
    m?.isConnected && (!b || b.contains(m)) && m.focus({ preventScroll: !0 });
  }, y = () => {
    e?.open && e.close(), F();
  }, f = (m) => {
    m.preventDefault(), y();
  }, A = () => {
    e?.open || F();
  }, P = (m) => {
    if (m.key !== "Tab" || !e?.open) return;
    const b = [
      ...e.querySelectorAll(
        "button:not(:disabled), input, select, [tabindex='0']"
      )
    ], w = b[0], S = b[b.length - 1];
    (!m.shiftKey && document.activeElement === S || m.shiftKey && document.activeElement === w) && (m.preventDefault(), (m.shiftKey ? S : w).focus());
  }, q = () => {
    if (e) return;
    g = K();
    const m = `comic-gen-viewer-${++$().nextId}`;
    e = document.createElement("dialog"), e.className = "comic-viewer", e.dataset.comicGenViewer = "", e.setAttribute("aria-labelledby", `${m}-title`), e.setAttribute("aria-describedby", `${m}-help`), e.innerHTML = `<div class="comic-viewer-toolbar"><h2 class="comic-viewer-title" id="${m}-title"></h2><button type="button" autofocus>닫기</button><div class="comic-viewer-controls"><label class="comic-viewer-checkbox"><input type="checkbox" checked>화면 넘침 방지</label><label>보기 크기 <select><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option></select></label><div class="comic-viewer-navigation"><button type="button" class="comic-previous" aria-label="이전 컷">←</button><span class="comic-position" role="status" aria-live="polite"></span><button type="button" class="comic-next" aria-label="다음 컷">→</button></div></div></div><p class="comic-viewer-help" id="${m}-help">화면 넘침 방지는 한 컷의 너비·높이를 화면에 맞춥니다. 다음 컷은 아래로 스크롤해 읽습니다. 컷 왼쪽은 이전, 오른쪽은 다음 컷입니다. 읽기 영역에서 ←/→ 키로도 이동합니다.</p><div class="comic-viewer-viewport" tabindex="0" role="region" aria-label="만화 읽기 영역"><div class="comic-viewer-artwork"></div></div>`, s = e.querySelector("h2"), o = e.querySelector(".comic-viewer-viewport"), r = e.querySelector(".comic-viewer-artwork"), a = e.querySelector("select"), c = e.querySelector('input[type="checkbox"]'), l = e.querySelector(".comic-previous"), i = e.querySelector(".comic-next"), p = e.querySelector(".comic-position"), a.addEventListener("change", M), c.addEventListener("change", M), e.querySelector("button").addEventListener("click", y), e.addEventListener("cancel", f), e.addEventListener("close", A), e.addEventListener("keydown", P), document.body.append(e), E = new ResizeObserver(M), E.observe(o);
  };
  return {
    get isOpen() {
      return !!e?.open;
    },
    open: (m, b = {}) => {
      if (N) throw new Error("폐기한 만화 뷰어는 다시 열 수 없습니다.");
      const w = V(m), S = b.trigger ?? (e?.open ? T : document.activeElement instanceof HTMLElement ? document.activeElement : void 0);
      q(), u?.dispose(), x?.(), n = w, T = S, s.textContent = w.title, a.value = "1", c.checked = !0;
      const t = X(
        w.result.svg,
        w.result.width,
        w.result.height,
        w.title
      );
      if (x = t.revoke, r.replaceChildren(t.image), u = H(
        o,
        t.image,
        w.bounds,
        w.result.width,
        l,
        i,
        p
      ), !e.open) {
        d = _();
        try {
          e.showModal();
        } catch (h) {
          throw F(), h;
        }
      }
      M(), o.scrollTo(0, 0), u.reset(), e.querySelector("button").focus({ preventScroll: !0 });
    },
    close: y,
    destroy: () => {
      N || (N = !0, y(), E?.disconnect(), e && (a.removeEventListener("change", M), c.removeEventListener("change", M), e.querySelector("button").removeEventListener("click", y), e.removeEventListener("cancel", f), e.removeEventListener("close", A), e.removeEventListener("keydown", P), e.remove()), g?.(), g = void 0);
    }
  };
}
function Q(e, o) {
  const r = V(o), s = K(), a = J(), c = document.createElement("button");
  c.type = "button", c.className = "comic-card", c.dataset.comicGenCard = "", c.setAttribute("aria-haspopup", "dialog"), c.setAttribute("aria-label", `${r.title} · 만화 읽기`);
  const l = document.createElement("span");
  l.className = "comic-card-thumbnail", l.setAttribute("aria-hidden", "true");
  const i = r.result.panels[0], p = X(
    i.svg,
    i.width,
    i.height,
    `${r.title} · 1/${r.result.panels.length}`
  );
  l.append(p.image);
  const n = document.createElement("span");
  n.className = "comic-card-copy";
  const u = document.createElement("strong");
  u.textContent = r.title;
  const E = document.createElement("span");
  E.textContent = `${r.result.panels.length}컷 · 만화 읽기 ↗`, n.append(u, E), c.append(l, n);
  const x = () => a.open(r.result, { trigger: c });
  c.addEventListener("click", x), e.replaceChildren(c);
  let d = !1;
  return () => {
    d || (d = !0, c.removeEventListener("click", x), a.destroy(), p.revoke(), c.remove(), s());
  };
}
export {
  J as createComicViewer,
  Q as mountComicCard,
  J as 만화뷰어만들기,
  Q as 만화카드붙이기
};
