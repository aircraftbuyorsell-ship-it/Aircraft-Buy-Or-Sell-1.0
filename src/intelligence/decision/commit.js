/**
 * ABOS COMMIT — "What will this specific aircraft expose me to financially
 * after I buy it?" (master spec §3, §26, §27)
 *
 * Commit is not another valuation. It is the ownership exposure model:
 * CAPEX, OPEX, reserves, an MRO calendar over 36 months, and four scenarios.
 *
 * Every number here is MODELLED. Nothing in this file is a quote, a guarantee
 * or a commitment from any service provider, and the UI must say so.
 */

import { field, value, displayName } from "../schema.js";
import { hasValue, DATA_STATUS } from "../provenance.js";
import {
  RESERVE_RATES, OVERHAUL_COST, AVIONICS_MODERNISATION, REFURBISHMENT as REFURB,
  inferClass as inferClassFrom, presetFor as presetForClass, assessMaintenanceRisk,
} from "../assumptions.js";

export const MODELLED_NOTICE =
  "Every figure in Commit is modelled from the data ABOS holds plus stated assumptions. These are not quotes. Actual costs depend on the aircraft's condition, your operation and the providers you use.";

export const CONFIDENCE_KIND = {
  MODELLED: "modelled",
  INDICATIVE: "indicative",
  ASSUMPTION: "assumption",
  SOURCED: "sourced",
};


/**
 * @param {Object} aircraft canonical aircraft (resolve with POLICY.COMMIT)
 * @param {Object} assessment result of assess()
 * @param {Object} [assumptions]
 * @param {number} [assumptions.annualHours=120]
 * @param {number} [assumptions.holdYears=3]
 * @param {string} [assumptions.aircraftClass] override the inferred class
 * @param {number} [assumptions.purchasePrice] override the asking price
 */
