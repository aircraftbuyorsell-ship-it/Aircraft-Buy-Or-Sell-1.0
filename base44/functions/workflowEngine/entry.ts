import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import {
  assertTransition,
  canTransition,
  checkDelegation,
  evaluateSkillGate,
  isApprovalUsable,
  newId,
} from '../_shared/workflowGovernance.mjs';

/**
 * workflowEngine — the ABOS workflow state machine and mandatory-skill gate.
 *
 * Nothing in the AI organization may declare work finished on its own. A run is opened
 * here, every state change passes through here, and a run reaches COMPLETED only when
 * every mandatory skill has executed, returned a reasoned NOT_APPLICABLE, or been
 * overridden by an approval a human actually granted.
 *
 * POST { action, ...payload }
 *   start            { workflow_key, agent_key?, subject_type?, subject_id?, subject_label?, inputs?, priority? }
 *   transition       { run_id, to, reason?, agent_key? }
 *   mark_skill       { run_id, skill_id, status, reason?, approval_id?, agent_key? }
 *   gate             { run_id }
 *   complete         { run_id, outputs?, confidence? }
 *   request_approval { run_id?, action, action_category, justification?, payload?, skill_id?, agent_key?, expires_in_minutes? }
 *   decide_approval  { approval_id, decision, note? }
 *   escalate         { run_id?, from_agent_key, to_agent_key?, severity?, category, reason, details? }
 *   dispatch_task    { run_id, sender_agent_key, recipient_agent_key, requested_action, purpose?, payload?, priority?, deadline? }
 *   get              { run_id }
 */

const ADMIN_ROLES = ['admin', 'super_admin'];

Deno.serve(async (req) => {
  let base44;
  let user;
  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();
  } catch (_) {
    user = null;
  }
  if (!user?.email) return json({ ok: false, error: 'Unauthorized' }, 401);
  if (!ADMIN_ROLES.includes(user.role)) {
    return json({ ok: false, error: 'forbidden', message: 'Workflow orchestration is restricted to ABOS operators.' }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '').trim();
  const db = base44.asServiceRole.entities;
  const actor = String(user.email).toLowerCase();

  try {
    switch (action) {
      case 'start': return await startRun(db, actor, body);
      case 'transition': return await transitionRun(db, actor, body);
      case 'mark_skill': return await markSkill(db, actor, body);
      case 'gate': return await runGate(db, body);
      case 'complete': return await completeRun(db, actor, body);
      case 'request_approval': return await requestApproval(db, actor, body);
      case 'decide_approval': return await decideApproval(db, actor, body);
      case 'escalate': return await escalate(db, actor, body);
      case 'dispatch_task': return await dispatchTask(db, actor, body);
      case 'get': return await getRun(db, body);
      default:
        return json({ ok: false, error: 'unknown_action', message: `Unknown workflowEngine action: ${action || '(empty)'}` }, 400);
    }
  } catch (error) {
    return json({ ok: false, error: 'workflow_engine_error', message: error?.message || String(error) }, 500);
  }
});

