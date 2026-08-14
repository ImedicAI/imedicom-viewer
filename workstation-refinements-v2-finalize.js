(function(){
  let pending=false;
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
  function init(){
    enforce();
    const root=document.getElementById('dv-root');
    if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    setTimeout(enforce,300);setTimeout(enforce,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,160));else setTimeout(init,160);
})();
