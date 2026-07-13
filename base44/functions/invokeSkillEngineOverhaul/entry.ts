import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.engine_overhaul.v1 (RFC-251, Batch C)
 * Deterministic engine overhaul cost + time calculator.
 * Includes: engine demount, overhaul, remount, test cell, documentation.
 * Supports: reciprocating (Lycoming/Continental), turboprop (PT6), turbofan.
 */

const ENGINE_TYPES = {
  recip_4: { label: "Reciprocating 4-cyl (O-320/O-360)", baseOverhaul: 28000, demountHours: 8, remountHours: 12, testCellHours: 4, docHours: 4 },
  recip_6: { label: "Reciprocating 6-cyl (IO-540/TSIO-520)", baseOverhaul: 42000, demountHours: 10, remountHours: 14, testCellHours: 4, docHours: 4 },
  recip_8: { label: "Reciprocating 8-cyl (IO-720)", baseOverhaul: 55000, demountHours: 12, remountHours: 16, testCellHours: 6, docHours: 5 },
  turboprop: { label: "Turboprop (PT6A-42)", baseOverhaul: 380000, demountHours: 16, remountHours: 24, testCellHours: 8, docHours: 8 },
  turbofan_small: { label: "Turbofan (Williams FJ44)", baseOverhaul: 450000, demountHours: 20, remountHours: 28, testCellHours: 10, docHours: 8 },
  turbofan_mid: { label: "Turbofan (PW300/HTF7000)", baseOverhaul: 850000, demountHours: 24, remountHours: 32, testCellHours: 12, docHours: 10 },
};

const LABOR_RATES = { regional: 85, mid_tier: 105, premium: 125, specialized: 150 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const engineType = inputs.engine_type || 'recip_6';
    const laborTier = inputs.labor_tier || 'mid_tier';
    const includeDemount = inputs.include_demount !== false;
    const includeRemount = inputs.include_remount !== false;
    const includeTestCell = inputs.include_test_cell !== false;
    const includeDocs = inputs.include_docs !== false;
    const shopFeePct = inputs.shop_fee_pct || 0;

    const eng = ENGINE_TYPES[engineType] || ENGINE_TYPES.recip_6;
    const laborRate = LABOR_RATES[laborTier] || 105;

    let totalHours = 0;
    let laborCost = 0;
    const phases = [];

    if (includeDemount) {
      const hours = eng.demountHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Engine Demount", hours, labor_cost: cost, description: "Remove engine from airframe, drain fluids, disconnect systems" });
    }

    // Overhaul itself (parts + labor)
    const overhaulLaborHours = eng.baseOverhaul * 0.001; // ~1 hour per $1000 of overhaul cost
    const overhaulLabor = overhaulLaborHours * laborRate;
    const overhaulParts = eng.baseOverhaul * 0.65;
    totalHours += overhaulLaborHours;
    laborCost += overhaulLabor;
    phases.push({ phase: "Overhaul (teardown + rebuild)", hours: Math.round(overhaulLaborHours), labor_cost: Math.round(overhaulLabor), parts_cost: Math.round(overhaulParts), description: "Full teardown, inspection, replace worn parts, reassemble to factory spec" });

    if (includeTestCell) {
      const hours = eng.testCellHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Test Cell Run", hours, labor_cost: cost, description: "Bench test: power output, temps, leak check, vibration" });
    }

    if (includeRemount) {
      const hours = eng.remountHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Engine Remount", hours, labor_cost: cost, description: "Reinstall engine, connect systems, fuel lines, cowling" });
    }

    if (includeDocs) {
      const hours = eng.docHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Documentation & 8130-3", hours, labor_cost: cost, description: "Release certificate, logbook entries, AD compliance review" });
    }

    const partsTotal = Math.round(overhaulParts);
    const laborTotal = Math.round(laborCost);
    const shopFee = Math.round((partsTotal + laborTotal) * (shopFeePct / 100));
    const grandTotal = partsTotal + laborTotal + shopFee;

    // Time estimate (calendar days — shop works ~8 hrs/day)
    const calendarDays = Math.ceil(totalHours / 8);

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.engine_overhaul.v1',
      version: 'v1',
      result: {
        engine_type: eng.label,
        phases,
        parts_total: partsTotal,
        labor_total: laborTotal,
        shop_fee: shopFee,
        grand_total: grandTotal,
        total_labor_hours: Math.round(totalHours),
        estimated_calendar_days: calendarDays,
        labor_rate: laborRate,
      },
      confidence: 0.85,
      evidence: [
        `Engine: ${eng.label}`,
        `Labor rate: $${laborRate}/hr`,
        `Demount: ${includeDemount ? eng.demountHours + 'h' : 'skipped'}`,
        `Overhaul parts: $${partsTotal.toLocaleString()}`,
        `Remount: ${includeRemount ? eng.remountHours + 'h' : 'skipped'}`,
        `Total: ${Math.round(totalHours)}h labor, ${calendarDays} calendar days`,
        `Grand total: $${grandTotal.toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});