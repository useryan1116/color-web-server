const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express'),jwt=require('jsonwebtoken');
const User=require('../models/User'),Admin=require('../models/Admin'),Preference=require('../models/MusicPreference');
const {validPositionBody}=require('../services/musicPreference');
const originals={user:User.findById,admin:Admin.findById,find:Preference.findOne,update:Preference.findOneAndUpdate};
const values=new Map();let server,base;
before(async()=>{
  const member=id=>({select:()=>({lean:async()=>({_id:id,role:'user',name:'Fixture',email:'fixture@example.invalid',sessionVersion:0})})});
  User.findById=member;Admin.findById=id=>({select:()=>({lean:async()=>({_id:id,role:'admin',sessionVersion:0})})});
  const key=q=>q.ownerRole+':'+q.ownerId;
  Preference.findOne=q=>({lean:async()=>values.get(key(q))});
  Preference.findOneAndUpdate=async(q,value)=>{values.set(key(q),value.$set);};
  const app=express();app.use(express.json());app.use('/api/explore',require('../routes/explore'));
  await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port+'/api/explore/music-preference';
});
after(()=>{server?.close();User.findById=originals.user;Admin.findById=originals.admin;Preference.findOne=originals.find;Preference.findOneAndUpdate=originals.update;});
const headers=(id='1'.repeat(24),role='user')=>({'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id,role,sessionVersion:0},process.env.JWT_SECRET||'your-secret-key',{expiresIn:'1m'})});
test('reject malformed positions and ownership injection',()=>{
  for(const body of [{},{position:{x:2,y:.5}},{position:{x:'0',y:0}},{position:{x:0,y:0},ownerId:'other'},{position:[]}])assert.equal(validPositionBody(body),false);
  assert.equal(validPositionBody({position:null}),true);assert.equal(validPositionBody({position:{x:0,y:1}}),true);
});
test('requires authentication and isolates member/admin positions',async()=>{
  assert.equal((await fetch(base)).status,401);
  const point={x:.25,y:.6};
  assert.equal((await fetch(base,{method:'PUT',headers:headers(),body:JSON.stringify({position:point})})).status,200);
  assert.deepEqual(await(await fetch(base,{headers:headers()})).json(),{position:point});
  assert.deepEqual(await(await fetch(base,{headers:headers('2'.repeat(24))})).json(),{position:null});
  assert.deepEqual(await(await fetch(base,{headers:headers('1'.repeat(24),'admin')})).json(),{position:null});
  assert.equal((await fetch(base,{method:'PUT',headers:headers(),body:JSON.stringify({position:point,ownerId:'2'.repeat(24)})})).status,400);
  assert.equal((await fetch(base,{method:'PUT',headers:headers(),body:'{"position":null}'})).status,200);
});
