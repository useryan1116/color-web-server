const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getJwtSecret } = require('../config/jwtSecret');

test('production JWT secret fails closed when missing or short', () => {
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production' }), /at least 32 bytes/);
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'too-short' }), /at least 32 bytes/);
  assert.equal(getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) }), 'x'.repeat(32));
});
