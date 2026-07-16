import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFactory, nextTask } from '../../scripts/branch-factory/core.mjs';

test('branch factory configuration validates', () => {
  const result = validateFactory();
  assert.deepEqual(result, { ok: true, errors: [] });
});

test('selects next eligible Sprint 1 task from repository evidence queue', () => {
  const task = nextTask();
  assert.equal(task.id, 'SPRINT1-TASK-001');
  assert.equal(task.status, 'QUEUED');
});
