// One isolated worker per selected runtime; reuse the loaded Python runtime on reruns.
import { MAX_SOURCE_BYTES, MAX_C_TIME_MS } from './limits.js';
const workers = new Map();
let active = null;
export function cancelLanguageRun() {
  if (!active) return;
  active.cancel();
}
export function runLanguage({ language, source, stdin = '', interactive = false }, onStatus = () => {}, onInput = () => {}) {
  if (!['c', 'python','cpp','js'].includes(language)) throw new Error('지원하지 않는 언어입니다.');
  if (active) throw new Error('이미 실행 중입니다.');
  if (new TextEncoder().encode(source + stdin).length > MAX_SOURCE_BYTES) throw new Error('코드와 입력은 합쳐서 2MB까지 지원합니다.');
  let worker = workers.get(language);
  if (!worker) {
    worker = new Worker(new URL('./language-worker.js', import.meta.url), { type: 'module' });
    workers.set(language, worker);
  }
  onStatus(`${{c:'C 인터프리터',python:'Python',cpp:'C++ Clang/WASM',js:'JavaScript'}[language]} 준비 중… · 처음 실행할 때 런타임을 내려받습니다.`);
  return new Promise((resolve, reject) => {
    let timer;
    function clean(terminate = false) {
      clearTimeout(timer); worker.onmessage = worker.onerror = null; active = null;
      if (terminate) { worker.terminate(); workers.delete(language); }
    }
    function timeout(ms) {
      clearTimeout(timer);
      timer = setTimeout(() => { clean(true); reject(new Error('실행 시간이 초과되어 중단했습니다. 다시 실행할 수 있습니다.')); }, ms);
    }
    active = { cancel() { clean(true); reject(new Error('실행을 중지했습니다.')); } };
    worker.onerror = e => { clean(true); reject(new Error(e.message || '실행 작업을 불러오지 못했습니다.')); };
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') { onStatus('실행하며 상태를 기록하는 중…'); timeout(language === 'c' ? MAX_C_TIME_MS + 10000 : language==='cpp'?60000:12000); }
      else if (data.type === 'result') { clean(language==='cpp'); resolve(data.doc); }
      else if (data.type === 'input-request') {
        clearTimeout(timer);
        onStatus('입력을 기다리는 중…');
        onInput(data, text => {
          if (!active) return;
          onStatus('실행하며 상태를 기록하는 중…');
          timeout(MAX_C_TIME_MS + 10000);
          worker.postMessage({ type:'input', text });
        });
      }
      else if (data.type === 'error') { clean(true); reject(new Error(data.message)); }
    };
    timeout(120000);
    worker.postMessage({ language, source, stdin, interactive });
  });
}
