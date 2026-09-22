import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import {
  checkSkillPermission,
  evaluateSkillGate,
  isApprovalUsable,
  normalizeSkillResult,
  requiresApproval,
  retryAllowed,
  validateEvidence,
} from '../_shared/workflowGovernance.mjs';

/**
 * governedSkillGateway — the only way an ABOS agent executes a capability.
 *
 * This wraps, and never replaces, the existing invokeSkill universal gateway: entitlement
 * checks, credit accounting and ToolInvocation logging continue to happen there, under the
 * calling user's identity. What this adds is governance — may this agent run this skill,
 * inside this workflow, right now; have the skill's own prerequisites run; does the result
 * actually carry the evidence it claims; and every execution is recorded as a WorkflowStep
 * the run's completion gate can see.
 *
 * POST { run_id, skill_id, agent_key, inputs?, attempt?, approval_id?, action_category? }
 */

Deno.serve(async (req) => {
  let base44;
  let user;
  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();
  } catch (_) {
    user = null;
  }
  if (!user?.email) return json({ ok: false, status: 'failed', error: 'Unauthorized' }, 401);

  const db = base44.asServiceRole.entities;
  const actor = String(user.email).toLowerCase();
  const body = await req.json().catch(() => ({}));

  const runId = String(body.run_id || '').trim();
  const skillId = String(body.skill_id || '').trim();
  const agentKey = String(body.agent_key || '').trim();
  const inputs = body.inputs && typeof body.inputs === 'object' ? body.inputs : {};
  const attempt = Number(body.attempt || 1);

  if (!runId || !skillId || !agentKey) {
    return json({ ok: false, status: 'failed', error: 'run_id, skill_id and agent_key are required' }, 400);
  }

  try {
    const run = await findOne(db.WorkflowRun, { run_id: runId });
    if (!run) return json({ ok: false, status: 'failed', error: 'unknown_run' }, 404);
    if (['COMPLETED', 'CANCELLED'].includes(run.state)) {
      return json({ ok: false, status: 'failed', error: 'run_closed', message: `Run is ${run.state}.` }, 409);
    }

    const [workflow, agent, skill] = await Promise.all([
      findOne(db.AgentWorkflow, { workflow_key: run.workflow_key }),
      findOne(db.AgentDefinition, { agent_key: agentKey }),
      findOne(db.AgentSkill, { skill_id: skillId }),
    ]);

    const permission = checkSkillPermission({ agent, skill, workflow });
    if (!permission.allowed) {
      await recordDenied(db, { run, skillId, agentKey, actor, reason: permission.reason });
      return json({
        ok: false,
        status: 'denied',
        error: permission.reason,
        message: `Agent ${agentKey} may not run ${skillId} in ${run.workflow_key}.`,
      }, 403);
    }

    const prerequisites = Array.isArray(skill.required_skills) ? skill.required_skills : [];
    if (prerequisites.length > 0) {
      const prereqGate = evaluateSkillGate({
        requiredSkills: prerequisites,
        skillResults: run.skill_results || [],
      });
      if (!prereqGate.satisfied) {
        await recordDenied(db, { run, skillId, agentKey, actor, reason: 'prerequisites_unmet' });
        return json({
          ok: false,
          status: 'blocked',
          error: 'prerequisites_unmet',
          missing: prereqGate.missing,
          message: `${skillId} depends on skills that have not run yet.`,
        }, 409);
      }
    }

    if (requiresApproval({ actionCategory: body.action_category, agent, skill, workflow })) {
      const approval = await findOne(db.AgentApproval, { approval_id: String(body.approval_id || '') });
      if (!isApprovalUsable(approval)) {
        await recordDenied(db, { run, skillId, agentKey, actor, reason: 'approval_required' });
        return json({
          ok: false,
          status: 'approval_required',
          error: 'approval_required',
          message: `${skillId} requires human approval before it runs. Request one through workflowEngine.`,
        }, 403);
      }
    }

    const maxAttempts = Number(skill.retry_policy?.max_attempts ?? workflow?.max_retries ?? 2);
    const retry = retryAllowed({ attempt, maxAttempts });
    if (!retry.allowed) {
      await recordDenied(db, { run, skillId, agentKey, actor, reason: retry.reason });
      return json({ ok: false, status: 'failed', error: retry.reason }, 429);
    }

    const startedAt = new Date();
    const stepIndex = (run.skill_results || []).length;
    const mandatory = (run.required_skills || []).includes(skillId);

    let raw = null;
    let transportError = null;
    try {
      raw = await executeSkill(base44, skill, inputs, run);
    } catch (error) {
      transportError = error?.message || String(error);
    }

    const result = normalizeSkillResult(transportError ? { ok: false, error: transportError } : raw, {
      agent: agentKey,
      skill: skillId,
      workflow_id: run.run_id,
      inputs,
    });

    // A skill that claims evidence and produces none has not actually executed.
    const evidenceCheck = validateEvidence(result, skill);
    if (!evidenceCheck.valid) {
      result.status = 'failed';
      result.errors.push(evidenceCheck.reason);
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await db.WorkflowStep.create({
      run_id: run.run_id,
      workflow_key: run.workflow_key,
      step_index: stepIndex,
      skill_id: skillId,
      agent_key: agentKey,
      mandatory,
      status: result.status,
      inputs,
      outputs: result.outputs,
      evidence: result.evidence,
      sources: result.sources,
      conflicts: result.conflicts,
      warnings: result.warnings,
      errors: result.errors,
      confidence: result.confidence,
      not_applicable_reason: result.not_applicable_reason,
      attempt,
      duration_ms: durationMs,
      next_action: result.next_action,
      correlation_id: run.correlation_id,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
    });

    const skillResults = [...(run.skill_results || []), {
      skill_id: skillId,
      status: result.status,
      attempt,
      confidence: result.confidence,
      not_applicable_reason: result.not_applicable_reason,
      at: finishedAt.toISOString(),
    }];

    const patch = {
      skill_results: skillResults,
      evidence: [...(run.evidence || []), ...result.evidence],
      sources: [...(run.sources || []), ...result.sources],
      // Conflicting sources accumulate. They are never resolved by overwriting one
      // reading with another — resolution is an explicit, evidenced decision.
      conflicts: [...(run.conflicts || []), ...result.conflicts],
      warnings: [...(run.warnings || []), ...result.warnings],
    };
    if (result.status === 'failed') {
      patch.errors = [...(run.errors || []), ...result.errors];
      patch.last_error = result.errors[0] || null;
    }
    if (['CREATED', 'PLANNED', 'ASSIGNED'].includes(run.state)) {
      patch.state = 'RUNNING';
      patch.state_history = [...(run.state_history || []), {
        from: run.state, to: 'RUNNING', at: finishedAt.toISOString(), actor, reason: `first skill ${skillId}`,
      }];
    }
    await db.WorkflowRun.update(run.id, patch);

    await audit(db, {
      correlation_id: run.correlation_id,
      actor,
      agent_key: agentKey,
      workflow_key: run.workflow_key,
      run_id: run.run_id,
      skill_id: skillId,
      action: `Executed ${skillId} (attempt ${attempt})`,
      action_category: 'skill_execute',
      target_type: run.subject_type || 'workflow',
      target_id: run.subject_id || run.run_id,
      after: { status: result.status, confidence: result.confidence },
      evidence_count: result.evidence.length,
      result: result.status === 'failed' ? 'failure' : 'success',
    });

    const statusCode = result.status === 'failed' ? 502 : 200;
    return json({
      ok: result.status !== 'failed',
      ...result,
      run_id: run.run_id,
      mandatory,
      duration_ms: durationMs,
      retry_available: retryAllowed({ attempt: attempt + 1, maxAttempts }).allowed,
    }, statusCode);
  } catch (error) {
    return json({ ok: false, status: 'failed', error: 'gateway_error', message: error?.message || String(error) }, 500);
  }
});

