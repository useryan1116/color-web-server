// All requests run against local mock preview; no real mail or user browser data.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const origin = 'http://127.0.0.1:4185';
(async () => {
  const source = fs.readFileSync(path.join(__dirname, '../launcher-site/index.html'), 'utf8');
  const prompts = vm.runInNewContext(source.match(/const prompts = (\[[\s\S]*?\]);/)[1]);
  assert.equal(prompts.length, 120);
  assert.equal(new Set(prompts).size, 120);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
      await page.addInitScript(() => { localStorage.setItem('colorlab-tour-v1', '1'); sessionStorage.setItem('colorlab-about-intro-seen', '1'); });
      await page.goto(origin + '/app/#home');
      for (const hue of [0, 1, 2, 3]) {
        await page.locator(`[data-hue="${hue}"]`).click();
        const dialog = page.locator('dialog[open]');
        await dialog.waitFor();
        const character = dialog.locator('.articulated');
        assert.equal(await character.evaluate(el => getComputedStyle(el).getPropertyValue('--character-delay').trim()), '0s');
        const motion = () => character.evaluate(el => [...el.querySelectorAll('*')].filter(n => getComputedStyle(n).animationName !== 'none').map(n => ({ name: getComputedStyle(n).animationName, play: getComputedStyle(n).animationPlayState, transform: getComputedStyle(n).transform })));
        const before = await motion();
        assert.ok(before.length > 0 && before.every(a => a.play === 'running'), `${hue}: active animation required`);
        await page.waitForTimeout(180);
        assert.notDeepEqual(await motion(), before, `${hue}: must move immediately after opening`);
        await dialog.locator('.dialog-close').click();
      }
      console.log(`PASS ${width}: all four opened-card characters move immediately`);
      for (const route of ['about', 'contact']) {
        await page.goto(origin + '/app/account.html#' + route);
        const form = page.locator('#contact-form');
        await form.waitFor();
        for (const name of ['name', 'email', 'description']) {
          const field = form.locator(`[name="${name}"]`);
          assert.equal(await field.evaluate(el => el.required && el.validity.valueMissing), true);
        }
        await form.locator('[name="name"]').fill('本機驗收');
        await form.locator('[name="email"]').fill('invalid');
        await form.locator('[name="description"]').fill('僅本機測試，不寄信');
        assert.equal(await form.evaluate(el => el.checkValidity()), false);
        await form.locator('[name="email"]').fill('preview@example.com');
        assert.equal(await form.evaluate(el => el.checkValidity()), true);
        await form.locator('button[type="submit"]').click();
        await page.getByText('本機送出流程測試成功：未儲存、未寄出信件。', { exact: true }).waitFor();
        await form.screenshot({ path: `tmp/required-${route}-${width}.png` });
      }
      console.log(`PASS ${width}: about/contact required inputs, invalid Email, mock submission`);
      await page.clock.install();
      await page.goto(origin + '/wake.html?preview=1');
      const text = page.locator('#promptText');
      await page.locator('#pausePrompts').click();
      const seen = new Set([await text.innerText()]);
      for (let i = 1; i < 120; i++) { await page.locator('#nextPrompt').click(); seen.add(await text.innerText()); }
      assert.equal(seen.size, 120, 'one complete deck must have no duplicates');
      const last = await text.innerText();
      await page.reload();
      assert.notEqual(await text.innerText(), last, 'refresh should not repeat last question');
      await page.mouse.move(0, 0);
      const first = await text.innerText();
      await page.clock.fastForward(15000);
      assert.notEqual(await text.innerText(), first, 'slow automatic rotation');
      await page.locator('#pausePrompts').click();
      const paused = await text.innerText();
      await page.mouse.move(0, 0);
      await page.clock.fastForward(30000);
      assert.equal(await text.innerText(), paused, 'pause must hold the current question');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.locator('.prompt-card').screenshot({ path: `tmp/prompts-${width}.png`, animations: 'disabled' });
      console.log(`PASS ${width}: 120 unique prompts, reload, automatic rotation, pause, no overflow`);
      await page.close();
    }
    for (const field of ['name', 'email', 'description']) {
      const response = await fetch(origin + '/api/user/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'QA', email: 'preview@example.com', description: 'Local only', [field]: ' ' }) });
      assert.equal(response.status, 400, `server rejects blank ${field}`);
    }
    console.log('PASS shared server rejects each missing field');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
