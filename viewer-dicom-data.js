(function(){
  function dicomStr(dataSet, tag){
    try { const v=dataSet.string(tag); return v ? v.trim() : ''; } catch(e){ return ''; }
  }

  function formatName(raw){
    if(!raw) return '';
    return raw.split('^').filter(Boolean).join(' ');
  }

  function formatDate(raw){
    if(!raw || raw.length<8) return raw || '';
    return raw.substring(6,8)+'/'+raw.substring(4,6)+'/'+raw.substring(0,4);
  }

  function extractMeta(dataSet){
    const patientName=formatName(dicomStr(dataSet,'x00100010'));
    const patientId=dicomStr(dataSet,'x00100020');
    const birthDate=formatDate(dicomStr(dataSet,'x00100030'));
    const institution=dicomStr(dataSet,'x00080080');
    const studyDesc=dicomStr(dataSet,'x00081030') || dicomStr(dataSet,'x0008103e');
    const studyDate=formatDate(dicomStr(dataSet,'x00080020'));
    const studyTime=dicomStr(dataSet,'x00080030');
    const modality=dicomStr(dataSet,'x00080060');
    const presentationIntentType=dicomStr(dataSet,'x00080068').toUpperCase();
    const manufacturer=dicomStr(dataSet,'x00080070');
    const manufacturerModelName=dicomStr(dataSet,'x00081090');
    const laterality=dicomStr(dataSet,'x00200062');
    let viewPosition=dicomStr(dataSet,'x00185101').toUpperCase();
    let viewSource='tag (0018,5101)';
    if(!viewPosition){
      const seriesText=dicomStr(dataSet,'x0008103e').toUpperCase();
      const studyText=dicomStr(dataSet,'x00081030').toUpperCase();
      const latRe=/\bLAT\b|\bLATERAL\b|\bLL\b|\bRL\b/;
      const apRe=/\bAP\b|\bPA\b/;
      if(latRe.test(seriesText)){ viewPosition='LAT'; viewSource='descripcion de serie'; }
      else if(apRe.test(seriesText)){ viewPosition='AP'; viewSource='descripcion de serie'; }
      else if(latRe.test(studyText) && !apRe.test(studyText)){ viewPosition='LAT'; viewSource='descripcion de estudio'; }
      else if(apRe.test(studyText) && !latRe.test(studyText)){ viewPosition='AP'; viewSource='descripcion de estudio'; }
    }
    const isFrontal=viewPosition==='AP' || viewPosition==='PA';
    const timeFmt=studyTime && studyTime.length>=6 ? studyTime.substring(0,2)+':'+studyTime.substring(2,4)+':'+studyTime.substring(4,6) : studyTime;
    const bodyPartExamined=(dicomStr(dataSet,'x00180015') || '').toUpperCase();
    const isChestBodyPart=/CHEST|THORAX|TORAX/.test(bodyPartExamined);
    const isSpineBodyPart=/SPINE|COLUMNA|VERTEB/.test(bodyPartExamined);
    const exposureIndex=dicomStr(dataSet,'x00181411');
    const targetExposureIndex=dicomStr(dataSet,'x00181412');
    const deviationIndex=dicomStr(dataSet,'x00181413');
    return {
      patientName:patientName || '(sin nombre)',
      patientNameRaw:dicomStr(dataSet,'x00100010') || '',
      patientId:patientId || '(sin ID)',
      birthDate:birthDate || '(sin fecha)',
      institution,
      institutionEdited:false,
      studyDesc:studyDesc || '(sin descripción)',
      studyDate:studyDate || '',
      studyTime:timeFmt || '',
      studyDateTimeDisplay:((studyDate||'')+' '+(timeFmt||'')).trim(),
      modality:modality || '',
      presentationIntentType,
      manufacturer,
      manufacturerModelName,
      laterality:laterality || '',
      viewPosition:viewPosition || '',
      viewSource,
      isFrontal,
      bodyPartExamined:bodyPartExamined || '',
      isChestBodyPart,
      isSpineBodyPart,
      exposureIndex:exposureIndex || '',
      targetExposureIndex:targetExposureIndex || '',
      deviationIndex:deviationIndex || ''
    };
  }

  function computePercentiles(arr, loP, hiP){
    let mn=Infinity,mx=-Infinity;
    for(let i=0;i<arr.length;i++){ const v=arr[i]; if(v<mn)mn=v; if(v>mx)mx=v; }
    if(mx===mn) return {lo:mn,hi:mx,median:mn,p15:mn,p85:mn};
    const bins=4096,hist=new Uint32Array(bins),scale=(bins-1)/(mx-mn);
    for(let i=0;i<arr.length;i++){ let idx=Math.round((arr[i]-mn)*scale); hist[idx]++; }
    const total=arr.length;
    function findPercentile(p){
      const targetCount=total*p; let cum=0;
      for(let b=0;b<bins;b++){ cum+=hist[b]; if(cum>=targetCount) return mn+b/scale; }
      return mx;
    }
    return {lo:findPercentile(loP),hi:findPercentile(hiP),median:findPercentile(.5),p15:findPercentile(.15),p85:findPercentile(.85)};
  }

  function extractPixel(dataSet){
    const rows=dataSet.uint16('x00280010');
    const cols=dataSet.uint16('x00280011');
    const bitsAllocated=dataSet.uint16('x00280100') || 16;
    const bitsStored=dataSet.uint16('x00280101') || bitsAllocated;
    const pixelRepresentation=dataSet.uint16('x00280103') || 0;
    const samplesPerPixel=dataSet.uint16('x00280002') || 1;
    const photometric=(dicomStr(dataSet,'x00280004') || '').toUpperCase();
    const planarConfig=dataSet.uint16('x00280006') || 0;
    let windowCenter=parseFloat((dicomStr(dataSet,'x00281050')||'').split('\\')[0]);
    let windowWidth=parseFloat((dicomStr(dataSet,'x00281051')||'').split('\\')[0]);
    const rescaleIntercept=parseFloat(dicomStr(dataSet,'x00281052')) || 0;
    const rescaleSlope=parseFloat(dicomStr(dataSet,'x00281053')) || 1;

    const pixelDataElement=dataSet.elements.x7fe00010;
    if(!pixelDataElement) throw new Error('El archivo no contiene datos de imagen (pixel data)');
    if(dataSet.encapsulated || pixelDataElement.undefinedLength){
      throw new Error('Imagen comprimida (JPEG/JPEG2000) — no soportada en esta versión del visor. Transfer syntax: '+(dataSet.transferSyntax || 'desconocido'));
    }

    const byteArray=dataSet.byteArray, offset=pixelDataElement.dataOffset;
    let raw;
    if(bitsAllocated===16){
      raw=(pixelRepresentation===1)
        ? new Int16Array(byteArray.buffer,byteArray.byteOffset+offset,rows*cols*samplesPerPixel)
        : new Uint16Array(byteArray.buffer,byteArray.byteOffset+offset,rows*cols*samplesPerPixel);
    }else{
      raw=new Uint8Array(byteArray.buffer,byteArray.byteOffset+offset,rows*cols*samplesPerPixel);
    }

    if(samplesPerPixel===1){
      const pct=computePercentiles(raw,.05,.95);
      const rLo=pct.lo*rescaleSlope+rescaleIntercept;
      const rHi=pct.hi*rescaleSlope+rescaleIntercept;
      const rMed=pct.median*rescaleSlope+rescaleIntercept;
      const dataSpan=rHi-rLo;
      const factoryWC=Math.pow(2,bitsStored-1);
      const factoryWW=Math.pow(2,bitsStored)-1;
      const isFactoryDefaultWindow=!isNaN(windowCenter) && !isNaN(windowWidth) && Math.abs(windowCenter-factoryWC)<1 && Math.abs(windowWidth-factoryWW)<1;
      if(isNaN(windowCenter) || isNaN(windowWidth) || isFactoryDefaultWindow){
        const halfSpan=Math.max(rMed-rLo,rHi-rMed)*1.1;
        windowWidth=(halfSpan*2)||1;
        windowCenter=rMed;
      }else if(dataSpan>0 && dataSpan<windowWidth*.35){
        const halfSpan=Math.max(rMed-rLo,rHi-rMed)*1.1;
        windowWidth=halfSpan*2;
        windowCenter=rMed;
      }
    }else if(isNaN(windowCenter) || isNaN(windowWidth)){
      let min=Infinity,max=-Infinity;
      for(let i=0;i<raw.length;i++){ if(raw[i]<min)min=raw[i]; if(raw[i]>max)max=raw[i]; }
      windowCenter=(max+min)/2; windowWidth=(max-min)||1;
    }

    const pixelSpacingRaw=dicomStr(dataSet,'x00280030') || dicomStr(dataSet,'x00181164') || '';
    const pixelSpacingParts=pixelSpacingRaw.split('\\').map(parseFloat);
    const mmPerPixel=(pixelSpacingParts.length===2 && !isNaN(pixelSpacingParts[0])) ? (pixelSpacingParts[0]+pixelSpacingParts[1])/2 : NaN;

    return {
      rows,cols,raw,samplesPerPixel,photometric,planarConfig,
      windowCenter,windowWidth,rescaleIntercept,rescaleSlope,bitsAllocated,mmPerPixel,
      wlRangeMin:windowCenter-windowWidth*1.2,
      wlRangeMax:windowCenter+windowWidth*1.2,
      wwRangeMax:Math.max(windowWidth*3,10)
    };
  }

  window.imeDicomData={dicomStr,formatName,formatDate,extractMeta,extractPixel,computePercentiles};
})();
