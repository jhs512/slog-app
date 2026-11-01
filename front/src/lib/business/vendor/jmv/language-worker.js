import { traceC, traceCInteractive } from './c-tracer.js';
let pythonReady;
let inputResolve;
async function python() {
  if (!pythonReady) pythonReady = (async () => {
    const { loadPyodide } = await import('/web/vendor/pyodide-314.0.7/pyodide.mjs');
    const runtime = await loadPyodide({ indexURL: '/web/vendor/pyodide-314.0.7/' });
    const response = await fetch(new URL('./python-tracer.py', import.meta.url));
    if (!response.ok) throw new Error('Python 추적기를 불러오지 못했습니다.');
    runtime.runPython(await response.text());
    return runtime;
  })();
  return pythonReady;
}
self.onmessage = async ({ data }) => {
  if(data.type === 'input') { const resolve=inputResolve;inputResolve=null;resolve?.(data.text);return; }
  const {language,source,stdin,interactive}=data;
  try {
    if (language === 'c') {
      const { default: engine } = await import('./c-engine.js');
      self.postMessage({ type: 'ready' });
      const doc=interactive ? await traceCInteractive(engine,{source,stdin},state=>new Promise(resolve=>{
        inputResolve=resolve;self.postMessage({type:'input-request',...state});
      })) : traceC(engine,{source,stdin});
      self.postMessage({ type: 'result', doc });
    } else if (language === 'python') {
      const runtime = await python();
      self.postMessage({ type: 'ready' });
      const trace = runtime.globals.get('trace_python');
      try { self.postMessage({ type: 'result', doc: JSON.parse(trace(source, stdin)) }); }
      finally { trace.destroy(); }
    } else if(language==='js') {
      const {traceJS}=await import('./js-tracer.js');
      self.postMessage({type:'ready'});
      self.postMessage({type:'result',doc:traceJS({source,stdin})});
    } else if(language==='cpp') {
      const {prepareCPP,traceCPP}=await import('./cpp-tracer.js');
      const runtime=await prepareCPP();
      self.postMessage({type:'ready'});
      self.postMessage({type:'result',doc:await traceCPP({source,stdin},runtime)});
    } else throw new Error('지원하지 않는 언어입니다.');
  } catch (error) { self.postMessage({ type: 'error', message: String(error.message || error) }); }
};
