const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function page(){
  const source=fs.readFileSync('color-web/app/app.js','utf8');
  const start=source.indexOf('let edgeBackTouch;');
  const end=source.indexOf("window.addEventListener('hashchange', renderRoute);",start);
  assert.ok(start>=0&&end>start,'result edge-swipe guard must be installed before route listeners');
  const handlers=new Map(),document={addEventListener(type,fn){handlers.set(type,fn);}};
  let renders=0,hash='#result/example';
  const window={addEventListener(type,fn){handlers.set(type,fn);},dispatchEvent(event){handlers.get(event.type)?.(event);}};
  const history={state:null,replaceState(_state,_title,url){hash=new URL(url,'https://example.test').hash;}};
  vm.runInNewContext(source.slice(start,end),{document,window,history,location:{get hash(){return hash;},pathname:'/app/',search:''},Event});
  handlers.set('hashchange',()=>{renders++;});
  const fire=(type,x,y)=>{let prevented=false;handlers.get(type)?.({touches:type==='touchend'?[]:[{clientX:x,clientY:y}],changedTouches:[{clientX:x,clientY:y}],preventDefault(){prevented=true;}});return prevented;};
  return {fire,get hash(){return hash;},get renders(){return renders;}};
}

test('a result edge-swipe claims the left edge before Safari can traverse the stale result entry',()=>{
  const p=page();assert.equal(p.fire('touchstart',8,260),true);assert.equal(p.fire('touchmove',88,263),true);assert.equal(p.fire('touchend',96,264),true);
  assert.equal(p.hash,'#history');assert.equal(p.renders,1);
});
test('vertical and non-edge gestures keep native scrolling untouched',()=>{
  const p=page();p.fire('touchstart',8,260);assert.equal(p.fire('touchmove',12,340),false);assert.equal(p.fire('touchend',90,342),false);assert.equal(p.hash,'#result/example');
  p.fire('touchstart',42,260);assert.equal(p.fire('touchend',120,260),false);assert.equal(p.hash,'#result/example');
});
