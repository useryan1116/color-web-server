const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('retired traversal and server-render endpoints stay absent', () => {
  const server = read('server.js');
  assert.doesNotMatch(server, /app\.get\('\/main\/:page'/);
  assert.doesNotMatch(server, /\/api\/reports\/page\/|renderReportPage|createCanvas/);
});

test('admin provisioner contains no built-in account or password', () => {
  const source = read('scripts/createAdmin.js');
  assert.match(source, /ADMIN_EMAIL/); assert.match(source, /ADMIN_PASSWORD/);
  assert.doesNotMatch(source, /admin[123]@example\.com|admin123/);
});

test('security status UI and API remain administrator scoped', () => {
  const route = read('routes/admin.js');
  const ui = fs.readFileSync(path.join(__dirname, '../../color-web/app/account.mjs'), 'utf8');
  const status = require('../data/securityStatus');
  assert.match(route, /router\.get\('\/security-status', adminProtect/);
  assert.match(ui, /current === 'security'.*adminAPI\('\/api\/admin\/security-status'/);
  assert.equal(status.detection.status, 'unknown');
});
