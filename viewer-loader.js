(async function(){
  const mount=document.getElementById('viewerMount');
  if(!mount) return;

  const replacementAudit=[];
  function replaceFunctionBlock(text,startMarker,endMarker,replacement,label){
    const start=text.indexOf(startMarker),end=text.indexOf(endMarker,start);
    if(start<0||end<0){
      const name=label||startMarker.slice(0,60);
      throw new Error('Integración modular: no se encontró el bloque requerido «'+name+'»');
    }
    replacementAudit.push(label||startMarker.slice(0,60));
    return text.slice(0,start)+replacement+text.slice(end);
  }

  function replaceInlineModules(sourceText){
    if(sourceText.includes('Control de acceso (candado)')&&window.imeDicomAccess?.init){
      replacementAudit.push('access');
      return 'window.imeDicomAccess.init();';
    }

    const isMainViewerScript=sourceText.includes('const dicomParser = {')&&sourceText.includes('const state = { files: [], activeIndex: -1 }');
    if(!isMainViewerScript) return sourceText;

    let text=sourceText;
    if(window.imeDicomCore?.dicomParser){
      const startMarker='  const dicomParser = {';
      const stateMarker='  const state = { files: [], activeIndex: -1 };';
      const start=text.indexOf(startMarker),stateAt=text.indexOf(stateMarker,start);
      if(start<0||stateAt<0) throw new Error('Integración modular: no se encontró el parser/state DICOM legado esperado');
      text=text.slice(0,start)+'  const dicomParser = window.imeDicomCore.dicomParser;\n\n'+text.slice(stateAt);
      replacementAudit.push('dicom-parser');
    }

    if(window.imeDicomRuntime){
      text=replaceFunctionBlock(
        text,
        '  // ==================== Pantalla completa (sin distractores del navegador) ====================',
        '\n\n  const dropEl = document.getElementById(\'dv-drop\');',
        "  window.imeDicomRuntime.initFullscreen();\n  function reenterFullscreenIfPending(){ return window.imeDicomRuntime.reenterFullscreenIfPending(); }\n  function armFullscreenReentryOnNextClick(){ return window.imeDicomRuntime.armFullscreenReentryOnNextClick(); }",
        'fullscreen-runtime'
      );
    }

    if(window.imeDicomLoad?.init){
      text=replaceFunctionBlock(
        text,
        '  // ---- Soporte para arrastrar CARPETAS completas (no solo archivos sueltos) ----',
        '\n  function dicomStr(dataSet, tag){',
        "  const loadController = window.imeDicomLoad.init({ state, dicomParser, extractMeta, extractPixel, renderFileList, selectFile, reenterFullscreenIfPending });\n  function handleFiles(fileList){ return loadController.handleFiles(fileList); }\n",
        'dicom-load'
      );
    }

    if(window.imeDicomData?.extractMeta && window.imeDicomData?.extractPixel){
      text=replaceFunctionBlock(
        text,
        '  function dicomStr(dataSet, tag){',
        '\n  // Calcula, para imagenes en vista lateral,',
        "  function dicomStr(dataSet, tag){ return window.imeDicomData.dicomStr(dataSet, tag); }\n  function formatName(raw){ return window.imeDicomData.formatName(raw); }\n  function formatDate(raw){ return window.imeDicomData.formatDate(raw); }\n  function extractMeta(dataSet){ return window.imeDicomData.extractMeta(dataSet); }\n  function extractPixel(dataSet){ return window.imeDicomData.extractPixel(dataSet); }\n",
        'dicom-data'
      );
    }

    if(window.imeDicomViewport?.init){
      text=replaceFunctionBlock(
        text,
        '  // ---- Zoom: el tamaño de ajuste',
        '\n  // ---- Herramientas de anotacion: flecha y texto',
        "  const viewerWrap = document.getElementById('dv-viewer-wrap');\n  let zoomLevel = 1;\n  let interactionActive = false;\n  let pendingToggleStart = null;\n  let leftWindowDrag = null;\n  let suppressNextContextDelete = false;\n  const viewportController = window.imeDicomViewport.init({\n    state, canvas, draw, wlSlider, wwSlider, wlVal, wwVal,\n    isInteractionActive:()=>interactionActive,\n    onZoomChange:(v)=>{ zoomLevel=v; },\n    onSuppressContextDelete:()=>{ suppressNextContextDelete=true; }\n  });\n  function setInteractionActive(on){ interactionActive=!!on; viewportController.setInteractionActive(interactionActive); }\n  function fitCanvasToContainer(){ return viewportController.fitCanvasToContainer(); }\n  window.fitCanvasToContainer = fitCanvasToContainer;\n  function applyZoom(){ viewportController.setZoomLevel(zoomLevel); }\n  function updateLiveReadout(p){\n    const el=document.getElementById('dv-wlww-live');\n    if(el){ el.innerHTML='<div>WL: '+Math.round(p.windowCenter)+'</div><div>WW: '+Math.round(p.windowWidth)+'</div>'; el.style.display='block'; }\n  }\n\n",
        'viewport-core'
      );
    }

    if(window.imeDicomAnnotationInteraction){
      text=replaceFunctionBlock(text,'  function canvasFraction(e){','\n  const FIXED_FONT',"  function canvasFraction(e){ return window.imeDicomAnnotationInteraction.canvasFraction(canvas,e); }\n",'annotation-canvas-fraction');
      text=replaceFunctionBlock(text,'  function textAnnotationBounds(a){','\n  function hitTestText(mx, my){',"  function textAnnotationBounds(a){ return window.imeDicomAnnotationInteraction.textAnnotationBounds(canvas,a); }\n",'annotation-text-bounds');
      text=replaceFunctionBlock(text,'  function hitTestText(mx, my){','\n  function distToSegment(px, py, x1, y1, x2, y2){',"  function hitTestText(mx,my){ const f=state.files[state.activeIndex]; return window.imeDicomAnnotationInteraction.hitTestText(canvas,f,mx,my); }\n",'annotation-hit-text');
      text=replaceFunctionBlock(text,'  function distToSegment(px, py, x1, y1, x2, y2){','\n  function hitTestAnnotation(mx, my){',"  function distToSegment(px,py,x1,y1,x2,y2){ return window.imeDicomAnnotationInteraction.distToSegment(px,py,x1,y1,x2,y2); }\n",'annotation-distance');
      text=replaceFunctionBlock(text,'  function hitTestAnnotation(mx, my){','\n  // Detecta si el punto cae sobre el ORIGEN',"  function hitTestAnnotation(mx,my){ const f=state.files[state.activeIndex]; return window.imeDicomAnnotationInteraction.hitTestAnnotation(canvas,f,mx,my); }\n",'annotation-hit-any');
      text=replaceFunctionBlock(text,'  function hitTestArrowHandle(mx, my){','\n  // Clic derecho sobre una flecha o texto',"  function hitTestArrowHandle(mx,my){ const f=state.files[state.activeIndex]; return window.imeDicomAnnotationInteraction.hitTestArrowHandle(canvas,f,mx,my); }\n",'annotation-hit-arrow');
    }

    if(window.imeDicomTools){
      text=text.replace(/\bpushUndo\(f\);/g,'window.imeDicomTools.pushUndo(f);');
      text=text.replace(/const angleDeg = angleAtVertex\(/g,'const angleDeg = window.imeDicomTools.angleAtVertex(');
      text=text.replace(/const cobbDeg = cobbAngleBetweenLines\(/g,'const cobbDeg = window.imeDicomTools.cobbAngleBetweenLines(');
      text=text.replace(/const labelPos = angleBisectorLabelPos\(/g,'const labelPos = window.imeDicomTools.angleBisectorLabelPos(');
      replacementAudit.push('tools-call-bridges');
    }

    if(window.imeDicomRender){
      text=replaceFunctionBlock(text,'  function renderBaseImage(f, scale){','\n  function windowToCanvas(f, targetCanvas, scale){',"  function renderBaseImage(f, scale){ return window.imeDicomRender.renderBaseImage(f, scale); }\n",'render-base');
      text=replaceFunctionBlock(text,'  function windowToCanvas(f, targetCanvas, scale){','\n  // Nota: el overlay se calcula',"  function windowToCanvas(f, targetCanvas, scale){ return window.imeDicomRender.windowToCanvas(f, targetCanvas, scale); }\n",'render-window-to-canvas');
      text=replaceFunctionBlock(text,'  function drawOverlay(ctx, f, scale){','\n  function draw(f, scale, skipLayout){',"  function drawOverlay(ctx, f, scale){ return window.imeDicomRender.drawOverlay(ctx, f, scale); }\n",'render-overlay');
      text=replaceFunctionBlock(text,'  function drawAnnotations(ctx, f){','\n  function updateMetaPanel(f){',"  function drawAnnotations(ctx, f){ return window.imeDicomRender.drawAnnotations(ctx, f); }\n",'render-annotations');
    }

    if(window.imeDicomExport){
      text=replaceFunctionBlock(text,'  function buildExportCanvas(f, multiplier){','\n  function sanitizeFilenamePart(s){',"  function buildExportCanvas(f, multiplier){\n    return window.imeDicomExport.buildExportCanvas(f, multiplier, { windowToCanvas, drawOverlay, drawAnnotations, detectConvexitySide });\n  }\n",'export-canvas');
      text=replaceFunctionBlock(text,'  function sanitizeFilenamePart(s){','\n  // ---- Bloqueo global de exportacion ----',
        "  function sanitizeFilenamePart(s){ return window.imeDicomExport.sanitizeFilenamePart(s); }\n"+
        "  function buildPatientFilename(f){ return window.imeDicomExport.buildPatientFilename(f); }\n"+
        "  function buildUniqueFilename(f){ return window.imeDicomExport.buildUniqueFilename(f, state.files); }\n"+
        "  function reserveUniqueFilename(baseName, usedNames){ return window.imeDicomExport.reserveUniqueFilename(baseName, usedNames); }\n"+
        "  function canvasToBlobAsync(canvasEl, mime, quality){ return window.imeDicomExport.canvasToBlobAsync(canvasEl, mime, quality); }\n"+
        "  async function downloadCanvasAsJpg(canvasEl, filename){ return window.imeDicomExport.downloadCanvasAsJpg(canvasEl, filename, saveBlobToChosenFolder); }\n"+
        "  async function downloadCanvasAsPng(canvasEl, filename){ return window.imeDicomExport.downloadCanvasAsPng(canvasEl, filename, saveBlobToChosenFolder); }\n"+
        "  async function downloadCanvasAsPdf(canvasEl, filename){ return window.imeDicomExport.downloadCanvasAsPdf(canvasEl, filename, saveBlobToChosenFolder); }\n",
        'export-helpers'
      );
    }
    return text;
  }

  async function executeScripts(scripts){
    for(const source of scripts){
      await new Promise((resolve,reject)=>{
        const s=document.createElement('script');
        for(const a of source.attributes) if(a.name!=='src'&&a.name!=='onerror') s.setAttribute(a.name,a.value);
        if(source.src){
          const originalSrc=source.getAttribute('src');
          const hasFallback=source.hasAttribute('onerror');
          const fallbackCode=source.getAttribute('onerror')||'';
          s.src=originalSrc;
          s.onload=resolve;
          s.onerror=()=>{
            if(fallbackCode.includes('__dvPdfFailed')) window.__dvPdfFailed=true;
            const err=new Error('imeDICOM: no se pudo cargar '+originalSrc);
            if(hasFallback){ console.warn(err.message+'; se mantiene el fallback previsto'); resolve(); }
            else { console.error(err); reject(err); }
          };
          document.body.appendChild(s);
        }else{
          try{
            s.textContent=replaceInlineModules(source.textContent);
            document.body.appendChild(s);
            resolve();
          }catch(err){ reject(err); }
        }
      });
    }
  }

  try{
    if(!window.imeDicomCore?.dicomParser) throw new Error('dicom-core.js no fue cargado');
    if(!window.imeDicomData?.extractMeta || !window.imeDicomData?.extractPixel) throw new Error('viewer-dicom-data.js no fue cargado');
    if(!window.imeDicomTools) throw new Error('viewer-tools.js no fue cargado');
    if(!window.imeDicomRender) throw new Error('viewer-render.js no fue cargado');
    if(!window.imeDicomExport) throw new Error('viewer-export.js no fue cargado');
    if(!window.imeDicomUi?.applyPremiumDom) throw new Error('viewer-ui.js no fue cargado');
    if(!window.imeDicomRuntime?.initFullscreen) throw new Error('viewer-runtime.js no fue cargado');
    if(!window.imeDicomAccess?.init) throw new Error('viewer-access.js no fue cargado');
    if(!window.imeDicomLoad?.init) throw new Error('viewer-load.js no fue cargado');
    if(!window.imeDicomViewport?.init) throw new Error('viewer-viewport.js no fue cargado');
    if(!window.imeDicomAnnotationInteraction) throw new Error('viewer-annotation-interaction.js no fue cargado');

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
    document.documentElement.dataset.viewerIntegration='direct-dom-modular-source-data-ui-runtime-access-load-viewport-annotation-hit-extracted';
    document.documentElement.dataset.viewerReplacementCount=String(replacementAudit.length);
    console.info('imeDICOM: integración modular aplicada',replacementAudit);
  }catch(err){
    console.error(err);
    mount.innerHTML='<div style="height:100%;display:grid;place-items:center;padding:32px;text-align:center;color:#d8e2e8;background:#061018"><div><div style="font-size:18px;font-weight:700;margin-bottom:8px">No se pudo inicializar el visor</div><div style="font-size:13px;color:#91a2af">Recarga la página. El respaldo legacy-viewer.html permanece intacto para recuperación manual.</div></div></div>';
  }
})();