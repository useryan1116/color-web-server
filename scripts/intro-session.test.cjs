const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('color-web/app/intro-entry.mjs','utf8').replace('export function','function');
function hub(){const events=new Map();return {
  addEventListener(k,fn){if(!events.has(k))events.set(k,new Set());events.get(k).add(fn);},
  removeEventListener(k,fn){events.get(k)?.delete(fn);},
  dispatchEvent(e){for(const fn of [...(events.get(e.type)||[])])fn(e);}
};}
function visit(){const attributes=new Map();return {document:{documentElement:{hasAttribute:k=>attributes.has(k),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)}}};}
function entry(top,{hash='#about',reduced=false,fail=false,defer=false,standalone=false,failFirstCodec=false,failUntil='',withAnimation=false}={}){
  const dialogs=[],videos=[],animations=[],timers=new Map();let resolvePlay,diagnostics,timerId=0;
  const element=()=>({...hub(),style:{},dataset:{},setAttribute(){},append(){},prepend(){},replaceChildren(){},remove(){},...(withAnimation?{animate(frames,options){let resolve,reject;const finished=new Promise((r,j)=>{resolve=r;reject=j;});animations.push({frames,options,resolve,reject});return {finished};}}:{})});
  const article=element();
  const document={...hub(),documentElement:top.document.documentElement,body:{append(){}},activeElement:null,
    querySelector:s=>s==='[data-intro-check]'?diagnostics||null:s==='.about-colorlab'?article:s==='.about-final-poster'?{getBoundingClientRect:()=>({left:20,top:120,width:350,height:525})}:dialogs.find(d=>d.open)||null,
    createElement(tag){const node=element();
      if(tag==='dialog'){const skip=element(),stage=element();Object.assign(node,{skip,querySelector:s=>s==='button'?skip:stage,showModal(){this.open=true;},close(){this.open=false;}});dialogs.push(node);}
      if(tag==='details'){const output=element();Object.assign(node,{output,querySelector:()=>output});diagnostics=node;}
      if(tag==='video'){Object.assign(node,{readyState:0,currentTime:0,removeAttribute(){},load(){},pause(){this.paused=true;},play(){const rejected=fail||((failUntil&&!this.src.includes(failUntil))||(failFirstCodec&&!this.src.includes('hevc'))?'NotSupportedError':false);return defer?new Promise(r=>resolvePlay=r):rejected?Promise.reject(Object.assign(new Error('secret-message-not-for-output'),{name:typeof rejected==='string'?rejected:'Error'})):Promise.resolve();}});videos.push(node);}
      return node;
    }};
  const window={...hub(),top};
  const context={URL,Event,CustomEvent,HTMLElement:class {},window,document,navigator:{standalone},location:{hash,href:'https://example.test/app/account.html'+hash,pathname:'/app/account.html',origin:'https://example.test'},matchMedia:q=>({matches:q.includes('reduced-motion')?reduced:standalone}),innerHeight:844,innerWidth:390,setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};
  vm.createContext(context);vm.runInContext(source,context);
  const settle=()=>new Promise(r=>setImmediate(r));
  return {document,window,dialogs,videos,animations,async run(){vm.runInContext('showIntro()',context);await settle();return videos.length;},
    async timeout(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}await settle();},get timerCount(){return timers.size;},
    async finishTransitions(reject=false){for(const a of animations)reject?a.reject():a.resolve();await settle();},
    get diagnosticText(){return diagnostics?.output.textContent||'';},
    skip(){dialogs.at(-1)?.skip.onclick();},
    route(hash){context.location.hash=hash;window.dispatchEvent(new Event('hashchange'));},
    async click(){document.dispatchEvent({type:'click',button:0,target:{closest:()=>({href:'https://example.test/app/account.html#about',hasAttribute:()=>false})},preventDefault(){}});await settle();return videos.length;},
    async ready(){resolvePlay();await settle();}
  };
}
test('About plays once per top-level opening, not per click or iframe navigation',async()=>{
  const top=visit(),first=entry(top);
  assert.equal(await first.run(),1);first.skip();
  assert.equal(await first.click(),1,'same-page About click must not replay');
  first.route('#privacy');first.route('#about');assert.equal(await first.run(),1);
  assert.equal(await entry(top).run(),0,'a replacement iframe keeps the same opening');
  assert.equal(await entry(visit()).run(),1,'a fresh top-level document can play again');
});
test('failed or abandoned playback does not consume the opening',async()=>{
  const top=visit(),failed=entry(top,{fail:true});
  assert.equal(await failed.run(),1);assert.equal(failed.dialogs[0].open,false);
  assert.equal(await failed.run(),2,'failed playback remains retryable');
  const pending=entry(top,{defer:true});assert.equal(await pending.run(),1);
  assert.equal(await pending.run(),1,'pending dialog is not duplicated');
  pending.route('#privacy');await pending.ready();
  assert.equal(await entry(top).run(),1,'a late promise resolution cannot mark a closed intro as seen');
});
test('explicit skip before playback still counts for this opening',async()=>{
  const top=visit(),page=entry(top,{defer:true});await page.run();page.skip();
  assert.equal(await entry(top).run(),0);
});
test('restored top-level opening resets once and asks current About to play',async()=>{
  const top=visit(),page=entry(top);await page.run();page.skip();
  const shell=fs.readFileSync('color-web/app/site-shell.mjs','utf8');
  const start=shell.indexOf("  window.addEventListener('pageshow', event =>");
  assert.ok(start>=0,'shell must handle restored documents');
  const block=shell.slice(start,shell.indexOf('\n  });',start)+6);
  const window=hub();vm.runInNewContext(block,{window,document:top.document,frame:{contentDocument:page.document},Event});
  window.dispatchEvent({type:'pageshow',persisted:false});assert.equal(await page.run(),1);
  window.dispatchEvent({type:'pageshow',persisted:true});assert.equal(await page.run(),2);
  page.skip();assert.equal(await page.run(),2);
});
test('restoring cached About DOM invokes its entry hook',()=>{
  const account=fs.readFileSync('color-web/app/account.mjs','utf8');
  const block=account.slice(account.indexOf('  if (retained &&'),account.indexOf('  // Leave the previous'));
  let starts=0;
  const context={retained:{at:Date.now(),nodes:[],title:'About',top:0},main:{replaceChildren(){},removeAttribute(){}},document:{querySelector:()=>null},window:{scrollTo(){}},navigationMotion:{commit(){}},current:'about',routeKey:'about',bindAbout(){starts++;}};
  vm.runInNewContext(`(()=>{${block}})()`,context);assert.equal(starts,1);
});
test('home and reduced motion do not consume the opening',async()=>{
  const top=visit();assert.equal(await entry(top,{hash:'#home'}).run(),0);
  assert.equal(await entry(top,{reduced:true}).run(),0);assert.equal(await entry(top).run(),1);
});
test('production About never displays temporary diagnostic panels',async()=>{
  const top=visit(),reduced=entry(top,{reduced:true,standalone:true});await reduced.run();
  assert.equal(reduced.diagnosticText,'');
  const page=entry(top);await page.run();assert.equal(page.diagnosticText,'');page.skip();
  await page.run();assert.equal(page.diagnosticText,'');
  assert.doesNotMatch(source,/intro-check|reportIntro|動畫檢查資訊/);
});
test('playback failures exit without exposing debug information',async()=>{
  for(const fail of ['NotAllowedError','NotSupportedError','AbortError']){
    const page=entry(visit(),{fail});await page.run();assert.equal(page.dialogs[0].open,false);
    assert.equal(page.diagnosticText,'');
  }
});
test('unsupported AVC retries HEVC at the same 4K120 without closing the intro',async()=>{
  const page=entry(visit(),{failFirstCodec:true});await page.run();
  assert.equal(page.videos.length,2);assert.match(page.videos[1].src,/4k120-hevc-v7/);
  assert.equal(page.dialogs[0].open,true);assert.equal(page.videos[0].paused,true);
  page.videos[0].dispatchEvent(new Event('ended'));
  assert.equal(page.dialogs[0].open,true,'stale AVC events cannot close HEVC');
  page.skip();assert.equal(await page.run(),2);
});
test('unsupported codecs stop after six attempts and leave a future visit retryable',async()=>{
  const top=visit(),page=entry(top,{fail:'NotSupportedError'});await page.run();
  assert.equal(page.videos.length,6);assert.equal(page.dialogs[0].open,false);
  assert.equal(await entry(top).run(),1);
});

