(function(global){
  'use strict';

  function parseDicom(byteArray){
    function readUint16(o){ return byteArray[o] | (byteArray[o+1] << 8); }
    function readUint32(o){ return (byteArray[o] | (byteArray[o+1]<<8) | (byteArray[o+2]<<16) | (byteArray[o+3]<<24)) >>> 0; }
    function pad4(n){ return n.toString(16).padStart(4,'0'); }
    function tagStr(g,e){ return 'x' + pad4(g) + pad4(e); }

    const longVRs = new Set(['OB','OW','OF','SQ','UT','UN','OD','OL','UC','UR']);
    const elements = {};
    let offset = 0;
    let hasPreamble = false;

    if(byteArray.length > 132){
      const magic = String.fromCharCode(byteArray[128],byteArray[129],byteArray[130],byteArray[131]);
      if(magic === 'DICM'){ hasPreamble = true; offset = 132; }
    }

    let transferSyntax = null;
    if(hasPreamble){
      while(offset < byteArray.length){
        const group = readUint16(offset);
        if(group !== 0x0002) break;
        const element = readUint16(offset+2);
        const vr = String.fromCharCode(byteArray[offset+4],byteArray[offset+5]);
        let length, valueOffset;
        if(longVRs.has(vr)){ length = readUint32(offset+8); valueOffset = offset+12; }
        else { length = readUint16(offset+6); valueOffset = offset+8; }
        elements[tagStr(group,element)] = {dataOffset:valueOffset,length,vr};
        offset = valueOffset + length;
      }
      const tsElem = elements.x00020010;
      if(tsElem){
        let str = '';
        for(let i=0;i<tsElem.length;i++){
          const c = byteArray[tsElem.dataOffset+i];
          if(c!==0) str += String.fromCharCode(c);
        }
        transferSyntax = str.trim();
      }
    }

    let isExplicitVR = true;
    if(transferSyntax === '1.2.840.10008.1.2') isExplicitVR = false;
    if(!hasPreamble) isExplicitVR = false;

    const encapsulated = !!transferSyntax && (
      transferSyntax.indexOf('1.2.840.10008.1.2.4') === 0 ||
      transferSyntax.indexOf('1.2.840.10008.1.2.5') === 0 ||
      transferSyntax.indexOf('1.2.840.10008.1.2.6') === 0
    );

    function skipSequenceUndefined(startOffset, explicitVR){
      let o = startOffset;
      while(o < byteArray.length - 8){
        const g = readUint16(o), e = readUint16(o+2);
        const len = readUint32(o+4);
        o += 8;
        if(g===0xFFFE && e===0xE0DD) break;
        if(g===0xFFFE && e===0xE000){
          if(len===0xFFFFFFFF) o = skipItemUndefined(o,explicitVR);
          else o += len;
        }else break;
      }
      return o;
    }

    function skipItemUndefined(startOffset, explicitVR){
      let o = startOffset;
      while(o < byteArray.length - 8){
        const g = readUint16(o), e = readUint16(o+2);
        if(g===0xFFFE && e===0xE00D){ o += 8; break; }
        let len, vOff;
        if(explicitVR){
          const vr = String.fromCharCode(byteArray[o+4],byteArray[o+5]);
          if(longVRs.has(vr)){ len = readUint32(o+8); vOff = o+12; }
          else { len = readUint16(o+6); vOff = o+8; }
        }else{
          len = readUint32(o+4); vOff = o+8;
        }
        if(len===0xFFFFFFFF) vOff = skipSequenceUndefined(vOff,explicitVR);
        else vOff += len;
        o = vOff;
      }
      return o;
    }

    function skipUndefinedLength(startOffset){ return skipSequenceUndefined(startOffset,isExplicitVR); }

    while(offset < byteArray.length - 8){
      const group = readUint16(offset);
      const element = readUint16(offset+2);
      let vr, length, valueOffset;
      if(isExplicitVR){
        vr = String.fromCharCode(byteArray[offset+4],byteArray[offset+5]);
        if(longVRs.has(vr)){ length = readUint32(offset+8); valueOffset = offset+12; }
        else { length = readUint16(offset+6); valueOffset = offset+8; }
      }else{
        vr = null; length = readUint32(offset+4); valueOffset = offset+8;
      }
      if(length===0xFFFFFFFF){
        if(group===0x7fe0 && element===0x0010){
          elements[tagStr(group,element)] = {dataOffset:valueOffset,length:-1,vr,undefinedLength:true};
          break;
        }
        const contentEnd = skipUndefinedLength(valueOffset);
        elements[tagStr(group,element)] = {dataOffset:valueOffset,length:contentEnd-valueOffset,vr};
        offset = contentEnd;
        continue;
      }
      elements[tagStr(group,element)] = {dataOffset:valueOffset,length,vr};
      offset = valueOffset + length;
      if(group===0x7fe0 && element===0x0010) break;
    }

    function stringVal(tag){
      const el = elements[tag];
      if(!el || el.length<=0) return '';
      let str = '';
      for(let i=0;i<el.length;i++) str += String.fromCharCode(byteArray[el.dataOffset+i]);
      return str.replace(/\0/g,'').trim();
    }

    function uint16Val(tag){
      const el = elements[tag];
      if(!el) return undefined;
      return byteArray[el.dataOffset] | (byteArray[el.dataOffset+1] << 8);
    }

    return {elements,byteArray,string:stringVal,uint16:uint16Val,encapsulated,transferSyntax};
  }

  global.imeDicomCore = Object.freeze({
    version:'1.0.0',
    dicomParser:Object.freeze({parseDicom})
  });
})(window);
