import test from 'node:test';
import assert from 'node:assert/strict';
import { ABOS_ST_ELMO } from '../src/lib/model/stElmo.js';
import { ST_ELMO_MODEL } from '../src/lib/model/provider/nemotron/config.js';
import { buildStElmoRequest, isStElmoResponse } from '../src/lib/model/provider/nemotron/adapter.js';

test('St. Elmo M_1.0 keeps a stable model identity above the provider', () => {
  assert.equal(ABOS_ST_ELMO.id, 'abos-st-elmo');
  assert.equal(ABOS_ST_ELMO.version, 'M_1.0');
  assert.equal(ABOS_ST_ELMO.reasoning_backend, ST_ELMO_MODEL.model);
  assert.equal(ABOS_ST_ELMO.architecture, 'model-agnostic');
});

test('Nemotron adapter carries the reasoning parser without exposing credentials', () => {
  const request = buildStElmoRequest({ messages: [{ role: 'user', content: 'Assess N123AB' }] });
  assert.equal(request.identity, 'ABOS St. Elmo');
  assert.equal(request.version, 'M_1.0');
  assert.equal(request.reasoning_parser, 'super_v3');
  assert.equal('apiKey' in request, false);
});

test('St. Elmo response identity is provider-independent', () => {
  assert.equal(isStElmoResponse({ identity: 'ABOS St. Elmo', version: 'M_1.0' }), true);
  assert.equal(isStElmoResponse({ identity: 'Nemotron', version: 'M_1.0' }), false);
});
