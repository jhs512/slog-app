// Compiles and runs Java inside CheerpJ; returns the trace document produced by jmv.Visualizer.
// The static server only serves files: there is no compile/execute endpoint.
//
// The Java side stays resident: one cheerpjRunMain('jmv.Visualizer', '--serve') call warms up ECJ,
// then blocks in the async native nextJob() until the page submits a job. Keeping the compiler
// loaded avoids repeating startup between runs; compile/JIT time still varies by browser.

import { VENDOR } from './runtime-config.js';
import { PRELOAD_RESOURCES } from './preload-profile.js';
import { prepareVendorCache } from './vendor-cache.js';
// A JAR works on static hosts without directory listings and reduces class probes.
const CLASSPATH = [
  `${VENDOR}/tracer.jar`,
  `${VENDOR}/ecj-3.33.0.jar`,
  `${VENDOR}/asm/asm-9.7.1.jar`,
  `${VENDOR}/asm/asm-tree-9.7.1.jar`,
].join(':');

let loaderPromise = null;
async function loadCheerpJ() {
  if (typeof globalThis.cheerpjInit === 'function') return;
  if (!loaderPromise) loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cjrtnc.leaningtech.com/4.3/loader.js';
    script.onload = resolve;
    script.onerror = () => { script.remove(); loaderPromise = null; reject(new Error('Java 런타임을 다운로드하지 못했습니다. 다시 실행해 주세요.')); };
    document.head.append(script);
  });
  await loaderPromise;
}
let initPromise = null;
let executionQueue = Promise.resolve();
let loopAlive = false;
let readyPromise = null;
let readyResolve = null;
let waitingJob = null;   // resolver of the Java side's pending nextJob()
let queuedJob = null;    // job submitted before Java asked for one
let resultResolve = null;
let resultReject = null;

function loopDied(reason) {
  loopAlive = false;
  waitingJob = null;
  queuedJob = null;
  const reject = resultReject;
  resultResolve = resultReject = null;
  reject?.(new Error(reason));
  readyResolve?.(-1);
}

function startLoop(onStatus) {
  loopAlive = true;
  readyPromise = new Promise((resolve) => { readyResolve = resolve; });
  onStatus?.('컴파일러 준비 중… (첫 접속은 다운로드로 몇 분 걸릴 수 있습니다)');
  cheerpjRunMain('jmv.Visualizer', CLASSPATH, '--serve', `${VENDOR}/java17-api.jar`)
    .then((code) => loopDied(`실행기가 종료되었습니다 (코드 ${code})`))
    .catch((e) => loopDied(`실행기 오류: ${e}`));
}

/** Boots CheerpJ and the resident compiler. Resolves with the warm-up time in ns (-1 on failure). */
export async function ensureRuntime(onStatus) {
  if (typeof globalThis.cheerpjInit !== 'function') await loadCheerpJ();
  if (!initPromise) {
    onStatus?.('Java 17 런타임 내려받는 중…');
    initPromise = Promise.all([prepareVendorCache(), cheerpjInit({
      version: 17,
      status: 'none',
      preloadResources: PRELOAD_RESOURCES,
      natives: {
        async Java_jmv_Visualizer_emit(lib, json) {
          const resolve = resultResolve;
          resultResolve = resultReject = null;
          resolve?.(String(json));
        },
        async Java_jmv_Visualizer_ready(lib, warmupNs) {
          readyResolve?.(Number(warmupNs));
          readyResolve = null;
        },
        async Java_jmv_Visualizer_nextJob(lib) {
          if (queuedJob !== null) { const job = queuedJob; queuedJob = null; return job; }
          return new Promise((resolve) => { waitingJob = resolve; });
        },
      },
    })]).catch((error) => { initPromise = null; throw error; });
  }
  await initPromise;
  if (!loopAlive) startLoop(onStatus);
  return readyPromise;
}

export function runJava(options, onStatus) {
  // Background initialization and overlapping callers share one init; Java jobs
  // must also serialize because their source files and native result slot are shared.
  const job = executionQueue.then(() => executeJava(options, onStatus));
  executionQueue = job.catch(() => {});
  return job;
}

async function executeJava({ source, stdin = '', stepBudget = 1000, bench = false, objects = false }, onStatus) {
  await ensureRuntime(onStatus);
  if (!loopAlive) {
    await ensureRuntime(onStatus); // one restart attempt after a crash
    if (!loopAlive) throw new Error('실행기를 시작하지 못했습니다. 브라우저 콘솔을 확인하세요.');
  }
  cheerpOSAddStringFile('/str/Main.java', source);
  cheerpOSAddStringFile('/str/stdin.txt', stdin);
  onStatus?.('컴파일 → 계측 → 실행 중…');
  const result = new Promise((resolve, reject) => { resultResolve = resolve; resultReject = reject; });
  const job = `${stepBudget}|${bench ? 'warm' : 'cold'}|${objects ? 'objects' : ''}`;
  if (waitingJob) { const wake = waitingJob; waitingJob = null; wake(job); } else queuedJob = job;
  return JSON.parse(await result);
}
