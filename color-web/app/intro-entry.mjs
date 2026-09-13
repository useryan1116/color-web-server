export function showIntro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash!=='#about') return;
  try { if(sessionStorage.getItem('colorlab-about-intro-seen'))return;sessionStorage.setItem('colorlab-about-intro-seen','1'); } catch { return; }
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label','ColorLab 開場');
  dialog.style.cssText='position:fixed;inset:0;max-width:none;max-height:none;width:100vw;height:100dvh;margin:0;padding:0;border:0;background:#faf8f2;overflow:hidden;';
  dialog.innerHTML='<div data-intro-stage style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><span style="font:600 32px system-ui">ColorLab<span style="color:#a44865">.</span></span></div><button type="button" style="position:absolute;right:24px;bottom:max(24px,env(safe-area-inset-bottom));padding:10px 18px;background:#fffefa;border:1px solid #d8ceca;border-radius:24px;color:#675b58;font:16px system-ui;cursor:pointer">跳過開場</button>';
  let dispose,closed=false;
  const skip=dialog.querySelector('button');
  skip.className='intro-skip';
  const style=document.createElement('style');
  style.textContent='.intro-skip{border:0!important;background:#efede7!important;color:#605d55!important;box-shadow:none!important;min-height:44px}.intro-skip:hover{background:#e3e0d8!important}.intro-skip:focus:not(:focus-visible){outline:none!important}.intro-skip:focus-visible{outline:2px solid #767c73!important;outline-offset:4px}';
  dialog.append(style);
  const prior=document.activeElement;
  const close=()=>{
    if(closed)return;closed=true;clearTimeout(deadline);
    document.dispatchEvent(new Event('colorlab-intro-close'));
    dialog.close();dispose?.();dialog.remove();
    window.removeEventListener('hashchange',close);window.removeEventListener('pagehide',close);
    if(prior instanceof HTMLElement && prior.isConnected)prior.focus({preventScroll:true});
  };
  const deadline=setTimeout(close,6500);
  dialog.querySelector('button').onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.addEventListener('hashchange',close);window.addEventListener('pagehide',close);
  document.body.append(dialog);dialog.showModal();
  document.dispatchEvent(new CustomEvent('colorlab-intro-open',{detail:dialog}));
  import('./intro-player.js').then(({mount})=>{if(!closed)dispose=mount(dialog.querySelector('[data-intro-stage]'),close);}).catch(close);
}
