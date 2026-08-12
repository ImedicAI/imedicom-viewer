(async function(){
  const mount=document.getElementById('viewerMount');
  if(!mount) return;

  function applyPremiumDom(){
    const empty=document.getElementById('dv-empty');
    if(empty){
      empty.innerHTML='<div class="premium-ring">⇧</div><div class="premium-title">Cargue un estudio DICOM</div><div class="premium-copy">Arrastra y suelta archivos DICOM aquí<br>o usa el botón de carga en el panel izquierdo.</div><button type="button" class="premium-demo" id="premium-demo">▱&nbsp; Abrir estudio de ejemplo</button>';
      const demo=document.getElementById('premium-demo');
      if(demo) demo.addEventListener('click',e=>{e.stopPropagation();const input=document.querySelector('input[type=file]');if(input)input.click()});
    }

    const tools=document.getElementById('dv-quad-herramientas');
    if(tools){
      const makeLabel=(text,before)=>{
        if(!before||before.previousElementSibling?.classList?.contains('premium-section')) return;
        const x=document.createElement('div');
        x.className='premium-section';
        x.textContent=text;
        before.parentNode.insertBefore(x,before);
      };
      makeLabel('Marcadores',tools.querySelector('.dv-controls'));
      const transform=document.getElementById('dv-transform-opener');
      if(transform) makeLabel('Transformar',transform.closest('.dv-controls'));
      const arrow=document.getElementById('dv-tool-arrow');
      if(arrow) makeLabel('Medición y anotación',arrow.closest('.dv-controls'));
      const bone=document.getElementById('dv-profile-bone');
      if(bone) makeLabel('Preset',bone.closest('.dv-controls'));
    }
  }

  function replaceInlineCore(sourceText){
    if(!window.imeDicomCore?.dicomParser) return sourceText;
    const startMarker='  const dicomParser = {';
    const endMarker='\n  };\n\n  const state = { files: [], activeIndex: -1 };';
    const start=sourceText.indexOf(startMarker);
    const end=sourceText.indexOf(endMarker,start);
    if(start<0 || end<0) return sourceText;
    const replacement='  const dicomParser = window.imeDicomCore.dicomParser;\n\n  const state = { files: [], activeIndex: -1 };';
    return sourceText.slice(0,start)+replacement+sourceText.slice(end+endMarker.length);
  }

  async function executeScripts(scripts){
    for(const source of scripts){
      await new Promise(resolve=>{
        const s=document.createElement('script');
        for(const a of source.attributes){
          if(a.name!=='src') s.setAttribute(a.name,a.value);
        }
        if(source.src){
          s.src=source.getAttribute('src');
          s.onload=resolve;
          s.onerror=()=>{console.warn('imeDICOM: no se pudo cargar',s.src);resolve();};
          document.body.appendChild(s);
        }else{
          s.textContent=replaceInlineCore(source.textContent);
          document.body.appendChild(s);
          resolve();
        }
      });
    }
  }

  try{
    if(!window.imeDicomCore?.dicomParser) throw new Error('dicom-core.js no fue cargado');

    const response=await fetch('legacy-viewer.html',{cache:'no-store'});
    if(!response.ok) throw new Error('HTTP '+response.status);
    const html=await response.text();
    const parsed=new DOMParser().parseFromString(html,'text/html');
    const scripts=[...parsed.querySelectorAll('script')];
    scripts.forEach(s=>s.remove());

    for(const node of [...parsed.head.querySelectorAll('style,link[rel="stylesheet"]')]){
      const clone=node.cloneNode(true);
      clone.dataset.legacyViewerStyle='true';
      document.head.appendChild(clone);
    }

    mount.innerHTML=parsed.body.innerHTML;
    await executeScripts(scripts);
    applyPremiumDom();
    document.documentElement.dataset.viewerIntegration='direct-dom-core-extracted';
    console.info('imeDICOM: DOM directo con parser DICOM externo');
  }catch(err){
    console.error(err);
    mount.innerHTML='<div style="height:100%;display:grid;place-items:center;padding:32px;text-align:center;color:#d8e2e8;background:#061018"><div><div style="font-size:18px;font-weight:700;margin-bottom:8px">No se pudo inicializar el visor</div><div style="font-size:13px;color:#91a2af">Recarga la página. La versión de respaldo permanece disponible en legacy-viewer.html.</div></div></div>';
  }
})();
