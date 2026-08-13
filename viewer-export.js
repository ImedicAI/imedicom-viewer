(function(){
  function sanitizeFilenamePart(s){
    return (s || '').toString().trim().replace(/[\\/:*?"<>|]+/g, '_');
  }

  function buildPatientFilename(f){
    const raw = (f && f.meta && f.meta.patientNameRaw) || '';
    const familyField = raw.split('^')[0] || '';
    let surname = familyField.trim().split(/\s+/)[0] || '';
    if (!surname) surname = 'Paciente';
    const id = sanitizeFilenamePart(f && f.meta && f.meta.patientId) || 'SinID';
    return sanitizeFilenamePart(surname) + ' ' + id;
  }

  function buildUniqueFilename(f, files){
    const base = buildPatientFilename(f);
    const sameBase = (files || []).filter(x => x.status === 'ok' && buildPatientFilename(x) === base);
    if (sameBase.length <= 1) return base;
    const view = (f.meta && (f.meta.viewPosition || f.meta.laterality)) || '';
    if (view) return base + ' ' + sanitizeFilenamePart(view);
    const position = sameBase.indexOf(f) + 1;
    return base + ' ' + position;
  }

  function reserveUniqueFilename(baseName, usedNames){
    let candidate = baseName;
    let n = 2;
    while (usedNames.has(candidate)) {
      candidate = baseName + ' (' + n + ')';
      n++;
    }
    usedNames.add(candidate);
    return candidate;
  }

  function canvasToBlobAsync(canvasEl, mime, quality){
    return new Promise(resolve => canvasEl.toBlob(resolve, mime, quality));
  }

  function triggerBrowserDownload(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function downloadCanvasAsJpg(canvasEl, filename, saveBlob){
    const blob = await canvasToBlobAsync(canvasEl, 'image/jpeg', 0.95);
    if (saveBlob && await saveBlob(blob, filename)) return;
    triggerBrowserDownload(blob, filename);
  }

  async function downloadCanvasAsPng(canvasEl, filename, saveBlob){
    const blob = await canvasToBlobAsync(canvasEl, 'image/png');
    if (saveBlob && await saveBlob(blob, filename)) return;
    triggerBrowserDownload(blob, filename);
  }

  async function downloadCanvasAsPdf(canvasEl, filename, saveBlob){
    if (window.__dvPdfFailed || !window.jspdf) {
      throw new Error('El generador de PDF no cargó (problema de conexión).');
    }
    const { jsPDF } = window.jspdf;
    const orientation = canvasEl.width >= canvasEl.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [canvasEl.width, canvasEl.height] });
    pdf.addImage(canvasEl.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvasEl.width, canvasEl.height);
    const blob = pdf.output('blob');
    if (saveBlob && await saveBlob(blob, filename)) return;
    pdf.save(filename);
  }

  function buildExportCanvas(f, multiplier, deps){
    if (!deps || typeof deps.windowToCanvas !== 'function' || typeof deps.drawOverlay !== 'function' || typeof deps.drawAnnotations !== 'function') {
      throw new Error('Dependencias de exportación incompletas');
    }
    if (!f.meta.isFrontal && f.meta.convexitySide === undefined && typeof deps.detectConvexitySide === 'function') {
      f.meta.convexitySide = deps.detectConvexitySide(f.pixel);
    }
    const exportCanvas = document.createElement('canvas');
    const ctx = deps.windowToCanvas(f, exportCanvas, multiplier);
    deps.drawOverlay(ctx, f, multiplier);
    deps.drawAnnotations(ctx, f);
    return exportCanvas;
  }

  window.imeDicomExport = {
    sanitizeFilenamePart,
    buildPatientFilename,
    buildUniqueFilename,
    reserveUniqueFilename,
    canvasToBlobAsync,
    downloadCanvasAsJpg,
    downloadCanvasAsPng,
    downloadCanvasAsPdf,
    buildExportCanvas
  };
})();
