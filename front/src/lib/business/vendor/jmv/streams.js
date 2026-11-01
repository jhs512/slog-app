// Renders inert observations. Never calls a predicate, getter or student toString.
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STATES = {building:'체인 구성 중 · 지연 실행',running:'요소 처리 중',complete:'종단 연산 완료',failed:'실행 중 예외',unavailable:'요소 추적 불가'};

export function streamValue(value, heap, depth = 0) {
  if (Array.isArray(value) && value[0] === 'REF') {
    const object = heap[value[1]];
    if (!object || depth > 1) return `#${value[1]}`;
    if (object[0] === 'STRING') return JSON.stringify(object[1]);
    if (object[0] === 'BOXED') return `${object[1]}(${streamValue(object[2], heap, depth + 1)})`;
    if (object[0] === 'ARRAY') return `#${value[1]} [${object.slice(2, 10).map(v => streamValue(v, heap, depth + 1)).join(', ')}${object.length > 10 ? ', …' : ''}]`;
    if (object[0] === 'COLLECTION') return `#${value[1]} ${object[1]} [${object[2].slice(0,8).map(v=>streamValue(v,heap,depth+1)).join(', ')}${object[2].length>8?', …':''}]`;
    if (object[0] === 'INSTANCE') {
      const fields = object.slice(2).filter(([k]) => ['name','id','value','present'].includes(k));
      return `#${value[1]} ${object[1]}${fields.length ? ' { ' + fields.map(([k,v])=>`${k}: ${streamValue(v,heap,depth+1)}`).join(', ') + ' }' : ''}`;
    }
    return `#${value[1]} ${object[1]}`;
  }
  if (Array.isArray(value)) return value[0] === 'CHAR' ? `'${value[1]}'` : String(value[1]);
  return JSON.stringify(value);
}

export function flowRelated(flow, selected) {
  const byId=new Map(flow.nodes.map(node=>[node.id,node]));
  if(!byId.has(selected))return new Set();
  const related=new Set([selected]);
  for(let node=byId.get(selected);node?.parent!=null;node=byId.get(node.parent))related.add(node.parent);
  const descendants=new Set([selected]);
  // Validated nodes are in observation order and parents always precede children.
  for(const node of flow.nodes)if(descendants.has(node.parent)){descendants.add(node.id);related.add(node.id);}
  return related;
}

export function streamFlowHtml(chain, heap, lines = [], selected) {
  const flow=chain.flow,related=flowRelated(flow,selected);
  const nodes=new Map(flow.nodes.map(node=>[node.id,node]));
  const orders=new Map(),counts=new Map();
  for(const node of flow.nodes){const order=(counts.get(node.stage)||0)+1;counts.set(node.stage,order);orders.set(node.id,order);}
  const card=node=>`<button type="button" data-flow-node="${node.id}" class="tv-flow-node root-${node.row%6}${node.dropped?' is-dropped':''}${flow.activeNode===node.id?' is-active':''}${related.has(node.id)?' is-related':''}" aria-pressed="${selected===node.id}"><small>${node.stage===0?'':`출력 ${orders.get(node.id)} · `}원본 ${node.row+1} · 관측 ${node.id}${node.parent==null?'':` ← ${node.parent}`}</small><b>${esc(streamValue(node.value,heap))}</b>${node.dropped?'<strong>✕ 탈락</strong>':''}</button>`;
  const columns=chain.stages.map((stage,index)=>{
    const outputs=flow.nodes.filter(node=>node.stage===index);
    const sorting=flow.sorts.find(sort=>sort.stage===index);
    const expansions=flow.expansions.filter(group=>group.stage===index);
    let detail='';
    if(sorting){
      const states={waiting:'입력 대기',buffering:'입력을 모으는 중',emitting:'정렬된 값을 내보내는 중',complete:'종단 연산 종료'};
      detail=`<div class="tv-flow-buffer"><strong>${states[sorting.state]}</strong><p>관측 입력 ${sorting.inputs.length}개 · 출력 ${sorting.outputs.length}개</p><details data-stream-detail="sort-${index}"><summary>관측 입력 목록 · 최신 먼저</summary><p>${sorting.inputs.slice().reverse().map(id=>`<span>관측 ${id}: ${esc(streamValue(nodes.get(id).value,heap))}</span>`).join(' ← ') || '아직 없음'}</p></details><small>라이브러리 내부 배열·정렬 알고리즘은 재현하지 않습니다.</small></div>`;
    }
    let content=outputs.slice().reverse().map(card).join('');
    if(expansions.length){
      const states={opening:'펼칠 스트림을 만드는 중',open:'펼치는 중',closed:'내부 스트림 닫힘',failed:'매퍼 예외'};
      content=expansions.slice().reverse().map(group=>`<div class="tv-flow-group"><p>입력 관측 ${group.parent}: ${esc(streamValue(nodes.get(group.parent).value,heap))}</p><small>${states[group.state]} · 실제 출력 ${group.outputs.length}개${group.state==='closed'&&!group.outputs.length?' · 빈 결과':''}</small>${group.outputs.slice().reverse().map(id=>card(nodes.get(id))).join('')}</div>`).join('');
    }
    return `<section class="tv-flow-stage" aria-label="${esc(stage.op)} 단계"><h4 title="${esc(lines[stage.line-1]||'')}">${esc(stage.op)}</h4><small>${stage.line}행 · ${index===0?'원본':stage.kind==='terminal'?'종단':'중간'}</small>${detail}${content||'<p class="tv-note">관측 출력 없음</p>'}</section>`;
  }).join('');
  return `${chain.notice?`<p class="tv-stream-notice">${esc(chain.notice)}</p>`:''}<div class="tv-flow-columns">${columns}</div>`;
}