export function commit(aircraft, assessment = {}, assumptions = {}) {
  const annualHours = Number(assumptions.annualHours) > 0 ? Number(assumptions.annualHours) : 120;
  const holdYears = Number(assumptions.holdYears) > 0 ? Number(assumptions.holdYears) : 3;
  const currency = assessment.currency || "EUR";

  const klass = assumptions.aircraftClass || inferClass(aircraft);
  const preset = presetFor(aircraft, klass);

  const purchase = Number(assumptions.purchasePrice)
    || assessment.asking
    || assessment.synthesized?.midpoint
    || null;

  // --- Inputs, with what is known and what is assumed -----------------------
  const engineSmoh = value(aircraft, "engine_smoh");
  const engineTbo = value(aircraft, "engine_tbo") || preset.tbo;
  const propSpoh = value(aircraft, "propeller_since_overhaul");
  const propTbo = value(aircraft, "propeller_tbo") || preset.tbo_prop;
  const lastAnnual = value(aircraft, "last_annual");
  const interiorYear = value(aircraft, "interior_year");
  const exteriorYear = value(aircraft, "exterior_year");
  const adCompliance = value(aircraft, "ad_compliance");
  const deferred = value(aircraft, "deferred_maintenance");

  const engineRemaining = Number.isFinite(engineSmoh) ? Math.max(0, engineTbo - engineSmoh) : null;
  const propRemaining = Number.isFinite(propSpoh) ? Math.max(0, propTbo - propSpoh) : null;

  const overhaul = OVERHAUL_COST[klass] || OVERHAUL_COST.piston_single;
  const refurb = REFURB[klass] || REFURB.piston_single;

  // --- CAPEX ----------------------------------------------------------------
  const capexItems = [];

  capexItems.push(exposureItem({
    key: "engine_overhaul",
    label: "Engine overhaul exposure",
    known: Number.isFinite(engineRemaining),
    amount: Number.isFinite(engineRemaining)
      ? overhaul.engine * accrualFraction(engineRemaining, engineTbo, annualHours, holdYears)
      : null,
    full: overhaul.engine,
    kind: Number.isFinite(engineRemaining) ? CONFIDENCE_KIND.MODELLED : CONFIDENCE_KIND.ASSUMPTION,
    detail: Number.isFinite(engineRemaining)
      ? `${Math.round(engineRemaining)} h to TBO of ${engineTbo} h. At ${annualHours} h/year, overhaul falls ${yearsUntil(engineRemaining, annualHours)}.`
      : "Engine time since overhaul is unknown, so the share of a full overhaul falling in your ownership cannot be modelled.",
    point: field(aircraft, "engine_smoh"),
  }));

  capexItems.push(exposureItem({
    key: "propeller_overhaul",
    label: "Propeller overhaul exposure",
    known: Number.isFinite(propRemaining),
    amount: Number.isFinite(propRemaining)
      ? overhaul.propeller * accrualFraction(propRemaining, propTbo, annualHours, holdYears)
      : null,
    full: overhaul.propeller,
    kind: Number.isFinite(propRemaining) ? CONFIDENCE_KIND.MODELLED : CONFIDENCE_KIND.ASSUMPTION,
    detail: Number.isFinite(propRemaining)
      ? `${Math.round(propRemaining)} h to propeller TBO of ${propTbo} h.`
      : "Propeller time since overhaul is unknown.",
    point: field(aircraft, "propeller_since_overhaul"),
  }));

  capexItems.push(exposureItem({
    key: "deferred_maintenance",
    label: "Deferred maintenance",
    known: hasValue(field(aircraft, "deferred_maintenance")),
    amount: hasValue(field(aircraft, "deferred_maintenance")) ? null : null,
    kind: CONFIDENCE_KIND.SOURCED,
    detail: deferred
      ? String(deferred)
      : "No deferred-maintenance list was supplied. A pre-purchase inspection is what turns this from unknown into a number.",
    point: field(aircraft, "deferred_maintenance"),
  }));

  capexItems.push(exposureItem({
    key: "ad_sb",
    label: "Known AD / SB work",
    known: hasValue(field(aircraft, "ad_compliance")),
    amount: null,
    kind: CONFIDENCE_KIND.SOURCED,
    detail: adCompliance ? String(adCompliance) : "AD and service-bulletin status was not returned by any source consulted.",
    point: field(aircraft, "ad_compliance"),
  }));

  capexItems.push(exposureItem({
    key: "avionics",
    label: "Avionics modernisation",
    known: hasValue(field(aircraft, "avionics_suite")),
    amount: null,
    full: AVIONICS_MODERNISATION[klass] || AVIONICS_MODERNISATION.piston_single,
    kind: CONFIDENCE_KIND.INDICATIVE,
    detail: hasValue(field(aircraft, "avionics_suite"))
      ? `Installed: ${value(aircraft, "avionics_suite")}. A full modernisation for this class runs around ${money(AVIONICS_MODERNISATION[klass] || AVIONICS_MODERNISATION.piston_single, currency)} if you choose to do it.`
      : "Avionics fit is unknown, so no modernisation need is assumed either way.",
    point: field(aircraft, "avionics_suite"),
    optional: true,
  }));

  capexItems.push(exposureItem({
    key: "interior",
    label: "Interior refurbishment",
    known: Number.isFinite(interiorYear),
    amount: null,
    full: refurb.interior,
    kind: CONFIDENCE_KIND.INDICATIVE,
    detail: Number.isFinite(interiorYear)
      ? `Last refurbished ${interiorYear}. Typical refurbishment for this class: ${money(refurb.interior, currency)}.`
      : "Interior age is unknown.",
    point: field(aircraft, "interior_year"),
    optional: true,
  }));

  capexItems.push(exposureItem({
    key: "exterior",
    label: "Paint / exterior",
    known: Number.isFinite(exteriorYear),
    amount: null,
    full: refurb.exterior,
    kind: CONFIDENCE_KIND.INDICATIVE,
    detail: Number.isFinite(exteriorYear)
      ? `Last painted ${exteriorYear}. Typical repaint for this class: ${money(refurb.exterior, currency)}.`
      : "Exterior age is unknown.",
    point: field(aircraft, "exterior_year"),
    optional: true,
  }));

  const knownCapex = capexItems
    .filter((i) => !i.optional && Number.isFinite(i.amount))
    .reduce((s, i) => s + i.amount, 0);

  // --- OPEX -----------------------------------------------------------------
  const fuelPerHour = preset.fuel;
  const maintPerHour = preset.maintenance;
  const reserves = RESERVE_RATES[preset.id] || RESERVE_RATES.cessna172;
  const reservePerHour = reserves.engine + reserves.prop + reserves.inspection;

  const opexItems = [
    opexItem("fuel", "Fuel", fuelPerHour * annualHours, `${preset.gph} gph at ${annualHours} h/year, class average pricing.`, CONFIDENCE_KIND.MODELLED),
    opexItem("maintenance", "Routine maintenance", maintPerHour * annualHours, `Class average of ${money(maintPerHour, currency)}/h at ${annualHours} h/year.`, CONFIDENCE_KIND.MODELLED),
    opexItem("insurance", "Insurance", preset.insurance_yr, "Class average annual premium. Your quote depends on pilot hours, ratings and hull value — ABOS does not quote insurance.", CONFIDENCE_KIND.ASSUMPTION),
    opexItem("hangar", "Hangar", preset.hangar_yr, "Class average. Actual cost depends entirely on your base.", CONFIDENCE_KIND.ASSUMPTION),
    opexItem("reserves", "Reserves accrual", reservePerHour * annualHours, `${money(reservePerHour, currency)}/h across engine, propeller and inspection reserves.`, CONFIDENCE_KIND.MODELLED),
  ];
  const annualOpex = opexItems.reduce((s, i) => s + i.amount, 0);

  // --- Reserves breakdown ----------------------------------------------------
  const reserveModel = {
    per_hour: reservePerHour,
    annual: reservePerHour * annualHours,
    components: [
      { label: "Engine", per_hour: reserves.engine, annual: reserves.engine * annualHours, basis: `${money(overhaul.engine, currency)} overhaul over ${engineTbo} h` },
      { label: "Propeller", per_hour: reserves.prop, annual: reserves.prop * annualHours, basis: `${money(overhaul.propeller, currency)} overhaul over ${propTbo} h` },
      { label: "Scheduled inspections", per_hour: reserves.inspection, annual: reserves.inspection * annualHours, basis: "Annual / 100-hour cycle" },
    ],
  };

  // --- MRO calendar ----------------------------------------------------------
  const calendar = buildCalendar({
    annualHours, engineRemaining, propRemaining, engineTbo, propTbo,
    overhaul, lastAnnual,
  });

  const projected36 = calendar.reduce((s, e) => s + (e.estimated_cost || 0), 0);
  const totalExposure = (purchase || 0) + knownCapex + (annualOpex * holdYears);

  // --- Maintenance exposure meter -------------------------------------------
  const risk = assessMaintenanceRisk({
    annualHours,
    engineHoursToTBO: engineRemaining ?? engineTbo,
    propHoursToTBO: propRemaining ?? propTbo,
    annualOverdue: isAnnualOverdue(lastAnnual),
    upcomingCost: projected36,
  });

  // --- Scenarios --------------------------------------------------------------
  const scenarios = buildScenarios({
    purchase, knownCapex, annualOpex, holdYears, assessment, refurb,
  });

  return {
    subject: displayName(aircraft),
    registration: value(aircraft, "registration"),
    currency,
    assumptions: {
      annual_hours: annualHours,
      hold_years: holdYears,
      aircraft_class: klass,
      preset: preset.name,
      purchase_price: purchase,
      purchase_price_source: assumptions.purchasePrice ? "you" : assessment.asking ? "asking price" : "ABOS modelled midpoint",
    },
    purchase,
    capex: { items: capexItems, known_total: Math.round(knownCapex) },
    opex: { items: opexItems, annual_total: Math.round(annualOpex), per_hour: Math.round(annualOpex / annualHours) },
    reserves: reserveModel,
    calendar,
    projected_36m_maintenance: Math.round(projected36),
    total_modelled_exposure: Math.round(totalExposure),
    exposure_meter: {
      score: risk.score,
      label: risk.label,
      color: risk.color,
      engine_gap_h: risk.projectedEngineGap,
      prop_gap_h: risk.projectedPropGap,
    },
    scenarios,
    unknowns: capexItems.filter((i) => !i.known).map((i) => ({ key: i.key, label: i.label, detail: i.detail })),
    statement: "ABOS Commit tells you what this aircraft will expose you to after you buy it — before you commit the capital.",
    disclaimer: MODELLED_NOTICE,
  };
}

