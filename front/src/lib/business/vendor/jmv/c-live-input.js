// Cooperative stdin: the C generator yields while waiting; it is never restarted.
import { MAX_SOURCE_BYTES } from './limits.js';
export function createLiveCInput(initial = '', maxBytes = MAX_SOURCE_BYTES) {
  let buffer = initial, ended = false, waiting = false, input = initial;
  function* more() {
    if (ended) return false;
    waiting = true;
    yield;
    waiting = false;
    return true;
  }
  function* peek() {
    while (!buffer.length && !ended) yield* more();
    return buffer[0];
  }
  function* whitespace() {
    while (true) {
      const ch = yield* peek();
      if (ch === undefined || !/\s/.test(ch)) return;
      buffer = buffer.slice(1);
    }
  }
  function store(rt, pointer, value, string = false) {
    const count = string ? value.length + 1 : 1;
    for (let i = 0; i < count; i++) {
      const shifted = i ? rt.getFunc(pointer.t, 'o(+)', [rt.intTypeLiteral])(rt, pointer, rt.val(rt.intTypeLiteral, i)) : pointer;
      const cell = rt.getFunc(shifted.t, 'o(*)', [])(rt, shifted);
      const number = string ? (i < value.length ? value.charCodeAt(i) : 0) : value;
      rt.getFunc(cell.t, 'o(=)', [cell.t])(rt, cell, rt.cast(cell.t, rt.val(rt.doubleTypeLiteral, number)));
    }
  }
  function* scanf(rt, self, formatValue, ...args) {
    const format = rt.getStringFromCharArray(formatValue);
    let assigned = 0, arg = 0;
    for (let pos = 0; pos < format.length;) {
      if (/\s/.test(format[pos])) { pos++; yield* whitespace(); continue; }
      if (format[pos] !== '%' || format[pos + 1] === '%') {
        const literal = format[pos] === '%' ? (pos += 2, '%') : format[pos++];
        const ch = yield* peek();
        if (ch !== literal) return rt.val(rt.intTypeLiteral, ch === undefined && !assigned ? -1 : assigned);
        buffer = buffer.slice(1); continue;
      }
      const spec = format.slice(pos).match(/^%(\*)?(\d+)?(?:hh|ll|h|l|L)?([diuoxXfFeEgGsc])/);
      if (!spec) throw new Error('실시간 scanf에서 지원하지 않는 변환입니다.');
      pos += spec[0].length;
      const [, suppress, widthText, kind] = spec, width = widthText ? Number(widthText) : Infinity;
      if (kind !== 'c') yield* whitespace();
      let ch = yield* peek();
      if (ch === undefined) return rt.val(rt.intTypeLiteral, assigned || -1);
      let text;
      if (kind === 'c') {
        const size = Number.isFinite(width) ? width : 1;
        while (buffer.length < size && !ended) yield* more();
        if (buffer.length < size) return rt.val(rt.intTypeLiteral, assigned || -1);
        text = buffer.slice(0, size);
      } else {
        // Numeric/string tokens finish at whitespace, field width or explicit EOF.
        while (!ended && buffer.length < width && !/\s/.test(buffer)) yield* more();
        const chunk = buffer.slice(0, width);
        const pattern = kind === 's' ? /^\S+/ : /[fFeEgG]/.test(kind)
          ? /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/
          : /[xX]/.test(kind) ? /^[+-]?(?:0[xX])?[\da-fA-F]+/ : kind === 'o' ? /^[+-]?[0-7]+/
          : kind === 'i' ? /^[+-]?(?:0[xX][\da-fA-F]+|0[0-7]*|[1-9]\d*)/ : /^[+-]?\d+/;
        text = chunk.match(pattern)?.[0];
        if (!text) return rt.val(rt.intTypeLiteral, assigned);
      }
      buffer = buffer.slice(text.length);
      if (!suppress) {
        if (!args[arg]) throw new Error('scanf 대상 인자가 부족합니다.');
        if (kind === 's') store(rt, args[arg++], text, true);
        else if (kind === 'c') {
          const pointer = args[arg++];
          for (let i=0;i<text.length;i++) {
            const shifted=i?rt.getFunc(pointer.t,'o(+)',[rt.intTypeLiteral])(rt,pointer,rt.val(rt.intTypeLiteral,i)):pointer;
            store(rt,shifted,text.charCodeAt(i));
          }
        } else {
          const value = /[fFeEgG]/.test(kind) ? Number(text) : parseInt(text,
            /[xX]/.test(kind) ? 16 : kind === 'o' ? 8 : kind === 'i' ? (/^[+-]?0x/i.test(text)?16:/^[+-]?0[0-7]/.test(text)?8:10) : 10);
          store(rt, args[arg++], value);
        }
        assigned++;
      }
    }
    return rt.val(rt.intTypeLiteral, assigned);
  }
  function* getchar(rt) {
    const ch = yield* peek();
    if (ch !== undefined) buffer = buffer.slice(1);
    return rt.val(rt.intTypeLiteral, ch === undefined ? -1 : ch.charCodeAt(0));
  }
  return {
    get waiting() { return waiting; },
    get input() { return input; },
    provide(text) {
      if (text === null) ended=true;
      else {
        if(typeof text!=='string')throw new Error('입력은 문자열이어야 합니다.');
        if(new TextEncoder().encode(input+text).length>maxBytes)throw new Error('코드와 입력은 합쳐서 2MB까지 지원합니다.');
        buffer+=text;input+=text;
      }
    },
    install(rt) {
      const register=rt.regFunc.bind(rt);
      rt.regFunc=(fn,scope,name,...args)=>register(scope==='global'&&name==='scanf'?scanf:scope==='global'&&name==='getchar'?getchar:fn,scope,name,...args);
    },
  };
}
