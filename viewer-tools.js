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
    const v1x=(a.fx-vertex.fx)*w, v1y=(a.fy-vertex.fy)*h;
    const v2x=(b.fx-vertex.fx)*w, v2y=(b.fy-vertex.fy)*h;
    const dot=v1x*v2x+v1y*v2y;
    const m1=Math.hypot(v1x,v1y), m2=Math.hypot(v2x,v2y);
    if(!m1 || !m2) return 0;
    const c=Math.max(-1,Math.min(1,dot/(m1*m2)));
    return Math.acos(c)*180/Math.PI;
  }

  function cobbAngleBetweenLines(p1,p2,p3,p4,w,h){
    const a1=Math.atan2((p2.fy-p1.fy)*h,(p2.fx-p1.fx)*w);
    const a2=Math.atan2((p4.fy-p3.fy)*h,(p4.fx-p3.fx)*w);
    let d=Math.abs((a1-a2)*180/Math.PI)%180;
    if(d>90) d=180-d;
    return d;
  }

  function angleBisectorLabelPos(vx,vy,ax,ay,bx,by,w){
    const u1x=ax-vx, u1y=ay-vy, u2x=bx-vx, u2y=by-vy;
    const m1=Math.hypot(u1x,u1y)||1, m2=Math.hypot(u2x,u2y)||1;
    let bxu=u1x/m1+u2x/m2, byu=u1y/m1+u2y/m2;
    const bm=Math.hypot(bxu,byu)||1;
    bxu/=bm; byu/=bm;
    const radius=Math.max(w*0.035,18);
    return {x:vx+bxu*radius,y:vy+byu*radius};
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
