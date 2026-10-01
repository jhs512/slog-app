/*! Comic Gen browser SDK v0.5.0
Bundled yaml license:
Copyright Eemeli Aro <eemeli@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

*/
const Ai = "1", Ht = {
  client: {
    color: "#9fcdfa",
    faceY: 0,
    body: '<circle r="56" fill="#badcff"/><path d="M-24 -58h48" fill="none"/>'
  },
  server: {
    color: "#efb970",
    faceY: 0,
    body: '<rect x="-52" y="-54" width="104" height="108" rx="22" fill="#ffe0a8"/><path d="M-34 -36h42M-34 -27h26"/><circle cx="30" cy="-33" r="3" fill="#7bb79b"/>'
  },
  database: {
    color: "#b4a0ed",
    faceY: 5,
    body: '<path d="M-52 -39v79c0 23 104 23 104 0v-79" fill="#daccff"/><ellipse cy="-39" rx="52" ry="18" fill="#ece4ff"/><path d="M-52 24c0 23 104 23 104 0" fill="none"/>'
  }
}, Qt = {
  neutral: '<circle cx="-17" cy="-4" r="3.5"/><circle cx="17" cy="-4" r="3.5"/><path d="M-10 17q10 7 20 0" fill="none"/>',
  happy: '<path d="M-25 -2q8 -12 16 0m18 0q8 -12 16 0M-13 16q13 18 26 0" fill="none"/>',
  confused: '<circle cx="-17" cy="-4" r="3.5"/><circle cx="17" cy="-4" r="3.5"/><path d="M-24 -17l13 -5m21 1 14 4M-8 18q8 -6 16 0" fill="none"/>',
  sad: '<circle cx="-17" cy="-4" r="3.5"/><circle cx="17" cy="-4" r="3.5"/><path d="M-12 23q12 -14 24 0" fill="none"/>',
  angry: '<path d="M-25 -16l15 6m20 0 15 -6M-10 20h20" fill="none"/><circle cx="-17" cy="-1" r="3"/><circle cx="17" cy="-1" r="3"/>'
}, Xt = {
  wave: '<g data-hand="wave"><circle cx="-65" cy="-22" r="12" fill="white"/><path d="M-77 -42l-4 -8m15 2v-10m13 17 5 -7" fill="none"/></g>',
  point: '<g data-hand="point"><circle cx="-65" cy="0" r="11" fill="white"/><path d="M-77 0h-13" fill="none"/></g>'
}, Re = {
  request: '<rect x="-18" y="-13" width="36" height="26" rx="4" fill="#f9f0cd"/><path d="M-18 -13L0 1l18 -14" fill="none"/>',
  data: '<path d="M-16 -12v23c0 10 32 10 32 0v-23" fill="#daccff"/><ellipse cy="-12" rx="16" ry="6" fill="#ece4ff"/>',
  key: '<circle cx="-10" r="9" fill="#ffe0a8"/><path d="M0 0h21m-5 0v8m-8 -8v6" fill="none"/>'
};
function K(s) {
  return s.replace(
    /[&<>"']/g,
    (e) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    })[e]
  );
}
class Gs {
  constructor(e = 2e6) {
    if (this.maxBytes = e, !Number.isFinite(e) || e < 0)
      throw new Error("캐시 크기는 0 이상의 숫자여야 합니다.");
  }
  maxBytes;
  entries = /* @__PURE__ */ new Map();
  size = 0;
  get bytes() {
    return this.size;
  }
  get(e) {
    const t = this.entries.get(e);
    return t && (this.entries.delete(e), this.entries.set(e, t)), t;
  }
  set(e, t) {
    const n = this.entries.get(e);
    n && (this.size -= n.bytes, this.entries.delete(e));
    const i = (e.length + t.markup.length) * 2;
    if (!(i > this.maxBytes)) {
      for (; this.size + i > this.maxBytes && this.entries.size; ) {
        const r = this.entries.keys().next().value;
        this.size -= this.entries.get(r).bytes, this.entries.delete(r);
      }
      this.entries.set(e, { ...t, bytes: i }), this.size += i;
    }
  }
  clear() {
    this.entries.clear(), this.size = 0;
  }
}
const $t = /* @__PURE__ */ Symbol.for("yaml.alias"), dt = /* @__PURE__ */ Symbol.for("yaml.document"), ee = /* @__PURE__ */ Symbol.for("yaml.map"), Zt = /* @__PURE__ */ Symbol.for("yaml.pair"), Y = /* @__PURE__ */ Symbol.for("yaml.scalar"), ge = /* @__PURE__ */ Symbol.for("yaml.seq"), R = /* @__PURE__ */ Symbol.for("yaml.node.type"), ye = (s) => !!s && typeof s == "object" && s[R] === $t, Je = (s) => !!s && typeof s == "object" && s[R] === dt, Le = (s) => !!s && typeof s == "object" && s[R] === ee, C = (s) => !!s && typeof s == "object" && s[R] === Zt, T = (s) => !!s && typeof s == "object" && s[R] === Y, Me = (s) => !!s && typeof s == "object" && s[R] === ge;
function L(s) {
  if (s && typeof s == "object")
    switch (s[R]) {
      case ee:
      case ge:
        return !0;
    }
  return !1;
}
function M(s) {
  if (s && typeof s == "object")
    switch (s[R]) {
      case $t:
      case ee:
      case Y:
      case ge:
        return !0;
    }
  return !1;
}
const es = (s) => (T(s) || L(s)) && !!s.anchor, se = /* @__PURE__ */ Symbol("break visit"), Ys = /* @__PURE__ */ Symbol("skip children"), Oe = /* @__PURE__ */ Symbol("remove node");
function we(s, e) {
  const t = Js(e);
  Je(s) ? ce(null, s.contents, t, Object.freeze([s])) === Oe && (s.contents = null) : ce(null, s, t, Object.freeze([]));
}
we.BREAK = se;
we.SKIP = Ys;
we.REMOVE = Oe;
function ce(s, e, t, n) {
  const i = Ws(s, e, t, n);
  if (M(i) || C(i))
    return zs(s, n, i), ce(s, i, t, n);
  if (typeof i != "symbol") {
    if (L(e)) {
      n = Object.freeze(n.concat(e));
      for (let r = 0; r < e.items.length; ++r) {
        const o = ce(r, e.items[r], t, n);
        if (typeof o == "number")
          r = o - 1;
        else {
          if (o === se)
            return se;
          o === Oe && (e.items.splice(r, 1), r -= 1);
        }
      }
    } else if (C(e)) {
      n = Object.freeze(n.concat(e));
      const r = ce("key", e.key, t, n);
      if (r === se)
        return se;
      r === Oe && (e.key = null);
      const o = ce("value", e.value, t, n);
      if (o === se)
        return se;
      o === Oe && (e.value = null);
    }
  }
  return i;
}
function Js(s) {
  return typeof s == "object" && (s.Collection || s.Node || s.Value) ? Object.assign({
    Alias: s.Node,
    Map: s.Node,
    Scalar: s.Node,
    Seq: s.Node
  }, s.Value && {
    Map: s.Value,
    Scalar: s.Value,
    Seq: s.Value
  }, s.Collection && {
    Map: s.Collection,
    Seq: s.Collection
  }, s) : s;
}
function Ws(s, e, t, n) {
  if (typeof t == "function")
    return t(s, e, n);
  if (Le(e))
    return t.Map?.(s, e, n);
  if (Me(e))
    return t.Seq?.(s, e, n);
  if (C(e))
    return t.Pair?.(s, e, n);
  if (T(e))
    return t.Scalar?.(s, e, n);
  if (ye(e))
    return t.Alias?.(s, e, n);
}
function zs(s, e, t) {
  const n = e[e.length - 1];
  if (L(n))
    n.items[s] = t;
  else if (C(n))
    s === "key" ? n.key = t : n.value = t;
  else if (Je(n))
    n.contents = t;
  else {
    const i = ye(n) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${i} parent`);
  }
}
const Hs = {
  "!": "%21",
  ",": "%2C",
  "[": "%5B",
  "]": "%5D",
  "{": "%7B",
  "}": "%7D"
}, Qs = (s) => s.replace(/[!,[\]{}]/g, (e) => Hs[e]);
class x {
  constructor(e, t) {
    this.docStart = null, this.docEnd = !1, this.yaml = Object.assign({}, x.defaultYaml, e), this.tags = Object.assign({}, x.defaultTags, t);
  }
  clone() {
    const e = new x(this.yaml, this.tags);
    return e.docStart = this.docStart, e;
  }
  /**
   * During parsing, get a Directives instance for the current document and
   * update the stream state according to the current version's spec.
   */
  atDocument() {
    const e = new x(this.yaml, this.tags);
    switch (this.yaml.version) {
      case "1.1":
        this.atNextDocument = !0;
        break;
      case "1.2":
        this.atNextDocument = !1, this.yaml = {
          explicit: x.defaultYaml.explicit,
          version: "1.2"
        }, this.tags = Object.assign({}, x.defaultTags);
        break;
    }
    return e;
  }
  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(e, t) {
    this.atNextDocument && (this.yaml = { explicit: x.defaultYaml.explicit, version: "1.1" }, this.tags = Object.assign({}, x.defaultTags), this.atNextDocument = !1);
    const n = e.trim().split(/[ \t]+/), i = n.shift();
    switch (i) {
      case "%TAG": {
        if (n.length !== 2 && (t(0, "%TAG directive should contain exactly two parts"), n.length < 2))
          return !1;
        const [r, o] = n;
        return this.tags[r] = o, !0;
      }
      case "%YAML": {
        if (this.yaml.explicit = !0, n.length !== 1)
          return t(0, "%YAML directive should contain exactly one part"), !1;
        const [r] = n;
        if (r === "1.1" || r === "1.2")
          return this.yaml.version = r, !0;
        {
          const o = /^\d+\.\d+$/.test(r);
          return t(6, `Unsupported YAML version ${r}`, o), !1;
        }
      }
      default:
        return t(0, `Unknown directive ${i}`, !0), !1;
    }
  }
  /**
   * Resolves a tag, matching handles to those defined in %TAG directives.
   *
   * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
   *   `'!local'` tag, or `null` if unresolvable.
   */
  tagName(e, t) {
    if (e === "!")
      return "!";
    if (e[0] !== "!")
      return t(`Not a valid tag: ${e}`), null;
    if (e[1] === "<") {
      const o = e.slice(2, -1);
      return o === "!" || o === "!!" ? (t(`Verbatim tags aren't resolved, so ${e} is invalid.`), null) : (e[e.length - 1] !== ">" && t("Verbatim tags must end with a >"), o);
    }
    const [, n, i] = e.match(/^(.*!)([^!]*)$/s);
    i || t(`The ${e} tag has no suffix`);
    const r = this.tags[n];
    if (r)
      try {
        return r + decodeURIComponent(i);
      } catch (o) {
        return t(String(o)), null;
      }
    return n === "!" ? e : (t(`Could not resolve tag: ${e}`), null);
  }
  /**
   * Given a fully resolved tag, returns its printable string form,
   * taking into account current tag prefixes and defaults.
   */
  tagString(e) {
    for (const [t, n] of Object.entries(this.tags))
      if (e.startsWith(n))
        return t + Qs(e.substring(n.length));
    return e[0] === "!" ? e : `!<${e}>`;
  }
  toString(e) {
    const t = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [], n = Object.entries(this.tags);
    let i;
    if (e && n.length > 0 && M(e.contents)) {
      const r = {};
      we(e.contents, (o, l) => {
        M(l) && l.tag && (r[l.tag] = !0);
      }), i = Object.keys(r);
    } else
      i = [];
    for (const [r, o] of n)
      r === "!!" && o === "tag:yaml.org,2002:" || (!e || i.some((l) => l.startsWith(o))) && t.push(`%TAG ${r} ${o}`);
    return t.join(`
`);
  }
}
x.defaultYaml = { explicit: !1, version: "1.2" };
x.defaultTags = { "!!": "tag:yaml.org,2002:" };
function ts(s) {
  if (/[\x00-\x19\s,[\]{}]/.test(s)) {
    const t = `Anchor must not contain whitespace or control characters: ${JSON.stringify(s)}`;
    throw new Error(t);
  }
  return !0;
}
function ss(s) {
  const e = /* @__PURE__ */ new Set();
  return we(s, {
    Value(t, n) {
      n.anchor && e.add(n.anchor);
    }
  }), e;
}
function ns(s, e) {
  for (let t = 1; ; ++t) {
    const n = `${s}${t}`;
    if (!e.has(n))
      return n;
  }
}
function Xs(s, e) {
  const t = [], n = /* @__PURE__ */ new Map();
  let i = null;
  return {
    onAnchor: (r) => {
      t.push(r), i ?? (i = ss(s));
      const o = ns(e, i);
      return i.add(o), o;
    },
    /**
     * With circular references, the source node is only resolved after all
     * of its child nodes are. This is why anchors are set only after all of
     * the nodes have been created.
     */
    setAnchors: () => {
      for (const r of t) {
        const o = n.get(r);
        if (typeof o == "object" && o.anchor && (T(o.node) || L(o.node)))
          o.node.anchor = o.anchor;
        else {
          const l = new Error("Failed to resolve repeated object (this should not happen)");
          throw l.source = r, l;
        }
      }
    },
    sourceObjects: n
  };
}
function fe(s, e, t, n) {
  if (n && typeof n == "object")
    if (Array.isArray(n))
      for (let i = 0, r = n.length; i < r; ++i) {
        const o = n[i], l = fe(s, n, String(i), o);
        l === void 0 ? delete n[i] : l !== o && (n[i] = l);
      }
    else if (n instanceof Map)
      for (const i of Array.from(n.keys())) {
        const r = n.get(i), o = fe(s, n, i, r);
        o === void 0 ? n.delete(i) : o !== r && n.set(i, o);
      }
    else if (n instanceof Set)
      for (const i of Array.from(n)) {
        const r = fe(s, n, i, i);
        r === void 0 ? n.delete(i) : r !== i && (n.delete(i), n.add(r));
      }
    else
      for (const [i, r] of Object.entries(n)) {
        const o = fe(s, n, i, r);
        o === void 0 ? delete n[i] : o !== r && (n[i] = o);
      }
  return s.call(e, t, n);
}
function q(s, e, t) {
  if (Array.isArray(s))
    return s.map((n, i) => q(n, String(i), t));
  if (s && typeof s.toJSON == "function") {
    if (!t || !es(s))
      return s.toJSON(e, t);
    const n = { aliasCount: 0, count: 1, res: void 0 };
    t.anchors.set(s, n), t.onCreate = (r) => {
      n.res = r, delete t.onCreate;
    };
    const i = s.toJSON(e, t);
    return t.onCreate && t.onCreate(i), i;
  }
  return typeof s == "bigint" && !t?.keep ? Number(s) : s;
}
class St {
  constructor(e) {
    Object.defineProperty(this, R, { value: e });
  }
  /** Create a copy of this node.  */
  clone() {
    const e = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return this.range && (e.range = this.range.slice()), e;
  }
  /** A plain JavaScript representation of this node. */
  toJS(e, { mapAsMap: t, maxAliasCount: n, onAnchor: i, reviver: r } = {}) {
    if (!Je(e))
      throw new TypeError("A document argument is required");
    const o = {
      anchors: /* @__PURE__ */ new Map(),
      doc: e,
      keep: !0,
      mapAsMap: t === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof n == "number" ? n : 100
    }, l = q(this, "", o);
    if (typeof i == "function")
      for (const { count: a, res: c } of o.anchors.values())
        i(c, a);
    return typeof r == "function" ? fe(r, { "": l }, "", l) : l;
  }
}
class Nt extends St {
  constructor(e) {
    super($t), this.source = e, Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(e, t) {
    if (t?.maxAliasCount === 0)
      throw new ReferenceError("Alias resolution is disabled");
    let n;
    t?.aliasResolveCache ? n = t.aliasResolveCache : (n = [], we(e, {
      Node: (r, o) => {
        (ye(o) || es(o)) && n.push(o);
      }
    }), t && (t.aliasResolveCache = n));
    let i;
    for (const r of n) {
      if (r === this)
        break;
      r.anchor === this.source && (i = r);
    }
    if (i && t) {
      const { anchors: r, doc: o, maxAliasCount: l } = t;
      let a = r.get(i);
      if (a || (q(i, null, t), a = r.get(i)), a?.res === void 0) {
        const c = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(c);
      }
      if (l >= 0 && (a.count += 1, a.aliasCount === 0 && (a.aliasCount = Ke(o, i, r)), a.count * a.aliasCount > l)) {
        const c = "Excessive alias count indicates a resource exhaustion attack";
        throw new ReferenceError(c);
      }
    }
    return i;
  }
  toJSON(e, t) {
    if (!t)
      return { source: this.source };
    const n = this.resolve(t.doc, t);
    if (!n) {
      const i = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(i);
    }
    return t.anchors.get(n).res;
  }
  toString(e, t, n) {
    const i = `*${this.source}`;
    if (e) {
      if (ts(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
        const r = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(r);
      }
      if (e.implicitKey)
        return `${i} `;
    }
    return i;
  }
}
function Ke(s, e, t) {
  if (ye(e)) {
    const n = e.resolve(s), i = t && n && t.get(n);
    return i ? i.count * i.aliasCount : 0;
  } else if (L(e)) {
    let n = 0;
    for (const i of e.items) {
      const r = Ke(s, i, t);
      r > n && (n = r);
    }
    return n;
  } else if (C(e)) {
    const n = Ke(s, e.key, t), i = Ke(s, e.value, t);
    return Math.max(n, i);
  }
  return 1;
}
const is = (s) => !s || typeof s != "function" && typeof s != "object";
class O extends St {
  constructor(e) {
    super(Y), this.value = e;
  }
  toJSON(e, t) {
    return t?.keep ? this.value : q(this.value, e, t);
  }
  toString() {
    return String(this.value);
  }
}
O.BLOCK_FOLDED = "BLOCK_FOLDED";
O.BLOCK_LITERAL = "BLOCK_LITERAL";
O.PLAIN = "PLAIN";
O.QUOTE_DOUBLE = "QUOTE_DOUBLE";
O.QUOTE_SINGLE = "QUOTE_SINGLE";
const Zs = "tag:yaml.org,2002:";
function en(s, e, t) {
  if (e) {
    const n = t.filter((r) => r.tag === e), i = n.find((r) => !r.format) ?? n[0];
    if (!i)
      throw new Error(`Tag ${e} not found`);
    return i;
  }
  return t.find((n) => n.identify?.(s) && !n.format);
}
function Te(s, e, t) {
  if (Je(s) && (s = s.contents), M(s))
    return s;
  if (C(s)) {
    const u = t.schema[ee].createNode?.(t.schema, null, t);
    return u.items.push(s), u;
  }
  (s instanceof String || s instanceof Number || s instanceof Boolean || typeof BigInt < "u" && s instanceof BigInt) && (s = s.valueOf());
  const { aliasDuplicateObjects: n, onAnchor: i, onTagObj: r, schema: o, sourceObjects: l } = t;
  let a;
  if (n && s && typeof s == "object") {
    if (a = l.get(s), a)
      return a.anchor ?? (a.anchor = i(s)), new Nt(a.anchor);
    a = { anchor: null, node: null }, l.set(s, a);
  }
  e?.startsWith("!!") && (e = Zs + e.slice(2));
  let c = en(s, e, o.tags);
  if (!c) {
    if (s && typeof s.toJSON == "function" && (s = s.toJSON()), !s || typeof s != "object") {
      const u = new O(s);
      return a && (a.node = u), u;
    }
    c = s instanceof Map ? o[ee] : Symbol.iterator in Object(s) ? o[ge] : o[ee];
  }
  r && (r(c), delete t.onTagObj);
  const h = c?.createNode ? c.createNode(t.schema, s, t) : typeof c?.nodeClass?.from == "function" ? c.nodeClass.from(t.schema, s, t) : new O(s);
  return e ? h.tag = e : c.default || (h.tag = c.tag), a && (a.node = h), h;
}
function Ue(s, e, t) {
  let n = t;
  for (let i = e.length - 1; i >= 0; --i) {
    const r = e[i];
    if (typeof r == "number" && Number.isInteger(r) && r >= 0) {
      const o = [];
      o[r] = n, n = o;
    } else
      n = /* @__PURE__ */ new Map([[r, n]]);
  }
  return Te(n, void 0, {
    aliasDuplicateObjects: !1,
    keepUndefined: !1,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema: s,
    sourceObjects: /* @__PURE__ */ new Map()
  });
}
const Ne = (s) => s == null || typeof s == "object" && !!s[Symbol.iterator]().next().done;
class rs extends St {
  constructor(e, t) {
    super(e), Object.defineProperty(this, "schema", {
      value: t,
      configurable: !0,
      enumerable: !1,
      writable: !0
    });
  }
  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(e) {
    const t = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return e && (t.schema = e), t.items = t.items.map((n) => M(n) || C(n) ? n.clone(e) : n), this.range && (t.range = this.range.slice()), t;
  }
  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(e, t) {
    if (Ne(e))
      this.add(t);
    else {
      const [n, ...i] = e, r = this.get(n, !0);
      if (L(r))
        r.addIn(i, t);
      else if (r === void 0 && this.schema)
        this.set(n, Ue(this.schema, i, t));
      else
        throw new Error(`Expected YAML collection at ${n}. Remaining path: ${i}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(e) {
    const [t, ...n] = e;
    if (n.length === 0)
      return this.delete(t);
    const i = this.get(t, !0);
    if (L(i))
      return i.deleteIn(n);
    throw new Error(`Expected YAML collection at ${t}. Remaining path: ${n}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(e, t) {
    const [n, ...i] = e, r = this.get(n, !0);
    return i.length === 0 ? !t && T(r) ? r.value : r : L(r) ? r.getIn(i, t) : void 0;
  }
  hasAllNullValues(e) {
    return this.items.every((t) => {
      if (!C(t))
        return !1;
      const n = t.value;
      return n == null || e && T(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(e) {
    const [t, ...n] = e;
    if (n.length === 0)
      return this.has(t);
    const i = this.get(t, !0);
    return L(i) ? i.hasIn(n) : !1;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, t) {
    const [n, ...i] = e;
    if (i.length === 0)
      this.set(n, t);
    else {
      const r = this.get(n, !0);
      if (L(r))
        r.setIn(i, t);
      else if (r === void 0 && this.schema)
        this.set(n, Ue(this.schema, i, t));
      else
        throw new Error(`Expected YAML collection at ${n}. Remaining path: ${i}`);
    }
  }
}
const tn = (s) => s.replace(/^(?!$)(?: $)?/gm, "#");
function H(s, e) {
  return /^\n+$/.test(s) ? s.substring(1) : e ? s.replace(/^(?! *$)/gm, e) : s;
}
const ne = (s, e, t) => s.endsWith(`
`) ? H(t, e) : t.includes(`
`) ? `
` + H(t, e) : (s.endsWith(" ") ? "" : " ") + t, os = "flow", pt = "block", Fe = "quoted";
function We(s, e, t = "flow", { indentAtStart: n, lineWidth: i = 80, minContentWidth: r = 20, onFold: o, onOverflow: l } = {}) {
  if (!i || i < 0)
    return s;
  i < r && (r = 0);
  const a = Math.max(1 + r, 1 + i - e.length);
  if (s.length <= a)
    return s;
  const c = [], h = {};
  let u = i - e.length;
  typeof n == "number" && (n > i - Math.max(2, r) ? c.push(0) : u = i - n);
  let d, m, y = !1, f = -1, p = -1, $ = -1;
  t === pt && (f = Pt(s, f, e.length), f !== -1 && (u = f + a));
  for (let w; w = s[f += 1]; ) {
    if (t === Fe && w === "\\") {
      switch (p = f, s[f + 1]) {
        case "x":
          f += 3;
          break;
        case "u":
          f += 5;
          break;
        case "U":
          f += 9;
          break;
        default:
          f += 1;
      }
      $ = f;
    }
    if (w === `
`)
      t === pt && (f = Pt(s, f, e.length)), u = f + e.length + a, d = void 0;
    else {
      if (w === " " && m && m !== " " && m !== `
` && m !== "	") {
        const g = s[f + 1];
        g && g !== " " && g !== `
` && g !== "	" && (d = f);
      }
      if (f >= u)
        if (d)
          c.push(d), u = d + a, d = void 0;
        else if (t === Fe) {
          for (; m === " " || m === "	"; )
            m = w, w = s[f += 1], y = !0;
          const g = f > $ + 1 ? f - 2 : p - 1;
          if (h[g])
            return s;
          c.push(g), h[g] = !0, u = g + a, d = void 0;
        } else
          y = !0;
    }
    m = w;
  }
  if (y && l && l(), c.length === 0)
    return s;
  o && o();
  let S = s.slice(0, c[0]);
  for (let w = 0; w < c.length; ++w) {
    const g = c[w], k = c[w + 1] || s.length;
    g === 0 ? S = `
${e}${s.slice(0, k)}` : (t === Fe && h[g] && (S += `${s[g]}\\`), S += `
${e}${s.slice(g + 1, k)}`);
  }
  return S;
}
function Pt(s, e, t) {
  let n = e, i = e + 1, r = s[i];
  for (; r === " " || r === "	"; )
    if (e < i + t)
      r = s[++e];
    else {
      do
        r = s[++e];
      while (r && r !== `
`);
      n = e, i = e + 1, r = s[i];
    }
  return n;
}
const ze = (s, e) => ({
  indentAtStart: e ? s.indent.length : s.indentAtStart,
  lineWidth: s.options.lineWidth,
  minContentWidth: s.options.minContentWidth
}), He = (s) => /^(%|---|\.\.\.)/m.test(s);
function sn(s, e, t) {
  if (!e || e < 0)
    return !1;
  const n = e - t, i = s.length;
  if (i <= n)
    return !1;
  for (let r = 0, o = 0; r < i; ++r)
    if (s[r] === `
`) {
      if (r - o > n)
        return !0;
      if (o = r + 1, i - o <= n)
        return !1;
    }
  return !0;
}
function ve(s, e) {
  const t = JSON.stringify(s);
  if (e.options.doubleQuotedAsJSON)
    return t;
  const { implicitKey: n } = e, i = e.options.doubleQuotedMinMultiLineLength, r = e.indent || (He(s) ? "  " : "");
  let o = "", l = 0;
  for (let a = 0, c = t[a]; c; c = t[++a])
    if (c === " " && t[a + 1] === "\\" && t[a + 2] === "n" && (o += t.slice(l, a) + "\\ ", a += 1, l = a, c = "\\"), c === "\\")
      switch (t[a + 1]) {
        case "u":
          {
            o += t.slice(l, a);
            const h = t.substr(a + 2, 4);
            switch (h) {
              case "0000":
                o += "\\0";
                break;
              case "0007":
                o += "\\a";
                break;
              case "000b":
                o += "\\v";
                break;
              case "001b":
                o += "\\e";
                break;
              case "0085":
                o += "\\N";
                break;
              case "00a0":
                o += "\\_";
                break;
              case "2028":
                o += "\\L";
                break;
              case "2029":
                o += "\\P";
                break;
              default:
                h.substr(0, 2) === "00" ? o += "\\x" + h.substr(2) : o += t.substr(a, 6);
            }
            a += 5, l = a + 1;
          }
          break;
        case "n":
          if (n || t[a + 2] === '"' || t.length < i)
            a += 1;
          else {
            for (o += t.slice(l, a) + `

`; t[a + 2] === "\\" && t[a + 3] === "n" && t[a + 4] !== '"'; )
              o += `
`, a += 2;
            o += r, t[a + 2] === " " && (o += "\\"), a += 1, l = a + 1;
          }
          break;
        default:
          a += 1;
      }
  return o = l ? o + t.slice(l) : t, n ? o : We(o, r, Fe, ze(e, !1));
}
function mt(s, e) {
  if (e.options.singleQuote === !1 || e.implicitKey && s.includes(`
`) || /[ \t]\n|\n[ \t]/.test(s))
    return ve(s, e);
  const t = e.indent || (He(s) ? "  " : ""), n = "'" + s.replace(/'/g, "''").replace(/\n+/g, `$&
${t}`) + "'";
  return e.implicitKey ? n : We(n, t, os, ze(e, !1));
}
function ue(s, e) {
  const { singleQuote: t } = e.options;
  let n;
  if (t === !1)
    n = ve;
  else {
    const i = s.includes('"'), r = s.includes("'");
    i && !r ? n = mt : r && !i ? n = ve : n = t ? mt : ve;
  }
  return n(s, e);
}
let gt;
try {
  gt = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
} catch {
  gt = /\n+(?!\n|$)/g;
}
function qe({ comment: s, type: e, value: t }, n, i, r) {
  const { blockQuote: o, commentString: l, lineWidth: a } = n.options;
  if (!o || /\n[\t ]+$/.test(t))
    return ue(t, n);
  const c = n.indent || (n.forceBlockIndent || He(t) ? "  " : ""), h = o === "literal" ? !0 : o === "folded" || e === O.BLOCK_FOLDED ? !1 : e === O.BLOCK_LITERAL ? !0 : !sn(t, a, c.length);
  if (!t)
    return h ? `|
` : `>
`;
  let u, d;
  for (d = t.length; d > 0; --d) {
    const k = t[d - 1];
    if (k !== `
` && k !== "	" && k !== " ")
      break;
  }
  let m = t.substring(d);
  const y = m.indexOf(`
`);
  y === -1 ? u = "-" : t === m || y !== m.length - 1 ? (u = "+", r && r()) : u = "", m && (t = t.slice(0, -m.length), m[m.length - 1] === `
` && (m = m.slice(0, -1)), m = m.replace(gt, `$&${c}`));
  let f = !1, p, $ = -1;
  for (p = 0; p < t.length; ++p) {
    const k = t[p];
    if (k === " ")
      f = !0;
    else if (k === `
`)
      $ = p;
    else
      break;
  }
  let S = t.substring(0, $ < p ? $ + 1 : p);
  S && (t = t.substring(S.length), S = S.replace(/\n+/g, `$&${c}`));
  let g = (f ? c ? "2" : "1" : "") + u;
  if (s && (g += " " + l(s.replace(/ ?[\r\n]+/g, " ")), i && i()), !h) {
    const k = t.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${c}`);
    let N = !1;
    const E = ze(n, !0);
    o !== "folded" && e !== O.BLOCK_FOLDED && (E.onOverflow = () => {
      N = !0;
    });
    const b = We(`${S}${k}${m}`, c, pt, E);
    if (!N)
      return `>${g}
${c}${b}`;
  }
  return t = t.replace(/\n+/g, `$&${c}`), `|${g}
${c}${S}${t}${m}`;
}
function nn(s, e, t, n) {
  const { type: i, value: r } = s, { actualString: o, implicitKey: l, indent: a, indentStep: c, inFlow: h } = e;
  if (l && r.includes(`
`) || h && /[[\]{},]/.test(r))
    return ue(r, e);
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(r))
    return l || h || !r.includes(`
`) ? ue(r, e) : qe(s, e, t, n);
  if (!l && !h && i !== O.PLAIN && r.includes(`
`))
    return qe(s, e, t, n);
  if (He(r)) {
    if (a === "")
      return e.forceBlockIndent = !0, qe(s, e, t, n);
    if (l && a === c)
      return ue(r, e);
  }
  const u = r.replace(/\n+/g, `$&
${a}`);
  if (o) {
    const d = (f) => f.default && f.tag !== "tag:yaml.org,2002:str" && f.test?.test(u), { compat: m, tags: y } = e.doc.schema;
    if (y.some(d) || m?.some(d))
      return ue(r, e);
  }
  return l ? u : We(u, a, os, ze(e, !1));
}
function Et(s, e, t, n) {
  const { implicitKey: i, inFlow: r } = e, o = typeof s.value == "string" ? s : Object.assign({}, s, { value: String(s.value) });
  let { type: l } = s;
  l !== O.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(o.value) && (l = O.QUOTE_DOUBLE);
  const a = (h) => {
    switch (h) {
      case O.BLOCK_FOLDED:
      case O.BLOCK_LITERAL:
        return i || r ? ue(o.value, e) : qe(o, e, t, n);
      case O.QUOTE_DOUBLE:
        return ve(o.value, e);
      case O.QUOTE_SINGLE:
        return mt(o.value, e);
      case O.PLAIN:
        return nn(o, e, t, n);
      default:
        return null;
    }
  };
  let c = a(l);
  if (c === null) {
    const { defaultKeyType: h, defaultStringType: u } = e.options, d = i && h || u;
    if (c = a(d), c === null)
      throw new Error(`Unsupported default string type ${d}`);
  }
  return c;
}
function as(s, e) {
  const t = Object.assign({
    blockQuote: !0,
    commentString: tn,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: !1,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: !0,
    indentSeq: !0,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: !1,
    singleQuote: null,
    trailingComma: !1,
    trueStr: "true",
    verifyAliasOrder: !0
  }, s.schema.toStringOptions, e);
  let n;
  switch (t.collectionStyle) {
    case "block":
      n = !1;
      break;
    case "flow":
      n = !0;
      break;
    default:
      n = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc: s,
    flowCollectionPadding: t.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof t.indent == "number" ? " ".repeat(t.indent) : "  ",
    inFlow: n,
    options: t
  };
}
function rn(s, e) {
  if (e.tag) {
    const i = s.filter((r) => r.tag === e.tag);
    if (i.length > 0)
      return i.find((r) => r.format === e.format) ?? i[0];
  }
  let t, n;
  if (T(e)) {
    n = e.value;
    let i = s.filter((r) => r.identify?.(n));
    if (i.length > 1) {
      const r = i.filter((o) => o.test);
      r.length > 0 && (i = r);
    }
    t = i.find((r) => r.format === e.format) ?? i.find((r) => !r.format);
  } else
    n = e, t = s.find((i) => i.nodeClass && n instanceof i.nodeClass);
  if (!t) {
    const i = n?.constructor?.name ?? (n === null ? "null" : typeof n);
    throw new Error(`Tag not resolved for ${i} value`);
  }
  return t;
}
function on(s, e, { anchors: t, doc: n }) {
  if (!n.directives)
    return "";
  const i = [], r = (T(s) || L(s)) && s.anchor;
  r && ts(r) && (t.add(r), i.push(`&${r}`));
  const o = s.tag ?? (e.default ? null : e.tag);
  return o && i.push(n.directives.tagString(o)), i.join(" ");
}
function pe(s, e, t, n) {
  if (C(s))
    return s.toString(e, t, n);
  if (ye(s)) {
    if (e.doc.directives)
      return s.toString(e);
    if (e.resolvedAliases?.has(s))
      throw new TypeError("Cannot stringify circular structure without alias nodes");
    e.resolvedAliases ? e.resolvedAliases.add(s) : e.resolvedAliases = /* @__PURE__ */ new Set([s]), s = s.resolve(e.doc);
  }
  let i;
  const r = M(s) ? s : e.doc.createNode(s, { onTagObj: (a) => i = a });
  i ?? (i = rn(e.doc.schema.tags, r));
  const o = on(r, i, e);
  o.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + o.length + 1);
  const l = typeof i.stringify == "function" ? i.stringify(r, e, t, n) : T(r) ? Et(r, e, t, n) : r.toString(e, t, n);
  return o ? T(r) || l[0] === "{" || l[0] === "[" ? `${o} ${l}` : `${o}
${e.indent}${l}` : l;
}
function an({ key: s, value: e }, t, n, i) {
  const { allNullValues: r, doc: o, indent: l, indentStep: a, options: { commentString: c, indentSeq: h, simpleKeys: u } } = t;
  let d = M(s) && s.comment || null;
  if (u) {
    if (d)
      throw new Error("With simple keys, key nodes cannot have comments");
    if (L(s) || !M(s) && typeof s == "object") {
      const E = "With simple keys, collection cannot be used as a key value";
      throw new Error(E);
    }
  }
  let m = !u && (!s || d && e == null && !t.inFlow || L(s) || (T(s) ? s.type === O.BLOCK_FOLDED || s.type === O.BLOCK_LITERAL : typeof s == "object"));
  t = Object.assign({}, t, {
    allNullValues: !1,
    implicitKey: !m && (u || !r),
    indent: l + a
  });
  let y = !1, f = !1, p = pe(s, t, () => y = !0, () => f = !0);
  if (!m && !t.inFlow && p.length > 1024) {
    if (u)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    m = !0;
  }
  if (t.inFlow) {
    if (r || e == null)
      return y && n && n(), p === "" ? "?" : m ? `? ${p}` : p;
  } else if (r && !u || e == null && m)
    return p = `? ${p}`, d && !y ? p += ne(p, t.indent, c(d)) : f && i && i(), p;
  y && (d = null), m ? (d && (p += ne(p, t.indent, c(d))), p = `? ${p}
${l}:`) : (p = `${p}:`, d && (p += ne(p, t.indent, c(d))));
  let $, S, w;
  M(e) ? ($ = !!e.spaceBefore, S = e.commentBefore, w = e.comment) : ($ = !1, S = null, w = null, e && typeof e == "object" && (e = o.createNode(e))), t.implicitKey = !1, !m && !d && T(e) && (t.indentAtStart = p.length + 1), f = !1, !h && a.length >= 2 && !t.inFlow && !m && Me(e) && !e.flow && !e.tag && !e.anchor && (t.indent = t.indent.substring(2));
  let g = !1;
  const k = pe(e, t, () => g = !0, () => f = !0);
  let N = " ";
  if (d || $ || S) {
    if (N = $ ? `
` : "", S) {
      const E = c(S);
      N += `
${H(E, t.indent)}`;
    }
    k === "" && !t.inFlow ? N === `
` && w && (N = `

`) : N += `
${t.indent}`;
  } else if (!m && L(e)) {
    const E = k[0], b = k.indexOf(`
`), v = b !== -1, I = t.inFlow ?? e.flow ?? e.items.length === 0;
    if (v || !I) {
      let _ = !1;
      if (v && (E === "&" || E === "!")) {
        let A = k.indexOf(" ");
        E === "&" && A !== -1 && A < b && k[A + 1] === "!" && (A = k.indexOf(" ", A + 1)), (A === -1 || b < A) && (_ = !0);
      }
      _ || (N = `
${t.indent}`);
    }
  } else (k === "" || k[0] === `
`) && (N = "");
  return p += N + k, t.inFlow ? g && n && n() : w && !g ? p += ne(p, t.indent, c(w)) : f && i && i(), p;
}
function ln(s, e) {
  (s === "debug" || s === "warn") && console.warn(e);
}
const je = "<<", Q = {
  identify: (s) => s === je || typeof s == "symbol" && s.description === je,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new O(Symbol(je)), {
    addToJSMap: ls
  }),
  stringify: () => je
}, cn = (s, e) => (Q.identify(e) || T(e) && (!e.type || e.type === O.PLAIN) && Q.identify(e.value)) && s?.doc.schema.tags.some((t) => t.tag === Q.tag && t.default);
function ls(s, e, t) {
  const n = cs(s, t);
  if (Me(n))
    for (const i of n.items)
      ot(s, e, i);
  else if (Array.isArray(n))
    for (const i of n)
      ot(s, e, i);
  else
    ot(s, e, n);
}
function ot(s, e, t) {
  const n = cs(s, t);
  if (!Le(n))
    throw new Error("Merge sources must be maps or map aliases");
  const i = n.toJSON(null, s, Map);
  for (const [r, o] of i)
    e instanceof Map ? e.has(r) || e.set(r, o) : e instanceof Set ? e.add(r) : Object.prototype.hasOwnProperty.call(e, r) || Object.defineProperty(e, r, {
      value: o,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  return e;
}
function cs(s, e) {
  return s && ye(e) ? e.resolve(s.doc, s) : e;
}
function fs(s, e, { key: t, value: n }) {
  if (M(t) && t.addToJSMap)
    t.addToJSMap(s, e, n);
  else if (cn(s, t))
    ls(s, e, n);
  else {
    const i = q(t, "", s);
    if (e instanceof Map)
      e.set(i, q(n, i, s));
    else if (e instanceof Set)
      e.add(i);
    else {
      const r = fn(t, i, s), o = q(n, r, s);
      r in e ? Object.defineProperty(e, r, {
        value: o,
        writable: !0,
        enumerable: !0,
        configurable: !0
      }) : e[r] = o;
    }
  }
  return e;
}
function fn(s, e, t) {
  if (e === null)
    return "";
  if (typeof e != "object")
    return String(e);
  if (M(s) && t?.doc) {
    const n = as(t.doc, {});
    n.anchors = /* @__PURE__ */ new Set();
    for (const r of t.anchors.keys())
      n.anchors.add(r.anchor);
    n.inFlow = !0, n.inStringifyKey = !0;
    const i = s.toString(n);
    if (!t.mapKeyWarned) {
      let r = JSON.stringify(i);
      r.length > 40 && (r = r.substring(0, 36) + '..."'), ln(t.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${r}. Set mapAsMap: true to use object keys.`), t.mapKeyWarned = !0;
    }
    return i;
  }
  return JSON.stringify(e);
}
function Ot(s, e, t) {
  const n = Te(s, void 0, t), i = Te(e, void 0, t);
  return new P(n, i);
}
class P {
  constructor(e, t = null) {
    Object.defineProperty(this, R, { value: Zt }), this.key = e, this.value = t;
  }
  clone(e) {
    let { key: t, value: n } = this;
    return M(t) && (t = t.clone(e)), M(n) && (n = n.clone(e)), new P(t, n);
  }
  toJSON(e, t) {
    const n = t?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    return fs(t, n, this);
  }
  toString(e, t, n) {
    return e?.doc ? an(this, e, t, n) : JSON.stringify(this);
  }
}
function us(s, e, t) {
  return (e.inFlow ?? s.flow ? hn : un)(s, e, t);
}
function un({ comment: s, items: e }, t, { blockItemPrefix: n, flowChars: i, itemIndent: r, onChompKeep: o, onComment: l }) {
  const { indent: a, options: { commentString: c } } = t, h = Object.assign({}, t, { indent: r, type: null });
  let u = !1;
  const d = [];
  for (let y = 0; y < e.length; ++y) {
    const f = e[y];
    let p = null;
    if (M(f))
      !u && f.spaceBefore && d.push(""), Ve(t, d, f.commentBefore, u), f.comment && (p = f.comment);
    else if (C(f)) {
      const S = M(f.key) ? f.key : null;
      S && (!u && S.spaceBefore && d.push(""), Ve(t, d, S.commentBefore, u));
    }
    u = !1;
    let $ = pe(f, h, () => p = null, () => u = !0);
    p && ($ += ne($, r, c(p))), u && p && (u = !1), d.push(n + $);
  }
  let m;
  if (d.length === 0)
    m = i.start + i.end;
  else {
    m = d[0];
    for (let y = 1; y < d.length; ++y) {
      const f = d[y];
      m += f ? `
${a}${f}` : `
`;
    }
  }
  return s ? (m += `
` + H(c(s), a), l && l()) : u && o && o(), m;
}
function hn({ items: s }, e, { flowChars: t, itemIndent: n }) {
  const { indent: i, indentStep: r, flowCollectionPadding: o, options: { commentString: l } } = e;
  n += r;
  const a = Object.assign({}, e, {
    indent: n,
    inFlow: !0,
    type: null
  });
  let c = !1, h = 0;
  const u = [];
  for (let y = 0; y < s.length; ++y) {
    const f = s[y];
    let p = null;
    if (M(f))
      f.spaceBefore && u.push(""), Ve(e, u, f.commentBefore, !1), f.comment && (p = f.comment);
    else if (C(f)) {
      const S = M(f.key) ? f.key : null;
      S && (S.spaceBefore && u.push(""), Ve(e, u, S.commentBefore, !1), S.comment && (c = !0));
      const w = M(f.value) ? f.value : null;
      w ? (w.comment && (p = w.comment), w.commentBefore && (c = !0)) : f.value == null && S?.comment && (p = S.comment);
    }
    p && (c = !0);
    let $ = pe(f, a, () => p = null);
    c || (c = u.length > h || $.includes(`
`)), y < s.length - 1 ? $ += "," : e.options.trailingComma && (e.options.lineWidth > 0 && (c || (c = u.reduce((S, w) => S + w.length + 2, 2) + ($.length + 2) > e.options.lineWidth)), c && ($ += ",")), p && ($ += ne($, n, l(p))), u.push($), h = u.length;
  }
  const { start: d, end: m } = t;
  if (u.length === 0)
    return d + m;
  if (!c) {
    const y = u.reduce((f, p) => f + p.length + 2, 2);
    c = e.options.lineWidth > 0 && y > e.options.lineWidth;
  }
  if (c) {
    let y = d;
    for (const f of u)
      y += f ? `
${r}${i}${f}` : `
`;
    return `${y}
${i}${m}`;
  } else
    return `${d}${o}${u.join(" ")}${o}${m}`;
}
function Ve({ indent: s, options: { commentString: e } }, t, n, i) {
  if (n && i && (n = n.replace(/^\n+/, "")), n) {
    const r = H(e(n), s);
    t.push(r.trimStart());
  }
}
function ie(s, e) {
  const t = T(e) ? e.value : e;
  for (const n of s)
    if (C(n) && (n.key === e || n.key === t || T(n.key) && n.key.value === t))
      return n;
}
class F extends rs {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(e) {
    super(ee, e), this.items = [];
  }
  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(e, t, n) {
    const { keepUndefined: i, replacer: r } = n, o = new this(e), l = (a, c) => {
      if (typeof r == "function")
        c = r.call(t, a, c);
      else if (Array.isArray(r) && !r.includes(a))
        return;
      (c !== void 0 || i) && o.items.push(Ot(a, c, n));
    };
    if (t instanceof Map)
      for (const [a, c] of t)
        l(a, c);
    else if (t && typeof t == "object")
      for (const a of Object.keys(t))
        l(a, t[a]);
    return typeof e.sortMapEntries == "function" && o.items.sort(e.sortMapEntries), o;
  }
  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(e, t) {
    let n;
    C(e) ? n = e : !e || typeof e != "object" || !("key" in e) ? n = new P(e, e?.value) : n = new P(e.key, e.value);
    const i = ie(this.items, n.key), r = this.schema?.sortMapEntries;
    if (i) {
      if (!t)
        throw new Error(`Key ${n.key} already set`);
      T(i.value) && is(n.value) ? i.value.value = n.value : i.value = n.value;
    } else if (r) {
      const o = this.items.findIndex((l) => r(n, l) < 0);
      o === -1 ? this.items.push(n) : this.items.splice(o, 0, n);
    } else
      this.items.push(n);
  }
  delete(e) {
    const t = ie(this.items, e);
    return t ? this.items.splice(this.items.indexOf(t), 1).length > 0 : !1;
  }
  get(e, t) {
    const i = ie(this.items, e)?.value;
    return (!t && T(i) ? i.value : i) ?? void 0;
  }
  has(e) {
    return !!ie(this.items, e);
  }
  set(e, t) {
    this.add(new P(e, t), !0);
  }
  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON(e, t, n) {
    const i = n ? new n() : t?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    t?.onCreate && t.onCreate(i);
    for (const r of this.items)
      fs(t, i, r);
    return i;
  }
  toString(e, t, n) {
    if (!e)
      return JSON.stringify(this);
    for (const i of this.items)
      if (!C(i))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(i)} instead`);
    return !e.allNullValues && this.hasAllNullValues(!1) && (e = Object.assign({}, e, { allNullValues: !0 })), us(this, e, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: e.indent || "",
      onChompKeep: n,
      onComment: t
    });
  }
}
const be = {
  collection: "map",
  default: !0,
  nodeClass: F,
  tag: "tag:yaml.org,2002:map",
  resolve(s, e) {
    return Le(s) || e("Expected a mapping for this tag"), s;
  },
  createNode: (s, e, t) => F.from(s, e, t)
};
class re extends rs {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(e) {
    super(ge, e), this.items = [];
  }
  add(e) {
    this.items.push(e);
  }
  /**
   * Removes a value from the collection.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(e) {
    const t = xe(e);
    return typeof t != "number" ? !1 : this.items.splice(t, 1).length > 0;
  }
  get(e, t) {
    const n = xe(e);
    if (typeof n != "number")
      return;
    const i = this.items[n];
    return !t && T(i) ? i.value : i;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(e) {
    const t = xe(e);
    return typeof t == "number" && t < this.items.length;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * If `key` does not contain a representation of an integer, this will throw.
   * It may be wrapped in a `Scalar`.
   */
  set(e, t) {
    const n = xe(e);
    if (typeof n != "number")
      throw new Error(`Expected a valid index, not ${e}.`);
    const i = this.items[n];
    T(i) && is(t) ? i.value = t : this.items[n] = t;
  }
  toJSON(e, t) {
    const n = [];
    t?.onCreate && t.onCreate(n);
    let i = 0;
    for (const r of this.items)
      n.push(q(r, String(i++), t));
    return n;
  }
  toString(e, t, n) {
    return e ? us(this, e, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (e.indent || "") + "  ",
      onChompKeep: n,
      onComment: t
    }) : JSON.stringify(this);
  }
  static from(e, t, n) {
    const { replacer: i } = n, r = new this(e);
    if (t && Symbol.iterator in Object(t)) {
      let o = 0;
      for (let l of t) {
        if (typeof i == "function") {
          const a = t instanceof Set ? l : String(o++);
          l = i.call(t, a, l);
        }
        r.items.push(Te(l, void 0, n));
      }
    }
    return r;
  }
}
function xe(s) {
  let e = T(s) ? s.value : s;
  return e && typeof e == "string" && (e = Number(e)), typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
}
const ke = {
  collection: "seq",
  default: !0,
  nodeClass: re,
  tag: "tag:yaml.org,2002:seq",
  resolve(s, e) {
    return Me(s) || e("Expected a sequence for this tag"), s;
  },
  createNode: (s, e, t) => re.from(s, e, t)
}, Qe = {
  identify: (s) => typeof s == "string",
  default: !0,
  tag: "tag:yaml.org,2002:str",
  resolve: (s) => s,
  stringify(s, e, t, n) {
    return e = Object.assign({ actualString: !0 }, e), Et(s, e, t, n);
  }
}, Xe = {
  identify: (s) => s == null,
  createNode: () => new O(null),
  default: !0,
  tag: "tag:yaml.org,2002:null",
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new O(null),
  stringify: ({ source: s }, e) => typeof s == "string" && Xe.test.test(s) ? s : e.options.nullStr
}, vt = {
  identify: (s) => typeof s == "boolean",
  default: !0,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: (s) => new O(s[0] === "t" || s[0] === "T"),
  stringify({ source: s, value: e }, t) {
    if (s && vt.test.test(s)) {
      const n = s[0] === "t" || s[0] === "T";
      if (e === n)
        return s;
    }
    return e ? t.options.trueStr : t.options.falseStr;
  }
};
function V({ format: s, minFractionDigits: e, tag: t, value: n }) {
  if (typeof n == "bigint")
    return String(n);
  const i = typeof n == "number" ? n : Number(n);
  if (!isFinite(i))
    return isNaN(i) ? ".nan" : i < 0 ? "-.inf" : ".inf";
  let r = Object.is(n, -0) ? "-0" : JSON.stringify(n);
  if (!s && e && (!t || t === "tag:yaml.org,2002:float") && /^-?\d/.test(r) && !r.includes("e")) {
    let o = r.indexOf(".");
    o < 0 && (o = r.length, r += ".");
    let l = e - (r.length - o - 1);
    for (; l-- > 0; )
      r += "0";
  }
  return r;
}
const hs = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (s) => s.slice(-3).toLowerCase() === "nan" ? NaN : s[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: V
}, ds = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: (s) => parseFloat(s),
  stringify(s) {
    const e = Number(s.value);
    return isFinite(e) ? e.toExponential() : V(s);
  }
}, ps = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(s) {
    const e = new O(parseFloat(s)), t = s.indexOf(".");
    return t !== -1 && s[s.length - 1] === "0" && (e.minFractionDigits = s.length - t - 1), e;
  },
  stringify: V
}, Ze = (s) => typeof s == "bigint" || Number.isInteger(s), At = (s, e, t, { intAsBigInt: n }) => n ? BigInt(s) : parseInt(s.substring(e), t);
function ms(s, e, t) {
  const { value: n } = s;
  return Ze(n) && n >= 0 ? t + n.toString(e) : V(s);
}
const gs = {
  identify: (s) => Ze(s) && s >= 0,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^0o[0-7]+$/,
  resolve: (s, e, t) => At(s, 2, 8, t),
  stringify: (s) => ms(s, 8, "0o")
}, ys = {
  identify: Ze,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9]+$/,
  resolve: (s, e, t) => At(s, 0, 10, t),
  stringify: V
}, ws = {
  identify: (s) => Ze(s) && s >= 0,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (s, e, t) => At(s, 2, 16, t),
  stringify: (s) => ms(s, 16, "0x")
}, dn = [
  be,
  ke,
  Qe,
  Xe,
  vt,
  gs,
  ys,
  ws,
  hs,
  ds,
  ps
];
function Bt(s) {
  return typeof s == "bigint" || Number.isInteger(s);
}
const Pe = ({ value: s }) => JSON.stringify(s), pn = [
  {
    identify: (s) => typeof s == "string",
    default: !0,
    tag: "tag:yaml.org,2002:str",
    resolve: (s) => s,
    stringify: Pe
  },
  {
    identify: (s) => s == null,
    createNode: () => new O(null),
    default: !0,
    tag: "tag:yaml.org,2002:null",
    test: /^null$/,
    resolve: () => null,
    stringify: Pe
  },
  {
    identify: (s) => typeof s == "boolean",
    default: !0,
    tag: "tag:yaml.org,2002:bool",
    test: /^true$|^false$/,
    resolve: (s) => s === "true",
    stringify: Pe
  },
  {
    identify: Bt,
    default: !0,
    tag: "tag:yaml.org,2002:int",
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (s, e, { intAsBigInt: t }) => t ? BigInt(s) : parseInt(s, 10),
    stringify: ({ value: s }) => Bt(s) ? s.toString() : JSON.stringify(s)
  },
  {
    identify: (s) => typeof s == "number",
    default: !0,
    tag: "tag:yaml.org,2002:float",
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (s) => parseFloat(s),
    stringify: Pe
  }
], mn = {
  default: !0,
  tag: "",
  test: /^/,
  resolve(s, e) {
    return e(`Unresolved plain scalar ${JSON.stringify(s)}`), s;
  }
}, gn = [be, ke].concat(pn, mn), Tt = {
  identify: (s) => s instanceof Uint8Array,
  // Buffer inherits from Uint8Array
  default: !1,
  tag: "tag:yaml.org,2002:binary",
  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve(s, e) {
    if (typeof atob == "function") {
      const t = atob(s.replace(/[\n\r]/g, "")), n = new Uint8Array(t.length);
      for (let i = 0; i < t.length; ++i)
        n[i] = t.charCodeAt(i);
      return n;
    } else
      return e("This environment does not support reading binary tags; either Buffer or atob is required"), s;
  },
  stringify({ comment: s, type: e, value: t }, n, i, r) {
    if (!t)
      return "";
    const o = t;
    let l;
    if (typeof btoa == "function") {
      let a = "";
      for (let c = 0; c < o.length; ++c)
        a += String.fromCharCode(o[c]);
      l = btoa(a);
    } else
      throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
    if (e ?? (e = O.BLOCK_LITERAL), e !== O.QUOTE_DOUBLE) {
      const a = Math.max(n.options.lineWidth - n.indent.length, n.options.minContentWidth), c = Math.ceil(l.length / a), h = new Array(c);
      for (let u = 0, d = 0; u < c; ++u, d += a)
        h[u] = l.substr(d, a);
      l = h.join(e === O.BLOCK_LITERAL ? `
` : " ");
    }
    return Et({ comment: s, type: e, value: l }, n, i, r);
  }
};
function bs(s, e) {
  if (Me(s))
    for (let t = 0; t < s.items.length; ++t) {
      let n = s.items[t];
      if (!C(n)) {
        if (Le(n)) {
          n.items.length > 1 && e("Each pair must have its own sequence indicator");
          const i = n.items[0] || new P(new O(null));
          if (n.commentBefore && (i.key.commentBefore = i.key.commentBefore ? `${n.commentBefore}
${i.key.commentBefore}` : n.commentBefore), n.comment) {
            const r = i.value ?? i.key;
            r.comment = r.comment ? `${n.comment}
${r.comment}` : n.comment;
          }
          n = i;
        }
        s.items[t] = C(n) ? n : new P(n);
      }
    }
  else
    e("Expected a sequence for this tag");
  return s;
}
function ks(s, e, t) {
  const { replacer: n } = t, i = new re(s);
  i.tag = "tag:yaml.org,2002:pairs";
  let r = 0;
  if (e && Symbol.iterator in Object(e))
    for (let o of e) {
      typeof n == "function" && (o = n.call(e, String(r++), o));
      let l, a;
      if (Array.isArray(o))
        if (o.length === 2)
          l = o[0], a = o[1];
        else
          throw new TypeError(`Expected [key, value] tuple: ${o}`);
      else if (o && o instanceof Object) {
        const c = Object.keys(o);
        if (c.length === 1)
          l = c[0], a = o[l];
        else
          throw new TypeError(`Expected tuple with one key, not ${c.length} keys`);
      } else
        l = o;
      i.items.push(Ot(l, a, t));
    }
  return i;
}
const It = {
  collection: "seq",
  default: !1,
  tag: "tag:yaml.org,2002:pairs",
  resolve: bs,
  createNode: ks
};
class he extends re {
  constructor() {
    super(), this.add = F.prototype.add.bind(this), this.delete = F.prototype.delete.bind(this), this.get = F.prototype.get.bind(this), this.has = F.prototype.has.bind(this), this.set = F.prototype.set.bind(this), this.tag = he.tag;
  }
  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(e, t) {
    if (!t)
      return super.toJSON(e);
    const n = /* @__PURE__ */ new Map();
    t?.onCreate && t.onCreate(n);
    for (const i of this.items) {
      let r, o;
      if (C(i) ? (r = q(i.key, "", t), o = q(i.value, r, t)) : r = q(i, "", t), n.has(r))
        throw new Error("Ordered maps must not include duplicate keys");
      n.set(r, o);
    }
    return n;
  }
  static from(e, t, n) {
    const i = ks(e, t, n), r = new this();
    return r.items = i.items, r;
  }
}
he.tag = "tag:yaml.org,2002:omap";
const Lt = {
  collection: "seq",
  identify: (s) => s instanceof Map,
  nodeClass: he,
  default: !1,
  tag: "tag:yaml.org,2002:omap",
  resolve(s, e) {
    const t = bs(s, e), n = [];
    for (const { key: i } of t.items)
      T(i) && (n.includes(i.value) ? e(`Ordered maps must not include duplicate keys: ${i.value}`) : n.push(i.value));
    return Object.assign(new he(), t);
  },
  createNode: (s, e, t) => he.from(s, e, t)
};
function $s({ value: s, source: e }, t) {
  return e && (s ? Ss : Ns).test.test(e) ? e : s ? t.options.trueStr : t.options.falseStr;
}
const Ss = {
  identify: (s) => s === !0,
  default: !0,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new O(!0),
  stringify: $s
}, Ns = {
  identify: (s) => s === !1,
  default: !0,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  resolve: () => new O(!1),
  stringify: $s
}, yn = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (s) => s.slice(-3).toLowerCase() === "nan" ? NaN : s[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: V
}, wn = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (s) => parseFloat(s.replace(/_/g, "")),
  stringify(s) {
    const e = Number(s.value);
    return isFinite(e) ? e.toExponential() : V(s);
  }
}, bn = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(s) {
    const e = new O(parseFloat(s.replace(/_/g, ""))), t = s.indexOf(".");
    if (t !== -1) {
      const n = s.substring(t + 1).replace(/_/g, "");
      n[n.length - 1] === "0" && (e.minFractionDigits = n.length);
    }
    return e;
  },
  stringify: V
}, Ce = (s) => typeof s == "bigint" || Number.isInteger(s);
function et(s, e, t, { intAsBigInt: n }) {
  const i = s[0];
  if ((i === "-" || i === "+") && (e += 1), s = s.substring(e).replace(/_/g, ""), n) {
    switch (t) {
      case 2:
        s = `0b${s}`;
        break;
      case 8:
        s = `0o${s}`;
        break;
      case 16:
        s = `0x${s}`;
        break;
    }
    const o = BigInt(s);
    return i === "-" ? BigInt(-1) * o : o;
  }
  const r = parseInt(s, t);
  return i === "-" ? -1 * r : r;
}
function Mt(s, e, t) {
  const { value: n } = s;
  if (Ce(n)) {
    const i = n.toString(e);
    return n < 0 ? "-" + t + i.substr(1) : t + i;
  }
  return V(s);
}
const kn = {
  identify: Ce,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "BIN",
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (s, e, t) => et(s, 2, 2, t),
  stringify: (s) => Mt(s, 2, "0b")
}, $n = {
  identify: Ce,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^[-+]?0[0-7_]+$/,
  resolve: (s, e, t) => et(s, 1, 8, t),
  stringify: (s) => Mt(s, 8, "0")
}, Sn = {
  identify: Ce,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (s, e, t) => et(s, 0, 10, t),
  stringify: V
}, Nn = {
  identify: Ce,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (s, e, t) => et(s, 2, 16, t),
  stringify: (s) => Mt(s, 16, "0x")
};
class de extends F {
  constructor(e) {
    super(e), this.tag = de.tag;
  }
  add(e) {
    let t;
    C(e) ? t = e : e && typeof e == "object" && "key" in e && "value" in e && e.value === null ? t = new P(e.key, null) : t = new P(e, null), ie(this.items, t.key) || this.items.push(t);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(e, t) {
    const n = ie(this.items, e);
    return !t && C(n) ? T(n.key) ? n.key.value : n.key : n;
  }
  set(e, t) {
    if (typeof t != "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`);
    const n = ie(this.items, e);
    n && !t ? this.items.splice(this.items.indexOf(n), 1) : !n && t && this.items.push(new P(e));
  }
  toJSON(e, t) {
    return super.toJSON(e, t, Set);
  }
  toString(e, t, n) {
    if (!e)
      return JSON.stringify(this);
    if (this.hasAllNullValues(!0))
      return super.toString(Object.assign({}, e, { allNullValues: !0 }), t, n);
    throw new Error("Set items must all have null values");
  }
  static from(e, t, n) {
    const { replacer: i } = n, r = new this(e);
    if (t && Symbol.iterator in Object(t))
      for (let o of t)
        typeof i == "function" && (o = i.call(t, o, o)), r.items.push(Ot(o, null, n));
    return r;
  }
}
de.tag = "tag:yaml.org,2002:set";
const Ct = {
  collection: "map",
  identify: (s) => s instanceof Set,
  nodeClass: de,
  default: !1,
  tag: "tag:yaml.org,2002:set",
  createNode: (s, e, t) => de.from(s, e, t),
  resolve(s, e) {
    if (Le(s)) {
      if (s.hasAllNullValues(!0))
        return Object.assign(new de(), s);
      e("Set items must all have null values");
    } else
      e("Expected a mapping for this tag");
    return s;
  }
};
function _t(s, e) {
  const t = s[0], n = t === "-" || t === "+" ? s.substring(1) : s, i = (o) => e ? BigInt(o) : Number(o), r = n.replace(/_/g, "").split(":").reduce((o, l) => o * i(60) + i(l), i(0));
  return t === "-" ? i(-1) * r : r;
}
function Es(s) {
  let { value: e } = s, t = (o) => o;
  if (typeof e == "bigint")
    t = (o) => BigInt(o);
  else if (isNaN(e) || !isFinite(e))
    return V(s);
  let n = "";
  e < 0 && (n = "-", e *= t(-1));
  const i = t(60), r = [e % i];
  return e < 60 ? r.unshift(0) : (e = (e - r[0]) / i, r.unshift(e % i), e >= 60 && (e = (e - r[0]) / i, r.unshift(e))), n + r.map((o) => String(o).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
const Os = {
  identify: (s) => typeof s == "bigint" || Number.isInteger(s),
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: (s, e, { intAsBigInt: t }) => _t(s, t),
  stringify: Es
}, vs = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: (s) => _t(s, !1),
  stringify: Es
}, tt = {
  identify: (s) => s instanceof Date,
  default: !0,
  tag: "tag:yaml.org,2002:timestamp",
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
  resolve(s) {
    const e = s.match(tt.test);
    if (!e)
      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
    const [, t, n, i, r, o, l] = e.map(Number), a = e[7] ? Number((e[7] + "00").substr(1, 3)) : 0;
    let c = Date.UTC(t, n - 1, i, r || 0, o || 0, l || 0, a);
    const h = e[8];
    if (h && h !== "Z") {
      let u = _t(h, !1);
      Math.abs(u) < 30 && (u *= 60), c -= 6e4 * u;
    }
    return new Date(c);
  },
  stringify: ({ value: s }) => s?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
}, Dt = [
  be,
  ke,
  Qe,
  Xe,
  Ss,
  Ns,
  kn,
  $n,
  Sn,
  Nn,
  yn,
  wn,
  bn,
  Tt,
  Q,
  Lt,
  It,
  Ct,
  Os,
  vs,
  tt
], Kt = /* @__PURE__ */ new Map([
  ["core", dn],
  ["failsafe", [be, ke, Qe]],
  ["json", gn],
  ["yaml11", Dt],
  ["yaml-1.1", Dt]
]), Ft = {
  binary: Tt,
  bool: vt,
  float: ps,
  floatExp: ds,
  floatNaN: hs,
  floatTime: vs,
  int: ys,
  intHex: ws,
  intOct: gs,
  intTime: Os,
  map: be,
  merge: Q,
  null: Xe,
  omap: Lt,
  pairs: It,
  seq: ke,
  set: Ct,
  timestamp: tt
}, En = {
  "tag:yaml.org,2002:binary": Tt,
  "tag:yaml.org,2002:merge": Q,
  "tag:yaml.org,2002:omap": Lt,
  "tag:yaml.org,2002:pairs": It,
  "tag:yaml.org,2002:set": Ct,
  "tag:yaml.org,2002:timestamp": tt
};
function at(s, e, t) {
  const n = Kt.get(e);
  if (n && !s)
    return t && !n.includes(Q) ? n.concat(Q) : n.slice();
  let i = n;
  if (!i)
    if (Array.isArray(s))
      i = [];
    else {
      const r = Array.from(Kt.keys()).filter((o) => o !== "yaml11").map((o) => JSON.stringify(o)).join(", ");
      throw new Error(`Unknown schema "${e}"; use one of ${r} or define customTags array`);
    }
  if (Array.isArray(s))
    for (const r of s)
      i = i.concat(r);
  else typeof s == "function" && (i = s(i.slice()));
  return t && (i = i.concat(Q)), i.reduce((r, o) => {
    const l = typeof o == "string" ? Ft[o] : o;
    if (!l) {
      const a = JSON.stringify(o), c = Object.keys(Ft).map((h) => JSON.stringify(h)).join(", ");
      throw new Error(`Unknown custom tag ${a}; use one of ${c}`);
    }
    return r.includes(l) || r.push(l), r;
  }, []);
}
const On = (s, e) => s.key < e.key ? -1 : s.key > e.key ? 1 : 0;
class jt {
  constructor({ compat: e, customTags: t, merge: n, resolveKnownTags: i, schema: r, sortMapEntries: o, toStringDefaults: l }) {
    this.compat = Array.isArray(e) ? at(e, "compat") : e ? at(null, e) : null, this.name = typeof r == "string" && r || "core", this.knownTags = i ? En : {}, this.tags = at(t, this.name, n), this.toStringOptions = l ?? null, Object.defineProperty(this, ee, { value: be }), Object.defineProperty(this, Y, { value: Qe }), Object.defineProperty(this, ge, { value: ke }), this.sortMapEntries = typeof o == "function" ? o : o === !0 ? On : null;
  }
  clone() {
    const e = Object.create(jt.prototype, Object.getOwnPropertyDescriptors(this));
    return e.tags = this.tags.slice(), e;
  }
}
function vn(s, e) {
  const t = [];
  let n = e.directives === !0;
  if (e.directives !== !1 && s.directives) {
    const a = s.directives.toString(s);
    a ? (t.push(a), n = !0) : s.directives.docStart && (n = !0);
  }
  n && t.push("---");
  const i = as(s, e), { commentString: r } = i.options;
  if (s.commentBefore) {
    t.length !== 1 && t.unshift("");
    const a = r(s.commentBefore);
    t.unshift(H(a, ""));
  }
  let o = !1, l = null;
  if (s.contents) {
    if (M(s.contents)) {
      if (s.contents.spaceBefore && n && t.push(""), s.contents.commentBefore) {
        const h = r(s.contents.commentBefore);
        t.push(H(h, ""));
      }
      i.forceBlockIndent = !!s.comment, l = s.contents.comment;
    }
    const a = l ? void 0 : () => o = !0;
    let c = pe(s.contents, i, () => l = null, a);
    l && (c += ne(c, "", r(l))), (c[0] === "|" || c[0] === ">") && t[t.length - 1] === "---" ? t[t.length - 1] = `--- ${c}` : t.push(c);
  } else
    t.push(pe(s.contents, i));
  if (s.directives?.docEnd)
    if (s.comment) {
      const a = r(s.comment);
      a.includes(`
`) ? (t.push("..."), t.push(H(a, ""))) : t.push(`... ${a}`);
    } else
      t.push("...");
  else {
    let a = s.comment;
    a && o && (a = a.replace(/^\n+/, "")), a && ((!o || l) && t[t.length - 1] !== "" && t.push(""), t.push(H(r(a), "")));
  }
  return t.join(`
`) + `
`;
}
class st {
  constructor(e, t, n) {
    this.commentBefore = null, this.comment = null, this.errors = [], this.warnings = [], Object.defineProperty(this, R, { value: dt });
    let i = null;
    typeof t == "function" || Array.isArray(t) ? i = t : n === void 0 && t && (n = t, t = void 0);
    const r = Object.assign({
      intAsBigInt: !1,
      keepSourceTokens: !1,
      logLevel: "warn",
      prettyErrors: !0,
      strict: !0,
      stringKeys: !1,
      uniqueKeys: !0,
      version: "1.2"
    }, n);
    this.options = r;
    let { version: o } = r;
    n?._directives ? (this.directives = n._directives.atDocument(), this.directives.yaml.explicit && (o = this.directives.yaml.version)) : this.directives = new x({ version: o }), this.setSchema(o, n), this.contents = e === void 0 ? null : this.createNode(e, i, n);
  }
  /**
   * Create a deep copy of this Document and its contents.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone() {
    const e = Object.create(st.prototype, {
      [R]: { value: dt }
    });
    return e.commentBefore = this.commentBefore, e.comment = this.comment, e.errors = this.errors.slice(), e.warnings = this.warnings.slice(), e.options = Object.assign({}, this.options), this.directives && (e.directives = this.directives.clone()), e.schema = this.schema.clone(), e.contents = M(this.contents) ? this.contents.clone(e.schema) : this.contents, this.range && (e.range = this.range.slice()), e;
  }
  /** Adds a value to the document. */
  add(e) {
    oe(this.contents) && this.contents.add(e);
  }
  /** Adds a value to the document. */
  addIn(e, t) {
    oe(this.contents) && this.contents.addIn(e, t);
  }
  /**
   * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
   *
   * If `node` already has an anchor, `name` is ignored.
   * Otherwise, the `node.anchor` value will be set to `name`,
   * or if an anchor with that name is already present in the document,
   * `name` will be used as a prefix for a new unique anchor.
   * If `name` is undefined, the generated anchor will use 'a' as a prefix.
   */
  createAlias(e, t) {
    if (!e.anchor) {
      const n = ss(this);
      e.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      !t || n.has(t) ? ns(t || "a", n) : t;
    }
    return new Nt(e.anchor);
  }
  createNode(e, t, n) {
    let i;
    if (typeof t == "function")
      e = t.call({ "": e }, "", e), i = t;
    else if (Array.isArray(t)) {
      const p = (S) => typeof S == "number" || S instanceof String || S instanceof Number, $ = t.filter(p).map(String);
      $.length > 0 && (t = t.concat($)), i = t;
    } else n === void 0 && t && (n = t, t = void 0);
    const { aliasDuplicateObjects: r, anchorPrefix: o, flow: l, keepUndefined: a, onTagObj: c, tag: h } = n ?? {}, { onAnchor: u, setAnchors: d, sourceObjects: m } = Xs(
      this,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      o || "a"
    ), y = {
      aliasDuplicateObjects: r ?? !0,
      keepUndefined: a ?? !1,
      onAnchor: u,
      onTagObj: c,
      replacer: i,
      schema: this.schema,
      sourceObjects: m
    }, f = Te(e, h, y);
    return l && L(f) && (f.flow = !0), d(), f;
  }
  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   */
  createPair(e, t, n = {}) {
    const i = this.createNode(e, null, n), r = this.createNode(t, null, n);
    return new P(i, r);
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(e) {
    return oe(this.contents) ? this.contents.delete(e) : !1;
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(e) {
    return Ne(e) ? this.contents == null ? !1 : (this.contents = null, !0) : oe(this.contents) ? this.contents.deleteIn(e) : !1;
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  get(e, t) {
    return L(this.contents) ? this.contents.get(e, t) : void 0;
  }
  /**
   * Returns item at `path`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(e, t) {
    return Ne(e) ? !t && T(this.contents) ? this.contents.value : this.contents : L(this.contents) ? this.contents.getIn(e, t) : void 0;
  }
  /**
   * Checks if the document includes a value with the key `key`.
   */
  has(e) {
    return L(this.contents) ? this.contents.has(e) : !1;
  }
  /**
   * Checks if the document includes a value at `path`.
   */
  hasIn(e) {
    return Ne(e) ? this.contents !== void 0 : L(this.contents) ? this.contents.hasIn(e) : !1;
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(e, t) {
    this.contents == null ? this.contents = Ue(this.schema, [e], t) : oe(this.contents) && this.contents.set(e, t);
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, t) {
    Ne(e) ? this.contents = t : this.contents == null ? this.contents = Ue(this.schema, Array.from(e), t) : oe(this.contents) && this.contents.setIn(e, t);
  }
  /**
   * Change the YAML version and schema used by the document.
   * A `null` version disables support for directives, explicit tags, anchors, and aliases.
   * It also requires the `schema` option to be given as a `Schema` instance value.
   *
   * Overrides all previously set schema options.
   */
  setSchema(e, t = {}) {
    typeof e == "number" && (e = String(e));
    let n;
    switch (e) {
      case "1.1":
        this.directives ? this.directives.yaml.version = "1.1" : this.directives = new x({ version: "1.1" }), n = { resolveKnownTags: !1, schema: "yaml-1.1" };
        break;
      case "1.2":
      case "next":
        this.directives ? this.directives.yaml.version = e : this.directives = new x({ version: e }), n = { resolveKnownTags: !0, schema: "core" };
        break;
      case null:
        this.directives && delete this.directives, n = null;
        break;
      default: {
        const i = JSON.stringify(e);
        throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${i}`);
      }
    }
    if (t.schema instanceof Object)
      this.schema = t.schema;
    else if (n)
      this.schema = new jt(Object.assign(n, t));
    else
      throw new Error("With a null YAML version, the { schema: Schema } option is required");
  }
  // json & jsonArg are only used from toJSON()
  toJS({ json: e, jsonArg: t, mapAsMap: n, maxAliasCount: i, onAnchor: r, reviver: o } = {}) {
    const l = {
      anchors: /* @__PURE__ */ new Map(),
      doc: this,
      keep: !e,
      mapAsMap: n === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof i == "number" ? i : 100
    }, a = q(this.contents, t ?? "", l);
    if (typeof r == "function")
      for (const { count: c, res: h } of l.anchors.values())
        r(h, c);
    return typeof o == "function" ? fe(o, { "": a }, "", a) : a;
  }
  /**
   * A JSON representation of the document `contents`.
   *
   * @param jsonArg Used by `JSON.stringify` to indicate the array index or
   *   property name.
   */
  toJSON(e, t) {
    return this.toJS({ json: !0, jsonArg: e, mapAsMap: !1, onAnchor: t });
  }
  /** A YAML representation of the document. */
  toString(e = {}) {
    if (this.errors.length > 0)
      throw new Error("Document with errors cannot be stringified");
    if ("indent" in e && (!Number.isInteger(e.indent) || Number(e.indent) <= 0)) {
      const t = JSON.stringify(e.indent);
      throw new Error(`"indent" option must be a positive integer, not ${t}`);
    }
    return vn(this, e);
  }
}
function oe(s) {
  if (L(s))
    return !0;
  throw new Error("Expected a YAML collection as document contents");
}
class As extends Error {
  constructor(e, t, n, i) {
    super(), this.name = e, this.code = n, this.message = i, this.pos = t;
  }
}
class Ee extends As {
  constructor(e, t, n) {
    super("YAMLParseError", e, t, n);
  }
}
class An extends As {
  constructor(e, t, n) {
    super("YAMLWarning", e, t, n);
  }
}
const qt = (s, e) => (t) => {
  if (t.pos[0] === -1)
    return;
  t.linePos = t.pos.map((l) => e.linePos(l));
  const { line: n, col: i } = t.linePos[0];
  t.message += ` at line ${n}, column ${i}`;
  let r = i - 1, o = s.substring(e.lineStarts[n - 1], e.lineStarts[n]).replace(/[\n\r]+$/, "");
  if (r >= 60 && o.length > 80) {
    const l = Math.min(r - 39, o.length - 79);
    o = "…" + o.substring(l), r -= l - 1;
  }
  if (o.length > 80 && (o = o.substring(0, 79) + "…"), n > 1 && /^ *$/.test(o.substring(0, r))) {
    let l = s.substring(e.lineStarts[n - 2], e.lineStarts[n - 1]);
    l.length > 80 && (l = l.substring(0, 79) + `…
`), o = l + o;
  }
  if (/[^ ]/.test(o)) {
    let l = 1;
    const a = t.linePos[1];
    a?.line === n && a.col > i && (l = Math.max(1, Math.min(a.col - i, 80 - r)));
    const c = " ".repeat(r) + "^".repeat(l);
    t.message += `:

${o}
${c}
`;
  }
};
function me(s, { flow: e, indicator: t, next: n, offset: i, onError: r, parentIndent: o, startOnNewline: l }) {
  let a = !1, c = l, h = l, u = "", d = "", m = !1, y = !1, f = null, p = null, $ = null, S = null, w = null, g = null, k = null;
  for (const b of s)
    switch (y && (b.type !== "space" && b.type !== "newline" && b.type !== "comma" && r(b.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space"), y = !1), f && (c && b.type !== "comment" && b.type !== "newline" && r(f, "TAB_AS_INDENT", "Tabs are not allowed as indentation"), f = null), b.type) {
      case "space":
        !e && (t !== "doc-start" || n?.type !== "flow-collection") && b.source.includes("	") && (f = b), h = !0;
        break;
      case "comment": {
        h || r(b, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
        const v = b.source.substring(1) || " ";
        u ? u += d + v : u = v, d = "", c = !1;
        break;
      }
      case "newline":
        c ? u ? u += b.source : (!g || t !== "seq-item-ind") && (a = !0) : d += b.source, c = !0, m = !0, (p || $) && (S = b), h = !0;
        break;
      case "anchor":
        p && r(b, "MULTIPLE_ANCHORS", "A node can have at most one anchor"), b.source.endsWith(":") && r(b.offset + b.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", !0), p = b, k ?? (k = b.offset), c = !1, h = !1, y = !0;
        break;
      case "tag": {
        $ && r(b, "MULTIPLE_TAGS", "A node can have at most one tag"), $ = b, k ?? (k = b.offset), c = !1, h = !1, y = !0;
        break;
      }
      case t:
        (p || $) && r(b, "BAD_PROP_ORDER", `Anchors and tags must be after the ${b.source} indicator`), g && r(b, "UNEXPECTED_TOKEN", `Unexpected ${b.source} in ${e ?? "collection"}`), g = b, c = t === "seq-item-ind" || t === "explicit-key-ind", h = !1;
        break;
      case "comma":
        if (e) {
          w && r(b, "UNEXPECTED_TOKEN", `Unexpected , in ${e}`), w = b, c = !1, h = !1;
          break;
        }
      // else fallthrough
      default:
        r(b, "UNEXPECTED_TOKEN", `Unexpected ${b.type} token`), c = !1, h = !1;
    }
  const N = s[s.length - 1], E = N ? N.offset + N.source.length : i;
  return y && n && n.type !== "space" && n.type !== "newline" && n.type !== "comma" && (n.type !== "scalar" || n.source !== "") && r(n.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space"), f && (c && f.indent <= o || n?.type === "block-map" || n?.type === "block-seq") && r(f, "TAB_AS_INDENT", "Tabs are not allowed as indentation"), {
    comma: w,
    found: g,
    spaceBefore: a,
    comment: u,
    hasNewline: m,
    anchor: p,
    tag: $,
    newlineAfterProp: S,
    end: E,
    start: k ?? E
  };
}
function Ie(s) {
  if (!s)
    return null;
  switch (s.type) {
    case "alias":
    case "scalar":
    case "double-quoted-scalar":
    case "single-quoted-scalar":
      if (s.source.includes(`
`))
        return !0;
      if (s.end) {
        for (const e of s.end)
          if (e.type === "newline")
            return !0;
      }
      return !1;
    case "flow-collection":
      for (const e of s.items) {
        for (const t of e.start)
          if (t.type === "newline")
            return !0;
        if (e.sep) {
          for (const t of e.sep)
            if (t.type === "newline")
              return !0;
        }
        if (Ie(e.key) || Ie(e.value))
          return !0;
      }
      return !1;
    default:
      return !0;
  }
}
function yt(s, e, t) {
  if (e?.type === "flow-collection") {
    const n = e.end[0];
    n.indent === s && (n.source === "]" || n.source === "}") && Ie(e) && t(n, "BAD_INDENT", "Flow end indicator should be more indented than parent", !0);
  }
}
function Ts(s, e, t) {
  const { uniqueKeys: n } = s.options;
  if (n === !1)
    return !1;
  const i = typeof n == "function" ? n : (r, o) => r === o || T(r) && T(o) && r.value === o.value;
  return e.some((r) => i(r.key, t));
}
const Rt = "All mapping items must start at the same column";
function Tn({ composeNode: s, composeEmptyNode: e }, t, n, i, r) {
  const o = r?.nodeClass ?? F, l = new o(t.schema);
  t.atRoot && (t.atRoot = !1);
  let a = n.offset, c = null;
  for (const h of n.items) {
    const { start: u, key: d, sep: m, value: y } = h, f = me(u, {
      indicator: "explicit-key-ind",
      next: d ?? m?.[0],
      offset: a,
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !0
    }), p = !f.found;
    if (p) {
      if (d && (d.type === "block-seq" ? i(a, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key") : "indent" in d && d.indent !== n.indent && i(a, "BAD_INDENT", Rt)), !f.anchor && !f.tag && !m) {
        c = f.end, f.comment && (l.comment ? l.comment += `
` + f.comment : l.comment = f.comment);
        continue;
      }
      (f.newlineAfterProp || Ie(d)) && i(d ?? u[u.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
    } else f.found?.indent !== n.indent && i(a, "BAD_INDENT", Rt);
    t.atKey = !0;
    const $ = f.end, S = d ? s(t, d, f, i) : e(t, $, u, null, f, i);
    t.schema.compat && yt(n.indent, d, i), t.atKey = !1, Ts(t, l.items, S) && i($, "DUPLICATE_KEY", "Map keys must be unique");
    const w = me(m ?? [], {
      indicator: "map-value-ind",
      next: y,
      offset: S.range[2],
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !d || d.type === "block-scalar"
    });
    if (a = w.end, w.found) {
      p && (y?.type === "block-map" && !w.hasNewline && i(a, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings"), t.options.strict && f.start < w.found.offset - 1024 && i(S.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key"));
      const g = y ? s(t, y, w, i) : e(t, a, m, null, w, i);
      t.schema.compat && yt(n.indent, y, i), a = g.range[2];
      const k = new P(S, g);
      t.options.keepSourceTokens && (k.srcToken = h), l.items.push(k);
    } else {
      p && i(S.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values"), w.comment && (S.comment ? S.comment += `
` + w.comment : S.comment = w.comment);
      const g = new P(S);
      t.options.keepSourceTokens && (g.srcToken = h), l.items.push(g);
    }
  }
  return c && c < a && i(c, "IMPOSSIBLE", "Map comment with trailing content"), l.range = [n.offset, a, c ?? a], l;
}
function In({ composeNode: s, composeEmptyNode: e }, t, n, i, r) {
  const o = r?.nodeClass ?? re, l = new o(t.schema);
  t.atRoot && (t.atRoot = !1), t.atKey && (t.atKey = !1);
  let a = n.offset, c = null;
  for (const { start: h, value: u } of n.items) {
    const d = me(h, {
      indicator: "seq-item-ind",
      next: u,
      offset: a,
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !0
    });
    if (!d.found)
      if (d.anchor || d.tag || u)
        u?.type === "block-seq" ? i(d.end, "BAD_INDENT", "All sequence items must start at the same column") : i(a, "MISSING_CHAR", "Sequence item without - indicator");
      else {
        c = d.end, d.comment && (l.comment = d.comment);
        continue;
      }
    const m = u ? s(t, u, d, i) : e(t, d.end, h, null, d, i);
    t.schema.compat && yt(n.indent, u, i), a = m.range[2], l.items.push(m);
  }
  return l.range = [n.offset, a, c ?? a], l;
}
function _e(s, e, t, n) {
  let i = "";
  if (s) {
    let r = !1, o = "";
    for (const l of s) {
      const { source: a, type: c } = l;
      switch (c) {
        case "space":
          r = !0;
          break;
        case "comment": {
          t && !r && n(l, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const h = a.substring(1) || " ";
          i ? i += o + h : i = h, o = "";
          break;
        }
        case "newline":
          i && (o += a), r = !0;
          break;
        default:
          n(l, "UNEXPECTED_TOKEN", `Unexpected ${c} at node end`);
      }
      e += a.length;
    }
  }
  return { comment: i, offset: e };
}
const lt = "Block collections are not allowed within flow collections", ct = (s) => s && (s.type === "block-map" || s.type === "block-seq");
function Ln({ composeNode: s, composeEmptyNode: e }, t, n, i, r) {
  const o = n.start.source === "{", l = o ? "flow map" : "flow sequence", a = r?.nodeClass ?? (o ? F : re), c = new a(t.schema);
  c.flow = !0;
  const h = t.atRoot;
  h && (t.atRoot = !1), t.atKey && (t.atKey = !1);
  let u = n.offset + n.start.source.length;
  for (let p = 0; p < n.items.length; ++p) {
    const $ = n.items[p], { start: S, key: w, sep: g, value: k } = $, N = me(S, {
      flow: l,
      indicator: "explicit-key-ind",
      next: w ?? g?.[0],
      offset: u,
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !1
    });
    if (!N.found) {
      if (!N.anchor && !N.tag && !g && !k) {
        p === 0 && N.comma ? i(N.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${l}`) : p < n.items.length - 1 && i(N.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${l}`), N.comment && (c.comment ? c.comment += `
` + N.comment : c.comment = N.comment), u = N.end;
        continue;
      }
      !o && t.options.strict && Ie(w) && i(
        w,
        // checked by containsNewline()
        "MULTILINE_IMPLICIT_KEY",
        "Implicit keys of flow sequence pairs need to be on a single line"
      );
    }
    if (p === 0)
      N.comma && i(N.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${l}`);
    else if (N.comma || i(N.start, "MISSING_CHAR", `Missing , between ${l} items`), N.comment) {
      let E = "";
      e: for (const b of S)
        switch (b.type) {
          case "comma":
          case "space":
            break;
          case "comment":
            E = b.source.substring(1);
            break e;
          default:
            break e;
        }
      if (E) {
        let b = c.items[c.items.length - 1];
        C(b) && (b = b.value ?? b.key), b.comment ? b.comment += `
` + E : b.comment = E, N.comment = N.comment.substring(E.length + 1);
      }
    }
    if (!o && !g && !N.found) {
      const E = k ? s(t, k, N, i) : e(t, N.end, g, null, N, i);
      c.items.push(E), u = E.range[2], ct(k) && i(E.range, "BLOCK_IN_FLOW", lt);
    } else {
      t.atKey = !0;
      const E = N.end, b = w ? s(t, w, N, i) : e(t, E, S, null, N, i);
      ct(w) && i(b.range, "BLOCK_IN_FLOW", lt), t.atKey = !1;
      const v = me(g ?? [], {
        flow: l,
        indicator: "map-value-ind",
        next: k,
        offset: b.range[2],
        onError: i,
        parentIndent: n.indent,
        startOnNewline: !1
      });
      if (v.found) {
        if (!o && !N.found && t.options.strict) {
          if (g)
            for (const A of g) {
              if (A === v.found)
                break;
              if (A.type === "newline") {
                i(A, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                break;
              }
            }
          N.start < v.found.offset - 1024 && i(v.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
        }
      } else k && ("source" in k && k.source?.[0] === ":" ? i(k, "MISSING_CHAR", `Missing space after : in ${l}`) : i(v.start, "MISSING_CHAR", `Missing , or : between ${l} items`));
      const I = k ? s(t, k, v, i) : v.found ? e(t, v.end, g, null, v, i) : null;
      I ? ct(k) && i(I.range, "BLOCK_IN_FLOW", lt) : v.comment && (b.comment ? b.comment += `
` + v.comment : b.comment = v.comment);
      const _ = new P(b, I);
      if (t.options.keepSourceTokens && (_.srcToken = $), o) {
        const A = c;
        Ts(t, A.items, b) && i(E, "DUPLICATE_KEY", "Map keys must be unique"), A.items.push(_);
      } else {
        const A = new F(t.schema);
        A.flow = !0, A.items.push(_);
        const B = (I ?? b).range;
        A.range = [b.range[0], B[1], B[2]], c.items.push(A);
      }
      u = I ? I.range[2] : v.end;
    }
  }
  const d = o ? "}" : "]", [m, ...y] = n.end;
  let f = u;
  if (m?.source === d)
    f = m.offset + m.source.length;
  else {
    const p = l[0].toUpperCase() + l.substring(1), $ = h ? `${p} must end with a ${d}` : `${p} in block collection must be sufficiently indented and end with a ${d}`;
    i(u, h ? "MISSING_CHAR" : "BAD_INDENT", $), m && m.source.length !== 1 && y.unshift(m);
  }
  if (y.length > 0) {
    const p = _e(y, f, t.options.strict, i);
    p.comment && (c.comment ? c.comment += `
` + p.comment : c.comment = p.comment), c.range = [n.offset, f, p.offset];
  } else
    c.range = [n.offset, f, f];
  return c;
}
function ft(s, e, t, n, i, r) {
  const o = t.type === "block-map" ? Tn(s, e, t, n, r) : t.type === "block-seq" ? In(s, e, t, n, r) : Ln(s, e, t, n, r), l = o.constructor;
  return i === "!" || i === l.tagName ? (o.tag = l.tagName, o) : (i && (o.tag = i), o);
}
function Mn(s, e, t, n, i) {
  const r = n.tag, o = r ? e.directives.tagName(r.source, (d) => i(r, "TAG_RESOLVE_FAILED", d)) : null;
  if (t.type === "block-seq") {
    const { anchor: d, newlineAfterProp: m } = n, y = d && r ? d.offset > r.offset ? d : r : d ?? r;
    y && (!m || m.offset < y.offset) && i(y, "MISSING_CHAR", "Missing newline after block sequence props");
  }
  const l = t.type === "block-map" ? "map" : t.type === "block-seq" ? "seq" : t.start.source === "{" ? "map" : "seq";
  if (!r || !o || o === "!" || o === F.tagName && l === "map" || o === re.tagName && l === "seq")
    return ft(s, e, t, i, o);
  let a = e.schema.tags.find((d) => d.tag === o && d.collection === l);
  if (!a) {
    const d = e.schema.knownTags[o];
    if (d?.collection === l)
      e.schema.tags.push(Object.assign({}, d, { default: !1 })), a = d;
    else
      return d ? i(r, "BAD_COLLECTION_TYPE", `${d.tag} used for ${l} collection, but expects ${d.collection ?? "scalar"}`, !0) : i(r, "TAG_RESOLVE_FAILED", `Unresolved tag: ${o}`, !0), ft(s, e, t, i, o);
  }
  const c = ft(s, e, t, i, o, a), h = a.resolve?.(c, (d) => i(r, "TAG_RESOLVE_FAILED", d), e.options) ?? c, u = M(h) ? h : new O(h);
  return u.range = c.range, u.tag = o, a?.format && (u.format = a.format), u;
}
function Cn(s, e, t) {
  const n = e.offset, i = _n(e, s.options.strict, t);
  if (!i)
    return { value: "", type: null, comment: "", range: [n, n, n] };
  const r = i.mode === ">" ? O.BLOCK_FOLDED : O.BLOCK_LITERAL, o = e.source ? jn(e.source) : [];
  let l = o.length;
  for (let f = o.length - 1; f >= 0; --f) {
    const p = o[f][1];
    if (p === "" || p === "\r")
      l = f;
    else
      break;
  }
  if (l === 0) {
    const f = i.chomp === "+" && o.length > 0 ? `
`.repeat(Math.max(1, o.length - 1)) : "";
    let p = n + i.length;
    return e.source && (p += e.source.length), { value: f, type: r, comment: i.comment, range: [n, p, p] };
  }
  let a = e.indent + i.indent, c = e.offset + i.length, h = 0;
  for (let f = 0; f < l; ++f) {
    const [p, $] = o[f];
    if ($ === "" || $ === "\r")
      i.indent === 0 && p.length > a && (a = p.length);
    else {
      p.length < a && t(c + p.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator"), i.indent === 0 && (a = p.length), h = f, a === 0 && !s.atRoot && t(c, "BAD_INDENT", "Block scalar values in collections must be indented");
      break;
    }
    c += p.length + $.length + 1;
  }
  for (let f = o.length - 1; f >= l; --f)
    o[f][0].length > a && (l = f + 1);
  let u = "", d = "", m = !1;
  for (let f = 0; f < h; ++f)
    u += o[f][0].slice(a) + `
`;
  for (let f = h; f < l; ++f) {
    let [p, $] = o[f];
    c += p.length + $.length + 1;
    const S = $[$.length - 1] === "\r";
    if (S && ($ = $.slice(0, -1)), $ && p.length < a) {
      const g = `Block scalar lines must not be less indented than their ${i.indent ? "explicit indentation indicator" : "first line"}`;
      t(c - $.length - (S ? 2 : 1), "BAD_INDENT", g), p = "";
    }
    r === O.BLOCK_LITERAL ? (u += d + p.slice(a) + $, d = `
`) : p.length > a || $[0] === "	" ? (d === " " ? d = `
` : !m && d === `
` && (d = `

`), u += d + p.slice(a) + $, d = `
`, m = !0) : $ === "" ? d === `
` ? u += `
` : d = `
` : (u += d + $, d = " ", m = !1);
  }
  switch (i.chomp) {
    case "-":
      break;
    case "+":
      for (let f = l; f < o.length; ++f)
        u += `
` + o[f][0].slice(a);
      u[u.length - 1] !== `
` && (u += `
`);
      break;
    default:
      u += `
`;
  }
  const y = n + i.length + e.source.length;
  return { value: u, type: r, comment: i.comment, range: [n, y, y] };
}
function _n({ offset: s, props: e }, t, n) {
  if (e[0].type !== "block-scalar-header")
    return n(e[0], "IMPOSSIBLE", "Block scalar header not found"), null;
  const { source: i } = e[0], r = i[0];
  let o = 0, l = "", a = -1;
  for (let d = 1; d < i.length; ++d) {
    const m = i[d];
    if (!l && (m === "-" || m === "+"))
      l = m;
    else {
      const y = Number(m);
      !o && y ? o = y : a === -1 && (a = s + d);
    }
  }
  a !== -1 && n(a, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${i}`);
  let c = !1, h = "", u = i.length;
  for (let d = 1; d < e.length; ++d) {
    const m = e[d];
    switch (m.type) {
      case "space":
        c = !0;
      // fallthrough
      case "newline":
        u += m.source.length;
        break;
      case "comment":
        t && !c && n(m, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters"), u += m.source.length, h = m.source.substring(1);
        break;
      case "error":
        n(m, "UNEXPECTED_TOKEN", m.message), u += m.source.length;
        break;
      /* istanbul ignore next should not happen */
      default: {
        const y = `Unexpected token in block scalar header: ${m.type}`;
        n(m, "UNEXPECTED_TOKEN", y);
        const f = m.source;
        f && typeof f == "string" && (u += f.length);
      }
    }
  }
  return { mode: r, indent: o, chomp: l, comment: h, length: u };
}
function jn(s) {
  const e = s.split(/\n( *)/), t = e[0], n = t.match(/^( *)/), r = [n?.[1] ? [n[1], t.slice(n[1].length)] : ["", t]];
  for (let o = 1; o < e.length; o += 2)
    r.push([e[o], e[o + 1]]);
  return r;
}
function xn(s, e, t) {
  const { offset: n, type: i, source: r, end: o } = s;
  let l, a;
  const c = (d, m, y) => t(n + d, m, y);
  switch (i) {
    case "scalar":
      l = O.PLAIN, a = Pn(r, c);
      break;
    case "single-quoted-scalar":
      l = O.QUOTE_SINGLE, a = Bn(r, c);
      break;
    case "double-quoted-scalar":
      l = O.QUOTE_DOUBLE, a = Dn(r, c);
      break;
    /* istanbul ignore next should not happen */
    default:
      return t(s, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${i}`), {
        value: "",
        type: null,
        comment: "",
        range: [n, n + r.length, n + r.length]
      };
  }
  const h = n + r.length, u = _e(o, h, e, t);
  return {
    value: a,
    type: l,
    comment: u.comment,
    range: [n, h, u.offset]
  };
}
function Pn(s, e) {
  let t = "";
  switch (s[0]) {
    /* istanbul ignore next should not happen */
    case "	":
      t = "a tab character";
      break;
    case ",":
      t = "flow indicator character ,";
      break;
    case "%":
      t = "directive indicator character %";
      break;
    case "|":
    case ">": {
      t = `block scalar indicator ${s[0]}`;
      break;
    }
    case "@":
    case "`": {
      t = `reserved character ${s[0]}`;
      break;
    }
  }
  return t && e(0, "BAD_SCALAR_START", `Plain value cannot start with ${t}`), Is(s);
}
function Bn(s, e) {
  return (s[s.length - 1] !== "'" || s.length === 1) && e(s.length, "MISSING_CHAR", "Missing closing 'quote"), Is(s.slice(1, -1)).replace(/''/g, "'");
}
function Is(s) {
  const e = /(.*?)\r?\n/sy;
  let t = e.exec(s);
  if (!t)
    return s;
  let n, i;
  try {
    n = new RegExp("(?<![ 	])[ 	]+$"), i = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
  } catch {
    n = /[ \t]+$/, i = /^[ \t]+|[ \t]+$/g;
  }
  let r = t[1].replace(n, ""), o = " ", l = e.lastIndex;
  for (; t = e.exec(s); ) {
    const c = t[1].replace(i, "");
    c === "" ? o === `
` ? r += o : o = `
` : (r += o + c, o = " "), l = e.lastIndex;
  }
  const a = /[ \t]*(.*)/sy;
  return a.lastIndex = l, t = a.exec(s), r + o + (t?.[1] ?? "");
}
function Dn(s, e) {
  let t = "";
  for (let n = 1; n < s.length - 1; ++n) {
    const i = s[n];
    if (!(i === "\r" && s[n + 1] === `
`))
      if (i === `
`) {
        const { fold: r, offset: o } = Kn(s, n);
        t += r, n = o;
      } else if (i === "\\") {
        let r = s[++n];
        const o = Fn[r];
        if (o)
          t += o;
        else if (r === `
`)
          for (r = s[n + 1]; r === " " || r === "	"; )
            r = s[++n + 1];
        else if (r === "\r" && s[n + 1] === `
`)
          for (r = s[++n + 1]; r === " " || r === "	"; )
            r = s[++n + 1];
        else if (r === "x" || r === "u" || r === "U") {
          const l = r === "x" ? 2 : r === "u" ? 4 : 8;
          t += qn(s, n + 1, l, e), n += l;
        } else {
          const l = s.substr(n - 1, 2);
          e(n - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${l}`), t += l;
        }
      } else if (i === " " || i === "	") {
        const r = n;
        let o = s[n + 1];
        for (; o === " " || o === "	"; )
          o = s[++n + 1];
        o !== `
` && !(o === "\r" && s[n + 2] === `
`) && (t += n > r ? s.slice(r, n + 1) : i);
      } else
        t += i;
  }
  return (s[s.length - 1] !== '"' || s.length === 1) && e(s.length, "MISSING_CHAR", 'Missing closing "quote'), t;
}
function Kn(s, e) {
  let t = "", n = s[e + 1];
  for (; (n === " " || n === "	" || n === `
` || n === "\r") && !(n === "\r" && s[e + 2] !== `
`); )
    n === `
` && (t += `
`), e += 1, n = s[e + 1];
  return t || (t = " "), { fold: t, offset: e };
}
const Fn = {
  0: "\0",
  // null character
  a: "\x07",
  // bell character
  b: "\b",
  // backspace
  e: "\x1B",
  // escape character
  f: "\f",
  // form feed
  n: `
`,
  // line feed
  r: "\r",
  // carriage return
  t: "	",
  // horizontal tab
  v: "\v",
  // vertical tab
  N: "",
  // Unicode next line
  _: " ",
  // Unicode non-breaking space
  L: "\u2028",
  // Unicode line separator
  P: "\u2029",
  // Unicode paragraph separator
  " ": " ",
  '"': '"',
  "/": "/",
  "\\": "\\",
  "	": "	"
};
function qn(s, e, t, n) {
  const i = s.substr(e, t), o = i.length === t && /^[0-9a-fA-F]+$/.test(i) ? parseInt(i, 16) : NaN;
  try {
    return String.fromCodePoint(o);
  } catch {
    const l = s.substr(e - 2, t + 2);
    return n(e - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${l}`), l;
  }
}
function Ls(s, e, t, n) {
  const { value: i, type: r, comment: o, range: l } = e.type === "block-scalar" ? Cn(s, e, n) : xn(e, s.options.strict, n), a = t ? s.directives.tagName(t.source, (u) => n(t, "TAG_RESOLVE_FAILED", u)) : null;
  let c;
  s.options.stringKeys && s.atKey ? c = s.schema[Y] : a ? c = Rn(s.schema, i, a, t, n) : e.type === "scalar" ? c = Un(s, i, e, n) : c = s.schema[Y];
  let h;
  try {
    const u = c.resolve(i, (d) => n(t ?? e, "TAG_RESOLVE_FAILED", d), s.options);
    h = T(u) ? u : new O(u);
  } catch (u) {
    const d = u instanceof Error ? u.message : String(u);
    n(t ?? e, "TAG_RESOLVE_FAILED", d), h = new O(i);
  }
  return h.range = l, h.source = i, r && (h.type = r), a && (h.tag = a), c.format && (h.format = c.format), o && (h.comment = o), h;
}
function Rn(s, e, t, n, i) {
  if (t === "!")
    return s[Y];
  const r = [];
  for (const l of s.tags)
    if (!l.collection && l.tag === t)
      if (l.default && l.test)
        r.push(l);
      else
        return l;
  for (const l of r)
    if (l.test?.test(e))
      return l;
  const o = s.knownTags[t];
  return o && !o.collection ? (s.tags.push(Object.assign({}, o, { default: !1, test: void 0 })), o) : (i(n, "TAG_RESOLVE_FAILED", `Unresolved tag: ${t}`, t !== "tag:yaml.org,2002:str"), s[Y]);
}
function Un({ atKey: s, directives: e, schema: t }, n, i, r) {
  const o = t.tags.find((l) => (l.default === !0 || s && l.default === "key") && l.test?.test(n)) || t[Y];
  if (t.compat) {
    const l = t.compat.find((a) => a.default && a.test?.test(n)) ?? t[Y];
    if (o.tag !== l.tag) {
      const a = e.tagString(o.tag), c = e.tagString(l.tag), h = `Value may be parsed as either ${a} or ${c}`;
      r(i, "TAG_RESOLVE_FAILED", h, !0);
    }
  }
  return o;
}
function Vn(s, e, t) {
  if (e) {
    t ?? (t = e.length);
    for (let n = t - 1; n >= 0; --n) {
      let i = e[n];
      switch (i.type) {
        case "space":
        case "comment":
        case "newline":
          s -= i.source.length;
          continue;
      }
      for (i = e[++n]; i?.type === "space"; )
        s += i.source.length, i = e[++n];
      break;
    }
  }
  return s;
}
const Gn = { composeNode: Ms, composeEmptyNode: xt };
function Ms(s, e, t, n) {
  const i = s.atKey, { spaceBefore: r, comment: o, anchor: l, tag: a } = t;
  let c, h = !0;
  switch (e.type) {
    case "alias":
      c = Yn(s, e, n), (l || a) && n(e, "ALIAS_PROPS", "An alias node must not specify any properties");
      break;
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "block-scalar":
      c = Ls(s, e, a, n), l && (c.anchor = l.source.substring(1));
      break;
    case "block-map":
    case "block-seq":
    case "flow-collection":
      try {
        c = Mn(Gn, s, e, t, n), l && (c.anchor = l.source.substring(1));
      } catch (u) {
        const d = u instanceof Error ? u.message : String(u);
        n(e, "RESOURCE_EXHAUSTION", d);
      }
      break;
    default: {
      const u = e.type === "error" ? e.message : `Unsupported token (type: ${e.type})`;
      n(e, "UNEXPECTED_TOKEN", u), h = !1;
    }
  }
  return c ?? (c = xt(s, e.offset, void 0, null, t, n)), l && c.anchor === "" && n(l, "BAD_ALIAS", "Anchor cannot be an empty string"), i && s.options.stringKeys && (!T(c) || typeof c.value != "string" || c.tag && c.tag !== "tag:yaml.org,2002:str") && n(a ?? e, "NON_STRING_KEY", "With stringKeys, all keys must be strings"), r && (c.spaceBefore = !0), o && (e.type === "scalar" && e.source === "" ? c.comment = o : c.commentBefore = o), s.options.keepSourceTokens && h && (c.srcToken = e), c;
}
function xt(s, e, t, n, { spaceBefore: i, comment: r, anchor: o, tag: l, end: a }, c) {
  const h = {
    type: "scalar",
    offset: Vn(e, t, n),
    indent: -1,
    source: ""
  }, u = Ls(s, h, l, c);
  return o && (u.anchor = o.source.substring(1), u.anchor === "" && c(o, "BAD_ALIAS", "Anchor cannot be an empty string")), i && (u.spaceBefore = !0), r && (u.comment = r, u.range[2] = a), u;
}
function Yn({ options: s }, { offset: e, source: t, end: n }, i) {
  const r = new Nt(t.substring(1));
  r.source === "" && i(e, "BAD_ALIAS", "Alias cannot be an empty string"), r.source.endsWith(":") && i(e + t.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", !0);
  const o = e + t.length, l = _e(n, o, s.strict, i);
  return r.range = [e, o, l.offset], l.comment && (r.comment = l.comment), r;
}
function Jn(s, e, { offset: t, start: n, value: i, end: r }, o) {
  const l = Object.assign({ _directives: e }, s), a = new st(void 0, l), c = {
    atKey: !1,
    atRoot: !0,
    directives: a.directives,
    options: a.options,
    schema: a.schema
  }, h = me(n, {
    indicator: "doc-start",
    next: i ?? r?.[0],
    offset: t,
    onError: o,
    parentIndent: 0,
    startOnNewline: !0
  });
  h.found && (a.directives.docStart = !0, i && (i.type === "block-map" || i.type === "block-seq") && !h.hasNewline && o(h.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker")), a.contents = i ? Ms(c, i, h, o) : xt(c, h.end, n, null, h, o);
  const u = a.contents.range[2], d = _e(r, u, !1, o);
  return d.comment && (a.comment = d.comment), a.range = [t, u, d.offset], a;
}
function $e(s) {
  if (typeof s == "number")
    return [s, s + 1];
  if (Array.isArray(s))
    return s.length === 2 ? s : [s[0], s[1]];
  const { offset: e, source: t } = s;
  return [e, e + (typeof t == "string" ? t.length : 1)];
}
function Ut(s) {
  let e = "", t = !1, n = !1;
  for (let i = 0; i < s.length; ++i) {
    const r = s[i];
    switch (r[0]) {
      case "#":
        e += (e === "" ? "" : n ? `

` : `
`) + (r.substring(1) || " "), t = !0, n = !1;
        break;
      case "%":
        s[i + 1]?.[0] !== "#" && (i += 1), t = !1;
        break;
      default:
        t || (n = !0), t = !1;
    }
  }
  return { comment: e, afterEmptyLine: n };
}
class Wn {
  constructor(e = {}) {
    this.doc = null, this.atDirectives = !1, this.prelude = [], this.errors = [], this.warnings = [], this.onError = (t, n, i, r) => {
      const o = $e(t);
      r ? this.warnings.push(new An(o, n, i)) : this.errors.push(new Ee(o, n, i));
    }, this.directives = new x({ version: e.version || "1.2" }), this.options = e;
  }
  decorate(e, t) {
    const { comment: n, afterEmptyLine: i } = Ut(this.prelude);
    if (n) {
      const r = e.contents;
      if (t)
        e.comment = e.comment ? `${e.comment}
${n}` : n;
      else if (i || e.directives.docStart || !r)
        e.commentBefore = n;
      else if (L(r) && !r.flow && r.items.length > 0) {
        let o = r.items[0];
        C(o) && (o = o.key);
        const l = o.commentBefore;
        o.commentBefore = l ? `${n}
${l}` : n;
      } else {
        const o = r.commentBefore;
        r.commentBefore = o ? `${n}
${o}` : n;
      }
    }
    if (t) {
      for (let r = 0; r < this.errors.length; ++r)
        e.errors.push(this.errors[r]);
      for (let r = 0; r < this.warnings.length; ++r)
        e.warnings.push(this.warnings[r]);
    } else
      e.errors = this.errors, e.warnings = this.warnings;
    this.prelude = [], this.errors = [], this.warnings = [];
  }
  /**
   * Current stream status information.
   *
   * Mostly useful at the end of input for an empty stream.
   */
  streamInfo() {
    return {
      comment: Ut(this.prelude).comment,
      directives: this.directives,
      errors: this.errors,
      warnings: this.warnings
    };
  }
  /**
   * Compose tokens into documents.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *compose(e, t = !1, n = -1) {
    for (const i of e)
      yield* this.next(i);
    yield* this.end(t, n);
  }
  /** Advance the composer by one CST token. */
  *next(e) {
    switch (e.type) {
      case "directive":
        this.directives.add(e.source, (t, n, i) => {
          const r = $e(e);
          r[0] += t, this.onError(r, "BAD_DIRECTIVE", n, i);
        }), this.prelude.push(e.source), this.atDirectives = !0;
        break;
      case "document": {
        const t = Jn(this.options, this.directives, e, this.onError);
        this.atDirectives && !t.directives.docStart && this.onError(e, "MISSING_CHAR", "Missing directives-end/doc-start indicator line"), this.decorate(t, !1), this.doc && (yield this.doc), this.doc = t, this.atDirectives = !1;
        break;
      }
      case "byte-order-mark":
      case "space":
        break;
      case "comment":
      case "newline":
        this.prelude.push(e.source);
        break;
      case "error": {
        const t = e.source ? `${e.message}: ${JSON.stringify(e.source)}` : e.message, n = new Ee($e(e), "UNEXPECTED_TOKEN", t);
        this.atDirectives || !this.doc ? this.errors.push(n) : this.doc.errors.push(n);
        break;
      }
      case "doc-end": {
        if (!this.doc) {
          const n = "Unexpected doc-end without preceding document";
          this.errors.push(new Ee($e(e), "UNEXPECTED_TOKEN", n));
          break;
        }
        this.doc.directives.docEnd = !0;
        const t = _e(e.end, e.offset + e.source.length, this.doc.options.strict, this.onError);
        if (this.decorate(this.doc, !0), t.comment) {
          const n = this.doc.comment;
          this.doc.comment = n ? `${n}
${t.comment}` : t.comment;
        }
        this.doc.range[2] = t.offset;
        break;
      }
      default:
        this.errors.push(new Ee($e(e), "UNEXPECTED_TOKEN", `Unsupported token ${e.type}`));
    }
  }
  /**
   * Call at end of input to yield any remaining document.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *end(e = !1, t = -1) {
    if (this.doc)
      this.decorate(this.doc, !0), yield this.doc, this.doc = null;
    else if (e) {
      const n = Object.assign({ _directives: this.directives }, this.options), i = new st(void 0, n);
      this.atDirectives && this.onError(t, "MISSING_CHAR", "Missing directives-end indicator line"), i.range = [0, t, t], this.decorate(i, !1), yield i;
    }
  }
}
const Cs = "\uFEFF", _s = "", js = "", wt = "";
function zn(s) {
  switch (s) {
    case Cs:
      return "byte-order-mark";
    case _s:
      return "doc-mode";
    case js:
      return "flow-error-end";
    case wt:
      return "scalar";
    case "---":
      return "doc-start";
    case "...":
      return "doc-end";
    case "":
    case `
`:
    case `\r
`:
      return "newline";
    case "-":
      return "seq-item-ind";
    case "?":
      return "explicit-key-ind";
    case ":":
      return "map-value-ind";
    case "{":
      return "flow-map-start";
    case "}":
      return "flow-map-end";
    case "[":
      return "flow-seq-start";
    case "]":
      return "flow-seq-end";
    case ",":
      return "comma";
  }
  switch (s[0]) {
    case " ":
    case "	":
      return "space";
    case "#":
      return "comment";
    case "%":
      return "directive-line";
    case "*":
      return "alias";
    case "&":
      return "anchor";
    case "!":
      return "tag";
    case "'":
      return "single-quoted-scalar";
    case '"':
      return "double-quoted-scalar";
    case "|":
    case ">":
      return "block-scalar-header";
  }
  return null;
}
function U(s) {
  switch (s) {
    case void 0:
    case " ":
    case `
`:
    case "\r":
    case "	":
      return !0;
    default:
      return !1;
  }
}
const Vt = new Set("0123456789ABCDEFabcdef"), Hn = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()"), Be = new Set(",[]{}"), Qn = new Set(` ,[]{}
\r	`), ut = (s) => !s || Qn.has(s);
class Xn {
  constructor() {
    this.atEnd = !1, this.blockScalarIndent = -1, this.blockScalarKeep = !1, this.buffer = "", this.flowKey = !1, this.flowLevel = 0, this.indentNext = 0, this.indentValue = 0, this.lineEndPos = null, this.next = null, this.pos = 0;
  }
  /**
   * Generate YAML tokens from the `source` string. If `incomplete`,
   * a part of the last line may be left as a buffer for the next call.
   *
   * @returns A generator of lexical tokens
   */
  *lex(e, t = !1) {
    if (e) {
      if (typeof e != "string")
        throw TypeError("source is not a string");
      this.buffer = this.buffer ? this.buffer + e : e, this.lineEndPos = null;
    }
    this.atEnd = !t;
    let n = this.next ?? "stream";
    for (; n && (t || this.hasChars(1)); )
      n = yield* this.parseNext(n);
  }
  atLineEnd() {
    let e = this.pos, t = this.buffer[e];
    for (; t === " " || t === "	"; )
      t = this.buffer[++e];
    return !t || t === "#" || t === `
` ? !0 : t === "\r" ? this.buffer[e + 1] === `
` : !1;
  }
  charAt(e) {
    return this.buffer[this.pos + e];
  }
  continueScalar(e) {
    let t = this.buffer[e];
    if (this.indentNext > 0) {
      let n = 0;
      for (; t === " "; )
        t = this.buffer[++n + e];
      if (t === "\r") {
        const i = this.buffer[n + e + 1];
        if (i === `
` || !i && !this.atEnd)
          return e + n + 1;
      }
      return t === `
` || n >= this.indentNext || !t && !this.atEnd ? e + n : -1;
    }
    if (t === "-" || t === ".") {
      const n = this.buffer.substr(e, 3);
      if ((n === "---" || n === "...") && U(this.buffer[e + 3]))
        return -1;
    }
    return e;
  }
  getLine() {
    let e = this.lineEndPos;
    return (typeof e != "number" || e !== -1 && e < this.pos) && (e = this.buffer.indexOf(`
`, this.pos), this.lineEndPos = e), e === -1 ? this.atEnd ? this.buffer.substring(this.pos) : null : (this.buffer[e - 1] === "\r" && (e -= 1), this.buffer.substring(this.pos, e));
  }
  hasChars(e) {
    return this.pos + e <= this.buffer.length;
  }
  setNext(e) {
    return this.buffer = this.buffer.substring(this.pos), this.pos = 0, this.lineEndPos = null, this.next = e, null;
  }
  peek(e) {
    return this.buffer.substr(this.pos, e);
  }
  *parseNext(e) {
    switch (e) {
      case "stream":
        return yield* this.parseStream();
      case "line-start":
        return yield* this.parseLineStart();
      case "block-start":
        return yield* this.parseBlockStart();
      case "doc":
        return yield* this.parseDocument();
      case "flow":
        return yield* this.parseFlowCollection();
      case "quoted-scalar":
        return yield* this.parseQuotedScalar();
      case "block-scalar":
        return yield* this.parseBlockScalar();
      case "plain-scalar":
        return yield* this.parsePlainScalar();
    }
  }
  *parseStream() {
    let e = this.getLine();
    if (e === null)
      return this.setNext("stream");
    if (e[0] === Cs && (yield* this.pushCount(1), e = e.substring(1)), e[0] === "%") {
      let t = e.length, n = e.indexOf("#");
      for (; n !== -1; ) {
        const r = e[n - 1];
        if (r === " " || r === "	") {
          t = n - 1;
          break;
        } else
          n = e.indexOf("#", n + 1);
      }
      for (; ; ) {
        const r = e[t - 1];
        if (r === " " || r === "	")
          t -= 1;
        else
          break;
      }
      const i = (yield* this.pushCount(t)) + (yield* this.pushSpaces(!0));
      return yield* this.pushCount(e.length - i), this.pushNewline(), "stream";
    }
    if (this.atLineEnd()) {
      const t = yield* this.pushSpaces(!0);
      return yield* this.pushCount(e.length - t), yield* this.pushNewline(), "stream";
    }
    return yield _s, yield* this.parseLineStart();
  }
  *parseLineStart() {
    const e = this.charAt(0);
    if (!e && !this.atEnd)
      return this.setNext("line-start");
    if (e === "-" || e === ".") {
      if (!this.atEnd && !this.hasChars(4))
        return this.setNext("line-start");
      const t = this.peek(3);
      if ((t === "---" || t === "...") && U(this.charAt(3)))
        return yield* this.pushCount(3), this.indentValue = 0, this.indentNext = 0, t === "---" ? "doc" : "stream";
    }
    return this.indentValue = yield* this.pushSpaces(!1), this.indentNext > this.indentValue && !U(this.charAt(1)) && (this.indentNext = this.indentValue), yield* this.parseBlockStart();
  }
  *parseBlockStart() {
    const [e, t] = this.peek(2);
    if (!t && !this.atEnd)
      return this.setNext("block-start");
    if ((e === "-" || e === "?" || e === ":") && U(t)) {
      const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(!0));
      return this.indentNext = this.indentValue + 1, this.indentValue += n, "block-start";
    }
    return "doc";
  }
  *parseDocument() {
    yield* this.pushSpaces(!0);
    const e = this.getLine();
    if (e === null)
      return this.setNext("doc");
    let t = yield* this.pushIndicators();
    switch (e[t]) {
      case "#":
        yield* this.pushCount(e.length - t);
      // fallthrough
      case void 0:
        return yield* this.pushNewline(), yield* this.parseLineStart();
      case "{":
      case "[":
        return yield* this.pushCount(1), this.flowKey = !1, this.flowLevel = 1, "flow";
      case "}":
      case "]":
        return yield* this.pushCount(1), "doc";
      case "*":
        return yield* this.pushUntil(ut), "doc";
      case '"':
      case "'":
        return yield* this.parseQuotedScalar();
      case "|":
      case ">":
        return t += yield* this.parseBlockScalarHeader(), t += yield* this.pushSpaces(!0), yield* this.pushCount(e.length - t), yield* this.pushNewline(), yield* this.parseBlockScalar();
      default:
        return yield* this.parsePlainScalar();
    }
  }
  *parseFlowCollection() {
    let e, t, n = -1;
    do
      e = yield* this.pushNewline(), e > 0 ? (t = yield* this.pushSpaces(!1), this.indentValue = n = t) : t = 0, t += yield* this.pushSpaces(!0);
    while (e + t > 0);
    const i = this.getLine();
    if (i === null)
      return this.setNext("flow");
    if ((n !== -1 && n < this.indentNext && i[0] !== "#" || n === 0 && (i.startsWith("---") || i.startsWith("...")) && U(i[3])) && !(n === this.indentNext - 1 && this.flowLevel === 1 && (i[0] === "]" || i[0] === "}")))
      return this.flowLevel = 0, yield js, yield* this.parseLineStart();
    let r = 0;
    for (; i[r] === ","; )
      r += yield* this.pushCount(1), r += yield* this.pushSpaces(!0), this.flowKey = !1;
    switch (r += yield* this.pushIndicators(), i[r]) {
      case void 0:
        return "flow";
      case "#":
        return yield* this.pushCount(i.length - r), "flow";
      case "{":
      case "[":
        return yield* this.pushCount(1), this.flowKey = !1, this.flowLevel += 1, "flow";
      case "}":
      case "]":
        return yield* this.pushCount(1), this.flowKey = !0, this.flowLevel -= 1, this.flowLevel ? "flow" : "doc";
      case "*":
        return yield* this.pushUntil(ut), "flow";
      case '"':
      case "'":
        return this.flowKey = !0, yield* this.parseQuotedScalar();
      case ":": {
        const o = this.charAt(1);
        if (this.flowKey || U(o) || o === ",")
          return this.flowKey = !1, yield* this.pushCount(1), yield* this.pushSpaces(!0), "flow";
      }
      // fallthrough
      default:
        return this.flowKey = !1, yield* this.parsePlainScalar();
    }
  }
  *parseQuotedScalar() {
    const e = this.charAt(0);
    let t = this.buffer.indexOf(e, this.pos + 1);
    if (e === "'")
      for (; t !== -1 && this.buffer[t + 1] === "'"; )
        t = this.buffer.indexOf("'", t + 2);
    else
      for (; t !== -1; ) {
        let r = 0;
        for (; this.buffer[t - 1 - r] === "\\"; )
          r += 1;
        if (r % 2 === 0)
          break;
        t = this.buffer.indexOf('"', t + 1);
      }
    const n = this.buffer.substring(0, t);
    let i = n.indexOf(`
`, this.pos);
    if (i !== -1) {
      for (; i !== -1; ) {
        const r = this.continueScalar(i + 1);
        if (r === -1)
          break;
        i = n.indexOf(`
`, r);
      }
      i !== -1 && (t = i - (n[i - 1] === "\r" ? 2 : 1));
    }
    if (t === -1) {
      if (!this.atEnd)
        return this.setNext("quoted-scalar");
      t = this.buffer.length;
    }
    return yield* this.pushToIndex(t + 1, !1), this.flowLevel ? "flow" : "doc";
  }
  *parseBlockScalarHeader() {
    this.blockScalarIndent = -1, this.blockScalarKeep = !1;
    let e = this.pos;
    for (; ; ) {
      const t = this.buffer[++e];
      if (t === "+")
        this.blockScalarKeep = !0;
      else if (t > "0" && t <= "9")
        this.blockScalarIndent = Number(t) - 1;
      else if (t !== "-")
        break;
    }
    return yield* this.pushUntil((t) => U(t) || t === "#");
  }
  *parseBlockScalar() {
    let e = this.pos - 1, t = 0, n;
    e: for (let r = this.pos; n = this.buffer[r]; ++r)
      switch (n) {
        case " ":
          t += 1;
          break;
        case `
`:
          e = r, t = 0;
          break;
        case "\r": {
          const o = this.buffer[r + 1];
          if (!o && !this.atEnd)
            return this.setNext("block-scalar");
          if (o === `
`)
            break;
        }
        // fallthrough
        default:
          break e;
      }
    if (!n && !this.atEnd)
      return this.setNext("block-scalar");
    if (t >= this.indentNext) {
      this.blockScalarIndent === -1 ? this.indentNext = t : this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
      do {
        const r = this.continueScalar(e + 1);
        if (r === -1)
          break;
        e = this.buffer.indexOf(`
`, r);
      } while (e !== -1);
      if (e === -1) {
        if (!this.atEnd)
          return this.setNext("block-scalar");
        e = this.buffer.length;
      }
    }
    let i = e + 1;
    for (n = this.buffer[i]; n === " "; )
      n = this.buffer[++i];
    if (n === "	") {
      for (; n === "	" || n === " " || n === "\r" || n === `
`; )
        n = this.buffer[++i];
      e = i - 1;
    } else if (!this.blockScalarKeep)
      do {
        let r = e - 1, o = this.buffer[r];
        o === "\r" && (o = this.buffer[--r]);
        const l = r;
        for (; o === " "; )
          o = this.buffer[--r];
        if (o === `
` && r >= this.pos && r + 1 + t > l)
          e = r;
        else
          break;
      } while (!0);
    return yield wt, yield* this.pushToIndex(e + 1, !0), yield* this.parseLineStart();
  }
  *parsePlainScalar() {
    const e = this.flowLevel > 0;
    let t = this.pos - 1, n = this.pos - 1, i;
    for (; i = this.buffer[++n]; )
      if (i === ":") {
        const r = this.buffer[n + 1];
        if (U(r) || e && Be.has(r))
          break;
        t = n;
      } else if (U(i)) {
        let r = this.buffer[n + 1];
        if (i === "\r" && (r === `
` ? (n += 1, i = `
`, r = this.buffer[n + 1]) : t = n), r === "#" || e && Be.has(r))
          break;
        if (i === `
`) {
          const o = this.continueScalar(n + 1);
          if (o === -1)
            break;
          n = Math.max(n, o - 2);
        }
      } else {
        if (e && Be.has(i))
          break;
        t = n;
      }
    return !i && !this.atEnd ? this.setNext("plain-scalar") : (yield wt, yield* this.pushToIndex(t + 1, !0), e ? "flow" : "doc");
  }
  *pushCount(e) {
    return e > 0 ? (yield this.buffer.substr(this.pos, e), this.pos += e, e) : 0;
  }
  *pushToIndex(e, t) {
    const n = this.buffer.slice(this.pos, e);
    return n ? (yield n, this.pos += n.length, n.length) : (t && (yield ""), 0);
  }
  *pushIndicators() {
    let e = 0;
    e: for (; ; ) {
      switch (this.charAt(0)) {
        case "!":
          e += yield* this.pushTag(), e += yield* this.pushSpaces(!0);
          continue e;
        case "&":
          e += yield* this.pushUntil(ut), e += yield* this.pushSpaces(!0);
          continue e;
        case "-":
        // this is an error
        case "?":
        // this is an error outside flow collections
        case ":": {
          const t = this.flowLevel > 0, n = this.charAt(1);
          if (U(n) || t && Be.has(n)) {
            t ? this.flowKey && (this.flowKey = !1) : this.indentNext = this.indentValue + 1, e += yield* this.pushCount(1), e += yield* this.pushSpaces(!0);
            continue e;
          }
        }
      }
      break e;
    }
    return e;
  }
  *pushTag() {
    if (this.charAt(1) === "<") {
      let e = this.pos + 2, t = this.buffer[e];
      for (; !U(t) && t !== ">"; )
        t = this.buffer[++e];
      return yield* this.pushToIndex(t === ">" ? e + 1 : e, !1);
    } else {
      let e = this.pos + 1, t = this.buffer[e];
      for (; t; )
        if (Hn.has(t))
          t = this.buffer[++e];
        else if (t === "%" && Vt.has(this.buffer[e + 1]) && Vt.has(this.buffer[e + 2]))
          t = this.buffer[e += 3];
        else
          break;
      return yield* this.pushToIndex(e, !1);
    }
  }
  *pushNewline() {
    const e = this.buffer[this.pos];
    return e === `
` ? yield* this.pushCount(1) : e === "\r" && this.charAt(1) === `
` ? yield* this.pushCount(2) : 0;
  }
  *pushSpaces(e) {
    let t = this.pos - 1, n;
    do
      n = this.buffer[++t];
    while (n === " " || e && n === "	");
    const i = t - this.pos;
    return i > 0 && (yield this.buffer.substr(this.pos, i), this.pos = t), i;
  }
  *pushUntil(e) {
    let t = this.pos, n = this.buffer[t];
    for (; !e(n); )
      n = this.buffer[++t];
    return yield* this.pushToIndex(t, !1);
  }
}
class Zn {
  constructor() {
    this.lineStarts = [], this.addNewLine = (e) => this.lineStarts.push(e), this.linePos = (e) => {
      let t = 0, n = this.lineStarts.length;
      for (; t < n; ) {
        const r = t + n >> 1;
        this.lineStarts[r] < e ? t = r + 1 : n = r;
      }
      if (this.lineStarts[t] === e)
        return { line: t + 1, col: 1 };
      if (t === 0)
        return { line: 0, col: e };
      const i = this.lineStarts[t - 1];
      return { line: t, col: e - i + 1 };
    };
  }
}
function Z(s, e) {
  for (let t = 0; t < s.length; ++t)
    if (s[t].type === e)
      return !0;
  return !1;
}
function Gt(s) {
  for (let e = 0; e < s.length; ++e)
    switch (s[e].type) {
      case "space":
      case "comment":
      case "newline":
        break;
      default:
        return e;
    }
  return -1;
}
function xs(s) {
  switch (s?.type) {
    case "alias":
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "flow-collection":
      return !0;
    default:
      return !1;
  }
}
function De(s) {
  switch (s.type) {
    case "document":
      return s.start;
    case "block-map": {
      const e = s.items[s.items.length - 1];
      return e.sep ?? e.start;
    }
    case "block-seq":
      return s.items[s.items.length - 1].start;
    /* istanbul ignore next should not happen */
    default:
      return [];
  }
}
function ae(s) {
  if (s.length === 0)
    return [];
  let e = s.length;
  e: for (; --e >= 0; )
    switch (s[e].type) {
      case "doc-start":
      case "explicit-key-ind":
      case "map-value-ind":
      case "seq-item-ind":
      case "newline":
        break e;
    }
  for (; s[++e]?.type === "space"; )
    ;
  return s.splice(e, s.length);
}
function Ge(s, e) {
  if (e.length < 1e5)
    Array.prototype.push.apply(s, e);
  else
    for (let t = 0; t < e.length; ++t)
      s.push(e[t]);
}
function Yt(s) {
  if (s.start.type === "flow-seq-start")
    for (const e of s.items)
      e.sep && !e.value && !Z(e.start, "explicit-key-ind") && !Z(e.sep, "map-value-ind") && (e.key && (e.value = e.key), delete e.key, xs(e.value) ? e.value.end ? Ge(e.value.end, e.sep) : e.value.end = e.sep : Ge(e.start, e.sep), delete e.sep);
}
class ei {
  /**
   * @param onNewLine - If defined, called separately with the start position of
   *   each new line (in `parse()`, including the start of input).
   */
  constructor(e) {
    this.atNewLine = !0, this.atScalar = !1, this.indent = 0, this.offset = 0, this.onKeyLine = !1, this.stack = [], this.source = "", this.type = "", this.lexer = new Xn(), this.onNewLine = e;
  }
  /**
   * Parse `source` as a YAML stream.
   * If `incomplete`, a part of the last line may be left as a buffer for the next call.
   *
   * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
   *
   * @returns A generator of tokens representing each directive, document, and other structure.
   */
  *parse(e, t = !1) {
    this.onNewLine && this.offset === 0 && this.onNewLine(0);
    for (const n of this.lexer.lex(e, t))
      yield* this.next(n);
    t || (yield* this.end());
  }
  /**
   * Advance the parser by the `source` of one lexical token.
   */
  *next(e) {
    if (this.source = e, this.atScalar) {
      this.atScalar = !1, yield* this.step(), this.offset += e.length;
      return;
    }
    const t = zn(e);
    if (t)
      if (t === "scalar")
        this.atNewLine = !1, this.atScalar = !0, this.type = "scalar";
      else {
        switch (this.type = t, yield* this.step(), t) {
          case "newline":
            this.atNewLine = !0, this.indent = 0, this.onNewLine && this.onNewLine(this.offset + e.length);
            break;
          case "space":
            this.atNewLine && e[0] === " " && (this.indent += e.length);
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            this.atNewLine && (this.indent += e.length);
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = !1;
        }
        this.offset += e.length;
      }
    else {
      const n = `Not a YAML token: ${e}`;
      yield* this.pop({ type: "error", offset: this.offset, message: n, source: e }), this.offset += e.length;
    }
  }
  /** Call at end of input to push out any remaining constructions */
  *end() {
    for (; this.stack.length > 0; )
      yield* this.pop();
  }
  get sourceToken() {
    return {
      type: this.type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
  }
  *step() {
    const e = this.peek(1);
    if (this.type === "doc-end" && e?.type !== "doc-end") {
      for (; this.stack.length > 0; )
        yield* this.pop();
      this.stack.push({
        type: "doc-end",
        offset: this.offset,
        source: this.source
      });
      return;
    }
    if (!e)
      return yield* this.stream();
    switch (e.type) {
      case "document":
        return yield* this.document(e);
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return yield* this.scalar(e);
      case "block-scalar":
        return yield* this.blockScalar(e);
      case "block-map":
        return yield* this.blockMap(e);
      case "block-seq":
        return yield* this.blockSequence(e);
      case "flow-collection":
        return yield* this.flowCollection(e);
      case "doc-end":
        return yield* this.documentEnd(e);
    }
    yield* this.pop();
  }
  peek(e) {
    return this.stack[this.stack.length - e];
  }
  *pop(e) {
    const t = e ?? this.stack.pop();
    if (!t)
      yield { type: "error", offset: this.offset, source: "", message: "Tried to pop an empty stack" };
    else if (this.stack.length === 0)
      yield t;
    else {
      const n = this.peek(1);
      switch (t.type === "block-scalar" ? t.indent = "indent" in n ? n.indent : 0 : t.type === "flow-collection" && n.type === "document" && (t.indent = 0), t.type === "flow-collection" && Yt(t), n.type) {
        case "document":
          n.value = t;
          break;
        case "block-scalar":
          n.props.push(t);
          break;
        case "block-map": {
          const i = n.items[n.items.length - 1];
          if (i.value) {
            n.items.push({ start: [], key: t, sep: [] }), this.onKeyLine = !0;
            return;
          } else if (i.sep)
            i.value = t;
          else {
            Object.assign(i, { key: t, sep: [] }), this.onKeyLine = !i.explicitKey;
            return;
          }
          break;
        }
        case "block-seq": {
          const i = n.items[n.items.length - 1];
          i.value ? n.items.push({ start: [], value: t }) : i.value = t;
          break;
        }
        case "flow-collection": {
          const i = n.items[n.items.length - 1];
          !i || i.value ? n.items.push({ start: [], key: t, sep: [] }) : i.sep ? i.value = t : Object.assign(i, { key: t, sep: [] });
          return;
        }
        /* istanbul ignore next should not happen */
        default:
          yield* this.pop(), yield* this.pop(t);
      }
      if ((n.type === "document" || n.type === "block-map" || n.type === "block-seq") && (t.type === "block-map" || t.type === "block-seq")) {
        const i = t.items[t.items.length - 1];
        i && !i.sep && !i.value && i.start.length > 0 && Gt(i.start) === -1 && (t.indent === 0 || i.start.every((r) => r.type !== "comment" || r.indent < t.indent)) && (n.type === "document" ? n.end = i.start : n.items.push({ start: i.start }), t.items.splice(-1, 1));
      }
    }
  }
  *stream() {
    switch (this.type) {
      case "directive-line":
        yield { type: "directive", offset: this.offset, source: this.source };
        return;
      case "byte-order-mark":
      case "space":
      case "comment":
      case "newline":
        yield this.sourceToken;
        return;
      case "doc-mode":
      case "doc-start": {
        const e = {
          type: "document",
          offset: this.offset,
          start: []
        };
        this.type === "doc-start" && e.start.push(this.sourceToken), this.stack.push(e);
        return;
      }
    }
    yield {
      type: "error",
      offset: this.offset,
      message: `Unexpected ${this.type} token in YAML stream`,
      source: this.source
    };
  }
  *document(e) {
    if (e.value)
      return yield* this.lineEnd(e);
    switch (this.type) {
      case "doc-start": {
        Gt(e.start) !== -1 ? (yield* this.pop(), yield* this.step()) : e.start.push(this.sourceToken);
        return;
      }
      case "anchor":
      case "tag":
      case "space":
      case "comment":
      case "newline":
        e.start.push(this.sourceToken);
        return;
    }
    const t = this.startBlockValue(e);
    t ? this.stack.push(t) : yield {
      type: "error",
      offset: this.offset,
      message: `Unexpected ${this.type} token in YAML document`,
      source: this.source
    };
  }
  *scalar(e) {
    if (this.type === "map-value-ind") {
      const t = De(this.peek(2)), n = ae(t);
      let i;
      e.end ? (i = e.end, i.push(this.sourceToken), delete e.end) : i = [this.sourceToken];
      const r = {
        type: "block-map",
        offset: e.offset,
        indent: e.indent,
        items: [{ start: n, key: e, sep: i }]
      };
      this.onKeyLine = !0, this.stack[this.stack.length - 1] = r;
    } else
      yield* this.lineEnd(e);
  }
  *blockScalar(e) {
    switch (this.type) {
      case "space":
      case "comment":
      case "newline":
        e.props.push(this.sourceToken);
        return;
      case "scalar":
        if (e.source = this.source, this.atNewLine = !0, this.indent = 0, this.onNewLine) {
          let t = this.source.indexOf(`
`) + 1;
          for (; t !== 0; )
            this.onNewLine(this.offset + t), t = this.source.indexOf(`
`, t) + 1;
        }
        yield* this.pop();
        break;
      /* istanbul ignore next should not happen */
      default:
        yield* this.pop(), yield* this.step();
    }
  }
  *blockMap(e) {
    const t = e.items[e.items.length - 1];
    switch (this.type) {
      case "newline":
        if (this.onKeyLine = !1, t.value) {
          const n = "end" in t.value ? t.value.end : void 0;
          (Array.isArray(n) ? n[n.length - 1] : void 0)?.type === "comment" ? n?.push(this.sourceToken) : e.items.push({ start: [this.sourceToken] });
        } else t.sep ? t.sep.push(this.sourceToken) : t.start.push(this.sourceToken);
        return;
      case "space":
      case "comment":
        if (t.value)
          e.items.push({ start: [this.sourceToken] });
        else if (t.sep)
          t.sep.push(this.sourceToken);
        else {
          if (this.atIndentedComment(t.start, e.indent)) {
            const i = e.items[e.items.length - 2]?.value?.end;
            if (Array.isArray(i)) {
              Ge(i, t.start), i.push(this.sourceToken), e.items.pop();
              return;
            }
          }
          t.start.push(this.sourceToken);
        }
        return;
    }
    if (this.indent >= e.indent) {
      const n = !this.onKeyLine && this.indent === e.indent, i = n && (t.sep || t.explicitKey) && this.type !== "seq-item-ind";
      let r = [];
      if (i && t.sep && !t.value) {
        const o = [];
        for (let l = 0; l < t.sep.length; ++l) {
          const a = t.sep[l];
          switch (a.type) {
            case "newline":
              o.push(l);
              break;
            case "space":
              break;
            case "comment":
              a.indent > e.indent && (o.length = 0);
              break;
            default:
              o.length = 0;
          }
        }
        o.length >= 2 && (r = t.sep.splice(o[1]));
      }
      switch (this.type) {
        case "anchor":
        case "tag":
          i || t.value ? (r.push(this.sourceToken), e.items.push({ start: r }), this.onKeyLine = !0) : t.sep ? t.sep.push(this.sourceToken) : t.start.push(this.sourceToken);
          return;
        case "explicit-key-ind":
          !t.sep && !t.explicitKey ? (t.start.push(this.sourceToken), t.explicitKey = !0) : i || t.value ? (r.push(this.sourceToken), e.items.push({ start: r, explicitKey: !0 })) : this.stack.push({
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken], explicitKey: !0 }]
          }), this.onKeyLine = !0;
          return;
        case "map-value-ind":
          if (t.explicitKey)
            if (t.sep)
              if (t.value)
                e.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (Z(t.sep, "map-value-ind"))
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: r, key: null, sep: [this.sourceToken] }]
                });
              else if (xs(t.key) && !Z(t.sep, "newline")) {
                const o = ae(t.start), l = t.key, a = t.sep;
                a.push(this.sourceToken), delete t.key, delete t.sep, this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: o, key: l, sep: a }]
                });
              } else r.length > 0 ? t.sep = t.sep.concat(r, this.sourceToken) : t.sep.push(this.sourceToken);
            else if (Z(t.start, "newline"))
              Object.assign(t, { key: null, sep: [this.sourceToken] });
            else {
              const o = ae(t.start);
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: o, key: null, sep: [this.sourceToken] }]
              });
            }
          else
            t.sep ? t.value || i ? e.items.push({ start: r, key: null, sep: [this.sourceToken] }) : Z(t.sep, "map-value-ind") ? this.stack.push({
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [], key: null, sep: [this.sourceToken] }]
            }) : t.sep.push(this.sourceToken) : Object.assign(t, { key: null, sep: [this.sourceToken] });
          this.onKeyLine = !0;
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const o = this.flowScalar(this.type);
          i || t.value ? (e.items.push({ start: r, key: o, sep: [] }), this.onKeyLine = !0) : t.sep ? this.stack.push(o) : (Object.assign(t, { key: o, sep: [] }), this.onKeyLine = !0);
          return;
        }
        default: {
          const o = this.startBlockValue(e);
          if (o) {
            if (o.type === "block-seq") {
              if (!t.explicitKey && t.sep && !Z(t.sep, "newline")) {
                yield* this.pop({
                  type: "error",
                  offset: this.offset,
                  message: "Unexpected block-seq-ind on same line with key",
                  source: this.source
                });
                return;
              }
            } else n && e.items.push({ start: r });
            this.stack.push(o);
            return;
          }
        }
      }
    }
    yield* this.pop(), yield* this.step();
  }
  *blockSequence(e) {
    const t = e.items[e.items.length - 1];
    switch (this.type) {
      case "newline":
        if (t.value) {
          const n = "end" in t.value ? t.value.end : void 0;
          (Array.isArray(n) ? n[n.length - 1] : void 0)?.type === "comment" ? n?.push(this.sourceToken) : e.items.push({ start: [this.sourceToken] });
        } else
          t.start.push(this.sourceToken);
        return;
      case "space":
      case "comment":
        if (t.value)
          e.items.push({ start: [this.sourceToken] });
        else {
          if (this.atIndentedComment(t.start, e.indent)) {
            const i = e.items[e.items.length - 2]?.value?.end;
            if (Array.isArray(i)) {
              Ge(i, t.start), i.push(this.sourceToken), e.items.pop();
              return;
            }
          }
          t.start.push(this.sourceToken);
        }
        return;
      case "anchor":
      case "tag":
        if (t.value || this.indent <= e.indent)
          break;
        t.start.push(this.sourceToken);
        return;
      case "seq-item-ind":
        if (this.indent !== e.indent)
          break;
        t.value || Z(t.start, "seq-item-ind") ? e.items.push({ start: [this.sourceToken] }) : t.start.push(this.sourceToken);
        return;
    }
    if (this.indent > e.indent) {
      const n = this.startBlockValue(e);
      if (n) {
        this.stack.push(n);
        return;
      }
    }
    yield* this.pop(), yield* this.step();
  }
  *flowCollection(e) {
    const t = e.items[e.items.length - 1];
    if (this.type === "flow-error-end") {
      let n;
      do
        yield* this.pop(), n = this.peek(1);
      while (n?.type === "flow-collection");
    } else if (e.end.length === 0) {
      switch (this.type) {
        case "comma":
        case "explicit-key-ind":
          !t || t.sep ? e.items.push({ start: [this.sourceToken] }) : t.start.push(this.sourceToken);
          return;
        case "map-value-ind":
          !t || t.value ? e.items.push({ start: [], key: null, sep: [this.sourceToken] }) : t.sep ? t.sep.push(this.sourceToken) : Object.assign(t, { key: null, sep: [this.sourceToken] });
          return;
        case "space":
        case "comment":
        case "newline":
        case "anchor":
        case "tag":
          !t || t.value ? e.items.push({ start: [this.sourceToken] }) : t.sep ? t.sep.push(this.sourceToken) : t.start.push(this.sourceToken);
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const i = this.flowScalar(this.type);
          !t || t.value ? e.items.push({ start: [], key: i, sep: [] }) : t.sep ? this.stack.push(i) : Object.assign(t, { key: i, sep: [] });
          return;
        }
        case "flow-map-end":
        case "flow-seq-end":
          e.end.push(this.sourceToken);
          return;
      }
      const n = this.startBlockValue(e);
      n ? this.stack.push(n) : (yield* this.pop(), yield* this.step());
    } else {
      const n = this.peek(2);
      if (n.type === "block-map" && (this.type === "map-value-ind" && n.indent === e.indent || this.type === "newline" && !n.items[n.items.length - 1].sep))
        yield* this.pop(), yield* this.step();
      else if (this.type === "map-value-ind" && n.type !== "flow-collection") {
        const i = De(n), r = ae(i);
        Yt(e);
        const o = e.end.splice(1, e.end.length);
        o.push(this.sourceToken);
        const l = {
          type: "block-map",
          offset: e.offset,
          indent: e.indent,
          items: [{ start: r, key: e, sep: o }]
        };
        this.onKeyLine = !0, this.stack[this.stack.length - 1] = l;
      } else
        yield* this.lineEnd(e);
    }
  }
  flowScalar(e) {
    if (this.onNewLine) {
      let t = this.source.indexOf(`
`) + 1;
      for (; t !== 0; )
        this.onNewLine(this.offset + t), t = this.source.indexOf(`
`, t) + 1;
    }
    return {
      type: e,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
  }
  startBlockValue(e) {
    switch (this.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return this.flowScalar(this.type);
      case "block-scalar-header":
        return {
          type: "block-scalar",
          offset: this.offset,
          indent: this.indent,
          props: [this.sourceToken],
          source: ""
        };
      case "flow-map-start":
      case "flow-seq-start":
        return {
          type: "flow-collection",
          offset: this.offset,
          indent: this.indent,
          start: this.sourceToken,
          items: [],
          end: []
        };
      case "seq-item-ind":
        return {
          type: "block-seq",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        };
      case "explicit-key-ind": {
        this.onKeyLine = !0;
        const t = De(e), n = ae(t);
        return n.push(this.sourceToken), {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: n, explicitKey: !0 }]
        };
      }
      case "map-value-ind": {
        this.onKeyLine = !0;
        const t = De(e), n = ae(t);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: n, key: null, sep: [this.sourceToken] }]
        };
      }
    }
    return null;
  }
  atIndentedComment(e, t) {
    return this.type !== "comment" || this.indent <= t ? !1 : e.every((n) => n.type === "newline" || n.type === "space");
  }
  *documentEnd(e) {
    this.type !== "doc-mode" && (e.end ? e.end.push(this.sourceToken) : e.end = [this.sourceToken], this.type === "newline" && (yield* this.pop()));
  }
  *lineEnd(e) {
    switch (this.type) {
      case "comma":
      case "doc-start":
      case "doc-end":
      case "flow-seq-end":
      case "flow-map-end":
      case "map-value-ind":
        yield* this.pop(), yield* this.step();
        break;
      case "newline":
        this.onKeyLine = !1;
      default:
        e.end ? e.end.push(this.sourceToken) : e.end = [this.sourceToken], this.type === "newline" && (yield* this.pop());
    }
  }
}
function ti(s) {
  const e = s.prettyErrors !== !1;
  return { lineCounter: s.lineCounter || e && new Zn() || null, prettyErrors: e };
}
function si(s, e = {}) {
  const { lineCounter: t, prettyErrors: n } = ti(e), i = new ei(t?.addNewLine), r = new Wn(e);
  let o = null;
  for (const l of r.compose(i.parse(s), !0, s.length))
    if (!o)
      o = l;
    else if (o.options.logLevel !== "silent") {
      o.errors.push(new Ee(l.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
      break;
    }
  return n && t && (o.errors.forEach(qt(s, t)), o.warnings.forEach(qt(s, t))), o;
}
const G = {
  comic: { title: "제목", cast: "등장인물", panels: "컷" },
  cast: { asset: "그림", label: "이름표" },
  panel: {
    mode: "구성",
    actors: "인물",
    dialogue: "대사",
    transfer: "전달",
    removeActors: "제외인물",
    diagram: "다이어그램"
  },
  actor: {
    id: "식별자",
    expression: "표정",
    gesture: "손모양",
    holding: "든소품",
    x: "가로위치",
    y: "세로위치",
    scale: "배율"
  },
  dialogue: {
    from: "화자",
    to: "상대",
    text: "내용",
    x: "가로위치",
    y: "세로위치",
    fontSize: "글자크기"
  },
  transfer: { from: "주는인물", to: "받는인물", prop: "소품" },
  diagram: {
    type: "종류",
    source: "원문",
    title: "제목",
    height: "높이"
  },
  options: {
    width: "너비",
    font: "글꼴",
    fontVersion: "글꼴버전",
    panelFormat: "컷비율"
  }
}, ni = {
  asset: { client: "클라이언트", server: "서버", database: "데이터베이스" },
  expression: {
    neutral: "보통",
    happy: "기쁨",
    confused: "어리둥절",
    sad: "슬픔",
    angry: "화남"
  },
  gesture: { wave: "인사손", point: "가리키는손" },
  prop: { request: "요청", data: "데이터", key: "열쇠" },
  mode: { full: "전체", before: "이전" },
  panelFormat: { compact: "기본", phone: "모바일" },
  diagramType: { mermaid: "머메이드" }
}, ii = {
  cast: { asset: "asset" },
  actor: { expression: "expression", gesture: "gesture", holding: "prop" },
  panel: { mode: "mode" },
  transfer: { prop: "prop" },
  diagram: { type: "diagramType" },
  options: { panelFormat: "panelFormat" }
};
function bt(s) {
  return !!s && typeof s == "object" && !Array.isArray(s);
}
function Ae(s, e, t, n) {
  if (!bt(s)) return s;
  const i = G[e], r = /* @__PURE__ */ Object.create(null);
  for (const [o, l] of Object.entries(s)) {
    const a = Object.keys(i).find(
      (m) => o === m || o === i[m]
    ) ?? o;
    Object.hasOwn(i, a) && i[a];
    const c = a;
    if (Object.hasOwn(r, c))
      throw new Error(
        `${n}: '${i[a]}'와 '${a}'은 같은 항목입니다. 하나만 작성하세요.`
      );
    let h = l;
    const u = ii[e], d = u && Object.hasOwn(u, a) ? u[a] : void 0;
    if (d && typeof l == "string") {
      const m = ni[d], y = Object.keys(m).find(
        (f) => l === f || l === m[f]
      );
      y && (h = y);
    }
    if (e === "comic" && a === "cast" && bt(l)) {
      const m = /* @__PURE__ */ Object.create(null);
      for (const [y, f] of Object.entries(l))
        m[y] = Ae(f, "cast", t, `${n}.등장인물.${y}`);
      h = m;
    } else if (e === "panel" && a === "diagram")
      h = Ae(l, "diagram", t, `${n}.다이어그램`);
    else if (Array.isArray(l)) {
      const m = e === "comic" && a === "panels" ? "panel" : e === "panel" && a === "actors" ? "actor" : e === "panel" && a === "dialogue" ? "dialogue" : e === "panel" && a === "transfer" ? "transfer" : void 0;
      m && (h = l.map(
        (y, f) => Ae(
          y,
          m,
          t,
          `${n}.${i[a]}[${f + 1}]`
        )
      ));
    }
    r[c] = h;
  }
  return r;
}
const ri = (s) => Ae(s, "comic", !1, "만화");
function oi(s) {
  const e = Ae(s, "options", !1, "표시 설정");
  if (!bt(e)) throw new Error("표시 설정: 객체가 필요합니다.");
  for (const t of Object.keys(e))
    if (!Object.hasOwn(G.options, t))
      throw new Error(`표시 설정: 알 수 없는 항목 '${t}'.`);
  return e;
}
function z(s, e) {
  if (!s || typeof s != "object" || Array.isArray(s))
    throw new Error(`${e}: 객체가 필요합니다.`);
  return s;
}
function j(s, e, t = 1e4) {
  if (typeof s != "string" || !s.trim())
    throw new Error(`${e}: 비어 있지 않은 문자열이 필요합니다.`);
  if (s.length > t)
    throw new Error(
      `${e}: 텍스트가 너무 깁니다. ${t}자 이내로 작성하세요.`
    );
  return s;
}
function le(s, e) {
  if (!Array.isArray(s)) throw new Error(`${e}: 목록이 필요합니다.`);
  return s;
}
function X(s, e, t) {
  for (const n of Object.keys(s))
    if (!e.includes(n))
      throw new Error(`${t}: 알 수 없는 항목 '${n}'.`);
}
function te(s, e, t, n) {
  if (s !== void 0) {
    if (typeof s != "number" || !Number.isFinite(s) || s < e || s > t)
      throw new Error(`${n}: ${e}~${t} 사이 숫자가 필요합니다.`);
    return s;
  }
}
function ai(s) {
  if (s.length > 1e5)
    throw new Error("코드가 너무 깁니다. 100KB 이내로 작성하세요.");
  const e = si(s, { uniqueKeys: !0 });
  if (e.errors.length) throw new Error(e.errors[0].message);
  const t = z(ri(e.toJS({ maxAliasCount: 20 })), "만화");
  X(t, Object.keys(G.comic), "만화");
  const n = /* @__PURE__ */ Object.create(null);
  for (const [o, l] of Object.entries(z(t.cast, "등장인물"))) {
    const a = z(l, `등장인물.${o}`);
    X(a, Object.keys(G.cast), `등장인물.${o}`);
    const c = j(a.asset, `등장인물.${o}.그림`);
    if (!Object.hasOwn(Ht, c))
      throw new Error(`등장인물.${o}: 없는 에셋 '${c}'.`);
    n[o] = {
      asset: c,
      label: a.label === void 0 ? o : j(a.label, `등장인물.${o}.이름표`)
    };
  }
  let i;
  const r = le(t.panels, "컷").map((o, l) => {
    const a = `컷 ${l + 1}`, c = { ...z(o, a) };
    if (X(c, Object.keys(G.panel), a), c.mode !== void 0 && c.mode !== "before" && c.mode !== "full")
      throw new Error(`${a}: 구성은 전체 또는 이전이어야 합니다.`);
    if (c.mode === "before") {
      if (!i)
        throw new Error(`${a}: 첫 컷에서는 이전 구성을 사용할 수 없습니다.`);
      const y = i.actors.map(
        (w) => ({ ...w })
      ), f = le(c.removeActors ?? [], `${a}.제외인물`).map(
        (w) => j(w, `${a}.제외인물`)
      );
      for (const w of f)
        if (!y.some((g) => g.id === w))
          throw new Error(`${a}: 제거할 인물 '${w}'가 이전 컷에 없습니다.`);
      const p = y.filter(
        (w) => !f.some((g) => g === w.id)
      ), $ = le(c.actors ?? [], `${a}.인물`), S = /* @__PURE__ */ new Set();
      for (const w of $) {
        const g = typeof w == "string" ? { id: w } : z(w, `${a}.인물`);
        X(g, Object.keys(G.actor), `${a}.인물`);
        const k = j(g.id, `${a}.인물.식별자`);
        if (S.has(k))
          throw new Error(`${a}: 캐릭터 식별자가 중복됩니다.`);
        S.add(k);
        const N = p.findIndex((b) => b.id === k), E = {
          ...N < 0 ? {} : p[N],
          ...g
        };
        for (const [b, v] of Object.entries(g))
          b !== "id" && v === null && delete E[b];
        N < 0 ? p.push(E) : p[N] = E;
      }
      c.actors = c.actors !== void 0 && $.length === 0 ? [] : p;
    } else if (c.removeActors !== void 0)
      throw new Error(`${a}: 제외인물은 이전 구성에서만 사용할 수 있습니다.`);
    const h = le(c.actors, `${a}.인물`).map((y) => {
      const f = typeof y == "string" ? { id: y } : z(y, `${a}.인물`);
      X(f, Object.keys(G.actor), `${a}.인물`);
      const p = j(f.id, `${a}.인물.식별자`), $ = f.expression === void 0 ? "neutral" : j(f.expression, `${a}.${p}.표정`);
      if (!Object.hasOwn(n, p))
        throw new Error(`${a}: 없는 캐릭터 '${p}'.`);
      if (!Object.hasOwn(Qt, $))
        throw new Error(`${a}.${p}: 없는 표정 '${$}'.`);
      const S = f.gesture === void 0 ? void 0 : j(f.gesture, `${a}.${p}.손모양`), w = f.holding === void 0 ? void 0 : j(f.holding, `${a}.${p}.든소품`);
      if (S && !Object.hasOwn(Xt, S))
        throw new Error(`${a}.${p}: 없는 손 제스처 '${S}'.`);
      if (w && !Object.hasOwn(Re, w))
        throw new Error(`${a}.${p}: 없는 소품 '${w}'.`);
      return {
        id: p,
        expression: $,
        gesture: S,
        holding: w,
        x: te(f.x, 0, 1, `${a}.${p}.가로위치`),
        y: te(f.y, 0, 1, `${a}.${p}.세로위치`),
        scale: te(f.scale, 0.5, 1.25, `${a}.${p}.배율`) ?? 1
      };
    });
    if (h.length < 1 || h.length > 3)
      throw new Error(`${a}: 캐릭터는 1~3명이어야 합니다.`);
    if (new Set(h.map((y) => y.id)).size !== h.length)
      throw new Error(`${a}: 캐릭터 식별자가 중복됩니다.`);
    const u = le(c.dialogue ?? [], `${a}.대사`).map(
      (y) => {
        const f = z(y, `${a}.대사`);
        X(f, Object.keys(G.dialogue), `${a}.대사`);
        const p = j(f.from, `${a}.대사.화자`), $ = f.to === void 0 ? void 0 : j(f.to, `${a}.대사.상대`);
        if (!h.some((S) => S.id === p))
          throw new Error(`${a}: 화자 '${p}'가 컷에 없습니다.`);
        if ($ && !h.some((S) => S.id === $))
          throw new Error(`${a}: 대화 상대 '${$}'가 컷에 없습니다.`);
        return {
          from: p,
          to: $,
          text: j(f.text, `${a}.대사.내용`),
          x: te(f.x, 0, 1, `${a}.대사.가로위치`),
          y: te(f.y, 0, 1, `${a}.대사.세로위치`),
          fontSize: te(f.fontSize, 12, 32, `${a}.대사.글자크기`) ?? 18
        };
      }
    );
    if (u.length > 20)
      throw new Error(`${a}: 대사는 20개 이내로 작성하세요.`);
    const d = le(c.transfer ?? [], `${a}.전달`).map(
      (y) => {
        const f = z(y, `${a}.전달`);
        X(f, Object.keys(G.transfer), `${a}.전달`);
        const p = j(f.from, `${a}.전달.주는인물`), $ = j(f.to, `${a}.전달.받는인물`), S = j(f.prop, `${a}.전달.소품`);
        if (!h.some((w) => w.id === p))
          throw new Error(`${a}: 전달 주체 '${p}'가 컷에 없습니다.`);
        if (!h.some((w) => w.id === $))
          throw new Error(`${a}: 전달 대상 '${$}'가 컷에 없습니다.`);
        if (p === $)
          throw new Error(`${a}: 전달 주체와 대상은 달라야 합니다.`);
        if (!Object.hasOwn(Re, S))
          throw new Error(`${a}: 없는 소품 '${S}'.`);
        return { from: p, to: $, prop: S };
      }
    );
    if (d.length > 6)
      throw new Error(`${a}: 소품 전달은 6개 이내로 작성하세요.`);
    let m;
    if (c.diagram !== void 0 && c.diagram !== null) {
      const y = `${a}.다이어그램`, f = z(c.diagram, y);
      if (X(f, Object.keys(G.diagram), y), f.type !== "mermaid")
        throw new Error(`${y}.종류: 머메이드여야 합니다.`);
      m = {
        type: "mermaid",
        source: j(f.source, `${y}.원문`, 2e4),
        title: f.title === void 0 ? "다이어그램" : j(f.title, `${y}.제목`, 100),
        height: te(f.height, 160, 1200, `${y}.높이`)
      };
    }
    return i = { actors: h, dialogue: u, transfer: d, ...m ? { diagram: m } : {} }, i;
  });
  if (r.length < 1 || r.length > 30)
    throw new Error("컷은 1~30개여야 합니다.");
  return {
    title: t.title === void 0 ? "Comic Gen" : j(t.title, "제목"),
    cast: n,
    panels: r
  };
}
const Se = (s, e, t) => Math.max(e, Math.min(t, s));
function ht(s, e, t, n) {
  const i = document.createElement("canvas").getContext("2d");
  i.font = `${t}px ${n}`;
  const r = [];
  for (const o of s.split(`
`)) {
    let l = "";
    for (const a of Array.from(o))
      l && i.measureText(l + a).width > e && (r.push(l), l = ""), l += a;
    r.push(l);
  }
  return r;
}
function Ps(s, e, t, n, i = "compact", r) {
  const o = Math.min(t - 80, 390), l = s.dialogue.map((g) => ({
    line: g,
    lines: ht(g.text, o - 36, g.fontSize, n),
    lineHeight: Math.ceil(g.fontSize * 1.45)
  })), a = l.reduce(
    (g, k) => g + 60 + k.lines.length * k.lineHeight,
    20
  ), c = a + 254, h = Math.max(
    ...s.actors.map((g) => g.holding || g.gesture ? 92 : 60)
  ), u = (t - 72) / s.actors.length, d = Math.min(
    1,
    (u - 12) / (2 * h * Math.max(...s.actors.map((g) => g.scale)))
  ), m = s.actors.map((g) => g.scale * d), y = s.actors.map(
    (g, k) => Se(
      36 + (t - 72) * (g.x ?? (k + 0.5) / s.actors.length),
      26 + h * m[k],
      t - 26 - h * m[k]
    )
  ), f = s.actors.map(
    (g, k) => Se(
      g.y === void 0 ? c - 126 : g.y * c,
      a + 70 * m[k],
      c - 126 * m[k]
    )
  );
  for (let g = 0; g < s.actors.length; g++)
    for (let k = g + 1; k < s.actors.length; k++)
      if (Math.abs(y[g] - y[k]) < h * (m[g] + m[k]) && Math.abs(f[g] - f[k]) < 120 * Math.max(m[g], m[k]))
        throw new Error(
          `캐릭터 '${s.actors[g].id}'와 '${s.actors[k].id}'가 겹칩니다. 가로위치·세로위치 또는 배율을 조정하세요.`
        );
  const p = [
    `<rect x="20" y="0" width="${t - 40}" height="${c}" rx="18" fill="white" stroke="#303341" stroke-width="2.5"/>`
  ];
  let $ = 20;
  l.forEach(({ line: g, lines: k, lineHeight: N }) => {
    const E = y[s.actors.findIndex((W) => W.id === g.from)], b = Se(
      (g.x === void 0 ? E : g.x * t) - o / 2,
      40,
      t - o - 40
    ), v = 28 + k.length * N, I = g.y === void 0 ? $ : Se(g.y * c, 20, a - v), _ = Math.max(b + 24, Math.min(b + o - 24, E)), A = b + o, B = I + v, D = s.actors.findIndex(
      (W) => W.id === g.from
    ), J = f[D] - 65 * m[D], rt = `M${b + 14} ${I}H${A - 14}Q${A} ${I} ${A} ${I + 14}V${B - 14}Q${A} ${B} ${A - 14} ${B}H${_ + 9}L${E} ${J}L${_ - 9} ${B}H${b + 14}Q${b} ${B} ${b} ${B - 14}V${I + 14}Q${b} ${I} ${b + 14} ${I}Z`;
    p.push(
      `<g data-dialogue="${K(g.from)}" data-to="${K(g.to ?? "")}"><path d="${rt}" fill="#fffaf0" stroke="#303341" stroke-width="2" stroke-linejoin="round"/><text x="${b + 18}" y="${I + 18 + g.fontSize}" font-size="${g.fontSize}">${k.map((W, Vs) => `<tspan x="${b + 18}" dy="${Vs ? N : 0}">${K(W)}</tspan>`).join("")}</text></g>`
    ), $ += v + 32;
  }), s.actors.forEach((g, k) => {
    const N = e[g.id], E = Ht[N.asset], b = s.dialogue.find(
      (D) => D.from === g.id && D.to
    )?.to, v = s.actors.findIndex((D) => D.id === b), I = v < 0 ? 0 : Math.sign(y[v] - y[k]) * 4, _ = ht(
      N.label,
      (t - 72) / s.actors.length - 12,
      16,
      n
    );
    if (_.length > 2)
      throw new Error(`캐릭터 '${g.id}'의 이름표가 너무 깁니다.`);
    const A = g.gesture ? `<g data-gesture="${g.gesture}">${Xt[g.gesture]}</g>` : "", B = g.holding ? `<g data-holding="${g.holding}"><circle data-hand="holding" cx="58" cy="20" r="11" fill="white"/><g data-prop="${g.holding}" transform="translate(73 6)">${Re[g.holding]}</g></g>` : "";
    p.push(
      `<g data-character="${K(g.id)}" transform="translate(${y[k]} ${f[k]}) scale(${m[k]})" stroke="#303341" stroke-width="2.8" stroke-linecap="round"><ellipse cy="69" rx="51" ry="7" fill="#e8edf3" stroke="none"/>${E.body}<g transform="translate(${I} ${E.faceY})" fill="#303341">${Qt[g.expression]}</g>${A}${B}<text y="94" text-anchor="middle" stroke="none" fill="#303341" font-size="16">${_.map((D, J) => `<tspan x="0" dy="${J ? 18 : 0}">${K(D)}</tspan>`).join("")}</text></g>`
    );
  }), s.transfer.forEach((g, k) => {
    const N = s.actors.findIndex(
      (W) => W.id === g.from
    ), E = s.actors.findIndex((W) => W.id === g.to), b = y[N], v = y[E], I = Math.sign(v - b), _ = b + 62 * m[N] * I, A = v - 62 * m[E] * I, B = 20 + (k - (s.transfer.length - 1) / 2) * 12, D = f[N] + B * m[N], J = f[E] + B * m[E], rt = Math.atan2(J - D, A - _) * 180 / Math.PI;
    p.push(
      `<g data-transfer="${K(g.from)}" data-to="${K(g.to)}" stroke="#586c8c" stroke-width="2.5"><path d="M${_} ${D}L${A} ${J}" fill="none"/><circle data-hand="transfer" cx="${_}" cy="${D}" r="${9 * m[N]}" fill="white"/><circle data-hand="receive" cx="${A}" cy="${J}" r="${9 * m[E]}" fill="white"/><path transform="translate(${A} ${J}) rotate(${rt})" d="M-12 -5L-4 0L-12 5" fill="none"/><g data-prop="${g.prop}" transform="translate(${(_ + A) / 2} ${(D + J) / 2 - 16})">${Re[g.prop]}</g></g>`
    );
  });
  let S = p.slice(1).join(""), w = c;
  if (r && s.diagram) {
    const g = t - 80, k = g - 32, N = s.diagram.height ?? Se(k * r.height / r.width + 58, 180, 1200), E = N - 58, b = Math.min(
      k / r.width,
      E / r.height
    ), v = 56 + (k - r.width * b) / 2, I = 66 + (E - r.height * b) / 2;
    if (ht(s.diagram.title, k, 16, n).length > 1)
      throw new Error(
        "다이어그램 제목이 너무 깁니다. 제목이나 너비를 조정하세요."
      );
    S = `<g data-diagram="mermaid"><rect x="40" y="20" width="${g}" height="${N}" rx="10" fill="#f3f7fc" stroke="#8093ab" stroke-width="2"/><text x="56" y="48" font-size="16" font-weight="700">${K(s.diagram.title)}</text><g data-diagram-content="mermaid" transform="translate(${v} ${I}) scale(${b})">${r.svg}</g></g><g data-scene="true" transform="translate(0 ${N + 40})">${S}</g>`, w += N + 40;
  }
  if (i === "phone") {
    const g = w * 2 + 92;
    return {
      markup: `<rect x="20" y="0" width="${t - 40}" height="${g}" rx="18" fill="white" stroke="#303341" stroke-width="2.5"/><g transform="translate(0 ${(g - w) / 2})">${S}</g>`,
      height: g
    };
  }
  return r ? {
    markup: `<rect x="20" y="0" width="${t - 40}" height="${w}" rx="18" fill="white" stroke="#303341" stroke-width="2.5"/>${S}`,
    height: w
  } : { markup: p.join(""), height: c };
}
const li = "https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.5.0/cdn/comic-gen.mermaid.js", kt = 2e4, ci = "http://www.w3.org/2000/svg", fi = Math.random().toString(36).slice(2);
let ui = 0, Jt = Promise.resolve();
const nt = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "color",
  "opacity",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "font-variant",
  "text-anchor",
  "dominant-baseline",
  "alignment-baseline",
  "baseline-shift",
  "letter-spacing",
  "word-spacing",
  "text-decoration",
  "visibility",
  "marker-start",
  "marker-mid",
  "marker-end",
  "clip-path",
  "mask",
  "filter",
  "paint-order"
], hi = new Set(nt), di = /* @__PURE__ */ new Set([
  "svg",
  "g",
  "defs",
  "marker",
  "clippath",
  "mask",
  "pattern",
  "lineargradient",
  "radialgradient",
  "stop",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "textpath",
  "title",
  "desc",
  "use",
  "filter",
  "fegaussianblur",
  "feoffset",
  "feblend",
  "fecolormatrix",
  "fecomponenttransfer",
  "fefunca",
  "fefuncb",
  "fefuncg",
  "fefuncr",
  "femerge",
  "femergenode",
  "feflood",
  "fecomposite"
]), pi = /* @__PURE__ */ new Set([
  "id",
  "class",
  "style",
  "xmlns",
  "xmlns:xlink",
  "xml:space",
  "role",
  "viewbox",
  "preserveaspectratio",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "dx",
  "dy",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "transform",
  "pathlength",
  "refx",
  "refy",
  "markerwidth",
  "markerheight",
  "markerunits",
  "orient",
  "clippathunits",
  "maskunits",
  "maskcontentunits",
  "patternunits",
  "patterncontentunits",
  "patterntransform",
  "gradientunits",
  "gradienttransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "spreadmethod",
  "href",
  "xlink:href",
  "textlength",
  "lengthadjust",
  "vector-effect",
  "filterunits",
  "primitiveunits",
  "in",
  "in2",
  "result",
  "stddeviation",
  "mode",
  "type",
  "values",
  "operator",
  "k1",
  "k2",
  "k3",
  "k4",
  "slope",
  "intercept",
  "amplitude",
  "exponent",
  "tablevalues",
  ...nt
]);
function mi(s) {
  if (!s.trim() || s.length > kt)
    throw new Error(`Mermaid 원문은 1~${kt}자여야 합니다.`);
  const e = document.createElement("textarea");
  e.innerHTML = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const t = e.value;
  if (/%%\s*\{|^\s*---\s*(?:\r?\n|$)/m.test(t))
    throw new Error(
      "Mermaid 원문 안의 설정 지시문과 frontmatter는 지원하지 않습니다."
    );
  if (/<(?:\s*\/?\s*(?:script|style|img|image|svg|foreignobject|iframe|object|embed|link|a|html|body|div|span|p|br|b|i|em|strong|input|video|audio|canvas|math)\b|[!?])/i.test(
    t
  ) || /<[a-z][^>]*\s+[a-z_:][\w:.-]*\s*=/i.test(t))
    throw new Error(
      "Mermaid 원문에는 HTML 대신 일반 텍스트 라벨을 사용해 주세요."
    );
  if (/@\s*\{/.test(t) || /(?:^|[;\r\n])\s*(?:click|links?|style|classDef|linkStyle|cssClass)\s/i.test(
    t
  ) || /(?:\b(?:img|image|icon)\s*:|url\s*\(|@import|javascript\s*:|vbscript\s*:|data\s*:\s*[a-z]+\/)/i.test(
    t
  ))
    throw new Error(
      "Mermaid 노드 메타데이터(@{}), 이미지·링크·CSS 선언과 외부 리소스는 지원하지 않습니다."
    );
}
function gi(s) {
  if (typeof s != "string" || !s.trim() || s.length > 300 || /[^\p{L}\p{N}\s,'"_\-]/u.test(s))
    throw new Error("다이어그램에 사용할 올바른 글꼴 이름이 필요합니다.");
  return s;
}
async function yi(s) {
  const e = document.createElement("iframe");
  e.title = "Mermaid 렌더링", e.tabIndex = -1, e.setAttribute("aria-hidden", "true"), e.style.cssText = "all:initial!important;display:block!important;width:20000px!important;height:20000px!important;border:0!important;", s.append(e);
  const t = e.contentDocument, n = e.contentWindow;
  if (!t?.body || !n)
    throw e.remove(), new Error("Mermaid 격리 문서를 만들지 못했습니다.");
  const i = t.createElement("script");
  i.type = "module", i.src = li;
  try {
    return { api: await new Promise((o, l) => {
      const a = window.setTimeout(() => {
        c(), l(new Error("Mermaid 모듈을 불러오는 시간이 초과되었습니다."));
      }, 3e4), c = () => {
        window.clearTimeout(a), i.onload = null, i.onerror = null, n.removeEventListener("comic-gen-mermaid-ready", h), n.removeEventListener("comic-gen-mermaid-error", u);
      }, h = () => {
        c();
        const d = n.__comicGenMermaid;
        typeof d?.initialize != "function" || typeof d?.render != "function" ? l(new Error("Mermaid 모듈을 불러오지 못했습니다.")) : o(d);
      }, u = () => {
        c(), l(new Error("Mermaid 모듈을 불러오지 못했습니다."));
      };
      n.addEventListener("comic-gen-mermaid-ready", h), n.addEventListener("comic-gen-mermaid-error", u), i.onload = () => {
        n.__comicGenMermaid && h();
      }, i.onerror = u, t.head.append(i);
    }), document: t, dispose: () => e.remove() };
  } catch (r) {
    throw e.remove(), r;
  }
}
function Bs(s) {
  const e = new DOMParser().parseFromString(s, "image/svg+xml");
  if (e.querySelector("parsererror") || e.documentElement.localName !== "svg")
    throw new Error("Mermaid가 올바른 SVG를 만들지 못했습니다.");
  return e.documentElement;
}
function Ye(s, e, t = !1) {
  let n = !0;
  const i = s.replace(
    /url\(\s*(["']?)(.*?)\1\s*\)/gi,
    (r, o, l) => {
      let a = l.trim();
      if (t && !a.startsWith("#")) {
        const c = a.lastIndexOf("#");
        a = c >= 0 ? a.slice(c) : "";
      }
      return !a.startsWith("#") || !e.has(a.slice(1)) ? (n = !1, "") : `url(${a})`;
    }
  );
  return /url\s*\(/i.test(i.replace(/url\(#[^)]*\)/g, "")) && (n = !1), n ? i : void 0;
}
function Ds(s, e) {
  const t = document.createElement("span").style;
  for (const n of nt) {
    const i = Ye(s.getPropertyValue(n), e);
    i && t.setProperty(n, i, s.getPropertyPriority(n));
  }
  return s.getPropertyValue("display") === "none" && (t.display = "none"), t.cssText;
}
function wi(s) {
  const e = [];
  let t = 0, n = 0, i = "";
  for (let r = 0; r < s.length; r++) {
    const o = s[r];
    i ? o === i && s[r - 1] !== "\\" && (i = "") : o === "'" || o === '"' ? i = o : o === "(" || o === "[" ? n++ : o === ")" || o === "]" ? n-- : o === "," && n === 0 && (e.push(s.slice(t, r).trim()), t = r + 1);
  }
  return e.push(s.slice(t).trim()), e;
}
function bi(s, e, t) {
  const n = new CSSStyleSheet();
  n.replaceSync(s);
  const i = [], r = `#${e}`;
  for (const o of n.cssRules) {
    if (!(o instanceof CSSStyleRule)) continue;
    if (!wi(o.selectorText).every(
      (c) => c === r || c.startsWith(r + " ") || c.startsWith(r + ">") || c.startsWith(r + ":")
    )) throw new Error("Mermaid SVG에 범위 밖 스타일이 있습니다.");
    const a = Ds(o.style, t);
    a && i.push(`${o.selectorText}{${a}}`);
  }
  return i.join(`
`);
}
function ki(s) {
  if (s.length > 2e6)
    throw new Error("Mermaid SVG가 너무 큽니다. 다이어그램을 나누어 주세요.");
  const e = Bs(s), t = [e, ...e.querySelectorAll("*")];
  if (t.length > 1e4)
    throw new Error(
      "Mermaid SVG 요소가 너무 많습니다. 다이어그램을 나누어 주세요."
    );
  const n = new Set(t.map((r) => r.id).filter(Boolean)), i = e.id;
  for (const r of t)
    for (const o of [...r.attributes])
      if (/url\s*\(/i.test(o.value)) {
        const l = Ye(o.value, n, !0);
        l === void 0 ? r.removeAttributeNode(o) : r.setAttribute(o.name, l);
      }
  for (const r of t) {
    const o = r.localName.toLowerCase();
    if (r.namespaceURI !== ci || !di.has(o) && o !== "style") {
      o === "a" ? r.replaceWith(...r.childNodes) : r.remove();
      continue;
    }
    if (o === "style") {
      r.textContent = bi(r.textContent ?? "", i, n);
      continue;
    }
    for (const l of [...r.attributes]) {
      const a = l.name.toLowerCase(), c = l.value;
      if (!pi.has(a) && !a.startsWith("aria-") && !a.startsWith("data-"))
        r.removeAttributeNode(l);
      else if (a === "href" || a === "xlink:href")
        (!c.startsWith("#") || !n.has(c.slice(1))) && r.removeAttributeNode(l);
      else if (a === "style") {
        const h = document.createElement("span").style;
        h.cssText = c, r.setAttribute("style", Ds(h, n));
      } else if (hi.has(a)) {
        const h = Ye(c, n);
        h === void 0 ? r.removeAttributeNode(l) : r.setAttribute(l.name, h);
      }
    }
  }
  return e;
}
function $i(s) {
  if (s.length > 3e6)
    throw new Error("Mermaid SVG가 너무 큽니다. 다이어그램을 나누어 주세요.");
  const e = s.match(
    /\bsrc="data:text\/html;charset=UTF-8;base64,([^"]+)"/i
  )?.[1];
  if (!e) throw new Error("Mermaid 격리 문서에서 SVG를 읽지 못했습니다.");
  const t = Uint8Array.from(
    atob(e),
    (o) => o.charCodeAt(0)
  ), n = new TextDecoder().decode(t), r = new DOMParser().parseFromString(n, "text/html").querySelector("svg");
  if (!r) throw new Error("Mermaid 격리 문서에서 SVG를 읽지 못했습니다.");
  return r.outerHTML;
}
function Si(s) {
  const e = (s.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number), t = e.length === 4 ? e[2] : Number.parseFloat(s.getAttribute("width") ?? ""), n = e.length === 4 ? e[3] : Number.parseFloat(s.getAttribute("height") ?? "");
  if (!Number.isFinite(t) || !Number.isFinite(n) || t <= 0 || n <= 0 || t > 2e4 || n > 2e4 || t * n > 16e7)
    throw new Error(
      "Mermaid 다이어그램 크기가 너무 큽니다. 다이어그램을 나누어 주세요."
    );
  return (e.length !== 4 || e.some((i) => !Number.isFinite(i))) && s.setAttribute("viewBox", `0 0 ${t} ${n}`), s.setAttribute("width", String(t)), s.setAttribute("height", String(n)), s.setAttribute("preserveAspectRatio", "xMidYMid meet"), { width: t, height: n };
}
async function Ni(s, e) {
  if (typeof document > "u" || !document.body)
    throw new Error("Mermaid 렌더링에는 브라우저 문서가 필요합니다.");
  mi(s), e = gi(e);
  const t = Jt.then(async () => {
    await Promise.all([
      document.fonts.load(`18px ${e}`, s),
      document.fonts.load(`bold 18px ${e}`, s),
      document.fonts.load(`italic 18px ${e}`, s)
    ]), await document.fonts.ready;
    const n = `comic-gen-mermaid-${fi}-${++ui}`, i = document.createElement("div");
    i.dataset.comicDiagramTemporary = "", i.style.cssText = "all:initial!important;display:block!important;position:fixed!important;left:-100000px!important;top:0!important;width:20000px!important;pointer-events:none!important;opacity:0!important;";
    const r = [...document.fonts].filter(
      (c) => c.status === "loaded"
    );
    let o, l;
    const a = new MutationObserver(() => {
      const c = l?.querySelector("iframe"), h = c?.contentDocument;
      if (!(!c || !h)) {
        c.style.cssText = "all:initial!important;display:block!important;width:20000px!important;height:20000px!important;border:0!important;";
        for (const u of r) h.fonts.add(u);
      }
    });
    document.body.append(i);
    try {
      o = await yi(i);
      for (const w of r) o.document.fonts.add(w);
      l = o.document.createElement("div"), l.style.cssText = "width:20000px;", o.document.body.append(l), a.observe(l, { childList: !0, subtree: !0 });
      const c = o.api;
      c.initialize({
        startOnLoad: !1,
        securityLevel: "sandbox",
        suppressErrorRendering: !0,
        maxTextSize: kt,
        maxEdges: 500,
        htmlLabels: !1,
        fontFamily: e,
        theme: "neutral",
        themeVariables: { fontFamily: e, fontSize: "18px" },
        flowchart: { htmlLabels: !1, useMaxWidth: !1 },
        class: { htmlLabels: !1, useMaxWidth: !1 },
        sequence: {
          useMaxWidth: !1,
          actorFontFamily: e,
          noteFontFamily: e,
          messageFontFamily: e
        },
        secure: [
          "secure",
          "securityLevel",
          "startOnLoad",
          "maxTextSize",
          "maxEdges",
          "suppressErrorRendering",
          "htmlLabels",
          "theme",
          "themeCSS",
          "themeVariables",
          "fontFamily",
          "altFontFamily"
        ]
      });
      const h = await c.render(n, s, l);
      a.disconnect();
      const u = ki($i(h.svg)), d = Si(u), m = i.attachShadow({ mode: "closed" });
      m.append(document.importNode(u, !0));
      const y = m.firstElementChild, f = [y, ...y.querySelectorAll("*")], p = new Set(
        f.map((w) => w.id).filter(Boolean)
      ), $ = f.map((w) => {
        if (w.localName === "style") return "";
        const g = getComputedStyle(w), k = document.createElement("span").style;
        for (const N of nt) {
          const E = Ye(
            g.getPropertyValue(N),
            p,
            !0
          );
          E && k.setProperty(N, E, "important");
        }
        return g.display === "none" && k.setProperty("display", "none", "important"), k.cssText;
      });
      f.forEach((w, g) => {
        w.localName === "style" ? w.remove() : (w.setAttribute("style", $[g]), w.removeAttribute("class"));
      }), y.style.removeProperty("visibility"), y.style.setProperty("width", `${d.width}px`, "important"), y.style.setProperty("height", `${d.height}px`, "important"), y.style.setProperty("max-width", "none", "important"), y.style.setProperty("max-height", "none", "important");
      const S = new XMLSerializer().serializeToString(y);
      if (S.length > 2e6)
        throw new Error(
          "Mermaid SVG가 너무 큽니다. 다이어그램을 나누어 주세요."
        );
      return { svg: S, ...d };
    } finally {
      a.disconnect(), o?.document.getElementById(n)?.remove(), o?.document.getElementById(`d${n}`)?.remove(), o?.document.getElementById(`i${n}`)?.remove(), o?.dispose(), i.remove();
    }
  });
  return Jt = t.catch(() => {
  }), t;
}
function Ei(s, e) {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,120}$/.test(e))
    throw new Error("다이어그램 SVG 식별자 접두사가 올바르지 않습니다.");
  const t = Bs(s.svg), n = [t, ...t.querySelectorAll("*")], i = /* @__PURE__ */ new Map();
  let r = 0;
  const o = (l) => {
    const a = l.localName === "svg" ? l : l.closest("svg");
    let c = i.get(a);
    return c || (c = /* @__PURE__ */ new Map(), i.set(a, c)), c;
  };
  for (const l of n) {
    if (!l.id) continue;
    const a = o(l);
    if (a.has(l.id))
      throw new Error("다이어그램 SVG 식별자가 중복됩니다.");
    a.set(l.id, `${e}-${r++}`);
  }
  for (const l of n) {
    const a = o(l);
    for (const c of [...l.attributes])
      if (c.name === "id")
        l.setAttribute("id", a.get(c.value));
      else if (c.localName === "href" && c.value.startsWith("#")) {
        const h = a.get(c.value.slice(1));
        h && l.setAttribute(c.name, `#${h}`);
      } else c.name === "aria-labelledby" || c.name === "aria-describedby" ? l.setAttribute(
        c.name,
        c.value.split(/\s+/).map((h) => a.get(h) ?? h).join(" ")
      ) : /url\(/i.test(c.value) && l.setAttribute(
        c.name,
        c.value.replace(
          /url\(\s*(["']?)#([^"')\s]+)\1\s*\)/gi,
          (h, u, d) => a.has(d) ? `url(#${a.get(d)})` : h
        )
      );
  }
  return new XMLSerializer().serializeToString(t);
}
let Ks = 0, Oi = 0;
document.fonts.addEventListener("loadingdone", (s) => {
  s.fontfaces.length && Ks++;
});
function Fs(s, e, t) {
  e = oi(e);
  const n = ai(s), i = e.width ?? 720, r = e.panelFormat ?? t;
  if (r !== "compact" && r !== "phone")
    throw new Error("컷비율은 기본 또는 모바일이어야 합니다.");
  if (!Number.isFinite(i) || i < 480 || i > 2400)
    throw new Error("너비는 480~2400 사이여야 합니다.");
  const o = e.font ?? "Malgun Gothic, Apple SD Gothic Neo, sans-serif";
  if (typeof o != "string" || o.length > 300 || /[<>]/.test(o))
    throw new Error("올바른 글꼴 이름이 필요합니다.");
  return { comic: n, options: e, width: i, font: o, format: r };
}
function qs(s, e) {
  const { comic: t, width: n, font: i, options: r, format: o } = e;
  return JSON.stringify({
    panel: s,
    members: s.actors.map((l) => [l.id, t.cast[l.id]]),
    width: n,
    font: i,
    fontEpoch: Ks,
    fontVersion: r.fontVersion,
    assetVersion: "1",
    layoutVersion: s.diagram ? 3 : 2,
    format: o
  });
}
function Rs(s) {
  return {
    svg: "",
    width: 0,
    height: 0,
    diagnostics: [s instanceof Error ? s.message : "렌더링 실패"],
    panels: []
  };
}
function Us(s, e, t) {
  const { comic: n, width: i, font: r } = s, o = [], l = [], a = `cg-${Date.now().toString(36)}-${++Oi}-${Math.random().toString(36).slice(2, 9)}`, c = (u, d, m) => `<svg xmlns="http://www.w3.org/2000/svg" width="${i}" height="${d}" viewBox="0 0 ${i} ${d}" role="img" aria-label="${K(m)}"><title>${K(m)}</title><rect width="100%" height="100%" fill="#f5f7fb"/><g font-family="${K(r)}" fill="#303341"><text x="24" y="42" font-size="24" font-weight="700">${K(m)}</text>${u}</g></svg>`;
  let h = 68;
  for (const [u, d] of e.entries()) {
    const { markup: m, height: y, hit: f } = d, p = ($) => n.panels[u].diagram ? Ei(
      {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${i}" height="${y}" viewBox="0 0 ${i} ${y}" style="width:${i}px!important;height:${y}px!important;max-width:none!important;max-height:none!important">${m}</svg>`
      },
      `${a}-${$}-${u}`
    ) : m;
    o.push(
      `<g data-panel="${u}" transform="translate(0 ${h})">${p("whole")}</g>`
    ), l.push({
      index: u,
      svg: c(
        `<g data-panel="${u}" transform="translate(0 68)">${p("panel")}</g>`,
        y + 92,
        `${n.title} · ${u + 1}/${n.panels.length}`
      ),
      width: i,
      height: y + 92,
      diagnostics: [],
      cache: { hits: f ? 1 : 0, misses: f ? 0 : 1, bytes: t.bytes }
    }), h += y + 24;
  }
  return {
    svg: c(o.join(""), h, n.title),
    width: i,
    height: h,
    diagnostics: [],
    panels: l,
    cache: {
      hits: e.filter((u) => u.hit).length,
      misses: e.filter((u) => !u.hit).length,
      bytes: t.bytes
    }
  };
}
function Wt(s, e, t, n = "compact") {
  try {
    const i = Fs(s, e, n), r = i.comic.panels.findIndex(
      (l) => l.diagram
    );
    if (r >= 0)
      throw new Error(
        `컷 ${r + 1}.다이어그램: 만화그리기비동기(renderComicAsync) 또는 컷그리기비동기(renderPanelsAsync)를 await로 호출하세요.`
      );
    const o = i.comic.panels.map((l) => {
      const a = qs(l, i), c = t.get(a), h = c ?? Ps(
        l,
        i.comic.cast,
        i.width,
        i.font,
        i.format
      );
      return c || t.set(a, h), { ...h, hit: !!c };
    });
    return Us(i, o, t);
  } catch (i) {
    return Rs(i);
  }
}
async function zt(s, e, t, n = "compact") {
  try {
    const i = Fs(s, e, n);
    i.comic.panels.some((o) => o.diagram) && await document.fonts.ready;
    const r = [];
    for (const [o, l] of i.comic.panels.entries()) {
      const a = qs(l, i), c = t.get(a);
      if (c) {
        r.push({ ...c, hit: !0 });
        continue;
      }
      let h;
      if (l.diagram)
        try {
          h = await Ni(l.diagram.source, i.font);
        } catch (d) {
          throw new Error(
            `컷 ${o + 1}.다이어그램: ${d instanceof Error ? d.message : "Mermaid 렌더링 실패"}`
          );
        }
      const u = Ps(
        l,
        i.comic.cast,
        i.width,
        i.font,
        i.format,
        h
      );
      t.set(a, u), r.push({ ...u, hit: !1 });
    }
    return Us(i, r, t);
  } catch (i) {
    return Rs(i);
  }
}
function vi(s = 2e6) {
  const e = new Gs(s);
  return {
    render: (t, n = {}) => Wt(t, n, e),
    renderPanels: (t, n = {}) => Wt(t, n, e, "phone"),
    renderAsync: (t, n = {}) => zt(t, n, e),
    renderPanelsAsync: (t, n = {}) => zt(t, n, e, "phone"),
    clearCache: () => e.clear()
  };
}
const it = vi(), Ti = it.render, Ii = it.renderPanels, Li = it.renderAsync, Mi = it.renderPanelsAsync;
function Ci(s, e) {
  const t = URL.createObjectURL(s), n = document.createElement("a");
  n.href = t, n.download = e, n.click(), setTimeout(() => URL.revokeObjectURL(t), 1e3);
}
async function _i(s, e = 1) {
  if (!s.svg || !Number.isFinite(e) || e < 0.5 || e > 4)
    throw new Error("올바른 만화와 0.5~4 배율이 필요합니다.");
  const t = Math.round(s.width * e), n = Math.round(s.height * e);
  if (t > 16384 || n > 16384 || t * n > 32e6)
    throw new Error("PNG 크기가 너무 큽니다. 배율이나 컷 수를 줄이세요.");
  await document.fonts.ready;
  const i = URL.createObjectURL(
    new Blob([s.svg], { type: "image/svg+xml;charset=utf-8" })
  );
  try {
    const r = new Image();
    r.src = i, await r.decode();
    const o = document.createElement("canvas");
    o.width = t, o.height = n;
    const l = o.getContext("2d");
    if (!l) throw new Error("이 브라우저에서는 PNG를 만들 수 없습니다.");
    return l.drawImage(r, 0, 0, t, n), await new Promise(
      (a, c) => o.toBlob(
        (h) => h ? a(h) : c(new Error("PNG 생성에 실패했습니다.")),
        "image/png"
      )
    );
  } finally {
    URL.revokeObjectURL(i);
  }
}
export {
  Ai as assetVersion,
  vi as createRenderer,
  Ci as downloadBlob,
  _i as exportPng,
  Ti as renderComic,
  Li as renderComicAsync,
  Ii as renderPanels,
  Mi as renderPanelsAsync,
  vi as 렌더러만들기,
  Ti as 만화그리기,
  Li as 만화그리기비동기,
  ni as 문법값,
  G as 문법항목,
  Ii as 컷그리기,
  Mi as 컷그리기비동기
};
