(function(){
  const icons={
    'dv-flip-h':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 7v50"/><path d="M27 15 10 32l17 17Z"/><path d="m37 15 17 17-17 17Z"/></svg>',
    'dv-flip-v':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 32h50"/><path d="m15 27 17-17 17 17Z"/><path d="m15 37 17 17 17-17Z"/></svg>',
    'dv-rotate-left':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M43 45H21V19"/><path d="m12 28 9-9 9 9"/></svg>',
    'dv-rotate-right':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M21 45h22V19"/><path d="m34 28 9-9 9 9"/></svg>'
  };
  const labels={
    'dv-flip-h':'Giro horizontal','dv-flip-v':'Giro vertical',
    'dv-rotate-left':'90° izquierda','dv-rotate-right':'90° derecha'
  };
  let scheduled=false;
  function enforce(){
    scheduled=false;
    for(const [id,svg] of Object.entries(icons)){
      const b=document.getElementById(id); if(!b) continue;
      if(b.querySelector('.premium-refine-label') || !b.querySelector('.v2-icon')){
        b.innerHTML='<span class="v2-icon">'+svg+'</span>';
      }
      b.classList.add('v2-transform-icon-only');
      b.title=labels[id]; b.setAttribute('aria-label',labels[id]);
    }
  }
  function schedule(){ if(scheduled)return; scheduled=true; requestAnimationFrame(enforce); }
  function init(){
    enforce();
    const grid=document.getElementById('premium-transform-grid');
    if(grid) new MutationObserver(schedule).observe(grid,{childList:true,subtree:true});
    setTimeout(enforce,250); setTimeout(enforce,900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100)); else setTimeout(init,100);
})();
