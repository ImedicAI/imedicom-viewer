(function(){
  function canvasPoint(canvas,e){
    const rect=canvas.getBoundingClientRect();
    return {
      x:(e.clientX-rect.left)*(canvas.width/rect.width),
      y:(e.clientY-rect.top)*(canvas.height/rect.height)
    };
  }
  function canvasFraction(canvas,e){
    const p=canvasPoint(canvas,e);
    return {fx:p.x/canvas.width,fy:p.y/canvas.height};
  }
  function textAnnotationBounds(canvas,a){
    const w=canvas.width,h=canvas.height;
    const baseFontSize=w*.022;
    const fontSize=a.big?baseFontSize*1.6:baseFontSize;
    const weight=a.bold?'bold ':'';
    const style=a.italic?'italic ':'';
    const family=a.fontFamily||'Arial, sans-serif';
    const ctx=canvas.getContext('2d');
    ctx.font=style+weight+fontSize+'px '+family;
    const tw=ctx.measureText(a.text||'').width;
    const pad=fontSize*.35;
    const x=a.x*w,y=a.y*h;
    return {x:x-pad,y:y-pad,w:tw+pad*2,h:fontSize*1.25+pad*2};
  }
  function hitTestText(canvas,file,mx,my){
    if(!file||!file.annotations)return -1;
    for(let i=file.annotations.length-1;i>=0;i--){
      const a=file.annotations[i];if(a.type!=='text')continue;
      const b=textAnnotationBounds(canvas,a),grow=b.h*.25;
      if(mx>=b.x-grow&&mx<=b.x+b.w+grow&&my>=b.y-grow&&my<=b.y+b.h+grow)return i;
    }
    return -1;
  }
  function distToSegment(px,py,x1,y1,x2,y2){
    const dx=x2-x1,dy=y2-y1,lenSq=dx*dx+dy*dy;
    let t=lenSq===0?0:((px-x1)*dx+(py-y1)*dy)/lenSq;
    t=Math.max(0,Math.min(1,t));
    const cx=x1+t*dx,cy=y1+t*dy;
    return Math.hypot(px-cx,py-cy);
  }
  function hitTestAnnotation(canvas,file,mx,my){
    if(!file||!file.annotations)return -1;
    const textIdx=hitTestText(canvas,file,mx,my);if(textIdx>=0)return textIdx;
    const w=canvas.width,h=canvas.height;
    for(let i=file.annotations.length-1;i>=0;i--){
      const a=file.annotations[i];if(a.type!=='arrow')continue;
      const d=distToSegment(mx,my,a.x1*w,a.y1*h,a.x2*w,a.y2*h);
      if(d<Math.max(10,w*.012))return i;
    }
    return -1;
  }
  function hitTestArrowHandle(canvas,file,mx,my){
    if(!file||!file.annotations)return null;
    const w=canvas.width,h=canvas.height,handleR=Math.max(10,w*.014);
    for(let i=file.annotations.length-1;i>=0;i--){
      const a=file.annotations[i];if(a.type!=='arrow')continue;
      const x1=a.x1*w,y1=a.y1*h,x2=a.x2*w,y2=a.y2*h;
      if(Math.hypot(mx-x2,my-y2)<handleR)return {ann:a,mode:'end'};
      if(Math.hypot(mx-x1,my-y1)<handleR)return {ann:a,mode:'start'};
      if(distToSegment(mx,my,x1,y1,x2,y2)<Math.max(8,w*.01))return {ann:a,mode:'whole'};
    }
    return null;
  }
  window.imeDicomAnnotationInteraction={canvasPoint,canvasFraction,textAnnotationBounds,distToSegment,hitTestText,hitTestAnnotation,hitTestArrowHandle};
})();