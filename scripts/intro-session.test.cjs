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
function entry(top,{hash='#about',reduced=false,fail=false,defer=false}={}){
  const dialogs=[],videos=[];let resolvePlay;
  const element=()=>({...hub(),style:{},setAttribute(){},append(){},replaceChildren(){},remove(){}});
  const document={...hub(),documentElement:top.document.documentElement,body:{append(){}},activeElement:null,
    querySelector:()=>dialogs.find(d=>d.open)||null,
    createElement(tag){const node=element();
      if(tag==='dialog'){const skip=element(),stage=element();Object.assign(node,{skip,querySelector:s=>s==='button'?skip:stage,showModal(){this.open=true;},close(){this.open=false;}});dialogs.push(node);}
      if(tag==='video'){Object.assign(node,{pause(){},play(){return defer?new Promise(r=>resolvePlay=r):fail?Promise.reject(new Error('unavailable')):Promise.resolve();}});videos.push(node);}
      return node;
    }};
  const window={...hub(),top};
  const context={URL,Event,CustomEvent,HTMLElement:class {},window,document,location:{hash,href:'https://example.test/app/account.html'+hash,pathname:'/app/account.html',origin:'https://example.test'},matchMedia:()=>({matches:reduced}),innerHeight:844,innerWidth:390,setTimeout:()=>1,clearTimeout(){}};
  vm.createContext(context);vm.runInContext(source,context);
  const settle=()=>new Promise(r=>setImmediate(r));
  return {document,window,dialogs,videos,async run(){vm.runInContext('showIntro()',context);await settle();return videos.length;},
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
