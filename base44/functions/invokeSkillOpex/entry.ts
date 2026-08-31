import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.opex.v1 (RFC-211, Batch B)
 * Migrated from src/lib/opexEngine.js — PS-3.2 compliance.
 * Pure deterministic math, no LLM. Latency budget < 500ms.
 */

const RESERVE_RATES = {
  cessna172:   { engine: 18, prop: 3,  inspection: 8  },
  cirrus_sr22: { engine: 32, prop: 6,  inspection: 15 },
  baron_58:    { engine: 55, prop: 10, inspection: 22 },
  king_air:    { engine: 180, prop: 25, inspection: 55 },
};

const AIRCRAFT_PRESETS = [
  { id: "cessna172",   name: "Cessna 172",          fuel: 45,  maintenance: 35,  insurance_yr: 1800,  hangar_yr: 3600,  tbo: 2000, tbo_prop: 2400 },
  { id: "cirrus_sr22", name: "Cirrus SR22",         fuel: 95,  maintenance: 85,  insurance_yr: 6500,  hangar_yr: 6000,  tbo: 2000, tbo_prop: 2400 },
  { id: "baron_58",    name: "Beechcraft Baron 58",  fuel: 180, maintenance: 140, insurance_yr: 9000,  hangar_yr: 7200,  tbo: 1700, tbo_prop: 2000 },
  { id: "king_air",    name: "King Air B200",        fuel: 650, maintenance: 450, insurance_yr: 28000, hangar_yr: 18000, tbo: 3600, tbo_prop: 4000 },
];

const LOCATION_RATES = {
  "north-america": { fuel: 1.0, maintenance: 1.0, hangar: 1.0, insurance: 1.0, label: "North America" },
  "europe":        { fuel: 1.6, maintenance: 1.2, hangar: 1.4, insurance: 1.1, label: "Europe" },
  "asia":          { fuel: 1.3, maintenance: 1.1, hangar: 1.2, insurance: 1.2, label: "Asia" },
  "south-america": { fuel: 1.2, maintenance: 1.0, hangar: 0.8, insurance: 1.1, label: "South America" },
  "africa":        { fuel: 1.4, maintenance: 1.3, hangar: 0.7, insurance: 1.3, label: "Africa" },
  "oceania":       { fuel: 1.5, maintenance: 1.2, hangar: 1.3, insurance: 1.1, label: "Oceania" },
};

function assessMaintenanceRisk({ annualHours, engineHoursToTBO, propHoursToTBO, annualOverdue, upcomingCost }) {
  let score = 0;
  const projectedEngineGap = engineHoursToTBO - annualHours;
  const projectedPropGap = propHoursToTBO - annualHours;
  if (projectedEngineGap < 0) score += 40;
  else if (projectedEngineGap < 200) score += 25;
  else if (projectedEngineGap < 500) score += 10;
  if (projectedPropGap < 0) score += 20;
  else if (projectedPropGap < 200) score += 10;
  if (annualOverdue) score += 25;
  if (upcomingCost > 20000) score += 15;
  else if (upcomingCost > 5000) score += 8;
  score = Math.min(100, score);
  let label, color;
  if (score >= 60) { label = "High Exposure"; color = "#C0392B"; }
  else if (score >= 30) { label = "Moderate"; color = "#E8A83A"; }
  else if (score >= 10) { label = "Low"; color = "#185FA5"; }
  else { label = "Clean"; color = "#0F7A56"; }
  return { score, label, color, projectedEngineGap, projectedPropGap };
}

function assessServiceAccessibility({ serviceCenters, partsAccessibility, avionicsSupport }) {
  const centerScore = (serviceCenters / 3) * 40;
  const partsMap = { poor: 5, fair: 15, good: 25, excellent: 35 };
  const avionicsMap = { legacy: 5, supported: 15, modern: 25 };
  const total = Math.round(centerScore + (partsMap[partsAccessibility] || 15) + (avionicsMap[avionicsSupport] || 15));
  let label, color;
  if (total >= 80) { label = "Excellent"; color = "#0F7A56"; }
  else if (total >= 60) { label = "Good"; color = "#185FA5"; }
  else if (total >= 40) { label = "Fair"; color = "#E8A83A"; }
  else { label = "Limited"; color = "#C0392B"; }
  return { score: total, label, color };
}

