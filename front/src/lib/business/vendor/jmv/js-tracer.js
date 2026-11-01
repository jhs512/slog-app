import { instrumentJS } from './js-engine.js';

export function traceJS({source,stdin=''}) {
  const start=performance.now();
  const doc={language:'js',code:source,stdin,options:{objects:true},status:'ok',problems:[],trace:[]};
  const scopes=[], frames=[], identities=new WeakMap();
  let nextID=1,nextFrame=1,stdout='',line=1,ticks=0;
  const id=value=>{if(!identities.has(value))identities.set(value,nextID++);return identities.get(value);};
  const LIMIT=Symbol('step limit');
  function snapshot(event='step_line',extra={}) {
    if(++ticks>2000)throw LIMIT;
    const heap=Object.create(null);
    function encode(value,depth=0) {
      if(value===undefined)return ['UNDEFINED'];
      if(value===null||['string','boolean'].includes(typeof value))return value;
      if(typeof value==='number')return Number.isFinite(value)?value:['SPECIAL_FLOAT',String(value)];
      if(typeof value==='bigint')return ['BIGINT',String(value)];
      if(typeof value==='symbol')return ['SYMBOL',String(value)];
      const key=id(value);
      if(heap[key])return ['REF',key];
      heap[key]=['OPAQUE',typeof value==='function'?`Function ${value.name||'<anonymous>'}`:'Object'];
      if(depth>8||Object.keys(heap).length>250)return ['REF',key];
      const fields=[];
      // Inspect data descriptors only. Visualizing must not execute user getters.
      for(const [name,descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0,100)) {
        if(typeof value==='function'&&['caller','callee','arguments'].includes(name))continue;
        fields.push([name,'value'in descriptor?encode(descriptor.value,depth+1):['ACCESSOR']]);
      }
      if(Array.isArray(value))heap[key]=['ARRAY','Array',...Array.from({length:Math.min(value.length,100)},(_,i)=>{
        const d=Object.getOwnPropertyDescriptor(value,String(i));return d?('value'in d?encode(d.value,depth+1):['ACCESSOR']):['JS_HOLE'];
      })];
      else if(value instanceof Map)heap[key]=['MAP','Map',[...Map.prototype.entries.call(value)].slice(0,100).map(([k,v])=>[encode(k,depth+1),encode(v,depth+1)])];
      else if(value instanceof Set)heap[key]=['COLLECTION','Set',[...Set.prototype.values.call(value)].slice(0,100).map(v=>encode(v,depth+1))];
      else heap[key]=['INSTANCE',typeof value==='function'?`Function ${value.name||'<anonymous>'}`:'Object',...fields];
      return ['REF',key];
    }
    function locals(list) {
      const result=Object.create(null);
      for(const scope of list)for(const [name,[kind,get]] of Object.entries(scope.bindings||{})) {
        try {result[name]=encode(get());}catch(e){result[name]=e instanceof ReferenceError?['JS_TDZ']:['UNAVAILABLE'];}
      }
      return result;
    }
    const globals=locals(scopes.filter(s=>s.owner===null));
    const stack=frames.map((f,i)=>{const values=locals(scopes.filter(s=>s.owner===f));if(Object.hasOwn(f,'returnValue'))values.__return__=encode(f.returnValue);return {func_name:f.name,class:'',frame_id:f.id,line:f.line,ordered_varnames:Object.keys(values),encoded_locals:values,is_highlighted:i===frames.length-1};});
    doc.trace.push({event,line,stdout,globals,ordered_globals:Object.keys(globals),heap,stack_to_render:stack,...extra});
  }
  const hooks={
    enter(name,at,kind){
      let owner=frames.at(-1)||null;
      if(kind==='function'){owner={name,id:nextFrame++,line:at};frames.push(owner);}
      const scope={owner,kind,bindings:{}};scopes.push(scope);return scope;
    },
    bindings(token,bindings){token.bindings=bindings;},
    step(at){line=at;if(frames.length)frames.at(-1).line=at;snapshot();},
    returnValue(value,at){line=at;if(frames.length){frames.at(-1).line=at;frames.at(-1).returnValue=value;}snapshot('return');return value;},
    leave(token){
      // A pending limit must still unwind native finally blocks without rethrowing.
      const index=scopes.lastIndexOf(token);if(index>=0)scopes.splice(index,1);
      if(token.kind==='function')frames.pop();
    }
  };
  const output=(...args)=>{stdout+=args.map(v=>v===null?'null':typeof v==='string'?v:typeof v==='object'?Object.prototype.toString.call(v):String(v)).join(' ')+'\n';};
  let compiled;
  try {compiled=instrumentJS(source);}catch(error){doc.status='compile_error';doc.problems=[{line:error.loc?.line||0,message:error.message,error:true}];return doc;}
  try {
    // Function provides an isolated lexical program; actual browser JS semantics
    // determine hoisting, TDZ, object identity, closures, prototypes and exceptions.
    const inputs=stdin.split(/\r?\n/);let cursor=0;
    new Function(compiled.hook,'console','prompt',compiled.code)(hooks,Object.freeze({log:output,info:output,warn:output,error:output}),()=>cursor<inputs.length?inputs[cursor++]:null);
    if(doc.trace.length)doc.trace.push({...doc.trace.at(-1),event:'return',stdout});
  }catch(error){
    if(error===LIMIT){doc.status='step_limit';if(doc.trace.length)doc.trace.push({...doc.trace.at(-1),event:'instruction_limit_reached',stdout});}
    else {doc.status='uncaught_exception';doc.trace.push({...doc.trace.at(-1),event:'uncaught_exception',line,stdout,exception_msg:String(error)});}
  }
  doc.timing={runNs:(performance.now()-start)*1e6};
  return doc;
}
