import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFactory, nextTask } from '../../scripts/branch-factory/core.mjs';

test('branch factory configuration validates', () => {
  const result = validateFactory();
  assert.deepEqual(result, { ok: true, errors: [] });
});

test('skips completed work and selects the next eligible Sprint 1 task', () => {
  const task = nextTask();
  assert.equal(task.id, 'SPRINT1-TASK-002');
  assert.equal(task.status, 'QUEUED');
});
