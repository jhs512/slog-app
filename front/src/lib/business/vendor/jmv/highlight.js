// Minimal Java syntax highlighter: returns HTML with <span class="hl-*"> tokens. No dependencies.
// Handles block comments spanning lines when called on the whole source (highlightJava) or
// line by line with carried state (highlightLines).

const KEYWORDS = new Set(('abstract assert break case catch class const continue default do else enum extends final ' +
  'finally for goto if implements import instanceof interface native new package private protected public return ' +
  'static strictfp super switch synchronized this throw throws transient try volatile while var record sealed permits yield').split(' '));
const TYPES = new Set('boolean byte char double float int long short void'.split(' '));
const PY_KEYWORDS = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
const C_KEYWORDS = new Set('auto break case const continue default do else enum extern for goto if register return signed sizeof static struct switch typedef union unsigned volatile while'.split(' '));
const JS_KEYWORDS=new Set('async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield'.split(' '));
const CPP_KEYWORDS=new Set([...C_KEYWORDS,'class','public','private','protected','new','delete','namespace','using','virtual','override','template','typename','this','constexpr','noexcept','nullptr','nullptr_t','try','catch','throw']);
const LITERALS = new Set(['true', 'false', 'null']);

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const span = (cls, text) => text.split('\n').map(line => `<span class="hl-${cls}">${esc(line)}</span>`).join('\n');

const TOKEN = /(\/\*[\s\S]*?\*\/|\/\*[\s\S]*$)|(\/\/.*$)|("(?:[^"\\\n]|\\.)*"?)|('(?:[^'\\\n]|\\.)*'?)|(@[A-Za-z_]\w*)|(\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[lLfFdD]?\b|\b0[xX][\da-fA-F_]+[lL]?\b)|([A-Za-z_$][\w$]*)/gm;

/** Highlights one line. `state.inComment` carries an open block comment across lines. */
export function highlightLine(line, state = { inComment: false }, language = 'java') {
  let out = '';
  let rest = line;
  if (state.inComment) {
    const end = rest.indexOf('*/');
    if (end < 0) return span('comment', rest);
    out += span('comment', rest.slice(0, end + 2));
    rest = rest.slice(end + 2);
    state.inComment = false;
  }
  let last = 0;
  TOKEN.lastIndex = 0;
  let m;
  while ((m = TOKEN.exec(rest))) {
    out += esc(rest.slice(last, m.index));
    const [text, block, lineComment, str, chr, annotation, num, word] = m;
    if (block) { out += span('comment', text); if (!text.endsWith('*/')) state.inComment = true; }
    else if (lineComment) out += span('comment', text);
    else if (str) out += span('string', text);
    else if (chr) out += span('char', text);
    else if (annotation) out += span('annotation', text);
    else if (num) out += span('number', text);
    else if (word) {
      if ((language === 'c' ? C_KEYWORDS : language==='cpp'?CPP_KEYWORDS:language==='js'?JS_KEYWORDS:KEYWORDS).has(word)) out += span('keyword', word);
      else if (TYPES.has(word)) out += span('type', word);
      else if (LITERALS.has(word)) out += span('literal', word);
      else if (/^[A-Z]/.test(word)) out += span('class', word);
      else out += esc(word);
    } else out += esc(text);
    last = m.index + text.length;
  }
  out += esc(rest.slice(last));
  return out;
}

/** Highlights every line of a source string; returns an array of HTML strings, one per line. */
export function highlightLines(source, language = 'java') {
  if (language === 'python') {
    // Tokenize the entire document so triple quoted strings can span lines.
    const tokens = /#[^\n]*|"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b/g;
    let out = '', last = 0;
    for (const match of source.matchAll(tokens)) {
      const text = match[0]; out += esc(source.slice(last, match.index));
      out += text.startsWith('#') ? span('comment', text) : /^["']/.test(text) ? span('string', text)
        : /^\d/.test(text) ? span('number', text) : PY_KEYWORDS.has(text) ? span('keyword', text)
        : ['True','False','None'].includes(text) ? span('literal', text) : esc(text);
      last = match.index + text.length;
    }
    return (out + esc(source.slice(last))).split('\n');
  }

  const state = { inComment: false };
  return source.replace(/\r\n?/g, '\n').split('\n').map((line) => highlightLine(line, state, language));
}

export function highlightJava(source) {
  return highlightLines(source).join('\n');
}
