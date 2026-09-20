/**
 * ATI — Aircraft Transparency Index (master spec §25).
 *
 * THE FRAMING THAT MAKES ATI HONEST:
 *
 * ATI measures how much is known and independently verifiable about an
 * aircraft. It does NOT measure the aircraft's condition, airworthiness or
 * desirability. A low ATI means "we cannot see enough from here" — never
 * "this is a bad aircraft".
 *
 * That distinction is what keeps ATI compatible with §9: a European aircraft
 * with no FAA or NTSB coverage scores lower on transparency because less is
 * visible, and the score must say exactly that rather than implying the
 * aircraft is worse than a US one.
 *
 * Eight dimensions × 15 points = 120, matching the ATI scale already used
 * across ABOS. Each dimension is explainable: evidence, sources, what is
 * missing, and how to improve it.
 *
 * Relationship to ATIPassport: the passport is seller-declared and wizard-
 * driven. This index is source-derived — computed from whatever the
 * intelligence layer could actually resolve and cross-check. They answer
 * different questions and are not interchangeable.
 */

import { field, value, FIELD_REGISTRY } from "../schema.js";
import { hasValue, DATA_STATUS } from "../provenance.js";
import { conflictSeverity } from "../conflict.js";

export const ATI_MAX = 120;
export const DIMENSION_MAX = 15;

export const ATI_BAND = {
  EXCELLENT: "excellent",
  GOOD: "good",
  MODERATE: "moderate",
  LIMITED: "limited",
};

export const ATI_BAND_LABEL = {
  [ATI_BAND.EXCELLENT]: "Excellent transparency",
  [ATI_BAND.GOOD]: "Above average transparency",
  [ATI_BAND.MODERATE]: "Moderate transparency",
  [ATI_BAND.LIMITED]: "Limited transparency",
};

export const ATI_MEANING =
  "ATI scores how much is known and independently verifiable about this aircraft — not its condition. A lower score means less is visible from the sources consulted, not that the aircraft is worse.";

/**
 * Each dimension is a set of weighted signals. A signal earns its full weight
 * when the underlying field is VERIFIED, most of it when SUPPORTED, some when
 * UNVERIFIED, and nothing when there is no data.
 *
 * Nothing ever scores negative. An absent field simply earns no points, which
 * is the honest representation of "not visible".
 */
