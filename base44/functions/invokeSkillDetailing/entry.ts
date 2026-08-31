import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.detailing.v1 (RFC-244, Batch C)
 * Deterministic aircraft detailing cost calculator.
 * Migrated from AircraftDetailingCalculator.jsx — PS-3.2 compliant.
 * Free lead magnet — no credit cost.
 */

const GA_AIRCRAFT = [
  { value: "c152", exteriorMult: 0.80, interiorMult: 0.75, interiorSeats: 2 },
  { value: "c172", exteriorMult: 1.00, interiorMult: 1.00, interiorSeats: 4 },
  { value: "c182", exteriorMult: 1.10, interiorMult: 1.05, interiorSeats: 4 },
  { value: "c206", exteriorMult: 1.25, interiorMult: 1.20, interiorSeats: 6 },
  { value: "c210", exteriorMult: 1.15, interiorMult: 1.10, interiorSeats: 6 },
  { value: "pa28w", exteriorMult: 1.00, interiorMult: 1.00, interiorSeats: 4 },
  { value: "pa28a", exteriorMult: 1.05, interiorMult: 1.05, interiorSeats: 4 },
  { value: "pa32", exteriorMult: 1.20, interiorMult: 1.15, interiorSeats: 6 },
  { value: "sr20", exteriorMult: 1.05, interiorMult: 1.10, interiorSeats: 4 },
  { value: "sr22", exteriorMult: 1.05, interiorMult: 1.10, interiorSeats: 4 },
  { value: "sr22t", exteriorMult: 1.05, interiorMult: 1.10, interiorSeats: 4 },
  { value: "a36", exteriorMult: 1.10, interiorMult: 1.10, interiorSeats: 6 },
  { value: "m20", exteriorMult: 0.95, interiorMult: 0.95, interiorSeats: 4 },
  { value: "da40", exteriorMult: 1.00, interiorMult: 1.00, interiorSeats: 4 },
  { value: "dr400", exteriorMult: 0.90, interiorMult: 0.90, interiorSeats: 4 },
  { value: "p2010", exteriorMult: 0.95, interiorMult: 0.95, interiorSeats: 4 },
  { value: "pa34", exteriorMult: 1.35, interiorMult: 1.20, interiorSeats: 6 },
  { value: "pa44", exteriorMult: 1.35, interiorMult: 1.15, interiorSeats: 4 },
  { value: "be58", exteriorMult: 1.40, interiorMult: 1.20, interiorSeats: 6 },
  { value: "da42", exteriorMult: 1.20, interiorMult: 1.10, interiorSeats: 4 },
  { value: "da62", exteriorMult: 1.30, interiorMult: 1.25, interiorSeats: 7 },
  { value: "c90", exteriorMult: 2.20, interiorMult: 1.50, interiorSeats: 7 },
  { value: "ka350", exteriorMult: 2.80, interiorMult: 1.80, interiorSeats: 9 },
  { value: "pc12", exteriorMult: 2.00, interiorMult: 1.60, interiorSeats: 9 },
  { value: "c208", exteriorMult: 2.10, interiorMult: 1.50, interiorSeats: 9 },
  { value: "tbm930", exteriorMult: 1.80, interiorMult: 1.40, interiorSeats: 6 },
  { value: "sf50", exteriorMult: 1.60, interiorMult: 1.40, interiorSeats: 5 },
  { value: "m2", exteriorMult: 3.00, interiorMult: 1.80, interiorSeats: 7 },
  { value: "p100", exteriorMult: 3.00, interiorMult: 1.80, interiorSeats: 6 },
  { value: "r44", exteriorMult: 1.20, interiorMult: 1.10, interiorSeats: 4 },
  { value: "r66", exteriorMult: 1.30, interiorMult: 1.20, interiorSeats: 5 },
  { value: "b206", exteriorMult: 1.50, interiorMult: 1.30, interiorSeats: 5 },
];

const SERVICE_TIERS = { wash_wax: 0.50, standard: 1.0, premium_show: 1.60 };
const LABOR_RATE = 75;