test('4K failure falls through 2K to 1080p while preserving 120fps and ignoring stale events',async()=>{
  const page=entry(visit(),{failUntil:'1080p120'});await page.run();
  assert.equal(page.videos.length,5);assert.equal(page.dialogs[0].open,true);
  assert.match(page.videos[2].src,/2k120/);assert.match(page.videos[4].src,/1080p120/);
  assert.ok(page.videos.every(v=>v.src.includes('120')));
  for(const video of page.videos.slice(0,-1)){assert.equal(video.paused,true);video.dispatchEvent(new Event('error'));video.dispatchEvent(new Event('ended'));}
  assert.equal(page.videos.length,5);assert.equal(page.dialogs[0].open,true);
  page.skip();assert.equal(page.dialogs[0].open,false);
});

test('stalled sources advance; progress renews one timer and skip cancels pending retries',async()=>{
  const page=entry(visit(),{defer:true});await page.run();
  await page.timeout();assert.equal(page.videos.length,2);
  await page.timeout();assert.match(page.videos[2].src,/2k120/);
  page.videos[2].currentTime=1;page.videos[2].dispatchEvent(new Event('timeupdate'));
  assert.equal(page.timerCount,1);page.skip();assert.equal(page.timerCount,0);
  await page.timeout();assert.equal(page.videos.length,3);
  const all=entry(visit(),{defer:true});await all.run();
  for(let i=0;i<6;i++)await all.timeout();
  assert.equal(all.videos.length,6);assert.equal(all.dialogs[0].open,false);assert.equal(all.timerCount,0);
});

