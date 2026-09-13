const visitRoot=window.top.document.documentElement;
const seenAttribute='data-colorlab-intro-seen';
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
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
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
    video?.pause();
    finishExit=()=>{
      if(!dialog.open)return;
      document.dispatchEvent(new Event('colorlab-intro-close'));
      dialog.close();dispose?.();video?.removeAttribute('src');video?.load();dialog.remove();
      window.removeEventListener('hashchange',close);window.removeEventListener('pagehide',close);
      if(prior instanceof HTMLElement && prior.isConnected)prior.focus({preventScroll:true});
    };
    if(status==='播放完成'&&dialog.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
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
  const sources=[['4K','H.264',`about-${orientation}-4k120-v6.mp4`],['4K','HEVC',`about-${orientation}-4k120-hevc-v7.mp4`],
    ...['2k','1080p'].flatMap(tier=>['hevc','avc'].map(codec=>[tier==='2k'?'2K':'1080p',codec==='hevc'?'HEVC':'H.264',`about-${orientation}-${tier}120-${codec}-v8.mp4`]))];
  const playSource=(index=0)=>{
    if(closed)return;
    loading.hidden=false;
    clearTimeout(deadline);
    const previous=video;video=null;
    previous?.pause();previous?.removeAttribute('src');previous?.load();
    const candidate=document.createElement('video');video=candidate;
    candidate.muted=true;candidate.defaultMuted=true;candidate.playsInline=true;
    candidate.preload='auto';candidate.setAttribute('aria-label','ColorLab 四色角色開場');
    const [tier,codec,file]=sources[index];
    candidate.dataset.introCodec=`${codec} / ${tier} 120`;
    candidate.dataset.introPadded=String(index>=2&&orientation==='mobile');
    candidate.src='/assets/intro/'+file;
    candidate.style.cssText='width:100%;height:100%;object-fit:contain';
    const active=()=>!closed&&video===candidate;
    const failed=(name)=>{
      if(!active())return;
      if(index+1<sources.length&&(name==='NotSupportedError'||name==='TimeoutError'||name==='MediaError')){playSource(index+1);return;}
      close(({NotAllowedError:'瀏覽器拒絕自動播放',NotSupportedError:'影片格式不支援',AbortError:'播放請求中斷'})[name]||'影片載入或解碼失敗');
    };
    candidate.addEventListener('ended',()=>{if(active())close('播放完成');},{once:true});
    candidate.addEventListener('playing',()=>{if(active())loading.hidden=true;},{once:true});
    candidate.addEventListener('error',()=>failed(candidate.error?.code===4?'NotSupportedError':'MediaError'),{once:true});
    dialog.querySelector('[data-intro-stage]').replaceChildren(candidate);
    // Advance after stalled loading/playback; progress renews the deadline.
    const arm=()=>{if(active()){clearTimeout(deadline);deadline=setTimeout(()=>failed('TimeoutError'),4000);}};
    let lastTime=0;
    candidate.addEventListener('timeupdate',()=>{if(candidate.currentTime>lastTime){lastTime=candidate.currentTime;arm();}});
    arm();
    candidate.play().then(()=>{if(active())visitRoot.setAttribute(seenAttribute,'');}).catch(error=>failed(error?.name));
  };
  playSource();
}
