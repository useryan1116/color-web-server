const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('color-web/app/exploration-interactions.mjs','utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');
test('other occupies its own final row without changing mood choices',()=>{
  assert.match(fs.readFileSync('color-web/app/experience.css','utf8'),/\.reflection-options \[data-choice="other"\]\s*\{\s*flex-basis:100%;\s*\}/);
  assert.match(fs.readFileSync('color-web/app/experience.css','utf8'),/\.reflection-saving\s*\{[^}]*position:absolute;[^}]*clip-path:inset\(50%\)/);
});
function setup(){
  const make=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,v){this[k]=v;},toggleAttribute(){},hasAttribute(k){return k==='data-choice';},remove(){this.removed=true;}});
  const choices=['red','none','other'].map(choice=>Object.assign(make(),{dataset:{choice}}));
  choices.forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.choice==='red')));
  const form=Object.assign(make(),{hidden:true,elements:{text:make()}}),children=[];
  const panel=Object.assign(make(),{dataset:{recordId:'test'},append(el){children.push(el);},querySelector(s){if(s==='.reflection-other')return form;if(s==='[data-choice="other"]')return choices[2];return children.find(el=>el.className==='reflection-error'&&!el.removed);},querySelectorAll(){return choices;}});
  const root={querySelector:()=>null,querySelectorAll:()=>[panel]};
  const context={document:{createElement:make}};vm.createContext(context);vm.runInContext(source,context);
  let resolve,reject,calls=0;const saved=new Promise((yes,no)=>{resolve=yes;reject=no;});
  context.bindExplorationInteractions(root,{saveReflection:()=>{calls++;return saved;}});
  return {choices,panel,children,resolve,reject,get calls(){return calls;}};
}
test('single-color results offer four distinct descriptions plus none and other with stable saved keys',()=>{
  const context={resultSummary:()=>({matched:[{key:'red'}]}),esc:String};vm.createContext(context);vm.runInContext(source,context);
  const html=context.reflectionView('resonance',{id:'record',reflection:{choice:'blue'}});
  assert.deepEqual([...html.matchAll(/data-choice="([^"]+)"/g)].map(m=>m[1]),['red','yellow','green','blue','none','other']);
  assert.match(html,/aria-pressed="true" data-choice="blue"/);
  const descriptions=[...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].slice(0,4).map(m=>m[1]);
  assert.equal(new Set(descriptions).size,4);
});
test('selection responds before the request resolves and remains after confirmed save',async()=>{
  const s=setup(),finished=s.choices[1].click({detail:1});
  assert.equal(s.choices[1].getAttribute('aria-pressed'),'true');
  assert.equal(s.panel.getAttribute('aria-busy'),'true');
  assert.equal(s.children[0].textContent,'正在儲存…');
  await s.choices[0].click({detail:1});assert.equal(s.calls,1);
  s.resolve();await finished;
  assert.equal(s.choices[1].getAttribute('aria-pressed'),'true');
  assert.equal(s.panel.getAttribute('aria-busy'),null);assert.ok(s.children[0].removed);
});
test('failed save keeps the new selection marked unsaved and enables retry',async()=>{
  const s=setup(),finished=s.choices[1].click({detail:1});s.reject(new Error('未儲存'));await finished;
  assert.equal(s.choices[0].getAttribute('aria-pressed'),'false');
  assert.equal(s.choices[1].getAttribute('aria-pressed'),'true');
  assert.match(s.children[1].textContent,/尚未儲存/);assert.equal(s.choices[1].disabled,false);
});
