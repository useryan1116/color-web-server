const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('account position writes stay ordered and failed saves survive a reload',async()=>{
  const source=fs.readFileSync('color-web/app/music-preference.mjs','utf8').replace(/import[^\n]+/,'').replace('export function','function');
  const values=new Map(),events={},requests=[];
  let role='user',fail=false,failures=0;
  const until=async(predicate)=>{const end=Date.now()+3000;while(!predicate()){assert.ok(Date.now()<end,'save did not settle');await new Promise(r=>setTimeout(r,10));}};
  const token='x.'+Buffer.from(JSON.stringify({id:'member-a'})).toString('base64')+'.x';
  const store={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  let uuid=0;
  const context={restoreSession:()=>role,sessionStorage:{getItem:()=>token},localStorage:store,atob:s=>Buffer.from(s,'base64').toString(),AbortSignal,crypto:{randomUUID:()=>String(++uuid)},document:{addEventListener:(k,v)=>events[k]=v},window:{addEventListener:(k,v)=>events[k]=v},fetch:async(url,options)=>{
    requests.push(options);await new Promise(r=>setTimeout(r,5));
    if(fail){failures++;throw Error('offline');}
    return {ok:true,json:async()=>({position:{x:.1,y:.2}})};
  }};
  vm.createContext(context);vm.runInContext(source+';this.createStore=positionStore;',context);
  let shown;const save=context.createStore(p=>shown=p);
  await until(()=>shown?.x===.1);
  assert.equal(shown.x,.1);
  save({x:.3,y:.4});save({x:.7,y:.8});
  const key='colorlab-music-position-v1:user:member-a';
  await until(()=>store.getItem(key+':pending')===null);
  assert.deepEqual(requests.filter(r=>r.method==='PUT').map(r=>JSON.parse(r.body).position.x),[.3,.7]);
  assert.equal(store.getItem(key+':pending'),null);
  fail=true;save({x:.9,y:.9});await until(()=>failures===1);
  assert.ok(store.getItem(key+':pending'));
  fail=false;context.createStore(p=>shown=p);await until(()=>store.getItem(key+':pending')===null);
  assert.equal(shown.x,.9);assert.equal(store.getItem(key+':pending'),null);
  role=null;events['colorlab-page-route']();assert.equal(shown,null);
});
