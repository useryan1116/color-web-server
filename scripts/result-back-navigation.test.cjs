const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the real app renderer and its event registration, not a second router.
function setup(){
  const source=fs.readFileSync('color-web/app/app.js','utf8');
  const renderer=source.slice(source.indexOf('function render('),source.indexOf('\nfunction bindPage()'));
  const registration=source.slice(source.indexOf('\n}\n',source.indexOf('\nfunction bindPage()'))+3,source.indexOf('\ntry {\n  await window.ColorLabConnection'));
  const events=new Map(),paints=[],scrolls=[];
  const main={dataset:{},focus(){},querySelector(){return null;},set innerHTML(value){paints.push(value);}};
  const context={main,nav:{},dialog:{open:false},document:{body:{dataset:{page:'result'}}},
    location:{hash:'#result/example'},state:{records:[{id:'example'}]},catalog:[],activeSurvey:null,
    FEATURED_SURVEY:null,paintedRoute:'#result/example',routeScroll:new Map([['#history',420]]),
    publicViews:new Map(),tabScrubber:{sync(){}},navigationMotion:{commit(){}},
    icon(){return '';},historyPage(){return 'history';},result(){return 'result';},home(){return 'home';},
    bindPage(){},offerTour(){},completeHistory(){},historyError:'',
    window:{scrollY:1300,scrollTo(options){this.scrollY=options.top;scrolls.push(options.top);},
      addEventListener(name,fn){events.set(name,[...(events.get(name)||[]),fn]);}}};
  vm.createContext(context);
  vm.runInContext(renderer+'\n'+registration,context);
  return {context,paints,scrolls,dispatch(name){for(const fn of events.get(name)||[])fn({type:name,hasUAVisualTransition:true});}};
}

test('swipe-back commits history synchronously before the delayed hashchange can expose the old result',()=>{
  const p=setup();p.context.location.hash='#history';p.dispatch('popstate');
  assert.equal(p.paints.at(-1),'history','the old result must be replaced before the browser removes its back-gesture snapshot');
  assert.equal(p.context.paintedRoute,'#history');assert.equal(p.context.window.scrollY,420);
  p.dispatch('hashchange');assert.deepEqual(p.paints,['history'],'one traversal must not replace the destination twice');
});

test('forward traversal also commits once and restores the result scroll',()=>{
  const p=setup();p.context.location.hash='#history';p.dispatch('popstate');p.dispatch('hashchange');
  p.context.location.hash='#result/example';p.dispatch('popstate');
  assert.equal(p.paints.at(-1),'result');assert.equal(p.context.window.scrollY,1300);
  p.dispatch('hashchange');assert.deepEqual(p.paints,['history','result']);
});

test('hash-only navigation still renders and a later duplicate traversal notification does not repaint',()=>{
  const p=setup();p.context.location.hash='#history';p.dispatch('hashchange');
  assert.deepEqual(p.paints,['history']);p.dispatch('popstate');
  assert.deepEqual(p.paints,['history']);
});

test('non-result navigation keeps its existing hashchange timing',()=>{
  const p=setup();p.context.paintedRoute='#home';p.context.location.hash='#history';
  p.dispatch('popstate');assert.deepEqual(p.paints,[]);
  p.dispatch('hashchange');assert.deepEqual(p.paints,['history']);
});
