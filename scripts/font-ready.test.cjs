const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('color-web/app/font-ready.mjs','utf8');
function load(){
  const root={dataset:{}};let resolve,reject,timeout;
  vm.runInNewContext(source,{document:{documentElement:root,fonts:{load:()=>new Promise((r,j)=>{resolve=r;reject=j;})}},setTimeout:fn=>(timeout=fn,1),clearTimeout(){}});
  return {root,resolve,reject,timeout,settle:()=>new Promise(r=>setImmediate(r))};
}
test('late successful font restores handwriting after readable timeout fallback',async()=>{
  const page=load();page.timeout();assert.equal(page.root.dataset.handwriting,'fallback');
  page.resolve([{}]);await page.settle();assert.equal(page.root.dataset.handwriting,'ready');
});
test('failed font remains readable without blocking page content',async()=>{
  const page=load();page.reject(new Error('unavailable'));await page.settle();
  assert.equal(page.root.dataset.handwriting,'fallback');
});
