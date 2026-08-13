(function(){
  let fsReturnAfterLoad=false;
  let initialized=false;

  function requestFullscreen(){
    const el=document.documentElement;
    if(document.fullscreenElement||!el.requestFullscreen)return;
    el.requestFullscreen().catch(()=>{});
  }

  function exitFullscreenSafe(){
    if(document.fullscreenElement&&document.exitFullscreen){
      document.exitFullscreen().catch(()=>{});
    }
  }

  function reenterFullscreenIfPending(){
    if(fsReturnAfterLoad){
      fsReturnAfterLoad=false;
      requestFullscreen();
    }
  }

  function firstClickFullscreenFallback(e){
    document.removeEventListener('click',firstClickFullscreenFallback);
    if(e&&e.target&&e.target.closest&&e.target.closest('#dv-fullscreen-controls'))return;
    const rootEl=document.getElementById('dv-root');
    if(rootEl&&!rootEl.classList.contains('dv-locked')&&!document.fullscreenElement)requestFullscreen();
  }

  function armFullscreenReentryOnNextClick(){
    document.removeEventListener('click',firstClickFullscreenFallback);
    document.addEventListener('click',firstClickFullscreenFallback);
  }

  function initFullscreen(){
    if(initialized)return;
    initialized=true;
    window.requestViewerFullscreen=requestFullscreen;
    armFullscreenReentryOnNextClick();

    const minimize=document.getElementById('dv-fs-minimize');
    const exit=document.getElementById('dv-fs-exit');
    if(minimize){
      minimize.addEventListener('click',()=>{
        if(document.fullscreenElement){
          fsReturnAfterLoad=true;
          exitFullscreenSafe();
        }else requestFullscreen();
      });
    }
    if(exit){
      exit.addEventListener('click',()=>{
        fsReturnAfterLoad=false;
        exitFullscreenSafe();
      });
    }
  }

  window.imeDicomRuntime={
    initFullscreen,
    requestFullscreen,
    exitFullscreenSafe,
    reenterFullscreenIfPending,
    armFullscreenReentryOnNextClick
  };
})();
