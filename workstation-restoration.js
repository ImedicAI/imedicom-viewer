(function(){
  const SVG={
    flipH:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6v36"/><path d="M20 12 8 24l12 12Z"/><path d="m28 12 12 12-12 12Z"/></svg>',
    flipV:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 24h36"/><path d="m12 20 12-12 12 12Z"/><path d="m12 28 12 12 12-12Z"/></svg>',
    rotL:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 18H7v-8"/><path d="M8 18A18 18 0 1 1 9 33"/></svg>',
    rotR:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M33 18h8v-8"/><path d="M40 18A18 18 0 1 0 39 33"/></svg>',
    undo:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 14 8 24l10 10"/><path d="M10 24h17c8 0 13 4 13 12"/></svg>',
    redo:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m30 14 10 10-10 10"/><path d="M38 24H21C13 24 8 28 8 36"/></svg>',
    ruler:'<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-35 24 24)"><rect x="8" y="17" width="32" height="14" rx="2"/><path d="M14 17v6M20 17v9M26 17v6M32 17v9"/></g></svg>',
    angle:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 24 10l14 28"/><path d="M17 38a13 13 0 0 1 14-10"/></svg>',
    invert:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="9" width="30" height="30"/><path d="M39 9 9 39h30Z" fill="currentColor" stroke="none"/></svg>',
    eye:'<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M3 20C12 7 22 3 32 3s20 4 29 17c-9 13-19 17-29 17S12 33 3 20Z"/><circle cx="32" cy="20" r="8"/><circle cx="32" cy="20" r="3" fill="currentColor" stroke="none"/></svg>',
    layout:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="7" width="34" height="34" rx="2"/><path d="M24 7v34M7 24h34"/></svg>'
  };

  function ensureEmptyOverlay(panel){
    let overlay=panel.querySelector('.premium-empty-overlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.className='premium-empty-overlay';
      overlay.innerHTML='<img class="premium-empty-watermark" src="viewer-watermark.webp" alt="" aria-hidden="true"><div class="premium-empty-vignette"></div><div class="premium-empty-message"><div class="premium-empty-symbol"><span class="premium-empty-plus">+</span></div><div class="premium-empty-title">No hay imagen cargada</div><div class="premium-empty-copy">Carga archivos DICOM para comenzar<br>o arrastra y suelta tus archivos en el panel izquierdo.</div></div>';
      panel.appendChild(overlay);
    }else{
      const img=overlay.querySelector('.premium-empty-watermark');
      if(img) img.src='viewer-watermark.webp';
    }
    return overlay;
  }

  function toolMarkup(svg,label){
    return '<span class="premium-refine-icon">'+svg+'</span>'+(label?'<span class="premium-refine-label">'+label+'</span>':'');
  }

  function configureMarkers(){
    const first=document.querySelector('#dv-quad-herramientas .dv-marker-btn');
    const host=first&&first.closest('.dv-controls');
    if(host) host.classList.add('premium-marker-row');
  }

  function configureTransforms(){
    const grid=document.getElementById('premium-transform-grid');
    if(!grid) return;
    const map=[
      ['dv-flip-h',SVG.flipH,'Giro Horizontal'],
      ['dv-flip-v',SVG.flipV,'Giro Vertical'],
      ['dv-rotate-left',SVG.rotL,'90° izq.'],
      ['dv-rotate-right',SVG.rotR,'90° der.']
    ];
    map.forEach(([id,svg,label])=>{
      const b=document.getElementById(id); if(!b)return;
      b.innerHTML=toolMarkup(svg,label);
      b.classList.add('premium-refined-transform');
      b.setAttribute('aria-label',label);
    });
  }

  function configureHistory(){
    const clear=document.getElementById('dv-clear-annotations');
    const undo=document.getElementById('dv-undo');
    const redo=document.getElementById('dv-redo');
    if(clear) clear.remove();
    const host=undo&&undo.closest('.dv-controls');
    if(!host||!redo) return;
    host.classList.add('premium-edit-history-row');
    undo.innerHTML=toolMarkup(SVG.undo,'');
    redo.innerHTML=toolMarkup(SVG.redo,'');
    undo.setAttribute('aria-label','Deshacer');
    redo.setAttribute('aria-label','Rehacer');
  }

  function configureTextControls(){
    const text=document.getElementById('dv-tool-text');
    const bold=document.getElementById('dv-text-bold-btn');
    const color=document.getElementById('dv-color-btn');
    const host=text&&text.closest('.dv-controls');
    if(!host||!bold||!color) return;
    host.classList.add('premium-text-controls-row');
    text.querySelectorAll('.premium-tool-icon').forEach(n=>n.remove());
    bold.querySelectorAll('.premium-tool-icon').forEach(n=>n.remove());
    text.textContent='T'; bold.textContent='N';
  }

  function configureMeasurements(){
    const length=document.getElementById('dv-tool-length');
    const angle=document.getElementById('dv-tool-angle');
    const inv=document.getElementById('dv-invert');
    const reset=document.getElementById('dv-wlww-reset');
    if(length){ length.innerHTML=toolMarkup(SVG.ruler,'Length'); length.classList.add('premium-measure-refined'); }
    if(angle){ angle.innerHTML=toolMarkup(SVG.angle,'Ángulo'); angle.classList.add('premium-measure-refined'); }
    if(inv){ inv.innerHTML=toolMarkup(SVG.invert,''); inv.classList.add('premium-single-symbol'); inv.setAttribute('aria-label','Invertir negativo/positivo'); }
    if(reset){ reset.innerHTML=toolMarkup(SVG.eye,''); reset.classList.add('premium-single-symbol'); reset.setAttribute('aria-label','Restablecer nivel y ancho de ventana'); }
  }

  function positionViewDropdown(){
    const opener=document.getElementById('dv-view-opener');
    const dropdown=document.getElementById('dv-view-dropdown');
    if(!opener||!dropdown) return;
    if(dropdown.parentElement!==document.body) document.body.appendChild(dropdown);
    dropdown.classList.add('premium-view-dropdown-portal');
    const r=opener.getBoundingClientRect();
    const width=Math.max(205,dropdown.offsetWidth||205);
    let left=r.left-width-10;
    if(left<8) left=Math.min(window.innerWidth-width-8,r.right+10);
    const estimated=Math.max(190,dropdown.offsetHeight||210);
    let top=r.bottom-estimated;
    if(top<8) top=8;
    dropdown.style.left=Math.round(left)+'px';
    dropdown.style.top=Math.round(top)+'px';
  }

  function configureView(){
    const view=document.getElementById('dv-view-opener');
    const dropdown=document.getElementById('dv-view-dropdown');
    if(!view||!dropdown) return;
    view.classList.add('premium-view-button');
    view.innerHTML='<span class="premium-view-eye">'+SVG.eye+'</span><span class="premium-view-arrow" aria-hidden="true"></span>';
    view.setAttribute('aria-label','Ver opciones');
    if(view.dataset.premiumPortalBound!=='true'){
      view.dataset.premiumPortalBound='true';
      view.addEventListener('click',()=>requestAnimationFrame(positionViewDropdown));
      window.addEventListener('resize',()=>{ if(dropdown.classList.contains('open')) positionViewDropdown(); });
      window.addEventListener('scroll',()=>{ if(dropdown.classList.contains('open')) positionViewDropdown(); },true);
    }
    positionViewDropdown();
  }

  function layoutIcon(type){
    if(type===1) return '<span class="premium-layout-mini one"><i></i></span>';
    if(type===2) return '<span class="premium-layout-mini two"><i></i><i></i></span>';
    if(type===3) return '<span class="premium-layout-mini three"><i></i><i></i><i></i></span>';
    return '<span class="premium-layout-mini four"><i></i><i></i><i></i><i></i></span>';
  }

  function ensureLayoutControl(){
    const view=document.getElementById('dv-view-opener');
    const row=document.getElementById('premium-view-preset-row');
    if(!view||!row) return;
    row.classList.add('premium-view-preset-row-four');
    if(document.getElementById('premium-layout-opener')) return;
    const wrap=document.createElement('div');
    wrap.className='dv-flyout-wrap premium-layout-wrap';
    wrap.innerHTML='<button type="button" class="dv-btn secondary premium-layout-button" id="premium-layout-opener" aria-label="Diseño de visualización">'+
      '<span class="premium-layout-main-icon">'+SVG.layout+'</span><span class="premium-layout-caret"></span></button>'+
      '<div class="premium-layout-dropdown" id="premium-layout-dropdown">'+
      [1,2,3,4].map(n=>'<button type="button" data-layout="'+n+'" title="'+n+' panel'+(n>1?'es':'')+'">'+layoutIcon(n)+'</button>').join('')+
      '</div>';
    const viewWrap=view.closest('.dv-flyout-wrap');
    if(viewWrap&&viewWrap.parentElement===row) viewWrap.insertAdjacentElement('afterend',wrap); else row.prepend(wrap);
    const opener=wrap.querySelector('#premium-layout-opener');
    const menu=wrap.querySelector('#premium-layout-dropdown');
    opener.addEventListener('click',e=>{e.stopPropagation();menu.classList.toggle('open');});
    menu.addEventListener('click',e=>{
      const b=e.target.closest('button[data-layout]'); if(!b)return;
      setMultiLayout(Number(b.dataset.layout));
      menu.classList.remove('open');
    });
    document.addEventListener('click',()=>menu.classList.remove('open'));
  }

  function makeCell(index){
    const cell=document.createElement('div');
    cell.className='premium-multiview-cell';
    cell.dataset.cell=String(index);
    cell.innerHTML='<canvas></canvas><div class="premium-multiview-placeholder">Arrastra una imagen aquí</div><div class="premium-multiview-caption"></div>';
    const canvas=cell.querySelector('canvas');
    const view={source:null,zoom:1,panX:0,panY:0,drag:null};
    cell._premiumView=view;

    function render(){
      const rect=cell.getBoundingClientRect();
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(1,Math.round(rect.width*dpr));
      const h=Math.max(1,Math.round(rect.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,w,h);
      if(!view.source) return;
      const sw=view.source.width, sh=view.source.height;
      const fit=Math.min(w/sw,h/sh);
      const scale=fit*view.zoom;
      const dw=sw*scale, dh=sh*scale;
      const x=(w-dw)/2+view.panX*dpr;
      const y=(h-dh)/2+view.panY*dpr;
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(view.source,x,y,dw,dh);
    }
    cell._premiumRender=render;
    new ResizeObserver(render).observe(cell);
    cell.addEventListener('dragover',e=>{e.preventDefault();cell.classList.add('drag-over');});
    cell.addEventListener('dragleave',()=>cell.classList.remove('drag-over'));
    cell.addEventListener('drop',async e=>{
      e.preventDefault();cell.classList.remove('drag-over');
      const raw=e.dataTransfer.getData('application/x-imedicom-index')||e.dataTransfer.getData('text/plain');
      const idx=Number(raw); if(!Number.isInteger(idx)||idx<0)return;
      await snapshotFileToCell(idx,cell);
    });
    cell.addEventListener('wheel',e=>{
      if(!view.source)return; e.preventDefault();
      const factor=e.deltaY<0?1.12:0.89;
      view.zoom=Math.max(.5,Math.min(6,view.zoom*factor));
      render();
    },{passive:false});
    cell.addEventListener('mousedown',e=>{
      if(e.button!==0||!view.source)return;
      view.drag={x:e.clientX,y:e.clientY,px:view.panX,py:view.panY};
      cell.classList.add('panning');
      e.preventDefault();
    });
    window.addEventListener('mousemove',e=>{
      if(!view.drag)return;
      view.panX=view.drag.px+(e.clientX-view.drag.x);
      view.panY=view.drag.py+(e.clientY-view.drag.y);
      render();
    });
    window.addEventListener('mouseup',()=>{ if(view.drag){view.drag=null;cell.classList.remove('panning');} });
    cell.addEventListener('dblclick',()=>{view.zoom=1;view.panX=0;view.panY=0;render();});
    return cell;
  }

  async function snapshotFileToCell(index,cell){
    const items=[...document.querySelectorAll('#dv-filelist .dv-file-item')];
    const item=items[index]; if(!item)return;
    item.click();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await new Promise(r=>setTimeout(r,40));
    const source=document.getElementById('dv-canvas');
    if(!source||source.style.display==='none'||!source.width||!source.height)return;
    const off=document.createElement('canvas'); off.width=source.width; off.height=source.height;
    off.getContext('2d').drawImage(source,0,0);
    const view=cell._premiumView; view.source=off; view.zoom=1; view.panX=0; view.panY=0;
    cell.querySelector('.premium-multiview-placeholder').style.display='none';
    const cap=cell.querySelector('.premium-multiview-caption');
    cap.textContent=(item.querySelector('.dv-file-name')?.textContent||item.textContent||('Imagen '+(index+1))).trim().split(/\n/)[0];
    cell._premiumRender();
  }

  function markFileItemsDraggable(){
    document.querySelectorAll('#dv-filelist .dv-file-item').forEach((item,idx)=>{
      item.draggable=true; item.dataset.premiumFileIndex=String(idx);
      if(item.dataset.premiumDragBound==='true')return;
      item.dataset.premiumDragBound='true';
      item.addEventListener('dragstart',e=>{
        const current=[...document.querySelectorAll('#dv-filelist .dv-file-item')].indexOf(item);
        e.dataTransfer.setData('application/x-imedicom-index',String(current));
        e.dataTransfer.setData('text/plain',String(current));
        e.dataTransfer.effectAllowed='copy';
      });
    });
  }

  function setMultiLayout(count){
    const wrap=document.getElementById('dv-viewer-wrap'); if(!wrap)return;
    let multi=document.getElementById('premium-multiview');
    if(count<=1){ if(multi) multi.remove(); wrap.classList.remove('premium-multiview-active'); return; }
    if(!multi){ multi=document.createElement('div'); multi.id='premium-multiview'; wrap.appendChild(multi); }
    multi.className='premium-multiview layout-'+count;
    multi.innerHTML='';
    for(let i=0;i<count;i++) multi.appendChild(makeCell(i));
    wrap.classList.add('premium-multiview-active');
    markFileItemsDraggable();
  }

  function ensureRestoration(){
    const panel=document.getElementById('dv-quad-imagen');
    const canvas=document.getElementById('dv-canvas');
    if(!panel||!canvas) return false;
    panel.querySelectorAll('.premium-bottom-dock,.premium-dock-status').forEach(node=>node.remove());
    const overlay=ensureEmptyOverlay(panel);
    if(canvas.dataset.premiumEmptyObserver!=='true'){
      canvas.dataset.premiumEmptyObserver='true';
      const refresh=()=>{
        const empty=canvas.style.display==='none'||getComputedStyle(canvas).display==='none';
        overlay.classList.toggle('hidden',!empty);
      };
      refresh();
      new MutationObserver(refresh).observe(canvas,{attributes:true,attributeFilter:['style','class']});
    }
    configureMarkers(); configureTransforms(); configureHistory(); configureTextControls(); configureMeasurements(); configureView(); ensureLayoutControl(); markFileItemsDraggable();
    const list=document.getElementById('dv-filelist');
    if(list&&list.dataset.premiumMultiObserved!=='true'){
      list.dataset.premiumMultiObserved='true';
      new MutationObserver(markFileItemsDraggable).observe(list,{childList:true,subtree:true});
    }
    return true;
  }

  function init(){
    if(ensureRestoration()) return;
    const mount=document.getElementById('viewerMount')||document.body;
    const obs=new MutationObserver(()=>{ if(ensureRestoration()) obs.disconnect(); });
    obs.observe(mount,{childList:true,subtree:true});
    setTimeout(()=>ensureRestoration(),1200);
  }

  window.imeDicomWorkstation={setMultiLayout,ensureRestoration};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
