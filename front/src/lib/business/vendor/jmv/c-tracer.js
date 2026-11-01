import { prepareC } from './c-structs.js';
import { createCMemory } from './c-memory.js';
import { MAX_SOURCE_BYTES, MAX_TRACE_STEPS, MAX_C_OUTPUT, MAX_C_TICKS, MAX_C_TIME_MS } from './limits.js';
import { createLiveCInput } from './c-live-input.js';
// Adapts the real JSCPP debugger to the common snapshot format.
export function* traceCSession(engine, { source, stdin = '', interactive = false }) {
  let started = performance.now();
  const input = interactive ? createLiveCInput(stdin,MAX_SOURCE_BYTES-new TextEncoder().encode(source).length) : null;
  const sourceLines = source.split('\n').length;
  const doc = { language: 'c', code: source, stdin, status: 'ok', options: { objects: false }, problems: [], trace: [] };
  let prepared, memory;
  let stdout = '', debuggerInstance, nextId = 1, nextFrame = 1, lastKey = '', ticks = 0;
  const ids = new WeakMap(), frameIds = new WeakMap(), frameLines = new WeakMap();
  let recordedSteps = 0, traceStride = 1, traceOverflow = false;
  function record(step) {
    recordedSteps++;
    if(step.event === 'step_line' && !step.c_memory_event && recordedSteps % traceStride !== 0)return;
    doc.trace.push(step);
    if(doc.trace.length >= MAX_TRACE_STEPS) {
      // Keep calls, returns and allocation events; thin only repetitive line states.
      doc.trace = doc.trace.filter((s,i)=>i===0 || s.event!=='step_line' || s.c_memory_event || i%2===0);
      traceStride *= 2;
      doc.traceStride = traceStride;
      traceOverflow = doc.trace.length >= MAX_TRACE_STEPS;
    }
  }
  const identity = obj => { if (!ids.has(obj)) ids.set(obj, nextId++); return ids.get(obj); };
  function snapshot(event = 'step_line', message) {
    const d = debuggerInstance, heap = Object.create(null), reachable = new Set();
    let trackingRoots = true;
    const blockId = block => identity(block);
    const encodeBlock = (block, depth = 0) => {
      const id=blockId(block);
      if(trackingRoots)reachable.add(id);
      if(heap[id])return ['REF',id];
      if(block.freed)heap[id]=['FREED',block.typeName];
      else if(!block.cells)heap[id]=['OPAQUE',`malloc · ${block.bytes} bytes`];
      else if(block.cells.length===1 && block.type.type==='class') {
        heap[id]=['INSTANCE',block.typeName];
        heap[id].push(...Object.entries(block.cells[0].v.members).map(([name,cell])=>[name,encode(cell,depth+1)]));
      } else if(block.cells.length===1) {
        heap[id]=['INSTANCE',block.typeName+' · malloc'];
        heap[id].push(['값',encode(block.cells[0],depth+1)]);
      } else {
        heap[id]=['ARRAY',`${block.typeName}[${block.cells.length}]`];
        heap[id].push(...block.cells.slice(0,100).map(cell=>encode(cell,depth+1)));
        if(block.cells.length>100) {heap[id].push('…');doc.heapTruncated=true;}
      }
      return ['REF',id];
    };
    const encode = (val, depth = 0) => {
      if (!val?.t) return null;
      const { t, v } = val;
      if(memory.isUninitialized(val))return ['C_UNINITIALIZED'];
      if(depth>10 || Object.keys(heap).length>=900) {doc.heapTruncated=true;return '…';}
      if(t.type==='class') {
        const block=memory.allocationOf(val);
        if(block && block.cells?.length===1 && block.cells[0]===val)return encodeBlock(block,depth);
        const id=identity(val);
        if(!heap[id]) {
          heap[id]=['INSTANCE',memory.displayType(t)];
          heap[id].push(...Object.entries(v.members).map(([name,cell])=>[name,encode(cell,depth+1)]));
        }
        return ['REF',id];
      }
      if (t.type === 'primitive') {
        if (typeof v === 'number') return Number.isFinite(v) ? v : ['SPECIAL_FLOAT', String(v)];
        return typeof v === 'boolean' || typeof v === 'string' ? v : null;
      }
      if (t.type === 'function') return null;
      if (v == null || v.target == null) return null;
      if (depth > 10 || Object.keys(heap).length >= 300) { doc.heapTruncated = true; return '…'; }
      const target = v.target;
      const block=memory.allocationOf(target);
      if(block) {
        const ref=encodeBlock(block,depth);
        if(!v.position)return ref;
        const pointerId=identity(val);
        heap[pointerId]=['INSTANCE','포인터',['배열',ref],['인덱스',v.position]];
        return ['REF',pointerId];
      }
      const id = identity(target);
      if (Array.isArray(target)) {
        if (!heap[id]) {
          heap[id] = ['ARRAY', memory.displayType({type:'pointer',ptrType:'array',eleType:target[0]?.t||t.eleType,size:target.length})];
          heap[id].push(...target.slice(0, 100).map(x => encode(x, depth + 1)));
          if (target.length > 100) { heap[id].push('…'); doc.heapTruncated = true; }
        }
        if (!v.position && memory.declaredType(val).ptrType==='array') return ['REF', id];
        const pointerId = identity(val);
        heap[pointerId] = ['INSTANCE', '포인터', ['배열', ['REF', id]], ['인덱스', v.position]];
        return ['REF', pointerId];
      }
      if (!heap[id]) {
        heap[id] = ['INSTANCE', '저장 위치'];
        heap[id].push(['값', encode(target, depth + 1)]);
      }
      return ['REF', id];
    };
    const globals = Object.create(null), frames = [], storageNames=[];
    let current = null;
    for (const scope of d.rt.scope) {
      if (scope.$name.startsWith('function ')) {
        if (!frameIds.has(scope)) frameIds.set(scope, nextFrame++);
        current = { func_name: scope.$name.slice(9), class: '', frame_id: frameIds.get(scope),
          line: frameLines.get(scope) || 1, is_highlighted: false, encoded_locals: Object.create(null), ordered_varnames: [] };
        current.scope = scope;
        frames.push(current);
      }
      const values = current ? current.encoded_locals : globals;
      for (const [name, val] of Object.entries(scope.variables)) {
        if (val?.t && val.t.type !== 'function' && !(scope.$name==='global' && ['NULL','RAND_MAX'].includes(name))) {
          values[name] = encode(val);
          const slot=memory.declaredType(val).ptrType==='array'?val.v.target:val;
          storageNames.push({slot,name,frame_id:current?.frame_id||0});
        }
      }
    }
    const line = Math.max(1, Math.min(sourceLines, (d.nextNode()?.sLine > 0 ? d.nextNode().sLine - prepared.lineOffset : doc.trace.at(-1)?.line) || 1));
    if (current) { current.line = line; current.is_highlighted = true; frameLines.set(current.scope, line); }
    for (const frame of frames) { delete frame.scope; frame.ordered_varnames = Object.keys(frame.encoded_locals); }
    trackingRoots=false;
    for(const block of memory.blocks)encodeBlock(block);
    const c_memory=memory.blocks.map(block=>({id:blockId(block),bytes:block.bytes,type:block.typeName,state:block.freed?'freed':'allocated',line:block.line,...(block.freed?{freedLine:block.freedLine}:{}),reachable:reachable.has(blockId(block))}));
    const c_bindings=storageNames.filter(({slot})=>ids.has(slot)&&heap[ids.get(slot)])
      .map(({slot,...binding})=>({...binding,id:ids.get(slot)}));
    const step = { event, line, stdout, globals, ordered_globals: Object.keys(globals), stack_to_render: frames, heap, c_bindings, ...(c_memory.length?{c_memory}:{}) };
    if (current) step.func_name = current.func_name;
    if (message) step.exception_msg = message;
    return step;
  }
  try {
    prepared=prepareC(source);
    memory=createCMemory(prepared,{formatPrintf:engine.formatPrintf});
    debuggerInstance = engine.run(prepared.code, stdin, { debug: true, includes: {__jmv_memory:{load(rt) {memory.load(rt);input?.install(rt);}}}, stdio: { write(s) {
      stdout += s;
      if (stdout.length > MAX_C_OUTPUT) throw new Error('출력 262,144자 제한');
    } } });
    while (!debuggerInstance.done) {
      if (++ticks > MAX_C_TICKS || performance.now() - started > MAX_C_TIME_MS || traceOverflow) {
        doc.status = 'step_limit';
        doc.trace.push(snapshot('instruction_limit_reached', '실행 단계 또는 시간 제한에 도달했습니다.'));
        break;
      }
      const node = debuggerInstance.nextNode();
      const scopes = debuggerInstance.rt.scope;
      const key = `${node?.sLine}:${scopes.filter(s => s.$name.startsWith('function ')).map(s => {
        if (!frameIds.has(s)) frameIds.set(s, nextFrame++); return frameIds.get(s);
      }).join('/')}`;
      if (node?.sLine > 0 && key !== lastKey) {
        const depth=scopes.filter(s=>s.$name.startsWith('function ')).length;
        if(traceStride>1 && depth===(doc.trace.at(-1)?.stack_to_render.length||0) && (recordedSteps+1)%traceStride!==0) {
          recordedSteps++;lastKey=key;
        } else {
        const step = snapshot();
        const before = doc.trace.at(-1)?.stack_to_render || [];
        if (step.stack_to_render.length > before.length) step.event = 'call';
        else if (step.stack_to_render.length < before.length) step.event = 'return';
        record(step); lastKey = key;
        }
      }
      debuggerInstance.next();
      if(input?.waiting) {
        const paused = performance.now();
        input.provide(yield { stdout, line: snapshot().line });
        started += performance.now() - paused;
        doc.stdin = input.input;
      }
      for(const operation of memory.events.splice(0)) {
        if(traceOverflow)break;
        const step=snapshot();
        step.line=operation.line;
        if(step.stack_to_render.length)step.stack_to_render.at(-1).line=operation.line;
        step.c_memory_event={kind:operation.kind,id:identity(operation.block),bytes:operation.block.bytes,line:operation.line};
        record(step);
      }
    }
    if (doc.status === 'ok') {
      const step = snapshot('return');
      step.line = doc.trace.at(-1)?.line || 1;
      step.stack_to_render = []; delete step.func_name;
      doc.trace.push(step);
      recordedSteps++;
    }
  } catch (error) {
    let message = String(error.message || error);
    if(prepared && /^\d+:\d+/.test(message)) message=message.replace(/^\d+/, n=>String(Math.max(1,Number(n)-prepared.lineOffset)));
    else if(prepared && message.includes('Parsing Failure')) message=message.replace(/line (\d+)/,(_,n)=>`line ${Math.max(1,Number(n)-prepared.lineOffset)}`);
    doc.message = message;
    if (debuggerInstance && doc.trace.length) {
      doc.status = 'uncaught_exception';
      doc.trace.push(snapshot('uncaught_exception', message));
    } else {
      doc.status = 'compile_error';
      doc.problems.push({ line: Math.max(1, Number(message.match(/(?:line|at)\s+(\d+)/i)?.[1]) || 1), error: true, message });
    }
  }
  doc.timing = { runNs: (performance.now() - started) * 1e6 };
  if(traceStride>1)doc.traceTotalSteps=recordedSteps;
  return doc;
}

export function traceC(engine, options) {
  const session=traceCSession(engine,options);
  const result=session.next();
  if(!result.done)throw new Error('실시간 입력은 비동기 실행기를 사용하세요.');
  return result.value;
}

export async function traceCInteractive(engine, options, requestInput) {
  const session=traceCSession(engine,{...options,interactive:true});
  let result=session.next();
  while(!result.done)result=session.next(await requestInput(result.value));
  return result.value;
}
