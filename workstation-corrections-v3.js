(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  let distributionResetting=false;
  let popupOpen=null;
  let mainRightZoom=null;
  let lastRightZoomDragAt=0;

  const ICON={
    /* Thick, faithful visual language from the supplied references. */
    crop:`<span class="v3-icon-svg v3-crop-icon" aria-hidden="true"><svg viewBox="0 0 64 64"><path stroke-width="8" d="M18 5v39c0 4 3 7 7 7h34"/><path stroke-width="8" d="M5 18h39c4 0 7 3 7 7v34"/><path stroke-width="7" d="M5 12h13M12 5v13M46 52h13M52 46v13"/></svg></span>`,
    rotateLeft:`<span class="v3-icon-svg" aria-hidden="true"><svg viewBox="0 0 86 70"><path stroke-width="7" d="M17 7v50h58"/><path stroke-width="7" d="M14 7h13M14 57h13M70 51v12"/><path stroke-width="4" stroke-dasharray="5 6" d="M48 54c-1-13-5-22-14-29"/><path fill="currentColor" stroke="none" d="M31 18 16 26l16 10-3-7c7 4 12 10 15 18l4-2c-3-10-9-18-17-23Z"/><text x="46" y="35" fill="currentColor" stroke="none" font-size="18" font-weight="800" font-family="Arial,sans-serif">90°</text></svg></span>`,
    rotateRight:`<span class="v3-icon-svg" aria-hidden="true"><svg viewBox="0 0 86 70"><path stroke-width="7" d="M69 7v50H11"/><path stroke-width="7" d="M59 7h13M59 57h13M10 51v12"/><path stroke-width="4" stroke-dasharray="5 6" d="M38 54c1-13 5-22 14-29"/><path fill="currentColor" stroke="none" d="m55 18 15 8-16 10 3-7c-7 4-12 10-15 18l-4-2c3-10 9-18 17-23Z"/><text x="20" y="35" fill="currentColor" stroke="none" font-size="18" font-weight="800" font-family="Arial,sans-serif">90°</text></svg></span>`,
    cobb:`<span class="v3-icon-svg v3-cobb-icon" aria-hidden="true"><svg viewBox="0 0 96 72"><g stroke-width="3.5"><path d="M7 47 30 22M14 55 43 18M14 46c8-8 15-11 24-9M15 47c8 6 14 13 18 21"/><path d="M47 9c7 0 14 3 20 7l-4 10c-8 0-15-2-22-5l2-9c1-2 2-3 4-3Z"/><path d="M45 28c7 0 14 2 21 6l-3 10c-8 1-15-1-22-4l1-9c0-2 1-3 3-3Z"/><path d="M45 47c7 0 14 2 20 6l-3 10c-7 1-14 0-21-4l1-9c0-2 1-3 3-3Z"/></g></svg><span class="v3-cobb-word">Cobb</span></span>`,
    ruler:`<span class="v3-icon-svg" aria-hidden="true"><svg viewBox="0 0 64 64"><g transform="rotate(-38 32 32)" stroke-width="3"><rect x="10" y="21" width="44" height="22" rx="2"/><path d="M17 21v8M23 21v12M29 21v8M35 21v12M41 21v8M47 21v12"/></g></svg></span>`,
    angle:`<span class="v3-icon-svg" aria-hidden="true"><svg viewBox="0 0 64 64"><path stroke-width="4" d="M9 55 25 8M9 55h48"/><path stroke-width="3" d="M18 30c10 4 17 12 20 25" stroke-dasharray="4 5"/><circle cx="43" cy="30" r="7" stroke-width="3"/><path stroke-width="3" d="M32 34h5" stroke-dasharray="2 3"/></svg></span>`,
    arrow:`<span class="v3-icon-svg" aria-hidden="true"><svg viewBox="0 0 64 64"><path stroke-width="3.5" d="M14 50 50 14M35 14h15v15"/></svg></span>`,
    invert:`<span class="v3-icon-svg" aria-hidden="true"><svg viewBox="0 0 64 64"><rect x="15" y="15" width="34" height="34" stroke-width="3"/><path d="M49 15 15 49h34Z" fill="currentColor" stroke="none"/></svg></span>`
  };

  function byText(root,needle){
    const wanted=String(needle).trim().toLowerCase();
    return $$('button,a,span,div',root).find(el=>String(el.textContent||'').trim().toLowerCase()===wanted)||null;
  }
  function section(title,cls){
    const s=document.createElement('section');s.className='v3-section '+(cls||'');
    const h=document.createElement('div');h.className='v3-section-title';h.textContent=title;
    const b=document.createElement('div');b.className='v3-section-body';s.append(h,b);return {section:s,body:b};
  }
  function buttonByIdOrText(ids,texts){
    for(const id of ids||[]){const el=document.getElementById(id);if(el)return el;}
    const panel=document.getElementById('dv-quad-herramientas');if(!panel)return null;
    for(const t of texts||[]){const el=byText(panel,t);if(el?.tagName==='BUTTON')return el;const b=el?.closest?.('button');if(b)return b;}
    return null;
  }
  function markerButtons(panel){
    const known=['dv-marker-d','dv-marker-i','dv-marker-ld','dv-marker-li'].map(id=>document.getElementById(id)).filter(Boolean);
    if(known.length===4)return known;
    const labels=['D','I','LD','LI'];
    return labels.map(label=>$$('button',panel).find(b=>String(b.textContent||'').trim()===label)).filter(Boolean);
  }
  function hideOldHeadings(panel){
    const phrases=['MARCADORES','TRANSFORMAR','MEDICIÓN Y ANOTACIÓN','MEDICION Y ANOTACION','VISTA / PRESET'];
    $$('div,span,p,label',panel).forEach(el=>{
      if(el.closest('.v3-section,.v3-format-block'))return;
      const t=String(el.textContent||'').trim().toUpperCase();
      if(phrases.includes(t) && el.children.length===0) el.classList.add('v3-obsolete');
    });
  }
  function removePresets(panel){
    ['dv-preset-bone','dv-preset-soft'].forEach(id=>document.getElementById(id)?.remove());
    $$('button',panel).forEach(b=>{const t=String(b.textContent||'').trim().toLowerCase();if(t==='óseo'||t==='oseo'||t==='soft')b.remove();});
  }
  function setToolArtwork(){
    const arrow=buttonByIdOrText(['dv-tool-arrow'],['Flecha']);
    const angle=buttonByIdOrText(['dv-tool-angle'],['Ángulo','Angulo']);
    const ruler=buttonByIdOrText(['dv-tool-length'],['Length','Longitud']);
    const crop=buttonByIdOrText(['dv-tool-crop'],['Cortar']);
    const cobb=buttonByIdOrText(['dv-tool-cobb'],['Cobb']);
    const invert=buttonByIdOrText(['dv-invert'],[]);
    const reset=buttonByIdOrText(['dv-wlww-reset'],['RESET','Reset']);
    if(arrow){arrow.innerHTML=ICON.arrow;arrow.title='Flecha';arrow.setAttribute('aria-label','Flecha');}
    if(angle){angle.innerHTML=ICON.angle;angle.title='Ángulo';angle.setAttribute('aria-label','Ángulo');}
    if(ruler){ruler.innerHTML=ICON.ruler;ruler.title='Regla';ruler.setAttribute('aria-label','Regla');}
    if(crop){crop.innerHTML=ICON.crop;crop.title='Cortar';crop.setAttribute('aria-label','Cortar');}
    if(cobb){cobb.innerHTML=ICON.cobb;cobb.title='Ángulo de Cobb';cobb.setAttribute('aria-label','Ángulo de Cobb');}
    if(invert){invert.innerHTML=ICON.invert;invert.title='Invertir';invert.setAttribute('aria-label','Invertir');}
    if(reset){reset.innerHTML='<span class="v3-reset-word">RESET</span>';reset.title='RESET';reset.setAttribute('aria-label','RESET');}
    return {arrow,angle,ruler,crop,cobb,invert,reset};
  }
  function setRotationArtwork(){
    const l=document.getElementById('dv-rotate-left'),r=document.getElementById('dv-rotate-right');
    if(l){l.innerHTML=ICON.rotateLeft;l.title='90° izquierda';l.setAttribute('aria-label','90° izquierda');}
    if(r){r.innerHTML=ICON.rotateRight;r.title='90° derecha';r.setAttribute('aria-label','90° derecha');}
  }
  function reorderRail(){
    const panel=document.getElementById('dv-quad-herramientas');if(!panel||panel.dataset.v3Ordered==='true')return false;
    const marks=markerButtons(panel);const tools=setToolArtwork();setRotationArtwork();removePresets(panel);
    const flips=[document.getElementById('dv-flip-h'),document.getElementById('dv-flip-v'),document.getElementById('dv-rotate-left'),document.getElementById('dv-rotate-right')].filter(Boolean);
    const undo=buttonByIdOrText(['dv-undo','dv-annotations-undo'],[]),redo=buttonByIdOrText(['dv-redo','dv-annotations-redo'],[]);
    if(marks.length<4||!tools.arrow||!tools.angle||!tools.ruler||!tools.crop||!tools.cobb||!tools.invert||!tools.reset||flips.length<4)return false;

    const anchor=panel.querySelector('.v3-sections-anchor')||document.createElement('div');anchor.className='v3-sections-anchor';
    const panelHeader=panel.querySelector(':scope > .dv-tool-head,:scope > .dv-panel-head,:scope > header');
    if(!anchor.isConnected){if(panelHeader)panelHeader.insertAdjacentElement('afterend',anchor);else panel.prepend(anchor);}

    const s1=section('MARCADORES','v3-markers'),mg=document.createElement('div');mg.className='v3-marker-grid';marks.forEach(b=>mg.appendChild(b));s1.body.appendChild(mg);
    const s2=section('HERRAMIENTAS','v3-tools'),stack=document.createElement('div');stack.className='v3-tools-stack';
    const row3=document.createElement('div');row3.className='v3-tools-row-3';[tools.arrow,tools.angle,tools.ruler].forEach(b=>row3.appendChild(b));
    const row2=document.createElement('div');row2.className='v3-tools-row-2';[tools.crop,tools.cobb].forEach(b=>row2.appendChild(b));
    const rowB=document.createElement('div');rowB.className='v3-tools-row-2';[tools.invert,tools.reset].forEach(b=>rowB.appendChild(b));stack.append(row3,row2,rowB);s2.body.appendChild(stack);
    const s3=section('GIROS','v3-giros'),gg=document.createElement('div');gg.className='v3-giro-grid';flips.forEach(b=>gg.appendChild(b));s3.body.appendChild(gg);
    const s4=section('DESHACER / REHACER','v3-history'),hg=document.createElement('div');hg.className='v3-history-grid';if(undo)hg.appendChild(undo);if(redo)hg.appendChild(redo);s4.body.appendChild(hg);
    anchor.replaceChildren(s1.section,s2.section,s3.section,s4.section);
    hideOldHeadings(panel);panel.dataset.v3Ordered='true';return true;
  }

  function closePopups(except){
    $$('.v3-popup-open').forEach(m=>{if(m!==except)m.classList.remove('v3-popup-open');});
    if(popupOpen&&popupOpen!==except)popupOpen=null;
  }
  function placePopup(menu,opener){
    if(menu.parentElement!==document.body)document.body.appendChild(menu);
    menu.classList.add('v3-popup');
    const r=opener.getBoundingClientRect();
    const width=Math.max(menu.offsetWidth||150,menu.id==='premium-layout-dropdown'?150:82);
    let left=r.left;let top=r.bottom+6;
    if(left+width>window.innerWidth-8)left=Math.max(8,window.innerWidth-width-8);
    if(top+(menu.offsetHeight||110)>window.innerHeight-8)top=Math.max(8,r.top-(menu.offsetHeight||110)-6);
    menu.style.left=Math.round(left)+'px';menu.style.top=Math.round(top)+'px';
  }
  function togglePopup(menu,opener){
    const opening=!menu.classList.contains('v3-popup-open');closePopups(opening?menu:null);
    if(opening){placePopup(menu,opener);menu.classList.add('v3-popup-open');popupOpen=menu;}else{menu.classList.remove('v3-popup-open');popupOpen=null;}
  }
  function installPopupDiscipline(){
    if(document.documentElement.dataset.v3PopupBound==='true')return;document.documentElement.dataset.v3PopupBound='true';
    document.addEventListener('pointerdown',e=>{
      const open=$('.v3-popup-open');if(!open)return;
      const eye=document.getElementById('dv-view-opener'),layout=document.getElementById('premium-layout-opener'),format=document.getElementById('v3-format-arrow');
      if(open.contains(e.target)||eye?.contains(e.target)||layout?.contains(e.target)||format?.contains(e.target))return;
      closePopups();
    },true);
    document.addEventListener('focusin',e=>{const open=$('.v3-popup-open');if(open&&!open.contains(e.target))closePopups();},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closePopups();});
    window.addEventListener('resize',()=>closePopups(),{passive:true});window.addEventListener('scroll',()=>closePopups(),{passive:true,capture:true});
  }
  function controlViewPopup(){
    const opener=document.getElementById('dv-view-opener'),menu=document.getElementById('dv-view-dropdown');if(!opener||!menu||opener.dataset.v3Popup==='true')return;
    opener.dataset.v3Popup='true';menu.classList.add('v3-popup');
    opener.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();togglePopup(menu,opener);},true);
    menu.addEventListener('click',()=>setTimeout(()=>closePopups(),0));
  }

  function layoutArtwork(menu){
    const buttons=$$('button[data-layout]',menu);if(buttons.length<4)return [];
    const art=[
      '<span class="v3-layout-icon vsplit"><i></i></span>',
      '<span class="v3-layout-icon hsplit"><i></i></span>',
      '<span class="v3-layout-icon hthree"><i></i><i></i></span>',
      '<span class="v3-layout-icon asym"><i></i><i></i></span>'
    ];
    const modes=[['v2',2],['h2',2],['h3',3],['asym3',3]];
    buttons.slice(0,4).forEach((b,i)=>{b.innerHTML=art[i];b.dataset.v3Mode=modes[i][0];b.dataset.v3Count=String(modes[i][1]);b.title=['2 columnas','2 filas','3 filas','1 izquierda + 2 derecha'][i];b.setAttribute('aria-label',b.title);});
    buttons.slice(4).forEach(b=>b.remove());return buttons.slice(0,4);
  }
  function applyMultiviewClass(mode){
    const mv=document.getElementById('premium-multiview');if(!mv)return;
    ['v3-layout-v2','v3-layout-h2','v3-layout-h3','v3-layout-asym3'].forEach(c=>mv.classList.remove(c));
    if(mode)mv.classList.add('v3-layout-'+mode);
    bindMultiviewInteractions();
  }
  async function activateDistributionButton(b){
    const mode=b.dataset.v3Mode,count=Number(b.dataset.v3Count||2);b.dataset.layout=String(count);
    queueMicrotask(()=>{if(!distributionResetting)b.dataset.layout=b.dataset.v3OriginalLayout||b.dataset.layout;});
    await nextFrame();applyMultiviewClass(mode);
  }
  function controlDistributionPopup(){
    const opener=document.getElementById('premium-layout-opener'),menu=document.getElementById('premium-layout-dropdown');if(!opener||!menu||opener.dataset.v3Popup==='true')return;
    opener.dataset.v3Popup='true';opener.title='Distribución';opener.setAttribute('aria-label','Distribución');menu.classList.add('v3-popup','v3-distribution-menu');
    const buttons=layoutArtwork(menu);buttons.forEach((b,i)=>{
      b.dataset.v3OriginalLayout=b.dataset.layout||String(i+1);
      b.addEventListener('click',e=>{
        if(distributionResetting)return;
        const count=Number(b.dataset.v3Count||2);b.dataset.layout=String(count);
        setTimeout(()=>{b.dataset.layout=b.dataset.v3OriginalLayout;},0);
        requestAnimationFrame(()=>requestAnimationFrame(()=>applyMultiviewClass(b.dataset.v3Mode)));
        closePopups();
      },true);
    });
    opener.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();togglePopup(menu,opener);},true);
  }
  function restoreNaturalDistribution(){
    const menu=document.getElementById('premium-layout-dropdown');const b=menu?.querySelector('button[data-layout]');
    if(b){distributionResetting=true;const old=b.dataset.layout;b.dataset.layout='1';b.click();b.dataset.layout=old;distributionResetting=false;}
    const mv=document.getElementById('premium-multiview');if(mv){['v3-layout-v2','v3-layout-h2','v3-layout-h3','v3-layout-asym3'].forEach(c=>mv.classList.remove(c));mv.classList.remove('active','show');mv.style.display='none';}
    const canvas=document.getElementById('dv-canvas');if(canvas){canvas.style.visibility='';canvas.style.display='';}
    closePopups();
  }

  function installFormatOrientation(){
    const panel=document.getElementById('dv-quad-herramientas'),view=document.getElementById('dv-view-opener'),layout=document.getElementById('premium-layout-opener');if(!panel||!view||!layout||document.getElementById('v3-format-block'))return;
    const block=document.createElement('div');block.id='v3-format-block';block.className='v3-format-block';
    const title=document.createElement('div');title.className='v3-section-title';title.textContent='FORMATO / ORIENTACIÓN';
    const control=document.createElement('div');control.className='v3-format-control';
    const main=document.createElement('button');main.type='button';main.className='dv-btn secondary v3-format-main';main.title='Formato / Orientación';main.innerHTML='<span class="v3-format-symbol"><span class="v3-format-page"></span><span class="v3-format-turn"></span></span>';
    const arrow=document.createElement('button');arrow.type='button';arrow.id='v3-format-arrow';arrow.className='dv-btn secondary v3-format-arrow';arrow.setAttribute('aria-label','Opciones de formato / orientación');
    control.append(main,arrow);block.append(title,control);
    const row=document.createElement('div');row.className='v3-view-row';row.append(view,layout);block.appendChild(row);
    const host=panel.querySelector('.v3-sections-anchor');if(host)host.insertAdjacentElement('afterend',block);else panel.appendChild(block);
    const menu=document.createElement('div');menu.id='v3-format-menu';menu.className='v3-popup';menu.innerHTML='<button type="button" class="dv-btn secondary" data-orientation="horizontal" title="Horizontal" aria-label="Horizontal"><span class="v3-format-rect horizontal"></span></button><button type="button" class="dv-btn secondary" data-orientation="vertical" title="Vertical" aria-label="Vertical"><span class="v3-format-rect vertical"></span></button>';document.body.appendChild(menu);
    arrow.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();togglePopup(menu,arrow);},true);
    main.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();togglePopup(menu,arrow);});
    menu.addEventListener('click',e=>{const b=e.target.closest('button[data-orientation]');if(!b)return;orientActiveImage(b.dataset.orientation);closePopups();});
  }
  function orientActiveImage(kind){
    const canvas=document.getElementById('dv-canvas');if(!canvas)return;const r=canvas.getBoundingClientRect();if(r.width<2||r.height<2)return;
    const isHorizontal=r.width>=r.height,wantHorizontal=kind==='horizontal';if(isHorizontal===wantHorizontal)return;
    const rotate=document.getElementById('dv-rotate-right');if(rotate)rotate.click();
  }

  function moveStudyCount(){
    const clear=$$('a,button,span,div').find(el=>String(el.textContent||'').trim().toLowerCase()==='limpiar toda la lista');if(!clear)return;
    const root=clear.closest('section,.dv-panel,.dv-card,.panel')||clear.parentElement?.parentElement||document.body;
    const candidates=$$('div,span,p',root).filter(el=>/\d+\s+estudio\(s\)\s+cargado\(s\)/i.test(String(el.textContent||'')));
    let count=candidates.find(el=>!el.contains(clear));if(!count)count=$$('div,span,p').find(el=>/\d+\s+estudio\(s\)\s+cargado\(s\)/i.test(String(el.textContent||'')));if(!count)return;
    count.classList.add('v3-study-count');clear.classList.add('v3-clear-list-anchor');
    const clearBlock=clear.closest('a,button')||clear;if(clearBlock.parentElement)clearBlock.parentElement.insertBefore(count,clearBlock);
  }

  function anyDrawingToolActive(){
    return ['dv-tool-arrow','dv-tool-text','dv-tool-length','dv-tool-angle','dv-tool-cobb','dv-tool-crop'].some(id=>document.getElementById(id)?.classList.contains('active'))||document.documentElement.classList.contains('v2-crop-mode');
  }
  function clampInput(input,value){const min=Number(input.min),max=Number(input.max);if(Number.isFinite(min))value=Math.max(min,value);if(Number.isFinite(max))value=Math.min(max,value);return value;}
  function installMainWindowLevel(){
    const wrap=document.getElementById('dv-viewer-wrap');if(!wrap||wrap.dataset.v3Wlww==='true')return;wrap.dataset.v3Wlww='true';let drag=null;
    const wl=()=>document.getElementById('dv-wl')||$('input[id*="wl" i]');const ww=()=>document.getElementById('dv-ww')||$('input[id*="ww" i]');
    wrap.addEventListener('mousedown',e=>{
      if(e.button!==0||anyDrawingToolActive()||e.target.closest('#premium-multiview'))return;const a=wl(),b=ww();if(!a||!b)return;
      drag={x:e.clientX,y:e.clientY,wl:Number(a.value)||0,ww:Number(b.value)||1,wlEl:a,wwEl:b};e.preventDefault();e.stopImmediatePropagation();
    },true);
    window.addEventListener('mousemove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;const wwSpan=Math.max(20,Number(drag.wwEl.max)-Number(drag.wwEl.min)||2000),wlSpan=Math.max(20,Number(drag.wlEl.max)-Number(drag.wlEl.min)||1000);drag.wwEl.value=String(clampInput(drag.wwEl,drag.ww+dx*(wwSpan/700)));drag.wlEl.value=String(clampInput(drag.wlEl,drag.wl-dy*(wlSpan/700)));drag.wwEl.dispatchEvent(new Event('input',{bubbles:true}));drag.wlEl.dispatchEvent(new Event('input',{bubbles:true}));});
    window.addEventListener('mouseup',e=>{if(!drag||e.button!==0)return;drag.wwEl.dispatchEvent(new Event('change',{bubbles:true}));drag.wlEl.dispatchEvent(new Event('change',{bubbles:true}));drag=null;});
  }
  function installMainRightZoom(){
    const wrap=document.getElementById('dv-viewer-wrap');if(!wrap||wrap.dataset.v3RightZoom==='true')return;wrap.dataset.v3RightZoom='true';
    wrap.addEventListener('mousedown',e=>{if(e.button!==2||e.target.closest('#premium-multiview'))return;mainRightZoom={x:e.clientX,y:e.clientY,lastY:e.clientY,dragged:false};},true);
    window.addEventListener('mousemove',e=>{if(!mainRightZoom)return;const total=Math.hypot(e.clientX-mainRightZoom.x,e.clientY-mainRightZoom.y);if(total>4)mainRightZoom.dragged=true;if(!mainRightZoom.dragged)return;const dy=e.clientY-mainRightZoom.lastY;if(Math.abs(dy)<3)return;mainRightZoom.lastY=e.clientY;const target=document.getElementById('dv-viewer-wrap');if(target){target.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:dy>0?120:-120,clientX:e.clientX,clientY:e.clientY}));}e.preventDefault();});
    window.addEventListener('mouseup',e=>{if(e.button!==2||!mainRightZoom)return;if(mainRightZoom.dragged)lastRightZoomDragAt=Date.now();mainRightZoom=null;});
    wrap.addEventListener('contextmenu',e=>{if(mainRightZoom?.dragged||Date.now()-lastRightZoomDragAt<350){e.preventDefault();e.stopImmediatePropagation();}},true);
    wrap.addEventListener('dblclick',e=>{if(e.target.closest('#premium-multiview'))return;try{window.fitCanvasToContainer?.();}catch(_){ }const canvas=document.getElementById('dv-canvas');if(canvas)canvas.style.transform='';},true);
  }

  function bindMultiviewInteractions(){
    const mv=document.getElementById('premium-multiview');if(!mv)return;
    $$('.premium-multiview-cell',mv).forEach(cell=>{
      if(cell.dataset.v3Interaction==='true')return;cell.dataset.v3Interaction='true';cell._v3Visual={brightness:1,contrast:1};let left=null,right=null;
      const canvas=()=>cell.querySelector('canvas');const applyVisual=()=>{const c=canvas();if(c)c.style.filter=`brightness(${cell._v3Visual.brightness}) contrast(${cell._v3Visual.contrast})`;};
      cell.addEventListener('mousedown',e=>{
        if(document.documentElement.classList.contains('v2-crop-mode'))return;
        if(e.button===0){left={x:e.clientX,y:e.clientY,b:cell._v3Visual.brightness,c:cell._v3Visual.contrast};cell.classList.add('v3-wlww-active');e.preventDefault();e.stopImmediatePropagation();}
        if(e.button===2){right={x:e.clientX,y:e.clientY,lastY:e.clientY,dragged:false};cell.classList.add('v3-right-zoom');e.preventDefault();e.stopImmediatePropagation();}
      },true);
      window.addEventListener('mousemove',e=>{if(left){const dx=e.clientX-left.x,dy=e.clientY-left.y;cell._v3Visual.contrast=Math.max(.25,Math.min(3,left.c+dx/240));cell._v3Visual.brightness=Math.max(.25,Math.min(3,left.b-dy/240));applyVisual();}if(right){if(Math.hypot(e.clientX-right.x,e.clientY-right.y)>4)right.dragged=true;if(right.dragged&&Math.abs(e.clientY-right.lastY)>=3){const dy=e.clientY-right.lastY;right.lastY=e.clientY;cell.dispatchEvent(new WheelEvent('wheel',{bubbles:false,cancelable:true,deltaY:dy>0?120:-120,clientX:e.clientX,clientY:e.clientY}));}}});
      window.addEventListener('mouseup',e=>{if(e.button===0&&left){left=null;cell.classList.remove('v3-wlww-active');}if(e.button===2&&right){if(right.dragged)lastRightZoomDragAt=Date.now();right=null;cell.classList.remove('v3-right-zoom');}});
      cell.addEventListener('contextmenu',e=>{if(right?.dragged||Date.now()-lastRightZoomDragAt<350){e.preventDefault();e.stopImmediatePropagation();}},true);
      cell.addEventListener('dblclick',()=>{cell._v3Visual={brightness:1,contrast:1};applyVisual();});
    });
  }

  function fileListRoot(){return document.getElementById('dv-file-list')||document.getElementById('dv-files')||$('.dv-file-list')||$('.premium-file-list')||$('[data-file-list]');}
  function loadedFileItems(){const root=fileListRoot();if(!root)return [];let items=$$('[data-index],[data-file-index],[data-premium-file-index],.dv-file-item,.premium-file-item',root).filter(el=>el.closest('button')!==el);if(!items.length)items=Array.from(root.children).filter(el=>/\.dcm\b/i.test(String(el.textContent||'')));return items.filter((v,i,a)=>a.indexOf(v)===i);}
  function installDirectViewerDrop(){
    const wrap=document.getElementById('dv-viewer-wrap');if(!wrap||wrap.dataset.v3Drop==='true')return;wrap.dataset.v3Drop='true';
    document.addEventListener('dragstart',e=>{const items=loadedFileItems();const item=items.find(x=>x===e.target||x.contains(e.target));if(!item||!e.dataTransfer)return;const idx=items.indexOf(item);e.dataTransfer.setData('application/x-imedicom-v3-index',String(idx));e.dataTransfer.effectAllowed='copyMove';},true);
    wrap.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';wrap.classList.add('v3-drag-over');});
    wrap.addEventListener('dragleave',e=>{if(!wrap.contains(e.relatedTarget))wrap.classList.remove('v3-drag-over');});
    wrap.addEventListener('drop',e=>{
      if(e.target.closest('#premium-multiview'))return;wrap.classList.remove('v3-drag-over');const dt=e.dataTransfer;if(!dt)return;const idx=Number(dt.getData('application/x-imedicom-v3-index'));if(Number.isInteger(idx)&&idx>=0){const item=loadedFileItems()[idx];if(item){e.preventDefault();(item.querySelector('button,[role="button"]')||item).click();return;}}
      if(dt.files?.length){const input=$('input[type="file"]');if(input){e.preventDefault();try{const transfer=new DataTransfer();Array.from(dt.files).forEach(f=>transfer.items.add(f));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));}catch(_){const drop=document.getElementById('dv-drop');if(drop){try{drop.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));}catch(__){}}}}}
    },true);
  }

  function installResetDistribution(){const reset=document.getElementById('dv-wlww-reset');if(reset&&reset.dataset.v3LayoutReset!=='true'){reset.dataset.v3LayoutReset='true';reset.addEventListener('click',()=>restoreNaturalDistribution());}}

  function arrangeLowerControls(){
    const panel=document.getElementById('dv-quad-herramientas');if(!panel)return;removePresets(panel);controlViewPopup();controlDistributionPopup();installFormatOrientation();
    /* Ensure text/colour controls and the existing help tip remain below history and above format/orientation without overlap. */
    const block=document.getElementById('v3-format-block');const anchor=panel.querySelector('.v3-sections-anchor');if(block&&anchor){const tip=panel.querySelector('.v2-tool-tip');const textControls=document.getElementById('dv-text-controls')||panel.querySelector('.premium-text-controls,.dv-text-controls');if(textControls)anchor.insertAdjacentElement('afterend',textControls);if(tip){if(textControls)textControls.insertAdjacentElement('afterend',tip);else anchor.insertAdjacentElement('afterend',tip);tip.insertAdjacentElement('afterend',block);}}
  }

  function init(){
    if(!document.documentElement.dataset.viewerIntegration){setTimeout(init,60);return;}
    const panel=document.getElementById('dv-quad-herramientas');if(!panel){setTimeout(init,60);return;}
    reorderRail();arrangeLowerControls();installPopupDiscipline();installResetDistribution();moveStudyCount();installMainWindowLevel();installMainRightZoom();installDirectViewerDrop();bindMultiviewInteractions();
    if(!document.documentElement.dataset.v3Observer){document.documentElement.dataset.v3Observer='true';let scheduled=false;const obs=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;moveStudyCount();removePresets(panel);bindMultiviewInteractions();});});obs.observe(document.body,{childList:true,subtree:true});}
    document.documentElement.dataset.workstationCorrections='v3-20260814';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
