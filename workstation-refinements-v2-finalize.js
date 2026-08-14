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
    ['dv-toggle-measurements','dv-show-tags'].forEach(id=>document.getElementById(id)?.remove());
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
