(function(global){
  'use strict';

  function cloneAnnotations(list){
    return JSON.parse(JSON.stringify(list || []));
  }

  function pushUndo(file){
    if(!file) return;
    file.undoStack = file.undoStack || [];
    file.undoStack.push(cloneAnnotations(file.annotations));
    if(file.undoStack.length > 10) file.undoStack.shift();
    file.redoStack = [];
  }

  function undo(file){
    if(!file || !file.undoStack || !file.undoStack.length) return false;
    file.redoStack = file.redoStack || [];
    file.redoStack.push(cloneAnnotations(file.annotations));
    if(file.redoStack.length > 10) file.redoStack.shift();
    file.annotations = file.undoStack.pop();
    return true;
  }

  function redo(file){
    if(!file || !file.redoStack || !file.redoStack.length) return false;
    file.undoStack = file.undoStack || [];
    file.undoStack.push(cloneAnnotations(file.annotations));
    if(file.undoStack.length > 10) file.undoStack.shift();
    file.annotations = file.redoStack.pop();
    return true;
  }

  function distToSegment(px,py,x1,y1,x2,y2){
    const dx=x2-x1, dy=y2-y1;
    const lenSq=dx*dx+dy*dy;
    let t=lenSq===0 ? 0 : ((px-x1)*dx+(py-y1)*dy)/lenSq;
    t=Math.max(0,Math.min(1,t));
    const cx=x1+t*dx, cy=y1+t*dy;
    return Math.hypot(px-cx,py-cy);
  }

  function angleAtVertex(vertex,a,b,w,h){
    const v1={x:(a.fx-vertex.fx)*w,y:(a.fy-vertex.fy)*h};
    const v2={x:(b.fx-vertex.fx)*w,y:(b.fy-vertex.fy)*h};
    const dot=v1.x*v2.x+v1.y*v2.y;
    const mag1=Math.hypot(v1.x,v1.y),mag2=Math.hypot(v2.x,v2.y);
    if(mag1===0||mag2===0) return 0;
    const cos=Math.max(-1,Math.min(1,dot/(mag1*mag2)));
    return Math.acos(cos)*180/Math.PI;
  }

  function cobbAngleBetweenLines(p1,p2,p3,p4,w,h){
    const a1=Math.atan2((p2.fy-p1.fy)*h,(p2.fx-p1.fx)*w);
    const a2=Math.atan2((p4.fy-p3.fy)*h,(p4.fx-p3.fx)*w);
    let d=Math.abs((a1-a2)*180/Math.PI)%180;
    if(d>90) d=180-d;
    return d;
  }

  // Conserva exactamente el comportamiento legado: la etiqueta se coloca
  // sobre la bisectriz; para rayos casi opuestos (~180°), donde la suma de
  // vectores no define una bisectriz estable, usa la perpendicular al primer
  // rayo como respaldo en vez de dejar la etiqueta sobre el vértice.
  function angleBisectorLabelPos(vx,vy,ax,ay,bx,by,w){
    const v1x=ax-vx,v1y=ay-vy,v1mag=Math.hypot(v1x,v1y)||1;
    const v2x=bx-vx,v2y=by-vy,v2mag=Math.hypot(v2x,v2y)||1;
    let bisX=v1x/v1mag+v2x/v2mag,bisY=v1y/v1mag+v2y/v2mag;
    let bisMag=Math.hypot(bisX,bisY);
    if(bisMag<0.0001){
      bisX=-v1y/v1mag;
      bisY=v1x/v1mag;
      bisMag=1;
    }
    const dist=w*0.045;
    return {x:vx+(bisX/bisMag)*dist,y:vy+(bisY/bisMag)*dist};
  }

  global.imeDicomTools={
    cloneAnnotations,
    pushUndo,
    undo,
    redo,
    distToSegment,
    angleAtVertex,
    cobbAngleBetweenLines,
    angleBisectorLabelPos
  };
})(window);
