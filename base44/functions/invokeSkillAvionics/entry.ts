import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.avionics_upgrade.v1 (RFC-241, Batch C)
 * Deterministic avionics upgrade cost calculator.
 * Migrated from AvionicsUpgradeCalculator.jsx — PS-3.2 compliant.
 */

const GA_AIRCRAFT = [
  { value: "c152", avionicsMult: 0.85 }, { value: "c172", avionicsMult: 1.00 },
  { value: "c182", avionicsMult: 1.10 }, { value: "c206", avionicsMult: 1.20 },
  { value: "c210", avionicsMult: 1.15 }, { value: "pa28w", avionicsMult: 1.00 },
  { value: "pa28a", avionicsMult: 1.00 }, { value: "pa32", avionicsMult: 1.15 },
  { value: "sr20", avionicsMult: 1.05 }, { value: "sr22", avionicsMult: 1.05 },
  { value: "sr22t", avionicsMult: 1.10 }, { value: "a36", avionicsMult: 1.10 },
  { value: "m20", avionicsMult: 1.00 }, { value: "da40", avionicsMult: 1.00 },
  { value: "dr400", avionicsMult: 0.90 }, { value: "p2010", avionicsMult: 0.95 },
  { value: "pa34", avionicsMult: 1.25 }, { value: "pa44", avionicsMult: 1.25 },
  { value: "be58", avionicsMult: 1.30 }, { value: "da42", avionicsMult: 1.25 },
  { value: "da62", avionicsMult: 1.30 }, { value: "c90", avionicsMult: 1.60 },
  { value: "ka350", avionicsMult: 1.80 }, { value: "pc12", avionicsMult: 1.60 },
  { value: "c208", avionicsMult: 1.50 }, { value: "tbm930", avionicsMult: 1.55 },
  { value: "sf50", avionicsMult: 1.50 }, { value: "m2", avionicsMult: 2.00 },
  { value: "p100", avionicsMult: 2.00 }, { value: "r44", avionicsMult: 1.40 },
  { value: "r66", avionicsMult: 1.50 }, { value: "b206", avionicsMult: 1.60 },
];

const LABOR_RATES = [85, 105, 125, 150];

const UPGRADES = [
  { id: "gps_nav", label: "GPS Navigator (GTN 650 / Avidyne IFD)", unitPrice: 14500, installHours: 16 },
  { id: "adsb_transponder", label: "ADS-B Transponder (GTX 345)", unitPrice: 4200, installHours: 6 },
  { id: "audio_panel", label: "Audio Panel (GMA 350 / PMA450)", unitPrice: 2800, installHours: 4 },
  { id: "autopilot", label: "Autopilot System (GFC 500 / GFC 700)", unitPrice: 11000, installHours: 24 },
  { id: "glass_panel", label: "Glass Panel / EFIS (G3X Touch per screen)", unitPrice: 12500, installHours: 20 },
  { id: "traffic_weather", label: "Traffic/Weather Module (GDL 52)", unitPrice: 1600, installHours: 3 },
  { id: "adsb_in", label: "ADS-B In (Stratus / portable integration)", unitPrice: 900, installHours: 2 },
  { id: "com_radio", label: "COM Radio (Garmin GTR 225)", unitPrice: 2200, installHours: 5 },
  { id: "nav_radio", label: "VOR/NAV Radio (Garmin GNC 355)", unitPrice: 6950, installHours: 12 },
  { id: "elt", label: "ELT 406 MHz (Artex)", unitPrice: 850, installHours: 3 },
  { id: "panel_rewire", label: "Panel Rewire / Harness Replacement", unitPrice: 3500, installHours: 30 },
  { id: "adsb_out_install", label: "ADS-B Out Mandate Compliance Kit", unitPrice: 1800, installHours: 8 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const aircraftValue = inputs.aircraft || inputs.aircraft_value || 'c172';
    const laborRate = LABOR_RATES[inputs.labor_tier || 1] || 105;
    const selectedItems = inputs.selected_items || {};

    const ac = GA_AIRCRAFT.find(a => a.value === aircraftValue) || GA_AIRCRAFT[1];

    let partsTotal = 0;
    let laborHours = 0;
    const lineItems = [];

    for (const u of UPGRADES) {
      const qty = selectedItems[u.id] || 0;
      if (qty === 0) continue;
      const parts = u.unitPrice * qty;
      const labor = u.installHours * ac.avionicsMult * qty;
      const lineTotal = parts + labor * laborRate;
      partsTotal += parts;
      laborHours += labor;
      lineItems.push({ id: u.id, label: u.label, qty, parts, labor_hours: labor, line_total: lineTotal });
    }

    const laborTotal = laborHours * laborRate;
    const grandTotal = partsTotal + laborTotal;

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.avionics_upgrade.v1',
      version: 'v1',
      result: {
        line_items: lineItems,
        parts_total: Math.round(partsTotal),
        labor_hours: Math.round(laborHours * 10) / 10,
        labor_total: Math.round(laborTotal),
        grand_total: Math.round(grandTotal),
        aircraft: aircraftValue,
        avionics_mult: ac.avionicsMult,
        labor_rate: laborRate,
      },
      confidence: 0.90,
      evidence: [
        `Aircraft: ${aircraftValue} (${ac.avionicsMult}× panel complexity)`,
        `Labor rate: $${laborRate}/hr`,
        `${lineItems.length} upgrade(s) selected`,
        `Parts: $${Math.round(partsTotal).toLocaleString()}, Labor: ${Math.round(laborHours*10)/10}h`,
        `Total: $${Math.round(grandTotal).toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});