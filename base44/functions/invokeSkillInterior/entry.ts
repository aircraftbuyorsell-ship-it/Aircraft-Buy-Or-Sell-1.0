import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.interior_refurb.v1 (RFC-243, Batch C)
 * Deterministic interior refurbishment cost calculator.
 * Migrated from InteriorRefurbishmentCalculator.jsx — PS-3.2 compliant.
 */

const GA_AIRCRAFT = [
  { value: "c152", interiorMult: 0.75, interiorSeats: 2 }, { value: "c172", interiorMult: 1.00, interiorSeats: 4 },
  { value: "c182", interiorMult: 1.05, interiorSeats: 4 }, { value: "c206", interiorMult: 1.20, interiorSeats: 6 },
  { value: "c210", interiorMult: 1.10, interiorSeats: 6 }, { value: "pa28w", interiorMult: 1.00, interiorSeats: 4 },
  { value: "pa28a", interiorMult: 1.05, interiorSeats: 4 }, { value: "pa32", interiorMult: 1.15, interiorSeats: 6 },
  { value: "sr20", interiorMult: 1.10, interiorSeats: 4 }, { value: "sr22", interiorMult: 1.10, interiorSeats: 4 },
  { value: "sr22t", interiorMult: 1.10, interiorSeats: 4 }, { value: "a36", interiorMult: 1.10, interiorSeats: 6 },
  { value: "m20", interiorMult: 0.95, interiorSeats: 4 }, { value: "da40", interiorMult: 1.00, interiorSeats: 4 },
  { value: "dr400", interiorMult: 0.90, interiorSeats: 4 }, { value: "p2010", interiorMult: 0.95, interiorSeats: 4 },
  { value: "pa34", interiorMult: 1.20, interiorSeats: 6 }, { value: "pa44", interiorMult: 1.15, interiorSeats: 4 },
  { value: "be58", interiorMult: 1.20, interiorSeats: 6 }, { value: "da42", interiorMult: 1.10, interiorSeats: 4 },
  { value: "da62", interiorMult: 1.25, interiorSeats: 7 }, { value: "c90", interiorMult: 1.50, interiorSeats: 7 },
  { value: "ka350", interiorMult: 1.80, interiorSeats: 9 }, { value: "pc12", interiorMult: 1.60, interiorSeats: 9 },
  { value: "c208", interiorMult: 1.50, interiorSeats: 9 }, { value: "tbm930", interiorMult: 1.40, interiorSeats: 6 },
  { value: "sf50", interiorMult: 1.40, interiorSeats: 5 }, { value: "m2", interiorMult: 1.80, interiorSeats: 7 },
  { value: "p100", interiorMult: 1.80, interiorSeats: 6 }, { value: "r44", interiorMult: 1.10, interiorSeats: 4 },
  { value: "r66", interiorMult: 1.20, interiorSeats: 5 }, { value: "b206", interiorMult: 1.30, interiorSeats: 5 },
];

const SEAT_TYPES = { standard: 2200, premium: 3800, ultra: 5500, bench: 4500 };
const MATERIAL_GRADES = { economy: 0.80, standard: 1.0, premium: 1.35, ultra: 1.85 };
const LABOR_RATE = 95;

const SERVICES = [
  { id: "carpet", label: "Cabin Carpet Replacement", basePrice: 3500, hours: 16, perSeat: false },
  { id: "headliner", label: "Headliner Replacement", basePrice: 2200, hours: 14, perSeat: false },
  { id: "side_panels", label: "Side Panels / Cabinetry Refinish", basePrice: 3200, hours: 24, perSeat: false },
  { id: "placards", label: "Placards & Trim Kit", basePrice: 900, hours: 6, perSeat: false },
  { id: "soundproof", label: "Soundproofing / Insulation Upgrade", basePrice: 2800, hours: 20, perSeat: false },
  { id: "seat_belts", label: "Seat Belts / Restraints Replacement", basePrice: 650, hours: 4, perSeat: true },
  { id: "cockpit_panel", label: "Cockpit Panel Cover / Yoke Boots", basePrice: 1100, hours: 8, perSeat: false },
  { id: "cabinetry", label: "Cabinetry Rebuild / Refinish", basePrice: 4500, hours: 32, perSeat: false },
  { id: "lighting", label: "Cabin LED Lighting Upgrade", basePrice: 1800, hours: 10, perSeat: false },
  { id: "usb_power", label: "USB / Power Outlets Installation", basePrice: 750, hours: 6, perSeat: false },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const aircraftValue = inputs.aircraft || inputs.aircraft_value || 'c172';
    const seatType = inputs.seat_type || 'standard';
    const material = inputs.material_grade || 'standard';
    const selectedServices = inputs.selected_services || {};
    const seatOverride = inputs.seat_override || null;

    const ac = GA_AIRCRAFT.find(a => a.value === aircraftValue) || GA_AIRCRAFT[1];
    const seats = seatOverride !== null ? seatOverride : ac.interiorSeats;
    const seatPrice = SEAT_TYPES[seatType] || 2200;
    const matFactor = MATERIAL_GRADES[material] || 1.0;

    let partsTotal = 0;
    let laborHours = 0;
    const lineItems = [];

    // Seats
    const seatParts = seatPrice * seats;
    const seatLabor = 12 * seats;
    const seatLaborCost = seatLabor * LABOR_RATE;
    const seatTotal = seatParts + seatLaborCost;
    partsTotal += seatParts;
    laborHours += seatLabor;
    lineItems.push({ label: `Seats (${seatType}) ×${seats}`, parts: seatParts, labor_hours: seatLabor, line_total: Math.round(seatTotal) });

    for (const s of SERVICES) {
      if (!selectedServices[s.id]) continue;
      const qty = s.perSeat ? seats : 1;
      const parts = Math.round(s.basePrice * matFactor * ac.interiorMult * qty);
      const labor = s.hours * qty;
      const laborCost = labor * LABOR_RATE;
      const lineTotal = parts + laborCost;
      partsTotal += parts;
      laborHours += labor;
      lineItems.push({ label: s.perSeat ? `${s.label} ×${qty}` : s.label, parts, labor_hours: labor, line_total: Math.round(lineTotal) });
    }

    const laborTotal = laborHours * LABOR_RATE;
    const grandTotal = partsTotal + laborTotal;

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.interior_refurb.v1',
      version: 'v1',
      result: {
        line_items: lineItems,
        parts_total: Math.round(partsTotal),
        labor_hours: Math.round(laborHours),
        labor_total: Math.round(laborTotal),
        grand_total: Math.round(grandTotal),
        aircraft: aircraftValue,
        interior_mult: ac.interiorMult,
        seats,
        seat_type: seatType,
        material_grade: material,
        material_factor: matFactor,
        labor_rate: LABOR_RATE,
      },
      confidence: 0.88,
      evidence: [
        `Aircraft: ${aircraftValue} (${ac.interiorMult}× cabin size, ${seats} seats)`,
        `Seat type: ${seatType} ($${seatPrice}/ea)`,
        `Material: ${material} (${matFactor}× factor)`,
        `Labor rate: $${LABOR_RATE}/hr`,
        `Total: $${Math.round(grandTotal).toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});