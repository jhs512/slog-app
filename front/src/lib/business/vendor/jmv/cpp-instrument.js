// Clang's resolved AST supplies source ranges; no regex parser rewrites C++.
export function cppASTSource(source) {
  const includes=[];
  const body=source.replace(/^\s*#\s*include[^\n]*/gm,text=>{includes.push(text);return new TextDecoder().decode(new TextEncoder().encode(text).map(byte=>byte===10?10:32));});
  const prefix=includes.join('\n')+'\nnamespace __viz_source {\n';
  return {source:prefix+body+'\n}',prefixBytes:new TextEncoder().encode(prefix).length};
}
export function instrumentCPP(source,ast,prefixBytes) {
  const bytes=new TextEncoder().encode(source), decoder=new TextDecoder();
  const edits=[], covered=new Set();
  let unique=0;
  const offset=point=>(point?.spellingLoc||point)?.offset-prefixBytes;
  const begin=n=>offset(n.range?.begin), end=n=>offset(n.range?.end)+(n.range?.end?.tokLen||1);
  const lineAt=at=>decoder.decode(bytes.slice(0,Math.max(0,at))).split('\n').length;
  const add=(at,text,priority=0)=>{if(at>=0&&at<=bytes.length)edits.push({at,text,priority});};
  const text=n=>decoder.decode(bytes.slice(begin(n),end(n)));
  const j=JSON.stringify;
  const records=new Map();
  function collect(n){if(n.kind==='CXXRecordDecl'&&n.completeDefinition&&n.name){let access=n.tagUsed==='struct'?'public':'private';const fields=[];for(const child of n.inner||[]){if(child.kind==='AccessSpecDecl')access=child.access;else if(child.kind==='FieldDecl'&&access==='public'&&child.name)fields.push(child.name);}records.set(n.name,fields);}for(const child of n.inner||[])collect(child);}
  collect(ast);
  const className=type=>type?.replace(/\b(const|volatile|struct|class)\b/g,'').replace(/[&*]/g,'').trim().split('::').at(-1);
  function reader(type,aggregate=false){const name=className(type),fields=records.get(name);return fields?`[](auto& __viz_obj){return __viz::fields(${j(name)},{${fields.map(f=>`{${j(f)},__viz::fieldValue(__viz_obj.${f},${aggregate})}`).join(',')}});}`:null;}
  const watch=(name,type,init,aggregate=false)=>{const read=type.includes('*')?null:reader(type,aggregate);return `__viz::watch(${j(name)},${name},${init},${j(type)}${read?','+read:''});`;};
  function walk(node,inFunction=false) {
    const children=node.inner||[];
    const functionKinds=['FunctionDecl','CXXMethodDecl','CXXConstructorDecl','CXXDestructorDecl'];
    if(functionKinds.includes(node.kind)) {
      const body=children.find(x=>x.kind==='CompoundStmt');
      if(body&&!node.isImplicit&&!covered.has(begin(body))) {
        covered.add(begin(body));
        const at=begin(body), name=node.name||'<function>';
        const plans=[];
        function plan(n,scopeEnd){if(['CompoundStmt','ForStmt','CXXForRangeStmt','IfStmt','SwitchStmt','WhileStmt'].includes(n.kind))scopeEnd=lineAt(end(n));if(n.kind==='VarDecl'&&n.name)plans.push({name:n.name,type:n.type.qualType,line:lineAt(begin(n)),start:lineAt(at),end:scopeEnd});for(const child of n.inner||[])if(!functionKinds.includes(child.kind))plan(child,scopeEnd);}
        plan(body,lineAt(end(body)));
        let entry=` __viz::Frame __viz_frame_${unique++}(${j(name)},${lineAt(at)},${j(JSON.stringify(plans))}${node.kind==='CXXDestructorDecl'?',reinterpret_cast<uintptr_t>(this)':''}); `;
        if(node.kind==='CXXConstructorDecl')entry+='__viz::reset(this,sizeof(*this));';
        if(name==='main')for(const global of ast.inner||[])if(global.kind==='VarDecl'&&global.name&&begin(global)>=0)entry+=watch(global.name,global.type.qualType,true,true).replace('__viz::watch(','__viz::global(');
        for(const init of children.filter(x=>x.kind==='CXXCtorInitializer'&&x.anyInit?.name))entry+=`__viz::initialized(&(this->${init.anyInit.name}));`;
        for(const param of children.filter(x=>x.kind==='ParmVarDecl'&&x.name))entry+=watch(param.name,param.type.qualType,true);
        if(['CXXMethodDecl','CXXConstructorDecl','CXXDestructorDecl'].includes(node.kind)&&node.storageClass!=='static') {
          const owner=[...records.keys()].find(key=>node.name===key||node.name==='~'+key);
          if(owner)entry+=watch('*this',owner,true);
        }
        add(at+1,entry,-20);
        walk(body,true);
      }
      // Recurse nested class methods via their enclosing class, but not AST
      // instantiation duplicates or system-header function bodies.
      return;
    }
    if(inFunction&&node.kind==='CompoundStmt') {
      add(begin(node)+1,` __viz::Scope __viz_scope_${unique++}; `,-10);
      for(const child of children) {
        const at=begin(child);
        add(at,`__viz::step(${lineAt(at)}); `,-5);
        if(child.kind==='DeclStmt')for(const decl of child.inner||[])if(decl.kind==='VarDecl'&&decl.name) {
          // A class is initialized by its constructor; an uninitialized scalar
          // must never be loaded by the visualizer.
          const initialized=decl.storageClass==='static'||!!decl.init||!!decl.inner?.some(x=>x.kind==='CXXConstructExpr');
          add(end(child),` ${watch(decl.name,decl.type.qualType,initialized,decl.inner?.some(n=>n.kind==='InitListExpr')||false)} `,-7);
        }
        if(child.kind==='BinaryOperator'&&child.opcode==='=') {
          const lhs=child.inner?.[0];
          if(['DeclRefExpr','MemberExpr','ArraySubscriptExpr','UnaryOperator'].includes(lhs?.kind))add(end(child),`;__viz::initialized(&(${text(lhs)}))`,10);
        }
      }
      add(end(node)-1,` __viz::step(${lineAt(end(node)-1)}); `,-1);
    }
    if(inFunction&&node.kind==='CXXNewExpr') {
      const type=className(node.type?.qualType),aggregate=node.inner?.some(n=>n.kind==='InitListExpr')||false;
      const read=reader(node.type?.qualType,aggregate)||`[](auto& __viz_obj){return __viz::fields(${j(type)},{{"값",__viz::fieldValue(__viz_obj,${!!node.initStyle})}});}`;
      if(!node.isArray){add(begin(node),'__viz::allocated((', -2);add(end(node),`),${j(type)},${read})`,2);}
    }
    if(inFunction&&node.kind==='CXXDeleteExpr') {
      // Insert a lifetime marker after the native delete, without evaluating its
      // operand twice. Only a plain pointer binding is observed this way.
      let operand=children[0];while(operand?.kind==='ImplicitCastExpr')operand=operand.inner?.[0];
      if(operand?.kind==='DeclRefExpr'){add(begin(node),'__viz::destroy([&]{',-3);add(end(node),`;},${text(operand)})`,3);}
    }
    for(const child of children)walk(child,inFunction);
  }
  walk(ast);
  // Apply insertions without shifting Clang's UTF-8 source offsets.
  edits.sort((a,b)=>a.at-b.at||a.priority-b.priority);
  let result='',cursor=0;
  for(const edit of edits){result+=decoder.decode(bytes.slice(cursor,edit.at))+edit.text;cursor=edit.at;}
  result+=decoder.decode(bytes.slice(cursor));
  return '#include "__viz.hpp"\n#line 1 "main.cpp"\n'+result;
}
