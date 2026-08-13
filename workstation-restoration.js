(function(){
  function ensureEmptyOverlay(panel){
    let overlay=panel.querySelector('.premium-empty-overlay');
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.className='premium-empty-overlay';
    overlay.innerHTML='<img class="premium-empty-watermark" src="assets/chest-watermark.svg" alt="" aria-hidden="true"><div class="premium-empty-vignette"></div><div class="premium-empty-message"><div class="premium-empty-symbol"><span class="premium-empty-plus">+</span></div><div class="premium-empty-title">No hay imagen cargada</div><div class="premium-empty-copy">Carga archivos DICOM para comenzar<br>o arrastra y suelta tus archivos en el panel izquierdo.</div></div>';
    panel.appendChild(overlay);
    return overlay;
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
    return true;
  }

  function init(){
    if(ensureRestoration()) return;
    const mount=document.getElementById('viewerMount')||document.body;
    const obs=new MutationObserver(()=>{ if(ensureRestoration()) obs.disconnect(); });
    obs.observe(mount,{childList:true,subtree:true});
    setTimeout(()=>ensureRestoration(),1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
