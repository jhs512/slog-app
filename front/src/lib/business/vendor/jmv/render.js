// Renders a trace document (docs/trace-format.md) as a stepper: code, call stack, objects, arrows.
// No dependencies. All DOM queries are scoped to the view root so several views can coexist.

import { highlightLines } from './highlight.js';
import { streamTableHtml, streamMetaHtml, streamChanges } from './streams.js';
import { installColumnSplitter } from './column-splitter.js';
import { installPanelHeight } from './panel-height.js';
import { installPanelFocus } from './panel-focus.js';

const EVENT_LABELS = {
  call: '메서드 호출',
  step_line: '줄 실행',
  return: '반환',
  exception: '예외 전파',
  uncaught_exception: '처리되지 않은 예외',
  instruction_limit_reached: '단계 제한 도달',
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };

function constructorParameters(desc) {
  if (typeof desc !== 'string' || !desc.startsWith('(')) return '';
  const primitives = { Z: 'boolean', B: 'byte', C: 'char', S: 'short', I: 'int', J: 'long', F: 'float', D: 'double' };
  return (desc.slice(1, desc.indexOf(')')).match(/\[*(?:L[^;]+;|[ZBCSIJFD])/g) || []).map(type => {
    const arrays = type.match(/^\[*/)[0].length;
    const base = type.slice(arrays);
    return (base.startsWith('L') ? base.slice(1, -1).split('/').at(-1) : primitives[base]) + '[]'.repeat(arrays);
  }).join(', ');
}

export function isRef(v) { return Array.isArray(v) && v[0] === 'REF'; }

/** Inline rendering of a primitive/string value, or a reference stub that the arrow layer links. */
export function valueHtml(v, language = 'java') {
  if (v === null || v === undefined) return `<span class="v-null">${language === 'python' ? 'None' : language === 'c' ? 'NULL' : language==='cpp'?'nullptr':'null'}</span>`;
  if (isRef(v)) return `<span class="v-ref" data-ref="${v[1]}"></span>`;
  if (Array.isArray(v)) {
    if(['UNDEFINED','JS_TDZ','JS_HOLE','ACCESSOR','UNAVAILABLE','OBJECT_ENDED'].includes(v[0]))return `<span class="v-uninitialized">${{UNDEFINED:'undefined',JS_TDZ:'TDZ · 선언 전',JS_HOLE:'빈 슬롯',ACCESSOR:'접근자 · 호출 안 함',UNAVAILABLE:'관측 불가',OBJECT_ENDED:'수명 종료'}[v[0]]}</span>`;
    if(v[0]==='BIGINT')return `<span class="v-num">${esc(v[1])}n</span>`;
    if(v[0]==='SYMBOL')return `<span class="v-str">${esc(v[1])}</span>`;
    if (v[0] === 'C_UNINITIALIZED') return '<span class="v-uninitialized">미초기화</span>';
    if (v[0] === 'CHAR') return `<span class="v-char">'${esc(v[1])}'</span>`;
    if (v[0] === 'LONG') return `<span class="v-num">${esc(v[1])}${language === 'python' ? '' : 'L'}</span>`;
    if (v[0] === 'SPECIAL_FLOAT') return `<span class="v-num">${esc(v[1])}</span>`;
    if (v[0] === 'PRESENT') return '<span class="v-null" title="HashSet이 모든 값 자리에 넣는 공용 표식 객체">PRESENT</span>';
    return `<span class="v-num">${esc(JSON.stringify(v))}</span>`;
  }
  if (typeof v === 'string') return `<span class="v-str">"${esc(v)}"</span>`;
  if (typeof v === 'boolean') return `<span class="v-bool">${language === 'python' ? (v ? 'True' : 'False') : v}</span>`;
  return `<span class="v-num">${esc(v)}</span>`;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const STORAGE_COLORS=[['#f0fdfa','#0f766e'],['#faf5ff','#7e22ce'],['#fff7ed','#c2410c'],['#eff6ff','#1d4ed8'],['#fdf2f8','#be185d'],['#f7fee7','#4d7c0f']];

export class TraceView {
  constructor(root, doc, options = {}) {
    this.root = root;
    this.doc = doc;
    this.trace = doc.trace || [];
    this.lines = (doc.code || '').replace(/\r\n?/g, '\n').split('\n');
    this.options = { hideMainArgs: true, ...options };
    this.index = 0;
    this.build();
    this.goTo(0);
    this.onResize = () => this.drawArrows();
    window.addEventListener('resize', this.onResize);
    // Layout can settle after the first draw (fonts, pane resize without a window resize event,
    // scrollbars appearing): redraw whenever the memory panel or its columns change size.
    this.resizeObserver = new ResizeObserver(() => {
      this.renderCode(this.trace[this.index], this.index > 0 ? this.trace[this.index - 1] : null);
      this.drawArrows();
    });
    for (const el of [this.codeEl, this.memory, this.framesCol, this.heapCol]) this.resizeObserver.observe(el);
    document.fonts?.ready?.then(() => this.drawArrows());
    this.onKey = (e) => {
      if (e.target?.isContentEditable || e.target?.closest?.('textarea, input, select, [role="separator"]')) return;
      if (e.key === 'ArrowRight') { this.goTo(this.index + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { this.goTo(this.index - 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', this.onKey);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.resizeObserver?.disconnect();
    this.removeColumnSplitter?.();
    this.panelSplitters?.forEach(remove=>remove());
    this.panelFocus?.forEach(remove=>remove());
    document.removeEventListener('keydown', this.onKey);
    this.root.replaceChildren();
  }

  build() {
    this.root.replaceChildren();
    const left = h('div', 'tv-left');
    this.codeEl = h('div', 'tv-code');
    const highlighted = highlightLines(this.lines.join('\n'), this.doc.language || 'java');
    this.lines.forEach((text, i) => {
      const row = h('div', 'tv-line');
      row.dataset.line = i + 1;
      row.innerHTML = `<span class="tv-gutter"><span class="tv-arrow"></span></span><span class="tv-ln">${i + 1}</span><span class="tv-src">${highlighted[i] || ' '}</span>`;
      this.codeEl.append(row);
    });
    left.append(this.codeEl);

    const nav = h('div', 'tv-nav');
    nav.innerHTML = `
      <div class="tv-legend"><span class="tv-arrow prev"></span> 방금 실행한 줄 <span class="tv-arrow next"></span> 다음에 실행할 줄</div>
      <input type="range" class="tv-slider" min="0" max="${Math.max(0, this.trace.length - 1)}" value="0" aria-label="단계">
      <div class="tv-buttons">
        <button data-go="first">« 처음</button><button data-go="prev">‹ 이전</button>
        <button data-go="next">다음 ›</button><button data-go="last">마지막 »</button>
      </div>
      <div class="tv-position"></div>`;
    nav.querySelector('.tv-slider').addEventListener('input', (e) => this.goTo(Number(e.target.value)));
    nav.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const go = b.dataset.go;
      this.goTo(go === 'first' ? 0 : go === 'last' ? this.trace.length - 1 : this.index + (go === 'next' ? 1 : -1));
    }));
    left.prepend(nav);
    this.nav = nav;

    const right = h('div', 'tv-right');
    this.streamViewport=right;
    this.panelSplitters=[];
    this.panelFocus=[];
    const heightControls=[];
    const focus=(panel,header,button)=>this.panelFocus.push(installPanelFocus(panel,header,button));
    nav.querySelector('.tv-legend').dataset.panelLabel='코드';
    focus(left,nav.querySelector('.tv-legend'));
    const heightBar=(panel,name,label,initial,min)=>{
      const bar=h('div','tv-panel-splitter',`↕ ${label} 높이 조절`);
      bar.tabIndex=0;bar.setAttribute('role','separator');bar.setAttribute('aria-orientation','horizontal');
      bar.setAttribute('aria-label',`${label} 높이 조절`);bar.title='위아래로 드래그 또는 방향키 · 더블클릭/Enter로 기본 높이 복원';
      const control=installPanelHeight(this.root,panel,bar,name,initial,min,{upstream:heightControls.slice().reverse(),viewport:right});
      heightControls.push(control);this.panelSplitters.push(control);
      return bar;
    };
    if(this.trace.some(step=>step.streams?.length)) {
      this.streamChanges=streamChanges(this.trace);
      this.streamChangesByChain=new Map((this.trace.at(-1).streams||[]).map(chain=>[chain.id,streamChanges(this.trace,chain.id)]));
      this.streamPanel=h('section','tv-streams');
      this.streamPanel.setAttribute('aria-label','스트림 체인');
      const controls=h('div','tv-stream-controls','<strong>스트림</strong><select aria-label="스트림 체인 선택"></select><button data-dir="-1" aria-label="이전 스트림 변화" title="이전 스트림 변화">‹</button><button data-dir="1" aria-label="다음 스트림 변화" title="다음 스트림 변화">›</button>');
      this.streamSelect=controls.querySelector('select');
      this.streamSelect.addEventListener('change',()=>{this.selectedStream=Number(this.streamSelect.value);this.renderStreams(this.trace[this.index]);});
      controls.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
        const forward=button.dataset.dir==='1';
        const changes=this.activeStreamChanges || this.streamChanges;
        const index=forward?changes.find(i=>i>this.index):changes.findLast(i=>i<this.index);
        if(index!==undefined)this.goTo(index);
      }));
      this.streamBody=h('div','tv-stream-body');
      const wide=h('button','tv-stream-wide','확대');
      controls.append(wide);focus(this.streamPanel,controls,wide);
      const help=h('details','tv-stream-help','<summary aria-label="스트림 표시 도움말">?</summary><div><b>표시 방법</b><p>최신 관측이 위에 표시됩니다. 출력 순번은 실제 실행 순서입니다. 원본 번호·색과 관측 번호로 연결 경로를 확인하세요.</p><p>종단 연산 전에는 지연 실행됩니다. 조기 종료는 실제 방문한 요소만 표시합니다. sorted는 입력을 모으고, flatMap은 요청된 출력만 펼칩니다.</p><p>실행 흐름 관측입니다. JVM 내부 객체 배치·정렬 알고리즘·관측하지 않은 값은 재현하지 않습니다.</p></div>');
      controls.append(help);this.streamMeta=h('div','tv-stream-meta');
      this.streamBody.addEventListener('click',event=>{
        const button=event.target.closest('button[data-flow-node]');
        if(!button)return;
        this.selectedFlowNode=Number(button.dataset.flowNode);
        this.renderStreams(this.trace[this.index]);
      });
      this.streamPanel.append(controls,this.streamBody,this.streamMeta);right.append(this.streamPanel,heightBar(this.streamBody,'streams','스트림 창',340,140));
    }
    this.banner = h('div', 'tv-banner');
    this.banner.hidden = true;
    this.stdoutEl = h('pre', 'tv-stdout');
    const stdoutWrap = h('div', 'tv-stdout-wrap', '<div class="tv-title">출력</div>');
    stdoutWrap.append(this.stdoutEl);
    focus(stdoutWrap,stdoutWrap.querySelector('.tv-title'));
    this.memory = h('div', 'tv-memory');
    this.framesCol = h('div', 'tv-frames', '<div class="tv-title">호출 스택</div>');
    this.heapCol = h('div', 'tv-heap', `<div class="tv-title">${this.doc.language==='c'?'배열·참조 대상':'객체'}</div>`);
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('tv-arrows');
    this.svg.innerHTML = `<defs>
      <marker id="tv-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="tv-head-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="tv-head-freed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>`;
    const defs=this.svg.querySelector('defs');
    STORAGE_COLORS.forEach(([,stroke],index)=>{
      const marker=document.createElementNS('http://www.w3.org/2000/svg','marker');
      for(const [key,value]of Object.entries({id:`tv-head-storage-${index}`,viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto-start-reverse'}))marker.setAttribute(key,value);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M0,0 L10,5 L0,10 z');path.setAttribute('fill',stroke);marker.append(path);defs.append(marker);
    });
    this.memory.append(this.framesCol, this.heapCol, this.svg);
    const memoryViewport=h('div','tv-memory-viewport');memoryViewport.append(this.memory);
    focus(memoryViewport,this.framesCol.querySelector('.tv-title'));
    this.heapCol.querySelector('.tv-title').addEventListener('dblclick',event=>{if(!event.target.closest('button'))this.framesCol.querySelector('.tv-panel-focus').click();});
    right.append(this.banner, stdoutWrap,heightBar(this.stdoutEl,'output','출력 창',48,24),memoryViewport,heightBar(memoryViewport,'memory','메모리 창',320,100));

    const columnBar=h('div','tv-column-splitter');
    columnBar.tabIndex=0;
    columnBar.setAttribute('role','separator');
    columnBar.setAttribute('aria-orientation','vertical');
    columnBar.setAttribute('aria-label','코드·메모리 너비 조절');
    columnBar.title='좌우로 드래그하거나 방향키로 너비 조절 · 두 번 클릭 또는 Enter로 기본 비율 복원';
    columnBar.innerHTML='<span aria-hidden="true">⋮</span>';
    this.root.append(left, columnBar, right);
    this.removeColumnSplitter=installColumnSplitter(this.root,columnBar,left);
  }

  goTo(i) {
    if (!this.trace.length) return;
    this.index = Math.max(0, Math.min(this.trace.length - 1, i));
    const outerTop=this.streamViewport?.scrollTop||0;
    const step = this.trace[this.index];
    const prev = this.index > 0 ? this.trace[this.index - 1] : null;
    this.renderCode(step, prev);
    this.renderNav(step);
    this.renderStdout(step);
    this.renderFrames(step, prev);
    this.renderHeap(step, prev);
    this.renderStorageLinks(step);
    this.renderStreams(step);
    this.streamViewport.scrollTop=outerTop;
    this.drawArrows();
    setTimeout(() => this.drawArrows(), 50); // once more after layout settles
  }

  captureLayout() {
    const selectors=['.tv-right','.tv-stream-body','.tv-flow-columns','.tv-stream-scroll','.tv-memory-viewport','.tv-code','.tv-stdout'];
    return {padding:this.streamViewport.style.paddingBottom,selectedStream:this.selectedStream,selectedFlowNode:this.selectedFlowNode,
      scroll:selectors.map(selector=>{const el=this.root.querySelector(selector);return [selector,el?.scrollTop||0,el?.scrollLeft||0];}),
      opened:[...this.root.querySelectorAll('details[open][data-stream-detail]')].map(el=>el.dataset.streamDetail),
      maximized:[...this.root.querySelectorAll('.tv-panel-maximized')].map(el=>['tv-left','tv-streams','tv-stdout-wrap','tv-memory-viewport'].find(name=>el.classList.contains(name)))};
  }

  restoreLayout(layout) {
    this.streamViewport.style.paddingBottom=layout.padding;
    this.selectedStream=layout.selectedStream;this.flowChainId=layout.selectedStream;this.selectedFlowNode=layout.selectedFlowNode;
    this.renderStreams(this.trace[this.index]);
    for(const name of layout.maximized)this.root.querySelector(`.${name} .tv-panel-focus`)?.click();
    for(const el of this.root.querySelectorAll('details[data-stream-detail]'))el.open=layout.opened.includes(el.dataset.streamDetail);
    for(const [selector,top,left] of layout.scroll){const el=this.root.querySelector(selector);if(el){el.scrollTop=top;el.scrollLeft=left;}}
  }

  renderStreams(step) {
    if(!this.streamPanel)return;
    const chains=step.streams || [];
    this.activeStreamChanges=this.streamChangesByChain.get(this.selectedStream) || this.streamChanges;
    const selected=chains.find(c=>c.id===this.selectedStream) || chains.at(-1);
    if(this.flowChainId!==selected?.id){this.selectedFlowNode=undefined;this.flowChainId=selected?.id;}
    this.streamSelect.replaceChildren(...chains.slice().reverse().map(c=>{
      const option=document.createElement('option');option.value=c.id;
      option.textContent=`#${c.id} · ${c.stages[0].line}행`;option.selected=c===selected;return option;
    }));
    this.streamSelect.disabled=!chains.length;
    const body=this.streamBody,top=body.scrollTop,outerTop=this.streamViewport.scrollTop;
    const horizontal=body.querySelector('.tv-flow-columns, .tv-stream-scroll')?.scrollLeft||0;
    const opened=new Set([...body.querySelectorAll('details[open][data-stream-detail]')].map(el=>el.dataset.streamDetail));
    const html=streamTableHtml(selected,step.heap,this.lines,this.selectedFlowNode);
    if(body.innerHTML!==html)body.innerHTML=html;
    for(const el of body.querySelectorAll('details[data-stream-detail]'))el.open=opened.has(el.dataset.streamDetail);
    const columns=body.querySelector('.tv-flow-columns, .tv-stream-scroll');
    if(columns)columns.scrollLeft=horizontal;
    if(this.streamMeta)this.streamMeta.innerHTML=streamMetaHtml(selected,step.heap);
    body.scrollTop=top;this.streamViewport.scrollTop=outerTop;
    for(const button of this.streamPanel.querySelectorAll('.tv-stream-controls button[data-dir]'))button.disabled=button.dataset.dir==='1'?!this.activeStreamChanges.some(i=>i>this.index):!this.activeStreamChanges.some(i=>i<this.index);
  }

  renderCode(step, prev) {
    const nextLine = step.c_memory_event ? 0 : step.line;
    const prevLine = step.c_memory_event ? step.line : prev ? prev.line : 0;
    this.codeEl.querySelectorAll('.tv-line').forEach((row) => {
      const n = Number(row.dataset.line);
      row.classList.toggle('is-next', n === nextLine);
      row.classList.toggle('is-prev', n === prevLine && n !== nextLine);
      row.classList.toggle('is-error', n === nextLine && step.event.endsWith('exception'));
    });
    const target = this.codeEl.querySelector(`.tv-line[data-line="${nextLine || prevLine}"]`);
    if (target) {
      const box = this.codeEl.getBoundingClientRect(), r = target.getBoundingClientRect();
      if (r.top < box.top + 40 || r.bottom > box.bottom - 40) {
        // Keep the selected line visible without moving the page away from memory/nav.
        this.codeEl.scrollTop += r.top - box.top - (box.height - r.height) / 2;
      }
    }
  }

  renderNav(step) {
    this.nav.querySelector('.tv-slider').value = this.index;
    const label = step.c_memory_event ? `${step.c_memory_event.kind} #${step.c_memory_event.id} · ${step.c_memory_event.bytes} bytes` : step.event === 'call' && this.doc.language && this.doc.language !== 'java' ? '함수 호출' : EVENT_LABELS[step.event] || step.event;
    this.nav.querySelector('.tv-position').innerHTML =
      `<strong>${this.index + 1} / ${this.trace.length}</strong> 단계 · ${esc(label)}` +
      (step.func_name ? ` · <code>${esc(this.frameTitle(step.stack_to_render.at(-1)))}</code>` : '');
    this.nav.querySelector('[data-go="first"]').disabled = this.nav.querySelector('[data-go="prev"]').disabled = this.index === 0;
    this.nav.querySelector('[data-go="last"]').disabled = this.nav.querySelector('[data-go="next"]').disabled = this.index === this.trace.length - 1;
    if (step.exception_msg) {
      this.banner.hidden = false;
      this.banner.className = 'tv-banner ' + (step.event === 'uncaught_exception' ? 'is-fatal' : 'is-warn');
      this.banner.textContent = (step.event === 'uncaught_exception' ? '처리되지 않은 예외: ' : '예외 발생: ') + step.exception_msg;
    } else if (step.event === 'instruction_limit_reached') {
      this.banner.hidden = false;
      this.banner.className = 'tv-banner is-warn';
      this.banner.textContent = `단계 제한(${this.doc.stepBudget ?? ''}단계)에 도달해 실행을 멈췄습니다.`;
    } else this.banner.hidden = true;
  }

  renderStdout(step) {
    const text = (step.stdout || '').replace(/\r\n?/g, '\n');
    this.stdoutEl.textContent = text;
    this.stdoutEl.classList.toggle('is-empty', !text);
    this.stdoutEl.scrollTop = this.stdoutEl.scrollHeight;
  }

  frameTitle(frame) {
    if (!frame) return '';
    let name = frame.func_name;
    if (name === '<init>') name = `${frame.class}(${constructorParameters(frame.method_desc)})`;
    else if (name === '<clinit>') name = `${frame.class} static 초기화`;
    else if (name.startsWith('lambda$')) name = `${frame.class} 람다`;
    else if (frame.class && frame.func_name !== 'main') name = `${frame.class}.${name}`;
    return name;
  }

  renderFrames(step, prev) {
    const col = this.framesCol;
    col.replaceChildren(col.querySelector('.tv-title')||h('div','tv-title','호출 스택'));
    const prevFrames = new Map((prev?.stack_to_render || []).map((f) => [f.frame_id, f]));

    if (step.ordered_globals?.length) {
      const box = h('div', 'tv-frame tv-globals');
      box.innerHTML = `<div class="tv-frame-title">${this.doc.language && this.doc.language !== 'java' ? '전역 변수' : 'static 변수'}</div>`;
      const table = h('table');
      for (const key of step.ordered_globals) {
        const changed = prev && !same(prev.globals?.[key], step.globals[key]);
        const row=this.row(key, step.globals[key], changed);row.dataset.variable=key;row.dataset.frame='0';table.append(row);
      }
      box.append(table);
      col.append(box);
    }

    const frames = step.stack_to_render || [];
    frames.forEach((frame, i) => {
      const box = h('div', 'tv-frame' + (i === frames.length - 1 ? ' is-current' : ''));
      box.dataset.frame = frame.frame_id;
      box.innerHTML = `<div class="tv-frame-title">${esc(this.frameTitle(frame))}<span class="tv-frame-line">${frame.line}행</span></div>`;
      const table = h('table');
      const before = prevFrames.get(frame.frame_id);
      for (const name of frame.ordered_varnames) {
        if (this.options.hideMainArgs && i === 0 && name === 'args' && frame.func_name === 'main') continue;
        const value = frame.encoded_locals[name];
        const changed = before ? !same(before.encoded_locals[name], value) : !!prev;
        const row=this.row(name === '__return__' ? '반환값' : name, value, changed, name === '__return__');row.dataset.variable=name;row.dataset.frame=frame.frame_id;table.append(row);
      }
      if (!table.children.length) table.append(h('tr', 'tv-empty', '<td colspan="2">지역 변수 없음</td>'));
      box.append(table);
      if(frame.unbound_locals?.length) {
        box.append(h('div','tv-reserved-title','아직 바인딩되지 않은 지역 슬롯'));
        const unbound=h('table','tv-reserved');
        for(const name of frame.unbound_locals){const row=this.row(name,null,false);row.querySelector('.tv-value').innerHTML='<span class="v-uninitialized">미바인딩</span>';unbound.append(row);}
        box.append(unbound,h('div','tv-reserved-note','CPython 지역 슬롯입니다. 대입 전에는 이름에 객체가 연결되지 않으며 None이 들어간 상태와 다릅니다.'));
      }
      const reserved=(frame.reserved_locals||[]).filter(local=>!Object.hasOwn(frame.encoded_locals,local.name)&&frame.line<=local.end);
      if(reserved.length) {
        const cpp=this.doc.language==='cpp';
        box.append(h('div','tv-reserved-title',cpp?'선언 예정 지역변수':'지역변수 예약 공간'));
        const pending=h('table','tv-reserved');
        for(const local of reserved) {
          const row=this.row(local.name,null,false);
          row.querySelector('.tv-value').innerHTML=`<span class="v-uninitialized">${cpp?(frame.line<=local.line?'선언 예정':'값 관측 불가'):'미초기화'}</span><span class="tv-reserved-detail">${frame.line<local.line?'선언 전 · ':''}${esc(local.type)} · ${local.line}행</span>`;
          pending.append(row);
        }
        box.append(pending,h('div','tv-reserved-note',cpp?'소스의 선언 계획입니다. 실제 스택 배치는 컴파일러가 정하며 선언 전에는 객체 수명이 시작되지 않았습니다.':'예약 표시는 실제 값이 아닙니다. JVM 슬롯은 재사용될 수 있습니다.'));
      }
      col.append(box);
    });
    if (!frames.length) col.append(h('div', 'tv-note', ['python','js'].includes(this.doc.language) && !['return','uncaught_exception','instruction_limit_reached'].includes(step.event) ? '전역 코드를 실행 중입니다.' : '실행이 끝났습니다.'));
  }

  row(name, value, changed, isReturn = false) {
    const tr = h('tr', (changed ? 'is-changed' : '') + (isReturn ? ' is-return' : ''));
    tr.innerHTML = `<td class="tv-name">${esc(name)}</td><td class="tv-value">${valueHtml(value, this.doc.language)}</td>`;
    return tr;
  }

  renderStorageLinks(step) {
    if(!['c','cpp'].includes(this.doc.language))return;
    if(!step.c_bindings) {
      if(Object.values(step.heap).some(obj=>obj[0]==='INSTANCE'&&obj[1]==='저장 위치'))this.heapCol.append(h('div','tv-note','같은 저장 위치의 색상 연결은 다시 실행하면 볼 수 있습니다.'));
      return;
    }
    const names=new Map(), bySlot=new Map();
    for(const binding of step.c_bindings) {
      if(!names.has(binding.id))names.set(binding.id,[]);
      names.get(binding.id).push(binding.name);
      bySlot.set(JSON.stringify([binding.frame_id,binding.name]),binding.id);
    }
    const decorate=(element,id)=>{
      const index=(id-1)%STORAGE_COLORS.length,[background,stroke]=STORAGE_COLORS[index];
      element.classList.add('tv-storage-linked');element.dataset.storage=id;element.dataset.storageColor=index;
      element.style.setProperty('--storage-background',background);element.style.setProperty('--storage-stroke',stroke);
      return index;
    };
    for(const row of this.framesCol.querySelectorAll('tr[data-variable]')) {
      const id=bySlot.get(JSON.stringify([Number(row.dataset.frame),row.dataset.variable]));
      if(!id)continue;
      decorate(row,id);
      const badge=h('span','tv-storage-badge',`#${id}`);badge.title='오른쪽과 같은 저장 위치';row.querySelector('.tv-name').append(badge);
      row.title=`같은 저장 위치: ${names.get(id).join(', ')} · #${id}`;
    }
    for(const box of this.heapCol.querySelectorAll('.tv-object[data-id]')) {
      const id=Number(box.dataset.id),aliases=names.get(id);if(!aliases||box.classList.contains('is-freed'))continue;
      decorate(box,id);
      if(step.heap[id][0]==='INSTANCE'&&step.heap[id][1]==='저장 위치') {
        const title=box.querySelector('.tv-object-title');title.replaceChildren(h('span','tv-id',`#${id}`),document.createTextNode(`${aliases.join(', ')} · 저장 위치`));
      }
      box.append(h('div','tv-storage-caption',`${aliases.map(name=>esc(name)).join(', ')} · 왼쪽과 같은 저장 위치`));
    }
    for(const ref of this.memory.querySelectorAll('.v-ref[data-ref]')) {
      const id=Number(ref.dataset.ref);if(!names.has(id))continue;
      const index=decorate(ref,id);ref.style.backgroundColor=STORAGE_COLORS[index][1];
    }
  }

  renderHeap(step, prev) {
    const col = this.heapCol;
    col.replaceChildren(col.querySelector('.tv-title')||h('div','tv-title',this.doc.language==='c'?'배열·참조 대상':'객체'));
    if(step.c_memory?.length) {
      const live=step.c_memory.filter(b=>b.state==='allocated'),freed=step.c_memory.length-live.length;
      col.append(h('div','tv-memory-summary',`malloc ${step.c_memory.length} · free ${freed} · 미해제 ${live.length} (${live.reduce((n,b)=>n+b.bytes,0)} bytes)`));
    }
    this.expanded ??= new Set();
    const internal = new Set(step.internal || []);
    const ids = Object.keys(step.heap || {}).map(Number).filter((id) => !internal.has(id)).sort((a, b) => a - b);
    for (const id of ids) col.append(this.objectBox(id, step, prev));
    if (!ids.length) col.append(h('div', 'tv-note', '아직 객체가 없습니다.'));
    if (this.doc.heapTruncated) col.append(h('div', 'tv-note', '객체 수가 많아 일부만 표시합니다.'));
  }

  /** One heap object as a box; collections get a type-specific shape and an internals toggle. */
  objectBox(id, step, prev) {
    const obj = step.heap[id];
    const was = prev?.heap?.[id];
    const box = h('div', 'tv-object' + (prev && !was ? ' is-new' : ''));
    box.dataset.id = id;
    const allocation=step.c_memory?.find(b=>b.id===id);
    if(allocation?.state==='freed')box.classList.add('is-freed');
    else if(allocation && !allocation.reachable)box.classList.add('is-unreachable');
    const kind = obj[0], type = obj[1];
    let title = kind === 'INSTANCE' ? (type.includes('.') ? type : `${type} 인스턴스`) : kind === 'ARRAY' ? `배열 ${type}` : kind === 'STRING' ? 'String' : type;
    if(kind==='FREED')title=`${type} · 해제됨`;
    if (kind === 'COLLECTION') {
      const items = obj[2] || [], internals = obj[3];
      title = `${type} · size ${items.length}`;
      if (internals?.elementData && isRef(internals.elementData)) {
        const backing = step.heap[internals.elementData[1]];
        if (backing) title += ` / 용량 ${backing.length - 2}`;
      }
    } else if (kind === 'MAP') {
      const entries = obj[2] || [], internals = obj[3];
      title = `${type} · size ${entries.length}`;
      if (internals?.table && isRef(internals.table)) {
        const table = step.heap[internals.table[1]];
        if (table) title += ` / 버킷 ${table.length - 2}`;
      }
    }
    box.innerHTML = `<div class="tv-object-title"><span class="tv-id">#${id}</span>${esc(title)}</div>`;
    if(allocation) {
      const lost=allocation.state==='allocated'&&!allocation.reachable;
      const state=allocation.state==='freed'?`free ${allocation.freedLine}행` : lost ? (step.event==='return'&&!step.stack_to_render.length?'미해제 · 누수':'참조 없음'):'할당 중';
      box.append(h('div','tv-allocation',`${allocation.bytes} bytes · malloc ${allocation.line}행 · ${state}`));
    }
    if(kind==='FREED')box.append(h('div','tv-freed-note','이 블록의 값은 더 이상 읽을 수 없습니다.'));
    else if (kind === 'INSTANCE') {
      const table = h('table', 'tv-fields');
      const wasFields = new Map(was && was[0] === 'INSTANCE' ? was.slice(2) : []);
      for (const [name, value] of obj.slice(2)) table.append(this.row(name, value, was && !same(wasFields.get(name), value)));
      if (!table.children.length) table.append(h('tr', 'tv-empty', '<td colspan="2">필드 없음</td>'));
      box.append(table);
    } else if (kind === 'ARRAY') {
      box.append(this.cells(obj.slice(2), was ? was.slice(2) : null, 0));
    } else if (kind === 'COLLECTION') {
      this.collectionBody(box, id, obj, was, step, prev);
    } else if (kind === 'MAP') {
      this.mapBody(box, id, obj, was, step, prev);
    } else if (kind === 'STRING') {
      box.classList.add('tv-scalar');
      box.append(h('div', 'tv-scalar-value', valueHtml(obj[1], this.doc.language)));
    } else if (kind === 'BOXED') {
      box.classList.add('tv-scalar');
      box.append(h('div', 'tv-scalar-value', valueHtml(obj[2], this.doc.language)));
    } else {
      box.append(h('div', 'tv-opaque', '내부 상태는 관측하지 않음'));
    }
    return box;
  }

  /** Index-labelled cells; `spare` adds dashed unused-capacity cells after the items. */
  cells(items, wasItems, spare) {
    const table = h('table', 'tv-array');
    const head = h('tr'), body = h('tr');
    items.forEach((v, i) => {
      head.append(h('th', null, String(i)));
      body.append(h('td', wasItems && !same(wasItems[i], v) ? 'is-changed' : '', valueHtml(v, this.doc.language)));
    });
    const shown = Math.min(spare, 12);
    for (let i = 0; i < shown; i++) { head.append(h('th', null, String(items.length + i))); body.append(h('td', 'tv-spare', '')); }
    if (spare > shown) { head.append(h('th', null, '…')); body.append(h('td', 'tv-spare', `+${spare - shown}`)); }
    if (!items.length && !spare) { head.append(h('th', null, '')); body.append(h('td', 'tv-empty', '비어 있음')); }
    table.append(head, body);
    return table;
  }

  collectionBody(box, id, obj, was, step, prev) {
    const type = obj[1], items = obj[2] || [], internals = obj[3];
    const wasItems = was && was[0] === 'COLLECTION' ? was[2] : null;
    const backing = internals?.elementData && isRef(internals.elementData) ? step.heap[internals.elementData[1]] : null;
    if (type === 'LinkedList') {
      const chain = h('div', 'tv-chain');
      items.forEach((v, i) => {
        if (i > 0) chain.append(h('span', 'tv-link', '\u21c4'));
        chain.append(h('span', 'tv-chip' + (wasItems && !same(wasItems[i], v) ? ' is-changed' : ''), valueHtml(v, this.doc.language)));
      });
      if (!items.length) chain.append(h('span', 'tv-empty', '비어 있음'));
      box.append(chain);
    } else if (type.endsWith('Set')) {
      const bag = h('div', 'tv-chain tv-bag');
      const wasSet = new Set((wasItems || []).map((v) => JSON.stringify(v)));
      items.forEach((v) => bag.append(h('span', 'tv-chip' + (wasItems && !wasSet.has(JSON.stringify(v)) ? ' is-changed' : ''), valueHtml(v, this.doc.language))));
      if (!items.length) bag.append(h('span', 'tv-empty', '비어 있음'));
      box.append(bag);
    } else {
      box.append(this.cells(items, wasItems, backing ? Math.max(0, backing.length - 2 - items.length) : 0));
    }
    if (!internals) return;
    const open = this.expanded.has(id);
    const toggle = h('button', 'tv-toggle', open ? '\u25be 내부 구조 접기' : '\u25b8 내부 구조 보기');
    toggle.addEventListener('click', () => {
      if (open) this.expanded.delete(id);
      else {
        this.expanded.add(id);
        if (isRef(internals.map)) this.expanded.add(internals.map[1]); // a set opens its backing map too
      }
      this.goTo(this.index);
    });
    box.append(toggle);
    if (!open) return;
    const table = h('table', 'tv-fields');
    const wasInternals = was && was[0] === 'COLLECTION' ? was[3] : null;
    for (const [name, value] of Object.entries(internals)) table.append(this.row(name, value, wasInternals && !same(wasInternals[name], value)));
    box.append(table);
    const inner = h('div', 'tv-internals');
    const order = [];
    if (backing) order.push(internals.elementData[1]);
    if (isRef(internals.map) && step.heap[internals.map[1]]) order.push(internals.map[1]);
    if (type === 'LinkedList') {
      let cursor = internals.first, guard = 0;
      while (isRef(cursor) && step.heap[cursor[1]] && guard++ < 64) {
        order.push(cursor[1]);
        const node = step.heap[cursor[1]];
        cursor = (node.slice(2).find(([n]) => n === 'next') || [])[1];
      }
    }
    for (const innerId of order) inner.append(this.objectBox(innerId, step, prev));
    if (order.length) box.append(inner);
  }

  mapBody(box, id, obj, was, step, prev) {
    const entries = obj[2] || [], internals = obj[3];
    const wasByKey = was && was[0] === 'MAP' ? new Map(was[2].map(([k, v]) => [JSON.stringify(k), v])) : null;
    const table = h('table', 'tv-fields');
    entries.forEach(([k, v]) => {
      const key = JSON.stringify(k);
      const tr = h('tr', wasByKey && (!wasByKey.has(key) || !same(wasByKey.get(key), v)) ? 'is-changed' : '');
      tr.innerHTML = `<td class="tv-name">${valueHtml(k, this.doc.language)}</td><td class="tv-value">${valueHtml(v, this.doc.language)}</td>`;
      table.append(tr);
    });
    if (!entries.length) table.append(h('tr', 'tv-empty', '<td colspan="2">비어 있음</td>'));
    box.append(table);
    if (!internals) return;
    const open = this.expanded.has(id);
    const toggle = h('button', 'tv-toggle', open ? '\u25be 내부 구조 접기' : '\u25b8 내부 구조 보기');
    toggle.addEventListener('click', () => {
      if (open) this.expanded.delete(id); else this.expanded.add(id);
      this.goTo(this.index);
    });
    box.append(toggle);
    if (!open) return;
    const fields = h('table', 'tv-fields');
    const wasInternals = was && was[0] === 'MAP' ? was[3] : null;
    for (const [name, value] of Object.entries(internals)) fields.append(this.row(name, value, wasInternals && !same(wasInternals[name], value)));
    box.append(fields);
    const bucketArray = internals.table && isRef(internals.table) ? step.heap[internals.table[1]] : null;
    if (!bucketArray) return;
    const inner = h('div', 'tv-internals');
    inner.append(this.bucketBox(internals.table[1], bucketArray, prev?.heap?.[internals.table[1]]));
    const chains = h('div', 'tv-chains');
    bucketArray.slice(2).forEach((slot) => {
      if (!isRef(slot)) return;
      const chain = h('div', 'tv-chain-row');
      let cursor = slot, guard = 0;
      while (isRef(cursor) && step.heap[cursor[1]] && guard++ < 64) {
        chain.append(this.objectBox(cursor[1], step, prev));
        const node = step.heap[cursor[1]];
        cursor = (node.slice(2).find(([n]) => n === 'next') || [])[1];
      }
      chains.append(chain);
    });
    inner.append(chains);
    box.append(inner);
  }

  /** Hash table array drawn vertically: one row per bucket, runs of empty buckets collapsed. */
  bucketBox(id, arr, was) {
    const box = h('div', 'tv-object tv-buckets' + (was ? '' : ' is-new'));
    box.dataset.id = id;
    const slots = arr.slice(2);
    box.innerHTML = `<div class="tv-object-title"><span class="tv-id">#${id}</span>배열 ${esc(arr[1].replace('[]', ''))}[${slots.length}]</div>`;
    const table = h('table', 'tv-fields');
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] === null) {
        let j = i;
        while (j + 1 < slots.length && slots[j + 1] === null) j++;
        const tr = h('tr', 'tv-empty');
        tr.innerHTML = `<td class="tv-name">${j > i ? `${i}–${j}` : i}</td><td class="tv-value"><span class="v-null">null</span></td>`;
        table.append(tr);
        i = j;
        continue;
      }
      const changed = was && !same(was[i + 2], slots[i]);
      table.append(this.row(String(i), slots[i], changed));
    }
    box.append(table);
    return box;
  }

  drawArrows() {
    const svg = this.svg;
    const defs = svg.querySelector('defs');
    svg.replaceChildren(defs);
    const box = this.memory.getBoundingClientRect();
    svg.setAttribute('width', this.memory.clientWidth);
    svg.setAttribute('height', this.memory.clientHeight);
    // client rects are post-transform/zoom; SVG units are layout px, so undo any ancestor scaling
    const k = (box.width / this.memory.offsetWidth) || 1;
    const sx = this.memory.scrollLeft, sy = this.memory.scrollTop;
    const current = this.framesCol.querySelector('.tv-frame.is-current');
    for (const src of this.memory.querySelectorAll('[data-ref]')) {
      const target = this.heapCol.querySelector(`.tv-object[data-id="${src.dataset.ref}"]`);
      if (!target) continue;
      const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x1 = (a.left - box.left) / k + sx + 6, y1 = (a.top - box.top + a.height / 2) / k + sy;
      const x2 = (b.left - box.left) / k + sx, y2 = (b.top - box.top) / k + sy + 12;
      const fromHeap = !!src.closest('.tv-object');
      const dangling=target.classList.contains('is-freed');
      const dim = fromHeap ? false : !(current && current.contains(src)) && !src.closest('.tv-globals');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;
      if (fromHeap && src.closest('.tv-object') === target) {
        // self reference: loop out to the right and back to the top-left corner
        const r = src.closest('.tv-object').getBoundingClientRect();
        const rx = (r.right - box.left) / k + sx;
        d = `M${x1},${y1} C${rx + 30},${y1} ${rx + 30},${y2 - 24} ${x2 + 20},${y2 - 10}`;
      } else {
        const dx = Math.max(40, Math.abs(x2 - x1) / 2);
        d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('class', 'tv-edge' + (dim ? ' is-dim' : '') + (fromHeap ? ' is-heap' : '') + (dangling ? ' is-dangling' : ''));
      path.setAttribute('marker-end', dangling ? 'url(#tv-head-freed)' : dim ? 'url(#tv-head-dim)' : 'url(#tv-head)');
      if(!dangling && src.dataset.storageColor!==undefined) {
        const color=Number(src.dataset.storageColor);
        path.style.stroke=STORAGE_COLORS[color][1];
        path.setAttribute('marker-end',`url(#tv-head-storage-${color})`);
      }
      svg.append(path);
      src.classList.toggle('is-dim', dim);
      src.classList.toggle('is-dangling', dangling);
      if(dangling)src.title='해제된 메모리를 가리키는 댕글링 포인터';
    }
  }
}
