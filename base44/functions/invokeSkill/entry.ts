import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * invokeSkill — Universal Skill Gateway (APS-002 compliant)
 * Routes {skill_id, inputs, passport_id?} to the appropriate backend function.
 * Validates permissions, logs to ToolInvocation, returns standardized SkillResponse.
 *
 * POST { skill_id: string, inputs: object, passport_id?: string }
 */

const SKILL_ROUTING = {
  'abos.skill.opex.v1':                  { function: 'invokeSkillOpex',              credit_cost: 1, task_type: 'deterministic' },
  'abos.skill.insurance_estimate.v1':    { function: 'invokeSkillInsurance',         credit_cost: 1, task_type: 'deterministic' },
  'abos.skill.leasing.v1':               { function: 'invokeSkillLeasing',           credit_cost: 1, task_type: 'deterministic' },
  'abos.skill.rebuild_roi.v1':           { function: 'invokeSkillRebuildRoi',        credit_cost: 3, task_type: 'deterministic' },
  'abos.skill.tax_benefit.v1':           { function: 'invokeSkillTaxBenefit',        credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.lease_rate.v1':            { function: 'invokeSkillLeaseRate',         credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.investment_health.v1':     { function: 'invokeSkillInvestmentHealth',  credit_cost: 5, task_type: 'hybrid' },
  'abos.skill.avionics_upgrade.v1':      { function: 'invokeSkillAvionics',          credit_cost: 1, task_type: 'deterministic' },
  'abos.skill.exterior_refurb.v1':       { function: 'invokeSkillExterior',          credit_cost: 1, task_type: 'deterministic' },
  'abos.skill.interior_refurb.v1':       { function: 'invokeSkillInterior',          credit_cost: 1, task_type: 'deterministic' },
  'abos.skill.detailing.v1':             { function: 'invokeSkillDetailing',         credit_cost: 0, task_type: 'deterministic' },
  'abos.skill.upgrade_compare.v1':       { function: 'invokeSkillUpgradeCompare',    credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.engine_overhaul.v1':       { function: 'invokeSkillEngineOverhaul',    credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.prop_overhaul.v1':         { function: 'invokeSkillPropOverhaul',      credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.mro_schedule.v1':          { function: 'invokeSkillMroSchedule',       credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.fractional_ownership.v1':  { function: 'invokeSkillFractionalOwnership', credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.timebuilding_buy.v1':      { function: 'invokeSkillTimebuildingBuy',   credit_cost: 2, task_type: 'deterministic' },
  'abos.skill.fleet_change.v1':          { function: 'invokeSkillFleetChange',       credit_cost: 3, task_type: 'deterministic' },
};

// ── ABOS monetization gate — active PRO/BROKER subscription required (server-enforced for web, API and MCP) ──
async function gateProSubscription(base44, user) {
  if (user?.role === 'admin' || user?.role === 'super_admin') return null;
  const check = await base44.functions.invoke('abosEntitlements', { action: 'check', product_key: 'PRO' });
  const d = check?.data || {};
  if (d.entitled || d.active_sub_product) return null;
  let checkoutUrl = null;
  try {
    const co = await base44.functions.invoke('abosEntitlements', {
      action: 'create_checkout', product_key: 'PRO',
      return_url: Deno.env.get('BASE44_APP_URL') || 'https://aircraftbuyorsell.com/checkout-success',
    });
    checkoutUrl = co?.data?.url || null;
  } catch (_) { /* checkout link is optional */ }
  return Response.json({
    error: 'payment_required',
    message: 'This is a paid ABOS PRO tool. An active ABOS Professional (\u20ac99/mo) or Broker subscription is required. Open checkout_url to subscribe, then retry this request.',
    product_key: 'PRO',
    checkout_url: checkoutUrl,
  }, { status: 402 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Paid feature: all financial/upgrade skills require PRO ──
    const gate = await gateProSubscription(base44, user);
    if (gate) return gate;

    const body = await req.json().catch(() => ({}));
    const { skill_id, inputs, passport_id } = body;

    if (!skill_id) return Response.json({ error: 'skill_id required' }, { status: 400 });

    const routing = SKILL_ROUTING[skill_id];
    if (!routing) return Response.json({ error: `Unknown skill: ${skill_id}` }, { status: 404 });

    // Look up SkillDefinition for validation
    let skillDef = null;
    try {
      const defs = await base44.asServiceRole.entities.SkillDefinition.filter({ skill_id }, '-created_date', 1);
      skillDef = defs[0];
    } catch (_) { /* skill registry not yet seeded — allow by routing table */ }

    if (skillDef && !skillDef.is_active) {
      return Response.json({ error: `Skill ${skill_id} is not active` }, { status: 403 });
    }

    const startTime = Date.now();

    // Invoke the target skill function
    const invokePayload = { inputs: inputs || {}, passport_id };
    const response = await base44.functions.invoke(routing.function, invokePayload);
    const skillResponse = response.data;
    const durationMs = Date.now() - startTime;

    // Log to ToolInvocation (audit trail)
    try {
      await base44.asServiceRole.entities.ToolInvocation.create({
        tool_integration_id: skillDef?.id || skill_id,
        tool_name: skill_id,
        user_email: user.email,
        tokens_charged: routing.credit_cost,
        status: skillResponse?.ok ? 'success' : 'failed',
        request_payload: invokePayload,
        response_payload: skillResponse,
        duration_ms: durationMs,
        invoked_at: new Date().toISOString(),
        error_message: skillResponse?.ok ? null : (skillResponse?.error || 'Unknown error'),
      });
    } catch (_) { /* audit log failure should not block response */ }

    // Attach gateway metadata
    const enrichedResponse = {
      ...skillResponse,
      gateway: {
        skill_id,
        credit_cost: routing.credit_cost,
        task_type: routing.task_type,
        duration_ms: durationMs,
        invoked_by: user.email,
        skill_definition_id: skillDef?.id || null,
      },
    };

    return Response.json(enrichedResponse);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});