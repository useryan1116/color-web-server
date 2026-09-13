const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function player(){
  let clock=0,frames=[],audios=[],defer=false;
  const docEvents={},winEvents={},saved=new Map(),elements=[];
  const element=()=>({style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},append(){},addEventListener(){},contains(){return false;},querySelector(){return element();},focus(){}});
  const document={hidden:false,body:element(),head:element(),createElement(){const e=element();elements.push(e);return e;},querySelector:()=>null,querySelectorAll:()=>audios,addEventListener:(k,v)=>docEvents[k]=v};
  class Audio {
    constructor(src){this.src=src;this.volume=1;this.paused=true;this.currentTime=0;this.duration=120;this.events={};audios.push(this);}
    addEventListener(k,v){this.events[k]=v;}
    play(){this.events.loadedmetadata?.();if(defer)return new Promise(resolve=>{this.resolvePlay=()=>{this.paused=false;resolve();};});this.paused=false;return Promise.resolve();}
    pause(){this.paused=true;}
    remove(){audios=audios.filter(a=>a!==this);}
  }
  const location={hash:'#home'};
  const context={document,Audio,location,draggableMusic:()=>()=>{},window:{addEventListener:(k,v)=>winEvents[k]=v},sessionStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>clock},requestAnimationFrame:fn=>frames.push(fn),WeakMap};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('color-web/app/ambient-music.mjs','utf8').replace(/import[^\n]+/,''),context);
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  return {document,events:docEvents,get audios(){return audios;},settle,
    async advance(ms){clock+=ms;const batch=frames;frames=[];batch.forEach(fn=>fn());await settle();},
    async route(hash){location.hash=hash;docEvents['colorlab-page-route']();await settle();},
    mute(){elements[0].onclick();},defer(){defer=true;}};
}
test('route transition never mixes two audible songs and finishes promptly',async()=>{
  const p=player();await p.settle();await p.advance(3000);
  await p.route('#about');
  for(let i=0;i<12;i++){
    await p.advance(50);
    assert.ok(p.audios.filter(a=>!a.paused&&a.volume>.001).length<=1,'only one song may be audible');
  }
  assert.equal(p.audios.length,1);
  assert.equal(p.audios[0].volume,.24);
});
test('slow new track keeps previous audible and duplicate route events share one pending load',async()=>{
  const p=player();await p.settle();await p.advance(3000);p.defer();
  await p.route('#about');await p.route('#about');
  assert.equal(p.audios.length,2,'one playing track and one pending track only');
  assert.equal(p.audios[0].paused,false);assert.equal(p.audios[0].volume,.24);
  await p.route('#home');await p.advance(2000);
  assert.equal(p.audios.filter(a=>!a.paused).length,1);
  assert.equal(p.audios.find(a=>!a.paused).volume,.24);
});
test('muting during a crossfade silences all outgoing and incoming tracks promptly',async()=>{
  const p=player();await p.settle();await p.advance(3000);
  await p.route('#about');await p.advance(100);p.mute();await p.advance(300);
  assert.ok(p.audios.every(a=>a.paused||a.volume===0),'no fading tail may continue after mute');
});
test('switching back resumes each track at its own last position',async()=>{
  const p=player();await p.settle();await p.advance(3000);p.audios[0].currentTime=18;
  await p.route('#about');await p.advance(250);await p.advance(350);p.audios[0].currentTime=7;
  await p.route('#home');await p.advance(250);await p.advance(350);
  assert.equal(p.audios[0].currentTime,18,'home must resume, not restart');
  await p.route('#about');await p.advance(250);await p.advance(350);
  assert.equal(p.audios[0].currentTime,7,'about has a separate position');
});
test('rapid return during the outgoing fade restores the original song without a late pause',async()=>{
  const p=player();await p.settle();await p.advance(3000);
  const home=p.audios[0];home.currentTime=15;
  await p.route('#about');await p.advance(100);await p.route('#home');
  for(let i=0;i<12;i++){
    await p.advance(50);
    assert.ok(p.audios.filter(a=>!a.paused&&a.volume>.001).length<=1);
  }
  assert.equal(p.audios.length,1);assert.equal(p.audios[0],home);
  assert.equal(home.paused,false);assert.equal(home.volume,.24);assert.equal(home.currentTime,15);
});
test('turning music off and on preserves the last position',async()=>{
  const p=player();await p.settle();await p.advance(3000);p.audios[0].currentTime=23;
  p.mute();await p.advance(300);p.mute();await p.settle();
  assert.equal(p.audios[0].currentTime,23);
});
