// Isolated local preview only; does not touch the user's browser or saved data.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
      await page.addInitScript(() => localStorage.setItem('colorlab-tour-v1', '1'));
      await page.goto('http://127.0.0.1:4185/app/#home');
      const stage = page.locator('.mood-welcome');
      const centerStage = () => stage.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - (innerHeight-el.offsetHeight)/2, behavior: 'instant' }));
      await stage.waitFor({ state: 'attached' });
      assert.deepEqual(await stage.locator('img').evaluateAll(images=>images.map(img=>getComputedStyle(img).animationDuration)),Array(4).fill('2.2s'));
      assert.deepEqual(await stage.locator('img').evaluateAll(images=>images.map(img=>getComputedStyle(img).animationDelay)),['0s','0.15s','0.3s','0.45s']);
      await page.evaluate(() => document.fonts.ready);
      await stage.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight + 100, behavior: 'instant' }));
      await page.waitForTimeout(1200);
      assert.equal(await stage.evaluate(el => el.hasAttribute('data-entered')), false, `${width}: entrance must not finish before stage is visible`);
      await centerStage();
      await page.waitForFunction(() => document.querySelector('.mood-welcome').hasAttribute('data-entered'));
      await stage.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished)));
      assert.equal(await stage.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth && getComputedStyle(img).opacity === '1')), true);
      await page.locator('.mood-panel').screenshot({ path: `tmp/mood-entry-${width}.png` });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await centerStage();
      assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).every(a => a.playState === 'finished')), true, 'scrolling back must not replay');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.reload();
      await stage.waitFor({ state: 'attached' });
      assert.equal(await stage.evaluate(el => el.hasAttribute('data-entered')), false, 'refresh resets entrance');
      await centerStage();
      await page.waitForFunction(() => document.querySelector('.mood-welcome').hasAttribute('data-entered'));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).length), 0);
      console.log(`PASS ${width}: visible stage only, once per load, refresh replay, reduced motion`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
