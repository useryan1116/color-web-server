// Hide only handwriting until it is ready; never hold forms or navigation hostage.
const root = document.documentElement;
let pending=false;
function ensureHandwriting(){
  if(pending||root.dataset.handwriting==='ready')return;
  pending=true;
  const fallback=()=>{if(root.dataset.handwriting!=='ready')root.dataset.handwriting='fallback';};
  const timeout=setTimeout(fallback,2500);
  document.fonts.load('400 32px ColorLabHandwriting','每一種顏色').then(fonts=>{
    if(fonts.length)root.dataset.handwriting='ready';else fallback();
  }).catch(fallback).finally(()=>{pending=false;clearTimeout(timeout);});
}
document.fonts.addEventListener('loadingdone',event=>{
  if(event.fontfaces.some(face=>face.family.replace(/["']/g,'')==='ColorLabHandwriting'&&face.status==='loaded'))root.dataset.handwriting='ready';
});
window.addEventListener('load',ensureHandwriting);
window.addEventListener('pageshow',ensureHandwriting);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ensureHandwriting();});
ensureHandwriting();
