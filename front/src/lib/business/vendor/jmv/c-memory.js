import { createCPrintf } from './c-printf.js';
// Logical ILP32 C storage with checked allocation lifetimes; no host addresses.
export function createCMemory(prepared, {formatPrintf} = {}) {
  const blocks = [], owners = new WeakMap(), uninitialized = new WeakSet(), freshDefaults = new WeakSet(), declared = new WeakMap();
  const events = [];
  const offsets = new WeakMap(), storage = new WeakMap();
  const cursors={global:0x08000000,stack:0x10000000,heap:0x20000000,literal:0x40000000};
  const hex=address=>'0x'+address.toString(16).padStart(8,'0');
  const reserve=(region,size,align)=>{const start=Math.ceil(cursors[region]/align)*align;cursors[region]=start+Math.max(size,1);return start;};
  function bindStorage(value,type,address) {
    const shape=layoutOf(type);
    storage.set(value,{address,bytes:shape.size,type});
    if(type.type==='class') {
      let cursor=address;
      for(const child of Object.values(value.v.members)) {
        const childType=declared.get(child)||child.t,layout=layoutOf(childType);
        cursor=Math.ceil(cursor/layout.align)*layout.align;bindStorage(child,childType,cursor);cursor+=layout.size;
      }
    } else if(type.ptrType==='array') {
      const stride=layoutOf(type.eleType).size;
      storage.set(value.v.target,{address,bytes:shape.size,type});
      value.v.target.forEach((child,index)=>bindStorage(child,type.eleType,address+index*stride));
    }
  }
  function describe(target) {
    const block=allocationOf(target),stored=storage.get(target);
    if(block) {
      const type=declared.get(target)||target.t;
      const array=Array.isArray(target);
      const bytes=array?target.length*layoutOf(declared.get(target[0])||target[0]?.t||block.type).size:type&&type.name!=='void'?layoutOf(type).size:block.bytes;
      return {address:hex(block.address+(offsets.get(target)||0)),bytes,type:type?runtime.makeTypeString(type):block.typeName,
        ...(array&&target.length?{stride:layoutOf(declared.get(target[0])||target[0].t).size,count:target.length}:{})};
    }
    if(!stored)return null;
    return {address:hex(stored.address),bytes:stored.bytes,type:runtime.makeTypeString(stored.type),
      ...(stored.type.ptrType==='array'?{stride:layoutOf(stored.type.eleType).size,count:stored.type.size}:{})};
  }
  function addressOf(pointer) {
    read(pointer);
    const target=pointer.v.target;
    if(target===null)return hex(0);
    let info=describe(target);
    if(!info && Array.isArray(target)) {
      const type=runtime.arrayPointerType(target[0]?.t||runtime.charTypeLiteral,target.length);
      const shape=layoutOf(type);bindStorage({t:type,v:{target,position:0}},type,reserve('literal',shape.size,shape.align));
      info=describe(target);
    }
    if(!info)die('이 포인터 대상의 가상 주소를 계산할 수 없습니다.');
    const stride=info.stride||0;
    return hex(Number(info.address)+(pointer.v.position||0)*stride);
  }
  let layoutOf;
  let runtime, usedBytes = 0, usedCells = 0, declaring = false;
  const location = () => Math.max(1, (runtime?.interp?.currentNode?.sLine || 2) - prepared.lineOffset);
  const die = message => { throw new Error(`line ${location()}: ${message}`); };
  const allocationOf = value => value && typeof value === 'object' ? owners.get(value) : undefined;
  function read(value) {
    if (!value || value.t === 'dummy') return;
    const block = allocationOf(value);
    if (block?.freed) die('해제된 메모리 접근 (use-after-free)');
    if (uninitialized.has(value)) die('초기화하지 않은 메모리 읽기');
  }
  function mark(value, block, unset = false, offset = 0) {
    if (!value || typeof value !== 'object') return;
    if (block) { owners.set(value, block); offsets.set(value,offset); }
    freshDefaults.delete(value);
    const storageType = declared.get(value) || value.t;
    if (storageType?.type === 'class') {
      let cursor=offset;
      for (const child of Object.values(value.v.members)) {
        const field=layoutOf(declared.get(child)||child.t);
        cursor=Math.ceil(cursor/field.align)*field.align;
        mark(child,block,unset,cursor); cursor+=field.size;
      }
    } else if (storageType?.ptrType === 'array') {
      if (block) {owners.set(value.v.target, block);offsets.set(value.v.target,offset);}
      const stride=layoutOf(storageType.eleType).size;
      value.v.target.forEach((child,index)=>mark(child,block,unset,offset+index*stride));
    } else if (unset) uninitialized.add(value);
    if(!declared.has(value))declared.set(value, value.t);
  }
  function clone(value, copyStorage = false) {
    const copy = { ...value, left: false };
    // Array lvalue provenance belongs to the source slot, never a copied variable.
    delete copy.array; delete copy.arrayIndex;
    if (value.t.type === 'class') copy.v = {members:Object.fromEntries(Object.entries(value.v.members).map(([name,cell])=>[name,{...clone(cell,true),left:true}]))};
    else if (copyStorage && (declared.get(value) || value.t).ptrType === 'array') {
      copy.v = {target:value.v.target.map(cell=>({...clone(cell,true),left:true})),position:value.v.position};
    } else if (value.t.type === 'pointer') copy.v = {...value.v};
    if (uninitialized.has(value)) uninitialized.add(copy);
    declared.set(copy, declared.get(value) || value.t);
    return copy;
  }
  function load(rt) {
    runtime = rt;
    const originalSimple=rt.simpleType.bind(rt);
    rt.simpleType = type => {
      if(typeof type==='string') {type=type.trim();if(rt.typedefs[type])return rt.typedefs[type];}
      if(Array.isArray(type))type=type.map(x=>typeof x==='string'?x.trim():x).filter(x=>x!=='');
      return originalSimple(type);
    };
    const classDefinitions = new Map();
    const types = new Map();
    for (const definition of prepared.definitions) {
      const members = [];
      const type = rt.newClass(definition.name, members);
      types.set(definition.tag,type);
      classDefinitions.set(definition.name,{...definition,members,type});
    }
    for (const [alias,tag] of prepared.aliases) rt.registerTypedef(types.get(tag),alias);
    for (const definition of classDefinitions.values()) if (definition.fields) {
      for (const field of definition.fields) {
        let type = rt.simpleType(field.base);
        for (let i=0;i<field.pointers;i++) type = rt.normalPointerType(type);
        for (const length of field.dimensions.toReversed()) type = rt.arrayPointerType(type,length);
        definition.members.push({name:field.name,type});
      }
    }
    function layout(type, visited = new Set()) {
      if (type.ptrType === 'array') { const item=layout(type.eleType,visited); return {size:item.size*type.size,align:item.align}; }
      if (type.type === 'pointer') return {size:4,align:4};
      if (type.type === 'primitive') {
        const size=rt.config.limits[type.name]?.bytes;
        if (!size) die(`sizeof(${type.name})을 지원하지 않습니다.`);
        return {size,align:Math.min(size,8)};
      }
      const definition=classDefinitions.get(type.name);
      if (!definition?.fields) die(`완전한 struct 정의가 필요합니다: ${type.name}`);
      if (visited.has(type.name)) die('struct가 자기 자신을 값으로 포함할 수 없습니다. 포인터를 사용하세요.');
      visited = new Set(visited).add(type.name);
      let size=0,align=1;
      for(const field of definition.members) {
        const fieldLayout=layout(field.type,visited);
        align=Math.max(align,fieldLayout.align);
        size=Math.ceil(size/fieldLayout.align)*fieldLayout.align+fieldLayout.size;
      }
      return {size:Math.ceil(size/align)*align,align};
    }
    layoutOf=layout;
    for (const definition of classDefinitions.values()) if (definition.fields) layout(definition.type);
    const originalSize=rt.getSizeByType.bind(rt), originalString=rt.makeTypeString.bind(rt);
    rt.getSizeByType = type => type.type === 'class' && classDefinitions.has(type.name) ? layout(type).size : originalSize(type);
    rt.makeTypeString = type => {
      if (classDefinitions.has(type?.name)) return `struct ${classDefinitions.get(type.name).tag}`;
      if(type?.ptrType==='array') {
        const dimensions=[];let element=type;
        while(element.ptrType==='array'){dimensions.push(element.size);element=element.eleType;}
        return rt.makeTypeString(element)+dimensions.map(size=>`[${size}]`).join('');
      }
      return originalString(type);
    };
    const originalDefault=rt.defaultValue.bind(rt);
    rt.defaultValue = (type,...args) => {
      const value=originalDefault(type,...args);
      if (type.type === 'class' && classDefinitions.has(type.name)) mark(value,null,true);
      if (type.type === 'pointer' && type.ptrType === 'normal') uninitialized.add(value);
      freshDefaults.add(value);
      return value;
    };
    rt.clone = value => clone(value);
    function materialize(block,type) {
      if (block.freed) die('해제된 메모리 접근 (use-after-free)');
      if (block.cells) {
        if (!rt.isTypeEqualTo(block.type,type)) die('할당된 메모리를 다른 원소 타입으로 재해석하는 cast는 지원하지 않습니다.');
        return;
      }
      const size=layout(type).size;
      if (!size || block.bytes<size) die('malloc 크기가 대상 타입보다 작습니다.');
      const count=Math.floor(block.bytes/size);
      if (usedCells+count>4096) die('실험판의 메모리 원소 4096개 제한을 초과했습니다.');
      usedCells+=count;
      block.type=type; block.typeName=rt.makeTypeString(type); block.elementSize=size;
      block.cells=Array.from({length:count},()=>rt.defaultValue(type,true));
      owners.set(block.cells,block);
      block.cells.forEach((cell,index)=>mark(cell,block,true,index*size));
    }
    const originalCast=rt.cast.bind(rt);
    rt.cast = (type,value) => {
      if (!declaring) read(value);
      if (type.type === 'class' && rt.isTypeEqualTo(type,value.t)) return value;
      if (type.type === 'pointer' && type.ptrType !== 'function') {
        if (value.t.type === 'primitive' && value.v === 0) return rt.val(type,{target:null});
        if (value.t.type === 'pointer') {
          if (value.v.target === null) return rt.val(type,{target:null});
          const block=allocationOf(value.v.target);
          if (type.targetType?.name === 'void') return rt.val(type,{...value.v});
          if (block && type.ptrType === 'normal') {
            materialize(block,type.targetType);
            return rt.val(rt.arrayPointerType(type.targetType,block.cells.length),{target:block.cells,position:value.v.position||0});
          }
        }
      }
      if (type.name === 'bool' && value.t.type === 'pointer') return rt.val(type,value.v.target !== null ? 1 : 0);
      return originalCast(type,value);
    };
    const originalDef=rt.defVar.bind(rt);
    rt.defVar = (name,type,value) => {
      if (value && uninitialized.has(value) && !freshDefaults.has(value)) read(value);
      declaring=true;
      try { originalDef(name,type,value); }
      finally { declaring=false; if(value) freshDefaults.delete(value); }
      const cell=rt.scope.at(-1).variables[name];
      if(cell) {
        declared.set(cell,type);
        if(type.type!=='function'&&type.ptrType!=='function') {
          const shape=layout(type),region=rt.scope.at(-1).$name==='global'?'global':'stack';
          bindStorage(cell,type,reserve(region,shape.size,shape.align));
        }
      }
    };
    const originalMember=rt.getMember.bind(rt);
    rt.getMember=(value,name)=> {
      if(!value) die('NULL 포인터 역참조');
      if(allocationOf(value)?.freed) die('해제된 메모리 접근 (use-after-free)');
      const member=originalMember(value,name);
      if(!member) die(`존재하지 않는 struct 필드: ${name}`);
      return member;
    };
    function dereference(value) {
      read(value);
      if(!value.v?.target) die('NULL 포인터 역참조');
      const block=allocationOf(value.v.target);
      if(block?.freed) die('해제된 메모리 접근 (use-after-free)');
      if(block && !block.cells) die('void*를 대상 타입 포인터로 변환한 뒤 역참조하세요.');
    }
    const originalGet=rt.getFunc.bind(rt);
    rt.getFunc = (type,name,args) => {
      // Fix JSCPP's pointer comparison/null conversion and support C struct value copy.
      if(type?.type === 'pointer' && ['o(==)','o(!=)','o(!)'].includes(name)) return (rt,left,right)=> {
        read(left); if(right)read(right);
        const target=v=>v?.t?.type==='pointer'?v.v.target:v?.v===0?null:undefined;
        let equal=right ? target(left)===target(right) && (target(left)==null || (left.v.position||0)===(right.v.position||0)) : target(left)===null;
        if(name==='o(!=)')equal=!equal;
        return rt.val(rt.boolTypeLiteral,equal);
      };
      if(type && typeof type==='object' && name==='o(&)' && args.length===0)return (rt,left)=> {
        if(!left.left)die('주소를 얻을 저장 위치가 아닙니다.');
        if(allocationOf(left)?.freed)die('해제된 메모리 접근 (use-after-free)');
        return left.array ? rt.val(rt.arrayPointerType(left.t,left.array.length),{target:left.array,position:left.arrayIndex})
          : rt.val(rt.normalPointerType(declared.get(left)||left.t),{target:left});
      };
      if(type?.type==='class' && name==='o(=)') return (rt,left,right)=> {
        if(!left.left)die('대입할 저장 위치가 아닙니다.');
        if(allocationOf(left)?.freed)die('해제된 메모리 쓰기 (use-after-free)');
        if(!rt.isTypeEqualTo(left.t,right.t))die('서로 다른 struct 타입은 대입할 수 없습니다.');
        const copy=clone(right); left.v=copy.v;
        mark(left,allocationOf(left),false,offsets.get(left)||0);
        const slot=storage.get(left);if(slot)bindStorage(left,slot.type,slot.address);return left;
      };
      const fn=originalGet(type,name,args);
      return function(rt,left,...rest) {
        const assignment=name==='o(=)', address=name==='o(&)' && rest.length===0;
        if(!address && !assignment) read(left);
        if(assignment && allocationOf(left)?.freed)die('해제된 메모리 쓰기 (use-after-free)');
        for(const value of rest)read(value);
        if(type?.type==='pointer' && ['o(*)','o(->)','o([])'].includes(name))dereference(left);
        const result=fn(rt,left,...rest);
        if(assignment || ['o(++)','o(--)','o(+=)','o(-=)'].includes(name)) uninitialized.delete(left);
        return result;
      };
    };
    const malloc=(rt,_this,size)=> {
      read(size);
      const bytes=size.v;
      if(!Number.isSafeInteger(bytes)||bytes<=0||bytes>65536||usedBytes+bytes>1048576||blocks.length>=300) return rt.val(rt.voidPointerType,{target:null});
      const raw={t:rt.voidTypeLiteral,v:null};
      const block={bytes,raw,cells:null,type:null,typeName:'malloc',freed:false,line:location(),address:reserve('heap',bytes,8)};
      blocks.push(block); owners.set(raw,block); usedBytes+=bytes;
      events.push({kind:'malloc',block,line:location()});
      return rt.val(rt.voidPointerType,{target:raw});
    };
    const free=(rt,_this,pointer)=> {
      read(pointer);
      if(pointer?.t?.type!=='pointer') { if(pointer.v===0)return; die('free에는 포인터가 필요합니다.'); }
      if(pointer.v.target===null)return;
      const block=allocationOf(pointer.v.target);
      const offset=block ? (offsets.get(pointer.v.target)||0)+(pointer.v.position||0)*(block.elementSize||1) : -1;
      if(!block || offset!==0) die('malloc이 반환한 블록 시작 주소만 free할 수 있습니다. (invalid free)');
      if(block.freed)die('이미 해제한 메모리를 다시 해제했습니다. (double free)');
      block.freed=true; block.freedLine=location(); usedBytes-=block.bytes;
      events.push({kind:'free',block,line:location()});
    };
    rt.regFunc(malloc,'global','malloc',[rt.unsignedintTypeLiteral],rt.voidPointerType);
    rt.regFunc(free,'global','free',[rt.voidPointerType],rt.voidTypeLiteral);
    rt.regFunc(free,'global','free',[rt.intTypeLiteral],rt.voidTypeLiteral);
    rt.registerTypedef(rt.unsignedintTypeLiteral,'size_t');
    const register=rt.regFunc.bind(rt);
    const checkedPrintf=createCPrintf({rt,formatPrintf,addressOf,read,fail:die});
    rt.regFunc=(fn,scope,name,...args)=>register(scope==='global'&&name==='printf'?checkedPrintf:fn,scope,name,...args);
    // sizeof is unevaluated in C, including sizeof(*p) when p is NULL/uninitialized.
    const patched=new WeakSet(), pendingDeclarations=new Map();
    const patchInterpreter=interp=> {
      if(patched.has(interp))return;
      patched.add(interp);
      interp.visitors.TypeName=function(interp,node) {
        const base=node.base.flat(Infinity).map(x=>String(x).trim()).filter(x=>x && x!=='const' && x!=='volatile');
        let type=rt.simpleType(base);
        if(node.extra?.Pointer)type=interp.buildRecursivePointerType(node.extra.Pointer,type,0);
        return type;
      };
      interp.visitors.PostfixExpression_MemberPointerAccess=function*(interp,node,param) {
        const pointer=yield* interp.visit(interp,node.Expression,param);
        dereference(pointer);
        const result=rt.getFunc(pointer.t,'o(*)',[])(rt,pointer);
        const cell=result?.next ? yield* result : result;
        return rt.getMember(cell,node.member);
      };
      const declaration=interp.visitors.Declaration;
      const definition=interp.visitors.FunctionDefinition;
      interp.visitors.FunctionDefinition=function*(interp,node,param) {
        const right=node.Declarator.right, list=right.ParameterTypeList?.ParameterList;
        // C's sole unnamed void parameter means an empty argument list.
        if(list?.length===1 && !list[0].Declarator && list[0].DeclarationSpecifiers.join(' ').trim()==='void') {
          node={...node,Declarator:{...node.Declarator,right:{...right,ParameterTypeList:{...right.ParameterTypeList,ParameterList:[]}}}};
        }
        return yield* definition(interp,node,param);
      };
      function zero(cell) {
        if(cell.t.type==='class')for(const child of Object.values(cell.v.members))zero(child);
        else if(cell.t.ptrType==='array')for(const child of cell.v.target)zero(child);
        else cell.v=cell.t.type==='pointer'?{target:null}:0;
        uninitialized.delete(cell);
      }
      function* initialize(cell,init,interp,param) {
        if(init.Expression) {
          if(!declared.has(cell))declared.set(cell,cell.t);
          const value=yield* interp.visit(interp,init.Expression,param);
          if(cell.t.type==='class')cell.v=clone(value).v;
          else {const converted=rt.cast(cell.t,value);cell.t=converted.t;cell.v=converted.v;}
          uninitialized.delete(cell);return;
        }
        const children=cell.t.type==='class'?Object.values(cell.v.members):cell.t.ptrType==='array'?cell.v.target:null;
        if(!children)die('중괄호 초기화는 struct·배열에서 지원합니다.');
        if(init.Initializers.length>children.length)die('초기화 값이 필드·배열 원소 수보다 많습니다.');
        zero(cell);
        for(let i=0;i<init.Initializers.length;i++)yield* initialize(children[i],init.Initializers[i],interp,param);
      }
      interp.visitors.Declaration=function*(interp,node,param) {
        const previous=new Map(pendingDeclarations);
        try {
          const base=rt.simpleType(node.DeclarationSpecifiers);
          for(const entry of node.InitDeclaratorList) {
            const dec=entry.Declarator;
            let type=interp.buildRecursivePointerType(dec.Pointer,base,0);
            const name=dec.left?.Identifier;
            if(name)pendingDeclarations.set(name,type);
            const arrays=dec.right.some(dim=>dim.type==='DirectDeclarator_modifier_array');
            const stringArray=arrays && dec.right.length===1 && !dec.Pointer && rt.isCharType(base) && entry.Initializers?.Expression;
            if((arrays&&!stringArray) || dec.left?.type==='DirectDeclarator' || (base.type==='class' && entry.Initializers?.Initializers)) {
              // Use the full declarator: *ps[2] and (*p)[3] bind differently.
              const bounded={...dec,right:dec.right.map((dim,index)=>{
                if(dim.type!=='DirectDeclarator_modifier_array')return dim;
                if(dim.Expression)return dim;
                if(index!==0 || !entry.Initializers?.Initializers)die('배열 길이를 지정하세요.');
                return {...dim,Expression:{type:'DecimalConstant',value:String(entry.Initializers.Initializers.length)}};
              })};
              const resolved=yield* interp.visitors.DirectDeclarator(interp,bounded,{...param,basetype:base});
              type=resolved.type;
              function check(t) {
                if(t.ptrType==='array') {if(!Number.isInteger(t.size)||t.size<1||t.size>1000)die('배열 길이는 1~1000이어야 합니다.');check(t.eleType);}
              }
              check(type);
              pendingDeclarations.set(resolved.name,type);
              const value=rt.defaultValue(type,true);
              if(entry.Initializers)yield* initialize(value,entry.Initializers,interp,param);
              rt.defVar(resolved.name,type,value);
            } else yield* declaration(interp,{...node,InitDeclaratorList:[entry]},param);
          }
        } finally {pendingDeclarations.clear();for(const [key,value]of previous)pendingDeclarations.set(key,value);}
      };
      function infer(node) {
        if(node.type==='IdentifierExpression') {
          if(pendingDeclarations.has(node.Identifier))return pendingDeclarations.get(node.Identifier);
          if(rt.typedefs[node.Identifier])return rt.typedefs[node.Identifier];
          if(classDefinitions.has(node.Identifier))return classDefinitions.get(node.Identifier).type;
          const cell=rt.readVar(node.Identifier);return declared.get(cell)||cell.t;
        }
        if(node.type==='UnaryExpression' && node.op==='*') {const t=infer(node.Expression);return t.targetType||t.eleType;}
        if(node.type==='UnaryExpression' && node.op==='&')return rt.normalPointerType(infer(node.Expression));
        if(node.type==='PostfixExpression_ArrayAccess') {const t=infer(node.Expression);return t.eleType||t.targetType;}
        if(['PostfixExpression_MemberAccess','PostfixExpression_MemberPointerAccess'].includes(node.type)) {
          let t=infer(node.Expression); if(node.type.endsWith('MemberPointerAccess'))t=t.targetType||t.eleType;
          const member=classDefinitions.get(t.name)?.members.find(x=>x.name===node.member);
          if(!member)die('sizeof의 struct 필드를 찾을 수 없습니다.'); return member.type;
        }
        if(['PostfixExpression_FunctionCall','PostfixExpression_MethodInvocation'].includes(node.type)) {const t=infer(node.Expression);return t.retType||t.targetType?.retType;}
        if(node.type==='BinOpExpression')die('복합 산술식의 sizeof는 타입 이름으로 작성하세요.');
        if(node.type==='FloatConstant')return rt.floatTypeLiteral;
        if(['DecimalFloatConstant','HexFloatConstant'].includes(node.type))return rt.doubleTypeLiteral;
        if(node.Expression)return infer(node.Expression);
        if(/Constant|Literal/.test(node.type))return rt.intTypeLiteral;
        die(`이 sizeof 표현식은 아직 지원하지 않습니다: ${node.type}`);
      }
      interp.visitors.UnaryExpression_Sizeof_Expr=function(interp,node) {return rt.val(rt.intTypeLiteral,layout(infer(node.Expression)).size);};
    };
    let interpreter;
    Object.defineProperty(rt,'interp',{configurable:true,get:()=>interpreter,set:value=>{interpreter=value;patchInterpreter(value);}});
  }
  return { load, blocks, events, allocationOf, isUninitialized:value=>uninitialized.has(value),
    declaredType:value=>declared.get(value)||value.t,
    describe, addressOf, blockInfo:block=>({address:hex(block.address),bytes:block.bytes,type:block.typeName,...(block.cells?.length>1?{stride:block.elementSize,count:block.cells.length}:{})}),
    displayType:type=>runtime.makeTypeString(type), location };
}
