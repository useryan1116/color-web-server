const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function events(){const handlers=new Map();return {addEventListener(type,fn){handlers.set(type,fn);},dispatch(type,event={}){handlers.get(type)?.({type,...event});}};}

function embeddedShell(){
  const source=fs.readFileSync('color-web/app/site-shell.mjs','utf8');
  const start=source.indexOf('if (embedded) {');
  const end=source.indexOf("  await import(",start);
  const branch=source.slice(start,end)+'}';
  const window={...events(),frameElement:{matches:()=>true}};
  let replaces=0;
  const parent={history:{replaceState(){replaces++;}},document:{dispatchEvent(){},title:''}};
  const document={...events()};
  const context={embedded:true,window,document,parent,location:{href:'https://example.test/app/#result/old',origin:'https://example.test'},Event};
  vm.runInNewContext(branch,context);
  return {window,get replaces(){return replaces;}};
}

test('a restored result iframe must not overwrite the parent route before its back navigation settles',()=>{
  const page=embeddedShell();
  page.window.dispatch('pageshow',{persisted:true});
  assert.equal(page.replaces,0,'a stale bfcache result snapshot must not resync the parent route');
});

test('a normal iframe pageshow still syncs the current route',()=>{
  const page=embeddedShell();
  page.window.dispatch('pageshow',{persisted:false});
  assert.equal(page.replaces,1);
});
