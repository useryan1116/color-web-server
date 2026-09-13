const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('color-web/app/intro-entry.mjs','utf8').replace('export function','function');
const visit=()=>{const attributes=new Map();return {document:{documentElement:{hasAttribute:k=>attributes.has(k),setAttribute:(k,v)=>attributes.set(k,v)}}};};
function entry(top,storage,hash='#about',reduced=false){
  let starts=0;
  const context={window:{top},document:{createElement(){starts++;throw new Error('render-started');}},location:{hash},matchMedia:()=>({matches:reduced}),sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
  vm.createContext(context);vm.runInContext(source,context);
  return ()=>{try{vm.runInContext('showIntro()',context);}catch(e){if(e.message!=='render-started')throw e;}return starts;};
}
test('intro is once per live site shell, but a reopened site ignores restored old session storage',()=>{
  const restored=new Map([['colorlab-about-intro-seen','1']]),top=visit();
  const first=entry(top,restored);assert.equal(first(),1,'reopening can play even if browser restores sessionStorage');
  assert.equal(first(),1,'same page does not repeat');
  assert.equal(entry(top,restored)(),0,'internal content page navigation shares the same visit');
  assert.equal(entry(visit(),restored)(),1,'a new top-level document is a new visit');
});
test('home and reduced-motion visitors do not consume the about animation',()=>{
  const top=visit(),storage=new Map();
  assert.equal(entry(top,storage,'#home')(),0);
  assert.equal(entry(top,storage,'#about',true)(),0);
  assert.equal(entry(top,storage)(),1);
});
