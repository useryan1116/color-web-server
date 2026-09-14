const visitRoot=window.top.document.documentElement;
const seenAttribute='data-colorlab-intro-seen';
const measureRefresh=()=>typeof requestAnimationFrame!=='function'?Promise.resolve(60):new Promise(resolve=>{const frames=[];let done=false,timer;const finish=()=>{if(done)return;done=true;clearTimeout(timer);if(frames.length<6)return resolve(60);const gaps=frames.slice(1).map((time,index)=>time-frames[index]).sort((a,b)=>a-b);resolve(Math.round(1000/gaps[Math.floor(gaps.length/2)]));},sample=time=>{if(done)return;frames.push(time);if(frames.length<18)requestAnimationFrame(sample);else finish();};timer=setTimeout(finish,500);requestAnimationFrame(sample);});
const introFile=(orientation,tier,fps)=>fps===120?(tier==='4k'?`about-${orientation}-4k120-v6.mp4`:`about-${orientation}-${tier}120-avc-v8.mp4`):`about-${orientation}-${tier}${fps}-avc-v9.mp4`;
const videoSpecs={1080:{size:[1920,1080],rate:[1500000,1400000,7600000],codec:['avc1.64002A','avc1.640033','avc1.4D0033']},'2k':{size:[2560,1440],rate:[2300000,2200000,11800000],codec:['avc1.640033','avc1.640034','avc1.4D0034']},'4k':{size:[3840,2160],rate:[4300000,4000000,6600000],codec:['avc1.640034','avc1.64003C','avc1.64003C']}};
const smoothDecode=async(tier,fps,orientation)=>{if(!navigator.mediaCapabilities?.decodingInfo)return true;const key=tier==='1080p'?'1080':tier,spec=videoSpecs[key],i=fps===60?0:fps===80?1:2,[w,h]=orientation==='mobile'?[...spec.size].reverse():spec.size;try{return (await navigator.mediaCapabilities.decodingInfo({type:'file',video:{contentType:`video/mp4; codecs="${spec.codec[i]}"`,width:w,height:h,bitrate:spec.rate[i],framerate:fps}})).smooth!==false;}catch{return true;}};
const chooseSources=async orientation=>{const refresh=await measureRefresh(),pixels=Math.max(innerWidth,innerHeight)*(globalThis.devicePixelRatio||1),tier=pixels>=3000?'4k':pixels>=2000?'2k':'1080p',rates=refresh>=105?[120,80,60]:refresh>=75?[80,60]:[60],tiers=tier==='4k'?['4k','2k','1080p']:tier==='2k'?['2k','1080p']:['1080p'],candidates=[...rates.map(fps=>[tier,fps]),...tiers.slice(1).map(lower=>[lower,60])],smooth=await Promise.all(candidates.map(([quality,fps])=>smoothDecode(quality,fps,orientation)));return [...candidates.filter((_,i)=>smooth[i]),...candidates.filter((_,i)=>!smooth[i])].map(([quality,fps])=>[quality.toUpperCase(),fps,introFile(orientation,quality,fps)]);};
document.addEventListener('colorlab-visit-restored',()=>showIntro());
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');if(!link||link.target||link.hasAttribute('download'))return;
  const target=new URL(link.href,location.href);
  if(location.hash==='#about'&&target.origin===location.origin&&target.pathname===location.pathname&&target.hash==='#about'){
    event.preventDefault();showIntro();
  }
});
export function showIntro() {
  if(location.hash!=='#about')return;
  // The persistent shell owns one visit; iframe navigation must not reset it.
  if(document.querySelector('dialog[aria-label="ColorLab 開場"][open]'))return;
  if(visitRoot.hasAttribute(seenAttribute))return;
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label','ColorLab 開場');
  dialog.style.cssText='position:fixed;inset:0;max-width:none;max-height:none;width:100vw;height:100dvh;margin:0;padding:0;border:0;background:#faf8f2;overflow:hidden;';
  dialog.innerHTML='<div data-intro-stage style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"></div><div class="intro-loading" role="status" aria-label="載入中"><div class="loading-scene"><span class="loading-colors" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div></div><button type="button" style="position:absolute;right:24px;bottom:max(24px,env(safe-area-inset-bottom));padding:10px 18px;background:#fffefa;border:1px solid #d8ceca;border-radius:24px;color:#675b58;font:16px system-ui;cursor:pointer">跳過開場</button>';
  const loading=dialog.querySelector('.intro-loading');
  let dispose,closed=false,video,finishExit,deadline;
  const skip=dialog.querySelector('button');
  skip.className='intro-skip';
  const style=document.createElement('style');
  style.textContent='.intro-skip{border:0!important;background:#efede7!important;color:#605d55!important;box-shadow:none!important;min-height:44px}.intro-skip:hover{background:#e3e0d8!important}.intro-skip:focus:not(:focus-visible){outline:none!important}.intro-skip:focus-visible{outline:2px solid #767c73!important;outline-offset:4px}';
  style.textContent+='dialog[aria-label="ColorLab 開場"]::backdrop{background:transparent}';
  dialog.append(style);
  const prior=document.activeElement;
  const close=(status)=>{
    if(closed){if(typeof status!=='string')finishExit?.();return;}closed=true;clearTimeout(deadline);
    dialog.querySelectorAll?.('video').forEach(item=>item.pause());video?.pause();
    finishExit=()=>{
      if(!dialog.open)return;
      document.dispatchEvent(new Event('colorlab-intro-close'));
      dialog.close();dispose?.();video?.removeAttribute('src');video?.load();dialog.remove();
      window.removeEventListener('hashchange',close);window.removeEventListener('pagehide',close);
      if(prior instanceof HTMLElement && prior.isConnected)prior.focus({preventScroll:true});
    };
    if(status==='播放完成'&&dialog.animate){
      const timing={duration:520,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'};
      const target=document.querySelector('.about-final-poster')?.getBoundingClientRect();
      let settle;
      if(target?.width&&video.videoWidth&&video.animate){
        const width=Math.min(innerWidth,innerHeight*video.videoWidth/video.videoHeight),height=width*video.videoHeight/video.videoWidth;
        const left=(innerWidth-width)/2,top=(innerHeight-height)/2;
        video.style.cssText=`position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;object-fit:contain;transform-origin:0 0`;
        const padding=video.dataset.introPadded==='true'?(height-width*1.5)/2:0;
        settle=video.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${target.left-left}px,${target.top-top-padding*target.width/width}px) scale(${target.width/width})`}],timing);
      }
      const exit=dialog.animate([{opacity:1},{opacity:1,offset:.5},{opacity:0}],timing);
      Promise.allSettled([exit.finished,settle?.finished]).then(finishExit);
    }else finishExit();
  };
  dialog.querySelector('button').onclick=()=>{visitRoot.setAttribute(seenAttribute,'');close('使用者跳過');};
  dialog.addEventListener('cancel',event=>{event.preventDefault();close('使用者關閉');});
  window.addEventListener('hashchange',close);window.addEventListener('pagehide',close);
  document.body.append(dialog);dialog.showModal();
  document.dispatchEvent(new CustomEvent('colorlab-intro-open',{detail:dialog}));
  // The approved Remotion composition is rendered ahead of time, not on the phone.
  const orientation=innerHeight>innerWidth?'mobile':'desktop';
  let sources=[],performanceFallback=false;
  const playSource=(index=0,background=false,resumeAt=0)=>{
    if(closed)return;
    if(!background)loading.hidden=false;
    clearTimeout(deadline);
    const previous=video;video=null;
    if(!background){previous?.pause();previous?.removeAttribute('src');previous?.load();}
    const candidate=document.createElement('video');video=candidate;
    candidate.muted=true;candidate.defaultMuted=true;candidate.playsInline=true;
    candidate.preload='auto';candidate.setAttribute('aria-label','ColorLab 四色角色開場');
    const [tier,fps,file]=sources[index];
    candidate.dataset.introCodec=`H.264 / ${tier} ${fps}`;
    candidate.dataset.introFps=String(fps);
    candidate.dataset.introPadded=String(tier!=='4K'&&orientation==='mobile');
    candidate.src='/assets/intro/'+file;
    candidate.style.cssText='width:100%;height:100%;object-fit:contain';
    const active=()=>!closed&&video===candidate;
    const failed=(name)=>{
      if(!active())return;
      if(index+1<sources.length&&(name==='NotSupportedError'||name==='TimeoutError'||name==='MediaError')){if(background&&previous){candidate.remove();video=previous;playSource(index+1,true,previous.currentTime);}else playSource(index+1);return;}
      close(({NotAllowedError:'瀏覽器拒絕自動播放',NotSupportedError:'影片格式不支援',AbortError:'播放請求中斷'})[name]||'影片載入或解碼失敗');
    };
    candidate.addEventListener('ended',()=>{if(active())close('播放完成');},{once:true});
    candidate.addEventListener('playing',()=>{if(!active())return;loading.hidden=true;const start=candidate.getVideoPlaybackQuality?.();if(fps>60&&!performanceFallback&&start)setTimeout(()=>{if(!active())return;const end=candidate.getVideoPlaybackQuality(),total=end.totalVideoFrames-start.totalVideoFrames,dropped=end.droppedVideoFrames-start.droppedVideoFrames;if(total>12&&dropped/total>.05&&index+1<sources.length){performanceFallback=true;playSource(index+1,true,candidate.currentTime);}},500);},{once:true});
    candidate.addEventListener('error',()=>failed(candidate.error?.code===4?'NotSupportedError':'MediaError'),{once:true});
    const stage=dialog.querySelector('[data-intro-stage]');
    if(background&&previous){candidate.style.cssText+=';position:absolute;inset:0;opacity:0';stage.style.position='relative';stage.append(candidate);candidate.addEventListener('canplay',()=>{if(!active())return;clearTimeout(deadline);const swap=()=>candidate.play().then(()=>{previous.pause();previous.remove();candidate.style.cssText='width:100%;height:100%;object-fit:contain';}).catch(error=>failed(error?.name)),target=Math.min(resumeAt,Math.max(0,candidate.duration-.1));if(target>.05){candidate.addEventListener('seeked',swap,{once:true});candidate.currentTime=target;}else swap();},{once:true});deadline=setTimeout(()=>failed('TimeoutError'),4000);candidate.load();return;}
    stage.replaceChildren(candidate);
    // Advance after stalled loading/playback; progress renews the deadline.
    const arm=()=>{if(active()){clearTimeout(deadline);deadline=setTimeout(()=>failed('TimeoutError'),4000);}};
    let lastTime=0;
    candidate.addEventListener('timeupdate',()=>{if(candidate.currentTime>lastTime){lastTime=candidate.currentTime;arm();}});
    arm();
    candidate.play().then(()=>{if(active())visitRoot.setAttribute(seenAttribute,'');}).catch(error=>failed(error?.name));
  };
  chooseSources(orientation).then(list=>{sources=list;playSource();}).catch(()=>{sources=[['1080P',60,introFile(orientation,'1080p',60)]];playSource();});
}
