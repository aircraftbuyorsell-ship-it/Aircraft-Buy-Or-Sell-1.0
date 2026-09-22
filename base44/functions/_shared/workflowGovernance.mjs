/**
 * ABOS Workflow Governance — pure, dependency-free rules for the AI organization.
 *
 * This module holds the logic that decides what an agent is allowed to do and when a
 * workflow run may be considered finished. It is deliberately free of I/O so it can be
 * unit tested (test/abos-workflow-governance.test.mjs) and imported by Deno backend
 * functions alike.
 *
 * Two principles are encoded here and must not be relaxed:
 *   1. A run cannot reach COMPLETED while a mandatory skill is unaccounted for.
 *   2. Missing data is never silently converted into a negative or a zero.
 */

export const WORKFLOW_STATES = Object.freeze([
  'CREATED', 'PLANNED', 'ASSIGNED', 'RUNNING', 'WAITING', 'REVIEW',
  'APPROVAL_REQUIRED', 'EXECUTING', 'VERIFYING', 'COMPLETED',
  'FAILED', 'BLOCKED', 'ESCALATED', 'CANCELLED',
]);

export const TERMINAL_STATES = Object.freeze(['COMPLETED', 'FAILED', 'CANCELLED']);
export const FAILURE_STATES = Object.freeze(['FAILED', 'BLOCKED', 'ESCALATED', 'CANCELLED']);

/** Allowed forward transitions. Any live state may fail, block, escalate or be cancelled. */
const TRANSITIONS = Object.freeze({
  CREATED: ['PLANNED', 'ASSIGNED', 'CANCELLED'],
  PLANNED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['RUNNING', 'WAITING', 'CANCELLED'],
  RUNNING: ['WAITING', 'REVIEW', 'APPROVAL_REQUIRED', 'EXECUTING', 'VERIFYING'],
  WAITING: ['RUNNING', 'REVIEW', 'ESCALATED'],
  REVIEW: ['RUNNING', 'APPROVAL_REQUIRED', 'EXECUTING', 'VERIFYING', 'ESCALATED'],
  APPROVAL_REQUIRED: ['EXECUTING', 'REVIEW', 'BLOCKED', 'ESCALATED'],
  EXECUTING: ['VERIFYING', 'WAITING', 'REVIEW'],
  VERIFYING: ['COMPLETED', 'REVIEW', 'RUNNING'],
  COMPLETED: [],
  FAILED: ['RUNNING'],
  BLOCKED: ['RUNNING', 'APPROVAL_REQUIRED', 'ESCALATED'],
  ESCALATED: ['RUNNING', 'BLOCKED', 'CANCELLED'],
  CANCELLED: [],
});

/** Reachable from anywhere that is not already terminal. */
const ALWAYS_REACHABLE = Object.freeze(['FAILED', 'BLOCKED', 'ESCALATED', 'CANCELLED']);

export function isValidState(state) {
  return WORKFLOW_STATES.includes(state);
}

