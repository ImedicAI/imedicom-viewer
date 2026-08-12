(async function(){
  const mount=document.getElementById('viewerMount');
  if(!mount) return;

  function replaceFunctionBlock(text,startMarker,endMarker,replacement){
    const start=text.indexOf(startMarker),end=text.indexOf(endMarker,start);
    if(start<0||end<0)return text;
    return text.slice(0,start)+replacement+text.slice(end);
  }

  function replaceInlineModules(sourceText){
    if(sourceText.includes('Control de acceso (candado)')&&window.imeDicomAccess?.init){
      return 'window.imeDicomAccess.init();';
    }

    let text=sourceText;
    if(window.imeDicomCore?.dicomParser){
      const startMarker='  const dicomParser = {';
      const endMarker='\n  };\n\n  const state = { files: [], activeIndex: -1 };';
      const start=text.indexOf(startMarker),end=text.indexOf(endMarker,start);
      if(start>=0&&end>=0) text=text.slice(0,start)+'  const dicomParser = window.imeDicomCore.dicomParser;\n\n  const state = { files: [], activeIndex: -1 };'+text.slice(end+endMarker.length);
    }

    if(window.imeDicomRuntime){
      text=replaceFunctionBlock(
        text,
        '  // ==================== Pantalla completa (sin distractores del navegador) ====================',
        '\n\n  const dropEl = document.getElementById(\'dv-drop\');',
        "  window.imeDicomRuntime.initFullscreen();\n  function reenterFullscreenIfPending(){ return window.imeDicomRuntime.reenterFullscreenIfPending(); }\n  function armFullscreenReentryOnNextClick(){ return window.imeDicomRuntime.armFullscreenReentryOnNextClick(); }\n  const dropEl = document.getElementById('dv-drop');"
      );
    }

    if(window.imeDicomLoad?.init){
      text=replaceFunctionBlock(
        text,
        '  // ---- Soporte para arrastrar CARPETAS completas (no solo archivos sueltos) ----',
        '\n  function dicomStr(dataSet, tag){',
        "  const loadController = window.imeDicomLoad.init({ state, dicomParser, extractMeta, extractPixel, renderFileList, selectFile, reenterFullscreenIfPending });\n  function handleFiles(fileList){ return loadController.handleFiles(fileList); }\n"
      );
    }

    if(window.imeDicomTools){
      text=text.replace(/\bpushUndo\(f\);/g,'window.imeDicomTools.pushUndo(f);');
      text=text.replace(/const angleDeg = angleAtVertex\(/g,'const angleDeg = window.imeDicomTools.angleAtVertex(');
      text=text.replace(/const cobbDeg = cobbAngleBetweenLines\(/g,'const cobbDeg = window.imeDicomTools.cobbAngleBetweenLines(');
      text=text.replace(/const labelPos = angleBisectorLabelPos\(/g,'const labelPos = window.imeDicomTools.angleBisectorLabelPos(');
    }

    if(window.imeDicomRender){
      text=replaceFunctionBlock(text,'  function renderBaseImage(f, scale){','\n  function windowToCanvas(f, targetCanvas, scale){',"  function renderBaseImage(f, scale){ return window.imeDicomRender.renderBaseImage(f, scale); }\n");
      text=replaceFunctionBlock(text,'  function windowToCanvas(f, targetCanvas, scale){','\n  // Nota: el overlay se calcula',"  function windowToCanvas(f, targetCanvas, scale){ return window.imeDicomRender.windowToCanvas(f, targetCanvas, scale); }\n");
      text=replaceFunctionBlock(text,'  function drawOverlay(ctx, f, scale){','\n  function draw(f, scale, skipLayout){',"  function drawOverlay(ctx, f, scale){ return window.imeDicomRender.drawOverlay(ctx, f, scale); }\n");
      text=replaceFunctionBlock(text,'  function drawAnnotations(ctx, f){','\n  function updateMetaPanel(f){',"  function drawAnnotations(ctx, f){ return window.imeDicomRender.drawAnnotations(ctx, f); }\n");
    }

    if(window.imeDicomExport){
      text=replaceFunctionBlock(text,'  function buildExportCanvas(f, multiplier){','\n  function sanitizeFilenamePart(s){',"  function buildExportCanvas(f, multiplier){\n    return window.imeDicomExport.buildExportCanvas(f, multiplier, { windowToCanvas, drawOverlay, drawAnnotations, detectConvexitySide });\n  }\n");
      text=replaceFunctionBlock(text,'  function sanitizeFilenamePart(s){','\n  // ---- Bloqueo global de exportacion ----',
        "  function sanitizeFilenamePart(s){ return window.imeDicomExport.sanitizeFilenamePart(s); }\n"+
        "  function buildPatientFilename(f){ return window.imeDicomExport.buildPatientFilename(f); }\n"+
        "  function buildUniqueFilename(f){ return window.imeDicomExport.buildUniqueFilename(f, state.files); }\n"+
        "  function reserveUniqueFilename(baseName, usedNames){ return window.imeDicomExport.reserveUniqueFilename(baseName, usedNames); }\n"+
        "  function canvasToBlobAsync(canvasEl, mime, quality){ return window.imeDicomExport.canvasToBlobAsync(canvasEl, mime, quality); }\n"+
        "  async function downloadCanvasAsJpg(canvasEl, filename){ return window.imeDicomExport.downloadCanvasAsJpg(canvasEl, filename, saveBlobToChosenFolder); }\n"+
        "  async function downloadCanvasAsPng(canvasEl, filename){ return window.imeDicomExport.downloadCanvasAsPng(canvasEl, filename, saveBlobToChosenFolder); }\n"+
        "  async function downloadCanvasAsPdf(canvasEl, filename){ return window.imeDicomExport.downloadCanvasAsPdf(canvasEl, filename, saveBlobToChosenFolder); }\n"
      );
    }
    return text;
  }

  async function executeScripts(scripts){
    for(const source of scripts){
      await new Promise(resolve=>{
        const s=document.createElement('script');
        for(const a of source.attributes) if(a.name!=='src') s.setAttribute(a.name,a.value);
        if(source.src){
          s.src=source.getAttribute('src');
          s.onload=resolve;
          s.onerror=()=>{console.warn('imeDICOM: no se pudo cargar',s.src);resolve();};
          document.body.appendChild(s);
        }else{
          s.textContent=replaceInlineModules(source.textContent);
          document.body.appendChild(s);
          resolve();
        }
      });
    }
  }

  try{
    if(!window.imeDicomCore?.dicomParser) throw new Error('dicom-core.js no fue cargado');
    if(!window.imeDicomTools) throw new Error('viewer-tools.js no fue cargado');
    if(!window.imeDicomRender) throw new Error('viewer-render.js no fue cargado');
    if(!window.imeDicomExport) throw new Error('viewer-export.js no fue cargado');
    if(!window.imeDicomUi?.applyPremiumDom) throw new Error('viewer-ui.js no fue cargado');
    if(!window.imeDicomRuntime?.initFullscreen) throw new Error('viewer-runtime.js no fue cargado');
    if(!window.imeDicomAccess?.init) throw new Error('viewer-access.js no fue cargado');
    if(!window.imeDicomLoad?.init) throw new Error('viewer-load.js no fue cargado');

    const response=await fetch('viewer-source.html',{cache:'no-store'});
    if(!response.ok) throw new Error('HTTP '+response.status);
    const html=await response.text();
    const parsed=new DOMParser().parseFromString(html,'text/html');
    const scripts=[...parsed.querySelectorAll('script')];
    scripts.forEach(s=>s.remove());

    for(const node of [...parsed.head.querySelectorAll('style,link[rel="stylesheet"]')]){
      const clone=node.cloneNode(true);
      clone.dataset.viewerBaseStyle='true';
      document.head.appendChild(clone);
    }

    mount.innerHTML=parsed.body.innerHTML;
    await executeScripts(scripts);
    window.imeDicomUi.applyPremiumDom();
    document.documentElement.dataset.viewerIntegration='direct-dom-modular-source-ui-runtime-access-load-extracted';
    console.info('imeDICOM: UI, fullscreen, acceso y carga DICOM separados; fuente transicional activa para metadata y viewport');
  }catch(err){
    console.error(err);
    mount.innerHTML='<div style="height:100%;display:grid;place-items:center;padding:32px;text-align:center;color:#d8e2e8;background:#061018"><div><div style="font-size:18px;font-weight:700;margin-bottom:8px">No se pudo inicializar el visor</div><div style="font-size:13px;color:#91a2af">Recarga la página. El respaldo legacy-viewer.html permanece intacto para recuperación manual.</div></div></div>';
  }
})();
