import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.upgrade_compare.v1 (RFC-245, Batch C)
 * Aggregator — compares avionics, exterior, and interior upgrade costs side by side.
 * Calls invokeSkillAvionics, invokeSkillExterior, invokeSkillInterior.
 * Migrated from UpgradeComparison.jsx — PS-3.2 compliant.
 */

const LABOR_RATE = 95;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const aircraft = inputs.aircraft || 'c172';

    // Call the three sub-skills in parallel
    const [avionicsRes, exteriorRes, interiorRes] = await Promise.allSettled([
      base44.functions.invoke('invokeSkillAvionics', { inputs: { aircraft, labor_tier: 1, selected_items: inputs.avionics_items || { gps_nav: 1, adsb_transponder: 1 } } }),
      base44.functions.invoke('invokeSkillExterior', { inputs: { aircraft, condition: 'fair', selected_services: inputs.exterior_services || { strip_paint: true } } }),
      base44.functions.invoke('invokeSkillInterior', { inputs: { aircraft, seat_type: 'standard', material_grade: 'standard', selected_services: inputs.interior_services || { carpet: true, headliner: true } } }),
    ]);

    const extract = (r) => r.status === 'fulfilled' ? r.value?.data || r.value : { ok: false, error: r.reason?.message };
    const avionics = extract(avionicsRes);
    const exterior = extract(exteriorRes);
    const interior = extract(interiorRes);

    const categories = [
      { key: 'avionics', label: 'Avionics', color: '#f5c242', skill: 'abos.skill.avionics_upgrade.v1', data: avionics },
      { key: 'exterior', label: 'Exterior', color: '#5dcaa5', skill: 'abos.skill.exterior_refurb.v1', data: exterior },
      { key: 'interior', label: 'Interior', color: '#c88cff', skill: 'abos.skill.interior_refurb.v1', data: interior },
    ].map(c => ({
      ...c,
      total: c.data?.result?.grand_total || 0,
      parts: c.data?.result?.parts_total || 0,
      labor_hours: c.data?.result?.labor_hours || 0,
      labor_cost: c.data?.result?.labor_total || 0,
      line_items: c.data?.result?.line_items || [],
    }));

    const grandTotal = categories.reduce((sum, c) => sum + c.total, 0);

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.upgrade_compare.v1',
      version: 'v1',
      result: {
        aircraft,
        categories,
        grand_total: grandTotal,
        labor_rate: LABOR_RATE,
      },
      confidence: 0.85,
      evidence: [
        `Aircraft: ${aircraft}`,
        `Avionics: $${(avionics?.result?.grand_total || 0).toLocaleString()}`,
        `Exterior: $${(exterior?.result?.grand_total || 0).toLocaleString()}`,
        `Interior: $${(interior?.result?.grand_total || 0).toLocaleString()}`,
        `Grand total: $${grandTotal.toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});