async function startRun(db, actor, body) {
  const workflowKey = String(body.workflow_key || '').trim();
  if (!workflowKey) return json({ ok: false, error: 'workflow_key required' }, 400);

  const workflow = await findOne(db.AgentWorkflow, { workflow_key: workflowKey });
  if (!workflow) return json({ ok: false, error: 'unknown_workflow', message: workflowKey }, 404);
  if (workflow.enabled === false || workflow.status === 'DISABLED') {
    return json({ ok: false, error: 'workflow_disabled', message: workflowKey }, 409);
  }

  const agentKey = String(body.agent_key || workflow.orchestrator_key || workflow.owner_agent_key || '').trim();
  if (agentKey) {
    const agent = await findOne(db.AgentDefinition, { agent_key: agentKey });
    if (!agent) return json({ ok: false, error: 'unknown_agent', message: agentKey }, 404);
    if (agent.status !== 'ACTIVE') {
      return json({ ok: false, error: 'agent_not_active', message: `${agentKey} is ${agent.status}` }, 409);
    }
  }

  const runId = newId('run');
  const correlationId = String(body.correlation_id || newId('corr'));
  const nowIso = new Date().toISOString();

  // required_skills is snapshotted so a later edit to the workflow cannot retroactively
  // weaken a run that is already in flight.
  const run = await db.WorkflowRun.create({
    run_id: runId,
    workflow_key: workflowKey,
    workflow_version: workflow.version || 'v1',
    state: 'CREATED',
    owner_agent_key: workflow.owner_agent_key || null,
    orchestrator_key: workflow.orchestrator_key || null,
    assigned_agent_key: agentKey || null,
    subject_type: body.subject_type || null,
    subject_id: body.subject_id || null,
    subject_label: body.subject_label || null,
    inputs: body.inputs || {},
    outputs: {},
    required_skills: workflow.required_skills || [],
    optional_skills: workflow.optional_skills || [],
    skill_results: [],
    evidence: [],
    sources: [],
    conflicts: [],
    warnings: [],
    errors: [],
    retry_count: 0,
    delegation_path: agentKey ? [agentKey] : [],
    priority: body.priority || 'P2',
    deadline: body.deadline || null,
    state_history: [{ from: null, to: 'CREATED', at: nowIso, actor, reason: 'run opened' }],
    correlation_id: correlationId,
    triggered_by: actor,
    started_at: nowIso,
  });

  await audit(db, {
    correlation_id: correlationId,
    actor,
    agent_key: agentKey,
    workflow_key: workflowKey,
    run_id: runId,
    action: `Opened workflow run for ${workflowKey}`,
    action_category: 'workflow_start',
    target_type: body.subject_type || 'workflow',
    target_id: body.subject_id || runId,
    after: { state: 'CREATED', required_skills: workflow.required_skills || [] },
    result: 'success',
  });

  const assigned = agentKey
    ? await applyTransition(db, actor, run, 'ASSIGNED', 'agent assigned at start')
    : run;

  return json({
    ok: true,
    run_id: runId,
    correlation_id: correlationId,
    state: assigned.state,
    required_skills: run.required_skills,
  });
}

async function transitionRun(db, actor, body) {
  const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id || '') });
  if (!run) return json({ ok: false, error: 'unknown_run' }, 404);
  const to = String(body.to || '').trim();

  if (to === 'COMPLETED') {
    return json({
      ok: false,
      error: 'use_complete_action',
      message: 'COMPLETED is reached through the complete action so the mandatory-skill gate is evaluated.',
    }, 409);
  }
  if (!canTransition(run.state, to)) {
    return json({ ok: false, error: 'illegal_transition', message: `${run.state} -> ${to}` }, 409);
  }

  const updated = await applyTransition(db, actor, run, to, body.reason || null, body.agent_key || null);
  return json({ ok: true, run_id: run.run_id, state: updated.state });
}

async function markSkill(db, actor, body) {
  const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id || '') });
  if (!run) return json({ ok: false, error: 'unknown_run' }, 404);

  const skillId = String(body.skill_id || '').trim();
  const status = String(body.status || '').trim();
  if (!skillId) return json({ ok: false, error: 'skill_id required' }, 400);
  if (!['not_applicable', 'overridden'].includes(status)) {
    return json({
      ok: false,
      error: 'unsupported_status',
      message: 'Only not_applicable and overridden are set here. Executions are recorded by governedSkillGateway.',
    }, 400);
  }

  const reason = String(body.reason || '').trim();
  if (status === 'not_applicable' && reason.length < 8) {
    return json({
      ok: false,
      error: 'reason_required',
      message: 'NOT_APPLICABLE needs a stated reason. Absence of data is not a reason.',
    }, 400);
  }

  let overrideApprovalId = null;
  if (status === 'overridden') {
    const approval = await findOne(db.AgentApproval, { approval_id: String(body.approval_id || '') });
    if (!isApprovalUsable(approval)) {
      return json({
        ok: false,
        error: 'override_requires_approval',
        message: 'Skipping a mandatory skill requires an approved, unexpired AgentApproval with action_category mandatory_skill_override.',
      }, 403);
    }
    if (approval.action_category !== 'mandatory_skill_override') {
      return json({ ok: false, error: 'wrong_approval_category', message: approval.action_category }, 403);
    }
    if (approval.skill_id && approval.skill_id !== skillId) {
      return json({ ok: false, error: 'approval_skill_mismatch', message: approval.skill_id }, 403);
    }
    overrideApprovalId = approval.approval_id;
  }

  const nowIso = new Date().toISOString();
  await db.WorkflowStep.create({
    run_id: run.run_id,
    workflow_key: run.workflow_key,
    step_index: (run.skill_results || []).length,
    skill_id: skillId,
    agent_key: body.agent_key || run.assigned_agent_key || null,
    mandatory: (run.required_skills || []).includes(skillId),
    status,
    not_applicable_reason: status === 'not_applicable' ? reason : null,
    override_approval_id: overrideApprovalId,
    correlation_id: run.correlation_id,
    started_at: nowIso,
    finished_at: nowIso,
  });

  const skillResults = [...(run.skill_results || []), {
    skill_id: skillId,
    status,
    not_applicable_reason: status === 'not_applicable' ? reason : null,
    override_approval_id: overrideApprovalId,
    at: nowIso,
  }];
  await db.WorkflowRun.update(run.id, { skill_results: skillResults });

  await audit(db, {
    correlation_id: run.correlation_id,
    actor,
    agent_key: body.agent_key || run.assigned_agent_key,
    workflow_key: run.workflow_key,
    run_id: run.run_id,
    skill_id: skillId,
    action: status === 'overridden' ? `Overrode mandatory skill ${skillId}` : `Marked ${skillId} NOT_APPLICABLE`,
    action_category: status === 'overridden' ? 'skill_override' : 'skill_execute',
    reason: reason || null,
    approval_id: overrideApprovalId,
    result: 'success',
  });

  return json({ ok: true, run_id: run.run_id, skill_id: skillId, status });
}