// --------------------------------------------------------------------------

function exposureItem({ key, label, known, amount, full = null, kind, detail, point = null, optional = false }) {
  return {
    key, label, known, optional, kind,
    amount: Number.isFinite(amount) ? Math.round(amount) : null,
    full_cost: Number.isFinite(full) ? Math.round(full) : null,
    status: known ? (point?.status || DATA_STATUS.SUPPORTED) : DATA_STATUS.UNAVAILABLE,
    detail,
    point,
  };
}

function opexItem(key, label, amount, basis, kind) {
  return { key, label, amount: Math.round(amount), basis, kind };
}

/**
 * How much of a full overhaul falls inside the ownership window. Straight-line
 * accrual: if 40% of the remaining life is consumed during the hold, 40% of
 * the overhaul is your exposure.
 */
function accrualFraction(remainingHours, tbo, annualHours, holdYears) {
  const flown = annualHours * holdYears;
  if (remainingHours <= 0) return 1;
  if (flown >= remainingHours) return 1;
  return Math.min(1, flown / Math.max(tbo, 1));
}

function yearsUntil(remainingHours, annualHours) {
  if (!Number.isFinite(remainingHours) || annualHours <= 0) return "at an unknown point";
  const years = remainingHours / annualHours;
  if (years < 1) return "within 12 months";
  if (years < 2) return "in years 1–2";
  if (years < 3) return "in years 2–3";
  return `in about ${Math.round(years)} years`;
}

