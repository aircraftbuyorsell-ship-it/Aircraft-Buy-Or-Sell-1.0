import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canTransition,
  assertTransition,
  evaluateSkillGate,
  checkSkillPermission,
  requiresApproval,
  isApprovalUsable,
  checkDelegation,
  retryAllowed,
  normalizeSkillResult,
  validateEvidence,
  TERMINAL_STATES,
} from '../base44/functions/_shared/workflowGovernance.mjs';

/* -------------------------------------------------- state machine */

test('state machine allows the documented happy path', () => {
  const path = ['CREATED', 'PLANNED', 'ASSIGNED', 'RUNNING', 'EXECUTING', 'VERIFYING', 'COMPLETED'];
  for (let i = 0; i < path.length - 1; i += 1) {
    assert.equal(canTransition(path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
  }
});

test('state machine refuses to skip verification', () => {
  assert.equal(canTransition('RUNNING', 'COMPLETED'), false);
  assert.equal(canTransition('CREATED', 'COMPLETED'), false);
  assert.throws(() => assertTransition('RUNNING', 'COMPLETED'), /Illegal workflow transition/);
});

test('any live state can fail, block, escalate or cancel', () => {
  for (const target of ['FAILED', 'BLOCKED', 'ESCALATED', 'CANCELLED']) {
    assert.equal(canTransition('EXECUTING', target), true, target);
  }
});

test('completed and cancelled runs are terminal; failed runs may be retried', () => {
  for (const state of TERMINAL_STATES) {
    if (state === 'FAILED') continue;
    assert.equal(canTransition(state, 'RUNNING'), false, state);
  }
  assert.equal(canTransition('FAILED', 'RUNNING'), true);
});

/* -------------------------------------------------- mandatory skill gate */

const REQUIRED = ['abos.skill.identity.v1', 'abos.skill.market.v1', 'abos.skill.valuation.v1'];

test('gate blocks completion while a mandatory skill is unexecuted', () => {
  const gate = evaluateSkillGate({
    requiredSkills: REQUIRED,
    skillResults: [
      { skill_id: 'abos.skill.identity.v1', status: 'success' },
      { skill_id: 'abos.skill.market.v1', status: 'success' },
    ],
  });
  assert.equal(gate.satisfied, false);
  assert.deepEqual(gate.missing, ['abos.skill.valuation.v1']);
});

test('gate blocks completion on a failed mandatory skill', () => {
  const gate = evaluateSkillGate({
    requiredSkills: ['abos.skill.market.v1'],
    skillResults: [{ skill_id: 'abos.skill.market.v1', status: 'failed' }],
  });
  assert.equal(gate.satisfied, false);
  assert.deepEqual(gate.failed, ['abos.skill.market.v1']);
});

test('NOT_APPLICABLE satisfies the gate only with a stated reason', () => {
  const bare = evaluateSkillGate({
    requiredSkills: ['abos.skill.market.v1'],
    skillResults: [{ skill_id: 'abos.skill.market.v1', status: 'not_applicable' }],
  });
  assert.equal(bare.satisfied, false);
  assert.deepEqual(bare.invalid, ['abos.skill.market.v1']);

  const reasoned = evaluateSkillGate({
    requiredSkills: ['abos.skill.market.v1'],
    skillResults: [{
      skill_id: 'abos.skill.market.v1',
      status: 'not_applicable',
      not_applicable_reason: 'Experimental type certificate: no comparable market exists.',
    }],
  });
  assert.equal(reasoned.satisfied, true);
  assert.deepEqual(reasoned.notApplicable, ['abos.skill.market.v1']);
});

test('an override without an approval record does not satisfy the gate', () => {
  const forged = evaluateSkillGate({
    requiredSkills: ['abos.skill.valuation.v1'],
    skillResults: [{ skill_id: 'abos.skill.valuation.v1', status: 'overridden' }],
  });
  assert.equal(forged.satisfied, false);
  assert.deepEqual(forged.invalid, ['abos.skill.valuation.v1']);

  const approved = evaluateSkillGate({
    requiredSkills: ['abos.skill.valuation.v1'],
    skillResults: [{
      skill_id: 'abos.skill.valuation.v1',
      status: 'overridden',
      override_approval_id: 'appr_123',
    }],
  });
  assert.equal(approved.satisfied, true);
  assert.deepEqual(approved.overridden, ['abos.skill.valuation.v1']);
});

test('the latest attempt of a skill decides its gate status', () => {
  const gate = evaluateSkillGate({
    requiredSkills: ['abos.skill.market.v1'],
    skillResults: [
      { skill_id: 'abos.skill.market.v1', status: 'failed' },
      { skill_id: 'abos.skill.market.v1', status: 'success' },
    ],
  });
  assert.equal(gate.satisfied, true);
});

test('a run below the workflow minimum confidence cannot complete', () => {
  const gate = evaluateSkillGate({
    requiredSkills: ['abos.skill.market.v1'],
    skillResults: [{ skill_id: 'abos.skill.market.v1', status: 'success' }],
    confidence: 0.4,
    minConfidence: 0.7,
  });
  assert.equal(gate.satisfied, false);
  assert.match(gate.reasons.join(' '), /below the required/);
});

test('a workflow with no mandatory skills still completes cleanly', () => {
  const gate = evaluateSkillGate({ requiredSkills: [], skillResults: [] });
  assert.equal(gate.satisfied, true);
  assert.deepEqual(gate.reasons, []);
});

/* -------------------------------------------------- permissions */

const AGENT = {
  agent_key: 'valuation_worker',
  status: 'ACTIVE',
  allowed_skills: ['abos.skill.valuation.v1'],
};
const SKILL = { skill_id: 'abos.skill.valuation.v1', status: 'ACTIVE', enabled: true };
const WORKFLOW = {
  workflow_key: 'abos.workflow.aircraft_assess.v1',
  owner_agent_key: 'data_intelligence_lead',
  orchestrator_key: 'aircraft_intelligence_orchestrator',
  required_skills: ['abos.skill.valuation.v1'],
  allowed_agents: ['valuation_worker'],
};

test('a permitted agent may run a declared skill', () => {
  assert.deepEqual(
    checkSkillPermission({ agent: AGENT, skill: SKILL, workflow: WORKFLOW }),
    { allowed: true, reason: null },
  );
});

test('an agent cannot run a skill outside its grant', () => {
  const result = checkSkillPermission({
    agent: { ...AGENT, allowed_skills: ['abos.skill.opex.v1'] },
    skill: SKILL,
    workflow: WORKFLOW,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'skill_not_permitted_for_agent');
});

test('a skill not declared by the workflow cannot be run inside it', () => {
  const result = checkSkillPermission({
    agent: AGENT,
    skill: SKILL,
    workflow: { ...WORKFLOW, required_skills: [], optional_skills: [] },
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'skill_not_declared_in_workflow');
});

test('a disabled agent or skill is refused', () => {
  assert.equal(checkSkillPermission({ agent: { ...AGENT, status: 'DISABLED' }, skill: SKILL, workflow: WORKFLOW }).allowed, false);
  assert.equal(checkSkillPermission({ agent: AGENT, skill: { ...SKILL, enabled: false }, workflow: WORKFLOW }).allowed, false);
});

test('an agent outside allowed_agents is refused even when it holds the skill', () => {
  const result = checkSkillPermission({
    agent: { ...AGENT, agent_key: 'seo_worker' },
    skill: SKILL,
    workflow: WORKFLOW,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'agent_not_permitted_in_workflow');
});

/* -------------------------------------------------- approvals */

test('policy categories always require approval', () => {
  assert.equal(requiresApproval({ actionCategory: 'stripe_product_change' }), true);
  assert.equal(requiresApproval({ actionCategory: 'mandatory_skill_override' }), true);
  assert.equal(requiresApproval({ actionCategory: 'other' }), false);
});

test('an approval is usable only when a human approved it and it has not expired', () => {
  const now = new Date('2026-01-10T00:00:00Z');
  assert.equal(isApprovalUsable({ status: 'approved', decided_by: 'owner@example.com' }, { now }), true);
  assert.equal(isApprovalUsable({ status: 'pending', decided_by: null }, { now }), false);
  assert.equal(isApprovalUsable({ status: 'approved' }, { now }), false);
  assert.equal(isApprovalUsable({
    status: 'approved',
    decided_by: 'owner@example.com',
    expires_at: '2026-01-09T00:00:00Z',
  }, { now }), false);
});

/* -------------------------------------------------- loop protection */

test('delegation refuses to revisit an agent', () => {
  const result = checkDelegation({ path: ['abos_director', 'data_intelligence_lead'], nextAgentKey: 'abos_director' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'circular_delegation');
});

test('delegation depth is capped', () => {
  const result = checkDelegation({ path: ['a', 'b', 'c', 'd'], nextAgentKey: 'e', maxDepth: 4 });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'max_delegation_depth_exceeded');
});

test('a legal delegation returns the extended path', () => {
  const result = checkDelegation({ path: ['abos_director'], nextAgentKey: 'operations_lead', maxDepth: 4 });
  assert.equal(result.allowed, true);
  assert.deepEqual(result.path, ['abos_director', 'operations_lead']);
});

test('retries stop at the limit and never retry an authorization failure', () => {
  assert.equal(retryAllowed({ attempt: 3, maxAttempts: 2 }).allowed, false);
  assert.equal(retryAllowed({ attempt: 1, maxAttempts: 2, error: 'skill_not_permitted_for_agent' }).allowed, false);
  assert.equal(retryAllowed({ attempt: 1, maxAttempts: 2, error: 'provider timeout' }).allowed, true);
});

/* -------------------------------------------------- execution contract */

test('an unrecognized worker response is a failure, not a success', () => {
  const result = normalizeSkillResult('the aircraft looks fine');
  assert.equal(result.status, 'failed');
  assert.equal(result.errors.length, 1);
});

test('a legacy ok:true response maps onto the contract', () => {
  const result = normalizeSkillResult(
    { ok: true, result: { opex_annual_usd: 41200 }, sources: [{ name: 'ABOS OPEX model' }], confidence: 0.82 },
    { agent: 'opex_worker', skill: 'abos.skill.opex.v1', workflow_id: 'run_1' },
  );
  assert.equal(result.status, 'success');
  assert.equal(result.outputs.opex_annual_usd, 41200);
  assert.equal(result.confidence, 0.82);
  assert.equal(result.agent, 'opex_worker');
  assert.deepEqual(result.conflicts, []);
});

test('confidence is clamped to the unit interval', () => {
  assert.equal(normalizeSkillResult({ ok: true, confidence: 4 }).confidence, 1);
  assert.equal(normalizeSkillResult({ ok: true, confidence: -2 }).confidence, 0);
});

test('a skill requiring evidence cannot succeed without any', () => {
  const skill = { evidence_required: true };
  const empty = normalizeSkillResult({ ok: true, outputs: { verdict: 'GO' } });
  assert.deepEqual(validateEvidence(empty, skill), { valid: false, reason: 'evidence_required_but_absent' });

  const supported = normalizeSkillResult({
    ok: true,
    outputs: { verdict: 'GO' },
    evidence: [{ claim: 'total_time', value: 3842.6, source: 'FAA registry', status: 'VERIFIED' }],
  });
  assert.equal(validateEvidence(supported, skill).valid, true);
});

test('an unknown evidence state is rejected', () => {
  const result = normalizeSkillResult({ ok: true, evidence: [{ claim: 'damage', status: 'CLEAN' }] });
  const check = validateEvidence(result, { evidence_required: true });
  assert.equal(check.valid, false);
  assert.match(check.reason, /unknown_evidence_state/);
});

test('NOT_APPLICABLE is carried through with its reason', () => {
  const result = normalizeSkillResult({
    status: 'not_applicable',
    not_applicable_reason: 'Aircraft has no turbine engine; engine overhaul reserve does not apply.',
  });
  assert.equal(result.status, 'not_applicable');
  assert.match(result.not_applicable_reason, /no turbine engine/);
  assert.equal(validateEvidence(result, { evidence_required: true }).valid, true);
});
