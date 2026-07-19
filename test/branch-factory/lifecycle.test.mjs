import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, transitionTask } from '../../scripts/branch-factory/core.mjs';

test('allows canonical happy-path lifecycle transitions', () => {
  const path = ['QUEUED','ASSIGNED','IMPLEMENTING','READY_FOR_TEST','TESTING','READY_FOR_VALIDATION','VALIDATING','PASSED','READY_FOR_MERGE','COMPLETED'];
  for (let i = 0; i < path.length - 1; i++) assert.equal(canTransition(path[i], path[i + 1]), true);
});

test('rejects skipped lifecycle transitions', () => {
  assert.equal(canTransition('QUEUED', 'READY_FOR_MERGE'), false);
  assert.throws(() => transitionTask({ id: 'T', status: 'QUEUED' }, 'READY_FOR_MERGE'), /Invalid lifecycle transition/);
});

test('returns failed work to implementation with evidence', () => {
  const failed = transitionTask({ id: 'T', status: 'TESTING' }, 'TEST_FAILED', { test_result: 'unit failure' });
  assert.equal(failed.evidence.test_result, 'unit failure');
  const returned = transitionTask(failed, 'IMPLEMENTING', { assigned_to: 'implementation-agent' });
  assert.equal(returned.status, 'IMPLEMENTING');
});
