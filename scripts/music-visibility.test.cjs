const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('backgrounding pauses music, returning resumes at saved time, manual mute stays muted',async()=>{
  let audios=[],clock=0;
  const docEvents={},winEvents={},saved=new Map(),elements=[];
  const element=()=>({style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},append(){},addEventListener(){},contains(){return false;},querySelector(){return element();},focus(){}});
  const document={hidden:false,body:element(),head:element(),createElement(){const e=element();elements.push(e);return e;},querySelector:()=>null,querySelectorAll:()=>audios,addEventListener:(k,v)=>docEvents[k]=v};
  class Audio {
    constructor(src){this.src=src;this.volume=1;this.paused=true;this.currentTime=0;this.duration=120;this.events={};audios.push(this);}
    addEventListener(k,v){this.events[k]=v;}
    async play(){this.events.loadedmetadata?.();this.paused=false;}
    pause(){this.paused=true;}
    remove(){audios=audios.filter(a=>a!==this);}
  }
  const context={document,Audio,location:{hash:'#home'},draggableMusic:()=>()=>{},window:{addEventListener:(k,v)=>winEvents[k]=v},sessionStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>clock+=10000},requestAnimationFrame:fn=>fn(),WeakMap};
  vm.createContext(context);
  const source=fs.readFileSync('color-web/app/ambient-music.mjs','utf8').replace(/import[^\n]+/,'');
  vm.runInContext(source,context);
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  await settle();assert.equal(audios.length,1);assert.equal(audios[0].paused,false);
  audios[0].currentTime=12;
  document.hidden=true;docEvents.visibilitychange();assert.ok(audios.every(a=>a.paused));
  docEvents['colorlab-page-route']();await settle();assert.ok(audios.every(a=>a.paused),'route changes cannot play while hidden');
  document.hidden=false;docEvents.visibilitychange();await settle();
  assert.equal(audios.length,1);assert.equal(audios[0].paused,false);assert.equal(audios[0].currentTime,12);
  elements[0].onclick();await settle();assert.equal(audios.length,0);
  document.hidden=true;docEvents.visibilitychange();document.hidden=false;docEvents.visibilitychange();await settle();
  assert.equal(audios.length,0,'returning must respect manual mute');
});
