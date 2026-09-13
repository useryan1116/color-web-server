let enteredAbout=false;
window.addEventListener('hashchange',()=>{if(location.hash!=='#about')enteredAbout=false;});
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');if(!link||link.target||link.hasAttribute('download'))return;
  const target=new URL(link.href,location.href);
  if(location.hash==='#about'&&target.origin===location.origin&&target.pathname===location.pathname&&target.hash==='#about'){
    event.preventDefault();showIntro(true);
  }
});
export function showIntro(replay=false) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash!=='#about') return;
  // Each route entry can replay; duplicate renders on the same entry cannot.
  if((enteredAbout&&!replay)||document.querySelector('dialog[aria-label="ColorLab 開場"][open]'))return;
  enteredAbout=true;
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
  const close=()=>{
    if(closed)return;closed=true;clearTimeout(deadline);
    document.dispatchEvent(new Event('colorlab-intro-close'));
    video?.pause();dialog.close();dispose?.();dialog.remove();
    window.removeEventListener('hashchange',close);window.removeEventListener('pagehide',close);
    if(prior instanceof HTMLElement && prior.isConnected)prior.focus({preventScroll:true});
  };
  const deadline=setTimeout(close,12000);
  dialog.querySelector('button').onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.addEventListener('hashchange',close);window.addEventListener('pagehide',close);
  document.body.append(dialog);dialog.showModal();
  document.dispatchEvent(new CustomEvent('colorlab-intro-open',{detail:dialog}));
  // The approved Remotion composition is rendered ahead of time, not on the phone.
  video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;
  video.preload='auto';video.setAttribute('aria-label','ColorLab 四色角色開場');
  video.src=innerHeight>innerWidth?'/assets/intro/about-mobile-4k120-v6.mp4':'/assets/intro/about-desktop-4k120-v6.mp4';
  video.style.cssText='width:100%;height:100%;object-fit:contain';
  video.addEventListener('ended',close,{once:true});video.addEventListener('error',close,{once:true});
  dialog.querySelector('[data-intro-stage]').replaceChildren(video);
  video.play().catch(close);
}
