const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('color-web/app/font-ready.mjs','utf8');
function load(){
  const root={dataset:{}},events={};let resolve,reject,timeout,requests=0;
  const eventTarget={addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(source,{window:eventTarget,document:{...eventTarget,hidden:false,documentElement:root,fonts:{...eventTarget,load:()=>{requests++;return new Promise((r,j)=>{resolve=r;reject=j;});}}},setTimeout:fn=>(timeout=fn,1),clearTimeout(){}});
  return {root,resolve:v=>resolve(v),reject:e=>reject(e),timeout:()=>timeout(),emit:(name,event={})=>events[name]?.(event),get requests(){return requests;},settle:()=>new Promise(r=>setImmediate(r))};
}
test('late successful font restores handwriting after readable timeout fallback',async()=>{
  const page=load();page.timeout();assert.equal(page.root.dataset.handwriting,'fallback');
  page.resolve([{}]);await page.settle();assert.equal(page.root.dataset.handwriting,'ready');
});
test('returning after a failed font load retries and restores handwriting without a reload',async()=>{
  const page=load();page.reject(new Error('offline'));await page.settle();
  page.emit('pageshow');assert.equal(page.requests,2);
  page.resolve([{}]);await page.settle();assert.equal(page.root.dataset.handwriting,'ready');
  page.emit('visibilitychange');assert.equal(page.requests,2,'ready font does not restart');
});
test('a later successful font event removes the forced fallback',async()=>{
  const page=load();page.reject(new Error('offline'));await page.settle();
  page.emit('loadingdone',{fontfaces:[{family:'ColorLabHandwriting',status:'loaded'}]});
  assert.equal(page.root.dataset.handwriting,'ready');
});
test('failed font remains readable without blocking page content',async()=>{
  const page=load();page.reject(new Error('unavailable'));await page.settle();
  assert.equal(page.root.dataset.handwriting,'fallback');
});
