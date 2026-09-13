const test=require('node:test'),assert=require('node:assert/strict');
const {parse,sendContact}=require('../services/contactMail');
test('contact requires all three trimmed fields and bounded input',()=>{
 const valid={description:'hello',name:'Visitor',email:'test@example.com'};
 assert.deepEqual(parse({description:' hello ',name:' Visitor ',email:' test@example.com '}),valid);
 for(const key of ['description','name','email']){
  for(const missing of ['', '   ', null, undefined])assert.equal(parse({...valid,[key]:missing}),null);
 }
 for(const patch of [{description:'x'.repeat(5001)},{email:'bad'},{name:{bad:1}},{name:'x'.repeat(81)},{email:'x'.repeat(255)}])assert.equal(parse({...valid,...patch}),null);
});
test('mail goes only to fixed recipient and uses plain text',async()=>{
 let payload;
 assert.equal(await sendContact(parse({name:'Visitor',description:'<script>test</script>',email:'test@example.com',to:'other@example.com'}),{env:{BREVO_API_KEY:'fake',BREVO_SENDER_EMAIL:'sender@example.com'},transport:async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true};}}),true);
 assert.deepEqual(payload.to,[{email:'yehpty@gmail.com'}]);assert.equal(payload.replyTo.email,'test@example.com');assert.equal(payload.htmlContent,undefined);
});
test('missing configuration and provider rejection do not claim mail sent',async()=>{
 assert.equal(await sendContact({description:'test'},{env:{}}),false);
 assert.equal(await sendContact({description:'test'},{env:{BREVO_API_KEY:'fake',BREVO_SENDER_EMAIL:'sender@example.com'},transport:async()=>({ok:false})}),false);
});
