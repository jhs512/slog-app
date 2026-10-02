export const excluded = 'nav,button,input,select,textarea,svg,script,style,pre,table,figure,img,.comic-gen,.diagram-container,[role="button"],[data-speech-controls],[data-tts-exclude],.speech-notice,.sr-only,.selection-tag';
export function visible(element) {
  if (!element.isConnected || element.closest('[hidden],[aria-hidden="true"]')) return false;
  for (let details = element.closest('details'); details; details = details.parentElement?.closest('details')) {
    if (!details.open && !details.querySelector(':scope > summary')?.contains(element)) return false;
  }
  for (let node = element; node instanceof Element; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || style.opacity === '0') return false;
  }
  return element.getClientRects().length > 0;
}

// Each normalized UTF-16 character retains its original node/offset. Skipped
// controls never become part of a highlighted Range; inline link labels do.
export function mapSpeechText(element) {
  const raw = [], allowed = new Map();
  if (!visible(element)) return { text: '', points: [] };
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node; (node = walker.nextNode());) {
    const parent = node.parentElement;
    if (!allowed.has(parent)) {
      let blocked = false;
      for (let ancestor = parent; ancestor && ancestor !== element; ancestor = ancestor.parentElement) {
        if (ancestor.matches(excluded + ',label,form,fieldset,legend')) { blocked = true; break; }
      }
      allowed.set(parent, !blocked && visible(parent));
    }
    if (!allowed.get(parent)) continue;
    for (let offset = 0; offset < node.data.length; offset++) raw.push({ node, offset, char: node.data[offset] });
  }
  const rawText = raw.map(p => p.char).join('');
  const skip = new Set();
  for (const match of rawText.matchAll(/https?:\/\/\S+/g)) for (let i = match.index; i < match.index + match[0].length; i++) skip.add(i);
  const points = [];
  for (let i = 0; i < raw.length; i++) {
    if (skip.has(i)) continue;
    const point = raw[i], char = /\s/.test(point.char) ? ' ' : point.char;
    if (char === ' ' && (!points.length || points.at(-1).char === ' ')) continue;
    points.push({ ...point, char });
  }
  while (points.length && /[ ·]/.test(points.at(-1).char)) points.pop();
  return { text: points.map(p => p.char).join(''), points, nodes: new Map(points.map(p => [p.node, p.node.data])) };
}
export const readableText = element => mapSpeechText(element).text;
// Join visible text blocks in document order without merging adjacent sentences.
export function mapSpeechDocument(root) {
  const result = { text: '', points: [], nodes: new Map() };
  for (const element of root.querySelectorAll('.tts-readable')) {
    if (element.closest(excluded) || element.parentElement?.closest('.tts-readable')) continue;
    const mapping = mapSpeechText(element);
    if (!mapping.text) continue;
    if (result.text) { result.text += '\n'; result.points.push(null); }
    result.text += mapping.text; result.points.push(...mapping.points);
    for (const [node, text] of mapping.nodes) result.nodes.set(node, text);
  }
  return result;
}
// Build utterance text separately so display text and highlight offsets stay exact.
export function speechChunkText(mapping, start, end) {
  let result = '';
  for (let i = start; i < end;) {
    const parent = mapping.points[i]?.node?.parentElement;
    const semantic = parent?.closest('[data-tts-text]') || parent?.closest('sup,sub,code');
    if (!semantic) { result += mapping.text[i++]; continue; }
    let stop = i + 1;
    while (stop < end && semantic.contains(mapping.points[stop]?.node)) stop++;
    const value = mapping.text.slice(i, stop);
    const whole = (i === 0 || !semantic.contains(mapping.points[i - 1]?.node)) && (stop === mapping.points.length || !semantic.contains(mapping.points[stop]?.node));
    if (!whole) { result += value; i = stop; continue; }
    const before = mapping.text.slice(0, i);
    if (semantic.hasAttribute('data-tts-text')) result += semantic.dataset.ttsText;
    else if (semantic.tagName === 'CODE') result += '`' + value + '`';
    else if (semantic.tagName === 'SUP' && !semantic.querySelector('a') && /(?<![A-Za-z0-9_])(?:[A-Za-z]|\d+)$/.test(before) && /^-?\d+(?:\.\d+)?$|^[nN]$/.test(value)) result += '^' + value;
    else if (semantic.tagName === 'SUB' && /log$/.test(before) && /^\d+$/.test(value)) result += [...value].map(digit => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]).join('');
    else if (semantic.tagName === 'SUB' && /log$/.test(before) && /^[nN]$/.test(value)) result += value;
    else if (semantic.tagName === 'SUB' && /(?<![A-Za-z0-9_])[A-Za-z]$/.test(before) && /^\d+$/.test(value)) result += ' 아래첨자 ' + value;
    else if (semantic.tagName === 'SUP' && /^\d+$/.test(value)) result += ' 각주 ' + value + ' ';
    else result += value;
    i = stop;
  }
  return result;
}
export function speechRanges(mapping, start, end) {
  const ranges = []; let range, previous;
  for (const point of mapping.points.slice(start, end)) {
    if (!point) { range = undefined; previous = undefined; continue; }
    if (!range || point.node !== previous.node || point.offset !== previous.offset + 1) {
      range = document.createRange(); range.setStart(point.node, point.offset); ranges.push(range);
    }
    range.setEnd(point.node, point.offset + 1); previous = point;
  }
  return ranges;
}