const DIMENSIONS = [
  {
    key: "identity",
    label: "Identity & registry",
    description: "Registration, serial, make, model and current registry status",
    signals: [
      { fieldKey: "registration", weight: 4 },
      { fieldKey: "serial_number", weight: 4 },
      { fieldKey: "manufacturer", weight: 2 },
      { fieldKey: "model", weight: 2 },
      { fieldKey: "year", weight: 1.5 },
      { fieldKey: "registration_status", weight: 1.5 },
    ],
  },
  {
    key: "ownership",
    label: "Ownership history",
    description: "Registered owner, operator and chain of title",
    signals: [
      { fieldKey: "registered_owner", weight: 6 },
      { fieldKey: "ownership_since", weight: 3 },
      { fieldKey: "ownership_changes", weight: 3 },
      { fieldKey: "operator", weight: 3 },
    ],
  },
  {
    key: "documents",
    label: "Documentation",
    description: "Logbooks, certificates and records on file",
    signals: [
      { fieldKey: "logbooks", weight: 6 },
      { fieldKey: "documents_on_file", weight: 4 },
      { fieldKey: "certificate_issue_date", weight: 2.5 },
      { fieldKey: "last_annual", weight: 2.5 },
    ],
  },
  {
    key: "history",
    label: "Damage & history",
    description: "Accident, incident and damage records",
    signals: [
      { fieldKey: "accident_records", weight: 7 },
      { fieldKey: "damage_history", weight: 5 },
      { fieldKey: "export_import_history", weight: 3 },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance traceability",
    description: "Hours, engine status, AD compliance and tracking",
    signals: [
      { fieldKey: "total_time", weight: 4 },
      { fieldKey: "engine_smoh", weight: 3.5 },
      { fieldKey: "ad_compliance", weight: 3.5 },
      { fieldKey: "maintenance_tracking", weight: 2 },
      { fieldKey: "propeller_since_overhaul", weight: 2 },
    ],
  },
  {
    key: "activity",
    label: "ADS-B & activity",
    description: "Observed operational activity and utilisation",
    signals: [
      { fieldKey: "last_seen", weight: 5 },
      { fieldKey: "flights_90d", weight: 4 },
      { fieldKey: "hours_12m", weight: 3 },
      { fieldKey: "home_base", weight: 3 },
    ],
  },
  {
    key: "market",
    label: "Market comparables",
    description: "Asking price, comparables and market position",
    signals: [
      { fieldKey: "asking_price", weight: 4 },
      { fieldKey: "comparable_count", weight: 4 },
      { fieldKey: "estimated_value", weight: 4 },
      { fieldKey: "days_on_market", weight: 3 },
    ],
  },
  {
    key: "consistency",
    label: "Listing consistency & data integrity",
    description: "Whether independent sources agree with each other",
    // Computed rather than field-derived — see scoreConsistency below.
    computed: true,
  },
];

/** How much of a signal's weight a given status earns. */
function statusMultiplier(status) {
  switch (status) {
    case DATA_STATUS.VERIFIED: return 1;
    case DATA_STATUS.SUPPORTED: return 0.78;
    case DATA_STATUS.UNVERIFIED: return 0.45;
    // A conflict still proves the data exists and was checked — it just is
    // not settled. It earns a little, and the consistency dimension is where
    // the disagreement is properly accounted for.
    case DATA_STATUS.CONFLICTING: return 0.3;
    default: return 0;
  }
}

function scoreDimension(aircraft, dimension) {
  const totalWeight = dimension.signals.reduce((s, sig) => s + sig.weight, 0);
  const evidence = [];
  const missing = [];
  const sources = new Set();
  let earned = 0;

  for (const signal of dimension.signals) {
    const point = field(aircraft, signal.fieldKey);
    const label = FIELD_REGISTRY[signal.fieldKey]?.label || signal.fieldKey;

    if (point?.status === DATA_STATUS.NOT_APPLICABLE) {
      // Not applicable is excluded from the denominator entirely, so an
      // aircraft is never marked down for a field that cannot apply to it.
      continue;
    }

    if (!hasValue(point)) {
      missing.push({
        key: signal.fieldKey,
        label,
        how_to_improve: improvementFor(signal.fieldKey),
      });
      continue;
    }

    const multiplier = statusMultiplier(point.status);
    earned += signal.weight * multiplier;
    for (const s of point.sources || []) sources.add(s.providerName || s.providerId);

    evidence.push({
      key: signal.fieldKey,
      label,
      status: point.status,
      display: point.unit ? `${point.value} ${point.unit}` : String(point.value),
      sources: (point.sources || []).map((s) => s.providerName || s.providerId),
    });
  }

  const applicableWeight = dimension.signals.reduce((s, sig) => {
    const point = field(aircraft, sig.fieldKey);
    return point?.status === DATA_STATUS.NOT_APPLICABLE ? s : s + sig.weight;
  }, 0);

  const denominator = applicableWeight || totalWeight;
  const score = Math.round((earned / denominator) * DIMENSION_MAX * 10) / 10;

  return {
    key: dimension.key,
    label: dimension.label,
    description: dimension.description,
    score: Math.min(DIMENSION_MAX, score),
    max: DIMENSION_MAX,
    evidence,
    missing,
    sources: [...sources],
    why: whyText(dimension, evidence, missing),
  };
}

/**
 * Consistency is not a field — it is whether the other fields agree.
 * Full marks means independent sources were available AND agreed.
 */
function scoreConsistency(aircraft, dimensionScores) {
  const conflicts = aircraft.conflicts || [];
  const evidence = [];
  const missing = [];

  // How many fields were confirmed by more than one independent source?
  const allPoints = Object.entries(aircraft.fields || {})
    .filter(([, p]) => hasValue(p));
  const verified = allPoints.filter(([, p]) => p.status === DATA_STATUS.VERIFIED);
  const crossCheckRate = allPoints.length ? verified.length / allPoints.length : 0;

  // Base: how much of what we know was corroborated.
  let score = crossCheckRate * DIMENSION_MAX;

  if (verified.length) {
    evidence.push({
      key: "cross_checked",
      label: "Cross-checked fields",
      status: DATA_STATUS.VERIFIED,
      display: `${verified.length} of ${allPoints.length} known fields confirmed by two or more independent sources`,
      sources: [],
    });
  } else if (allPoints.length) {
    missing.push({
      key: "cross_checked",
      label: "Independent corroboration",
      how_to_improve: "Only one source was available for each field. A second independent source would raise this.",
    });
  }

  // Unresolved disagreements reduce integrity, weighted by severity.
  const penalty = conflicts.reduce((sum, c) => {
    const severity = c.severity || conflictSeverity(c);
    return sum + (severity === "high" ? 4 : severity === "medium" ? 2 : 0.75);
  }, 0);

  if (conflicts.length) {
    evidence.push({
      key: "conflicts",
      label: "Source conflicts",
      status: DATA_STATUS.CONFLICTING,
      display: `${conflicts.length} unresolved disagreement(s): ${conflicts.slice(0, 3).map((c) => c.label).join(", ")}`,
      sources: [],
    });
    for (const c of conflicts) {
      missing.push({
        key: `conflict_${c.field}`,
        label: `${c.label} — sources disagree`,
        how_to_improve: c.required_action,
      });
    }
  }

  score = Math.max(0, score - penalty);

  return {
    key: "consistency",
    label: "Listing consistency & data integrity",
    description: "Whether independent sources agree with each other",
    score: Math.round(Math.min(DIMENSION_MAX, score) * 10) / 10,
    max: DIMENSION_MAX,
    evidence,
    missing,
    sources: [],
    conflicts,
    why: conflicts.length
      ? `${verified.length} field(s) were corroborated by independent sources, but ${conflicts.length} disagreement(s) remain unresolved.`
      : verified.length
        ? `${verified.length} of ${allPoints.length} known fields were confirmed by two or more independent sources, with no disagreements.`
        : "No field could be corroborated by a second independent source, so integrity cannot be established either way.",
    // Referenced so the caller can see which dimensions fed the coverage view.
    dimension_count: dimensionScores.length,
  };
}

function whyText(dimension, evidence, missing) {
  if (!evidence.length && !missing.length) {
    return `Nothing in ${dimension.label.toLowerCase()} applies to this aircraft.`;
  }
  if (!evidence.length) {
    return `No source consulted returned anything for ${dimension.label.toLowerCase()}. This is a visibility gap, not a finding about the aircraft.`;
  }
  const verifiedCount = evidence.filter((e) => e.status === DATA_STATUS.VERIFIED).length;
  const base = `${evidence.length} item(s) established${verifiedCount ? `, ${verifiedCount} of them confirmed by independent sources` : " from a single source each"}.`;
  return missing.length ? `${base} ${missing.length} item(s) could not be established.` : base;
}

function improvementFor(fieldKey) {
  const map = {
    serial_number: "Confirm from the data plate or registration certificate.",
    registered_owner: "Upload the registration certificate.",
    ownership_since: "Provide the bill of sale or registration history.",
    ownership_changes: "Request the full chain of title from the registry.",
    operator: "State the current operator if it differs from the owner.",
    logbooks: "Upload scanned logbooks — this is the single biggest ATI lift.",
    documents_on_file: "Upload airworthiness, registration and maintenance records.",
    last_annual: "Upload the most recent annual / ARC inspection record.",
    certificate_issue_date: "Provide the airworthiness certificate.",
    accident_records: "For non-US aircraft, request the national authority's incident records.",
    damage_history: "Provide a signed damage-history declaration.",
    export_import_history: "Provide import or export paperwork where the aircraft changed registry.",
    total_time: "Upload the current logbook page showing airframe total time.",
    engine_smoh: "Provide the engine status sheet or last overhaul record.",
    ad_compliance: "Upload the AD compliance list.",
    maintenance_tracking: "Connect or name the maintenance tracking programme.",
    propeller_since_overhaul: "Provide the propeller logbook entry.",
    last_seen: "No ADS-B activity was observed. Coverage gaps are common outside the US and Europe.",
    flights_90d: "No recent tracks were observed by the feeds consulted.",
    hours_12m: "Utilisation could not be derived from observed activity.",
    home_base: "State the aircraft's home base.",
    asking_price: "Add the asking price to the listing.",
    comparable_count: "Comparables require make, model and year to be established first.",
    estimated_value: "Provide make, model, year and hours so the market model can run.",
    days_on_market: "Listing history was not available from any source.",
  };
  return map[fieldKey] || "Provide a primary document covering this item.";
}

export function atiBand(score) {
  const pct = score / ATI_MAX;
  if (pct >= 0.85) return ATI_BAND.EXCELLENT;
  if (pct >= 0.7) return ATI_BAND.GOOD;
  if (pct >= 0.5) return ATI_BAND.MODERATE;
  return ATI_BAND.LIMITED;
}

/**
 * Compute the ATI for a canonical aircraft.
 *
 * @param {Object} aircraft canonical aircraft from resolveAircraft()
 * @returns {Object} ATI result with per-dimension explainability
 */
export function computeATI(aircraft) {
  if (!aircraft || !aircraft.fields) {
    return {
      score: 0,
      max: ATI_MAX,
      band: ATI_BAND.LIMITED,
      band_label: ATI_BAND_LABEL[ATI_BAND.LIMITED],
      dimensions: [],
      meaning: ATI_MEANING,
      biggest_lifts: [],
    };
  }

  const fieldDimensions = DIMENSIONS.filter((d) => !d.computed)
    .map((d) => scoreDimension(aircraft, d));

  const consistency = scoreConsistency(aircraft, fieldDimensions);
  const dimensions = [...fieldDimensions, consistency];

  const score = Math.round(dimensions.reduce((s, d) => s + d.score, 0));
  const band = atiBand(score);

  // What would move the number most: the dimensions furthest from full marks,
  // paired with the concrete action that closes them.
  const biggestLifts = dimensions
    .filter((d) => d.missing.length)
    .sort((a, b) => (b.max - b.score) - (a.max - a.score))
    .slice(0, 4)
    .map((d) => ({
      dimension: d.label,
      points_available: Math.round((d.max - d.score) * 10) / 10,
      action: d.missing[0]?.how_to_improve,
      field: d.missing[0]?.key,
    }));

  return {
    score,
    max: ATI_MAX,
    percent: Math.round((score / ATI_MAX) * 100),
    band,
    band_label: ATI_BAND_LABEL[band],
    dimensions,
    meaning: ATI_MEANING,
    biggest_lifts: biggestLifts,
    registration: value(aircraft, "registration"),
    computed_at: new Date().toISOString(),
  };
}

/** One dimension's drill-down: "Why this score?" (§25). */
export function explainDimension(ati, dimensionKey) {
  const dimension = (ati?.dimensions || []).find((d) => d.key === dimensionKey);
  if (!dimension) return null;
  return {
    label: dimension.label,
    description: dimension.description,
    score: dimension.score,
    max: dimension.max,
    why: dimension.why,
    evidence: dimension.evidence,
    sources: dimension.sources,
    missing: dimension.missing,
    how_to_improve: dimension.missing.map((m) => m.how_to_improve).filter(Boolean),
  };
}
