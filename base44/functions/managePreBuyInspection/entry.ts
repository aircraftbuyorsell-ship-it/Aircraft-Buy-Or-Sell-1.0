import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const now = () => new Date().toISOString();
const audit = (user, event, details = '') => ({ event, actor_id: user.id, actor_name: user.full_name || user.email, timestamp: now(), details });
const emailEq = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

function roleFor(record, user) {
  if (user.role === 'admin') return 'admin';
  if (record.buyer?.id === user.id || emailEq(record.buyer?.email, user.email)) return 'buyer';
  if (record.inspector?.id === user.id || emailEq(record.inspector?.email, user.email)) return 'inspector';
  return record.participants?.find(p => p.id === user.id || emailEq(p.email, user.email))?.role || null;
}
function visible(record, user) {
  const role = roleFor(record, user);
  if (!role) return null;
  const copy = structuredClone(record);
  copy._viewer_role = role;
  if (role === 'broker' || role === 'seller') {
    copy.findings = (record.shared_sections || []).includes('findings') ? (record.findings || []).map(f => ({ ...f, buyer_notes: '' })) : [];
    copy.checklist = (record.shared_sections || []).includes('checklist') ? record.checklist : [];
    copy.media = (record.shared_sections || []).includes('media') ? record.media : [];
    copy.executive_summary = (record.shared_sections || []).includes('summary') ? record.executive_summary : '';
    copy.risk_assessment = '';
    copy.decision_guidance = 'Pending';
    copy.recommended_next_actions = '';
  }
  return copy;
}
function reportCounts(findings = []) {
  return ['critical', 'major', 'minor'].reduce((o, key) => ({ ...o, [key]: findings.filter(f => f.severity === key).length }), {});
}
async function analyze(base44, record) {
  const compact = (record.findings || []).map(({ category, severity, priority, title, description, inspector_comments, seller_response }) => ({ category, severity, priority, title, description, inspector_comments, seller_response }));
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a conservative senior aviation pre-buy inspection analyst. Analyze this inspection for ${record.aircraft?.registration || 'the aircraft'}. Never claim airworthiness certification. Findings: ${JSON.stringify(compact)}. Return a concise executive summary, risk assessment, next actions, and decision guidance. Critical safety uncertainty should favor Walk Away; remediable issues favor Negotiate.`,
    response_json_schema: { type: 'object', properties: { executive_summary: { type: 'string' }, risk_assessment: { type: 'string' }, recommended_next_actions: { type: 'string' }, decision_guidance: { type: 'string', enum: ['Buy', 'Negotiate', 'Walk Away'] } }, required: ['executive_summary', 'risk_assessment', 'recommended_next_actions', 'decision_guidance'] }
  });
}
async function syncPipeline(entities, record, user) {
  let pipeline = record.pipeline_id ? await entities.SalesPipeline.get(record.pipeline_id).catch(() => null) : null;
  if (!pipeline) pipeline = (await entities.SalesPipeline.filter({ registration: record.aircraft?.registration }, '-created_date', 1))[0];
  const result = { report_id: record.report_id, version: record.version, decision: record.decision_guidance, finalized_at: record.finalized_at };
  if (pipeline) {
    const steps = (pipeline.steps || []).map(s => s.id === 'prebuy_inspection' ? { ...s, status: 'completed', result_data: result, ai_notes: record.executive_summary, completed_at: now(), completed_by: user.id } : s);
    const done = steps.filter(s => ['completed', 'skipped'].includes(s.status)).length;
    await entities.SalesPipeline.update(pipeline.id, { steps, current_step_id: 'buyer_decision', progress_pct: steps.length ? Math.round(done / steps.length * 100) : 0 });
    return pipeline.id;
  }
  const steps = [
    { id: 'qualification', label: 'Buyer & Aircraft Qualified', category: 'verification', status: 'completed', prerequisite_ids: [] },
    { id: 'records_review', label: 'Records Review', category: 'document', status: 'pending', prerequisite_ids: ['qualification'] },
    { id: 'prebuy_inspection', label: 'Pre-Buy Inspection', category: 'inspection', status: 'completed', prerequisite_ids: ['qualification'], result_data: result, completed_at: now(), completed_by: user.id },
    { id: 'buyer_decision', label: 'Buyer Decision & Negotiation', category: 'legal', status: 'pending', prerequisite_ids: ['prebuy_inspection'] },
    { id: 'escrow_setup', label: 'Escrow & Payment', category: 'financial', status: 'pending', prerequisite_ids: ['buyer_decision'] },
    { id: 'closing', label: 'Closing & Transfer', category: 'closing', status: 'pending', prerequisite_ids: ['escrow_setup'] }
  ];
  const created = await entities.SalesPipeline.create({ registration: record.aircraft?.registration, aircraft_label: `${record.aircraft?.year || ''} ${record.aircraft?.make || ''} ${record.aircraft?.model || ''}`.trim(), aircraft_class: record.aircraft?.aircraft_class || 'sep', status: 'active', current_step_id: 'buyer_decision', progress_pct: 33, steps });
  return created.id;
}
async function sendInvitation(base44, record, participant, appUrl) {
  const safeOrigin = /^https:\/\/[a-z0-9.-]+$/i.test(String(appUrl || '')) ? appUrl : 'https://app.base44.com';
  const link = `${safeOrigin}/pre-buy-inspection?id=${record.id}`;
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: participant.email,
    subject: `ABOS inspection invitation — ${record.aircraft?.registration}`,
    body: `<h2>You have been invited to an ABOS Inspection Workspace</h2><p><strong>Aircraft:</strong> ${record.aircraft?.registration || ''} ${record.aircraft?.make || ''} ${record.aircraft?.model || ''}</p><p><strong>Your role:</strong> ${participant.role}</p><p><a href="${link}">Open secure inspection workspace</a></p><p style="color:#777;font-size:12px">Sign in with this email address. Access is permission controlled.</p>`
  });
}
async function sendSummary(base44, record, appUrl) {
  const counts = reportCounts(record.findings);
  const recipients = [...new Set([record.buyer?.email, record.inspector?.email, ...(record.participants || []).map(p => p.email)].filter(Boolean))];
  const safeOrigin = /^https:\/\/[a-z0-9.-]+$/i.test(String(appUrl || '')) ? appUrl : 'https://app.base44.com';
  const link = `${safeOrigin}/pre-buy-inspection?id=${record.id}`;
  await Promise.all(recipients.map(to => base44.asServiceRole.integrations.Core.SendEmail({ to, subject: `ABOS inspection completed — ${record.aircraft?.registration}`, body: `<h2>Inspection completed</h2><p><strong>Aircraft:</strong> ${record.aircraft?.registration || ''} ${record.aircraft?.make || ''} ${record.aircraft?.model || ''}</p><p>Critical: ${counts.critical} · Major: ${counts.major} · Minor: ${counts.minor}</p><p>${record.executive_summary || 'The inspection report is ready.'}</p><p><a href="${link}">Open secure ABOS report</a></p><p style="color:#777;font-size:12px">Sensitive inspection details are available only in the permission-controlled workspace.</p>` })));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const entities = base44.asServiceRole.entities;
    if (action === 'list') {
      const rows = await entities.PreBuyInspection.list('-updated_date', 200);
      return Response.json({ inspections: rows.map(r => visible(r, user)).filter(Boolean) });
    }
    if (action === 'create') {
      const id = crypto.randomUUID().slice(0, 8).toUpperCase();
      const created = await entities.PreBuyInspection.create({ report_id: `ABOS-PBI-${id}`, version: 1, status: 'requested', aircraft: body.aircraft, buyer: { id: user.id, name: user.full_name || user.email, email: user.email }, inspector: { ...(body.inspector || {}), selection: body.inspectorSelection || 'later' }, participants: body.participants || [], checklist: body.checklist || [], findings: [], media: [], shared_sections: ['summary'], decision_guidance: 'Pending', verification_status: 'unverified', audit_history: [audit(user, 'inspection_created')] });
      const invitees = [...(body.participants || []), ...(body.inspector?.email ? [{ ...body.inspector, role: 'inspector' }] : [])];
      const deliveries = await Promise.allSettled(invitees.map(p => sendInvitation(base44, created, p, body.appUrl)));
      const warning = deliveries.some(d => d.status === 'rejected') ? 'Workspace created, but one or more invitation emails could not be delivered.' : null;
      return Response.json({ inspection: visible(created, user), warning });
    }
    const record = await entities.PreBuyInspection.get(body.id);
    const role = roleFor(record, user);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (action === 'get') return Response.json({ inspection: visible(record, user) });
    if (action === 'createRevision') {
      if (role !== 'buyer' && role !== 'admin') return Response.json({ error: 'Buyer access required' }, { status: 403 });
      if (record.status !== 'finalized') return Response.json({ error: 'Only finalized reports can be revised' }, { status: 400 });
      const clone = { ...record, id: undefined, created_date: undefined, updated_date: undefined, previous_version_id: record.id, version: (record.version || 1) + 1, status: 'in_progress', finalized_at: undefined, inspector_signature: undefined, verification_status: 'unverified', report_id: `${record.report_id.split('-V')[0]}-V${(record.version || 1) + 1}`, audit_history: [...(record.audit_history || []), audit(user, 'revision_created', `Version ${(record.version || 1) + 1}`)] };
      const created = await entities.PreBuyInspection.create(clone);
      return Response.json({ inspection: visible(created, user) });
    }
    if (record.status === 'finalized') return Response.json({ error: 'Finalized reports are immutable. Create a new version.' }, { status: 409 });
    let patch = {};
    if (action === 'updateChecklist') {
      if (!['inspector', 'admin'].includes(role)) return Response.json({ error: 'Inspector access required' }, { status: 403 });
      patch.checklist = (record.checklist || []).map(i => i.id === body.item.id ? { ...i, ...body.item, updated_by: user.id, updated_at: now() } : i);
      patch.status = 'in_progress';
    } else if (action === 'addFinding') {
      if (!['inspector', 'admin'].includes(role)) return Response.json({ error: 'Inspector access required' }, { status: 403 });
      patch.findings = [...(record.findings || []), { ...body.finding, id: crypto.randomUUID(), created_by: user.id, created_at: now(), updated_at: now() }];
      patch.status = 'in_progress';
    } else if (action === 'respondFinding') {
      const key = role === 'buyer' ? 'buyer_notes' : ['broker', 'seller'].includes(role) ? 'seller_response' : 'inspector_comments';
      patch.findings = (record.findings || []).map(f => f.id === body.findingId ? { ...f, [key]: body.text, updated_at: now() } : f);
    } else if (action === 'addMedia') {
      if (!['buyer', 'inspector', 'broker', 'seller', 'admin'].includes(role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      patch.media = [...(record.media || []), { ...body.media, uploaded_by: user.id, uploaded_at: now() }];
    } else if (action === 'invite') {
      if (!['buyer', 'admin'].includes(role)) return Response.json({ error: 'Buyer access required' }, { status: 403 });
      patch.participants = [...(record.participants || []).filter(p => !emailEq(p.email, body.participant.email)), { ...body.participant, status: 'invited' }];
      if (body.participant.role === 'inspector') patch.inspector = { ...(record.inspector || {}), ...body.participant };
    } else if (action === 'share') {
      if (!['buyer', 'admin'].includes(role)) return Response.json({ error: 'Buyer access required' }, { status: 403 });
      patch.shared_sections = body.shared_sections || [];
    } else if (action === 'analyze') {
      if (!['buyer', 'inspector', 'admin'].includes(role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      patch = { ...(await analyze(base44, record)), status: 'analysis_ready' };
    } else if (action === 'finalize') {
      if (!['inspector', 'admin'].includes(role)) return Response.json({ error: 'Inspector access required' }, { status: 403 });
      const analysis = record.executive_summary ? {} : await analyze(base44, record);
      patch = { ...analysis, status: 'finalized', finalized_at: now(), inspection_date: body.inspection_date || now().slice(0, 10), inspector_signature: { name: body.signatureName || user.full_name || user.email, certificate: body.certificate || record.inspector?.certificate || '', signed_at: now(), user_id: user.id }, verification_status: 'inspector_signed' };
    } else return Response.json({ error: 'Unknown action' }, { status: 400 });
    patch.audit_history = [...(record.audit_history || []), audit(user, action, body.details || '')];
    let updated = await entities.PreBuyInspection.update(record.id, patch);
    if (action === 'invite') await sendInvitation(base44, updated, body.participant, body.appUrl);
    if (action === 'finalize') {
      const pipelineId = await syncPipeline(entities, updated, user);
      updated = await entities.PreBuyInspection.update(record.id, { pipeline_id: pipelineId });
      await sendSummary(base44, updated, body.appUrl);
    }
    return Response.json({ inspection: visible(updated, user) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});