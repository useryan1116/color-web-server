// Navigation stays owned by the existing links. Dragging only previews a choice.
export function createTabScrubber(nav, win = window) {
  if (!nav) return { sync() {} };
  const doc = nav.ownerDocument, mobile = win.matchMedia('(max-width: 767px)');
  let gesture = null, suppressUntil = 0, dispatching = false;
  const links = () => [...nav.querySelectorAll('a[href]')];
  const enabled = () => mobile.matches && nav.getBoundingClientRect().height > 0;
  function preview(x, y) {
    const r = nav.getBoundingClientRect();
    const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    const items = links(), selected = inside ? items.reduce((best, item) => {
      const b = item.getBoundingClientRect(), distance = Math.abs(x - b.left - b.width / 2);
      return !best || distance < best.distance ? { item, distance } : best;
    }, null)?.item : null;
    items.forEach(item => item.classList.toggle('tab-preview', item === selected));
    nav.classList.toggle('tab-outside', !selected);
    if (selected) {
      const b = selected.getBoundingClientRect(), width = Math.min(86, b.width - 4);
      nav.style.setProperty('--tab-bubble-x', `${Math.max(4, Math.min(r.width - width - 4, x - r.left - width / 2))}px`);
      nav.style.setProperty('--tab-bubble-y', `${b.top - r.top - 2}px`);
      nav.style.setProperty('--tab-bubble-width', `${width}px`);
      nav.style.setProperty('--tab-bubble-height', `${b.height + 4}px`);
    }
    return selected;
  }
  function reset(blockClick = false) {
    const previous = gesture; gesture = null;
    if (blockClick) suppressUntil = Date.now() + 700;
    nav.classList.remove('tab-scrubbing', 'tab-outside');
    links().forEach(item => item.classList.remove('tab-preview'));
    if (previous && nav.hasPointerCapture?.(previous.id)) nav.releasePointerCapture(previous.id);
  }
  function sync() { reset(Boolean(gesture)); nav.classList.toggle('tab-scrubber', enabled()); }
  nav.addEventListener('pointerdown', event => {
    if (!enabled() || event.button !== 0) return;
    if (gesture || event.isPrimary === false) { reset(true); return; }
    if (!links().length) return;
    suppressUntil = 0;
    gesture = { id: event.pointerId };
    nav.setPointerCapture?.(gesture.id);
    nav.classList.add('tab-scrubbing');
    gesture.selected = preview(event.clientX, event.clientY);
  });
  nav.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    // No easing on the moving bubble: its position tracks the current finger sample.
    event.preventDefault();
    gesture.selected = preview(event.clientX, event.clientY);
  });
  nav.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const selected = preview(event.clientX, event.clientY);
    reset(true);
    event.preventDefault();
    if (selected?.isConnected) {
      dispatching = true;
      try { selected.click(); } finally { dispatching = false; }
    }
  });
  nav.addEventListener('click', event => {
    if (!dispatching && event.detail !== 0 && Date.now() < suppressUntil) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  nav.addEventListener('contextmenu', event => { if (gesture) event.preventDefault(); });
  for (const type of ['pointercancel', 'lostpointercapture']) nav.addEventListener(type, event => {
    if (gesture?.id === event.pointerId) reset(true);
  });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) reset(Boolean(gesture)); });
  win.addEventListener('pagehide', () => reset(Boolean(gesture)));
  win.addEventListener('resize', sync);
  mobile.addEventListener('change', sync);
  sync();
  return { sync };
}