function assessOwnershipClarity({ maintenanceScore, serviceScore, annualOverdue, utilizationSweetspot }) {
  let clarity = 100;
  clarity -= maintenanceScore * 0.4;
  clarity -= (100 - serviceScore) * 0.25;
  if (annualOverdue) clarity -= 15;
  if (!utilizationSweetspot) clarity -= 10;
  clarity = Math.max(0, Math.min(100, Math.round(clarity)));
  let label, color, verdict;
  if (clarity >= 80) { label = "Highly Transparent"; color = "#0F7A56"; verdict = "Ownership costs are well-understood and predictable. Strong buyer confidence signal."; }
  else if (clarity >= 60) { label = "Clear"; color = "#185FA5"; verdict = "Ownership picture is mostly clear with minor uncertainties — acceptable for most buyers."; }
  else if (clarity >= 40) { label = "Needs Context"; color = "#E8A83A"; verdict = "Some cost factors carry risk. Seller should proactively document them to reduce buyer hesitation."; }
  else { label = "Opaque"; color = "#C0392B"; verdict = "Significant hidden-cost risks. Buyer will demand discount or comprehensive pre-buy inspection."; }
  return { score: clarity, label, color, verdict };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const presetId = inputs.aircraft_preset_id || 'cirrus_sr22';
    const preset = AIRCRAFT_PRESETS.find(p => p.id === presetId) || AIRCRAFT_PRESETS[1];

    const annualHours = Number(inputs.annual_hours) || 200;
    const engineHours = Number(inputs.engine_hours) || 900;
    const propHours = Number(inputs.prop_hours) || 400;
    const annualOverdue = !!inputs.annual_overdue;
    const upcomingCost = Number(inputs.upcoming_cost) || 5000;

    const fuelRate = Number(inputs.fuel_rate) || preset.fuel;
    const maintRate = Number(inputs.maint_rate) || preset.maintenance;
    const insuranceYr = Number(inputs.insurance_yr) || preset.insurance_yr;
    const hangarYr = Number(inputs.hangar_yr) || preset.hangar_yr;

    const location = inputs.location_region || 'north-america';
    const locationMult = LOCATION_RATES[location] || LOCATION_RATES['north-america'];

    const serviceCenters = Number(inputs.service_centers) || 2;
    const partsAccessibility = inputs.parts_accessibility || 'good';
    const avionicsSupport = inputs.avionics_support || 'supported';

    const reserves = RESERVE_RATES[preset.id] || RESERVE_RATES.cirrus_sr22;
    const engineHoursToTBO = preset.tbo - engineHours;
    const propHoursToTBO = (preset.tbo_prop || preset.tbo) - propHours;
    const engineReserveYr = reserves.engine * annualHours;
    const propReserveYr = reserves.prop * annualHours;
    const inspectionReserveYr = reserves.inspection * annualHours;

    const adjustedFuelRate = fuelRate * locationMult.fuel;
    const adjustedMaintRate = maintRate * locationMult.maintenance;
    const adjustedHangarYr = hangarYr * locationMult.hangar;
    const adjustedInsuranceYr = insuranceYr * locationMult.insurance;

    const variable = annualHours * (adjustedFuelRate + adjustedMaintRate);
    const fixed = adjustedInsuranceYr + adjustedHangarYr;
    const reservesTotal = engineReserveYr + propReserveYr + inspectionReserveYr;
    const totalAnnual = variable + fixed + reservesTotal;
    const perHour = annualHours > 0 ? totalAnnual / annualHours : 0;
    const monthly = totalAnnual / 12;

    const maintenance = assessMaintenanceRisk({ annualHours, engineHoursToTBO, propHoursToTBO, annualOverdue, upcomingCost });
    const service = assessServiceAccessibility({ serviceCenters, partsAccessibility, avionicsSupport });
    const utilizationSweetspot = annualHours >= 150 && annualHours <= 600;
    const clarity = assessOwnershipClarity({ maintenanceScore: maintenance.score, serviceScore: service.score, annualOverdue, utilizationSweetspot });

    const result = {
      total_annual: Math.round(totalAnnual),
      monthly: Math.round(monthly),
      per_hour: Math.round(perHour),
      variable: Math.round(variable),
      fixed: Math.round(fixed),
      reserves_total: Math.round(reservesTotal),
      engine_reserve_yr: Math.round(engineReserveYr),
      prop_reserve_yr: Math.round(propReserveYr),
      inspection_reserve_yr: Math.round(inspectionReserveYr),
      clarity_score: clarity.score,
      clarity_label: clarity.label,
      clarity_verdict: clarity.verdict,
      maintenance_risk: maintenance,
      service_score: service,
      aircraft_preset: preset.name,
      location_label: locationMult.label,
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.opex.v1',
      version: 'v1',
      result,
      confidence: 1.0,
      evidence: [
        `Preset: ${preset.name} (TBO ${preset.tbo}h)`,
        `Annual hours: ${annualHours}, engine SMOH: ${engineHours}h`,
        `Location: ${locationMult.label} (fuel ${locationMult.fuel}×)`,
        `Reserves: engine $${reserves.engine}/hr, prop $${reserves.prop}/hr, inspection $${reserves.inspection}/hr`,
        `Clarity: ${clarity.score}/100 — ${clarity.label}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});