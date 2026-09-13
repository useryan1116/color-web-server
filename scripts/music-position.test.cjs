const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('music expands inward without moving its handle on either edge',()=>{
  const source=fs.readFileSync('color-web/app/music-position.mjs','utf8').replace(/import[^\n]+/,'').replace('export function','function');
  for(const x of [.95,.05]){
    const style={removeProperty(k){delete this[k];}},events={};
    const widget={style,dataset:{open:'false'}};
    const handle={style:{},setAttribute(){},addEventListener(k,v){events[k]=v;}};
    const context={innerWidth:390,innerHeight:844,window:{addEventListener(){}},positionStore:fn=>{fn({x,y:.5});return ()=>{};}};
    vm.createContext(context);vm.runInContext(source+';this.attach=draggableMusic;',context);
    const apply=context.attach(widget,handle);
    const handleLeft=()=>style.right&&style.right!=='auto'?390-parseFloat(style.right)-44:parseFloat(style.left);
    const before=handleLeft();widget.dataset.open='true';apply();
    assert.ok(Math.abs(handleLeft()-before)<1,'handle must stay anchored during expansion');
    assert.equal(widget.dataset.side,x>.5?'right':'left');
    events.keydown({key:'Home',preventDefault(){}});
    assert.ok(!style.right||style.right==='auto','Home clears right anchoring');
  }
});
