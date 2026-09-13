const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../launcher-site/index.html'),'utf8');
function harness(fetch,elapsed=0){
  const el=()=>({textContent:'',hidden:true,attrs:{},style:{setProperty(){}},classList:{add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}});
  let interval; const timers=[]; const sent=[];
  const c={root:el(),wakeProgress:el(),progressText:el(),statusText:el(),serviceState:el(),readyCurtain:el(),retryConnection:el(),completed:false,progress:8,progressTimer:0,wakeTimer:0,attemptStarted:0,startedAt:0,minimumVisibleTime:1800,embedded:true,location:{origin:'https://local.test'},SERVER_ORIGIN:'https://service.test',navigator:{onLine:true},Date:{now:()=>elapsed},AbortController,fetch,warmDestination:async()=>{},window:{setInterval(fn){interval=fn;return 1},clearInterval(){interval=null},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},parent:{postMessage(x){sent.push(x)}}}};
  vm.createContext(c);
  const progress=html.slice(html.indexOf('      const setProgress ='),html.indexOf('      const warmDestination ='));
  const readiness=html.slice(html.indexOf('      const markReady ='),html.indexOf("      retryConnection.addEventListener"));
  vm.runInContext(progress+readiness+'\nthis.start=startProgress;this.wake=wakeServer;',c);
  return {c,timers,sent,tick(){interval?.()}};
}
test('estimated progress climbs without claiming completion and explains slow connections',()=>{
  const h=harness(async()=>{});h.c.start();let previous=8;
  for(let i=0;i<180;i++){h.tick();const current=Number(h.c.wakeProgress.attrs['aria-valuenow']);assert.ok(current>=previous&&current<100);previous=current;}
  assert.ok(previous>8);assert.match(h.c.statusText.textContent,/仍在等待/);
});
test('healthy response completes immediately and releases embedded page',async()=>{
  const h=harness(async()=>({ok:true,text:async()=>'OK'}));h.c.start();await h.c.wake();
  assert.equal(h.c.wakeProgress.attrs['aria-valuenow'],'100');
  assert.equal(h.sent[0].type,'colorlab:ready');
});
test('failed health response retries without declaring success',async()=>{
  const h=harness(async()=>{throw Error('offline')},10000);h.c.start();await h.c.wake();
  assert.equal(h.sent.length,0);assert.ok(h.timers.some(t=>t.ms===2600));
});
test('timeout exposes retry rather than pretending ready',async()=>{
  const h=harness(async()=>{throw Error('timeout')},121000);h.c.start();await h.c.wake();
  assert.equal(h.c.retryConnection.hidden,false);assert.equal(h.sent.length,0);
  assert.equal(h.c.wakeProgress.attrs['aria-valuenow'],undefined);
});
