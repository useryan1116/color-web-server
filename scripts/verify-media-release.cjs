// Read-only public release verification; no credentials, writes or mail.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../static-dist');
const assets=['app/index.html','app/account.html','app/account.mjs','app/app.js','app/experience.css','app/ambient-music.mjs','app/site-shell.mjs','app/music-position.mjs','app/music-preference.mjs','app/first-tour.mjs','app/handwriting.css','app/font-ready.mjs','app/intro-entry.mjs','app/warm-assets.mjs','js/static-connection.js','manifest.webmanifest','service-worker.js','wake.html','colorlab-mark.svg','assets/fonts/ChenYuluoyan-v2.woff2','assets/intro/about-mobile-v2.mp4','assets/intro/about-desktop-v2.mp4','assets/music/home-first-light.mp3','assets/music/about-soft-piano.mp3',...['cl-180','cl-192','cl-512','cl-maskable-192','cl-maskable-512'].map(n=>'assets/icons/'+n+'-v2.png')];
(async()=>{
 const nonce=Date.now();
 for(let i=0;i<assets.length;i+=4)await Promise.all(assets.slice(i,i+4).map(async asset=>{
   const response=await fetch('https://colorlab-start.onrender.com/'+asset+'?verify='+nonce,{signal:AbortSignal.timeout(30000)});
   assert.equal(response.status,200,asset);
   const actual=Buffer.from(await response.arrayBuffer()),expected=await fs.readFile(path.join(root,asset));
   const text=/\.(html|mjs|js|css|webmanifest|svg)$/.test(asset);
   assert.ok(actual.equals(expected)||(text&&actual.toString().replace(/\r\n/g,'\n')===expected.toString().replace(/\r\n/g,'\n')),asset+' differs');
   console.log('MATCH',asset);
 }));
 for(const [route,status] of [['/health',200],['/api/explore/catalog',200],['/api/explore/music-preference',401],['/api/explore/records',401]]){
   const r=await fetch('https://color-web-server-jprj.onrender.com'+route,{signal:AbortSignal.timeout(30000)});
   assert.equal(r.status,status,route);if(route==='/health')assert.equal((await r.text()).trim(),'OK');
   console.log('ACCESS',route,status);
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
