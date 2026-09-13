// Independent frontend: cache public shell only, never tokens, records, APIs or Render wake HTML.
const CACHE = 'colorlab-static-shell-v37';
const FONT_CACHE = 'colorlab-fonts-v2';
const FONT = '/assets/fonts/ChenYuluoyan-v2.woff2';
const OPTIONAL=['/assets/fonts/ChenYuluoyan-v2.woff2','/assets/intro/about-mobile-4k120-v6.mp4','/assets/intro/about-desktop-4k120-v6.mp4','/assets/music/home-first-light-hq.flac','/assets/music/about-soft-piano-hq.flac'];
const SHELL = ['/app/', '/app/app.js', '/app/model.mjs', '/app/client.mjs', '/app/auth.mjs', '/app/ui.mjs', '/app/account.html', '/app/account.mjs', '/app/account.css', '/app/style.css', '/app/motion.css', '/js/static-connection.js', '/colorlab-mark.svg', '/wake.html'];
SHELL.push('/app/site-shell.mjs','/app/font-ready.mjs','/app/handwriting.css','/app/ambient-music.mjs','/app/music-position.mjs','/app/music-preference.mjs','/app/warm-assets.mjs');
SHELL.push('/app/about.mjs','/app/intro-entry.mjs');
SHELL.push('/app/tab-scrubber.mjs','/app/first-tour.mjs','/app/first-tour.css');
SHELL.push('/app/system-theme.css','/app/theme-preference.js');
SHELL.push('/app/verification-status.mjs', '/app/verification-status.css');
SHELL.push('/app/character-art.mjs');
SHELL.push('/assets/images/survey-color-cover-20260906.webp');
SHELL.push('/app/companion-interaction.mjs', '/app/content-illustrations.mjs', '/app/legacy-import.mjs');
SHELL.push('/app/source-help.mjs');
SHELL.push('/app/result-summary.mjs', '/app/completion-feedback.mjs');
SHELL.push('/app/exploration-interactions.mjs', '/app/crayon-b.webp');
SHELL.push('/app/quiz-feedback.mjs', '/app/navigation-motion.mjs', '/app/statistics-view.mjs', '/app/statistics.css');
SHELL.push('/app/content-review.mjs','/app/content-review.css');
SHELL.push('/app/experience.css','/app/color-details.mjs');
SHELL.push(...['hotline-1925','lifeline-1995','teacher-1980','care-guide','psychology-columns','public-lectures','digital-research','inner-child','psychology-knowledge','youth-text','healthy-boundaries','relationship-pause','social-emotional-ai','counseling'].map(slug => `/assets/images/posts/${slug}-20260906.webp`));
SHELL.push('/app/characters.css', '/app/content-media.mjs', '/app/content-media.css', ...['red','yellow','green','blue'].map(color => `/assets/characters/${color}.webp`));
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const fonts = await caches.open(FONT_CACHE);
  if (!await fonts.match(FONT)) {
    const previous = await caches.match(FONT);
    if (previous?.ok && !previous.redirected) await fonts.put(FONT, previous);
  }
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('colorlab-') && key !== CACHE && key !== FONT_CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || event.request.headers.has('Range') || ![...SHELL,...OPTIONAL].includes(url.pathname)) return;
  // Published artwork is refreshed with each shell version, not downloaded on every tab switch.
  if (/\.(?:webp|png|svg)$/.test(url.pathname)||OPTIONAL.includes(url.pathname)) {
    event.respondWith(caches.open(url.pathname === FONT ? FONT_CACHE : CACHE).then(async cache => {
      const stored = await cache.match(event.request);
      if (stored) return stored;
      const response = await fetch(event.request);
      if (response.ok && !response.redirected) await cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(fetch(event.request, { cache: 'no-cache' }).then(async response => {
    if (response.ok && !response.redirected) {
      const copy = response.clone();
      if (!url.pathname.endsWith('.html') && url.pathname !== '/app/' || (await copy.text()).includes('ColorLab')) {
        const cache = await caches.open(CACHE); await cache.put(event.request, response.clone());
      }
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