export function streamTableHtml(chain, heap, lines = [], selected) {
  if (!chain) return '<p class="tv-note">아직 스트림을 생성하지 않았습니다. 다음 스트림 변화로 이동해 보세요.</p>';
  if(chain.flow)return streamFlowHtml(chain,heap,lines,selected);
  const headers = chain.stages.map(s=>`<th scope="col" title="${esc(lines[s.line-1] || '')}"><b>${esc(s.op)}</b><small>${s.line}행 · ${s.kind === 'source' ? '원본' : s.kind === 'terminal' ? '종단' : '중간'}</small></th>`).join('');
  const rows = chain.rows.map((row,i)=>[row,i]).reverse().map(([row,i])=>`<tr><th scope="row">${i+1}</th>${chain.stages.map((_,j)=>{
    const cell=row[j];
    return `<td class="${cell?.dropped?'is-dropped ':''}${chain.activeRow===i && chain.activeStage===j?'is-active':''}">${cell?esc(streamValue(cell.value,heap))+(cell.dropped?'<strong>✕ 탈락</strong>':''):'<span aria-label="도달하지 않음">·</span>'}</td>`;
  }).join('')}</tr>`).join('');
  return `${chain.notice?`<p class="tv-stream-notice">${esc(chain.notice)}</p>`:''}<div class="tv-stream-scroll"><table><thead><tr><th scope="col">요소</th>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="${chain.stages.length+1}">아직 관측한 요소가 없습니다.</td></tr>`}</tbody></table></div>`;
}

export function streamChanges(trace, chainId) {
  let previous='';
  return trace.flatMap((step,index)=>{
    const chains=chainId==null?step.streams:step.streams?.filter(chain=>chain.id===chainId);
    const current=JSON.stringify(chains || []);
    if(current===previous)return [];
    previous=current;
    return chains?.length?[index]:[];
  });
}

export function streamMetaHtml(chain,heap){
  if(!chain)return '<span>생성 전</span>';
  const state={building:'구성',running:'실행',complete:'완료',failed:'예외',unavailable:'추적 불가'}[chain.state];
  const shortCircuit=['findFirst','findAny','anyMatch','allMatch','noneMatch'].includes(chain.stages.at(-1)?.op);
  return `<span title="${esc(STATES[chain.state])}${shortCircuit?' · 조기 종료 연산':''}">${state} · 방문 ${chain.rows.length}개</span>${Object.hasOwn(chain,'result')?`<span class="tv-stream-return" title="실제 반환값: ${esc(streamValue(chain.result,heap))}">반환 <b>${esc(streamValue(chain.result,heap))}</b></span>`:''}`;
}
