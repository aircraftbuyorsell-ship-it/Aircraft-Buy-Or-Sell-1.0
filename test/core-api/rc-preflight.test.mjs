import test from 'node:test';
import assert from 'node:assert/strict';
import { runPreflight } from '../../scripts/core-api/rc-preflight.mjs';

test('Core API RC preflight keeps the runtime and Pages boundaries explicit', () => {
  const result = runPreflight();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.checked.pages_static_deployment, true);
  assert.equal(result.checked.worker_runtime, 'separate boundary');
  assert.deepEqual(result.checked.endpoints, [
    'search',
    'valuate',
    'intelligence.extract',
    'listings.get',
    'listings.list',
    'listings.create',
    'keys.create',
    'keys.list',
    'keys.revoke',
  ]);
});
