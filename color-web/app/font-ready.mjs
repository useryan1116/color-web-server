// Hide only handwriting until it is ready; never hold forms or navigation hostage.
const root = document.documentElement;
const timeout = setTimeout(() => { root.dataset.handwriting = 'fallback'; }, 2500);
document.fonts.load('400 32px ColorLabHandwriting').then(fonts => {
  root.dataset.handwriting = fonts.length ? 'ready' : 'fallback';
}).catch(() => { root.dataset.handwriting = 'fallback'; }).finally(() => clearTimeout(timeout));
