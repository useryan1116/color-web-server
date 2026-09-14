(() => {
  const nativeMatchMedia = window.matchMedia.bind(window);
  const allowMotion = query => String(query)
    .replace(/\(prefers-reduced-motion\s*:\s*reduce\)/gi, '(max-width:0px)')
    .replace(/\(prefers-reduced-motion\s*:\s*no-preference\)/gi, '(min-width:0px)');
  window.matchMedia = query => nativeMatchMedia(allowMotion(query));

  const rewriteRules = rules => {
    for (const rule of rules) {
      if (rule.media?.mediaText) rule.media.mediaText = allowMotion(rule.media.mediaText);
      if (rule.cssRules) rewriteRules(rule.cssRules);
    }
  };
  const rewriteSheet = sheet => { try { rewriteRules(sheet.cssRules); } catch {} };
  const rewriteNode = node => {
    if (!(node instanceof Element)) return;
    const sheets = node.matches('link[rel="stylesheet"],style') ? [node] : [...node.querySelectorAll('link[rel="stylesheet"],style')];
    sheets.forEach(element => element.sheet ? rewriteSheet(element.sheet) : element.addEventListener('load', () => rewriteSheet(element.sheet), { once: true }));
  };
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(rewriteNode)))
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => [...document.styleSheets].forEach(rewriteSheet), { once: true });
})();
