import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.prop_overhaul.v1 (RFC-252, Batch C)
 * Deterministic propeller overhaul cost + time calculator.
 * Includes: prop demount, overhaul, remount, dynamic balance, documentation.
 * Supports: 2-blade metal, 3-blade metal, composite, constant-speed Hartzell/MT.
 */

const PROP_TYPES = {
  metal_2: { label: "2-Blade Metal (McCauley/Hartzell)", baseOverhaul: 4500, demountHours: 3, remountHours: 4, balanceHours: 2, docHours: 1 },
  metal_3: { label: "3-Blade Metal (Hartzell)", baseOverhaul: 6500, demountHours: 3, remountHours: 4, balanceHours: 2, docHours: 1 },
  composite_2: { label: "2-Blade Composite (MT-Propeller)", baseOverhaul: 5500, demountHours: 3, remountHours: 4, balanceHours: 2, docHours: 1 },
  composite_3: { label: "3-Blade Composite (MT-Propeller)", baseOverhaul: 7800, demountHours: 4, remountHours: 5, balanceHours: 2.5, docHours: 1 },
  composite_4: { label: "4-Blade Composite (MT)", baseOverhaul: 9500, demountHours: 4, remountHours: 5, balanceHours: 3, docHours: 1.5 },
  constant_speed_governor: { label: "Prop Governor Overhaul", baseOverhaul: 1200, demountHours: 1, remountHours: 1.5, balanceHours: 0, docHours: 0.5 },
};

const LABOR_RATES = { regional: 85, mid_tier: 105, premium: 125, specialized: 150 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const propType = inputs.prop_type || 'metal_3';
    const laborTier = inputs.labor_tier || 'mid_tier';
    const includeDemount = inputs.include_demount !== false;
    const includeRemount = inputs.include_remount !== false;
    const includeBalance = inputs.include_balance !== false;
    const includeDocs = inputs.include_docs !== false;
    const includeGovernor = inputs.include_governor || false;
    const shopFeePct = inputs.shop_fee_pct || 0;

    const prop = PROP_TYPES[propType] || PROP_TYPES.metal_3;
    const gov = PROP_TYPES.constant_speed_governor;
    const laborRate = LABOR_RATES[laborTier] || 105;

    let totalHours = 0;
    let laborCost = 0;
    let partsTotal = 0;
    const phases = [];

    if (includeDemount) {
      const hours = prop.demountHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Prop Demount", hours, labor_cost: cost, description: "Remove propeller from engine flange, inspect hub" });
    }

    // Overhaul itself
    const overhaulLaborHours = 8; // standard bench time
    const overhaulLabor = overhaulLaborHours * laborRate;
    const overhaulParts = Math.round(prop.baseOverhaul * 0.60);
    totalHours += overhaulLaborHours;
    laborCost += overhaulLabor;
    partsTotal += overhaulParts;
    phases.push({ phase: "Overhaul (teardown + recondition)", hours: overhaulLaborHours, labor_cost: overhaulLabor, parts_cost: overhaulParts, description: "Disassemble, NDT inspect blades, reface, repaint, reassemble to spec" });

    if (includeRemount) {
      const hours = prop.remountHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Prop Remount", hours, labor_cost: cost, description: "Reinstall propeller, torque to spec, safety wire" });
    }

    if (includeBalance) {
      const hours = prop.balanceHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Dynamic Balance", hours, labor_cost: cost, description: "Spin balance with accelerometer, add weights as needed" });
    }

    if (includeDocs) {
      const hours = prop.docHours;
      const cost = hours * laborRate;
      totalHours += hours;
      laborCost += cost;
      phases.push({ phase: "Documentation & 8130-3", hours, labor_cost: cost, description: "Release certificate, logbook entry" });
    }

    // Optional governor overhaul
    if (includeGovernor) {
      const govParts = Math.round(gov.baseOverhaul * 0.55);
      const govLaborHours = gov.demountHours + 6 + gov.remountHours;
      const govLabor = govLaborHours * laborRate;
      totalHours += govLaborHours;
      laborCost += govLabor;
      partsTotal += govParts;
      phases.push({ phase: "Prop Governor Overhaul", hours: govLaborHours, labor_cost: govLabor, parts_cost: govParts, description: "Demount, overhaul, remount constant-speed governor" });
    }

    const laborTotal = Math.round(laborCost);
    const shopFee = Math.round((partsTotal + laborTotal) * (shopFeePct / 100));
    const grandTotal = partsTotal + laborTotal + shopFee;
    const calendarDays = Math.ceil(totalHours / 8);

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.prop_overhaul.v1',
      version: 'v1',
      result: {
        prop_type: prop.label,
        phases,
        parts_total: partsTotal,
        labor_total: laborTotal,
        shop_fee: shopFee,
        grand_total: grandTotal,
        total_labor_hours: Math.round(totalHours * 10) / 10,
        estimated_calendar_days: calendarDays,
        labor_rate: laborRate,
        governor_included: includeGovernor,
      },
      confidence: 0.85,
      evidence: [
        `Prop: ${prop.label}`,
        `Labor rate: $${laborRate}/hr`,
        `Demount: ${includeDemount ? prop.demountHours + 'h' : 'skipped'}`,
        `Overhaul parts: $${partsTotal.toLocaleString()}`,
        `Balance: ${includeBalance ? prop.balanceHours + 'h' : 'skipped'}`,
        `Governor: ${includeGovernor ? 'included' : 'not included'}`,
        `Total: ${Math.round(totalHours*10)/10}h labor, ${calendarDays} calendar days`,
        `Grand total: $${grandTotal.toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});