/**
 * Route to the real implementation. Existing production capability is reused, never
 * reimplemented: skill_gateway goes through invokeSkill under the caller's identity so
 * entitlement and credit rules keep applying exactly as they do today.
 */
async function executeSkill(base44, skill, inputs, run) {
  const ref = String(skill.implementation_ref || '').trim();
  if (!ref) throw new Error(`Skill ${skill.skill_id} has no implementation_ref.`);

  if (skill.implementation_kind === 'skill_gateway') {
    const response = await base44.functions.invoke('invokeSkill', {
      skill_id: ref,
      inputs,
      passport_id: run.subject_id || undefined,
    });
    return response?.data ?? response;
  }

  if (skill.implementation_kind === 'base44_function') {
    const response = await base44.functions.invoke(ref, inputs);
    return response?.data ?? response;
  }

  throw new Error(`implementation_kind ${skill.implementation_kind} cannot be executed by the gateway.`);
}

async function recordDenied(db, { run, skillId, agentKey, actor, reason }) {
  const nowIso = new Date().toISOString();
  await db.WorkflowStep.create({
    run_id: run.run_id,
    workflow_key: run.workflow_key,
    step_index: (run.skill_results || []).length,
    skill_id: skillId,
    agent_key: agentKey,
    mandatory: (run.required_skills || []).includes(skillId),
    status: 'denied',
    errors: [reason],
    correlation_id: run.correlation_id,
    started_at: nowIso,
    finished_at: nowIso,
  }).catch(() => {});

  await audit(db, {
    correlation_id: run.correlation_id,
    actor,
    agent_key: agentKey,
    workflow_key: run.workflow_key,
    run_id: run.run_id,
    skill_id: skillId,
    action: `Refused ${skillId} for ${agentKey}`,
    action_category: 'skill_denied',
    reason,
    result: 'denied',
  });
}

async function findOne(entity, query) {
  const values = Object.values(query);
  if (values.some((value) => !value)) return null;
  const rows = await entity.filter(query, '-created_date', 1).catch(() => []);
  return rows[0] || null;
}

async function audit(db, record) {
  try {
    await db.AgentAuditLog.create({ ...record, timestamp: new Date().toISOString() });
  } catch (_) {
    console.error('AgentAuditLog write failed', record?.action);
  }
}

function json(payload, status = 200) {
  return Response.json(payload, { status });
}
