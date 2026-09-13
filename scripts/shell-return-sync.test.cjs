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

test('native back updates a same-document child before the later hashchange',()=>{
  const source=fs.readFileSync('color-web/app/site-shell.mjs','utf8');
  const start=source.lastIndexOf('  const syncFrameRoute = () => {');
  const end=source.indexOf("  window.addEventListener('hashchange', syncFrameRoute);",start)+58;
  const block=source.slice(start,end);
  const window=events();
  let replaced=0,routeUpdates=0,childHash='#result/old';
  const child={Event,addEventListener(type,fn){if(type==='hashchange')this.onHashchange=fn;},dispatchEvent(event){if(event.type==='hashchange'){routeUpdates++;this.onHashchange?.(event);}},history:{state:null,replaceState(_state,_title,href){childHash=new URL(href).hash;}},location:null};
  const childLocation={origin:'https://example.test',pathname:'/app/',search:'',get href(){return `https://example.test/app/${childHash}`;},replace(){replaced++;}};
  child.location=childLocation;
  vm.runInNewContext(block,{URL,window,location:{href:'https://example.test/app/#history'},frame:{contentWindow:child}});
  window.dispatch('popstate');
  assert.equal(replaced,0,'native back must not reload the stale result iframe');
  assert.equal(childHash,'#history');
  assert.equal(routeUpdates,1,'native back must render history before the later hashchange');
});