function buildCalendar({ annualHours, engineRemaining, propRemaining, engineTbo, propTbo, overhaul, lastAnnual }) {
  const events = [];
  const push = (label, monthsOut, cost, kind, note) => {
    if (monthsOut === null || monthsOut > 36) return;
    events.push({
      label,
      window: monthsOut <= 12 ? "0–12 months" : monthsOut <= 24 ? "12–24 months" : "24–36 months",
      months_out: Math.max(0, Math.round(monthsOut)),
      estimated_cost: Number.isFinite(cost) ? Math.round(cost) : null,
      kind,
      note,
    });
  };

  // Annual / ARC inspections — one per 12 months, always.
  const annualBase = lastAnnual ? monthsSince(lastAnnual) : null;
  for (let i = 0; i < 3; i += 1) {
    const monthsOut = annualBase !== null ? Math.max(1, 12 - annualBase) + (i * 12) : 12 * i + 6;
    push(
      "Annual / ARC inspection",
      monthsOut,
      null,
      CONFIDENCE_KIND.MODELLED,
      annualBase !== null
        ? `Last inspection was ${annualBase} month(s) ago.`
        : "Inspection date unknown — placed on a nominal 12-month cycle.",
    );
  }

  if (Number.isFinite(engineRemaining) && annualHours > 0) {
    push("Engine overhaul", (engineRemaining / annualHours) * 12, overhaul.engine, CONFIDENCE_KIND.MODELLED,
      `${Math.round(engineRemaining)} h remaining to TBO of ${engineTbo} h.`);
  }
  if (Number.isFinite(propRemaining) && annualHours > 0 && overhaul.propeller > 0) {
    push("Propeller overhaul", (propRemaining / annualHours) * 12, overhaul.propeller, CONFIDENCE_KIND.MODELLED,
      `${Math.round(propRemaining)} h remaining to propeller TBO of ${propTbo} h.`);
  }

  return events.sort((a, b) => a.months_out - b.months_out);
}

