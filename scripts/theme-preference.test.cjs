const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('color-web/app/theme-preference.js','utf8');
function setup(saved=null,dark=false,blocked=false){
  const events={},windowEvents={},sheet={},root={dataset:{},style:{}},meta={},inputs=['system','light','dark'].map(value=>({value}));
  const stored=new Map(saved?[['colorlab-appearance-v1',saved]]:[]);
  const system={matches:dark,addEventListener(type,fn){this.change=fn;}};
  const context={matchMedia:()=>system,localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return stored.get(k);},setItem:(k,v)=>{if(blocked)throw Error('blocked');stored.set(k,v);}},
    document:{documentElement:root,querySelector:()=>sheet,querySelectorAll:s=>s.startsWith('meta')?[meta]:inputs,addEventListener:(name,fn)=>events[name]=fn},
    window:{addEventListener:(name,fn)=>windowEvents[name]=fn}};
  vm.runInNewContext(source,context);
  const choose=value=>events.change({target:{name:'colorlab-appearance',value}});
  return {sheet,root,stored,system,choose,events,windowEvents,inputs};
}
test('defaults to system and responds live to OS appearance changes',()=>{
  const s=setup();assert.equal(s.sheet.media,'not all');s.system.matches=true;s.system.change();assert.equal(s.sheet.media,'all');
  assert.equal(s.root.dataset.appearance,'system');
});
test('manual appearance persists before paint and overrides system until reset',()=>{
  const s=setup('dark');assert.equal(s.sheet.media,'all');s.system.change();assert.equal(s.sheet.media,'all');
  s.choose('light');s.system.matches=true;s.system.change();assert.equal(s.sheet.media,'not all');
  assert.equal(s.stored.get('colorlab-appearance-v1'),'light');s.choose('system');assert.equal(s.sheet.media,'all');
});
test('same-origin frame or another tab updates without reopening',()=>{
  const s=setup();s.windowEvents.storage({key:'colorlab-appearance-v1',newValue:'dark'});assert.equal(s.sheet.media,'all');
  s.windowEvents.storage({key:'unrelated',newValue:'light'});assert.equal(s.sheet.media,'all');
  s.windowEvents.storage({key:null,newValue:null});assert.equal(s.sheet.media,'not all');
});
test('blocked storage and malformed saved values keep appearance usable',()=>{
  const s=setup(null,false,true);s.choose('dark');assert.equal(s.sheet.media,'all');
  const invalid=setup('oops');assert.equal(invalid.root.dataset.appearance,'system');invalid.choose('oops');assert.equal(invalid.sheet.media,'not all');
});
test('radio selection stays synchronized after profile is rendered',()=>{
  const s=setup('dark');s.inputs.forEach(input=>input.checked=false);s.events['colorlab-theme-sync']();
  assert.deepEqual(s.inputs.map(input=>input.checked),[false,false,true]);
});
test('both documents load the shared theme in head and public cache includes it',()=>{
  for(const page of ['index','account']){
    const html=fs.readFileSync(`color-web/app/${page}.html`,'utf8');
    assert.match(html.split('</head>')[0],/data-system-theme media="\(prefers-color-scheme: dark\)"/);
    assert.match(html.split('</head>')[0],/src="\/app\/theme-preference.js"/);
  }
  const sw=fs.readFileSync('scripts/static-service-worker.js','utf8');assert.match(sw,/system-theme.css/);assert.match(sw,/theme-preference.js/);
});
