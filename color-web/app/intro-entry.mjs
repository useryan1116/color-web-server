const visitRoot=window.top.document.documentElement;
const seenAttribute='data-colorlab-intro-seen';
// Temporary, on-device diagnostics: no persistence, requests or exception payloads.
function reportIntro(status,video) {
  const article=document.querySelector('.about-colorlab');if(!article)return;
  let panel=document.querySelector('[data-intro-check]');
  if(!panel){
    panel=document.createElement('details');panel.dataset.introCheck='';
    panel.style.cssText='margin:12px 0;padding:10px 14px;border:1px solid #ddd8d1;border-radius:12px;color:#625c55;font:14px/1.6 system-ui;text-align:left';
    panel.innerHTML='<summary style="cursor:pointer">動畫檢查資訊（暫時）</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;margin:8px 0 0"></pre>';
    const hero=article.querySelector?.('.about-hero');if(hero)hero.after(panel);else article.prepend(panel);
  }
  panel.querySelector('pre').textContent=[
    '檢查版：20260913.2',`狀態：${status}`,
    `獨立 App 模式：${navigator.standalone===true||matchMedia('(display-mode: standalone)').matches?'是':'否'}`,
    `減少動態：${matchMedia('(prefers-reduced-motion: reduce)').matches?'是':'否'}`,
    `本次開站已播放或跳過：${visitRoot.hasAttribute(seenAttribute)?'是':'否'}`,
    ...(video?[`影片編碼：${video.dataset.introCodec}`,`影片準備狀態：${Number(video.readyState)||0}`,`影片錯誤代碼：${Number(video.error?.code)||0}`,`播放秒數：${(Number(video.currentTime)||0).toFixed(2)}`,`影片尺寸：${Number(video.videoWidth)||0} × ${Number(video.videoHeight)||0}`]:[])
  ].join('\n');
}
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
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){reportIntro('減少動態設定略過');return;}
  // The persistent shell owns one visit; iframe navigation must not reset it.
  if(document.querySelector('dialog[aria-label="ColorLab 開場"][open]'))return;
  if(visitRoot.hasAttribute(seenAttribute)){reportIntro('本次開站已播放或跳過');return;}
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label','ColorLab 開場');
  dialog.style.cssText='position:fixed;inset:0;max-width:none;max-height:none;width:100vw;height:100dvh;margin:0;padding:0;border:0;background:#faf8f2;overflow:hidden;';
  dialog.innerHTML='<div data-intro-stage style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><span style="font:600 32px system-ui">ColorLab<span style="color:#a44865">.</span></span></div><button type="button" style="position:absolute;right:24px;bottom:max(24px,env(safe-area-inset-bottom));padding:10px 18px;background:#fffefa;border:1px solid #d8ceca;border-radius:24px;color:#675b58;font:16px system-ui;cursor:pointer">跳過開場</button>';
  let dispose,closed=false,video,finishExit;
  const skip=dialog.querySelector('button');
  skip.className='intro-skip';
  const style=document.createElement('style');
  style.textContent='.intro-skip{border:0!important;background:#efede7!important;color:#605d55!important;box-shadow:none!important;min-height:44px}.intro-skip:hover{background:#e3e0d8!important}.intro-skip:focus:not(:focus-visible){outline:none!important}.intro-skip:focus-visible{outline:2px solid #767c73!important;outline-offset:4px}';
  style.textContent+='dialog[aria-label="ColorLab 開場"]::backdrop{background:transparent}';
  dialog.append(style);
  const prior=document.activeElement;
  const close=(status)=>{
    if(closed){if(typeof status!=='string')finishExit?.();return;}closed=true;clearTimeout(deadline);
    reportIntro(typeof status==='string'?status:'離開頁面',video);
    video?.pause();
    finishExit=()=>{
      if(!dialog.open)return;
      document.dispatchEvent(new Event('colorlab-intro-close'));
      dialog.close();dispose?.();dialog.remove();
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
        settle=video.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${target.left-left}px,${target.top-top}px) scale(${target.width/width})`}],timing);
      }
      const exit=dialog.animate([{opacity:1},{opacity:1,offset:.5},{opacity:0}],timing);
      Promise.allSettled([exit.finished,settle?.finished]).then(finishExit);
    }else finishExit();
  };
  const deadline=setTimeout(()=>close('影片載入或播放逾時'),12000);
  dialog.querySelector('button').onclick=()=>{visitRoot.setAttribute(seenAttribute,'');close('使用者跳過');};
  dialog.addEventListener('cancel',event=>{event.preventDefault();close('使用者關閉');});
  window.addEventListener('hashchange',close);window.addEventListener('pagehide',close);
  document.body.append(dialog);dialog.showModal();
  document.dispatchEvent(new CustomEvent('colorlab-intro-open',{detail:dialog}));
  // The approved Remotion composition is rendered ahead of time, not on the phone.
  const orientation=innerHeight>innerWidth?'mobile':'desktop';
  const playSource=(alternative=false)=>{
    if(closed)return;
    video?.pause();
    const candidate=document.createElement('video');video=candidate;
    candidate.muted=true;candidate.defaultMuted=true;candidate.playsInline=true;
    candidate.preload='auto';candidate.setAttribute('aria-label','ColorLab 四色角色開場');
    candidate.dataset.introCodec=alternative?'HEVC / 4K 120':'H.264 / 4K 120';
    candidate.src=`/assets/intro/about-${orientation}-4k120-${alternative?'hevc-v7':'v6'}.mp4`;
    candidate.style.cssText='width:100%;height:100%;object-fit:contain';
    const active=()=>!closed&&video===candidate;
    const failed=(name)=>{
      if(!active())return;
      if(!alternative&&(name==='NotSupportedError'||[3,4].includes(candidate.error?.code))){playSource(true);return;}
      close(({NotAllowedError:'瀏覽器拒絕自動播放',NotSupportedError:'影片格式不支援',AbortError:'播放請求中斷'})[name]||'影片載入或解碼失敗');
    };
    candidate.addEventListener('ended',()=>{if(active())close('播放完成');},{once:true});
    candidate.addEventListener('error',()=>failed(candidate.error?.code===4?'NotSupportedError':'MediaError'),{once:true});
    dialog.querySelector('[data-intro-stage]').replaceChildren(candidate);
    reportIntro(alternative?'正在嘗試同畫質 HEVC 影片':'正在載入影片',candidate);
    candidate.play().then(()=>{if(active()){visitRoot.setAttribute(seenAttribute,'');reportIntro('影片已開始播放',candidate);}}).catch(error=>failed(error?.name));
  };
  playSource();
}