function buildScenarios({ purchase, knownCapex, annualOpex, holdYears, assessment, refurb }) {
  const baseValue = assessment.synthesized?.midpoint || purchase || null;
  const carry = annualOpex * holdYears;

  const scenarios = [
    {
      key: "keep",
      label: "Buy and operate",
      description: `Acquire, carry for ${holdYears} year(s), no discretionary work.`,
      capital_in: sum(purchase, knownCapex),
      operating: Math.round(carry),
      modelled_exit: baseValue ? Math.round(baseValue * Math.pow(0.96, holdYears)) : null,
      note: "Exit modelled at 4% annual depreciation on the ABOS midpoint. Not a forecast.",
    },
    {
      key: "refurbish",
      label: "Buy, refurbish and operate",
      description: "Acquire, complete interior and exterior refurbishment, then operate.",
      capital_in: sum(purchase, knownCapex, refurb.interior, refurb.exterior),
      operating: Math.round(carry),
      modelled_exit: baseValue ? Math.round((baseValue + (refurb.interior + refurb.exterior) * 0.55) * Math.pow(0.96, holdYears)) : null,
      note: "Refurbishment is modelled to return about 55% of its cost at resale. Recovery varies widely by type and market.",
    },
    {
      key: "resell",
      label: "Buy and resell",
      description: "Acquire, hold 12 months, return to market.",
      capital_in: sum(purchase, knownCapex),
      operating: Math.round(annualOpex),
      modelled_exit: baseValue ? Math.round(baseValue * 0.96) : null,
      note: "Assumes no repositioning work and a normal marketing period. Transaction costs are not included.",
    },
    {
      key: "walk_away",
      label: "Walk away",
      description: "Do not proceed.",
      capital_in: 0,
      operating: 0,
      modelled_exit: null,
      note: "Cost of walking away is the diligence already spent — and the option value of the next aircraft.",
    },
  ];

  return scenarios.map((s) => ({
    ...s,
    net_modelled: s.modelled_exit !== null
      ? Math.round(s.modelled_exit - (s.capital_in || 0) - (s.operating || 0))
      : null,
    kind: CONFIDENCE_KIND.MODELLED,
  }));
}

function sum(...values) {
  const nums = values.filter((n) => Number.isFinite(n));
  return nums.length ? Math.round(nums.reduce((s, n) => s + n, 0)) : null;
}

function inferClass(aircraft) {
  const model = String(value(aircraft, "model") || "").toLowerCase();
  const make = String(value(aircraft, "manufacturer") || "").toLowerCase();
  const engines = value(aircraft, "engine_count");
  const combined = `${make} ${model}`;

  if (/citation|phenom|learjet|hawker|lear|cj\d|mustang/.test(combined)) return "jet_light";
  if (/king air|pc-?12|tbm|caravan|meridian|piaggio|turboprop/.test(combined)) return "turboprop";
  if (/baron|seneca|aztec|duchess|twin|dа42|da42|navajo|310/.test(combined)) return "piston_twin";
  if (Number(engines) >= 2) return "piston_twin";
  return "piston_single";
}

function presetFor(aircraft, klass) {
  const model = String(value(aircraft, "model") || "").toLowerCase();
  const exact = AIRCRAFT_PRESETS.find((p) => model.includes(p.name.toLowerCase().split(" ").pop()));
  if (exact) return exact;
  const byClass = AIRCRAFT_PRESETS.find((p) => p.class === klass);
  return byClass || AIRCRAFT_PRESETS[0];
}

function monthsSince(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (30.44 * 86400000)));
}

function isAnnualOverdue(lastAnnual) {
  const months = monthsSince(lastAnnual);
  return months !== null && months > 12;
}

function money(n, currency = "EUR") {
  if (!Number.isFinite(n)) return "—";
  return `${currency === "EUR" ? "€" : ""}${Math.round(n).toLocaleString("en-US")}`;
}
