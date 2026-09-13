const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('music preference connection reuses the content connection and never opens another wake screen',async()=>{
  let requests=0,readyReads=0;
  const content={contentWindow:{ColorLabConnection:{get ready(){readyReads++;return Promise.resolve();}}}};
  const window={COLORLAB_API_ORIGIN:'https://api.example.test',fetch:async()=>{requests++;return new Response('OK');},addEventListener(){}};
  const document={querySelector:s=>s==='iframe[data-colorlab-page]'?content:null,addEventListener(){},createElement(){throw Error('duplicate wake screen');}};
  vm.runInNewContext(fs.readFileSync('color-web/js/static-connection.js','utf8'),{window,document,URL,Request,AbortSignal,location:{href:'https://site.example.test/app/',origin:'https://site.example.test'}});
  await window.ColorLabConnection.ready;
  assert.equal(readyReads,1);assert.equal(requests,0);
});
test('tour records first display immediately, even without completing or skipping',()=>{
  const stored=new Map();let shown=0;
  const node=()=>({style:{},focus(){},textContent:'',getBoundingClientRect:()=>({x:0,y:0,left:0,top:0,right:80,bottom:44,width:80,height:160}),setAttribute(){},addEventListener(){}});
  const nodes=new Map(),dialog={...node(),querySelector:s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},showModal(){shown++;}};
  const context={location:{hash:'#home'},localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},document:{activeElement:null,querySelector:s=>s==='dialog[open]'?null:node(),createElement:()=>dialog,body:{append(){}},dispatchEvent(){}},window:{scrollY:0,addEventListener(){}},setTimeout:fn=>fn(),requestAnimationFrame:()=>1,innerWidth:390,innerHeight:844,CustomEvent:class{},Event:class{}};
  const source=fs.readFileSync('color-web/app/first-tour.mjs','utf8').replace('export function','function');
  vm.runInNewContext(source+';offerTour();',context);
  assert.equal(shown,1);assert.equal(stored.get('colorlab-tour-v1'),'1');
  vm.runInNewContext(source+';offerTour();',{...context});assert.equal(shown,1);
});
