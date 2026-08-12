(function(){
  function readEntryAsFile(entry){
    return new Promise((resolve,reject)=>entry.file(resolve,reject));
  }

  function readDirEntries(dirReader){
    return new Promise((resolve,reject)=>{
      let all=[];
      function next(){
        dirReader.readEntries(batch=>{
          if(!batch.length){resolve(all);return;}
          all=all.concat(batch);
          next();
        },reject);
      }
      next();
    });
  }

  async function walkEntry(entry,out,insideFolder){
    if(!entry)return;
    if(entry.isFile){
      try{
        const file=await readEntryAsFile(entry);
        if(!insideFolder||/\.dcm$/i.test(file.name))out.files.push(file);
        else out.skipped++;
      }catch(e){}
      return;
    }
    if(entry.isDirectory){
      const children=await readDirEntries(entry.createReader());
      for(const child of children)await walkEntry(child,out,true);
    }
  }

  async function collectDroppedFiles(dataTransfer){
    const out={files:[],skipped:0};
    const items=dataTransfer&&dataTransfer.items;
    if(items&&items.length&&items[0].webkitGetAsEntry){
      const entries=Array.from(items).map(it=>it.webkitGetAsEntry()).filter(Boolean);
      for(const entry of entries)await walkEntry(entry,out,false);
      return out;
    }
    out.files=Array.from((dataTransfer&&dataTransfer.files)||[]);
    return out;
  }

  function extractDriveFileId(rawUrl){
    try{
      const u=new URL(rawUrl);
      if(!/drive\.google\.com$/.test(u.hostname.replace(/^www\./,'')))return null;
      const m=u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if(m)return m[1];
      return u.searchParams.get('id')||null;
    }catch(e){return null;}
  }

  function getAccessCode(){
    try{
      const raw=localStorage.getItem('dv_access_session');
      const session=raw?JSON.parse(raw):null;
      return session&&session.code?session.code:null;
    }catch(e){return null;}
  }

  function init(deps){
    const {state,dicomParser,extractMeta,extractPixel,renderFileList,selectFile,reenterFullscreenIfPending}=deps||{};
    if(!state||!dicomParser||!extractMeta||!extractPixel||!renderFileList||!selectFile){
      throw new Error('viewer-load.js: faltan dependencias de inicializacion');
    }

    const dropEl=document.getElementById('dv-drop');
    const inputEl=document.getElementById('dv-file-input');
    const dropMsgEl=document.getElementById('dv-drop-msg');
    const linkToggle=document.getElementById('dv-link-toggle');
    const linkRow=document.getElementById('dv-link-row');
    const linkInput=document.getElementById('dv-link-input');
    const linkLoadBtn=document.getElementById('dv-link-load');
    const linkMsg=document.getElementById('dv-link-msg');

    function handleFiles(fileList){
      Array.from(fileList||[]).forEach(file=>{
        const entry={name:file.name,status:'loading',dataSet:null,pixel:null,meta:null,error:null,rotation:0,flipH:false,flipV:false,invert:false,annotations:[]};
        state.files.push(entry);
        const idx=state.files.length-1;
        renderFileList();

        const reader=new FileReader();
        reader.onload=function(ev){
          try{
            const byteArray=new Uint8Array(ev.target.result);
            const dataSet=dicomParser.parseDicom(byteArray);
            entry.dataSet=dataSet;
            entry.meta=extractMeta(dataSet);
            entry.pixel=extractPixel(dataSet);
            entry.pixel.origWindowCenter=entry.pixel.windowCenter;
            entry.pixel.origWindowWidth=entry.pixel.windowWidth;

            // Mantiene exactamente la regla existente de orientacion automatica.
            // Se deja aqui sin reinterpretarla durante la modularizacion.
            if(entry.pixel.rows>entry.pixel.cols&&!entry.meta.isSpineBodyPart){
              entry.rotation=90;
              entry.flipH=true;
            }
            entry.status='ok';
          }catch(err){
            entry.status='error';
            entry.error=err&&err.message?err.message:'No se pudo leer el archivo';
          }
          renderFileList();
          if(entry.status==='ok')selectFile(idx);
        };
        reader.onerror=function(){
          entry.status='error';
          entry.error='Error de lectura del archivo';
          renderFileList();
        };
        reader.readAsArrayBuffer(file);
      });
    }

    async function loadFromLink(){
      if(!linkInput||!linkLoadBtn||!linkMsg)return;
      const url=linkInput.value.trim();
      if(!url)return;
      linkLoadBtn.disabled=true;
      linkMsg.textContent='Descargando…';
      linkMsg.className='dv-link-msg';
      try{
        const driveId=extractDriveFileId(url);
        let resp,filename;
        if(driveId){
          const code=getAccessCode();
          if(!code||!window.ACCESS_WORKER_URL)throw new Error('no_access_code');
          resp=await fetch(window.ACCESS_WORKER_URL+'/drive-fetch?id='+encodeURIComponent(driveId)+'&code='+encodeURIComponent(code));
          if(!resp.ok){
            const errData=await resp.json().catch(()=>({}));
            throw new Error(errData.detail||errData.error||('http_'+resp.status));
          }
          const disposition=resp.headers.get('content-disposition')||'';
          const dispMatch=disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
          filename=dispMatch?decodeURIComponent(dispMatch[1]):'archivo_drive.dcm';
        }else{
          resp=await fetch(url);
          if(!resp.ok)throw new Error('http_'+resp.status);
          filename=decodeURIComponent(url.split('/').pop().split('?')[0]||'')||'archivo.dcm';
        }
        const blob=await resp.blob();
        if(!/\.dcm$/i.test(filename))filename+='.dcm';
        handleFiles([new File([blob],filename,{type:blob.type||'application/dicom'})]);
        linkMsg.textContent='Cargado.';
        linkMsg.className='dv-link-msg dv-link-ok';
        linkInput.value='';
      }catch(err){
        linkMsg.textContent=(err&&err.message&&err.message!=='no_access_code'&&!/^http_/.test(err.message))
          ?err.message
          :'No se pudo cargar ese link (debe ser un link de descarga directa, o un link de Drive compartido públicamente).';
        linkMsg.className='dv-link-msg dv-link-err';
      }finally{
        linkLoadBtn.disabled=false;
      }
    }

    if(dropEl&&inputEl){
      dropEl.addEventListener('click',()=>inputEl.click());
      dropEl.addEventListener('dragover',e=>{e.preventDefault();dropEl.classList.add('dv-drag');});
      dropEl.addEventListener('dragleave',()=>dropEl.classList.remove('dv-drag'));
      dropEl.addEventListener('drop',async e=>{
        e.preventDefault();
        dropEl.classList.remove('dv-drag');
        if(dropMsgEl)dropMsgEl.textContent='Leyendo carpetas…';
        const {files,skipped}=await collectDroppedFiles(e.dataTransfer);
        if(dropMsgEl){
          if(skipped>0)dropMsgEl.textContent=`Se cargaron ${files.length} archivo(s) .dcm — se omitieron ${skipped} archivo(s) que no eran DICOM.`;
          else if(files.length)dropMsgEl.textContent=`Se cargaron ${files.length} archivo(s).`;
          else dropMsgEl.textContent='No se encontró ningún archivo .dcm en lo que arrastraste.';
        }
        handleFiles(files);
        if(reenterFullscreenIfPending)reenterFullscreenIfPending();
      });
      inputEl.addEventListener('change',e=>{
        handleFiles(e.target.files);
        if(reenterFullscreenIfPending)reenterFullscreenIfPending();
      });
    }

    if(linkToggle&&linkRow&&linkInput&&linkLoadBtn&&linkMsg){
      linkToggle.addEventListener('click',()=>{
        const show=linkRow.style.display==='none';
        linkRow.style.display=show?'flex':'none';
        linkMsg.textContent='';
        if(show)linkInput.focus();
      });
      linkLoadBtn.addEventListener('click',loadFromLink);
      linkInput.addEventListener('keydown',e=>{if(e.key==='Enter')loadFromLink();});
    }

    return {handleFiles,collectDroppedFiles,loadFromLink};
  }

  window.imeDicomLoad={init,collectDroppedFiles,extractDriveFileId,getAccessCode};
})();