test('padded portrait fallback aligns scene content, not outer video padding, to poster',async()=>{
  const page=entry(visit(),{failUntil:'1080p120',withAnimation:true});await page.run();
  Object.assign(page.videos[4],{videoWidth:1080,videoHeight:1920});page.videos[4].dispatchEvent(new Event('ended'));
  const motion=page.animations.find(a=>a.frames.some(f=>f.transform));
  assert.ok(motion.frames[1].transform.includes('scale('));
  assert.notEqual(motion.frames[1].transform,'translate(20px,44.666666666666686px) scale(0.8974358974358975)');
  await page.finishTransitions();assert.equal(page.dialogs[0].open,false);
});
test('completed video remains visible through a gentle handoff before closing',async()=>{
  const page=entry(visit(),{withAnimation:true});let closes=0;
  page.document.addEventListener('colorlab-intro-close',()=>closes++);
  await page.run();Object.assign(page.videos[0],{videoWidth:2560,videoHeight:3840});page.videos[0].dispatchEvent(new Event('ended'));
  assert.equal(page.dialogs[0].open,true);assert.equal(closes,0);
  assert.ok(page.animations.some(a=>a.options.duration>=400&&a.options.duration<=600));
  assert.ok(page.animations.some(a=>a.frames.some(f=>f.transform)));
  await page.finishTransitions();assert.equal(page.dialogs[0].open,false);assert.equal(closes,1);
});
test('skip and format failure do not wait for transitions; cancelled exit still closes',async()=>{
  const skipped=entry(visit(),{withAnimation:true});await skipped.run();skipped.skip();
  assert.equal(skipped.animations.length,0);assert.equal(skipped.dialogs[0].open,false);
  const failed=entry(visit(),{withAnimation:true,fail:'NotSupportedError'});await failed.run();
  assert.equal(failed.animations.length,0);assert.equal(failed.dialogs[0].open,false);
  const completed=entry(visit(),{withAnimation:true});await completed.run();completed.videos[0].dispatchEvent(new Event('ended'));
  await completed.finishTransitions(true);assert.equal(completed.dialogs[0].open,false);
});
test('navigation during the final-frame handoff closes immediately and only once',async()=>{
  const page=entry(visit(),{withAnimation:true});let closes=0;
  page.document.addEventListener('colorlab-intro-close',()=>closes++);
  await page.run();page.videos[0].dispatchEvent(new Event('ended'));page.route('#privacy');
  assert.equal(page.dialogs[0].open,false);assert.equal(closes,1);
  await page.finishTransitions();assert.equal(closes,1);
});
test('About scene uses final-frame posters with four accessible greeting controls',()=>{
  const about=fs.readFileSync('color-web/app/about.mjs','utf8').replace(/^import .*;\r?\n/,'').replaceAll('export function','function');
  const context={};vm.createContext(context);vm.runInContext(about,context);
  const html=vm.runInContext('aboutView()',context);
  assert.equal((html.match(/data-companion=/g)||[]).length,4);
  for(const name of ['mobile','desktop'])assert.ok(html.includes(`/assets/intro/about-${name}-final-v6.webp`));
  assert.ok(html.indexOf('about-toolbar')<html.indexOf('about-final-scene'));
  assert.ok(html.includes('每一種顏色，都值得被理解。留一點時間，遇見自己'));
});
