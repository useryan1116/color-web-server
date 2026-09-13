const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('scripts/static-service-worker.js', 'utf8');
const font = '/assets/fonts/ChenYuluoyan-v2.woff2';
function setup(initial = {}) {
  const stores = new Map(Object.entries(initial).map(([name, entries]) => [name, new Map(entries)]));
  const handlers = {}; let downloads = 0;
  const key = request => new URL(typeof request === 'string' ? request : request.url, 'https://example.test').href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return { match: async request => data.get(key(request)), put: async (request, response) => data.set(key(request), response) };
    },
    async match(request) { for (const data of stores.values()) if (data.has(key(request))) return data.get(key(request)); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };
  vm.runInNewContext(source, { URL, caches, self: { location: { origin: 'https://example.test' }, clients: { claim: async () => {} }, addEventListener: (name, handler) => handlers[name] = handler }, fetch: async () => { downloads++; return new Response('font'); } });
  return {
    stores, get downloads() { return downloads; },
    async activate() { let pending; handlers.activate({ waitUntil: promise => pending = promise }); await pending; },
    async request(path = font, headers = {}) { let pending; handlers.fetch({ request: new Request('https://example.test' + path, { headers }), respondWith: promise => pending = promise }); return pending; }
  };
}
test('activation migrates downloaded font before deleting the old shell cache', async () => {
  const response = new Response('saved font');
  const sw = setup({ 'colorlab-static-shell-v31': [['https://example.test' + font, response]], unrelated: [] });
  await sw.activate();
  assert.equal(await sw.request(), response);
  assert.equal(sw.downloads, 0);
  assert.equal(sw.stores.has('colorlab-static-shell-v31'), false);
  assert.equal(sw.stores.has('unrelated'), true);
});
test('downloaded font survives subsequent activation and is served without network', async () => {
  const sw = setup(); await sw.activate();
  await sw.request(); assert.equal(sw.downloads, 1);
  await sw.activate(); await sw.request();
  assert.equal(sw.downloads, 1);
  assert.equal(sw.stores.has('colorlab-fonts-v2'), true);
});
test('font caching does not intercept private APIs or partial requests', async () => {
  const sw = setup();
  assert.equal(await sw.request('/api/records'), undefined);
  assert.equal(await sw.request(font, { Range: 'bytes=0-10' }), undefined);
  assert.equal(sw.downloads, 0);
});
