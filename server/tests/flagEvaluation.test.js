const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateFlag } = require('../src/utils/flagEvaluation');

test('boolean flags return their enabled state', () => {
  const flag = { type: 'boolean', enabled: true };

  assert.equal(evaluateFlag(flag, { userId: 'user-1' }), true);
  assert.equal(evaluateFlag({ ...flag, enabled: false }, { userId: 'user-2' }), false);
});

test('percentage flags are deterministic for the same user and key', () => {
  const flag = { type: 'percentage', rolloutPercentage: 50 };

  const first = evaluateFlag(flag, { userId: 'tenant-user-1', flagKey: 'checkout' });
  const second = evaluateFlag(flag, { userId: 'tenant-user-1', flagKey: 'checkout' });
  const otherUser = evaluateFlag(flag, { userId: 'tenant-user-2', flagKey: 'checkout' });

  assert.equal(first, second);
  assert.equal(typeof first, 'boolean');
  assert.ok(first === true || first === false);
  assert.ok(otherUser === true || otherUser === false);
});
