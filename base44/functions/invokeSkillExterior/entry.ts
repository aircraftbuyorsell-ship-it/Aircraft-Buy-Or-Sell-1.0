import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.exterior_refurb.v1 (RFC-242, Batch C)
 * Deterministic exterior refurbishment cost calculator.
 * Migrated from ExteriorRefurbishmentCalculator.jsx — PS-3.2 compliant.
 */

const GA_AIRCRAFT = [
  { value: "c152", exteriorMult: 0.80 }, { value: "c172", exteriorMult: 1.00 },
  { value: "c182", exteriorMult: 1.10 }, { value: "c206", exteriorMult: 1.25 },
  { value: "c210", exteriorMult: 1.15 }, { value: "pa28w", exteriorMult: 1.00 },
  { value: "pa28a", exteriorMult: 1.05 }, { value: "pa32", exteriorMult: 1.20 },
  { value: "sr20", exteriorMult: 1.05 }, { value: "sr22", exteriorMult: 1.05 },
  { value: "sr22t", exteriorMult: 1.05 }, { value: "a36", exteriorMult: 1.10 },
  { value: "m20", exteriorMult: 0.95 }, { value: "da40", exteriorMult: 1.00 },
  { value: "dr400", exteriorMult: 0.90 }, { value: "p2010", exteriorMult: 0.95 },
  { value: "pa34", exteriorMult: 1.35 }, { value: "pa44", exteriorMult: 1.35 },
  { value: "be58", exteriorMult: 1.40 }, { value: "da42", exteriorMult: 1.20 },
  { value: "da62", exteriorMult: 1.30 }, { value: "c90", exteriorMult: 2.20 },
  { value: "ka350", exteriorMult: 2.80 }, { value: "pc12", exteriorMult: 2.00 },
  { value: "c208", exteriorMult: 2.10 }, { value: "tbm930", exteriorMult: 1.80 },
  { value: "sf50", exteriorMult: 1.60 }, { value: "m2", exteriorMult: 3.00 },
  { value: "p100", exteriorMult: 3.00 }, { value: "r44", exteriorMult: 1.20 },
  { value: "r66", exteriorMult: 1.30 }, { value: "b206", exteriorMult: 1.50 },
];

const CONDITION_FACTORS = { good: 0.85, fair: 1.0, poor: 1.35 };
const LABOR_RATE = 95;

const SERVICES = [
  { id: "strip_paint", label: "Full Strip & Paint", basePrice: 22500, hours: 80 },
  { id: "partial_repaint", label: "Partial Repaint / Touch-Up", basePrice: 5500, hours: 24 },
  { id: "polish", label: "Bare Metal Polishing", basePrice: 4000, hours: 32 },
  { id: "deice_boots", label: "Deice Boot Replacement", basePrice: 6000, hours: 16 },
  { id: "windshield", label: "Windshield / Window Replacement", basePrice: 2800, hours: 10 },
  { id: "corrosion", label: "Corrosion Treatment & Prevention", basePrice: 4000, hours: 20 },
  { id: "reg_repaint", label: "Registration Markings Repaint", basePrice: 1000, hours: 4 },
  { id: "control_surf", label: "Control Surface Recovering", basePrice: 3500, hours: 18 },
  { id: "striping", label: "Custom Striping / Livery Design", basePrice: 2200, hours: 12 },
  { id: "leading_edge", label: "Leading Edge Polish / Protection", basePrice: 1500, hours: 8 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const aircraftValue = inputs.aircraft || inputs.aircraft_value || 'c172';
    const condition = inputs.condition || 'fair';
    const selectedServices = inputs.selected_services || {};

    const ac = GA_AIRCRAFT.find(a => a.value === aircraftValue) || GA_AIRCRAFT[1];
    const condFactor = CONDITION_FACTORS[condition] || 1.0;

    let partsTotal = 0;
    let laborHours = 0;
    const lineItems = [];

    for (const s of SERVICES) {
      if (!selectedServices[s.id]) continue;
      const parts = Math.round(s.basePrice * ac.exteriorMult);
      const labor = Math.round(s.hours * ac.exteriorMult);
      const laborCost = labor * LABOR_RATE * condFactor;
      const lineTotal = parts + laborCost;
      partsTotal += parts;
      laborHours += labor;
      lineItems.push({ id: s.id, label: s.label, parts, labor_hours: labor, labor_cost: Math.round(laborCost), line_total: Math.round(lineTotal) });
    }

    const laborTotal = laborHours * LABOR_RATE * condFactor;
    const grandTotal = partsTotal + laborTotal;

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.exterior_refurb.v1',
      version: 'v1',
      result: {
        line_items: lineItems,
        parts_total: Math.round(partsTotal),
        labor_hours: Math.round(laborHours),
        labor_total: Math.round(laborTotal),
        grand_total: Math.round(grandTotal),
        aircraft: aircraftValue,
        exterior_mult: ac.exteriorMult,
        condition,
        condition_factor: condFactor,
        labor_rate: LABOR_RATE,
      },
      confidence: 0.88,
      evidence: [
        `Aircraft: ${aircraftValue} (${ac.exteriorMult}× surface area)`,
        `Condition: ${condition} (${condFactor}× factor)`,
        `Labor rate: $${LABOR_RATE}/hr`,
        `${lineItems.length} service(s) selected`,
        `Total: $${Math.round(grandTotal).toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});