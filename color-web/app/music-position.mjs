import {positionStore} from './music-preference.mjs';
export function draggableMusic(widget, handle) {
  let point=null, drag=null, suppressClick=false;
  const apply=()=>{
    if(!point)return;
    const anchor=Math.max(8,Math.min(innerWidth-52,point.x*(innerWidth-44)));
    const right=point.x>.5;widget.dataset.side=right?'right':'left';
    widget.style.left=right?'auto':anchor+'px';
    widget.style.right=right?Math.max(8,innerWidth-anchor-44)+'px':'auto';
    widget.style.top=Math.max(8,Math.min(innerHeight-52,point.y*(innerHeight-44)))+'px';
    widget.style.bottom='auto';
  };
  const reset=()=>{for(const key of ['left','right','top','bottom'])widget.style.removeProperty(key);delete widget.dataset.side;};
  const persist=positionStore(value=>{point=value;if(!point)reset();apply();});
  const save=()=>persist(point);
  handle.style.touchAction='none';handle.style.cursor='grab';
  handle.setAttribute('aria-description','可拖曳移動。鍵盤方向鍵移動，Home 回到預設位置。');
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const rect=handle.getBoundingClientRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<6)return;
    drag.moved=true;
    point={x:Math.max(0,Math.min(1,(drag.left+dx)/Math.max(1,innerWidth-44))),y:Math.max(0,Math.min(1,(drag.top+dy)/Math.max(1,innerHeight-44)))};
    apply();
  });
  const finish=event=>{
    if(!drag||drag.id!==event.pointerId)return;
    suppressClick=drag.moved;if(drag.moved)save();drag=null;
    if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
    setTimeout(()=>{suppressClick=false;},0);
  };
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  handle.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
  handle.addEventListener('keydown',event=>{
    if(event.key==='Home'){event.preventDefault();point=null;reset();save();return;}
    const delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[event.key];
    if(!delta)return;event.preventDefault();const rect=handle.getBoundingClientRect();
    point={x:Math.max(0,Math.min(1,(rect.left+delta[0])/Math.max(1,innerWidth-44))),y:Math.max(0,Math.min(1,(rect.top+delta[1])/Math.max(1,innerHeight-44)))};apply();save();
  });
  window.addEventListener('resize',apply);apply();return apply;
}
