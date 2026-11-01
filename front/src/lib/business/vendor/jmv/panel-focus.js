// Expand the existing DOM so recorded values and scroll positions stay intact.
export function installPanelFocus(panel,header,button){
  const control=button||document.createElement('button');
  control.type='button';control.classList.add('tv-panel-focus');
  if(!button)header.append(control);
  const label=header.dataset.panelLabel||header.querySelector('strong')?.textContent||header.firstChild?.textContent?.trim()||'창';
  let saved=[];
  function toggle(force){
    const expanded=force??!panel.classList.contains('tv-panel-maximized');
    const positions=[panel,...panel.querySelectorAll('*')].filter(el=>el.scrollTop||el.scrollLeft).map(el=>[el,el.scrollTop,el.scrollLeft]);
    if(expanded)saved=positions;
    panel.classList.toggle('tv-panel-maximized',expanded);
    control.textContent=expanded?'복원':'확대';
    control.setAttribute('aria-label',`${label} ${expanded?'복원':'최대화'}`);
    control.setAttribute('aria-expanded',String(expanded));
    for(const [el,top,left] of expanded?positions:saved){el.scrollTop=top;el.scrollLeft=left;}
  }
  const click=()=>toggle();
  const double=event=>{if(event.target.closest('button,select,input,a,summary'))return;event.preventDefault();toggle();};
  const escape=event=>{if(event.key==='Escape'&&panel.classList.contains('tv-panel-maximized')){toggle(false);control.focus({preventScroll:true});event.stopPropagation();}};
  control.addEventListener('click',click);header.addEventListener('dblclick',double);document.addEventListener('keydown',escape);
  header.title='제목 더블클릭: 최대화 · 다시 더블클릭 또는 Esc: 복원';
  toggle(false);
  return ()=>{control.removeEventListener('click',click);header.removeEventListener('dblclick',double);document.removeEventListener('keydown',escape);panel.classList.remove('tv-panel-maximized');};
}
