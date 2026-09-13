// Keep the audio document alive while the existing application pages navigate.
// The content frame is same-origin; URLs, forms and their unload guards stay native.
const embedded = window.frameElement?.matches('iframe[data-colorlab-page]');
if (embedded) {
  const notify = type => parent.document.dispatchEvent(new Event(type));
  const sync = () => {
    parent.history.replaceState(parent.history.state, '', location.href);
    parent.document.title = document.title;
    notify('colorlab-page-route');
  };
  document.addEventListener('colorlab-tour-close',sync);
  window.addEventListener('hashchange', sync);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) sync();
  });
  document.addEventListener('click', () => notify('colorlab-page-gesture'), true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') notify('colorlab-page-gesture');
  }, true);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (link && !link.target && !link.hasAttribute('download')) {
      const url = new URL(link.href);
      if (url.origin !== location.origin) link.target = '_top';
    }
  });
  await import(location.pathname.endsWith('account.html') ? './account.mjs' : './app.js');
  new MutationObserver(() => { parent.document.title = document.title; })
    .observe(document.querySelector('title'), {childList:true,subtree:true,characterData:true});
  sync();
} else {
  document.documentElement.classList.add('colorlab-shell');
  const style = document.createElement('style');
  style.textContent = '.colorlab-shell,.colorlab-shell body{height:100%;overflow:hidden!important}.colorlab-shell body> :not([data-colorlab-page]):not(.ambient-music-toggle):not(audio):not(script):not(style){display:none!important}iframe[data-colorlab-page]{position:fixed;inset:0;width:100%;height:100%;height:100dvh;border:0;background:var(--paper,#fcf8f4)}';
  document.head.append(style);
  const frame = document.createElement('iframe');
  frame.dataset.colorlabPage = '';
  frame.title = 'ColorLab 網站內容';
  frame.allow = 'autoplay; fullscreen';
  frame.src = location.href;
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    document.documentElement.removeAttribute('data-colorlab-intro-seen');
    frame.contentDocument?.dispatchEvent(new Event('colorlab-visit-restored'));
  });
  window.addEventListener('hashchange', () => {
    if (frame.contentWindow.location.href !== location.href) frame.contentWindow.location.replace(location.href);
  });
  frame.addEventListener('load', () => {
    try {
      if (frame.contentWindow.location.origin !== location.origin) return;
      history.replaceState(history.state, '', frame.contentWindow.location.href);
      document.title = frame.contentDocument.title;
      document.dispatchEvent(new Event('colorlab-page-route'));
    } catch { /* Cross-origin destinations use normal top-level links. */ }
  });
  frame.addEventListener('load',()=>import('./warm-assets.mjs').then(({warmAssets})=>warmAssets()),{once:true});
  document.body.append(frame);
  await import('./ambient-music.mjs');
}
