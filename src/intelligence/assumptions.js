/**
 * ABOS Intelligence Layer — cost assumptions.
 *
 * The layer owns its own assumptions rather than borrowing the page-level
 * calculator, for two reasons:
 *
 *  1. Independence. The layer must build and be testable without any part of
 *     the React app. A shared import into `@/lib` couples it to whichever
 *     version of the app happens to be checked out.
 *  2. Honesty. Master spec §27 requires every Commit figure to be labelled
 *     Modelled / Indicative / Assumption / Sourced. That is only meaningful if
 *     the assumptions are written down where the model can point at them.
 *
 * These are industry averages, not quotes. Where a real figure is known for a
 * specific aircraft it always overrides the value here.
 */

/** Per-hour reserve accrual by class, EUR/h. */
export const RESERVE_RATES = {
  piston_single: { engine: 18, propeller: 3, inspection: 8 },
  piston_twin: { engine: 55, propeller: 10, inspection: 22 },
  turboprop: { engine: 180, propeller: 25, inspection: 55 },
  jet_light: { engine: 260, propeller: 0, inspection: 80 },
};

/** Typical overhaul exposure by class, EUR. */
export const OVERHAUL_COST = {
  piston_single: { engine: 38000, propeller: 4500 },
  piston_twin: { engine: 76000, propeller: 9000 },
  turboprop: { engine: 330000, propeller: 28000 },
  jet_light: { engine: 480000, propeller: 0 },
};

/** Full avionics modernisation, EUR — only ever shown as optional. */
export const AVIONICS_MODERNISATION = {
  piston_single: 45000,
  piston_twin: 65000,
  turboprop: 180000,
  jet_light: 320000,
};

/** Interior and exterior refurbishment, EUR. */
export const REFURBISHMENT = {
  piston_single: { interior: 22000, exterior: 16000 },
  piston_twin: { interior: 34000, exterior: 24000 },
  turboprop: { interior: 95000, exterior: 55000 },
  jet_light: { interior: 180000, exterior: 90000 },
};

/**
 * Class presets: hourly fuel and maintenance, annual insurance and hangar,
 * TBO intervals and nominal burn. `match` is used to recognise a type from
 * its make and model string.
 */
export const CLASS_PRESETS = [
  {
    id: "piston_single",
    name: "piston single",
    fuel: 60, maintenance: 45, insurance_yr: 2600, hangar_yr: 4200,
    tbo: 2000, tbo_prop: 2400, gph: 11,
    match: /cessna\s*1[5-8]|cirrus|sr2[02]|pa-?28|archer|arrow|bonanza|mooney|diamond\s*da-?40|da40|grumman|piper\s*warrior/i,
  },
  {
    id: "piston_twin",
    name: "piston twin",
    fuel: 180, maintenance: 140, insurance_yr: 9000, hangar_yr: 7200,
    tbo: 1700, tbo_prop: 2000, gph: 32,
    match: /baron|seneca|aztec|duchess|navajo|cessna\s*3(1|10|40)|da-?42|da42|twin\s*comanche/i,
  },
  {
    id: "turboprop",
    name: "turboprop",
    fuel: 650, maintenance: 450, insurance_yr: 28000, hangar_yr: 18000,
    tbo: 3600, tbo_prop: 4000, gph: 100,
    match: /king\s*air|pc-?12|tbm|caravan|meridian|piaggio|turboprop|pilatus/i,
  },
  {
    id: "jet_light",
    name: "light jet",
    fuel: 1150, maintenance: 900, insurance_yr: 52000, hangar_yr: 36000,
    tbo: 5000, tbo_prop: 0, gph: 180,
    match: /citation|phenom|learjet|hawker|lear\b|cj[1-4]|mustang|vision\s*jet|sf50/i,
  },
];

export const DEFAULT_CLASS = "piston_single";

/** Infer an aircraft class from make, model and engine count. */
export function inferClass({ manufacturer = "", model = "", engineCount = null } = {}) {
  const combined = `${manufacturer || ""} ${model || ""}`.trim();
  if (combined) {
    const preset = CLASS_PRESETS.find((p) => p.match.test(combined));
    if (preset) return preset.id;
  }
  if (Number(engineCount) >= 2) return "piston_twin";
  return DEFAULT_CLASS;
}

export function presetFor(classId) {
  return CLASS_PRESETS.find((p) => p.id === classId) || CLASS_PRESETS[0];
}

/**
 * Maintenance exposure meter, 0 (clean) to 100 (heavy).
 *
 * Only real signals move it: time remaining to overhaul, an inspection that
 * has lapsed on the records available, and cost already projected into the
 * window. Unknown inputs are passed in as the full interval by the caller, so
 * a gap in the data never reads as heavy exposure.
 */
export function assessMaintenanceRisk({
  annualHours = 120,
  engineHoursToTBO,
  propHoursToTBO,
  annualOverdue = false,
  upcomingCost = 0,
} = {}) {
  let score = 0;
  const projectedEngineGap = Number(engineHoursToTBO) - annualHours;
  const projectedPropGap = Number(propHoursToTBO) - annualHours;

  if (Number.isFinite(projectedEngineGap)) {
    if (projectedEngineGap < 0) score += 40;
    else if (projectedEngineGap < 200) score += 25;
    else if (projectedEngineGap < 500) score += 10;
  }
  if (Number.isFinite(projectedPropGap)) {
    if (projectedPropGap < 0) score += 20;
    else if (projectedPropGap < 200) score += 10;
  }
  if (annualOverdue) score += 25;
  if (upcomingCost > 20000) score += 15;
  else if (upcomingCost > 5000) score += 8;

  score = Math.min(100, score);

  const { label, color } = score >= 60 ? { label: "High exposure", color: "#C0392B" }
    : score >= 30 ? { label: "Moderate", color: "#E8A83A" }
      : score >= 10 ? { label: "Low", color: "#185FA5" }
        : { label: "Clean", color: "#0F7A56" };

  return { score, label, color, projectedEngineGap, projectedPropGap };
}
