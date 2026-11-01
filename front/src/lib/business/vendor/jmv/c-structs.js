// Parse C struct declarations, retaining every original newline for trace locations.
// Execution remains in JSCPP; only unsupported struct syntax is lowered to runtime types.
const scan = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[A-Za-z_]\w*|\d+|./gs;
const identifier = text => /^[A-Za-z_]\w*$/.test(text);
const primitive = new Set('void char short int long signed unsigned float double bool'.split(' '));
const qualifier = new Set(['const', 'volatile']);
export function prepareC(source) {
  const tokens = [...source.matchAll(scan)].filter(m => !/^\s|^\/\/|^\/\*/.test(m[0]))
    .map(m => ({ text: m[0], start: m.index, end: m.index + m[0].length }));
  const definitions = new Map(), aliases = new Map(), replacements = [], removed = new Set();
  let anonymous = 0;
  const tagName = tag => `__jmv_struct_${tag}`;
  const lineAt = token => source.slice(0, token?.start || 0).split('\n').length;
  const fail = (token, message) => { throw new Error(`line ${lineAt(token)}: ${message}`); };
  function remove(start, end, text = '') {
    replacements.push({ start: tokens[start].start, end: tokens[end].end, text: text + source.slice(tokens[start].start, tokens[end].end).replace(/[^\n]/g, ' ') });
    for (let i = start; i <= end; i++) removed.add(i);
  }
  // Register tags first, including forward declarations and mutually recursive pointers.
  for (let i = 0; i < tokens.length; i++) if (tokens[i].text === 'struct' && identifier(tokens[i + 1]?.text || '')) {
    const tag = tokens[i + 1].text;
    if (!definitions.has(tag)) definitions.set(tag, { tag, name: tagName(tag), fields: null });
  }
  for (let i = 0; i < tokens.length; i++) {
    if (removed.has(i)) continue;
    const isTypedef = tokens[i].text === 'typedef';
    const begin = i, at = isTypedef ? i + 1 : i;
    if (tokens[at]?.text !== 'struct') continue;
    let j = at + 1;
    const tag = identifier(tokens[j]?.text || '') ? tokens[j++].text : `anonymous_${++anonymous}`;
    if (tokens[j]?.text === '{') {
      const scopeDepth=tokens.slice(0,at).reduce((n,t)=>n+(t.text==='{'?1:t.text==='}'?-1:0),0);
      if(scopeDepth!==0)fail(tokens[at],'struct 타입 정의는 파일 범위에 작성하세요.');
      let depth = 1, close = j + 1;
      for (; close < tokens.length && depth; close++) {
        if (tokens[close].text === '{') depth++;
        if (tokens[close].text === '}') depth--;
      }
      if (depth) fail(tokens[j], 'struct의 닫는 중괄호가 없습니다.');
      close--;
      let semi = close + 1;
      while (semi < tokens.length && tokens[semi].text !== ';') semi++;
      if (semi === tokens.length) fail(tokens[close], 'struct 선언 끝에 세미콜론이 필요합니다.');
      const definition = definitions.get(tag) || { tag, name: tagName(tag), fields: null };
      if (definition.fields) fail(tokens[at], `struct ${tag}이 중복 정의됐습니다.`);
      definition.fields = tokens.slice(j + 1, close);
      definition.line = lineAt(tokens[at]);
      definitions.set(tag, definition);
      const tail = tokens.slice(close + 1, semi);
      if (isTypedef) {
        if (tail.length !== 1 || !identifier(tail[0].text)) fail(tokens[close], 'typedef struct에는 하나의 타입 이름이 필요합니다.');
        aliases.set(tail[0].text, tag);
        remove(begin, semi);
      } else if (!tail.length) remove(begin, semi);
      else remove(begin, close, definition.name + ' ');
      i = semi;
    } else if (isTypedef) {
      if (!identifier(tokens[j]?.text || '') || tokens[j + 1]?.text !== ';') fail(tokens[at], '지원하지 않는 struct typedef 선언입니다.');
      aliases.set(tokens[j].text, tag);
      remove(begin, j + 1); i = j + 1;
    } else if (tokens[j]?.text === ';') { remove(begin, j); i = j; }
  }
  for (let i = 0; i < tokens.length; i++) if (!removed.has(i) && tokens[i].text === 'struct') {
    const tag = tokens[i + 1]?.text;
    if (!definitions.has(tag)) fail(tokens[i], '이름 있는 struct 타입이 필요합니다.');
    replacements.push({start:tokens[i].start,end:tokens[i + 1].end,text:tagName(tag)}); i++;
  }
  function fields(definition) {
    if (!definition.fields) return null;
    const result = [], body = definition.fields;
    let i = 0;
    while (i < body.length) {
      let base = [];
      while (qualifier.has(body[i]?.text)) i++;
      if (body[i]?.text === 'struct') { base = [tagName(body[i + 1]?.text)]; i += 2; }
      else if (primitive.has(body[i]?.text)) {
        while (primitive.has(body[i]?.text) || qualifier.has(body[i]?.text)) {
          if (!qualifier.has(body[i].text)) base.push(body[i].text); i++;
        }
      } else if (identifier(body[i]?.text || '')) base = [body[i++].text];
      else fail(body[i], '지원하지 않는 struct 필드 선언입니다.');
      while (i < body.length) {
        let pointers = 0;
        while (body[i]?.text === '*' || qualifier.has(body[i]?.text)) { if (body[i].text === '*') pointers++; i++; }
        const token = body[i++], name = token?.text, dimensions = [];
        if (!identifier(name || '')) fail(token, '필드 이름이 필요합니다. 함수 포인터·비트 필드는 아직 지원하지 않습니다.');
        while (body[i]?.text === '[') {
          const size = Number(body[i + 1]?.text);
          if (!Number.isInteger(size) || size < 1 || size > 1000 || body[i + 2]?.text !== ']') fail(body[i], 'struct 배열 필드는 1~1000의 고정 길이만 지원합니다.');
          dimensions.push(size); i += 3;
        }
        if (result.some(f => f.name === name)) fail(token, `필드 ${name}이 중복됐습니다.`);
        result.push({name,base,pointers,dimensions});
        if (result.length > 100) fail(token, 'struct 필드는 최대 100개입니다.');
        const end = body[i++];
        if (end?.text === ';') break;
        if (end?.text !== ',') fail(end || token, '필드 선언에는 세미콜론이 필요합니다. 비트 필드·초기화 선언은 아직 지원하지 않습니다.');
      }
    }
    return result;
  }
  for (const definition of definitions.values()) definition.fields = fields(definition);
  let code = source;
  for (const replacement of replacements.sort((a,b) => b.start - a.start)) code = code.slice(0,replacement.start) + replacement.text + code.slice(replacement.end);
  // A private include installs types before the normal declaration interpreter runs.
  return { code: '#include <__jmv_memory>\n' + code, definitions: [...definitions.values()], aliases: [...aliases], lineOffset: 1 };
}
