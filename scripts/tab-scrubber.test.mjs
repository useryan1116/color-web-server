import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTabScrubber } from '../color-web/app/tab-scrubber.mjs';

function surface() {
  const handlers = new Map(), values = new Set();
  return {
    addEventListener(type, fn) { const list = handlers.get(type) || []; list.push(fn); handlers.set(type, list); },
    fire(type, overrides = {}) {
      const e = { button: 0, pointerId: 1, isPrimary: true, clientX: 50, clientY: 730, detail: 1,
        preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...overrides };
      for (const fn of handlers.get(type) || []) { fn(e); if (e.stopped) break; } return e;
    },
    classList: { add: (...names) => names.forEach(n => values.add(n)), remove: (...names) => names.forEach(n => values.delete(n)),
      contains: name => values.has(name), toggle(name, on) { if (on) values.add(name); else values.delete(name); } },
  };
}
function setup(desktop = false) {
  const win = surface(), doc = surface(), media = surface(), nav = surface(), clicked = [], vars = {};
  media.matches = !desktop; win.matchMedia = () => media;
  nav.ownerDocument = doc; nav.style = { setProperty: (name, value) => vars[name] = value };
  nav.getBoundingClientRect = () => ({ left: 0, right: 400, top: 700, bottom: 790, width: 400, height: 90 });
  nav.setPointerCapture = id => nav.capture = id;
  nav.hasPointerCapture = id => nav.capture === id;
  nav.releasePointerCapture = id => { nav.capture = null; nav.fire('lostpointercapture', { pointerId: id }); };
  let items = [];
  function render() {
    items.forEach(item => item.isConnected = false);
    items = [0, 1, 2, 3].map(i => ({ ...surface(), isConnected: true,
      getBoundingClientRect: () => ({ left: i * 100 + 10, top: 707, width: 80, height: 58 }),
      closest() { return this; }, click() { const e = nav.fire('click', { detail: 0, target: this }); if (!e.prevented) clicked.push(i); }
    }));
  }
  render(); nav.querySelectorAll = () => items;
  const controller = createTabScrubber(nav, win);
  const down = () => nav.fire('pointerdown', { target: items[0] });
  return { nav, win, doc, media, clicked, vars, controller, down, render, items: () => items };
}
const hold = () => new Promise(resolve => setTimeout(resolve, 195));

test('pointer down previews immediately but navigates only once on release', () => {
  const s = setup(); s.down();
  assert.ok(s.nav.classList.contains('tab-scrubbing'));
  for (const x of [150, 250, 350]) s.nav.fire('pointermove', { clientX: x });
  assert.deepEqual(s.clicked, []); assert.ok(s.items()[3].classList.contains('tab-preview'));
  assert.equal(s.vars['--tab-bubble-x'], '312px');
  s.nav.fire('pointerup', { clientX: 350 });
  assert.deepEqual(s.clicked, [3]); assert.equal(s.nav.capture, null);
  assert.ok(s.nav.fire('click', { detail: 1 }).prevented);
  assert.ok(!s.nav.fire('click', { detail: 0 }).prevented, 'keyboard activation remains available');
});
test('ordinary tap activates once on release and suppresses the native extra click', () => {
  const s = setup(); s.down(); s.nav.fire('pointerup');
  assert.deepEqual(s.clicked, [0]); assert.ok(s.nav.fire('click').prevented);
});
test('immediate drag from empty strip space tracks without a hold delay', () => {
  const s = setup(); s.nav.fire('pointerdown', {target:s.nav,clientX:100});
  assert.ok(s.nav.classList.contains('tab-scrubbing'));
  s.nav.fire('pointermove', { clientX: 150 });
  assert.deepEqual(s.clicked, []);
  s.nav.fire('pointerup', { clientX: 150 });
  assert.ok(!s.nav.classList.contains('tab-scrubbing')); assert.deepEqual(s.clicked, [1]);
  assert.ok(s.nav.fire('click').prevented);
});
test('outside release cancels and does not select the closest endpoint', async () => {
  const s = setup(); s.down(); await hold();
  s.nav.fire('pointermove', { clientX: 450 }); s.nav.fire('pointerup', { clientX: 450 });
  assert.deepEqual(s.clicked, []);
});
for (const reason of ['pointercancel', 'lostpointercapture', 'hidden', 'resize', 'second-pointer', 'rerender']) {
  test(`${reason} cancels an active drag without changing route`, async () => {
    const s = setup(); s.down(); await hold();
    if (reason === 'hidden') { s.doc.hidden = true; s.doc.fire('visibilitychange'); }
    else if (reason === 'resize') { s.media.matches = false; s.win.fire('resize'); }
    else if (reason === 'second-pointer') s.nav.fire('pointerdown', { pointerId: 2, isPrimary: false });
    else if (reason === 'rerender') { s.render(); s.controller.sync(); }
    else s.nav.fire(reason);
    s.nav.fire('pointerup', { clientX: 350 });
    assert.deepEqual(s.clicked, []); assert.ok(!s.nav.classList.contains('tab-scrubbing'));
  });
}
test('desktop never activates, and replacement links can still be scrubbed', async () => {
  const d = setup(true); d.down(); await hold(); assert.ok(!d.nav.classList.contains('tab-scrubbing'));
  const s = setup(); s.render(); s.controller.sync(); s.down(); await hold(); s.nav.fire('pointerup', { clientX: 250 });
  assert.deepEqual(s.clicked, [2]);
});
test('tour adds the first-use entry without resetting the existing shown-once key', () => {
  const source = readFileSync('color-web/app/first-tour.mjs', 'utf8');
  assert.match(source, /const key='colorlab-tour-v1'/);
  assert.match(source, /\['install','第一次來/);
  assert.match(source, /\.first-use-link/);
  assert.match(source, /scrollIntoView\(\{block:'center'/);
});
