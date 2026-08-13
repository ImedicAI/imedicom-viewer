(function(){
  function toolByTitle(title){return Array.from(document.querySelectorAll('.appbar-tool')).find(b=>b.getAttribute('title')===title);}
  function closeModal(){const m=document.querySelector('.premium-utility-modal');if(m)m.remove();}
  function modal(title,body,actions){
    closeModal();
    const wrap=document.createElement('div');wrap.className='premium-utility-modal';
    const card=document.createElement('div');card.className='premium-utility-card';
    card.innerHTML='<h4>'+title+'</h4>'+body;
    (actions||[]).forEach(a=>{const b=document.createElement('button');b.type='button';b.textContent=a.label;b.addEventListener('click',()=>a.run(b,wrap));card.appendChild(b);});
    const x=document.createElement('button');x.type='button';x.className='premium-utility-close';x.textContent='×';x.title='Cerrar';x.addEventListener('click',closeModal);card.appendChild(x);
    wrap.appendChild(card);wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal();});document.body.appendChild(wrap);
  }
  function init(){
    const layout=toolByTitle('Diseño'),help=toolByTitle('Ayuda'),settings=toolByTitle('Ajustes');
    if(!layout||!help||!settings)return false;
    if(layout.dataset.premiumUtilityBound==='true')return true;
    [layout,help,settings].forEach(b=>b.dataset.premiumUtilityBound='true');layout.dataset.premiumRole='layout';
    layout.addEventListener('click',()=>{document.body.classList.toggle('premium-focus-layout');layout.setAttribute('aria-pressed',document.body.classList.contains('premium-focus-layout')?'true':'false');});
    help.addEventListener('click',()=>modal('Ayuda rápida','<p><b>Zoom:</b> activa el modo y usa la rueda sobre la imagen.</p><p><b>Pan:</b> desplaza la imagen cuando está ampliada.</p><p><b>WL/WW:</b> arrastra sobre la imagen para ajustar nivel y ancho de ventana.</p><p>Las herramientas del panel derecho siguen disponibles para mediciones, anotaciones y transformaciones.</p>'));
    settings.addEventListener('click',()=>modal('Ajustes de interfaz','<p>Estos cambios afectan solo a la presentación de la estación de trabajo; no modifican los píxeles DICOM.</p>',[
      {label:document.body.classList.contains('premium-compact-ui')?'Usar controles normales':'Usar controles compactos',run:(b)=>{document.body.classList.toggle('premium-compact-ui');b.textContent=document.body.classList.contains('premium-compact-ui')?'Usar controles normales':'Usar controles compactos';}},
      {label:'Mostrar / ocultar marca de agua',run:()=>{const o=document.querySelector('.premium-empty-overlay');if(o)o.style.visibility=o.style.visibility==='hidden'?'visible':'hidden';}}
    ]));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
    return true;
  }
  if(!init()){
    const mount=document.getElementById('viewerMount')||document.body;
    const obs=new MutationObserver(()=>{if(init())obs.disconnect();});obs.observe(mount,{childList:true,subtree:true});setTimeout(()=>init(),1200);
  }
})();
