// Spoken-text normalization only. Never evaluate an expression or change the DOM.
const letters = { n:'엔', N:'엔', x:'엑스', X:'엑스', y:'와이', Y:'와이', a:'에이', A:'에이', b:'비', B:'비', c:'씨', C:'씨', i:'아이', j:'제이', k:'케이', m:'엠', t:'티', r:'알', s:'에스' };
const digits = ['영','일','이','삼','사','오','육','칠','팔','구'];
export function mathNumber(value) {
  if (value.startsWith('-')) return '마이너스 ' + mathNumber(value.slice(1));
  if (value.includes('.')) { const [whole, fraction] = value.split('.'); return mathNumber(whole) + ' 점 ' + [...fraction].map(n => digits[Number(n)]).join(' '); }
  const n = Number(value);
  if (!/^\d+$/.test(value) || n > 9999) return value;
  if (!n) return '영';
  return [...String(n)].map((d, i, all) => { const place = all.length - i - 1; return d === '0' ? '' : (d === '1' && place ? '' : digits[Number(d)]) + ['', '십', '백', '천'][place]; }).join('');
}
const atom = value => letters[value] || (/^-?\d+(?:\.\d+)?$/.test(value) ? mathNumber(value) : value);
const units = { GHz:'기가헤르츠', MHz:'메가헤르츠', kHz:'킬로헤르츠', Hz:'헤르츠', TB:'테라바이트', GB:'기가바이트', MB:'메가바이트', KB:'킬로바이트', KiB:'키비바이트', MiB:'메비바이트', GiB:'기비바이트', Gbps:'기가비피에스', Mbps:'메가비피에스', Kbps:'킬로비피에스', kbps:'킬로비피에스', bps:'비피에스', ms:'밀리초', ns:'나노초', 'µs':'마이크로초', 'μs':'마이크로초', '℃':'도씨', '°C':'도씨', '%':'퍼센트' };
const unitPattern = new RegExp(`(?<![A-Za-z0-9_.])(-?\\d+(?:\\.\\d+)?)\\s*(${Object.keys(units).sort((a,b)=>b.length-a.length).join('|')})(?![A-Za-z])`, 'g');
const supers = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','ⁿ':'n','⁻':'-' };
const subs = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
const symbols = { '×':'곱하기', '÷':'나누기', '−':'빼기', '±':'플러스 마이너스', '≤':'작거나 같다', '≥':'크거나 같다', '≠':'같지 않다', '≈':'거의 같다', '≡':'동치', '∞':'무한대', '∑':'시그마', '∏':'파이 곱', '∈':'원소이다', '∉':'원소가 아니다', '∪':'합집합', '∩':'교집합', '⊂':'진부분집합', '⊆':'부분집합', '⊃':'진상위집합', '⊇':'상위집합', '∅':'공집합', '¬':'논리 부정', '∧':'논리곱', '∨':'논리합', '⊕':'배타적 논리합', '⋈':'조인', 'σ':'시그마', 'Σ':'시그마', 'π':'파이', 'θ':'세타', 'λ':'람다', 'α':'알파', 'β':'베타', 'δ':'델타', 'Δ':'델타', '→':'오른쪽 화살표', '←':'왼쪽 화살표', '↔':'양방향 화살표', '⇒':'이면', '⇔':'필요충분조건' };
export function mathSpeechText(input) {
  const standalone = { '=':'이퀄', '<':'작다', '>':'크다', '+':'더하기', '-':'빼기', '*':'별표', '/':'슬래시', '√':'루트' };
  if (Object.hasOwn(standalone, input.trim())) return standalone[input.trim()];
  let text = input
    .replace(/&(?:#x20|#32|nbsp);/gi, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/√(?=\s*표시)/g, '체크')
    .replace(/([A-Za-z0-9])[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻]+/g, match => match[0] + '^' + [...match.slice(1)].map(s => supers[s]).join(''))
    .replace(/[₀-₉]+/g, match => '_' + [...match].map(s => subs[s]).join(''))
    .replace(/(?<![A-Za-z0-9_])([nN]\s*)?log_([0-9]+)\s*([nNxX]|\d+)(?![A-Za-z0-9_])/g, (_, n, base, value) => `${n ? '엔 곱하기 ' : ''}밑이 ${atom(base)}인 로그 ${atom(value)}`)
    .replace(/(?<![A-Za-z0-9_])([nN]?)log\s*(?:\([nN]\)|[nN])(?![A-Za-z0-9_])/g, (_, n) => n ? '엔로그엔' : '로그엔')
    .replace(/(?<![A-Za-z0-9_])[nN]\s+로그엔/g, '엔로그엔')
    .replace(/(?<![A-Za-z0-9_])([A-Za-z]|\d+)\s*\^\s*(-?\d+(?:\.\d+)?|[nN])(?![A-Za-z0-9_^])/g, (_, base, power) => {
      if (/^[nN]$/.test(base) && power === '2') return '엔제곱';
      if (/^[nN]$/.test(base) && power === '3') return '엔세제곱';
      if (base === '2' && /^[nN]$/.test(power)) return '이엔제곱';
      return `${atom(base)}의 ${atom(power)}제곱`;
    })
    .replace(/(?<![A-Za-z0-9_])([A-Za-z])_([0-9]+)(?![A-Za-z0-9_])/g, (_, name, index) => `${atom(name)} 아래첨자 ${atom(index)}`)
    .replace(/√\s*([nNxX]|\d+(?:\.\d+)?)(?![A-Za-z0-9_])/g, (_, value) => `루트 ${atom(value)}`)
    .replace(/(?<![A-Za-z0-9_])([nN]|\d+)!(?!=)/g, (_, value) => `${atom(value)} 팩토리얼`)
    .replace(/(?<![A-Za-z0-9_])([OΘΩ])\(([^()\n]{1,80})\)/g, (_, kind, body) => `${{O:'빅오',Θ:'빅세타',Ω:'빅오메가'}[kind]} ${body === '1' ? '일' : body}`)
    .replace(/[½¼¾⅓⅔]/g, s => ({'½':'이분의 일','¼':'사분의 일','¾':'사분의 삼','⅓':'삼분의 일','⅔':'삼분의 이'}[s]))
    .replace(/(?<![\w./])(-?\d+)\s*\/\s*(\d+)(?![\w./])/g, (_, top, bottom) => `${mathNumber(bottom)}분의 ${mathNumber(top)}`)
    .replace(/(?<![A-Za-z0-9_])(EV|PV|AC)\s*\/\s*(EV|PV|AC)(?![A-Za-z0-9_])/g, '$1 나누기 $2')
    .replace(/(?<=[\d)])\s*\/\s*(?=\()/g, ' 나누기 ')
    .replace(/(?<![A-Za-z0-9_])(\d+(?:\.\d+)?)\s*[~～–]\s*(\d+(?:\.\d+)?)/g, '$1에서 $2까지')
    .replace(/(?<![A-Za-z0-9_.])(\d+(?:\.\d+)?)[eE]([+-]?\d+)(?![A-Za-z0-9_])/g, (_, base, power) => `${mathNumber(base)} 곱하기 십의 ${mathNumber(power.replace(/^\+/,''))}제곱`)
    .replace(/(\d+(?:\.\d+)?)\s*(MB|GB|KB)\/s\b/g, (_, value, unit) => `초당 ${mathNumber(value)} ${units[unit]}`)
    .replace(/(?<=[\w)])\s+%\s+(?=[\w(])/g, ' 나머지 ')
    .replace(unitPattern, (_, value, unit) => `${mathNumber(value)} ${units[unit]}`)
    .replace(/(?<![A-Za-z0-9_.])(\d+\.\d+)(?![A-Za-z0-9_.])/g, (_, value) => mathNumber(value))
    .replace(/<=|>=|!=|==|&&|\|\|/g, s => ` ${{'<=':'작거나 같다','>=':'크거나 같다','!=':'같지 않다','==':'같다','&&':'논리곱','||':'논리합'}[s]} `)
    .replace(/(?<=[\dA-Za-z가-힣)])\s*([+*=<>])\s*(?=[\dA-Za-z가-힣(])/g, (_, op) => ` ${{'+':'더하기','*':'곱하기','=':'이퀄','<':'작다','>':'크다'}[op]} `)
    .replace(/(?<=\d)\s*-\s*(?=\d)/g, ' 빼기 ')
    .replace(/(?<![\w.])-([0-9]+)(?![\w.])/g, (_, value) => `마이너스 ${mathNumber(value)}`)
    .replace(/[×÷−±≤≥≠≈≡∞∑∏∈∉∪∩⊂⊆⊃⊇∅¬∧∨⊕⋈σΣπθλαβδΔ→←↔⇒⇔]/g, s => ` ${symbols[s]} `)
    .replace(/(?<![A-Za-z0-9_])[nN](?![A-Za-z0-9_^])/g, '엔');
  if (/[=<>×÷−±≤≥≠≈∈∉∪∩⊂⊆⊃⊇∅∧∨⊕]|\b[OΘΩ]\(|\^|√/.test(input)) {
    text = text.replace(/(?<![A-Za-z0-9_])[A-Za-z](?![A-Za-z0-9_])/g, value => letters[value] || value);
  }
  // Retain grouping in arithmetic expressions; ordinary prose parentheses stay quiet.
  if (/[+×÷]|\)\s*\/\s*\(/.test(input)) text = text.replace(/\(([^()]*?(?:\d|더하기|빼기|분의)[^()]*)\)/g, ' 괄호 열고 $1 괄호 닫고 ');
  return text.replace(/[ \t]{2,}/g, ' ');
}