async function runGate(db, body) {
  const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id || '') });
  if (!run) return json({ ok: false, error: 'unknown_run' }, 404);
  const workflow = await findOne(db.AgentWorkflow, { workflow_key: run.workflow_key });
  const gate = evaluateSkillGate({
    requiredSkills: run.required_skills || [],
    skillResults: run.skill_results || [],
    confidence: run.confidence,
    minConfidence: workflow?.min_confidence,
  });
  return json({ ok: true, run_id: run.run_id, state: run.state, gate });
}

async function completeRun(db, actor, body) {
  const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id || '') });
  if (!run) return json({ ok: false, error: 'unknown_run' }, 404);
  const workflow = await findOne(db.AgentWorkflow, { workflow_key: run.workflow_key });

  let current = run;
  if (current.state !== 'VERIFYING') {
    if (!canTransition(current.state, 'VERIFYING')) {
      return json({ ok: false, error: 'illegal_transition', message: `${current.state} -> VERIFYING` }, 409);
    }
    current = await applyTransition(db, actor, current, 'VERIFYING', 'completion requested');
  }

  const confidence = typeof body.confidence === 'number' ? body.confidence : current.confidence;
  const outputs = body.outputs || current.outputs || {};

  const gate = evaluateSkillGate({
    requiredSkills: current.required_skills || [],
    skillResults: current.skill_results || [],
    confidence,
    minConfidence: workflow?.min_confidence,
  });

  if (!gate.satisfied) {
    const blocked = await applyTransition(db, actor, current, 'REVIEW', gate.reasons.join(' | '));
    await audit(db, {
      correlation_id: current.correlation_id,
      actor,
      workflow_key: current.workflow_key,
      run_id: current.run_id,
      action: 'Completion refused by the mandatory-skill gate',
      action_category: 'workflow_complete',
      reason: gate.reasons.join(' | '),
      result: 'denied',
    });
    return json({ ok: false, error: 'gate_not_satisfied', run_id: current.run_id, state: blocked.state, gate }, 409);
  }

  const nowIso = new Date().toISOString();
  assertTransition(current.state, 'COMPLETED');
  await db.WorkflowRun.update(current.id, {
    state: 'COMPLETED',
    outputs,
    confidence: typeof confidence === 'number' ? confidence : null,
    finished_at: nowIso,
    state_history: [...(current.state_history || []), {
      from: current.state, to: 'COMPLETED', at: nowIso, actor, reason: 'gate satisfied',
    }],
  });

  await audit(db, {
    correlation_id: current.correlation_id,
    actor,
    workflow_key: current.workflow_key,
    run_id: current.run_id,
    action: `Completed workflow run ${current.run_id}`,
    action_category: 'workflow_complete',
    before: { state: current.state },
    after: { state: 'COMPLETED', confidence: confidence ?? null },
    evidence_count: (current.evidence || []).length,
    result: 'success',
  });

  return json({ ok: true, run_id: current.run_id, state: 'COMPLETED', gate, outputs });
}

