(function(){
  const ICON={
    flipH:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 7v50"/><path d="M27 15 10 32l17 17Z"/><path d="m37 15 17 17-17 17Z"/></svg>',
    flipV:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 32h50"/><path d="m15 27 17-17 17 17Z"/><path d="m15 37 17 17 17-17Z"/></svg>',
    rotL:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M43 45H21V19"/><path d="m12 28 9-9 9 9"/></svg>',
    rotR:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M21 45h22V19"/><path d="m34 28 9-9 9 9"/></svg>',
    arrow:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 50 49 15"/><path d="M34 15h15v15"/></svg>',
    ruler:'<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-38 32 32)"><rect x="11" y="22" width="42" height="20" rx="2"/><path d="M18 22v8M24 22v12M30 22v8M36 22v12M42 22v8M48 22v12"/></g></svg>',
    angle:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 54 25 9"/><path d="M9 54h48"/><path d="M18 31c10 4 17 11 20 23" stroke-dasharray="3 4"/><circle cx="43" cy="31" r="7"/><path d="M31 35h5" stroke-dasharray="2 3"/></svg>',
    cobb:'<svg viewBox="0 0 78 64" aria-hidden="true"><path d="M6 38 25 18"/><path d="M25 18 38 53"/><path d="M11 36c8 5 13 12 15 22"/><path d="M42 15c7 0 14 3 21 8M40 27c8 1 15 3 23 7M42 39c7 0 13 2 20 7"/><path d="M44 11 57 8l10 8-5 10-15-3-5-9Z"/></svg>',
    crop:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 8v38c0 4 3 7 7 7h31"/><path d="M8 18h38c4 0 7 3 7 7v31"/><path d="M8 12h10M12 8v10M46 53h10M53 46v10"/></svg>',
    invert:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="15" y="15" width="34" height="34"/><path d="M49 15 15 49h34Z" fill="currentColor" stroke="none"/></svg>',
    layout:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="7" y="7" width="50" height="50" rx="2"/><path d="M32 7v50M7 32h50"/><path d="M32 20h25M20 32v25" opacity=".55"/></svg>'
  };
  let cropMode=false;
  let mainCropLayer=null;
  function iconWrap(svg,extra=''){return '<span class="v2-icon '+extra+'">'+svg+'</span>';}
  function refineTransforms(){
    const probe=document.getElementById('dv-flip-h'); if(probe?.dataset.v2Transform==='true')return;
    const map=[['dv-flip-h',ICON.flipH,'Giro horizontal'],['dv-flip-v',ICON.flipV,'Giro vertical'],['dv-rotate-left',ICON.rotL,'90° izquierda'],['dv-rotate-right',ICON.rotR,'90° derecha']];
    map.forEach(([id,svg,label])=>{const b=document.getElementById(id);if(!b)return;b.innerHTML=iconWrap(svg);b.classList.add('v2-transform-icon-only');b.setAttribute('aria-label',label);b.title=label;b.dataset.v2Transform='true';});
  }
  function refineTip(){
    if(document.querySelector('.v2-tool-tip'))return;
    const tools=document.getElementById('dv-quad-herramientas');if(!tools)return;
    const tip=[...tools.querySelectorAll('span')].find(s=>s.textContent.includes('Clic derecho sobre una flecha'));
    if(tip){tip.classList.add('v2-tool-tip');tip.innerHTML='<span class="v2-bulb" aria-hidden="true">💡</span><span>Clic derecho sobre una flecha o texto para borrarlo individualmente</span>';}
  }
  function createCropButton(){
    let b=document.getElementById('dv-tool-crop');if(b)return b;
    b=document.createElement('button');b.type='button';b.id='dv-tool-crop';b.className='dv-btn secondary v2-measure-button';b.title='Cortar imagen';b.setAttribute('aria-label','Cortar imagen');b.innerHTML=iconWrap(ICON.crop);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setCropMode(!cropMode);});return b;
  }
  function refineMeasurements(){
    if(document.getElementById('v2-measure-top'))return;
    const grid=document.querySelector('#dv-quad-herramientas .dv-tool-grid'),arrow=document.getElementById('dv-tool-arrow'),length=document.getElementById('dv-tool-length'),angle=document.getElementById('dv-tool-angle'),cobb=document.getElementById('dv-tool-cobb'),invert=document.getElementById('dv-invert'),reset=document.getElementById('dv-wlww-reset');
    if(!grid||!arrow||!length||!angle||!cobb||!invert||!reset)return;
    const crop=createCropButton();[arrow,length,angle,cobb,invert,reset,crop].forEach(b=>b.classList.add('v2-measure-button'));
    arrow.innerHTML=iconWrap(ICON.arrow);arrow.title='Flecha';arrow.setAttribute('aria-label','Flecha');
    angle.innerHTML=iconWrap(ICON.angle);angle.title='Ángulo';angle.setAttribute('aria-label','Ángulo');
    length.innerHTML=iconWrap(ICON.ruler);length.title='Longitud';length.setAttribute('aria-label','Longitud');
    cobb.innerHTML='<span class="v2-cobb-wrap">'+iconWrap(ICON.cobb)+'<span class="v2-cobb-label">Cobb</span></span>';cobb.title='Ángulo de Cobb';cobb.setAttribute('aria-label','Ángulo de Cobb');
    invert.innerHTML=iconWrap(ICON.invert);invert.title='Invertir negativo/positivo';invert.setAttribute('aria-label','Invertir negativo/positivo');
    reset.innerHTML='<span class="v2-reset-word">RESET</span>';reset.title='Restablecer nivel y ancho de ventana';reset.setAttribute('aria-label','RESET');
    const top=document.createElement('div');top.id='v2-measure-top';top.className='v2-measure-top';grid.parentElement.insertBefore(top,grid);
    const second=document.createElement('div');second.id='v2-measure-second';second.className='v2-measure-second';top.insertAdjacentElement('afterend',second);
    const bottom=document.createElement('div');bottom.id='v2-measure-bottom';bottom.className='v2-measure-bottom';second.insertAdjacentElement('afterend',bottom);
    top.append(arrow,angle,length);second.append(crop,cobb);bottom.append(invert,reset);grid.style.display='none';
  }
  function refineViewMenu(){const menu=document.getElementById('dv-view-dropdown');if(!menu||menu.classList.contains('v2-view-menu-two'))return;['dv-toggle-measurements','dv-show-tags'].forEach(id=>document.getElementById(id)?.remove());menu.classList.add('v2-view-menu-two');}
  function refineLayoutControl(){
    const opener=document.getElementById('premium-layout-opener'),menu=document.getElementById('premium-layout-dropdown');if(!opener||!menu||opener.dataset.v2LayoutRefined==='true')return;opener.dataset.v2LayoutRefined='true';
    opener.innerHTML='<span class="v2-layout-opener-icon">'+ICON.layout+'</span><span class="premium-layout-caret"></span>';opener.classList.add('v2-layout-opener');
    const layouts={1:'<span class="v2-layout-sketch one"><i></i></span>',2:'<span class="v2-layout-sketch two"><i></i><i></i></span>',3:'<span class="v2-layout-sketch three"><i></i><i></i><i></i></span>',4:'<span class="v2-layout-sketch four"><i></i><i></i><i></i><i></i></span>'};
    menu.querySelectorAll('button[data-layout]').forEach(b=>{b.innerHTML=layouts[Number(b.dataset.layout)]||layouts[1];});menu.classList.add('v2-layout-dropdown');
  }
  function refineResolution(){
    const sel=document.getElementById('dv-res');if(!sel||document.getElementById('v2-res-wrap'))return;sel.classList.add('v2-native-res-hidden');
    const wrap=document.createElement('div');wrap.id='v2-res-wrap';wrap.className='v2-res-wrap';wrap.innerHTML='<button type="button" class="v2-res-main" id="v2-res-main">2K (alta resolución)</button><button type="button" class="v2-res-arrow" id="v2-res-arrow" aria-label="Más resoluciones"><span></span></button><div class="v2-res-menu" id="v2-res-menu"><button type="button" data-res="4">4K UHD</button></div>';sel.insertAdjacentElement('afterend',wrap);
    const main=wrap.querySelector('#v2-res-main'),arrow=wrap.querySelector('#v2-res-arrow'),menu=wrap.querySelector('#v2-res-menu');
    main.addEventListener('click',()=>{sel.value='2';sel.dispatchEvent(new Event('change',{bubbles:true}));main.textContent='2K (alta resolución)';menu.classList.remove('open');});
    arrow.addEventListener('click',e=>{e.stopPropagation();menu.classList.toggle('open');});
    menu.addEventListener('click',e=>{const b=e.target.closest('button[data-res]');if(!b)return;sel.value=b.dataset.res;sel.dispatchEvent(new Event('change',{bubbles:true}));main.textContent='4K UHD';menu.classList.remove('open');});document.addEventListener('click',()=>menu.classList.remove('open'));
  }
  function refineWatermark(){const img=document.querySelector('.premium-empty-watermark');if(img&&!img.classList.contains('v2-full-watermark')){img.src='viewer-watermark.webp';img.classList.add('v2-full-watermark');}}
  function setCropMode(on){cropMode=!!on;document.documentElement.classList.toggle('v2-crop-mode',cropMode);document.getElementById('dv-tool-crop')?.classList.toggle('active',cropMode);}
  function selectionBox(parent){let box=parent.querySelector(':scope > .v2-crop-selection');if(!box){box=document.createElement('div');box.className='v2-crop-selection';parent.appendChild(box);}return box;}
  function showSelection(box,x1,y1,x2,y2){const left=Math.min(x1,x2),top=Math.min(y1,y2),w=Math.abs(x2-x1),h=Math.abs(y2-y1);Object.assign(box.style,{display:'block',left:left+'px',top:top+'px',width:w+'px',height:h+'px'});return{left,top,width:w,height:h};}
  function installMainCrop(){
    const wrap=document.getElementById('dv-viewer-wrap'),canvas=document.getElementById('dv-canvas');if(!wrap||!canvas||wrap.dataset.v2CropBound==='true')return;wrap.dataset.v2CropBound='true';let drag=null;
    wrap.addEventListener('mousedown',e=>{if(!cropMode||e.button!==0||e.target.closest('#premium-multiview'))return;if(getComputedStyle(canvas).display==='none'&&!mainCropLayer)return;const r=wrap.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};selectionBox(wrap);e.preventDefault();e.stopImmediatePropagation();},true);
    wrap.addEventListener('mousemove',e=>{if(!drag)return;const r=wrap.getBoundingClientRect();showSelection(selectionBox(wrap),drag.x,drag.y,e.clientX-r.left,e.clientY-r.top);e.preventDefault();e.stopImmediatePropagation();},true);
    wrap.addEventListener('mouseup',e=>{if(!drag)return;const r=wrap.getBoundingClientRect(),rect=showSelection(selectionBox(wrap),drag.x,drag.y,e.clientX-r.left,e.clientY-r.top);drag=null;e.preventDefault();e.stopImmediatePropagation();if(rect.width<8||rect.height<8){selectionBox(wrap).style.display='none';return;}cropMain(rect,wrap,canvas);selectionBox(wrap).style.display='none';setCropMode(false);},true);
  }
  function cropMain(rect,wrap,canvas){
    const source=mainCropLayer||canvas,sr=source.getBoundingClientRect(),wr=wrap.getBoundingClientRect();const overlap={left:Math.max(rect.left,sr.left-wr.left),top:Math.max(rect.top,sr.top-wr.top)};overlap.right=Math.min(rect.left+rect.width,sr.right-wr.left);overlap.bottom=Math.min(rect.top+rect.height,sr.bottom-wr.top);if(overlap.right<=overlap.left||overlap.bottom<=overlap.top)return;
    const sx=(overlap.left-(sr.left-wr.left))*source.width/sr.width,sy=(overlap.top-(sr.top-wr.top))*source.height/sr.height,sw=(overlap.right-overlap.left)*source.width/sr.width,sh=(overlap.bottom-overlap.top)*source.height/sr.height;const crop=document.createElement('canvas');crop.width=Math.max(1,Math.round(sw));crop.height=Math.max(1,Math.round(sh));crop.getContext('2d').drawImage(source,sx,sy,sw,sh,0,0,crop.width,crop.height);if(mainCropLayer)mainCropLayer.remove();mainCropLayer=document.createElement('canvas');mainCropLayer.id='v2-main-crop-layer';mainCropLayer.width=crop.width;mainCropLayer.height=crop.height;mainCropLayer.getContext('2d').drawImage(crop,0,0);wrap.appendChild(mainCropLayer);canvas.style.visibility='hidden';bindStandalonePanZoom(mainCropLayer);
  }
  function bindStandalonePanZoom(layer){const st={zoom:1,x:0,y:0,drag:null};function apply(){layer.style.transform='translate('+st.x+'px,'+st.y+'px) scale('+st.zoom+')';}layer.addEventListener('wheel',e=>{e.preventDefault();st.zoom=Math.max(.5,Math.min(6,st.zoom*(e.deltaY<0?1.12:.89)));apply();},{passive:false});layer.addEventListener('mousedown',e=>{if(cropMode||e.button!==0)return;st.drag={x:e.clientX,y:e.clientY,px:st.x,py:st.y};e.preventDefault();});window.addEventListener('mousemove',e=>{if(!st.drag)return;st.x=st.drag.px+e.clientX-st.drag.x;st.y=st.drag.py+e.clientY-st.drag.y;apply();});window.addEventListener('mouseup',()=>st.drag=null);layer.addEventListener('dblclick',()=>{st.zoom=1;st.x=0;st.y=0;apply();});}
  function bindMultiCell(cell){if(cell.dataset.v2CropBound==='true')return;cell.dataset.v2CropBound='true';let drag=null;cell.addEventListener('mousedown',e=>{if(!cropMode||e.button!==0||!cell._premiumView?.source)return;const r=cell.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};selectionBox(cell);e.preventDefault();e.stopImmediatePropagation();},true);cell.addEventListener('mousemove',e=>{if(!drag)return;const r=cell.getBoundingClientRect();showSelection(selectionBox(cell),drag.x,drag.y,e.clientX-r.left,e.clientY-r.top);e.preventDefault();e.stopImmediatePropagation();},true);cell.addEventListener('mouseup',e=>{if(!drag)return;const r=cell.getBoundingClientRect(),rect=showSelection(selectionBox(cell),drag.x,drag.y,e.clientX-r.left,e.clientY-r.top);drag=null;e.preventDefault();e.stopImmediatePropagation();if(rect.width<8||rect.height<8){selectionBox(cell).style.display='none';return;}cropMultiCell(cell,rect);selectionBox(cell).style.display='none';setCropMode(false);},true);}
  function cropMultiCell(cell,rect){const canvas=cell.querySelector('canvas'),view=cell._premiumView;if(!canvas||!view?.source)return;const cr=canvas.getBoundingClientRect(),rr=cell.getBoundingClientRect();const left=Math.max(rect.left,cr.left-rr.left),top=Math.max(rect.top,cr.top-rr.top),right=Math.min(rect.left+rect.width,cr.right-rr.left),bottom=Math.min(rect.top+rect.height,cr.bottom-rr.top);if(right<=left||bottom<=top)return;const sx=(left-(cr.left-rr.left))*canvas.width/cr.width,sy=(top-(cr.top-rr.top))*canvas.height/cr.height,sw=(right-left)*canvas.width/cr.width,sh=(bottom-top)*canvas.height/cr.height;const out=document.createElement('canvas');out.width=Math.max(1,Math.round(sw));out.height=Math.max(1,Math.round(sh));out.getContext('2d').drawImage(canvas,sx,sy,sw,sh,0,0,out.width,out.height);view.source=out;view.zoom=1;view.panX=0;view.panY=0;cell._premiumRender?.();}
  function bindCropTargets(){installMainCrop();document.querySelectorAll('.premium-multiview-cell').forEach(bindMultiCell);}
  function bindResetCrop(){const reset=document.getElementById('dv-wlww-reset');if(!reset||reset.dataset.v2ResetBound==='true')return;reset.dataset.v2ResetBound='true';reset.addEventListener('click',()=>{if(mainCropLayer){mainCropLayer.remove();mainCropLayer=null;const c=document.getElementById('dv-canvas');if(c)c.style.visibility='visible';}setCropMode(false);});}
  function apply(){refineTransforms();refineTip();refineMeasurements();refineViewMenu();refineLayoutControl();refineResolution();refineWatermark();bindCropTargets();bindResetCrop();}
  function init(){let attempts=0;const t=setInterval(()=>{attempts++;apply();if(document.getElementById('dv-root')&&document.getElementById('premium-layout-opener')){clearInterval(t);const root=document.getElementById('dv-root');new MutationObserver(()=>{bindCropTargets();}).observe(root,{childList:true,subtree:true});}else if(attempts>160)clearInterval(t);},80);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
