(function(){
  const ICON={
    fit:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    zoom:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 5 5M10.5 7.7v5.6M7.7 10.5h5.6"/></svg>',
    pan:'<svg viewBox="0 0 24 24"><path d="M8 11V6.8a1.4 1.4 0 0 1 2.8 0V10 5.4a1.4 1.4 0 0 1 2.8 0V10 6.4a1.4 1.4 0 0 1 2.8 0v4.3-2.2a1.4 1.4 0 0 1 2.8 0v4.9c0 4.3-2.4 7-6.5 7H12c-2 0-3.3-.8-4.5-2.3L4.8 15a1.5 1.5 0 0 1 2.2-2l1 1.1V11Z"/></svg>',
    window:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15M4.5 12h15"/></svg>',
    invert:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15Z" fill="currentColor" stroke="none"/></svg>',
    reset:'<svg viewBox="0 0 24 24"><path d="M5.3 8.2A7.8 7.8 0 1 1 4.8 15M5.3 8.2V4.5M5.3 8.2H9"/></svg>'
  };
  let mode='none';
  let syntheticDrag=null;

  function btn(icon,label,action,title){
    const b=document.createElement('button');
    b.type='button'; b.dataset.action=action; b.title=title||label;
    b.innerHTML=ICON[icon]+'<span class="premium-dock-label">'+label+'</span>';
    return b;
  }

  function setMode(next){
    mode=(mode===next)?'none':next;
    document.querySelectorAll('.premium-bottom-dock button[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const canvas=document.getElementById('dv-canvas');
    if(canvas) canvas.style.cursor=mode==='none'?'default':(mode==='zoom'?'zoom-in':'crosshair');
    if(mode==='zoom') ensureInteractiveZoom();
  }

  function ensureInteractiveZoom(){
    const indicator=document.getElementById('dv-interaction-indicator');
    const canvas=document.getElementById('dv-canvas');
    if(!canvas||canvas.style.display==='none') return;
    if(indicator&&getComputedStyle(indicator).display!=='none') return;
    const r=canvas.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    canvas.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:cx,clientY:cy,button:0,buttons:1}));
    canvas.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:cx,clientY:cy,button:0,buttons:0}));
    canvas.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:cx,clientY:cy,button:0}));
  }

  function resetZoomToFit(){
    const canvas=document.getElementById('dv-canvas');
    const wrap=document.getElementById('dv-viewer-wrap');
    if(!canvas||canvas.style.display==='none'||!wrap) return;
    ensureInteractiveZoom();
    const r=canvas.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    for(let i=0;i<60;i++){
      wrap.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:120,clientX:cx,clientY:cy}));
    }
    requestAnimationFrame(()=>{ if(window.fitCanvasToContainer) window.fitCanvasToContainer(); wrap.scrollLeft=0; wrap.scrollTop=0; });
  }

  function trigger(id){ const el=document.getElementById(id); if(el&&!el.disabled) el.click(); }

  function wireSyntheticModes(){
    const canvas=document.getElementById('dv-canvas');
    if(!canvas||canvas.dataset.premiumDockModes==='true') return;
    canvas.dataset.premiumDockModes='true';
    canvas.addEventListener('mousedown',e=>{
      if(e.button!==0||(mode!=='pan'&&mode!=='window')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      syntheticDrag={mode};
      canvas.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY,button:2,buttons:2,altKey:mode==='window'}));
    },true);
    window.addEventListener('mousemove',e=>{
      if(!syntheticDrag) return;
      canvas.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY,button:2,buttons:2,altKey:syntheticDrag.mode==='window'}));
    },true);
    window.addEventListener('mouseup',e=>{
      if(!syntheticDrag||e.button!==0) return;
      canvas.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY,button:2,buttons:0,altKey:syntheticDrag.mode==='window'}));
      syntheticDrag=null;
    },true);
  }

  function ensureDock(){
    const panel=document.getElementById('dv-quad-imagen');
    const wrap=document.getElementById('dv-viewer-wrap');
    if(!panel||!wrap||document.querySelector('.premium-bottom-dock')) return false;
    const dock=document.createElement('div'); dock.className='premium-bottom-dock'; dock.setAttribute('aria-label','Controles rápidos del visor');
    const fit=btn('fit','Ajustar','fit','Ajustar imagen al área de visualización');
    const zoom=btn('zoom','Zoom','zoom','Activar zoom interactivo'); zoom.dataset.mode='zoom';
    const pan=btn('pan','Pan','pan','Activar desplazamiento de imagen'); pan.dataset.mode='pan';
    const win=btn('window','WL/WW','window','Activar ajuste de nivel y ancho de ventana'); win.dataset.mode='window';
    const inv=btn('invert','Invertir','invert','Invertir negativo/positivo');
    const reset=btn('reset','Restablecer','reset','Restablecer nivel/ancho de ventana');
    [fit,zoom,pan,win].forEach(b=>dock.appendChild(b));
    const d=document.createElement('span'); d.className='premium-dock-divider'; dock.appendChild(d);
    [inv,reset].forEach(b=>dock.appendChild(b));
    panel.appendChild(dock);
    const status=document.createElement('div'); status.className='premium-dock-status'; status.textContent='Sin imagen'; panel.appendChild(status);
    fit.addEventListener('click',resetZoomToFit);
    zoom.addEventListener('click',()=>setMode('zoom'));
    pan.addEventListener('click',()=>setMode('pan'));
    win.addEventListener('click',()=>setMode('window'));
    inv.addEventListener('click',()=>trigger('dv-invert'));
    reset.addEventListener('click',()=>trigger('dv-wlww-reset'));
    wireSyntheticModes();
    const canvas=document.getElementById('dv-canvas');
    if(canvas){
      const refresh=()=>{status.textContent=canvas.style.display==='none'?'Sin imagen':'Imagen activa'; if(canvas.style.display==='none') setMode('none');};
      refresh();
      new MutationObserver(refresh).observe(canvas,{attributes:true,attributeFilter:['style','class']});
    }
    return true;
  }

  function init(){
    if(ensureDock()) return;
    const mount=document.getElementById('viewerMount')||document.body;
    const obs=new MutationObserver(()=>{ if(ensureDock()) obs.disconnect(); });
    obs.observe(mount,{childList:true,subtree:true});
    setTimeout(()=>ensureDock(),1200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
