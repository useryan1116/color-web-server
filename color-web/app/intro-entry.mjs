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
    article.prepend(panel);
  }
  panel.querySelector('pre').textContent=[
    '檢查版：20260913.1',`狀態：${status}`,
    `獨立 App 模式：${navigator.standalone===true||matchMedia('(display-mode: standalone)').matches?'是':'否'}`,
    `減少動態：${matchMedia('(prefers-reduced-motion: reduce)').matches?'是':'否'}`,
    `本次開站已播放或跳過：${visitRoot.hasAttribute(seenAttribute)?'是':'否'}`,
    ...(video?[`影片準備狀態：${Number(video.readyState)||0}`,`影片錯誤代碼：${Number(video.error?.code)||0}`,`播放秒數：${(Number(video.currentTime)||0).toFixed(2)}`,`影片尺寸：${Number(video.videoWidth)||0} × ${Number(video.videoHeight)||0}`]:[])
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
  let dispose,closed=false,video;
  const skip=dialog.querySelector('button');
  skip.className='intro-skip';
  const style=document.createElement('style');
  style.textContent='.intro-skip{border:0!important;background:#efede7!important;color:#605d55!important;box-shadow:none!important;min-height:44px}.intro-skip:hover{background:#e3e0d8!important}.intro-skip:focus:not(:focus-visible){outline:none!important}.intro-skip:focus-visible{outline:2px solid #767c73!important;outline-offset:4px}';
  dialog.append(style);
  const prior=document.activeElement;
  const close=(status)=>{
    if(closed)return;closed=true;clearTimeout(deadline);
    reportIntro(typeof status==='string'?status:'離開頁面',video);
    document.dispatchEvent(new Event('colorlab-intro-close'));
    video?.pause();dialog.close();dispose?.();dialog.remove();
    window.removeEventListener('hashchange',close);window.removeEventListener('pagehide',close);
    if(prior instanceof HTMLElement && prior.isConnected)prior.focus({preventScroll:true});
  };
  const deadline=setTimeout(()=>close('影片載入或播放逾時'),12000);
  dialog.querySelector('button').onclick=()=>{visitRoot.setAttribute(seenAttribute,'');close('使用者跳過');};
  dialog.addEventListener('cancel',event=>{event.preventDefault();close('使用者關閉');});
  window.addEventListener('hashchange',close);window.addEventListener('pagehide',close);
  document.body.append(dialog);dialog.showModal();
  document.dispatchEvent(new CustomEvent('colorlab-intro-open',{detail:dialog}));
  // The approved Remotion composition is rendered ahead of time, not on the phone.
  video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;
  video.preload='auto';video.setAttribute('aria-label','ColorLab 四色角色開場');
  video.src=innerHeight>innerWidth?'/assets/intro/about-mobile-4k120-v6.mp4':'/assets/intro/about-desktop-4k120-v6.mp4';
  video.style.cssText='width:100%;height:100%;object-fit:contain';
  video.addEventListener('ended',()=>close('播放完成'),{once:true});video.addEventListener('error',()=>close('影片載入或解碼失敗'),{once:true});
  dialog.querySelector('[data-intro-stage]').replaceChildren(video);
  reportIntro('正在載入影片',video);
  video.play().then(()=>{if(!closed){visitRoot.setAttribute(seenAttribute,'');reportIntro('影片已開始播放',video);}}).catch(error=>close(({NotAllowedError:'瀏覽器拒絕自動播放',NotSupportedError:'影片格式不支援',AbortError:'播放請求中斷'})[error?.name]||'影片播放失敗'));
}