async function requestApproval(db, actor, body) {
  const actionText = String(body.action || '').trim();
  const category = String(body.action_category || '').trim();
  if (!actionText || !category) return json({ ok: false, error: 'action and action_category required' }, 400);

  const approvalId = newId('appr');
  const nowIso = new Date().toISOString();
  const expiresInMinutes = Number(body.expires_in_minutes || 0);

  await db.AgentApproval.create({
    approval_id: approvalId,
    run_id: body.run_id || null,
    workflow_key: body.workflow_key || null,
    requested_by_agent_key: body.agent_key || null,
    action: actionText,
    action_category: category,
    skill_id: body.skill_id || null,
    risk_level: body.risk_level || 'high',
    justification: body.justification || null,
    payload: body.payload || {},
    status: 'pending',
    expires_at: expiresInMinutes > 0 ? new Date(Date.now() + expiresInMinutes * 60000).toISOString() : null,
    correlation_id: body.correlation_id || null,
    requested_at: nowIso,
  });

  if (body.run_id) {
    const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id) });
    if (run && canTransition(run.state, 'APPROVAL_REQUIRED')) {
      await applyTransition(db, actor, run, 'APPROVAL_REQUIRED', `awaiting approval ${approvalId}`);
    }
  }

  await audit(db, {
    correlation_id: body.correlation_id || null,
    actor,
    agent_key: body.agent_key || null,
    run_id: body.run_id || null,
    skill_id: body.skill_id || null,
    action: actionText,
    action_category: 'approval_request',
    reason: body.justification || null,
    approval_id: approvalId,
    result: 'pending',
  });

  return json({ ok: true, approval_id: approvalId, status: 'pending' });
}

async function decideApproval(db, actor, body) {
  const approval = await findOne(db.AgentApproval, { approval_id: String(body.approval_id || '') });
  if (!approval) return json({ ok: false, error: 'unknown_approval' }, 404);
  if (approval.status !== 'pending') {
    return json({ ok: false, error: 'already_decided', message: approval.status }, 409);
  }
  const decision = String(body.decision || '').trim();
  if (!['approved', 'rejected'].includes(decision)) {
    return json({ ok: false, error: 'decision must be approved or rejected' }, 400);
  }

  const nowIso = new Date().toISOString();
  await db.AgentApproval.update(approval.id, {
    status: decision,
    decided_by: actor,
    decided_at: nowIso,
    decision_note: body.note || null,
  });

  await audit(db, {
    correlation_id: approval.correlation_id,
    actor,
    run_id: approval.run_id,
    skill_id: approval.skill_id,
    action: `${decision === 'approved' ? 'Approved' : 'Rejected'}: ${approval.action}`,
    action_category: 'approval_decision',
    before: { status: 'pending' },
    after: { status: decision },
    reason: body.note || null,
    approval_id: approval.approval_id,
    result: 'success',
  });

  return json({ ok: true, approval_id: approval.approval_id, status: decision, decided_by: actor });
}

async function escalate(db, actor, body) {
  const escalationId = newId('esc');
  const nowIso = new Date().toISOString();
  const severity = body.severity || 'P2';

  await db.AgentEscalation.create({
    escalation_id: escalationId,
    run_id: body.run_id || null,
    workflow_key: body.workflow_key || null,
    from_agent_key: body.from_agent_key || 'system',
    to_agent_key: body.to_agent_key || 'abos_director',
    severity,
    category: body.category || 'other',
    reason: body.reason || null,
    details: body.details || {},
    status: 'open',
    requires_owner: severity === 'P0' || Boolean(body.requires_owner),
    correlation_id: body.correlation_id || null,
    opened_at: nowIso,
  });

  if (body.run_id) {
    const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id) });
    if (run && canTransition(run.state, 'ESCALATED')) {
      await applyTransition(db, actor, run, 'ESCALATED', body.reason || `escalation ${escalationId}`);
    }
  }

  await audit(db, {
    correlation_id: body.correlation_id || null,
    actor,
    agent_key: body.from_agent_key || null,
    run_id: body.run_id || null,
    action: `Escalation ${severity}: ${body.reason || body.category}`,
    action_category: 'escalation',
    reason: body.reason || null,
    result: 'success',
  });

  return json({ ok: true, escalation_id: escalationId, severity, status: 'open' });
}

