(function(){
  let pending=false,observer=null;
  function enforce(){
    pending=false;
    const reset=document.getElementById('dv-wlww-reset');
    if(reset && reset.textContent.trim()!=='RESET'){
      reset.innerHTML='<span class="v2-reset-word">RESET</span>';
      reset.title='Restablecer nivel y ancho de ventana';
      reset.setAttribute('aria-label','RESET');
    }
    // Se conservan estos nodos como hooks de compatibilidad del runtime
    // legacy, pero se mantienen fuera de la interfaz refinada. Ocultarlos
    // en vez de eliminarlos evita una carrera durante el montaje asincrono:
    // el script legacy puede enlazar sus listeners aunque este refinamiento
    // se ejecute antes de que termine executeScripts().
    ['dv-toggle-measurements','dv-show-tags'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      el.hidden=true;
      el.style.display='none';
      el.setAttribute('aria-hidden','true');
      el.tabIndex=-1;
    });
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(enforce);}
  function bind(){
    const root=document.getElementById('dv-root'),reset=document.getElementById('dv-wlww-reset');
    if(!root||!reset)return false;
    enforce();
    if(!observer){observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});}
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(bind()||tries>160)clearInterval(timer);},50);
  setTimeout(enforce,600);setTimeout(enforce,1600);
})();
