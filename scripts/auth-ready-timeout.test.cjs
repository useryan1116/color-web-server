const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setTimeout:wait}=require('node:timers/promises');
async function auth(context){const mod=new vm.SourceTextModule(fs.readFileSync('color-web/app/auth.mjs','utf8'),{context});await mod.link(()=>{throw Error('No imports expected');});await mod.evaluate();return mod.namespace;}
test('a stalled connection releases a management action with a retryable error',async()=>{
 let fetches=0;
 const store=new Map(),context=vm.createContext({window:{ColorLabConnection:{ready:new Promise(()=>{})},dispatchEvent(){},addEventListener(){}},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},Event:class{},AbortSignal,fetch:async()=>{fetches++;return new Response('{}');},setTimeout:fn=>{queueMicrotask(fn);return 1},clearTimeout(){}});
 const {api}=await auth(context);
 const result=await Promise.race([api('/api/admin/content-review/decide',{method:'POST'}).then(()=>null,error=>error),wait(150).then(()=>new Error('test timed out'))]);
 assert.match(result.message,/服務.*準備|重新嘗試/);assert.equal(fetches,0);
});
