const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(mobile=false){
  const events={},reduced={matches:false,addEventListener(){},removeEventListener(){}};
  const animations=[],doc={hidden:false,querySelector:()=>null,addEventListener:(n,fn)=>events[n]=fn,removeEventListener(){}};
  const view={matchMedia:q=>q.includes('reduced')?reduced:{matches:mobile},getComputedStyle:()=>({transform:'none',opacity:'1'}),addEventListener:(n,fn)=>events[n]=fn,removeEventListener(){}};
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

test('leaving a saved result or returning to it never fades, shifts or scales the page',()=>{
  for(const mobile of [false,true])for(const destination of ['#history','#home','#me']){
    const p=setup(mobile);p.motion.commit('#result/review-new');
    for(const route of [destination,'#result/review-new']){
      const animation=p.motion.commit(route);
      assert.equal(animation,null,`${route}: keep the destination fully opaque and stationary`);
    }
  }
});

test('immediate result navigation cancels the previous tab animation without another flash',()=>{
  const p=setup(true);p.motion.commit('#home');
  const previous=p.motion.commit('#history');
  assert.equal(p.motion.commit('#result/review-new'),null);
  assert.equal(previous.cancelled,true);
  assert.equal(p.motion.commit('#history'),null);
  assert.equal(p.animations.length,1,'no result-entry or exit animation can lower opacity');
  assert.ok(p.motion.commit('#me'),'subsequent ordinary tabs retain their slide');
});

test('history cards render at real height before restoring the saved scroll position',()=>{
  const css=fs.readFileSync('color-web/app/experience.css','utf8');
  assert.doesNotMatch(css,/\.history-entry\s*\{[^}]*content-visibility:auto/,'fresh history cards must not start as blank estimated-height boxes');
});

test('ordinary mobile tabs still slide and information pages retain their entrance',()=>{
  const p=setup(true);p.motion.commit('#home');
  assert.equal(p.motion.commit('#history').frames[0].transform,'translateX(32px)');
  assert.equal(p.motion.commit('#privacy').frames[0].transform,'translateY(32px)');
});
test('article animation is scoped and latest-news disclaimer is removed',()=>{
  const app=fs.readFileSync('color-web/app/app.js','utf8'),css=fs.readFileSync('color-web/app/motion.css','utf8');
  assert.ok(app.includes("dialog.classList.add('article-dialog')"));
  assert.ok(app.includes("dialog.classList.remove('color-detail-dialog','article-dialog')"));
  assert.ok(!app.includes('活動日期與參加方式，請以主辦單位公告為準。'));
  assert.match(css,/@media\(prefers-reduced-motion:no-preference\)\{\s*dialog\.article-dialog\[open\]/);
  assert.match(css,/cl-article-slide 600ms/);
  assert.doesNotMatch(css,/dialog\.article-dialog\[open\]\s+#dialog-content>h2\s*\{animation:/,'article heading must stay attached to the dialog');
  assert.doesNotMatch(css.match(/@keyframes cl-article-slide\{[^\n]+/)[0],/scale\(/,'article text must not resize during entry');
});

test('companion dialogue uses readable character colors without visible speaker labels',()=>{
  const js=fs.readFileSync('color-web/app/about.mjs','utf8'),css=fs.readFileSync('color-web/app/about.css','utf8');
  assert.ok(js.includes("bubble.textContent=button.querySelector('.about-saying').textContent"));
  assert.ok(!js.includes("createElement('strong')"));
  const luminance=hex=>hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for(const color of ['red','yellow','green','blue']){
    const match=css.match(new RegExp(`data-companion="${color}"\\] \\.about-bubble\\{color:#([0-9a-f]{6})`));
    assert.ok(match,color);
    assert.ok((luminance('fffefd')+.05)/(luminance(match[1])+.05)>=4.5,`${color} text contrast`);
  }
});
