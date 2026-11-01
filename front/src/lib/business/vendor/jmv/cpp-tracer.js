import { WASI,File,OpenFile,ConsoleStdout,setUpSysroot } from './cpp-engine.js';
import { cppASTSource,instrumentCPP } from './cpp-instrument.js';
const BASE='/web/vendor/browsercc-0.1.1/';
let ready;
export function prepareCPP() {
  return ready ||= (async()=>{
    const unpack=async name=>{
      const response=await fetch(BASE+name+'.gz');if(!response.ok)throw new Error(`C++ 런타임 ${name}: ${response.status}`);
      return new Uint8Array(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    };
    const [{default:Clang},{default:LLD},clangBinary,lldBinary,sysroot,header]=await Promise.all([
      import(BASE+'clang.js'),import(BASE+'lld.js'),unpack('clang.wasm'),unpack('lld.wasm'),unpack('sysroot.tar'),
      fetch(new URL('./cpp-runtime.hpp',import.meta.url)).then(r=>{if(!r.ok)throw new Error('C++ 추적 헤더를 불러오지 못했습니다.');return r.text();})
    ]);
    return {Clang,LLD,clangBinary,lldBinary,sysroot,header};
  })();
}
export async function traceCPP({source,stdin=''}, suppliedRuntime) {
  const start=performance.now(), runtime=suppliedRuntime||await prepareCPP();
  const {Clang,LLD,clangBinary,lldBinary,sysroot,header}=runtime;
  const doc={language:'cpp',code:source,stdin,options:{objects:true},status:'ok',problems:[],trace:[],memoryModel:'wasm32-wasi'};
  const diagnostic=message=>{doc.status='compile_error';doc.problems=[{line:Number(message.match(/(?:main\.cpp|\/main\.cpp):(\d+):/)?.[1]||0),message,error:true}];return doc;};
  let errors='';
  const driver=await Clang({wasmBinary:clangBinary,thisProgram:'clang++',print:()=>{},printErr:x=>errors+=x+'\n'});
  driver.FS.mkdirTree('/lib/wasm32-wasi');driver.FS.mkdirTree('/include/c++/v1');driver.FS.writeFile('/lib/wasm32-wasi/crt1-command.o','');driver.FS.writeFile('/main.cpp',source);
  driver.callMain(['/main.cpp','-std=c++20','-O0','-fno-exceptions','-###']);
  const argsFor=key=>{
    const line=errors.split('\n').find(s=>s.includes('"'+key+'"'));
    if(!line)throw new Error('C++ 컴파일 옵션을 구성하지 못했습니다.');
    return [...line.matchAll(/"([^"]*)"/g)].map(m=>m[1]).slice(1);
  };
  const compilerArgs=argsFor('-cc1'), linkerArgs=argsFor('wasm-ld');
  // Drop driver diagnostics; subsequent diagnostics refer to student source.
  errors='';let astOutput='';
  const astCompiler=await Clang({wasmBinary:clangBinary,thisProgram:'clang++',print:x=>{astOutput+=x+'\n';if(astOutput.length>12e6)throw new Error('C++ AST가 너무 큽니다. 예제 크기를 줄여 주세요.');},printErr:x=>errors+=x+'\n'});
  setUpSysroot(astCompiler,sysroot);
  const wrapped=cppASTSource(source);astCompiler.FS.writeFile('/main.cpp',wrapped.source);
  const astArgs=compilerArgs.map(x=>x==='-emit-obj'?'-fsyntax-only':x);
  astArgs.push('-ast-dump=json','-ast-dump-filter=__viz_source');
  if(astCompiler.callMain(astArgs)!==0)return diagnostic(errors);
  let ast;try{ast=JSON.parse(astOutput);}catch{return diagnostic(errors||'C++ 소스의 구문 트리를 만들지 못했습니다.');}
  const traced=instrumentCPP(source,ast,wrapped.prefixBytes);
  errors='';
  const compiler=await Clang({wasmBinary:clangBinary,thisProgram:'clang++',print:()=>{},printErr:x=>errors+=x+'\n'});
  setUpSysroot(compiler,sysroot,{'/__viz.hpp':header});compiler.FS.writeFile('/main.cpp',traced);
  const instrumentedArgs=[...compilerArgs];instrumentedArgs.splice(instrumentedArgs.length-1,0,'-I/');
  if(compiler.callMain(instrumentedArgs)!==0)return diagnostic(errors);
  const objectName=compilerArgs[compilerArgs.indexOf('-o')+1], object=compiler.FS.readFile(objectName);
  const linker=await LLD({wasmBinary:lldBinary,thisProgram:'wasm-ld',print:()=>{},printErr:x=>errors+=x+'\n'});
  setUpSysroot(linker,sysroot);linker.FS.writeFile(objectName,object);
  if(linker.callMain(linkerArgs)!==0)return diagnostic(errors);
  const binary=linker.FS.readFile(linkerArgs[linkerArgs.indexOf('-o')+1]);
  let stdout='',stderr='';
  const flush=line=>{
    if(line.startsWith('\x1eJMV{')){
      const step=JSON.parse(line.slice(4));step.stdout=stdout;doc.trace.push(step);
    }else if(line==='\x1eJMV_LIMIT')doc.status='step_limit';
    else if(line)stderr+=line+'\n';
  };
  let pending='';
  const errorOutput=new File([]), out=new File([]);
  // Custom fd_write preserves interleaving of stdout and trace stderr. A line-
  // buffered console would miss printf output without a trailing newline.
  const outputFD=new OpenFile(out), errorFD=new OpenFile(errorOutput);
  const decoder=new TextDecoder();
  outputFD.fd_write=data=>{stdout+=decoder.decode(data,{stream:true});return {ret:0,nwritten:data.length};};
  errorFD.fd_write=data=>{pending+=new TextDecoder().decode(data);let at;while((at=pending.indexOf('\n'))>=0){flush(pending.slice(0,at));pending=pending.slice(at+1);}return {ret:0,nwritten:data.length};};
  const wasi=new WASI(['main'],[],[new OpenFile(new File(new TextEncoder().encode(stdin))),outputFD,errorFD]);
  try {
    const module=await WebAssembly.compile(binary);
    const instance=await WebAssembly.instantiate(module,{wasi_snapshot_preview1:wasi.wasiImport});
    const exit=wasi.start(instance);if(exit!==0){doc.status='uncaught_exception';stderr+=`프로그램 종료 코드: ${exit}`;}
  }catch(error){doc.status='uncaught_exception';stderr+=String(error);}
  if(pending)flush(pending);
  if(doc.trace.length){const last=doc.trace.at(-1);doc.trace.push({...last,event:doc.status==='uncaught_exception'?'uncaught_exception':'return',stdout,...(stderr?{exception_msg:stderr}:{})});}
  else if(stderr)return diagnostic(stderr);
  doc.timing={runNs:(performance.now()-start)*1e6};
  return doc;
}
