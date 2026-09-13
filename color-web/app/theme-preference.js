// Runs in the head so a saved appearance is applied before the page is painted.
(() => {
  const key = 'colorlab-appearance-v1', modes = ['system', 'light', 'dark'];
  const system = matchMedia('(prefers-color-scheme: dark)');
  let mode = 'system';
  try { const saved = localStorage.getItem(key); if (modes.includes(saved)) mode = saved; } catch {}
  function apply() {
    const dark = mode === 'dark' || mode === 'system' && system.matches;
    const sheet = document.querySelector('link[data-system-theme]');
    if (sheet) sheet.media = dark ? 'all' : 'not all';
    document.documentElement.dataset.appearance = mode;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = dark ? '#211f24' : '#fcf8f4'; meta.media = '';
    });
    document.querySelectorAll('[name="colorlab-appearance"]').forEach(input => { input.checked = input.value === mode; });
  }
  document.addEventListener('change', event => {
    const input = event.target;
    if (input.name !== 'colorlab-appearance' || !modes.includes(input.value)) return;
    mode = input.value;
    try { localStorage.setItem(key, mode); } catch { /* Still works for this visit. */ }
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    mode = modes.includes(event.newValue) ? event.newValue : 'system'; apply();
  });
  system.addEventListener('change', apply);
  window.addEventListener('pageshow', apply);
  document.addEventListener('colorlab-theme-sync', apply);
  apply();
})();
