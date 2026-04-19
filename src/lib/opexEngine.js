// Operational Cost engine — reserves, maintenance exposure, service accessibility

// Per-hour reserve rates (USD/hr) by aircraft class — industry averages
export const RESERVE_RATES = {
  cessna172:   { engine: 18, prop: 3,  inspection: 8  },
  cirrus_sr22: { engine: 32, prop: 6,  inspection: 15 },
  baron_58:    { engine: 55, prop: 10, inspection: 22 },
  king_air:    { engine: 180, prop: 25, inspection: 55 },
};

// Aircraft presets with TBO / TBO-prop, nominal fuel burn (gph)
export const AIRCRAFT_PRESETS = [
  { id: "cessna172",   name: "Cessna 172",         fuel: 45,  maintenance: 35,  insurance_yr: 1800,  hangar_yr: 3600,  tbo: 2000, tbo_prop: 2400, gph: 8,   class: "piston_single" },
  { id: "cirrus_sr22", name: "Cirrus SR22",        fuel: 95,  maintenance: 85,  insurance_yr: 6500,  hangar_yr: 6000,  tbo: 2000, tbo_prop: 2400, gph: 16,  class: "piston_single" },
  { id: "baron_58",    name: "Beechcraft Baron 58", fuel: 180, maintenance: 140, insurance_yr: 9000,  hangar_yr: 7200,  tbo: 1700, tbo_prop: 2000, gph: 32,  class: "piston_twin" },
  { id: "king_air",    name: "King Air B200",       fuel: 650, maintenance: 450, insurance_yr: 28000, hangar_yr: 18000, tbo: 3600, tbo_prop: 4000, gph: 100, class: "turboprop" },
];

// Estimate upcoming maintenance exposure (next 12 mo risk)
export function assessMaintenanceRisk({ annualHours, engineHoursToTBO, propHoursToTBO, annualOverdue, upcomingCost }) {
  let score = 0; // 0 = clean, 100 = heavy exposure
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

// Service accessibility score 0–100 based on region + parts availability
export function assessServiceAccessibility({ serviceCenters, partsAccessibility, avionicsSupport }) {
  // serviceCenters: 0 (none nearby) → 3 (abundant)
  // partsAccessibility: "poor" | "fair" | "good" | "excellent"
  // avionicsSupport: "legacy" | "supported" | "modern"
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

// Ownership clarity: how transparent / predictable is total cost picture
export function assessOwnershipClarity({ maintenanceScore, serviceScore, annualOverdue, utilizationSweetspot }) {
  // Higher clarity = lower maintenance risk + higher service access + fresh inspection + reasonable utilization
  let clarity = 100;
  clarity -= maintenanceScore * 0.4;           // heavy exposure reduces clarity
  clarity -= (100 - serviceScore) * 0.25;      // poor service reduces clarity
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