export function canTransition(from, to) {
  if (!isValidState(from) || !isValidState(to)) return false;
  if (from === to) return false;
  if (TERMINAL_STATES.includes(from)) return TRANSITIONS[from].includes(to);
  if (ALWAYS_REACHABLE.includes(to)) return true;
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal workflow transition ${from} -> ${to}`);
  }
  return to;
}

/* ------------------------------------------------------------------ */
/* Skill gate                                                          */
/* ------------------------------------------------------------------ */

/** A mandatory skill is satisfied by exactly one of these three outcomes. */
export const SATISFYING_STATUSES = Object.freeze(['success', 'not_applicable', 'overridden']);

/**
 * Evaluate whether a run may leave VERIFYING for COMPLETED.
 *
 * @param {object} input
 * @param {string[]} input.requiredSkills  snapshot taken at run start
 * @param {Array<{skill_id:string,status:string,override_approval_id?:string,not_applicable_reason?:string}>} input.skillResults
 * @param {number} [input.confidence]
 * @param {number} [input.minConfidence]
 */
export function evaluateSkillGate({ requiredSkills = [], skillResults = [], confidence, minConfidence } = {}) {
  const latest = new Map();
  for (const result of skillResults) {
    if (!result || !result.skill_id) continue;
    latest.set(result.skill_id, result);
  }

  const missing = [];
  const failed = [];
  const invalid = [];
  const overridden = [];
  const notApplicable = [];
  const reasons = [];

  for (const skillId of requiredSkills) {
    const result = latest.get(skillId);
    if (!result) {
      missing.push(skillId);
      reasons.push(`Mandatory skill ${skillId} has not been executed.`);
      continue;
    }
    if (!SATISFYING_STATUSES.includes(result.status)) {
      failed.push(skillId);
      reasons.push(`Mandatory skill ${skillId} ended as ${result.status}.`);
      continue;
    }
    if (result.status === 'overridden') {
      if (!result.override_approval_id) {
        invalid.push(skillId);
        reasons.push(`Mandatory skill ${skillId} is marked overridden without an approved override.`);
        continue;
      }
      overridden.push(skillId);
      continue;
    }
    if (result.status === 'not_applicable') {
      if (!result.not_applicable_reason || String(result.not_applicable_reason).trim().length < 8) {
        invalid.push(skillId);
        reasons.push(`Mandatory skill ${skillId} claims NOT_APPLICABLE without a stated reason.`);
        continue;
      }
      notApplicable.push(skillId);
    }
  }

  let satisfied = missing.length === 0 && failed.length === 0 && invalid.length === 0;

  if (satisfied && typeof minConfidence === 'number') {
    if (typeof confidence !== 'number') {
      satisfied = false;
      reasons.push(`Workflow declares a minimum confidence of ${minConfidence} but the run reports none.`);
    } else if (confidence < minConfidence) {
      satisfied = false;
      reasons.push(`Run confidence ${confidence} is below the required ${minConfidence}; send to REVIEW.`);
    }
  }

  return { satisfied, missing, failed, invalid, overridden, notApplicable, reasons };
}

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

/**
 * Least privilege check for an agent about to run a skill inside a workflow.
 * Returns { allowed, reason } — reason is always present when denied.
 */
export function checkSkillPermission({ agent, skill, workflow } = {}) {
  if (!agent) return { allowed: false, reason: 'unknown_agent' };
  if (agent.status && agent.status !== 'ACTIVE') {
    return { allowed: false, reason: `agent_not_active:${agent.status}` };
  }
  if (!skill) return { allowed: false, reason: 'unknown_skill' };
  if (skill.enabled === false) return { allowed: false, reason: 'skill_disabled' };
  if (skill.status && skill.status !== 'ACTIVE' && skill.status !== 'EXPERIMENTAL') {
    return { allowed: false, reason: `skill_not_active:${skill.status}` };
  }

  const allowedSkills = Array.isArray(agent.allowed_skills) ? agent.allowed_skills : [];
  if (!allowedSkills.includes(skill.skill_id) && !allowedSkills.includes('*')) {
    return { allowed: false, reason: 'skill_not_permitted_for_agent' };
  }

  if (workflow) {
    const inWorkflow = (workflow.required_skills || []).includes(skill.skill_id)
      || (workflow.optional_skills || []).includes(skill.skill_id);
    if (!inWorkflow) {
      return { allowed: false, reason: 'skill_not_declared_in_workflow' };
    }
    const allowedAgents = Array.isArray(workflow.allowed_agents) ? workflow.allowed_agents : [];
    const isPrincipal = agent.agent_key === workflow.owner_agent_key
      || agent.agent_key === workflow.orchestrator_key;
    if (allowedAgents.length > 0 && !allowedAgents.includes(agent.agent_key) && !isPrincipal) {
      return { allowed: false, reason: 'agent_not_permitted_in_workflow' };
    }
    if (allowedAgents.length === 0 && !isPrincipal) {
      return { allowed: false, reason: 'agent_not_permitted_in_workflow' };
    }
  }

  return { allowed: true, reason: null };
}

/* ------------------------------------------------------------------ */
/* Approvals                                                           */
/* ------------------------------------------------------------------ */

/** Action categories that always require a human decision, per ABOS approval policy. */
export const APPROVAL_REQUIRED_CATEGORIES = Object.freeze([
  'production_destructive_change',
  'production_data_delete',
  'security_permission_change',
  'billing_price_change',
  'stripe_product_change',
  'refund_above_threshold',
  'critical_deployment',
  'provider_credential_change',
  'policy_or_compliance_change',
  'publish_customer_information',
  'disable_security_control',
  'public_pricing_change',
  'irreversible_migration',
  'mandatory_skill_override',
]);

export function requiresApproval({ actionCategory, agent, skill, workflow } = {}) {
  if (APPROVAL_REQUIRED_CATEGORIES.includes(actionCategory)) return true;
  if (agent?.approval_required) return true;
  if (skill?.approval_required) return true;
  if (workflow?.approval_required) return true;
  if (Array.isArray(workflow?.approval_actions) && workflow.approval_actions.includes(actionCategory)) return true;
  return false;
}

export function isApprovalUsable(approval, { now = new Date() } = {}) {
  if (!approval) return false;
  if (approval.status !== 'approved') return false;
  if (!approval.decided_by) return false;
  if (approval.expires_at && new Date(approval.expires_at) < now) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Loop protection                                                     */
/* ------------------------------------------------------------------ */

/**
 * Circular delegation detection. A chain may not revisit an agent, and may not
 * grow past the configured depth.
 */
export function checkDelegation({ path = [], nextAgentKey, maxDepth = 4 } = {}) {
  if (!nextAgentKey) return { allowed: false, reason: 'missing_recipient' };
  if (path.includes(nextAgentKey)) {
    return { allowed: false, reason: 'circular_delegation', cycleAt: nextAgentKey };
  }
  if (path.length + 1 > maxDepth) {
    return { allowed: false, reason: 'max_delegation_depth_exceeded', depth: path.length + 1 };
  }
  return { allowed: true, reason: null, path: [...path, nextAgentKey] };
}

export function retryAllowed({ attempt = 1, maxAttempts = 2, error } = {}) {
  if (attempt > maxAttempts) return { allowed: false, reason: 'max_retries_exhausted' };
  const nonRetryable = ['unauthorized', 'payment_required', 'skill_not_permitted_for_agent', 'circular_delegation'];
  if (error && nonRetryable.some((code) => String(error).includes(code))) {
    return { allowed: false, reason: 'non_retryable_error' };
  }
  return { allowed: true, reason: null };
}

/* ------------------------------------------------------------------ */
/* Execution contract                                                  */
/* ------------------------------------------------------------------ */

const EVIDENCE_STATES = Object.freeze([
  'VERIFIED', 'SUPPORTED', 'UNVERIFIED', 'CONFLICTING', 'UNAVAILABLE', 'NOT_APPLICABLE',
]);

export function isEvidenceState(state) {
  return EVIDENCE_STATES.includes(state);
}

/**
 * Normalize any worker or skill response into the ABOS execution contract.
 * Unknown shapes never become success: an absent status is treated as a failure
 * rather than assumed good.
 */
export function normalizeSkillResult(raw, context = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const ok = source.ok === true || source.status === 'success';
  const notApplicable = source.status === 'not_applicable' || source.not_applicable === true;

  let status = 'failed';
  if (notApplicable) status = 'not_applicable';
  else if (ok) status = 'success';

  const errors = toArray(source.errors);
  if (status === 'failed' && errors.length === 0) {
    errors.push(source.error || source.message || 'Skill returned no recognizable success state.');
  }

  return {
    status,
    agent: context.agent ?? source.agent ?? null,
    skill: context.skill ?? source.skill ?? source.skill_id ?? null,
    workflow_id: context.workflow_id ?? source.workflow_id ?? null,
    inputs: source.inputs ?? context.inputs ?? {},
    outputs: source.outputs ?? source.result ?? source.data ?? {},
    evidence: toArray(source.evidence),
    sources: toArray(source.sources),
    confidence: typeof source.confidence === 'number' ? clamp01(source.confidence) : null,
    conflicts: toArray(source.conflicts),
    warnings: toArray(source.warnings),
    errors,
    not_applicable_reason: notApplicable ? (source.not_applicable_reason || source.reason || null) : null,
    next_action: source.next_action ?? null,
  };
}

/**
 * A skill declared evidence_required only counts as executed when it actually
 * produced evidence. Returning a confident answer with nothing behind it is a failure.
 */
export function validateEvidence(result, skill) {
  if (!skill?.evidence_required) return { valid: true, reason: null };
  if (result.status === 'not_applicable') return { valid: true, reason: null };
  if (result.status !== 'success') return { valid: true, reason: null };
  if (!Array.isArray(result.evidence) || result.evidence.length === 0) {
    return { valid: false, reason: 'evidence_required_but_absent' };
  }
  const badState = result.evidence.find((item) => item?.status && !isEvidenceState(item.status));
  if (badState) return { valid: false, reason: `unknown_evidence_state:${badState.status}` };
  return { valid: true, reason: null };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toArray(value) {
  if (Array.isArray(value)) return value.slice();
  if (value === undefined || value === null) return [];
  return [value];
}

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function newId(prefix) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
