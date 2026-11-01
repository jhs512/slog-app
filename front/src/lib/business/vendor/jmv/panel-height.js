const KEY='jmv.visualizer-heights.v1';
const MAX=12000;
const preferences=()=>{try{const value=JSON.parse(localStorage.getItem(KEY));return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}};

export function installPanelHeight(root,panel,bar,name,initial,min=64,options={}){
  const saved=preferences()[name];
  let height=Number.isFinite(saved)?Math.max(min,Math.min(MAX,saved)):initial,drag=null;
  function apply(){
    panel.style.height=`${height}px`;
    bar.setAttribute('aria-valuemin',String(min));bar.setAttribute('aria-valuemax',String(MAX));
    bar.setAttribute('aria-valuenow',String(Math.round(height)));bar.setAttribute('aria-valuetext',`${Math.round(height)}픽셀`);
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify({...preferences(),[name]:height}));}catch{/* Optional layout preference. */}}
  function resize(value){height=Math.max(min,Math.min(MAX,Math.round(value)));apply();}
  function reset(){height=initial;save();apply();}
  const upstream=options.upstream||[],viewport=options.viewport;
  function move(delta){
    let remaining=Math.max(0,-delta);
    for(const entry of drag.upstream){const shrink=Math.min(remaining,entry.height-entry.control.min);entry.control.resize(entry.height-shrink);remaining-=shrink;}
    resize(drag.height+(delta<0?-remaining:delta));
    remaining=Math.max(0,remaining-(drag.height-min));
    if(viewport){
      const target=drag.scroll+(delta<0?remaining:0);
      // A short final pane must not pin the dragged handle at the viewport bottom.
      if(viewport.style){
        viewport.style.paddingBottom=drag.padding;
        const extra=Math.max(0,target-(viewport.scrollHeight-viewport.clientHeight));
        if(extra)viewport.style.paddingBottom=`${(parseFloat(drag.padding)||0)+extra}px`;
      }
      viewport.scrollTop=target;
    }
  }
  bar.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    event.preventDefault();bar.focus({preventScroll:true});
    drag={id:event.pointerId,y:event.clientY,height:panel.getBoundingClientRect().height,previous:height,scroll:viewport?.scrollTop||0,padding:viewport?.style?.paddingBottom||'',upstream:upstream.map(control=>({control,height:control.getHeight()}))};
    bar.setPointerCapture(event.pointerId);root.classList.add('panel-height-dragging');
  });
  bar.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId)move(event.clientY-drag.y);});
  function finish(event){
    if(drag?.id!==event.pointerId)return;
    if(event.type!=='pointerup'){height=drag.previous;apply();for(const entry of drag.upstream)entry.control.resize(entry.height);if(viewport){if(viewport.style)viewport.style.paddingBottom=drag.padding;viewport.scrollTop=drag.scroll;}}
    for(const entry of drag.upstream)entry.control.save();
    drag=null;save();root.classList.remove('panel-height-dragging');
    if(bar.hasPointerCapture(event.pointerId))bar.releasePointerCapture(event.pointerId);
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])bar.addEventListener(type,finish);
  bar.addEventListener('dblclick',reset);
  bar.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown','Home','End','Enter'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    if(event.key==='Enter')reset();
    else{resize(event.key==='Home'?min:event.key==='End'?MAX:height+(event.key==='ArrowDown'?1:-1)*(event.shiftKey?32:8));save();}
  });
  apply();
  const remove=()=>{
    if(drag){const id=drag.id;drag=null;if(bar.hasPointerCapture(id))bar.releasePointerCapture(id);}
    root.classList.remove('panel-height-dragging');
  };
  return Object.assign(remove,{getHeight:()=>height,resize,save,min});
}
