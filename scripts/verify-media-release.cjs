// Read-only public release verification; no credentials, writes or mail.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../static-dist');
const assets=['app/index.html','app/account.html','app/account.mjs','app/app.js','app/experience.css','app/ambient-music.mjs','app/site-shell.mjs','app/music-position.mjs','app/music-preference.mjs','app/first-tour.mjs','app/handwriting.css','app/font-ready.mjs','app/intro-entry.mjs','app/warm-assets.mjs','js/static-connection.js','manifest.webmanifest','service-worker.js','wake.html','colorlab-mark.svg','assets/fonts/ChenYuluoyan-v2.woff2','assets/intro/about-mobile-4k120-v6.mp4','assets/intro/about-desktop-4k120-v6.mp4','assets/music/home-first-light-hq.flac','assets/music/about-soft-piano-hq.flac',...['cl-180','cl-192','cl-512','cl-maskable-192','cl-maskable-512'].map(n=>'assets/icons/'+n+'-v2.png')];
assets.push('assets/intro/about-mobile-4k120-hevc-v7.mp4','assets/intro/about-desktop-4k120-hevc-v7.mp4');
assets.push(...['mobile','desktop'].flatMap(layout=>['2k','1080p'].flatMap(tier=>['hevc','avc'].map(codec=>`assets/intro/about-${layout}-${tier}120-${codec}-v8.mp4`))));
assets.push('app/about.mjs','app/about.css','app/motion.css',...['desktop','mobile'].map(n=>'assets/intro/about-'+n+'-final-v6.webp'));
assets.push('app/navigation-motion.mjs');
(async()=>{
 const nonce=Date.now();
 for(const retired of ['app/intro-check.html','app/intro-check.mjs']){
   const r=await fetch('https://colorlab-start.onrender.com/'+retired,{redirect:'manual',signal:AbortSignal.timeout(30000)});
   assert.equal(r.status,301,retired);assert.equal(r.headers.get('location'),'/app/account.html#about');
   console.log('RETIRED',retired);
 }
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
