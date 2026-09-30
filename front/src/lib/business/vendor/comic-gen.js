/*! Comic Gen browser SDK v0.3.0
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
const oi = "1", Gt = {
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
}, Ht = {
  neutral: '<circle cx="-17" cy="-4" r="3.5"/><circle cx="17" cy="-4" r="3.5"/><path d="M-10 17q10 7 20 0" fill="none"/>',
  happy: '<path d="M-25 -2q8 -12 16 0m18 0q8 -12 16 0M-13 16q13 18 26 0" fill="none"/>',
  confused: '<circle cx="-17" cy="-4" r="3.5"/><circle cx="17" cy="-4" r="3.5"/><path d="M-24 -17l13 -5m21 1 14 4M-8 18q8 -6 16 0" fill="none"/>',
  sad: '<circle cx="-17" cy="-4" r="3.5"/><circle cx="17" cy="-4" r="3.5"/><path d="M-12 23q12 -14 24 0" fill="none"/>',
  angry: '<path d="M-25 -16l15 6m20 0 15 -6M-10 20h20" fill="none"/><circle cx="-17" cy="-1" r="3"/><circle cx="17" cy="-1" r="3"/>'
}, zt = {
  wave: '<g data-hand="wave"><circle cx="-65" cy="-22" r="12" fill="white"/><path d="M-77 -42l-4 -8m15 2v-10m13 17 5 -7" fill="none"/></g>',
  point: '<g data-hand="point"><circle cx="-65" cy="0" r="11" fill="white"/><path d="M-77 0h-13" fill="none"/></g>'
}, Ue = {
  request: '<rect x="-18" y="-13" width="36" height="26" rx="4" fill="#f9f0cd"/><path d="M-18 -13L0 1l18 -14" fill="none"/>',
  data: '<path d="M-16 -12v23c0 10 32 10 32 0v-23" fill="#daccff"/><ellipse cy="-12" rx="16" ry="6" fill="#ece4ff"/>',
  key: '<circle cx="-10" r="9" fill="#ffe0a8"/><path d="M0 0h21m-5 0v8m-8 -8v6" fill="none"/>'
};
function F(s) {
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
class Ds {
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
const yt = /* @__PURE__ */ Symbol.for("yaml.alias"), ft = /* @__PURE__ */ Symbol.for("yaml.document"), W = /* @__PURE__ */ Symbol.for("yaml.map"), Qt = /* @__PURE__ */ Symbol.for("yaml.pair"), V = /* @__PURE__ */ Symbol.for("yaml.scalar"), ye = /* @__PURE__ */ Symbol.for("yaml.seq"), q = /* @__PURE__ */ Symbol.for("yaml.node.type"), be = (s) => !!s && typeof s == "object" && s[q] === yt, He = (s) => !!s && typeof s == "object" && s[q] === ft, Le = (s) => !!s && typeof s == "object" && s[q] === W, M = (s) => !!s && typeof s == "object" && s[q] === Qt, I = (s) => !!s && typeof s == "object" && s[q] === V, Ce = (s) => !!s && typeof s == "object" && s[q] === ye;
function L(s) {
  if (s && typeof s == "object")
    switch (s[q]) {
      case W:
      case ye:
        return !0;
    }
  return !1;
}
function C(s) {
  if (s && typeof s == "object")
    switch (s[q]) {
      case yt:
      case W:
      case V:
      case ye:
        return !0;
    }
  return !1;
}
const Wt = (s) => (I(s) || L(s)) && !!s.anchor, Z = /* @__PURE__ */ Symbol("break visit"), qs = /* @__PURE__ */ Symbol("skip children"), Ee = /* @__PURE__ */ Symbol("remove node");
function we(s, e) {
  const t = Rs(e);
  He(s) ? ce(null, s.contents, t, Object.freeze([s])) === Ee && (s.contents = null) : ce(null, s, t, Object.freeze([]));
}
we.BREAK = Z;
we.SKIP = qs;
we.REMOVE = Ee;
function ce(s, e, t, n) {
  const i = Fs(s, e, t, n);
  if (C(i) || M(i))
    return Us(s, n, i), ce(s, i, t, n);
  if (typeof i != "symbol") {
    if (L(e)) {
      n = Object.freeze(n.concat(e));
      for (let r = 0; r < e.items.length; ++r) {
        const o = ce(r, e.items[r], t, n);
        if (typeof o == "number")
          r = o - 1;
        else {
          if (o === Z)
            return Z;
          o === Ee && (e.items.splice(r, 1), r -= 1);
        }
      }
    } else if (M(e)) {
      n = Object.freeze(n.concat(e));
      const r = ce("key", e.key, t, n);
      if (r === Z)
        return Z;
      r === Ee && (e.key = null);
      const o = ce("value", e.value, t, n);
      if (o === Z)
        return Z;
      o === Ee && (e.value = null);
    }
  }
  return i;
}
function Rs(s) {
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
function Fs(s, e, t, n) {
  if (typeof t == "function")
    return t(s, e, n);
  if (Le(e))
    return t.Map?.(s, e, n);
  if (Ce(e))
    return t.Seq?.(s, e, n);
  if (M(e))
    return t.Pair?.(s, e, n);
  if (I(e))
    return t.Scalar?.(s, e, n);
  if (be(e))
    return t.Alias?.(s, e, n);
}
function Us(s, e, t) {
  const n = e[e.length - 1];
  if (L(n))
    n.items[s] = t;
  else if (M(n))
    s === "key" ? n.key = t : n.value = t;
  else if (He(n))
    n.contents = t;
  else {
    const i = be(n) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${i} parent`);
  }
}
const Vs = {
  "!": "%21",
  ",": "%2C",
  "[": "%5B",
  "]": "%5D",
  "{": "%7B",
  "}": "%7D"
}, Ys = (s) => s.replace(/[!,[\]{}]/g, (e) => Vs[e]);
class B {
  constructor(e, t) {
    this.docStart = null, this.docEnd = !1, this.yaml = Object.assign({}, B.defaultYaml, e), this.tags = Object.assign({}, B.defaultTags, t);
  }
  clone() {
    const e = new B(this.yaml, this.tags);
    return e.docStart = this.docStart, e;
  }
  /**
   * During parsing, get a Directives instance for the current document and
   * update the stream state according to the current version's spec.
   */
  atDocument() {
    const e = new B(this.yaml, this.tags);
    switch (this.yaml.version) {
      case "1.1":
        this.atNextDocument = !0;
        break;
      case "1.2":
        this.atNextDocument = !1, this.yaml = {
          explicit: B.defaultYaml.explicit,
          version: "1.2"
        }, this.tags = Object.assign({}, B.defaultTags);
        break;
    }
    return e;
  }
  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(e, t) {
    this.atNextDocument && (this.yaml = { explicit: B.defaultYaml.explicit, version: "1.1" }, this.tags = Object.assign({}, B.defaultTags), this.atNextDocument = !1);
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
        return t + Ys(e.substring(n.length));
    return e[0] === "!" ? e : `!<${e}>`;
  }
  toString(e) {
    const t = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [], n = Object.entries(this.tags);
    let i;
    if (e && n.length > 0 && C(e.contents)) {
      const r = {};
      we(e.contents, (o, l) => {
        C(l) && l.tag && (r[l.tag] = !0);
      }), i = Object.keys(r);
    } else
      i = [];
    for (const [r, o] of n)
      r === "!!" && o === "tag:yaml.org,2002:" || (!e || i.some((l) => l.startsWith(o))) && t.push(`%TAG ${r} ${o}`);
    return t.join(`
`);
  }
}
B.defaultYaml = { explicit: !1, version: "1.2" };
B.defaultTags = { "!!": "tag:yaml.org,2002:" };
function Xt(s) {
  if (/[\x00-\x19\s,[\]{}]/.test(s)) {
    const t = `Anchor must not contain whitespace or control characters: ${JSON.stringify(s)}`;
    throw new Error(t);
  }
  return !0;
}
function Zt(s) {
  const e = /* @__PURE__ */ new Set();
  return we(s, {
    Value(t, n) {
      n.anchor && e.add(n.anchor);
    }
  }), e;
}
function es(s, e) {
  for (let t = 1; ; ++t) {
    const n = `${s}${t}`;
    if (!e.has(n))
      return n;
  }
}
function Js(s, e) {
  const t = [], n = /* @__PURE__ */ new Map();
  let i = null;
  return {
    onAnchor: (r) => {
      t.push(r), i ?? (i = Zt(s));
      const o = es(e, i);
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
        if (typeof o == "object" && o.anchor && (I(o.node) || L(o.node)))
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
function D(s, e, t) {
  if (Array.isArray(s))
    return s.map((n, i) => D(n, String(i), t));
  if (s && typeof s.toJSON == "function") {
    if (!t || !Wt(s))
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
class bt {
  constructor(e) {
    Object.defineProperty(this, q, { value: e });
  }
  /** Create a copy of this node.  */
  clone() {
    const e = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return this.range && (e.range = this.range.slice()), e;
  }
  /** A plain JavaScript representation of this node. */
  toJS(e, { mapAsMap: t, maxAliasCount: n, onAnchor: i, reviver: r } = {}) {
    if (!He(e))
      throw new TypeError("A document argument is required");
    const o = {
      anchors: /* @__PURE__ */ new Map(),
      doc: e,
      keep: !0,
      mapAsMap: t === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof n == "number" ? n : 100
    }, l = D(this, "", o);
    if (typeof i == "function")
      for (const { count: a, res: c } of o.anchors.values())
        i(c, a);
    return typeof r == "function" ? fe(r, { "": l }, "", l) : l;
  }
}
class wt extends bt {
  constructor(e) {
    super(yt), this.source = e, Object.defineProperty(this, "tag", {
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
        (be(o) || Wt(o)) && n.push(o);
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
      if (a || (D(i, null, t), a = r.get(i)), a?.res === void 0) {
        const c = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(c);
      }
      if (l >= 0 && (a.count += 1, a.aliasCount === 0 && (a.aliasCount = qe(o, i, r)), a.count * a.aliasCount > l)) {
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
      if (Xt(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
        const r = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(r);
      }
      if (e.implicitKey)
        return `${i} `;
    }
    return i;
  }
}
function qe(s, e, t) {
  if (be(e)) {
    const n = e.resolve(s), i = t && n && t.get(n);
    return i ? i.count * i.aliasCount : 0;
  } else if (L(e)) {
    let n = 0;
    for (const i of e.items) {
      const r = qe(s, i, t);
      r > n && (n = r);
    }
    return n;
  } else if (M(e)) {
    const n = qe(s, e.key, t), i = qe(s, e.value, t);
    return Math.max(n, i);
  }
  return 1;
}
const ts = (s) => !s || typeof s != "function" && typeof s != "object";
class v extends bt {
  constructor(e) {
    super(V), this.value = e;
  }
  toJSON(e, t) {
    return t?.keep ? this.value : D(this.value, e, t);
  }
  toString() {
    return String(this.value);
  }
}
v.BLOCK_FOLDED = "BLOCK_FOLDED";
v.BLOCK_LITERAL = "BLOCK_LITERAL";
v.PLAIN = "PLAIN";
v.QUOTE_DOUBLE = "QUOTE_DOUBLE";
v.QUOTE_SINGLE = "QUOTE_SINGLE";
const Gs = "tag:yaml.org,2002:";
function Hs(s, e, t) {
  if (e) {
    const n = t.filter((r) => r.tag === e), i = n.find((r) => !r.format) ?? n[0];
    if (!i)
      throw new Error(`Tag ${e} not found`);
    return i;
  }
  return t.find((n) => n.identify?.(s) && !n.format);
}
function Ie(s, e, t) {
  if (He(s) && (s = s.contents), C(s))
    return s;
  if (M(s)) {
    const h = t.schema[W].createNode?.(t.schema, null, t);
    return h.items.push(s), h;
  }
  (s instanceof String || s instanceof Number || s instanceof Boolean || typeof BigInt < "u" && s instanceof BigInt) && (s = s.valueOf());
  const { aliasDuplicateObjects: n, onAnchor: i, onTagObj: r, schema: o, sourceObjects: l } = t;
  let a;
  if (n && s && typeof s == "object") {
    if (a = l.get(s), a)
      return a.anchor ?? (a.anchor = i(s)), new wt(a.anchor);
    a = { anchor: null, node: null }, l.set(s, a);
  }
  e?.startsWith("!!") && (e = Gs + e.slice(2));
  let c = Hs(s, e, o.tags);
  if (!c) {
    if (s && typeof s.toJSON == "function" && (s = s.toJSON()), !s || typeof s != "object") {
      const h = new v(s);
      return a && (a.node = h), h;
    }
    c = s instanceof Map ? o[W] : Symbol.iterator in Object(s) ? o[ye] : o[W];
  }
  r && (r(c), delete t.onTagObj);
  const p = c?.createNode ? c.createNode(t.schema, s, t) : typeof c?.nodeClass?.from == "function" ? c.nodeClass.from(t.schema, s, t) : new v(s);
  return e ? p.tag = e : c.default || (p.tag = c.tag), a && (a.node = p), p;
}
function Ve(s, e, t) {
  let n = t;
  for (let i = e.length - 1; i >= 0; --i) {
    const r = e[i];
    if (typeof r == "number" && Number.isInteger(r) && r >= 0) {
      const o = [];
      o[r] = n, n = o;
    } else
      n = /* @__PURE__ */ new Map([[r, n]]);
  }
  return Ie(n, void 0, {
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
class ss extends bt {
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
    return e && (t.schema = e), t.items = t.items.map((n) => C(n) || M(n) ? n.clone(e) : n), this.range && (t.range = this.range.slice()), t;
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
        this.set(n, Ve(this.schema, i, t));
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
    return i.length === 0 ? !t && I(r) ? r.value : r : L(r) ? r.getIn(i, t) : void 0;
  }
  hasAllNullValues(e) {
    return this.items.every((t) => {
      if (!M(t))
        return !1;
      const n = t.value;
      return n == null || e && I(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
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
        this.set(n, Ve(this.schema, i, t));
      else
        throw new Error(`Expected YAML collection at ${n}. Remaining path: ${i}`);
    }
  }
}
const zs = (s) => s.replace(/^(?!$)(?: $)?/gm, "#");
function G(s, e) {
  return /^\n+$/.test(s) ? s.substring(1) : e ? s.replace(/^(?! *$)/gm, e) : s;
}
const te = (s, e, t) => s.endsWith(`
`) ? G(t, e) : t.includes(`
`) ? `
` + G(t, e) : (s.endsWith(" ") ? "" : " ") + t, ns = "flow", ut = "block", Re = "quoted";
function ze(s, e, t = "flow", { indentAtStart: n, lineWidth: i = 80, minContentWidth: r = 20, onFold: o, onOverflow: l } = {}) {
  if (!i || i < 0)
    return s;
  i < r && (r = 0);
  const a = Math.max(1 + r, 1 + i - e.length);
  if (s.length <= a)
    return s;
  const c = [], p = {};
  let h = i - e.length;
  typeof n == "number" && (n > i - Math.max(2, r) ? c.push(0) : h = i - n);
  let u, m, y = !1, f = -1, g = -1, d = -1;
  t === ut && (f = Mt(s, f, e.length), f !== -1 && (h = f + a));
  for (let w; w = s[f += 1]; ) {
    if (t === Re && w === "\\") {
      switch (g = f, s[f + 1]) {
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
      d = f;
    }
    if (w === `
`)
      t === ut && (f = Mt(s, f, e.length)), h = f + e.length + a, u = void 0;
    else {
      if (w === " " && m && m !== " " && m !== `
` && m !== "	") {
        const S = s[f + 1];
        S && S !== " " && S !== `
` && S !== "	" && (u = f);
      }
      if (f >= h)
        if (u)
          c.push(u), h = u + a, u = void 0;
        else if (t === Re) {
          for (; m === " " || m === "	"; )
            m = w, w = s[f += 1], y = !0;
          const S = f > d + 1 ? f - 2 : g - 1;
          if (p[S])
            return s;
          c.push(S), p[S] = !0, h = S + a, u = void 0;
        } else
          y = !0;
    }
    m = w;
  }
  if (y && l && l(), c.length === 0)
    return s;
  o && o();
  let b = s.slice(0, c[0]);
  for (let w = 0; w < c.length; ++w) {
    const S = c[w], $ = c[w + 1] || s.length;
    S === 0 ? b = `
${e}${s.slice(0, $)}` : (t === Re && p[S] && (b += `${s[S]}\\`), b += `
${e}${s.slice(S + 1, $)}`);
  }
  return b;
}
function Mt(s, e, t) {
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
const Qe = (s, e) => ({
  indentAtStart: e ? s.indent.length : s.indentAtStart,
  lineWidth: s.options.lineWidth,
  minContentWidth: s.options.minContentWidth
}), We = (s) => /^(%|---|\.\.\.)/m.test(s);
function Qs(s, e, t) {
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
function Ae(s, e) {
  const t = JSON.stringify(s);
  if (e.options.doubleQuotedAsJSON)
    return t;
  const { implicitKey: n } = e, i = e.options.doubleQuotedMinMultiLineLength, r = e.indent || (We(s) ? "  " : "");
  let o = "", l = 0;
  for (let a = 0, c = t[a]; c; c = t[++a])
    if (c === " " && t[a + 1] === "\\" && t[a + 2] === "n" && (o += t.slice(l, a) + "\\ ", a += 1, l = a, c = "\\"), c === "\\")
      switch (t[a + 1]) {
        case "u":
          {
            o += t.slice(l, a);
            const p = t.substr(a + 2, 4);
            switch (p) {
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
                p.substr(0, 2) === "00" ? o += "\\x" + p.substr(2) : o += t.substr(a, 6);
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
  return o = l ? o + t.slice(l) : t, n ? o : ze(o, r, Re, Qe(e, !1));
}
function ht(s, e) {
  if (e.options.singleQuote === !1 || e.implicitKey && s.includes(`
`) || /[ \t]\n|\n[ \t]/.test(s))
    return Ae(s, e);
  const t = e.indent || (We(s) ? "  " : ""), n = "'" + s.replace(/'/g, "''").replace(/\n+/g, `$&
${t}`) + "'";
  return e.implicitKey ? n : ze(n, t, ns, Qe(e, !1));
}
function ue(s, e) {
  const { singleQuote: t } = e.options;
  let n;
  if (t === !1)
    n = Ae;
  else {
    const i = s.includes('"'), r = s.includes("'");
    i && !r ? n = ht : r && !i ? n = Ae : n = t ? ht : Ae;
  }
  return n(s, e);
}
let dt;
try {
  dt = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
} catch {
  dt = /\n+(?!\n|$)/g;
}
function Fe({ comment: s, type: e, value: t }, n, i, r) {
  const { blockQuote: o, commentString: l, lineWidth: a } = n.options;
  if (!o || /\n[\t ]+$/.test(t))
    return ue(t, n);
  const c = n.indent || (n.forceBlockIndent || We(t) ? "  " : ""), p = o === "literal" ? !0 : o === "folded" || e === v.BLOCK_FOLDED ? !1 : e === v.BLOCK_LITERAL ? !0 : !Qs(t, a, c.length);
  if (!t)
    return p ? `|
` : `>
`;
  let h, u;
  for (u = t.length; u > 0; --u) {
    const $ = t[u - 1];
    if ($ !== `
` && $ !== "	" && $ !== " ")
      break;
  }
  let m = t.substring(u);
  const y = m.indexOf(`
`);
  y === -1 ? h = "-" : t === m || y !== m.length - 1 ? (h = "+", r && r()) : h = "", m && (t = t.slice(0, -m.length), m[m.length - 1] === `
` && (m = m.slice(0, -1)), m = m.replace(dt, `$&${c}`));
  let f = !1, g, d = -1;
  for (g = 0; g < t.length; ++g) {
    const $ = t[g];
    if ($ === " ")
      f = !0;
    else if ($ === `
`)
      d = g;
    else
      break;
  }
  let b = t.substring(0, d < g ? d + 1 : g);
  b && (t = t.substring(b.length), b = b.replace(/\n+/g, `$&${c}`));
  let S = (f ? c ? "2" : "1" : "") + h;
  if (s && (S += " " + l(s.replace(/ ?[\r\n]+/g, " ")), i && i()), !p) {
    const $ = t.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${c}`);
    let N = !1;
    const O = Qe(n, !0);
    o !== "folded" && e !== v.BLOCK_FOLDED && (O.onOverflow = () => {
      N = !0;
    });
    const k = ze(`${b}${$}${m}`, c, ut, O);
    if (!N)
      return `>${S}
${c}${k}`;
  }
  return t = t.replace(/\n+/g, `$&${c}`), `|${S}
${c}${b}${t}${m}`;
}
function Ws(s, e, t, n) {
  const { type: i, value: r } = s, { actualString: o, implicitKey: l, indent: a, indentStep: c, inFlow: p } = e;
  if (l && r.includes(`
`) || p && /[[\]{},]/.test(r))
    return ue(r, e);
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(r))
    return l || p || !r.includes(`
`) ? ue(r, e) : Fe(s, e, t, n);
  if (!l && !p && i !== v.PLAIN && r.includes(`
`))
    return Fe(s, e, t, n);
  if (We(r)) {
    if (a === "")
      return e.forceBlockIndent = !0, Fe(s, e, t, n);
    if (l && a === c)
      return ue(r, e);
  }
  const h = r.replace(/\n+/g, `$&
${a}`);
  if (o) {
    const u = (f) => f.default && f.tag !== "tag:yaml.org,2002:str" && f.test?.test(h), { compat: m, tags: y } = e.doc.schema;
    if (y.some(u) || m?.some(u))
      return ue(r, e);
  }
  return l ? h : ze(h, a, ns, Qe(e, !1));
}
function kt(s, e, t, n) {
  const { implicitKey: i, inFlow: r } = e, o = typeof s.value == "string" ? s : Object.assign({}, s, { value: String(s.value) });
  let { type: l } = s;
  l !== v.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(o.value) && (l = v.QUOTE_DOUBLE);
  const a = (p) => {
    switch (p) {
      case v.BLOCK_FOLDED:
      case v.BLOCK_LITERAL:
        return i || r ? ue(o.value, e) : Fe(o, e, t, n);
      case v.QUOTE_DOUBLE:
        return Ae(o.value, e);
      case v.QUOTE_SINGLE:
        return ht(o.value, e);
      case v.PLAIN:
        return Ws(o, e, t, n);
      default:
        return null;
    }
  };
  let c = a(l);
  if (c === null) {
    const { defaultKeyType: p, defaultStringType: h } = e.options, u = i && p || h;
    if (c = a(u), c === null)
      throw new Error(`Unsupported default string type ${u}`);
  }
  return c;
}
function is(s, e) {
  const t = Object.assign({
    blockQuote: !0,
    commentString: zs,
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
function Xs(s, e) {
  if (e.tag) {
    const i = s.filter((r) => r.tag === e.tag);
    if (i.length > 0)
      return i.find((r) => r.format === e.format) ?? i[0];
  }
  let t, n;
  if (I(e)) {
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
function Zs(s, e, { anchors: t, doc: n }) {
  if (!n.directives)
    return "";
  const i = [], r = (I(s) || L(s)) && s.anchor;
  r && Xt(r) && (t.add(r), i.push(`&${r}`));
  const o = s.tag ?? (e.default ? null : e.tag);
  return o && i.push(n.directives.tagString(o)), i.join(" ");
}
function me(s, e, t, n) {
  if (M(s))
    return s.toString(e, t, n);
  if (be(s)) {
    if (e.doc.directives)
      return s.toString(e);
    if (e.resolvedAliases?.has(s))
      throw new TypeError("Cannot stringify circular structure without alias nodes");
    e.resolvedAliases ? e.resolvedAliases.add(s) : e.resolvedAliases = /* @__PURE__ */ new Set([s]), s = s.resolve(e.doc);
  }
  let i;
  const r = C(s) ? s : e.doc.createNode(s, { onTagObj: (a) => i = a });
  i ?? (i = Xs(e.doc.schema.tags, r));
  const o = Zs(r, i, e);
  o.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + o.length + 1);
  const l = typeof i.stringify == "function" ? i.stringify(r, e, t, n) : I(r) ? kt(r, e, t, n) : r.toString(e, t, n);
  return o ? I(r) || l[0] === "{" || l[0] === "[" ? `${o} ${l}` : `${o}
${e.indent}${l}` : l;
}
function en({ key: s, value: e }, t, n, i) {
  const { allNullValues: r, doc: o, indent: l, indentStep: a, options: { commentString: c, indentSeq: p, simpleKeys: h } } = t;
  let u = C(s) && s.comment || null;
  if (h) {
    if (u)
      throw new Error("With simple keys, key nodes cannot have comments");
    if (L(s) || !C(s) && typeof s == "object") {
      const O = "With simple keys, collection cannot be used as a key value";
      throw new Error(O);
    }
  }
  let m = !h && (!s || u && e == null && !t.inFlow || L(s) || (I(s) ? s.type === v.BLOCK_FOLDED || s.type === v.BLOCK_LITERAL : typeof s == "object"));
  t = Object.assign({}, t, {
    allNullValues: !1,
    implicitKey: !m && (h || !r),
    indent: l + a
  });
  let y = !1, f = !1, g = me(s, t, () => y = !0, () => f = !0);
  if (!m && !t.inFlow && g.length > 1024) {
    if (h)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    m = !0;
  }
  if (t.inFlow) {
    if (r || e == null)
      return y && n && n(), g === "" ? "?" : m ? `? ${g}` : g;
  } else if (r && !h || e == null && m)
    return g = `? ${g}`, u && !y ? g += te(g, t.indent, c(u)) : f && i && i(), g;
  y && (u = null), m ? (u && (g += te(g, t.indent, c(u))), g = `? ${g}
${l}:`) : (g = `${g}:`, u && (g += te(g, t.indent, c(u))));
  let d, b, w;
  C(e) ? (d = !!e.spaceBefore, b = e.commentBefore, w = e.comment) : (d = !1, b = null, w = null, e && typeof e == "object" && (e = o.createNode(e))), t.implicitKey = !1, !m && !u && I(e) && (t.indentAtStart = g.length + 1), f = !1, !p && a.length >= 2 && !t.inFlow && !m && Ce(e) && !e.flow && !e.tag && !e.anchor && (t.indent = t.indent.substring(2));
  let S = !1;
  const $ = me(e, t, () => S = !0, () => f = !0);
  let N = " ";
  if (u || d || b) {
    if (N = d ? `
` : "", b) {
      const O = c(b);
      N += `
${G(O, t.indent)}`;
    }
    $ === "" && !t.inFlow ? N === `
` && w && (N = `

`) : N += `
${t.indent}`;
  } else if (!m && L(e)) {
    const O = $[0], k = $.indexOf(`
`), E = k !== -1, _ = t.inFlow ?? e.flow ?? e.items.length === 0;
    if (E || !_) {
      let T = !1;
      if (E && (O === "&" || O === "!")) {
        let A = $.indexOf(" ");
        O === "&" && A !== -1 && A < k && $[A + 1] === "!" && (A = $.indexOf(" ", A + 1)), (A === -1 || k < A) && (T = !0);
      }
      T || (N = `
${t.indent}`);
    }
  } else ($ === "" || $[0] === `
`) && (N = "");
  return g += N + $, t.inFlow ? S && n && n() : w && !S ? g += te(g, t.indent, c(w)) : f && i && i(), g;
}
function tn(s, e) {
  (s === "debug" || s === "warn") && console.warn(e);
}
const xe = "<<", H = {
  identify: (s) => s === xe || typeof s == "symbol" && s.description === xe,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new v(Symbol(xe)), {
    addToJSMap: rs
  }),
  stringify: () => xe
}, sn = (s, e) => (H.identify(e) || I(e) && (!e.type || e.type === v.PLAIN) && H.identify(e.value)) && s?.doc.schema.tags.some((t) => t.tag === H.tag && t.default);
function rs(s, e, t) {
  const n = os(s, t);
  if (Ce(n))
    for (const i of n.items)
      it(s, e, i);
  else if (Array.isArray(n))
    for (const i of n)
      it(s, e, i);
  else
    it(s, e, n);
}
function it(s, e, t) {
  const n = os(s, t);
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
function os(s, e) {
  return s && be(e) ? e.resolve(s.doc, s) : e;
}
function as(s, e, { key: t, value: n }) {
  if (C(t) && t.addToJSMap)
    t.addToJSMap(s, e, n);
  else if (sn(s, t))
    rs(s, e, n);
  else {
    const i = D(t, "", s);
    if (e instanceof Map)
      e.set(i, D(n, i, s));
    else if (e instanceof Set)
      e.add(i);
    else {
      const r = nn(t, i, s), o = D(n, r, s);
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
function nn(s, e, t) {
  if (e === null)
    return "";
  if (typeof e != "object")
    return String(e);
  if (C(s) && t?.doc) {
    const n = is(t.doc, {});
    n.anchors = /* @__PURE__ */ new Set();
    for (const r of t.anchors.keys())
      n.anchors.add(r.anchor);
    n.inFlow = !0, n.inStringifyKey = !0;
    const i = s.toString(n);
    if (!t.mapKeyWarned) {
      let r = JSON.stringify(i);
      r.length > 40 && (r = r.substring(0, 36) + '..."'), tn(t.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${r}. Set mapAsMap: true to use object keys.`), t.mapKeyWarned = !0;
    }
    return i;
  }
  return JSON.stringify(e);
}
function $t(s, e, t) {
  const n = Ie(s, void 0, t), i = Ie(e, void 0, t);
  return new P(n, i);
}
class P {
  constructor(e, t = null) {
    Object.defineProperty(this, q, { value: Qt }), this.key = e, this.value = t;
  }
  clone(e) {
    let { key: t, value: n } = this;
    return C(t) && (t = t.clone(e)), C(n) && (n = n.clone(e)), new P(t, n);
  }
  toJSON(e, t) {
    const n = t?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    return as(t, n, this);
  }
  toString(e, t, n) {
    return e?.doc ? en(this, e, t, n) : JSON.stringify(this);
  }
}
function ls(s, e, t) {
  return (e.inFlow ?? s.flow ? on : rn)(s, e, t);
}
function rn({ comment: s, items: e }, t, { blockItemPrefix: n, flowChars: i, itemIndent: r, onChompKeep: o, onComment: l }) {
  const { indent: a, options: { commentString: c } } = t, p = Object.assign({}, t, { indent: r, type: null });
  let h = !1;
  const u = [];
  for (let y = 0; y < e.length; ++y) {
    const f = e[y];
    let g = null;
    if (C(f))
      !h && f.spaceBefore && u.push(""), Ye(t, u, f.commentBefore, h), f.comment && (g = f.comment);
    else if (M(f)) {
      const b = C(f.key) ? f.key : null;
      b && (!h && b.spaceBefore && u.push(""), Ye(t, u, b.commentBefore, h));
    }
    h = !1;
    let d = me(f, p, () => g = null, () => h = !0);
    g && (d += te(d, r, c(g))), h && g && (h = !1), u.push(n + d);
  }
  let m;
  if (u.length === 0)
    m = i.start + i.end;
  else {
    m = u[0];
    for (let y = 1; y < u.length; ++y) {
      const f = u[y];
      m += f ? `
${a}${f}` : `
`;
    }
  }
  return s ? (m += `
` + G(c(s), a), l && l()) : h && o && o(), m;
}
function on({ items: s }, e, { flowChars: t, itemIndent: n }) {
  const { indent: i, indentStep: r, flowCollectionPadding: o, options: { commentString: l } } = e;
  n += r;
  const a = Object.assign({}, e, {
    indent: n,
    inFlow: !0,
    type: null
  });
  let c = !1, p = 0;
  const h = [];
  for (let y = 0; y < s.length; ++y) {
    const f = s[y];
    let g = null;
    if (C(f))
      f.spaceBefore && h.push(""), Ye(e, h, f.commentBefore, !1), f.comment && (g = f.comment);
    else if (M(f)) {
      const b = C(f.key) ? f.key : null;
      b && (b.spaceBefore && h.push(""), Ye(e, h, b.commentBefore, !1), b.comment && (c = !0));
      const w = C(f.value) ? f.value : null;
      w ? (w.comment && (g = w.comment), w.commentBefore && (c = !0)) : f.value == null && b?.comment && (g = b.comment);
    }
    g && (c = !0);
    let d = me(f, a, () => g = null);
    c || (c = h.length > p || d.includes(`
`)), y < s.length - 1 ? d += "," : e.options.trailingComma && (e.options.lineWidth > 0 && (c || (c = h.reduce((b, w) => b + w.length + 2, 2) + (d.length + 2) > e.options.lineWidth)), c && (d += ",")), g && (d += te(d, n, l(g))), h.push(d), p = h.length;
  }
  const { start: u, end: m } = t;
  if (h.length === 0)
    return u + m;
  if (!c) {
    const y = h.reduce((f, g) => f + g.length + 2, 2);
    c = e.options.lineWidth > 0 && y > e.options.lineWidth;
  }
  if (c) {
    let y = u;
    for (const f of h)
      y += f ? `
${r}${i}${f}` : `
`;
    return `${y}
${i}${m}`;
  } else
    return `${u}${o}${h.join(" ")}${o}${m}`;
}
function Ye({ indent: s, options: { commentString: e } }, t, n, i) {
  if (n && i && (n = n.replace(/^\n+/, "")), n) {
    const r = G(e(n), s);
    t.push(r.trimStart());
  }
}
function se(s, e) {
  const t = I(e) ? e.value : e;
  for (const n of s)
    if (M(n) && (n.key === e || n.key === t || I(n.key) && n.key.value === t))
      return n;
}
class K extends ss {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(e) {
    super(W, e), this.items = [];
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
      (c !== void 0 || i) && o.items.push($t(a, c, n));
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
    M(e) ? n = e : !e || typeof e != "object" || !("key" in e) ? n = new P(e, e?.value) : n = new P(e.key, e.value);
    const i = se(this.items, n.key), r = this.schema?.sortMapEntries;
    if (i) {
      if (!t)
        throw new Error(`Key ${n.key} already set`);
      I(i.value) && ts(n.value) ? i.value.value = n.value : i.value = n.value;
    } else if (r) {
      const o = this.items.findIndex((l) => r(n, l) < 0);
      o === -1 ? this.items.push(n) : this.items.splice(o, 0, n);
    } else
      this.items.push(n);
  }
  delete(e) {
    const t = se(this.items, e);
    return t ? this.items.splice(this.items.indexOf(t), 1).length > 0 : !1;
  }
  get(e, t) {
    const i = se(this.items, e)?.value;
    return (!t && I(i) ? i.value : i) ?? void 0;
  }
  has(e) {
    return !!se(this.items, e);
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
      as(t, i, r);
    return i;
  }
  toString(e, t, n) {
    if (!e)
      return JSON.stringify(this);
    for (const i of this.items)
      if (!M(i))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(i)} instead`);
    return !e.allNullValues && this.hasAllNullValues(!1) && (e = Object.assign({}, e, { allNullValues: !0 })), ls(this, e, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: e.indent || "",
      onChompKeep: n,
      onComment: t
    });
  }
}
const ke = {
  collection: "map",
  default: !0,
  nodeClass: K,
  tag: "tag:yaml.org,2002:map",
  resolve(s, e) {
    return Le(s) || e("Expected a mapping for this tag"), s;
  },
  createNode: (s, e, t) => K.from(s, e, t)
};
class ne extends ss {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(e) {
    super(ye, e), this.items = [];
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
    const t = je(e);
    return typeof t != "number" ? !1 : this.items.splice(t, 1).length > 0;
  }
  get(e, t) {
    const n = je(e);
    if (typeof n != "number")
      return;
    const i = this.items[n];
    return !t && I(i) ? i.value : i;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(e) {
    const t = je(e);
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
    const n = je(e);
    if (typeof n != "number")
      throw new Error(`Expected a valid index, not ${e}.`);
    const i = this.items[n];
    I(i) && ts(t) ? i.value = t : this.items[n] = t;
  }
  toJSON(e, t) {
    const n = [];
    t?.onCreate && t.onCreate(n);
    let i = 0;
    for (const r of this.items)
      n.push(D(r, String(i++), t));
    return n;
  }
  toString(e, t, n) {
    return e ? ls(this, e, {
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
        r.items.push(Ie(l, void 0, n));
      }
    }
    return r;
  }
}
function je(s) {
  let e = I(s) ? s.value : s;
  return e && typeof e == "string" && (e = Number(e)), typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
}
const $e = {
  collection: "seq",
  default: !0,
  nodeClass: ne,
  tag: "tag:yaml.org,2002:seq",
  resolve(s, e) {
    return Ce(s) || e("Expected a sequence for this tag"), s;
  },
  createNode: (s, e, t) => ne.from(s, e, t)
}, Xe = {
  identify: (s) => typeof s == "string",
  default: !0,
  tag: "tag:yaml.org,2002:str",
  resolve: (s) => s,
  stringify(s, e, t, n) {
    return e = Object.assign({ actualString: !0 }, e), kt(s, e, t, n);
  }
}, Ze = {
  identify: (s) => s == null,
  createNode: () => new v(null),
  default: !0,
  tag: "tag:yaml.org,2002:null",
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new v(null),
  stringify: ({ source: s }, e) => typeof s == "string" && Ze.test.test(s) ? s : e.options.nullStr
}, St = {
  identify: (s) => typeof s == "boolean",
  default: !0,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: (s) => new v(s[0] === "t" || s[0] === "T"),
  stringify({ source: s, value: e }, t) {
    if (s && St.test.test(s)) {
      const n = s[0] === "t" || s[0] === "T";
      if (e === n)
        return s;
    }
    return e ? t.options.trueStr : t.options.falseStr;
  }
};
function U({ format: s, minFractionDigits: e, tag: t, value: n }) {
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
const cs = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (s) => s.slice(-3).toLowerCase() === "nan" ? NaN : s[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: U
}, fs = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: (s) => parseFloat(s),
  stringify(s) {
    const e = Number(s.value);
    return isFinite(e) ? e.toExponential() : U(s);
  }
}, us = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(s) {
    const e = new v(parseFloat(s)), t = s.indexOf(".");
    return t !== -1 && s[s.length - 1] === "0" && (e.minFractionDigits = s.length - t - 1), e;
  },
  stringify: U
}, et = (s) => typeof s == "bigint" || Number.isInteger(s), Nt = (s, e, t, { intAsBigInt: n }) => n ? BigInt(s) : parseInt(s.substring(e), t);
function hs(s, e, t) {
  const { value: n } = s;
  return et(n) && n >= 0 ? t + n.toString(e) : U(s);
}
const ds = {
  identify: (s) => et(s) && s >= 0,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^0o[0-7]+$/,
  resolve: (s, e, t) => Nt(s, 2, 8, t),
  stringify: (s) => hs(s, 8, "0o")
}, ps = {
  identify: et,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9]+$/,
  resolve: (s, e, t) => Nt(s, 0, 10, t),
  stringify: U
}, ms = {
  identify: (s) => et(s) && s >= 0,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (s, e, t) => Nt(s, 2, 16, t),
  stringify: (s) => hs(s, 16, "0x")
}, an = [
  ke,
  $e,
  Xe,
  Ze,
  St,
  ds,
  ps,
  ms,
  cs,
  fs,
  us
];
function _t(s) {
  return typeof s == "bigint" || Number.isInteger(s);
}
const Be = ({ value: s }) => JSON.stringify(s), ln = [
  {
    identify: (s) => typeof s == "string",
    default: !0,
    tag: "tag:yaml.org,2002:str",
    resolve: (s) => s,
    stringify: Be
  },
  {
    identify: (s) => s == null,
    createNode: () => new v(null),
    default: !0,
    tag: "tag:yaml.org,2002:null",
    test: /^null$/,
    resolve: () => null,
    stringify: Be
  },
  {
    identify: (s) => typeof s == "boolean",
    default: !0,
    tag: "tag:yaml.org,2002:bool",
    test: /^true$|^false$/,
    resolve: (s) => s === "true",
    stringify: Be
  },
  {
    identify: _t,
    default: !0,
    tag: "tag:yaml.org,2002:int",
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (s, e, { intAsBigInt: t }) => t ? BigInt(s) : parseInt(s, 10),
    stringify: ({ value: s }) => _t(s) ? s.toString() : JSON.stringify(s)
  },
  {
    identify: (s) => typeof s == "number",
    default: !0,
    tag: "tag:yaml.org,2002:float",
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (s) => parseFloat(s),
    stringify: Be
  }
], cn = {
  default: !0,
  tag: "",
  test: /^/,
  resolve(s, e) {
    return e(`Unresolved plain scalar ${JSON.stringify(s)}`), s;
  }
}, fn = [ke, $e].concat(ln, cn), Ot = {
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
    if (e ?? (e = v.BLOCK_LITERAL), e !== v.QUOTE_DOUBLE) {
      const a = Math.max(n.options.lineWidth - n.indent.length, n.options.minContentWidth), c = Math.ceil(l.length / a), p = new Array(c);
      for (let h = 0, u = 0; h < c; ++h, u += a)
        p[h] = l.substr(u, a);
      l = p.join(e === v.BLOCK_LITERAL ? `
` : " ");
    }
    return kt({ comment: s, type: e, value: l }, n, i, r);
  }
};
function gs(s, e) {
  if (Ce(s))
    for (let t = 0; t < s.items.length; ++t) {
      let n = s.items[t];
      if (!M(n)) {
        if (Le(n)) {
          n.items.length > 1 && e("Each pair must have its own sequence indicator");
          const i = n.items[0] || new P(new v(null));
          if (n.commentBefore && (i.key.commentBefore = i.key.commentBefore ? `${n.commentBefore}
${i.key.commentBefore}` : n.commentBefore), n.comment) {
            const r = i.value ?? i.key;
            r.comment = r.comment ? `${n.comment}
${r.comment}` : n.comment;
          }
          n = i;
        }
        s.items[t] = M(n) ? n : new P(n);
      }
    }
  else
    e("Expected a sequence for this tag");
  return s;
}
function ys(s, e, t) {
  const { replacer: n } = t, i = new ne(s);
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
      i.items.push($t(l, a, t));
    }
  return i;
}
const vt = {
  collection: "seq",
  default: !1,
  tag: "tag:yaml.org,2002:pairs",
  resolve: gs,
  createNode: ys
};
class he extends ne {
  constructor() {
    super(), this.add = K.prototype.add.bind(this), this.delete = K.prototype.delete.bind(this), this.get = K.prototype.get.bind(this), this.has = K.prototype.has.bind(this), this.set = K.prototype.set.bind(this), this.tag = he.tag;
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
      if (M(i) ? (r = D(i.key, "", t), o = D(i.value, r, t)) : r = D(i, "", t), n.has(r))
        throw new Error("Ordered maps must not include duplicate keys");
      n.set(r, o);
    }
    return n;
  }
  static from(e, t, n) {
    const i = ys(e, t, n), r = new this();
    return r.items = i.items, r;
  }
}
he.tag = "tag:yaml.org,2002:omap";
const Et = {
  collection: "seq",
  identify: (s) => s instanceof Map,
  nodeClass: he,
  default: !1,
  tag: "tag:yaml.org,2002:omap",
  resolve(s, e) {
    const t = gs(s, e), n = [];
    for (const { key: i } of t.items)
      I(i) && (n.includes(i.value) ? e(`Ordered maps must not include duplicate keys: ${i.value}`) : n.push(i.value));
    return Object.assign(new he(), t);
  },
  createNode: (s, e, t) => he.from(s, e, t)
};
function bs({ value: s, source: e }, t) {
  return e && (s ? ws : ks).test.test(e) ? e : s ? t.options.trueStr : t.options.falseStr;
}
const ws = {
  identify: (s) => s === !0,
  default: !0,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new v(!0),
  stringify: bs
}, ks = {
  identify: (s) => s === !1,
  default: !0,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  resolve: () => new v(!1),
  stringify: bs
}, un = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (s) => s.slice(-3).toLowerCase() === "nan" ? NaN : s[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: U
}, hn = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (s) => parseFloat(s.replace(/_/g, "")),
  stringify(s) {
    const e = Number(s.value);
    return isFinite(e) ? e.toExponential() : U(s);
  }
}, dn = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(s) {
    const e = new v(parseFloat(s.replace(/_/g, ""))), t = s.indexOf(".");
    if (t !== -1) {
      const n = s.substring(t + 1).replace(/_/g, "");
      n[n.length - 1] === "0" && (e.minFractionDigits = n.length);
    }
    return e;
  },
  stringify: U
}, Me = (s) => typeof s == "bigint" || Number.isInteger(s);
function tt(s, e, t, { intAsBigInt: n }) {
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
function At(s, e, t) {
  const { value: n } = s;
  if (Me(n)) {
    const i = n.toString(e);
    return n < 0 ? "-" + t + i.substr(1) : t + i;
  }
  return U(s);
}
const pn = {
  identify: Me,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "BIN",
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (s, e, t) => tt(s, 2, 2, t),
  stringify: (s) => At(s, 2, "0b")
}, mn = {
  identify: Me,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^[-+]?0[0-7_]+$/,
  resolve: (s, e, t) => tt(s, 1, 8, t),
  stringify: (s) => At(s, 8, "0")
}, gn = {
  identify: Me,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (s, e, t) => tt(s, 0, 10, t),
  stringify: U
}, yn = {
  identify: Me,
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (s, e, t) => tt(s, 2, 16, t),
  stringify: (s) => At(s, 16, "0x")
};
class de extends K {
  constructor(e) {
    super(e), this.tag = de.tag;
  }
  add(e) {
    let t;
    M(e) ? t = e : e && typeof e == "object" && "key" in e && "value" in e && e.value === null ? t = new P(e.key, null) : t = new P(e, null), se(this.items, t.key) || this.items.push(t);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(e, t) {
    const n = se(this.items, e);
    return !t && M(n) ? I(n.key) ? n.key.value : n.key : n;
  }
  set(e, t) {
    if (typeof t != "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`);
    const n = se(this.items, e);
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
        typeof i == "function" && (o = i.call(t, o, o)), r.items.push($t(o, null, n));
    return r;
  }
}
de.tag = "tag:yaml.org,2002:set";
const It = {
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
function Tt(s, e) {
  const t = s[0], n = t === "-" || t === "+" ? s.substring(1) : s, i = (o) => e ? BigInt(o) : Number(o), r = n.replace(/_/g, "").split(":").reduce((o, l) => o * i(60) + i(l), i(0));
  return t === "-" ? i(-1) * r : r;
}
function $s(s) {
  let { value: e } = s, t = (o) => o;
  if (typeof e == "bigint")
    t = (o) => BigInt(o);
  else if (isNaN(e) || !isFinite(e))
    return U(s);
  let n = "";
  e < 0 && (n = "-", e *= t(-1));
  const i = t(60), r = [e % i];
  return e < 60 ? r.unshift(0) : (e = (e - r[0]) / i, r.unshift(e % i), e >= 60 && (e = (e - r[0]) / i, r.unshift(e))), n + r.map((o) => String(o).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
const Ss = {
  identify: (s) => typeof s == "bigint" || Number.isInteger(s),
  default: !0,
  tag: "tag:yaml.org,2002:int",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: (s, e, { intAsBigInt: t }) => Tt(s, t),
  stringify: $s
}, Ns = {
  identify: (s) => typeof s == "number",
  default: !0,
  tag: "tag:yaml.org,2002:float",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: (s) => Tt(s, !1),
  stringify: $s
}, st = {
  identify: (s) => s instanceof Date,
  default: !0,
  tag: "tag:yaml.org,2002:timestamp",
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
  resolve(s) {
    const e = s.match(st.test);
    if (!e)
      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
    const [, t, n, i, r, o, l] = e.map(Number), a = e[7] ? Number((e[7] + "00").substr(1, 3)) : 0;
    let c = Date.UTC(t, n - 1, i, r || 0, o || 0, l || 0, a);
    const p = e[8];
    if (p && p !== "Z") {
      let h = Tt(p, !1);
      Math.abs(h) < 30 && (h *= 60), c -= 6e4 * h;
    }
    return new Date(c);
  },
  stringify: ({ value: s }) => s?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
}, xt = [
  ke,
  $e,
  Xe,
  Ze,
  ws,
  ks,
  pn,
  mn,
  gn,
  yn,
  un,
  hn,
  dn,
  Ot,
  H,
  Et,
  vt,
  It,
  Ss,
  Ns,
  st
], jt = /* @__PURE__ */ new Map([
  ["core", an],
  ["failsafe", [ke, $e, Xe]],
  ["json", fn],
  ["yaml11", xt],
  ["yaml-1.1", xt]
]), Bt = {
  binary: Ot,
  bool: St,
  float: us,
  floatExp: fs,
  floatNaN: cs,
  floatTime: Ns,
  int: ps,
  intHex: ms,
  intOct: ds,
  intTime: Ss,
  map: ke,
  merge: H,
  null: Ze,
  omap: Et,
  pairs: vt,
  seq: $e,
  set: It,
  timestamp: st
}, bn = {
  "tag:yaml.org,2002:binary": Ot,
  "tag:yaml.org,2002:merge": H,
  "tag:yaml.org,2002:omap": Et,
  "tag:yaml.org,2002:pairs": vt,
  "tag:yaml.org,2002:set": It,
  "tag:yaml.org,2002:timestamp": st
};
function rt(s, e, t) {
  const n = jt.get(e);
  if (n && !s)
    return t && !n.includes(H) ? n.concat(H) : n.slice();
  let i = n;
  if (!i)
    if (Array.isArray(s))
      i = [];
    else {
      const r = Array.from(jt.keys()).filter((o) => o !== "yaml11").map((o) => JSON.stringify(o)).join(", ");
      throw new Error(`Unknown schema "${e}"; use one of ${r} or define customTags array`);
    }
  if (Array.isArray(s))
    for (const r of s)
      i = i.concat(r);
  else typeof s == "function" && (i = s(i.slice()));
  return t && (i = i.concat(H)), i.reduce((r, o) => {
    const l = typeof o == "string" ? Bt[o] : o;
    if (!l) {
      const a = JSON.stringify(o), c = Object.keys(Bt).map((p) => JSON.stringify(p)).join(", ");
      throw new Error(`Unknown custom tag ${a}; use one of ${c}`);
    }
    return r.includes(l) || r.push(l), r;
  }, []);
}
const wn = (s, e) => s.key < e.key ? -1 : s.key > e.key ? 1 : 0;
class Lt {
  constructor({ compat: e, customTags: t, merge: n, resolveKnownTags: i, schema: r, sortMapEntries: o, toStringDefaults: l }) {
    this.compat = Array.isArray(e) ? rt(e, "compat") : e ? rt(null, e) : null, this.name = typeof r == "string" && r || "core", this.knownTags = i ? bn : {}, this.tags = rt(t, this.name, n), this.toStringOptions = l ?? null, Object.defineProperty(this, W, { value: ke }), Object.defineProperty(this, V, { value: Xe }), Object.defineProperty(this, ye, { value: $e }), this.sortMapEntries = typeof o == "function" ? o : o === !0 ? wn : null;
  }
  clone() {
    const e = Object.create(Lt.prototype, Object.getOwnPropertyDescriptors(this));
    return e.tags = this.tags.slice(), e;
  }
}
function kn(s, e) {
  const t = [];
  let n = e.directives === !0;
  if (e.directives !== !1 && s.directives) {
    const a = s.directives.toString(s);
    a ? (t.push(a), n = !0) : s.directives.docStart && (n = !0);
  }
  n && t.push("---");
  const i = is(s, e), { commentString: r } = i.options;
  if (s.commentBefore) {
    t.length !== 1 && t.unshift("");
    const a = r(s.commentBefore);
    t.unshift(G(a, ""));
  }
  let o = !1, l = null;
  if (s.contents) {
    if (C(s.contents)) {
      if (s.contents.spaceBefore && n && t.push(""), s.contents.commentBefore) {
        const p = r(s.contents.commentBefore);
        t.push(G(p, ""));
      }
      i.forceBlockIndent = !!s.comment, l = s.contents.comment;
    }
    const a = l ? void 0 : () => o = !0;
    let c = me(s.contents, i, () => l = null, a);
    l && (c += te(c, "", r(l))), (c[0] === "|" || c[0] === ">") && t[t.length - 1] === "---" ? t[t.length - 1] = `--- ${c}` : t.push(c);
  } else
    t.push(me(s.contents, i));
  if (s.directives?.docEnd)
    if (s.comment) {
      const a = r(s.comment);
      a.includes(`
`) ? (t.push("..."), t.push(G(a, ""))) : t.push(`... ${a}`);
    } else
      t.push("...");
  else {
    let a = s.comment;
    a && o && (a = a.replace(/^\n+/, "")), a && ((!o || l) && t[t.length - 1] !== "" && t.push(""), t.push(G(r(a), "")));
  }
  return t.join(`
`) + `
`;
}
class nt {
  constructor(e, t, n) {
    this.commentBefore = null, this.comment = null, this.errors = [], this.warnings = [], Object.defineProperty(this, q, { value: ft });
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
    n?._directives ? (this.directives = n._directives.atDocument(), this.directives.yaml.explicit && (o = this.directives.yaml.version)) : this.directives = new B({ version: o }), this.setSchema(o, n), this.contents = e === void 0 ? null : this.createNode(e, i, n);
  }
  /**
   * Create a deep copy of this Document and its contents.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone() {
    const e = Object.create(nt.prototype, {
      [q]: { value: ft }
    });
    return e.commentBefore = this.commentBefore, e.comment = this.comment, e.errors = this.errors.slice(), e.warnings = this.warnings.slice(), e.options = Object.assign({}, this.options), this.directives && (e.directives = this.directives.clone()), e.schema = this.schema.clone(), e.contents = C(this.contents) ? this.contents.clone(e.schema) : this.contents, this.range && (e.range = this.range.slice()), e;
  }
  /** Adds a value to the document. */
  add(e) {
    re(this.contents) && this.contents.add(e);
  }
  /** Adds a value to the document. */
  addIn(e, t) {
    re(this.contents) && this.contents.addIn(e, t);
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
      const n = Zt(this);
      e.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      !t || n.has(t) ? es(t || "a", n) : t;
    }
    return new wt(e.anchor);
  }
  createNode(e, t, n) {
    let i;
    if (typeof t == "function")
      e = t.call({ "": e }, "", e), i = t;
    else if (Array.isArray(t)) {
      const g = (b) => typeof b == "number" || b instanceof String || b instanceof Number, d = t.filter(g).map(String);
      d.length > 0 && (t = t.concat(d)), i = t;
    } else n === void 0 && t && (n = t, t = void 0);
    const { aliasDuplicateObjects: r, anchorPrefix: o, flow: l, keepUndefined: a, onTagObj: c, tag: p } = n ?? {}, { onAnchor: h, setAnchors: u, sourceObjects: m } = Js(
      this,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      o || "a"
    ), y = {
      aliasDuplicateObjects: r ?? !0,
      keepUndefined: a ?? !1,
      onAnchor: h,
      onTagObj: c,
      replacer: i,
      schema: this.schema,
      sourceObjects: m
    }, f = Ie(e, p, y);
    return l && L(f) && (f.flow = !0), u(), f;
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
    return re(this.contents) ? this.contents.delete(e) : !1;
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(e) {
    return Ne(e) ? this.contents == null ? !1 : (this.contents = null, !0) : re(this.contents) ? this.contents.deleteIn(e) : !1;
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
    return Ne(e) ? !t && I(this.contents) ? this.contents.value : this.contents : L(this.contents) ? this.contents.getIn(e, t) : void 0;
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
    this.contents == null ? this.contents = Ve(this.schema, [e], t) : re(this.contents) && this.contents.set(e, t);
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, t) {
    Ne(e) ? this.contents = t : this.contents == null ? this.contents = Ve(this.schema, Array.from(e), t) : re(this.contents) && this.contents.setIn(e, t);
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
        this.directives ? this.directives.yaml.version = "1.1" : this.directives = new B({ version: "1.1" }), n = { resolveKnownTags: !1, schema: "yaml-1.1" };
        break;
      case "1.2":
      case "next":
        this.directives ? this.directives.yaml.version = e : this.directives = new B({ version: e }), n = { resolveKnownTags: !0, schema: "core" };
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
      this.schema = new Lt(Object.assign(n, t));
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
    }, a = D(this.contents, t ?? "", l);
    if (typeof r == "function")
      for (const { count: c, res: p } of l.anchors.values())
        r(p, c);
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
    return kn(this, e);
  }
}
function re(s) {
  if (L(s))
    return !0;
  throw new Error("Expected a YAML collection as document contents");
}
class Os extends Error {
  constructor(e, t, n, i) {
    super(), this.name = e, this.code = n, this.message = i, this.pos = t;
  }
}
class Oe extends Os {
  constructor(e, t, n) {
    super("YAMLParseError", e, t, n);
  }
}
class $n extends Os {
  constructor(e, t, n) {
    super("YAMLWarning", e, t, n);
  }
}
const Pt = (s, e) => (t) => {
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
function ge(s, { flow: e, indicator: t, next: n, offset: i, onError: r, parentIndent: o, startOnNewline: l }) {
  let a = !1, c = l, p = l, h = "", u = "", m = !1, y = !1, f = null, g = null, d = null, b = null, w = null, S = null, $ = null;
  for (const k of s)
    switch (y && (k.type !== "space" && k.type !== "newline" && k.type !== "comma" && r(k.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space"), y = !1), f && (c && k.type !== "comment" && k.type !== "newline" && r(f, "TAB_AS_INDENT", "Tabs are not allowed as indentation"), f = null), k.type) {
      case "space":
        !e && (t !== "doc-start" || n?.type !== "flow-collection") && k.source.includes("	") && (f = k), p = !0;
        break;
      case "comment": {
        p || r(k, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
        const E = k.source.substring(1) || " ";
        h ? h += u + E : h = E, u = "", c = !1;
        break;
      }
      case "newline":
        c ? h ? h += k.source : (!S || t !== "seq-item-ind") && (a = !0) : u += k.source, c = !0, m = !0, (g || d) && (b = k), p = !0;
        break;
      case "anchor":
        g && r(k, "MULTIPLE_ANCHORS", "A node can have at most one anchor"), k.source.endsWith(":") && r(k.offset + k.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", !0), g = k, $ ?? ($ = k.offset), c = !1, p = !1, y = !0;
        break;
      case "tag": {
        d && r(k, "MULTIPLE_TAGS", "A node can have at most one tag"), d = k, $ ?? ($ = k.offset), c = !1, p = !1, y = !0;
        break;
      }
      case t:
        (g || d) && r(k, "BAD_PROP_ORDER", `Anchors and tags must be after the ${k.source} indicator`), S && r(k, "UNEXPECTED_TOKEN", `Unexpected ${k.source} in ${e ?? "collection"}`), S = k, c = t === "seq-item-ind" || t === "explicit-key-ind", p = !1;
        break;
      case "comma":
        if (e) {
          w && r(k, "UNEXPECTED_TOKEN", `Unexpected , in ${e}`), w = k, c = !1, p = !1;
          break;
        }
      // else fallthrough
      default:
        r(k, "UNEXPECTED_TOKEN", `Unexpected ${k.type} token`), c = !1, p = !1;
    }
  const N = s[s.length - 1], O = N ? N.offset + N.source.length : i;
  return y && n && n.type !== "space" && n.type !== "newline" && n.type !== "comma" && (n.type !== "scalar" || n.source !== "") && r(n.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space"), f && (c && f.indent <= o || n?.type === "block-map" || n?.type === "block-seq") && r(f, "TAB_AS_INDENT", "Tabs are not allowed as indentation"), {
    comma: w,
    found: S,
    spaceBefore: a,
    comment: h,
    hasNewline: m,
    anchor: g,
    tag: d,
    newlineAfterProp: b,
    end: O,
    start: $ ?? O
  };
}
function Te(s) {
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
        if (Te(e.key) || Te(e.value))
          return !0;
      }
      return !1;
    default:
      return !0;
  }
}
function pt(s, e, t) {
  if (e?.type === "flow-collection") {
    const n = e.end[0];
    n.indent === s && (n.source === "]" || n.source === "}") && Te(e) && t(n, "BAD_INDENT", "Flow end indicator should be more indented than parent", !0);
  }
}
function vs(s, e, t) {
  const { uniqueKeys: n } = s.options;
  if (n === !1)
    return !1;
  const i = typeof n == "function" ? n : (r, o) => r === o || I(r) && I(o) && r.value === o.value;
  return e.some((r) => i(r.key, t));
}
const Kt = "All mapping items must start at the same column";
function Sn({ composeNode: s, composeEmptyNode: e }, t, n, i, r) {
  const o = r?.nodeClass ?? K, l = new o(t.schema);
  t.atRoot && (t.atRoot = !1);
  let a = n.offset, c = null;
  for (const p of n.items) {
    const { start: h, key: u, sep: m, value: y } = p, f = ge(h, {
      indicator: "explicit-key-ind",
      next: u ?? m?.[0],
      offset: a,
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !0
    }), g = !f.found;
    if (g) {
      if (u && (u.type === "block-seq" ? i(a, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key") : "indent" in u && u.indent !== n.indent && i(a, "BAD_INDENT", Kt)), !f.anchor && !f.tag && !m) {
        c = f.end, f.comment && (l.comment ? l.comment += `
` + f.comment : l.comment = f.comment);
        continue;
      }
      (f.newlineAfterProp || Te(u)) && i(u ?? h[h.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
    } else f.found?.indent !== n.indent && i(a, "BAD_INDENT", Kt);
    t.atKey = !0;
    const d = f.end, b = u ? s(t, u, f, i) : e(t, d, h, null, f, i);
    t.schema.compat && pt(n.indent, u, i), t.atKey = !1, vs(t, l.items, b) && i(d, "DUPLICATE_KEY", "Map keys must be unique");
    const w = ge(m ?? [], {
      indicator: "map-value-ind",
      next: y,
      offset: b.range[2],
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !u || u.type === "block-scalar"
    });
    if (a = w.end, w.found) {
      g && (y?.type === "block-map" && !w.hasNewline && i(a, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings"), t.options.strict && f.start < w.found.offset - 1024 && i(b.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key"));
      const S = y ? s(t, y, w, i) : e(t, a, m, null, w, i);
      t.schema.compat && pt(n.indent, y, i), a = S.range[2];
      const $ = new P(b, S);
      t.options.keepSourceTokens && ($.srcToken = p), l.items.push($);
    } else {
      g && i(b.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values"), w.comment && (b.comment ? b.comment += `
` + w.comment : b.comment = w.comment);
      const S = new P(b);
      t.options.keepSourceTokens && (S.srcToken = p), l.items.push(S);
    }
  }
  return c && c < a && i(c, "IMPOSSIBLE", "Map comment with trailing content"), l.range = [n.offset, a, c ?? a], l;
}
function Nn({ composeNode: s, composeEmptyNode: e }, t, n, i, r) {
  const o = r?.nodeClass ?? ne, l = new o(t.schema);
  t.atRoot && (t.atRoot = !1), t.atKey && (t.atKey = !1);
  let a = n.offset, c = null;
  for (const { start: p, value: h } of n.items) {
    const u = ge(p, {
      indicator: "seq-item-ind",
      next: h,
      offset: a,
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !0
    });
    if (!u.found)
      if (u.anchor || u.tag || h)
        h?.type === "block-seq" ? i(u.end, "BAD_INDENT", "All sequence items must start at the same column") : i(a, "MISSING_CHAR", "Sequence item without - indicator");
      else {
        c = u.end, u.comment && (l.comment = u.comment);
        continue;
      }
    const m = h ? s(t, h, u, i) : e(t, u.end, p, null, u, i);
    t.schema.compat && pt(n.indent, h, i), a = m.range[2], l.items.push(m);
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
          const p = a.substring(1) || " ";
          i ? i += o + p : i = p, o = "";
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
const ot = "Block collections are not allowed within flow collections", at = (s) => s && (s.type === "block-map" || s.type === "block-seq");
function On({ composeNode: s, composeEmptyNode: e }, t, n, i, r) {
  const o = n.start.source === "{", l = o ? "flow map" : "flow sequence", a = r?.nodeClass ?? (o ? K : ne), c = new a(t.schema);
  c.flow = !0;
  const p = t.atRoot;
  p && (t.atRoot = !1), t.atKey && (t.atKey = !1);
  let h = n.offset + n.start.source.length;
  for (let g = 0; g < n.items.length; ++g) {
    const d = n.items[g], { start: b, key: w, sep: S, value: $ } = d, N = ge(b, {
      flow: l,
      indicator: "explicit-key-ind",
      next: w ?? S?.[0],
      offset: h,
      onError: i,
      parentIndent: n.indent,
      startOnNewline: !1
    });
    if (!N.found) {
      if (!N.anchor && !N.tag && !S && !$) {
        g === 0 && N.comma ? i(N.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${l}`) : g < n.items.length - 1 && i(N.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${l}`), N.comment && (c.comment ? c.comment += `
` + N.comment : c.comment = N.comment), h = N.end;
        continue;
      }
      !o && t.options.strict && Te(w) && i(
        w,
        // checked by containsNewline()
        "MULTILINE_IMPLICIT_KEY",
        "Implicit keys of flow sequence pairs need to be on a single line"
      );
    }
    if (g === 0)
      N.comma && i(N.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${l}`);
    else if (N.comma || i(N.start, "MISSING_CHAR", `Missing , between ${l} items`), N.comment) {
      let O = "";
      e: for (const k of b)
        switch (k.type) {
          case "comma":
          case "space":
            break;
          case "comment":
            O = k.source.substring(1);
            break e;
          default:
            break e;
        }
      if (O) {
        let k = c.items[c.items.length - 1];
        M(k) && (k = k.value ?? k.key), k.comment ? k.comment += `
` + O : k.comment = O, N.comment = N.comment.substring(O.length + 1);
      }
    }
    if (!o && !S && !N.found) {
      const O = $ ? s(t, $, N, i) : e(t, N.end, S, null, N, i);
      c.items.push(O), h = O.range[2], at($) && i(O.range, "BLOCK_IN_FLOW", ot);
    } else {
      t.atKey = !0;
      const O = N.end, k = w ? s(t, w, N, i) : e(t, O, b, null, N, i);
      at(w) && i(k.range, "BLOCK_IN_FLOW", ot), t.atKey = !1;
      const E = ge(S ?? [], {
        flow: l,
        indicator: "map-value-ind",
        next: $,
        offset: k.range[2],
        onError: i,
        parentIndent: n.indent,
        startOnNewline: !1
      });
      if (E.found) {
        if (!o && !N.found && t.options.strict) {
          if (S)
            for (const A of S) {
              if (A === E.found)
                break;
              if (A.type === "newline") {
                i(A, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                break;
              }
            }
          N.start < E.found.offset - 1024 && i(E.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
        }
      } else $ && ("source" in $ && $.source?.[0] === ":" ? i($, "MISSING_CHAR", `Missing space after : in ${l}`) : i(E.start, "MISSING_CHAR", `Missing , or : between ${l} items`));
      const _ = $ ? s(t, $, E, i) : E.found ? e(t, E.end, S, null, E, i) : null;
      _ ? at($) && i(_.range, "BLOCK_IN_FLOW", ot) : E.comment && (k.comment ? k.comment += `
` + E.comment : k.comment = E.comment);
      const T = new P(k, _);
      if (t.options.keepSourceTokens && (T.srcToken = d), o) {
        const A = c;
        vs(t, A.items, k) && i(O, "DUPLICATE_KEY", "Map keys must be unique"), A.items.push(T);
      } else {
        const A = new K(t.schema);
        A.flow = !0, A.items.push(T);
        const ie = (_ ?? k).range;
        A.range = [k.range[0], ie[1], ie[2]], c.items.push(A);
      }
      h = _ ? _.range[2] : E.end;
    }
  }
  const u = o ? "}" : "]", [m, ...y] = n.end;
  let f = h;
  if (m?.source === u)
    f = m.offset + m.source.length;
  else {
    const g = l[0].toUpperCase() + l.substring(1), d = p ? `${g} must end with a ${u}` : `${g} in block collection must be sufficiently indented and end with a ${u}`;
    i(h, p ? "MISSING_CHAR" : "BAD_INDENT", d), m && m.source.length !== 1 && y.unshift(m);
  }
  if (y.length > 0) {
    const g = _e(y, f, t.options.strict, i);
    g.comment && (c.comment ? c.comment += `
` + g.comment : c.comment = g.comment), c.range = [n.offset, f, g.offset];
  } else
    c.range = [n.offset, f, f];
  return c;
}
function lt(s, e, t, n, i, r) {
  const o = t.type === "block-map" ? Sn(s, e, t, n, r) : t.type === "block-seq" ? Nn(s, e, t, n, r) : On(s, e, t, n, r), l = o.constructor;
  return i === "!" || i === l.tagName ? (o.tag = l.tagName, o) : (i && (o.tag = i), o);
}
function vn(s, e, t, n, i) {
  const r = n.tag, o = r ? e.directives.tagName(r.source, (u) => i(r, "TAG_RESOLVE_FAILED", u)) : null;
  if (t.type === "block-seq") {
    const { anchor: u, newlineAfterProp: m } = n, y = u && r ? u.offset > r.offset ? u : r : u ?? r;
    y && (!m || m.offset < y.offset) && i(y, "MISSING_CHAR", "Missing newline after block sequence props");
  }
  const l = t.type === "block-map" ? "map" : t.type === "block-seq" ? "seq" : t.start.source === "{" ? "map" : "seq";
  if (!r || !o || o === "!" || o === K.tagName && l === "map" || o === ne.tagName && l === "seq")
    return lt(s, e, t, i, o);
  let a = e.schema.tags.find((u) => u.tag === o && u.collection === l);
  if (!a) {
    const u = e.schema.knownTags[o];
    if (u?.collection === l)
      e.schema.tags.push(Object.assign({}, u, { default: !1 })), a = u;
    else
      return u ? i(r, "BAD_COLLECTION_TYPE", `${u.tag} used for ${l} collection, but expects ${u.collection ?? "scalar"}`, !0) : i(r, "TAG_RESOLVE_FAILED", `Unresolved tag: ${o}`, !0), lt(s, e, t, i, o);
  }
  const c = lt(s, e, t, i, o, a), p = a.resolve?.(c, (u) => i(r, "TAG_RESOLVE_FAILED", u), e.options) ?? c, h = C(p) ? p : new v(p);
  return h.range = c.range, h.tag = o, a?.format && (h.format = a.format), h;
}
function En(s, e, t) {
  const n = e.offset, i = An(e, s.options.strict, t);
  if (!i)
    return { value: "", type: null, comment: "", range: [n, n, n] };
  const r = i.mode === ">" ? v.BLOCK_FOLDED : v.BLOCK_LITERAL, o = e.source ? In(e.source) : [];
  let l = o.length;
  for (let f = o.length - 1; f >= 0; --f) {
    const g = o[f][1];
    if (g === "" || g === "\r")
      l = f;
    else
      break;
  }
  if (l === 0) {
    const f = i.chomp === "+" && o.length > 0 ? `
`.repeat(Math.max(1, o.length - 1)) : "";
    let g = n + i.length;
    return e.source && (g += e.source.length), { value: f, type: r, comment: i.comment, range: [n, g, g] };
  }
  let a = e.indent + i.indent, c = e.offset + i.length, p = 0;
  for (let f = 0; f < l; ++f) {
    const [g, d] = o[f];
    if (d === "" || d === "\r")
      i.indent === 0 && g.length > a && (a = g.length);
    else {
      g.length < a && t(c + g.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator"), i.indent === 0 && (a = g.length), p = f, a === 0 && !s.atRoot && t(c, "BAD_INDENT", "Block scalar values in collections must be indented");
      break;
    }
    c += g.length + d.length + 1;
  }
  for (let f = o.length - 1; f >= l; --f)
    o[f][0].length > a && (l = f + 1);
  let h = "", u = "", m = !1;
  for (let f = 0; f < p; ++f)
    h += o[f][0].slice(a) + `
`;
  for (let f = p; f < l; ++f) {
    let [g, d] = o[f];
    c += g.length + d.length + 1;
    const b = d[d.length - 1] === "\r";
    if (b && (d = d.slice(0, -1)), d && g.length < a) {
      const S = `Block scalar lines must not be less indented than their ${i.indent ? "explicit indentation indicator" : "first line"}`;
      t(c - d.length - (b ? 2 : 1), "BAD_INDENT", S), g = "";
    }
    r === v.BLOCK_LITERAL ? (h += u + g.slice(a) + d, u = `
`) : g.length > a || d[0] === "	" ? (u === " " ? u = `
` : !m && u === `
` && (u = `

`), h += u + g.slice(a) + d, u = `
`, m = !0) : d === "" ? u === `
` ? h += `
` : u = `
` : (h += u + d, u = " ", m = !1);
  }
  switch (i.chomp) {
    case "-":
      break;
    case "+":
      for (let f = l; f < o.length; ++f)
        h += `
` + o[f][0].slice(a);
      h[h.length - 1] !== `
` && (h += `
`);
      break;
    default:
      h += `
`;
  }
  const y = n + i.length + e.source.length;
  return { value: h, type: r, comment: i.comment, range: [n, y, y] };
}
function An({ offset: s, props: e }, t, n) {
  if (e[0].type !== "block-scalar-header")
    return n(e[0], "IMPOSSIBLE", "Block scalar header not found"), null;
  const { source: i } = e[0], r = i[0];
  let o = 0, l = "", a = -1;
  for (let u = 1; u < i.length; ++u) {
    const m = i[u];
    if (!l && (m === "-" || m === "+"))
      l = m;
    else {
      const y = Number(m);
      !o && y ? o = y : a === -1 && (a = s + u);
    }
  }
  a !== -1 && n(a, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${i}`);
  let c = !1, p = "", h = i.length;
  for (let u = 1; u < e.length; ++u) {
    const m = e[u];
    switch (m.type) {
      case "space":
        c = !0;
      // fallthrough
      case "newline":
        h += m.source.length;
        break;
      case "comment":
        t && !c && n(m, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters"), h += m.source.length, p = m.source.substring(1);
        break;
      case "error":
        n(m, "UNEXPECTED_TOKEN", m.message), h += m.source.length;
        break;
      /* istanbul ignore next should not happen */
      default: {
        const y = `Unexpected token in block scalar header: ${m.type}`;
        n(m, "UNEXPECTED_TOKEN", y);
        const f = m.source;
        f && typeof f == "string" && (h += f.length);
      }
    }
  }
  return { mode: r, indent: o, chomp: l, comment: p, length: h };
}
function In(s) {
  const e = s.split(/\n( *)/), t = e[0], n = t.match(/^( *)/), r = [n?.[1] ? [n[1], t.slice(n[1].length)] : ["", t]];
  for (let o = 1; o < e.length; o += 2)
    r.push([e[o], e[o + 1]]);
  return r;
}
function Tn(s, e, t) {
  const { offset: n, type: i, source: r, end: o } = s;
  let l, a;
  const c = (u, m, y) => t(n + u, m, y);
  switch (i) {
    case "scalar":
      l = v.PLAIN, a = Ln(r, c);
      break;
    case "single-quoted-scalar":
      l = v.QUOTE_SINGLE, a = Cn(r, c);
      break;
    case "double-quoted-scalar":
      l = v.QUOTE_DOUBLE, a = Mn(r, c);
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
  const p = n + r.length, h = _e(o, p, e, t);
  return {
    value: a,
    type: l,
    comment: h.comment,
    range: [n, p, h.offset]
  };
}
function Ln(s, e) {
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
  return t && e(0, "BAD_SCALAR_START", `Plain value cannot start with ${t}`), Es(s);
}
function Cn(s, e) {
  return (s[s.length - 1] !== "'" || s.length === 1) && e(s.length, "MISSING_CHAR", "Missing closing 'quote"), Es(s.slice(1, -1)).replace(/''/g, "'");
}
function Es(s) {
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
function Mn(s, e) {
  let t = "";
  for (let n = 1; n < s.length - 1; ++n) {
    const i = s[n];
    if (!(i === "\r" && s[n + 1] === `
`))
      if (i === `
`) {
        const { fold: r, offset: o } = _n(s, n);
        t += r, n = o;
      } else if (i === "\\") {
        let r = s[++n];
        const o = xn[r];
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
          t += jn(s, n + 1, l, e), n += l;
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
function _n(s, e) {
  let t = "", n = s[e + 1];
  for (; (n === " " || n === "	" || n === `
` || n === "\r") && !(n === "\r" && s[e + 2] !== `
`); )
    n === `
` && (t += `
`), e += 1, n = s[e + 1];
  return t || (t = " "), { fold: t, offset: e };
}
const xn = {
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
function jn(s, e, t, n) {
  const i = s.substr(e, t), o = i.length === t && /^[0-9a-fA-F]+$/.test(i) ? parseInt(i, 16) : NaN;
  try {
    return String.fromCodePoint(o);
  } catch {
    const l = s.substr(e - 2, t + 2);
    return n(e - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${l}`), l;
  }
}
function As(s, e, t, n) {
  const { value: i, type: r, comment: o, range: l } = e.type === "block-scalar" ? En(s, e, n) : Tn(e, s.options.strict, n), a = t ? s.directives.tagName(t.source, (h) => n(t, "TAG_RESOLVE_FAILED", h)) : null;
  let c;
  s.options.stringKeys && s.atKey ? c = s.schema[V] : a ? c = Bn(s.schema, i, a, t, n) : e.type === "scalar" ? c = Pn(s, i, e, n) : c = s.schema[V];
  let p;
  try {
    const h = c.resolve(i, (u) => n(t ?? e, "TAG_RESOLVE_FAILED", u), s.options);
    p = I(h) ? h : new v(h);
  } catch (h) {
    const u = h instanceof Error ? h.message : String(h);
    n(t ?? e, "TAG_RESOLVE_FAILED", u), p = new v(i);
  }
  return p.range = l, p.source = i, r && (p.type = r), a && (p.tag = a), c.format && (p.format = c.format), o && (p.comment = o), p;
}
function Bn(s, e, t, n, i) {
  if (t === "!")
    return s[V];
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
  return o && !o.collection ? (s.tags.push(Object.assign({}, o, { default: !1, test: void 0 })), o) : (i(n, "TAG_RESOLVE_FAILED", `Unresolved tag: ${t}`, t !== "tag:yaml.org,2002:str"), s[V]);
}
function Pn({ atKey: s, directives: e, schema: t }, n, i, r) {
  const o = t.tags.find((l) => (l.default === !0 || s && l.default === "key") && l.test?.test(n)) || t[V];
  if (t.compat) {
    const l = t.compat.find((a) => a.default && a.test?.test(n)) ?? t[V];
    if (o.tag !== l.tag) {
      const a = e.tagString(o.tag), c = e.tagString(l.tag), p = `Value may be parsed as either ${a} or ${c}`;
      r(i, "TAG_RESOLVE_FAILED", p, !0);
    }
  }
  return o;
}
function Kn(s, e, t) {
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
const Dn = { composeNode: Is, composeEmptyNode: Ct };
function Is(s, e, t, n) {
  const i = s.atKey, { spaceBefore: r, comment: o, anchor: l, tag: a } = t;
  let c, p = !0;
  switch (e.type) {
    case "alias":
      c = qn(s, e, n), (l || a) && n(e, "ALIAS_PROPS", "An alias node must not specify any properties");
      break;
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "block-scalar":
      c = As(s, e, a, n), l && (c.anchor = l.source.substring(1));
      break;
    case "block-map":
    case "block-seq":
    case "flow-collection":
      try {
        c = vn(Dn, s, e, t, n), l && (c.anchor = l.source.substring(1));
      } catch (h) {
        const u = h instanceof Error ? h.message : String(h);
        n(e, "RESOURCE_EXHAUSTION", u);
      }
      break;
    default: {
      const h = e.type === "error" ? e.message : `Unsupported token (type: ${e.type})`;
      n(e, "UNEXPECTED_TOKEN", h), p = !1;
    }
  }
  return c ?? (c = Ct(s, e.offset, void 0, null, t, n)), l && c.anchor === "" && n(l, "BAD_ALIAS", "Anchor cannot be an empty string"), i && s.options.stringKeys && (!I(c) || typeof c.value != "string" || c.tag && c.tag !== "tag:yaml.org,2002:str") && n(a ?? e, "NON_STRING_KEY", "With stringKeys, all keys must be strings"), r && (c.spaceBefore = !0), o && (e.type === "scalar" && e.source === "" ? c.comment = o : c.commentBefore = o), s.options.keepSourceTokens && p && (c.srcToken = e), c;
}
function Ct(s, e, t, n, { spaceBefore: i, comment: r, anchor: o, tag: l, end: a }, c) {
  const p = {
    type: "scalar",
    offset: Kn(e, t, n),
    indent: -1,
    source: ""
  }, h = As(s, p, l, c);
  return o && (h.anchor = o.source.substring(1), h.anchor === "" && c(o, "BAD_ALIAS", "Anchor cannot be an empty string")), i && (h.spaceBefore = !0), r && (h.comment = r, h.range[2] = a), h;
}
function qn({ options: s }, { offset: e, source: t, end: n }, i) {
  const r = new wt(t.substring(1));
  r.source === "" && i(e, "BAD_ALIAS", "Alias cannot be an empty string"), r.source.endsWith(":") && i(e + t.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", !0);
  const o = e + t.length, l = _e(n, o, s.strict, i);
  return r.range = [e, o, l.offset], l.comment && (r.comment = l.comment), r;
}
function Rn(s, e, { offset: t, start: n, value: i, end: r }, o) {
  const l = Object.assign({ _directives: e }, s), a = new nt(void 0, l), c = {
    atKey: !1,
    atRoot: !0,
    directives: a.directives,
    options: a.options,
    schema: a.schema
  }, p = ge(n, {
    indicator: "doc-start",
    next: i ?? r?.[0],
    offset: t,
    onError: o,
    parentIndent: 0,
    startOnNewline: !0
  });
  p.found && (a.directives.docStart = !0, i && (i.type === "block-map" || i.type === "block-seq") && !p.hasNewline && o(p.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker")), a.contents = i ? Is(c, i, p, o) : Ct(c, p.end, n, null, p, o);
  const h = a.contents.range[2], u = _e(r, h, !1, o);
  return u.comment && (a.comment = u.comment), a.range = [t, h, u.offset], a;
}
function Se(s) {
  if (typeof s == "number")
    return [s, s + 1];
  if (Array.isArray(s))
    return s.length === 2 ? s : [s[0], s[1]];
  const { offset: e, source: t } = s;
  return [e, e + (typeof t == "string" ? t.length : 1)];
}
function Dt(s) {
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
class Fn {
  constructor(e = {}) {
    this.doc = null, this.atDirectives = !1, this.prelude = [], this.errors = [], this.warnings = [], this.onError = (t, n, i, r) => {
      const o = Se(t);
      r ? this.warnings.push(new $n(o, n, i)) : this.errors.push(new Oe(o, n, i));
    }, this.directives = new B({ version: e.version || "1.2" }), this.options = e;
  }
  decorate(e, t) {
    const { comment: n, afterEmptyLine: i } = Dt(this.prelude);
    if (n) {
      const r = e.contents;
      if (t)
        e.comment = e.comment ? `${e.comment}
${n}` : n;
      else if (i || e.directives.docStart || !r)
        e.commentBefore = n;
      else if (L(r) && !r.flow && r.items.length > 0) {
        let o = r.items[0];
        M(o) && (o = o.key);
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
      comment: Dt(this.prelude).comment,
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
          const r = Se(e);
          r[0] += t, this.onError(r, "BAD_DIRECTIVE", n, i);
        }), this.prelude.push(e.source), this.atDirectives = !0;
        break;
      case "document": {
        const t = Rn(this.options, this.directives, e, this.onError);
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
        const t = e.source ? `${e.message}: ${JSON.stringify(e.source)}` : e.message, n = new Oe(Se(e), "UNEXPECTED_TOKEN", t);
        this.atDirectives || !this.doc ? this.errors.push(n) : this.doc.errors.push(n);
        break;
      }
      case "doc-end": {
        if (!this.doc) {
          const n = "Unexpected doc-end without preceding document";
          this.errors.push(new Oe(Se(e), "UNEXPECTED_TOKEN", n));
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
        this.errors.push(new Oe(Se(e), "UNEXPECTED_TOKEN", `Unsupported token ${e.type}`));
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
      const n = Object.assign({ _directives: this.directives }, this.options), i = new nt(void 0, n);
      this.atDirectives && this.onError(t, "MISSING_CHAR", "Missing directives-end indicator line"), i.range = [0, t, t], this.decorate(i, !1), yield i;
    }
  }
}
const Ts = "\uFEFF", Ls = "", Cs = "", mt = "";
function Un(s) {
  switch (s) {
    case Ts:
      return "byte-order-mark";
    case Ls:
      return "doc-mode";
    case Cs:
      return "flow-error-end";
    case mt:
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
function R(s) {
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
const qt = new Set("0123456789ABCDEFabcdef"), Vn = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()"), Pe = new Set(",[]{}"), Yn = new Set(` ,[]{}
\r	`), ct = (s) => !s || Yn.has(s);
class Jn {
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
      if ((n === "---" || n === "...") && R(this.buffer[e + 3]))
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
    if (e[0] === Ts && (yield* this.pushCount(1), e = e.substring(1)), e[0] === "%") {
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
    return yield Ls, yield* this.parseLineStart();
  }
  *parseLineStart() {
    const e = this.charAt(0);
    if (!e && !this.atEnd)
      return this.setNext("line-start");
    if (e === "-" || e === ".") {
      if (!this.atEnd && !this.hasChars(4))
        return this.setNext("line-start");
      const t = this.peek(3);
      if ((t === "---" || t === "...") && R(this.charAt(3)))
        return yield* this.pushCount(3), this.indentValue = 0, this.indentNext = 0, t === "---" ? "doc" : "stream";
    }
    return this.indentValue = yield* this.pushSpaces(!1), this.indentNext > this.indentValue && !R(this.charAt(1)) && (this.indentNext = this.indentValue), yield* this.parseBlockStart();
  }
  *parseBlockStart() {
    const [e, t] = this.peek(2);
    if (!t && !this.atEnd)
      return this.setNext("block-start");
    if ((e === "-" || e === "?" || e === ":") && R(t)) {
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
        return yield* this.pushUntil(ct), "doc";
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
    if ((n !== -1 && n < this.indentNext && i[0] !== "#" || n === 0 && (i.startsWith("---") || i.startsWith("...")) && R(i[3])) && !(n === this.indentNext - 1 && this.flowLevel === 1 && (i[0] === "]" || i[0] === "}")))
      return this.flowLevel = 0, yield Cs, yield* this.parseLineStart();
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
        return yield* this.pushUntil(ct), "flow";
      case '"':
      case "'":
        return this.flowKey = !0, yield* this.parseQuotedScalar();
      case ":": {
        const o = this.charAt(1);
        if (this.flowKey || R(o) || o === ",")
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
    return yield* this.pushUntil((t) => R(t) || t === "#");
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
    return yield mt, yield* this.pushToIndex(e + 1, !0), yield* this.parseLineStart();
  }
  *parsePlainScalar() {
    const e = this.flowLevel > 0;
    let t = this.pos - 1, n = this.pos - 1, i;
    for (; i = this.buffer[++n]; )
      if (i === ":") {
        const r = this.buffer[n + 1];
        if (R(r) || e && Pe.has(r))
          break;
        t = n;
      } else if (R(i)) {
        let r = this.buffer[n + 1];
        if (i === "\r" && (r === `
` ? (n += 1, i = `
`, r = this.buffer[n + 1]) : t = n), r === "#" || e && Pe.has(r))
          break;
        if (i === `
`) {
          const o = this.continueScalar(n + 1);
          if (o === -1)
            break;
          n = Math.max(n, o - 2);
        }
      } else {
        if (e && Pe.has(i))
          break;
        t = n;
      }
    return !i && !this.atEnd ? this.setNext("plain-scalar") : (yield mt, yield* this.pushToIndex(t + 1, !0), e ? "flow" : "doc");
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
          e += yield* this.pushUntil(ct), e += yield* this.pushSpaces(!0);
          continue e;
        case "-":
        // this is an error
        case "?":
        // this is an error outside flow collections
        case ":": {
          const t = this.flowLevel > 0, n = this.charAt(1);
          if (R(n) || t && Pe.has(n)) {
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
      for (; !R(t) && t !== ">"; )
        t = this.buffer[++e];
      return yield* this.pushToIndex(t === ">" ? e + 1 : e, !1);
    } else {
      let e = this.pos + 1, t = this.buffer[e];
      for (; t; )
        if (Vn.has(t))
          t = this.buffer[++e];
        else if (t === "%" && qt.has(this.buffer[e + 1]) && qt.has(this.buffer[e + 2]))
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
class Gn {
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
function Q(s, e) {
  for (let t = 0; t < s.length; ++t)
    if (s[t].type === e)
      return !0;
  return !1;
}
function Rt(s) {
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
function Ms(s) {
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
function Ke(s) {
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
function oe(s) {
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
function Je(s, e) {
  if (e.length < 1e5)
    Array.prototype.push.apply(s, e);
  else
    for (let t = 0; t < e.length; ++t)
      s.push(e[t]);
}
function Ft(s) {
  if (s.start.type === "flow-seq-start")
    for (const e of s.items)
      e.sep && !e.value && !Q(e.start, "explicit-key-ind") && !Q(e.sep, "map-value-ind") && (e.key && (e.value = e.key), delete e.key, Ms(e.value) ? e.value.end ? Je(e.value.end, e.sep) : e.value.end = e.sep : Je(e.start, e.sep), delete e.sep);
}
class Hn {
  /**
   * @param onNewLine - If defined, called separately with the start position of
   *   each new line (in `parse()`, including the start of input).
   */
  constructor(e) {
    this.atNewLine = !0, this.atScalar = !1, this.indent = 0, this.offset = 0, this.onKeyLine = !1, this.stack = [], this.source = "", this.type = "", this.lexer = new Jn(), this.onNewLine = e;
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
    const t = Un(e);
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
      switch (t.type === "block-scalar" ? t.indent = "indent" in n ? n.indent : 0 : t.type === "flow-collection" && n.type === "document" && (t.indent = 0), t.type === "flow-collection" && Ft(t), n.type) {
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
        i && !i.sep && !i.value && i.start.length > 0 && Rt(i.start) === -1 && (t.indent === 0 || i.start.every((r) => r.type !== "comment" || r.indent < t.indent)) && (n.type === "document" ? n.end = i.start : n.items.push({ start: i.start }), t.items.splice(-1, 1));
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
        Rt(e.start) !== -1 ? (yield* this.pop(), yield* this.step()) : e.start.push(this.sourceToken);
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
      const t = Ke(this.peek(2)), n = oe(t);
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
              Je(i, t.start), i.push(this.sourceToken), e.items.pop();
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
              else if (Q(t.sep, "map-value-ind"))
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: r, key: null, sep: [this.sourceToken] }]
                });
              else if (Ms(t.key) && !Q(t.sep, "newline")) {
                const o = oe(t.start), l = t.key, a = t.sep;
                a.push(this.sourceToken), delete t.key, delete t.sep, this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: o, key: l, sep: a }]
                });
              } else r.length > 0 ? t.sep = t.sep.concat(r, this.sourceToken) : t.sep.push(this.sourceToken);
            else if (Q(t.start, "newline"))
              Object.assign(t, { key: null, sep: [this.sourceToken] });
            else {
              const o = oe(t.start);
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: o, key: null, sep: [this.sourceToken] }]
              });
            }
          else
            t.sep ? t.value || i ? e.items.push({ start: r, key: null, sep: [this.sourceToken] }) : Q(t.sep, "map-value-ind") ? this.stack.push({
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
              if (!t.explicitKey && t.sep && !Q(t.sep, "newline")) {
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
              Je(i, t.start), i.push(this.sourceToken), e.items.pop();
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
        t.value || Q(t.start, "seq-item-ind") ? e.items.push({ start: [this.sourceToken] }) : t.start.push(this.sourceToken);
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
        const i = Ke(n), r = oe(i);
        Ft(e);
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
        const t = Ke(e), n = oe(t);
        return n.push(this.sourceToken), {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: n, explicitKey: !0 }]
        };
      }
      case "map-value-ind": {
        this.onKeyLine = !0;
        const t = Ke(e), n = oe(t);
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
function zn(s) {
  const e = s.prettyErrors !== !1;
  return { lineCounter: s.lineCounter || e && new Gn() || null, prettyErrors: e };
}
function Qn(s, e = {}) {
  const { lineCounter: t, prettyErrors: n } = zn(e), i = new Hn(t?.addNewLine), r = new Fn(e);
  let o = null;
  for (const l of r.compose(i.parse(s), !0, s.length))
    if (!o)
      o = l;
    else if (o.options.logLevel !== "silent") {
      o.errors.push(new Oe(l.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
      break;
    }
  return n && t && (o.errors.forEach(Pt(s, t)), o.warnings.forEach(Pt(s, t))), o;
}
const J = {
  comic: { title: "제목", cast: "등장인물", panels: "컷" },
  cast: { asset: "그림", label: "이름표" },
  panel: {
    mode: "구성",
    actors: "인물",
    dialogue: "대사",
    transfer: "전달",
    removeActors: "제외인물"
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
  options: {
    width: "너비",
    font: "글꼴",
    fontVersion: "글꼴버전",
    panelFormat: "컷비율"
  }
}, Wn = {
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
  panelFormat: { compact: "기본", phone: "모바일" }
}, Xn = {
  cast: { asset: "asset" },
  actor: { expression: "expression", gesture: "gesture", holding: "prop" },
  panel: { mode: "mode" },
  transfer: { prop: "prop" },
  options: { panelFormat: "panelFormat" }
};
function gt(s) {
  return !!s && typeof s == "object" && !Array.isArray(s);
}
function Ge(s, e, t, n) {
  if (!gt(s)) return s;
  const i = J[e], r = /* @__PURE__ */ Object.create(null);
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
    let p = l;
    const h = Xn[e], u = h && Object.hasOwn(h, a) ? h[a] : void 0;
    if (u && typeof l == "string") {
      const m = Wn[u], y = Object.keys(m).find(
        (f) => l === f || l === m[f]
      );
      y && (p = y);
    }
    if (e === "comic" && a === "cast" && gt(l)) {
      const m = /* @__PURE__ */ Object.create(null);
      for (const [y, f] of Object.entries(l))
        m[y] = Ge(f, "cast", t, `${n}.등장인물.${y}`);
      p = m;
    } else if (Array.isArray(l)) {
      const m = e === "comic" && a === "panels" ? "panel" : e === "panel" && a === "actors" ? "actor" : e === "panel" && a === "dialogue" ? "dialogue" : e === "panel" && a === "transfer" ? "transfer" : void 0;
      m && (p = l.map(
        (y, f) => Ge(
          y,
          m,
          t,
          `${n}.${i[a]}[${f + 1}]`
        )
      ));
    }
    r[c] = p;
  }
  return r;
}
const Zn = (s) => Ge(s, "comic", !1, "만화");
function ei(s) {
  const e = Ge(s, "options", !1, "표시 설정");
  if (!gt(e)) throw new Error("표시 설정: 객체가 필요합니다.");
  for (const t of Object.keys(e))
    if (!Object.hasOwn(J.options, t))
      throw new Error(`표시 설정: 알 수 없는 항목 '${t}'.`);
  return e;
}
function z(s, e) {
  if (!s || typeof s != "object" || Array.isArray(s))
    throw new Error(`${e}: 객체가 필요합니다.`);
  return s;
}
function j(s, e) {
  if (typeof s != "string" || !s.trim())
    throw new Error(`${e}: 비어 있지 않은 문자열이 필요합니다.`);
  if (s.length > 1e4)
    throw new Error(`${e}: 텍스트가 너무 깁니다.`);
  return s;
}
function ae(s, e) {
  if (!Array.isArray(s)) throw new Error(`${e}: 목록이 필요합니다.`);
  return s;
}
function X(s, e, t) {
  for (const n of Object.keys(s))
    if (!e.includes(n))
      throw new Error(`${t}: 알 수 없는 항목 '${n}'.`);
}
function le(s, e, t, n) {
  if (s !== void 0) {
    if (typeof s != "number" || !Number.isFinite(s) || s < e || s > t)
      throw new Error(`${n}: ${e}~${t} 사이 숫자가 필요합니다.`);
    return s;
  }
}
function ti(s) {
  if (s.length > 1e5)
    throw new Error("코드가 너무 깁니다. 100KB 이내로 작성하세요.");
  const e = Qn(s, { uniqueKeys: !0 });
  if (e.errors.length) throw new Error(e.errors[0].message);
  const t = z(Zn(e.toJS({ maxAliasCount: 20 })), "만화");
  X(t, Object.keys(J.comic), "만화");
  const n = /* @__PURE__ */ Object.create(null);
  for (const [o, l] of Object.entries(z(t.cast, "등장인물"))) {
    const a = z(l, `등장인물.${o}`);
    X(a, Object.keys(J.cast), `등장인물.${o}`);
    const c = j(a.asset, `등장인물.${o}.그림`);
    if (!Object.hasOwn(Gt, c))
      throw new Error(`등장인물.${o}: 없는 에셋 '${c}'.`);
    n[o] = {
      asset: c,
      label: a.label === void 0 ? o : j(a.label, `등장인물.${o}.이름표`)
    };
  }
  let i;
  const r = ae(t.panels, "컷").map((o, l) => {
    const a = `컷 ${l + 1}`, c = { ...z(o, a) };
    if (X(c, Object.keys(J.panel), a), c.mode !== void 0 && c.mode !== "before" && c.mode !== "full")
      throw new Error(`${a}: 구성은 전체 또는 이전이어야 합니다.`);
    if (c.mode === "before") {
      if (!i)
        throw new Error(`${a}: 첫 컷에서는 이전 구성을 사용할 수 없습니다.`);
      const m = i.actors.map(
        (b) => ({ ...b })
      ), y = ae(c.removeActors ?? [], `${a}.제외인물`).map(
        (b) => j(b, `${a}.제외인물`)
      );
      for (const b of y)
        if (!m.some((w) => w.id === b))
          throw new Error(`${a}: 제거할 인물 '${b}'가 이전 컷에 없습니다.`);
      const f = m.filter(
        (b) => !y.some((w) => w === b.id)
      ), g = ae(c.actors ?? [], `${a}.인물`), d = /* @__PURE__ */ new Set();
      for (const b of g) {
        const w = typeof b == "string" ? { id: b } : z(b, `${a}.인물`);
        X(w, Object.keys(J.actor), `${a}.인물`);
        const S = j(w.id, `${a}.인물.식별자`);
        if (d.has(S))
          throw new Error(`${a}: 캐릭터 식별자가 중복됩니다.`);
        d.add(S);
        const $ = f.findIndex((O) => O.id === S), N = {
          ...$ < 0 ? {} : f[$],
          ...w
        };
        for (const [O, k] of Object.entries(w))
          O !== "id" && k === null && delete N[O];
        $ < 0 ? f.push(N) : f[$] = N;
      }
      c.actors = c.actors !== void 0 && g.length === 0 ? [] : f;
    } else if (c.removeActors !== void 0)
      throw new Error(`${a}: 제외인물은 이전 구성에서만 사용할 수 있습니다.`);
    const p = ae(c.actors, `${a}.인물`).map((m) => {
      const y = typeof m == "string" ? { id: m } : z(m, `${a}.인물`);
      X(y, Object.keys(J.actor), `${a}.인물`);
      const f = j(y.id, `${a}.인물.식별자`), g = y.expression === void 0 ? "neutral" : j(y.expression, `${a}.${f}.표정`);
      if (!Object.hasOwn(n, f))
        throw new Error(`${a}: 없는 캐릭터 '${f}'.`);
      if (!Object.hasOwn(Ht, g))
        throw new Error(`${a}.${f}: 없는 표정 '${g}'.`);
      const d = y.gesture === void 0 ? void 0 : j(y.gesture, `${a}.${f}.손모양`), b = y.holding === void 0 ? void 0 : j(y.holding, `${a}.${f}.든소품`);
      if (d && !Object.hasOwn(zt, d))
        throw new Error(`${a}.${f}: 없는 손 제스처 '${d}'.`);
      if (b && !Object.hasOwn(Ue, b))
        throw new Error(`${a}.${f}: 없는 소품 '${b}'.`);
      return {
        id: f,
        expression: g,
        gesture: d,
        holding: b,
        x: le(y.x, 0, 1, `${a}.${f}.가로위치`),
        y: le(y.y, 0, 1, `${a}.${f}.세로위치`),
        scale: le(y.scale, 0.5, 1.25, `${a}.${f}.배율`) ?? 1
      };
    });
    if (p.length < 1 || p.length > 3)
      throw new Error(`${a}: 캐릭터는 1~3명이어야 합니다.`);
    if (new Set(p.map((m) => m.id)).size !== p.length)
      throw new Error(`${a}: 캐릭터 식별자가 중복됩니다.`);
    const h = ae(c.dialogue ?? [], `${a}.대사`).map(
      (m) => {
        const y = z(m, `${a}.대사`);
        X(y, Object.keys(J.dialogue), `${a}.대사`);
        const f = j(y.from, `${a}.대사.화자`), g = y.to === void 0 ? void 0 : j(y.to, `${a}.대사.상대`);
        if (!p.some((d) => d.id === f))
          throw new Error(`${a}: 화자 '${f}'가 컷에 없습니다.`);
        if (g && !p.some((d) => d.id === g))
          throw new Error(`${a}: 대화 상대 '${g}'가 컷에 없습니다.`);
        return {
          from: f,
          to: g,
          text: j(y.text, `${a}.대사.내용`),
          x: le(y.x, 0, 1, `${a}.대사.가로위치`),
          y: le(y.y, 0, 1, `${a}.대사.세로위치`),
          fontSize: le(y.fontSize, 12, 32, `${a}.대사.글자크기`) ?? 18
        };
      }
    );
    if (h.length > 20)
      throw new Error(`${a}: 대사는 20개 이내로 작성하세요.`);
    const u = ae(c.transfer ?? [], `${a}.전달`).map(
      (m) => {
        const y = z(m, `${a}.전달`);
        X(y, Object.keys(J.transfer), `${a}.전달`);
        const f = j(y.from, `${a}.전달.주는인물`), g = j(y.to, `${a}.전달.받는인물`), d = j(y.prop, `${a}.전달.소품`);
        if (!p.some((b) => b.id === f))
          throw new Error(`${a}: 전달 주체 '${f}'가 컷에 없습니다.`);
        if (!p.some((b) => b.id === g))
          throw new Error(`${a}: 전달 대상 '${g}'가 컷에 없습니다.`);
        if (f === g)
          throw new Error(`${a}: 전달 주체와 대상은 달라야 합니다.`);
        if (!Object.hasOwn(Ue, d))
          throw new Error(`${a}: 없는 소품 '${d}'.`);
        return { from: f, to: g, prop: d };
      }
    );
    if (u.length > 6)
      throw new Error(`${a}: 소품 전달은 6개 이내로 작성하세요.`);
    return i = { actors: p, dialogue: h, transfer: u }, i;
  });
  if (r.length < 1 || r.length > 30)
    throw new Error("컷은 1~30개여야 합니다.");
  return {
    title: t.title === void 0 ? "Comic Gen" : j(t.title, "제목"),
    cast: n,
    panels: r
  };
}
const De = (s, e, t) => Math.max(e, Math.min(t, s));
function Ut(s, e, t, n) {
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
function si(s, e, t, n, i = "compact") {
  const r = Math.min(t - 80, 390), o = s.dialogue.map((d) => ({
    line: d,
    lines: Ut(d.text, r - 36, d.fontSize, n),
    lineHeight: Math.ceil(d.fontSize * 1.45)
  })), l = o.reduce(
    (d, b) => d + 60 + b.lines.length * b.lineHeight,
    20
  ), a = l + 254, c = Math.max(
    ...s.actors.map((d) => d.holding || d.gesture ? 92 : 60)
  ), p = (t - 72) / s.actors.length, h = Math.min(
    1,
    (p - 12) / (2 * c * Math.max(...s.actors.map((d) => d.scale)))
  ), u = s.actors.map((d) => d.scale * h), m = s.actors.map(
    (d, b) => De(
      36 + (t - 72) * (d.x ?? (b + 0.5) / s.actors.length),
      26 + c * u[b],
      t - 26 - c * u[b]
    )
  ), y = s.actors.map(
    (d, b) => De(
      d.y === void 0 ? a - 126 : d.y * a,
      l + 70 * u[b],
      a - 126 * u[b]
    )
  );
  for (let d = 0; d < s.actors.length; d++)
    for (let b = d + 1; b < s.actors.length; b++)
      if (Math.abs(m[d] - m[b]) < c * (u[d] + u[b]) && Math.abs(y[d] - y[b]) < 120 * Math.max(u[d], u[b]))
        throw new Error(
          `캐릭터 '${s.actors[d].id}'와 '${s.actors[b].id}'가 겹칩니다. 가로위치·세로위치 또는 배율을 조정하세요.`
        );
  const f = [
    `<rect x="20" y="0" width="${t - 40}" height="${a}" rx="18" fill="white" stroke="#303341" stroke-width="2.5"/>`
  ];
  let g = 20;
  if (o.forEach(({ line: d, lines: b, lineHeight: w }) => {
    const S = m[s.actors.findIndex((Y) => Y.id === d.from)], $ = De(
      (d.x === void 0 ? S : d.x * t) - r / 2,
      40,
      t - r - 40
    ), N = 28 + b.length * w, O = d.y === void 0 ? g : De(d.y * a, 20, l - N), k = Math.max($ + 24, Math.min($ + r - 24, S)), E = $ + r, _ = O + N, T = s.actors.findIndex(
      (Y) => Y.id === d.from
    ), A = y[T] - 65 * u[T], ie = `M${$ + 14} ${O}H${E - 14}Q${E} ${O} ${E} ${O + 14}V${_ - 14}Q${E} ${_} ${E - 14} ${_}H${k + 9}L${S} ${A}L${k - 9} ${_}H${$ + 14}Q${$} ${_} ${$} ${_ - 14}V${O + 14}Q${$} ${O} ${$ + 14} ${O}Z`;
    f.push(
      `<g data-dialogue="${F(d.from)}" data-to="${F(d.to ?? "")}"><path d="${ie}" fill="#fffaf0" stroke="#303341" stroke-width="2" stroke-linejoin="round"/><text x="${$ + 18}" y="${O + 18 + d.fontSize}" font-size="${d.fontSize}">${b.map((Y, Ks) => `<tspan x="${$ + 18}" dy="${Ks ? w : 0}">${F(Y)}</tspan>`).join("")}</text></g>`
    ), g += N + 32;
  }), s.actors.forEach((d, b) => {
    const w = e[d.id], S = Gt[w.asset], $ = s.dialogue.find(
      (T) => T.from === d.id && T.to
    )?.to, N = s.actors.findIndex((T) => T.id === $), O = N < 0 ? 0 : Math.sign(m[N] - m[b]) * 4, k = Ut(
      w.label,
      (t - 72) / s.actors.length - 12,
      16,
      n
    );
    if (k.length > 2)
      throw new Error(`캐릭터 '${d.id}'의 이름표가 너무 깁니다.`);
    const E = d.gesture ? `<g data-gesture="${d.gesture}">${zt[d.gesture]}</g>` : "", _ = d.holding ? `<g data-holding="${d.holding}"><circle data-hand="holding" cx="58" cy="20" r="11" fill="white"/><g data-prop="${d.holding}" transform="translate(73 6)">${Ue[d.holding]}</g></g>` : "";
    f.push(
      `<g data-character="${F(d.id)}" transform="translate(${m[b]} ${y[b]}) scale(${u[b]})" stroke="#303341" stroke-width="2.8" stroke-linecap="round"><ellipse cy="69" rx="51" ry="7" fill="#e8edf3" stroke="none"/>${S.body}<g transform="translate(${O} ${S.faceY})" fill="#303341">${Ht[d.expression]}</g>${E}${_}<text y="94" text-anchor="middle" stroke="none" fill="#303341" font-size="16">${k.map((T, A) => `<tspan x="0" dy="${A ? 18 : 0}">${F(T)}</tspan>`).join("")}</text></g>`
    );
  }), s.transfer.forEach((d, b) => {
    const w = s.actors.findIndex(
      (Y) => Y.id === d.from
    ), S = s.actors.findIndex((Y) => Y.id === d.to), $ = m[w], N = m[S], O = Math.sign(N - $), k = $ + 62 * u[w] * O, E = N - 62 * u[S] * O, _ = 20 + (b - (s.transfer.length - 1) / 2) * 12, T = y[w] + _ * u[w], A = y[S] + _ * u[S], ie = Math.atan2(A - T, E - k) * 180 / Math.PI;
    f.push(
      `<g data-transfer="${F(d.from)}" data-to="${F(d.to)}" stroke="#586c8c" stroke-width="2.5"><path d="M${k} ${T}L${E} ${A}" fill="none"/><circle data-hand="transfer" cx="${k}" cy="${T}" r="${9 * u[w]}" fill="white"/><circle data-hand="receive" cx="${E}" cy="${A}" r="${9 * u[S]}" fill="white"/><path transform="translate(${E} ${A}) rotate(${ie})" d="M-12 -5L-4 0L-12 5" fill="none"/><g data-prop="${d.prop}" transform="translate(${(k + E) / 2} ${(T + A) / 2 - 16})">${Ue[d.prop]}</g></g>`
    );
  }), i === "phone") {
    const d = a * 2 + 92;
    return {
      markup: `<rect x="20" y="0" width="${t - 40}" height="${d}" rx="18" fill="white" stroke="#303341" stroke-width="2.5"/><g transform="translate(0 ${(d - a) / 2})">${f.slice(1).join("")}</g>`,
      height: d
    };
  }
  return { markup: f.join(""), height: a };
}
let _s = 0;
document.fonts.addEventListener("loadingdone", (s) => {
  s.fontfaces.length && _s++;
});
function Vt(s, e, t, n = "compact") {
  try {
    e = ei(e);
    const i = ti(s), r = e.width ?? 720, o = e.panelFormat ?? n;
    if (o !== "compact" && o !== "phone")
      throw new Error("컷비율은 기본 또는 모바일이어야 합니다.");
    if (!Number.isFinite(r) || r < 480 || r > 2400)
      throw new Error("너비는 480~2400 사이여야 합니다.");
    const l = e.font ?? "Malgun Gothic, Apple SD Gothic Neo, sans-serif";
    if (typeof l != "string" || l.length > 300 || /[<>]/.test(l))
      throw new Error("올바른 글꼴 이름이 필요합니다.");
    const a = [], c = [], p = (g, d, b) => `<svg xmlns="http://www.w3.org/2000/svg" width="${r}" height="${d}" viewBox="0 0 ${r} ${d}" role="img" aria-label="${F(b)}"><title>${F(b)}</title><rect width="100%" height="100%" fill="#f5f7fb"/><g font-family="${F(l)}" fill="#303341"><text x="24" y="42" font-size="24" font-weight="700">${F(b)}</text>${g}</g></svg>`;
    let h = 0, u = 0, m = 68;
    for (const [g, d] of i.panels.entries()) {
      const b = d.actors.map((O) => [
        O.id,
        i.cast[O.id]
      ]), w = JSON.stringify({
        panel: d,
        members: b,
        width: r,
        font: l,
        fontEpoch: _s,
        fontVersion: e.fontVersion,
        assetVersion: "1",
        layoutVersion: 2,
        format: o
      }), S = t.get(w), { markup: $, height: N } = S ?? si(d, i.cast, r, l, o);
      S ? h++ : (u++, t.set(w, { markup: $, height: N })), a.push(
        `<g data-panel="${g}" transform="translate(0 ${m})">${$}</g>`
      ), c.push({
        index: g,
        svg: p(
          `<g data-panel="${g}" transform="translate(0 68)">${$}</g>`,
          N + 92,
          `${i.title} · ${g + 1}/${i.panels.length}`
        ),
        width: r,
        height: N + 92,
        diagnostics: [],
        cache: {
          hits: S ? 1 : 0,
          misses: S ? 0 : 1,
          bytes: t.bytes
        }
      }), m += N + 24;
    }
    const y = m;
    return {
      svg: p(a.join(""), y, i.title),
      width: r,
      height: y,
      diagnostics: [],
      cache: { hits: h, misses: u, bytes: t.bytes },
      panels: c
    };
  } catch (i) {
    return {
      svg: "",
      width: 0,
      height: 0,
      diagnostics: [i instanceof Error ? i.message : "렌더링 실패"],
      panels: []
    };
  }
}
function xs(s = 2e6) {
  const e = new Ds(s);
  return {
    render: (t, n = {}) => Vt(t, n, e),
    renderPanels: (t, n = {}) => Vt(t, n, e, "phone"),
    clearCache: () => e.clear()
  };
}
const js = xs(), ai = js.render, li = js.renderPanels, ni = `
.comic-figure { margin: 20px 0; }
.comic-figure [role="alert"] { color: #b53b45; white-space: pre-wrap; }
.comic-card { box-sizing: border-box; display: flex; align-items: center; gap: 18px; width: 100%; max-width: 540px; padding: 16px; border: 1px solid #dbe3ee; border-radius: 16px; background: white; color: #233044; text-align: left; font: 14px/1.6 system-ui, sans-serif; cursor: pointer; }
.comic-card:hover { background: #f8faff; border-color: #4c64e8; }
.comic-card:focus-visible, .comic-viewer button:focus-visible, .comic-viewer select:focus-visible { outline: 3px solid #8096ff; outline-offset: 3px; }
.comic-card-thumbnail { display: block; flex: 0 0 112px; width: 112px; height: 96px; overflow: hidden; border-radius: 10px; background: #f5f7fb; }
.comic-card-thumbnail svg { display: block; width: 100%; height: auto; }
.comic-card-copy { display: grid; gap: 6px; min-width: 0; overflow-wrap: anywhere; }
.comic-card-copy strong { font-size: 17px; }
.comic-card-copy span { color: #526fea; font-size: 13px; }
.comic-viewer { box-sizing: border-box; width: calc(100vw - 48px); max-width: 1800px; height: calc(100dvh - 48px); max-height: none; padding: 0; border: 1px solid #dbe3ee; border-radius: 16px; background: #f5f7fb; color: #233044; font: 14px/1.6 system-ui, sans-serif; overflow: hidden; }
.comic-viewer[open] { display: flex; flex-direction: column; }
.comic-viewer::backdrop { background: #162339b3; }
.comic-viewer-toolbar { flex: none; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px 20px; background: white; border-bottom: 1px solid #dbe3ee; }
.comic-viewer-title { margin: 0 auto 0 0; min-width: 0; font-size: 18px; color: inherit; letter-spacing: 0; overflow-wrap: anywhere; }
.comic-viewer-toolbar label { display: flex; align-items: center; gap: 8px; margin: 0; color: inherit; font-size: 13px; }
.comic-viewer button, .comic-viewer select { border: 1px solid #dbe3ee; border-radius: 8px; background: white; color: #344055; padding: 8px 12px; font: inherit; cursor: pointer; }
.comic-viewer-help { flex: none; margin: 0; padding: 8px 20px; font-size: 12px; color: #69778b; }
.comic-viewer-viewport { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 16px; }
.comic-viewer-artwork { margin: 0 auto; }
.comic-viewer-artwork svg { display: block; width: 100%; max-width: none; height: auto; }
@media (max-width: 600px) {
  .comic-viewer { width: 100vw; max-width: none; height: 100dvh; margin: 0; border: 0; border-radius: 0; }
  .comic-viewer-toolbar { padding: 12px; gap: 10px; }
  .comic-viewer-title { flex-basis: calc(100% - 80px); font-size: 16px; }
  .comic-viewer-help { padding: 8px 12px; }
  .comic-viewer-viewport { padding: 8px; }
  .comic-card { gap: 12px; padding: 12px; }
  .comic-card-thumbnail { flex-basis: 88px; width: 88px; height: 80px; }
}
`, Yt = /* @__PURE__ */ new WeakMap(), ii = xs();
let x, pe, Bs, ve, ee, Jt = "";
function Ps(s) {
  Bs.textContent = s.title.textContent, pe.innerHTML = s.result.svg, ve.value = "fit", pe.style.width = "100%", pe.parentElement.scrollTo(0, 0);
}
function ri(s) {
  x || (x = document.createElement("dialog"), x.className = "comic-viewer", x.setAttribute("aria-labelledby", "comic-viewer-title"), x.setAttribute("aria-describedby", "comic-viewer-help"), x.innerHTML = '<div class="comic-viewer-toolbar"><h2 class="comic-viewer-title" id="comic-viewer-title"></h2><button type="button" autofocus>닫기</button><label>보기 크기 <select><option value="fit">화면 너비 맞춤</option><option value="1">원본 크기 (100%)</option><option value="1.5">확대 (150%)</option><option value="2">확대 (200%)</option></select></label></div><p class="comic-viewer-help" id="comic-viewer-help">확대하면 가로·세로로 스크롤해 읽을 수 있습니다. 원래 컷 배치는 유지됩니다.</p><div class="comic-viewer-viewport" tabindex="0" role="region" aria-label="만화 읽기 영역"><div class="comic-viewer-artwork"></div></div>', Bs = x.querySelector("h2"), pe = x.querySelector(".comic-viewer-artwork"), ve = x.querySelector("select"), ve.addEventListener("change", () => {
    ee && (pe.style.width = ve.value === "fit" ? "100%" : `${ee.result.width * Number(ve.value)}px`);
  }), x.querySelector("button").addEventListener("click", () => x.close()), x.addEventListener("close", () => {
    document.body.style.overflow = Jt, pe.replaceChildren(), ee?.button.focus(), ee = void 0;
  }), document.body.append(x)), ee = s, Ps(s), x.open || (Jt = document.body.style.overflow, document.body.style.overflow = "hidden", x.showModal());
}
function ci(s = document, e = {}) {
  if (!document.getElementById("comic-gen-embed-styles")) {
    const r = document.createElement("style");
    r.id = "comic-gen-embed-styles", r.textContent = ni, document.head.append(r);
  }
  const t = [], n = 'pre[language="comic-gen"], pre[data-comic], pre:has(code.language-comic), pre:has(code.language-comic-gen)', i = [...s.querySelectorAll(n)];
  s instanceof HTMLElement && s.matches(n) && i.unshift(s);
  for (const r of i) {
    const o = (r.querySelector("code") ?? r).textContent ?? "", l = ii.render(o, e);
    let a = Yt.get(r);
    if (!a) {
      const c = document.createElement("figure");
      c.className = "comic-figure";
      const p = document.createElement("button");
      p.type = "button", p.className = "comic-card", p.setAttribute("aria-haspopup", "dialog");
      const h = document.createElement("span");
      h.className = "comic-card-thumbnail", h.setAttribute("aria-hidden", "true");
      const u = document.createElement("span");
      u.className = "comic-card-copy";
      const m = document.createElement("strong"), y = document.createElement("span");
      u.append(m, y), p.append(h, u), a = { figure: c, button: p, thumbnail: h, title: m, caption: y, result: l };
      const f = a;
      p.addEventListener("click", () => ri(f)), Yt.set(r, a);
    }
    if (r.after(a.figure), a.result = l, r.hidden = !0, l.svg) {
      const c = new DOMParser().parseFromString(l.svg, "image/svg+xml");
      a.title.textContent = c.documentElement.getAttribute("aria-label"), a.caption.textContent = `${l.panels.length}컷 · 만화 읽기 ↗`, a.button.setAttribute(
        "aria-label",
        `${a.title.textContent} · 만화 읽기`
      ), a.thumbnail.innerHTML = l.panels[0].svg, a.figure.replaceChildren(a.button), ee === a && Ps(a);
    } else {
      ee === a && x?.close();
      const c = document.createElement("p");
      c.setAttribute("role", "alert"), c.textContent = l.diagnostics.join(`
`), a.figure.replaceChildren(c);
    }
    t.push(l);
  }
  return t;
}
function fi(s, e) {
  const t = URL.createObjectURL(s), n = document.createElement("a");
  n.href = t, n.download = e, n.click(), setTimeout(() => URL.revokeObjectURL(t), 1e3);
}
async function ui(s, e = 1) {
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
        (p) => p ? a(p) : c(new Error("PNG 생성에 실패했습니다.")),
        "image/png"
      )
    );
  } finally {
    URL.revokeObjectURL(i);
  }
}
export {
  oi as assetVersion,
  xs as createRenderer,
  fi as downloadBlob,
  ui as exportPng,
  ci as renderCodeBlocks,
  ai as renderComic,
  li as renderPanels,
  xs as 렌더러만들기,
  ai as 만화그리기,
  Wn as 문법값,
  J as 문법항목,
  li as 컷그리기,
  ci as 코드블록그리기
};
