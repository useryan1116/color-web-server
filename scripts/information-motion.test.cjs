const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(){
  const events={},reduced={matches:false,addEventListener(){},removeEventListener(){}};
  const animations=[],doc={hidden:false,querySelector:()=>null,addEventListener:(n,fn)=>events[n]=fn,removeEventListener(){}};
  const view={matchMedia:q=>q.includes('reduced')?reduced:{matches:false},getComputedStyle:()=>({transform:'none',opacity:'1'}),addEventListener:(n,fn)=>events[n]=fn,removeEventListener(){}};
  doc.defaultView=view;
  const main={ownerDocument:doc,isConnected:true,querySelector:()=>null,animate:(frames,timing)=>{const a={frames,timing,cancelled:false,cancel(){this.cancelled=true;}};animations.push(a);return a;}};
  const context={};vm.runInNewContext(fs.readFileSync('color-web/app/navigation-motion.mjs','utf8').replace('export function','function'),context);
  return {motion:context.createNavigationMotion(main),doc,reduced,animations,events};
}
test('information pages slide on first entry and retained return without delaying content',()=>{
  for(const route of ['about','privacy','contact']){
    const p=setup(),first=p.motion.commit(route);
    assert.equal(first.timing.duration,600);assert.equal(first.frames[0].transform,'translateY(32px)');
    assert.equal(p.motion.commit(route),null);assert.equal(first.cancelled,true);
    p.motion.commit('install');assert.ok(p.motion.commit(route,{restored:true}));
  }
});
test('information slide respects reduced motion, hidden pages and active intro',()=>{
  const p=setup();p.reduced.matches=true;assert.equal(p.motion.commit('privacy'),null);
  p.reduced.matches=false;p.doc.hidden=true;assert.equal(p.motion.commit('contact'),null);
  p.doc.hidden=false;p.doc.querySelector=()=>({open:true});assert.equal(p.motion.commit('about'),null);
  p.doc.querySelector=()=>null;const a=p.motion.commit('privacy');p.events.pagehide();assert.equal(a.cancelled,true);
});
test('ordinary first paint and retained non-information pages remain unchanged',()=>{
  const p=setup();assert.equal(p.motion.commit('#home'),null);
  assert.equal(p.motion.commit('statistics',{restored:true}),null);
  assert.equal(p.motion.commit('records').timing.duration,320);
});
test('article animation is scoped and latest-news disclaimer is removed',()=>{
  const app=fs.readFileSync('color-web/app/app.js','utf8'),css=fs.readFileSync('color-web/app/motion.css','utf8');
  assert.ok(app.includes("dialog.classList.add('article-dialog')"));
  assert.ok(app.includes("dialog.classList.remove('color-detail-dialog','article-dialog')"));
  assert.ok(!app.includes('活動日期與參加方式，請以主辦單位公告為準。'));
  assert.match(css,/@media\(prefers-reduced-motion:no-preference\)\{\s*dialog\.article-dialog\[open\]/);
  assert.match(css,/cl-article-slide 600ms/);
});
