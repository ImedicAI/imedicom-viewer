(function(){
  const ACCESS_WORKER_URL='https://imedicom-access.imedica.workers.dev';
  const STORAGE_KEY='dv_access_session';
  const DEVICE_KEY='dv_device_id';
  const REVALIDATE_MS=5*60*1000;
  let initialized=false;

  function init(){
    if(initialized)return;
    initialized=true;
    window.ACCESS_WORKER_URL=ACCESS_WORKER_URL;

    const root=document.getElementById('dv-root');
    const lockScreen=document.getElementById('dv-lock-screen');
    const input=document.getElementById('dv-lock-input');
    const btn=document.getElementById('dv-lock-btn');
    const msg=document.getElementById('dv-lock-msg');
    const fsControlsEl=document.getElementById('dv-fullscreen-controls');
    if(!root||!lockScreen||!input||!btn||!msg)return;

    function getDeviceId(){
      try{
        let id=localStorage.getItem(DEVICE_KEY);
        if(!id){
          id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'dv-'+Date.now()+'-'+Math.random().toString(16).slice(2);
          localStorage.setItem(DEVICE_KEY,id);
        }
        return id;
      }catch(e){return 'dv-nolocal-'+Date.now();}
    }
    const DEVICE_ID=getDeviceId();

    function unlock(){root.classList.remove('dv-locked');lockScreen.classList.add('dv-hidden');if(fsControlsEl)fsControlsEl.classList.add('dv-show');}
    function lock(){root.classList.add('dv-locked');lockScreen.classList.remove('dv-hidden');if(fsControlsEl)fsControlsEl.classList.remove('dv-show');}
    function escapeHtmlMsg(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    function showMsg(text,isErr){msg.innerHTML=String(text).split('\n').map(escapeHtmlMsg).join('<br>');msg.className='dv-lock-msg '+(isErr?'dv-err':'dv-ok');}
    function saveSession(code){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({code,validatedAt:Date.now()}));}catch(e){}}
    function readSession(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):null;}catch(e){return null;}}
    function clearSession(){try{localStorage.removeItem(STORAGE_KEY);}catch(e){}}

    const REASONS={
      not_found:'Código no encontrado.',expired:'Este código venció.',revoked:'Este código fue desactivado.',
      missing_code:'Ingresá un código.',missing_device:'No se pudo identificar el dispositivo. Recargá la página.',
      device_limit:'Este código ya alcanzó su límite\nde dispositivos autorizados.'
    };

    async function attemptCode(code,silent){
      if(!silent){btn.disabled=true;showMsg('Verificando…',false);}
      try{
        const resp=await fetch(ACCESS_WORKER_URL+'/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,deviceId:DEVICE_ID})});
        const result=await resp.json();
        if(result.valid){
          saveSession(code);unlock();
          if(!silent)showMsg('Acceso concedido'+(result.expiresAt?(' — vence '+new Date(result.expiresAt).toLocaleDateString('es-PE')):''),false);
        }else{
          clearSession();lock();showMsg(REASONS[result.reason]||'Código inválido.',true);
        }
      }catch(err){
        if(!silent)showMsg('No se pudo conectar para validar el código. Revisá tu conexión.',true);
      }finally{if(!silent)btn.disabled=false;}
    }

    btn.addEventListener('click',()=>{
      const code=input.value.trim();
      if(!code){showMsg('Ingresá un código.',true);return;}
      if(window.imeDicomRuntime?.requestFullscreen)window.imeDicomRuntime.requestFullscreen();
      attemptCode(code,false);
    });
    input.addEventListener('keydown',e=>{if(e.key==='Enter')btn.click();});

    const session=readSession();
    if(session&&session.code){input.value=session.code;attemptCode(session.code,true);}
    setInterval(()=>{const s=readSession();if(s&&s.code&&!root.classList.contains('dv-locked'))attemptCode(s.code,true);},REVALIDATE_MS);
  }

  window.imeDicomAccess={init,ACCESS_WORKER_URL};
})();