const EXTERIOR_SERVICES = [
  { id: "hand_wash", label: "Hand Wash & Dry", basePrice: 250, hours: 3, perSeat: false },
  { id: "wax_sealant", label: "Carnauba Wax / Paint Sealant", basePrice: 450, hours: 5, perSeat: false },
  { id: "ceramic_coating", label: "Ceramic Coating (2-year)", basePrice: 1800, hours: 12, perSeat: false },
  { id: "brightwork", label: "Brightwork Polishing", basePrice: 600, hours: 6, perSeat: false },
  { id: "windshield_polish", label: "Windshield / Window Polish & Seal", basePrice: 350, hours: 3, perSeat: false },
  { id: "belly_degrease", label: "Belly Cleaning & Degreasing", basePrice: 400, hours: 4, perSeat: false },
  { id: "engine_bay", label: "Engine Compartment Cleaning", basePrice: 300, hours: 3, perSeat: false },
  { id: "landing_gear", label: "Landing Gear Detail & Lube", basePrice: 250, hours: 2, perSeat: false },
  { id: "wheel_polish", label: "Wheel & Brake Polishing", basePrice: 200, hours: 2, perSeat: false },
  { id: "paint_correction", label: "Paint Correction / Swirl Removal", basePrice: 800, hours: 8, perSeat: false },
];

const INTERIOR_SERVICES = [
  { id: "vacuum_shampoo", label: "Vacuum & Carpet Shampoo", basePrice: 200, hours: 3, perSeat: false },
  { id: "deep_clean", label: "Interior Deep Clean & Sanitize", basePrice: 350, hours: 4, perSeat: false },
  { id: "leather_condition", label: "Leather Cleaning & Conditioning", basePrice: 300, hours: 3, perSeat: true },
  { id: "headliner_clean", label: "Headliner & Side Panel Clean", basePrice: 250, hours: 3, perSeat: false },
  { id: "cockpit_detail", label: "Cockpit / Panel Detail", basePrice: 200, hours: 2, perSeat: false },
  { id: "glass_interior", label: "Interior Glass Clean & Anti-Fog", basePrice: 100, hours: 1, perSeat: false },
  { id: "odor_removal", label: "Ozone Odor Removal Treatment", basePrice: 250, hours: 2, perSeat: false },
  { id: "fabric_protect", label: "Fabric & Carpet Protection Spray", basePrice: 150, hours: 2, perSeat: false },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const aircraftValue = inputs.aircraft || inputs.aircraft_value || 'c172';
    const tier = inputs.tier || 'standard';
    const extSelected = inputs.exterior_services || {};
    const intSelected = inputs.interior_services || {};

    const ac = GA_AIRCRAFT.find(a => a.value === aircraftValue) || GA_AIRCRAFT[1];
    const tierFactor = SERVICE_TIERS[tier] || 1.0;
    const detailMult = (ac.exteriorMult + ac.interiorMult) / 2;

    let partsTotal = 0;
    let laborHours = 0;
    const lineItems = [];

    for (const s of EXTERIOR_SERVICES) {
      if (!extSelected[s.id]) continue;
      const qty = s.perSeat ? ac.interiorSeats : 1;
      const parts = Math.round(s.basePrice * detailMult * tierFactor * qty);
      const labor = Math.round(s.hours * detailMult * qty);
      const laborCost = labor * LABOR_RATE;
      partsTotal += parts;
      laborHours += labor;
      lineItems.push({ category: "Exterior", label: s.perSeat ? `${s.label} ×${qty}` : s.label, parts, labor_hours: labor, line_total: Math.round(parts + laborCost) });
    }

    for (const s of INTERIOR_SERVICES) {
      if (!intSelected[s.id]) continue;
      const qty = s.perSeat ? ac.interiorSeats : 1;
      const parts = Math.round(s.basePrice * detailMult * tierFactor * qty);
      const labor = Math.round(s.hours * detailMult * qty);
      const laborCost = labor * LABOR_RATE;
      partsTotal += parts;
      laborHours += labor;
      lineItems.push({ category: "Interior", label: s.perSeat ? `${s.label} ×${qty}` : s.label, parts, labor_hours: labor, line_total: Math.round(parts + laborCost) });
    }

    const laborTotal = laborHours * LABOR_RATE;
    const grandTotal = partsTotal + laborTotal;

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.detailing.v1',
      version: 'v1',
      result: {
        line_items: lineItems,
        parts_total: Math.round(partsTotal),
        labor_hours: Math.round(laborHours),
        labor_total: Math.round(laborTotal),
        grand_total: Math.round(grandTotal),
        aircraft: aircraftValue,
        detail_mult: Math.round(detailMult * 100) / 100,
        tier,
        tier_factor: tierFactor,
        labor_rate: LABOR_RATE,
      },
      confidence: 0.90,
      evidence: [
        `Aircraft: ${aircraftValue} (${Math.round(detailMult*100)/100}× detail factor)`,
        `Tier: ${tier} (${tierFactor}×)`,
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