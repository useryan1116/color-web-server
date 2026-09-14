// Default on; respect browser autoplay policy and the user's saved mute choice.
import {draggableMusic} from './music-position.mjs';
const tracks={home:'/assets/music/home-first-light-hq.flac',about:'/assets/music/about-soft-piano-hq.flac'};
const button=document.createElement('button');
button.type='button';button.className='ambient-music-action';button.setAttribute('role','switch');button.setAttribute('aria-label','配樂');
const widget=document.createElement('div');widget.className='ambient-music-toggle';
widget.innerHTML='<button type="button" class="ambient-to-top" aria-label="回到頁面頂端" title="回到頁面頂端" hidden><span aria-hidden="true">↑</span></button><button type="button" class="ambient-music-icon" aria-label="配樂設定" aria-expanded="false" aria-controls="ambient-music-panel"><span aria-hidden="true">♫</span></button><div id="ambient-music-panel" class="ambient-music-panel" inert><p aria-live="polite"></p></div>';
const panel=widget.querySelector('.ambient-music-panel'),status=panel.querySelector('p');panel.append(button);
const styles=document.createElement('style');styles.textContent=`
.ambient-music-toggle{position:fixed;left:16px;bottom:calc(90px + env(safe-area-inset-bottom));z-index:80;display:flex;align-items:center;width:44px;height:44px;padding:0!important;border:1px solid #ded5d0;border-radius:24px;background:#fffdf8f5;color:#655d59;overflow:visible;box-shadow:0 3px 12px #3934350a;transition:width 180ms cubic-bezier(.2,0,0,1),box-shadow 180ms}
.ambient-music-toggle[data-open="true"]{width:148px;box-shadow:0 4px 16px #39343516}
.ambient-music-toggle[data-side="right"]{flex-direction:row-reverse}
.ambient-music-icon{display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;font:20px system-ui}
.ambient-music-panel{display:flex;align-items:center;flex:1;min-width:0;padding-right:5px;opacity:0;transform:translateX(-4px);transition:opacity 100ms,transform 180ms;white-space:nowrap}
.ambient-music-toggle[data-side="right"] .ambient-music-panel{padding:0 0 0 5px;transform:translateX(4px)}
.ambient-music-toggle[data-open="true"] .ambient-music-panel{opacity:1;transform:translateX(0)}
.ambient-music-panel p{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}
.ambient-music-action{flex:0 0 96px;height:40px;padding:0 8px;border:0;border-radius:20px;background:#edf0e7;color:#41493c;font:12px system-ui;cursor:pointer;transition:background 120ms}
.ambient-music-action[aria-checked="false"]{background:#efede8;color:#756e65}
.ambient-to-top{position:absolute;left:0;bottom:52px;display:grid;place-items:center;width:44px;height:44px;padding:0;border:1px solid #ded5d0;border-radius:50%;background:#fffdf8f5;color:#655d59;box-shadow:0 3px 12px #39343516;cursor:pointer;font:22px system-ui;transition:opacity 180ms,transform 180ms}.ambient-to-top[hidden]{display:none}.ambient-music-toggle[data-side="right"] .ambient-to-top{left:auto;right:0}
.ambient-music-icon:focus-visible,.ambient-music-action:focus-visible,.ambient-to-top:focus-visible{outline:2px solid #64715d;outline-offset:-3px}
.first-tour .ambient-music-toggle{position:relative!important;left:auto;bottom:auto;min-height:44px;padding:0!important}
@media(prefers-reduced-motion:reduce){.ambient-music-toggle,.ambient-music-panel{transition:none!important}}
`;document.head.append(styles);
const trigger=widget.querySelector('.ambient-music-icon'),toTop=widget.querySelector('.ambient-to-top');
let reposition=()=>{};
let toTopTimer=0;
const expand=open=>{widget.dataset.open=String(open);trigger.setAttribute('aria-expanded',String(open));panel.inert=!open;reposition();};
const collapse=()=>expand(false);
trigger.onclick=()=>expand(widget.dataset.open!=='true');
widget.addEventListener('keydown',event=>{if(event.key==='Escape'&&widget.dataset.open==='true'){event.preventDefault();event.stopPropagation();collapse();trigger.focus();}});
document.addEventListener('click',event=>{if(!widget.contains(event.target))collapse();});
const place=()=>{collapse();(document.querySelector('dialog[aria-label="ColorLab 開場"][open]')||document.body).append(widget);};
place();
reposition=draggableMusic(widget,trigger);
const pageFrame=()=>document.querySelector('iframe[data-colorlab-page]');
const topExcluded=()=>['survey','surveys','test'].includes(location.hash.slice(1).split('/')[0]);
const syncTop=()=>{const view=pageFrame()?.contentWindow;toTop.hidden=topExcluded()||(view?.scrollY||0)<Math.min(500,(view?.innerHeight||800)*.65);};
const bindPageScroll=()=>{const view=pageFrame()?.contentWindow;if(!view)return;view.addEventListener('scroll',syncTop,{passive:true});syncTop();};
const animateTop=view=>{
  const from=view.scrollY;
  if(from<=0||typeof view.scrollTo!=='function') return;
  if(toTopTimer)view.clearInterval(toTopTimer);
  const duration=Math.min(620,Math.max(440,from*.2)),steps=Math.ceil(duration/16);let step=0;
  const run=()=>{
    const t=Math.min(1,++step/steps);
    view.scrollTo({top:Math.max(0,Math.round(from*(1-t))),behavior:'instant'});
    if(t===1){view.clearInterval(toTopTimer);toTopTimer=0;}
  };
  run();toTopTimer=view.setInterval(run,Math.ceil(duration/steps));
};
toTop.onclick=()=>{const view=pageFrame()?.contentWindow;if(view)animateTop(view);};
pageFrame()?.addEventListener('load',bindPageScroll);document.addEventListener('colorlab-page-route',bindPageScroll);bindPageScroll();
document.addEventListener('colorlab-about-ready',place);
document.addEventListener('colorlab-intro-open',event=>{collapse();event.detail.append(widget);});
document.addEventListener('colorlab-intro-close',()=>{collapse();document.body.append(widget);});
document.addEventListener('colorlab-tour-open',event=>{collapse();event.detail.append(widget);});
document.addEventListener('colorlab-tour-close',place);
document.addEventListener('colorlab-tour-gesture',()=>{if(enabled)start();});
let enabled=false,active=null,pending=null,generation=0,needsGesture=false;
const route=()=>location.hash==='#about'?'about':'home';
const saved=()=>{try{return JSON.parse(sessionStorage.getItem('colorlab-music')||'{}');}catch{return {};}};
const remember=()=>{try{const positions=saved().positions||{};if(active)positions[active.track]={source:tracks[active.track],time:active.audio.currentTime||0};sessionStorage.setItem('colorlab-music',JSON.stringify({enabled,positions,track:active?.track,source:tracks[active?.track],time:active?.audio.currentTime||0}));}catch{}};
const label=()=>{button.textContent=enabled?'ON · 開啟':'OFF · 關閉';button.setAttribute('aria-checked',String(enabled));status.textContent=needsGesture?'已啟用，等待播放':'配樂'+(enabled?'已開啟':'已關閉');button.title=status.textContent;};
const fades=new WeakMap();
const fade=(audio,to,duration=700,curve='smooth')=>{
  const token={};fades.set(audio,token);
  const from=audio.volume,start=performance.now();
  return new Promise(resolve=>{
    const tick=()=>{if(fades.get(audio)!==token){resolve();return;}const fraction=Math.min(1,(performance.now()-start)/duration);const eased=curve==='in'?Math.sin(fraction*Math.PI/2):curve==='out'?1-Math.cos(fraction*Math.PI/2):fraction*fraction*(3-2*fraction);audio.volume=from+(to-from)*eased;if(fraction<1)requestAnimationFrame(tick);else resolve();};
    tick();
  });
};
async function start(userInitiated=false) {
  if(!enabled||document.hidden)return;
  const track=route();
  if(pending?.track===track)return;
  if(pending){++generation;pending.audio.pause();pending.audio.remove();pending=null;}
  if(active?.track===track){
    if(!active.audio.paused){fade(active.audio,.24,180);return;}
    const audio=active.audio,revision=++generation;pending=active;
    try{await audio.play();if(revision!==generation){audio.pause();return;}pending=null;needsGesture=false;label();fade(audio,.24,350);}
    catch(error){if(revision!==generation)return;pending=null;needsGesture=error.name==='NotAllowedError';label();}
    remember();return;
  }
  remember();
  const revision=++generation,previous=active,audio=new Audio(tracks[track]);
  audio.preload='none';audio.loop=true;audio.volume=0;
  audio.hidden=true;audio.className='ambient-music-audio';document.body.append(audio);
  const state=saved();
  const position=state.positions?.[track]||(state.track===track?state:null);
  audio.addEventListener('loadedmetadata',()=>{if(position?.source===tracks[track]&&Number.isFinite(position.time)&&audio.duration>0)audio.currentTime=Math.max(0,position.time%audio.duration);},{once:true});
  pending={track,audio};
  try{
    await audio.play();
    if(revision!==generation){audio.pause();audio.remove();return;}
    // Prepare silently, then hand over: different melodies must not overlap.
    if(previous&&!previous.audio.paused)await fade(previous.audio,0,250);
    if(revision!==generation){audio.pause();audio.remove();return;}
    if(previous){previous.audio.pause();previous.audio.remove();}
    active={track,audio};pending=null;
    button.title='配樂播放中';
    needsGesture=false;label();
    fade(audio,.24,previous||userInitiated?350:3000);
  }catch(error){
    audio.pause();audio.remove();
    if(revision!==generation)return;
    pending=null;
    active=previous&&!previous.audio.paused?previous:null;needsGesture=error.name==='NotAllowedError';enabled=Boolean(active)||needsGesture;label();
    button.title=needsGesture?'配樂已啟用，等待首次操作後開始播放。':'配樂載入失敗，可重新開啟重試。';
  }
  remember();
}
button.onclick=()=>{
  needsGesture=false;
  enabled=!enabled;label();
  if(enabled)start(true);
  else{++generation;remember();pending=null;active=null;document.querySelectorAll('audio.ambient-music-audio').forEach(audio=>fade(audio,0,250).then(()=>{audio.pause();audio.remove();}));remember();}
};
window.addEventListener('hashchange',()=>{if(enabled)start();});
document.addEventListener('colorlab-page-route',()=>{if(enabled)start();});
document.addEventListener('colorlab-page-gesture',()=>{collapse();if(needsGesture&&enabled)start(true);});
const pauseHidden=()=>{remember();++generation;if(pending){pending.audio.pause();pending.audio.remove();pending=null;}document.querySelectorAll('audio.ambient-music-audio').forEach(audio=>{fades.delete(audio);audio.pause();});};
window.addEventListener('pagehide',pauseHidden);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    pauseHidden();
  }else if(enabled)start();
});
window.addEventListener('pageshow',event=>{if(event.persisted&&enabled)start();});
document.addEventListener('click',event=>{if(needsGesture&&enabled&&!button.contains(event.target))start();});
enabled=saved().enabled!==false;label();if(enabled)start();
