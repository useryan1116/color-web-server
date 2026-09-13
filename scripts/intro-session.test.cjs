const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('color-web/app/intro-entry.mjs','utf8').replace('export function','function');
const visit=()=>{const attributes=new Map();return {document:{documentElement:{hasAttribute:k=>attributes.has(k),setAttribute:(k,v)=>attributes.set(k,v)}}};};
function entry(top,storage,hash='#about',reduced=false){
  let starts=0;
  const events={};
  const context={window:{top,addEventListener:(name,fn)=>events[name]=fn},document:{createElement(){starts++;throw new Error('render-started');}},location:{hash},matchMedia:()=>({matches:reduced}),sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
  vm.createContext(context);vm.runInContext(source,context);
  const run=()=>{try{vm.runInContext('showIntro()',context);}catch(e){if(e.message!=='render-started')throw e;}return starts;};
  run.route=hash=>{context.location.hash=hash;events.hashchange?.();};
  return run;
}
test('intro plays once per about entry, including returns and reopened documents',()=>{
  const restored=new Map([['colorlab-about-intro-seen','1']]),top=visit();
  const first=entry(top,restored);assert.equal(first(),1,'reopening can play even if browser restores sessionStorage');
  assert.equal(first(),1,'same page does not repeat');
  first.route('#privacy');first.route('#about');assert.equal(first(),2,'returning to About replays');
  assert.equal(first(),2,'duplicate render on About does not restart');
  assert.equal(entry(top,restored)(),1,'a new account document may play in the same shell');
  assert.equal(entry(visit(),restored)(),1,'a new top-level document is a new visit');
});
test('restoring cached About DOM invokes its entry hook',()=>{
  const account=fs.readFileSync('color-web/app/account.mjs','utf8');
  const block=account.slice(account.indexOf('  if (retained &&'),account.indexOf('  // Leave the previous'));
  let starts=0;
  const context={retained:{at:Date.now(),nodes:[],title:'About',top:0},main:{replaceChildren(){},removeAttribute(){}},document:{querySelector:()=>null},window:{scrollTo(){}},navigationMotion:{commit(){}},current:'about',routeKey:'about',bindAbout(){starts++;}};
  vm.runInNewContext(`(()=>{${block}})()`,context);
  assert.equal(starts,1,'cached navigation must not bypass intro binding');
});
test('home and reduced-motion visitors do not consume the about animation',()=>{
  const top=visit(),storage=new Map();
  assert.equal(entry(top,storage,'#home')(),0);
  assert.equal(entry(top,storage,'#about',true)(),0);
  assert.equal(entry(top,storage)(),1);
});