async function dispatchTask(db, actor, body) {
  const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id || '') });
  if (!run) return json({ ok: false, error: 'unknown_run', message: 'Agent tasks exist only inside a workflow run.' }, 404);

  const sender = String(body.sender_agent_key || '').trim();
  const recipient = String(body.recipient_agent_key || '').trim();
  if (!sender || !recipient) return json({ ok: false, error: 'sender_agent_key and recipient_agent_key required' }, 400);

  const recipientAgent = await findOne(db.AgentDefinition, { agent_key: recipient });
  if (!recipientAgent) return json({ ok: false, error: 'unknown_agent', message: recipient }, 404);
  if (recipientAgent.status !== 'ACTIVE') {
    return json({ ok: false, error: 'agent_not_active', message: `${recipient} is ${recipientAgent.status}` }, 409);
  }

  const workflow = await findOne(db.AgentWorkflow, { workflow_key: run.workflow_key });
  const maxDepth = workflow?.max_delegation_depth || recipientAgent.max_delegation_depth || 4;
  const delegation = checkDelegation({
    path: run.delegation_path || [],
    nextAgentKey: recipient,
    maxDepth,
  });

  if (!delegation.allowed) {
    await escalate(db, actor, {
      run_id: run.run_id,
      from_agent_key: sender,
      severity: 'P1',
      category: delegation.reason === 'circular_delegation' ? 'loop_detected' : 'other',
      reason: `Delegation to ${recipient} refused: ${delegation.reason}`,
      details: { path: run.delegation_path, recipient, maxDepth },
    });
    return json({ ok: false, error: delegation.reason, delegation_path: run.delegation_path }, 409);
  }

  const taskId = newId('task');
  const nowIso = new Date().toISOString();
  await db.AgentTask.create({
    task_id: taskId,
    run_id: run.run_id,
    sender_agent_key: sender,
    recipient_agent_key: recipient,
    purpose: body.purpose || null,
    requested_action: String(body.requested_action || '').trim() || 'unspecified',
    payload: body.payload || {},
    priority: body.priority || run.priority || 'P2',
    deadline: body.deadline || null,
    status: 'queued',
    delegation_path: delegation.path,
    delegation_depth: delegation.path.length,
    max_retries: recipientAgent.max_retries ?? 2,
    correlation_id: run.correlation_id,
    created_at_iso: nowIso,
  });

  await db.WorkflowRun.update(run.id, { delegation_path: delegation.path });

  await audit(db, {
    correlation_id: run.correlation_id,
    actor,
    agent_key: sender,
    workflow_key: run.workflow_key,
    run_id: run.run_id,
    action: `Dispatched task to ${recipient}: ${body.requested_action || 'unspecified'}`,
    action_category: 'task_dispatch',
    target_type: 'agent',
    target_id: recipient,
    result: 'success',
  });

  return json({ ok: true, task_id: taskId, delegation_path: delegation.path });
}

async function getRun(db, body) {
  const run = await findOne(db.WorkflowRun, { run_id: String(body.run_id || '') });
  if (!run) return json({ ok: false, error: 'unknown_run' }, 404);
  const steps = await db.WorkflowStep.filter({ run_id: run.run_id }, 'step_index', 200);
  return json({ ok: true, run, steps });
}

async function applyTransition(db, actor, run, to, reason, agentKey) {
  assertTransition(run.state, to);
  const nowIso = new Date().toISOString();
  const patch = {
    state: to,
    state_history: [...(run.state_history || []), { from: run.state, to, at: nowIso, actor, reason: reason || null }],
  };
  if (agentKey) patch.assigned_agent_key = agentKey;
  if (['FAILED', 'CANCELLED'].includes(to)) patch.finished_at = nowIso;

  await db.WorkflowRun.update(run.id, patch);

  await audit(db, {
    correlation_id: run.correlation_id,
    actor,
    agent_key: agentKey || run.assigned_agent_key,
    workflow_key: run.workflow_key,
    run_id: run.run_id,
    action: `Workflow ${run.run_id}: ${run.state} -> ${to}`,
    action_category: 'workflow_transition',
    before: { state: run.state },
    after: { state: to },
    reason: reason || null,
    result: 'success',
  });

  return { ...run, ...patch };
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
    // The audit write must not swallow the operation it describes; failures surface in
    // the platform function logs rather than disappearing silently.
    console.error('AgentAuditLog write failed', record?.action);
  }
}

function json(payload, status = 200) {
  return Response.json(payload, { status });
}
