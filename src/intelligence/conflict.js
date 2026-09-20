/**
 * ABOS Intelligence Layer — data conflict engine (master spec §33).
 *
 * When two sources disagree, ABOS shows the disagreement. It does not pick a
 * winner behind the user's back. A conflict carries the competing values, the
 * gap, a plain-language likely reason, and the action that would settle it.
 *
 * Agreement is just as important: two independent sources that agree are what
 * promotes a field from SUPPORTED to VERIFIED.
 */

import {
  dataPoint, DATA_STATUS, DATA_CLASS, hasValue,
} from "./provenance.js";
import { FIELD_REGISTRY } from "./schema.js";
import { getProvider } from "./registry.js";

/** How close two values have to be to count as the same fact. */
const TOLERANCE = {
  // Hours drift between reporting dates; a couple of hours is not a conflict.
  total_time: { type: "number", abs: 5, rel: 0.01 },
  engine_tsn: { type: "number", abs: 5, rel: 0.01 },
  engine_smoh: { type: "number", abs: 5, rel: 0.01 },
  propeller_since_overhaul: { type: "number", abs: 5, rel: 0.01 },
  hours_12m: { type: "number", abs: 10, rel: 0.05 },
  total_cycles: { type: "number", abs: 10, rel: 0.01 },
  // Money: different valuation dates and currencies move numbers around.
  asking_price: { type: "number", abs: 0, rel: 0.02 },
  estimated_value: { type: "number", abs: 0, rel: 0.1 },
  market_median: { type: "number", abs: 0, rel: 0.1 },
  year: { type: "number", abs: 0, rel: 0 },
  // Registry strings differ in punctuation and casing constantly.
  manufacturer: { type: "loose_string" },
  model: { type: "loose_string" },
  registered_owner: { type: "loose_string" },
  operator: { type: "loose_string" },
  engine_make_model: { type: "loose_string" },
  serial_number: { type: "serial" },
  registration: { type: "registration" },
};

const DEFAULT_TOLERANCE = { type: "auto" };

function normLoose(v) {
  return String(v ?? "")
    .toUpperCase()
    .replace(/\b(INC|LLC|LTD|GMBH|S\.?R\.?O\.?|A\.?S\.?|CORP|CO|COMPANY|AIRCRAFT|AVIATION)\b/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

function normSerial(v) {
  return String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normRegistration(v) {
  return String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Do two raw values describe the same fact for this field? */
export function valuesAgree(fieldKey, a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return true;
  const rule = TOLERANCE[fieldKey] || DEFAULT_TOLERANCE;
  const type = rule.type === "auto"
    ? (typeof a === "number" && typeof b === "number" ? "number" : "loose_string")
    : rule.type;

  switch (type) {
    case "number": {
      const x = Number(a); const y = Number(b);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return normLoose(a) === normLoose(b);
      const diff = Math.abs(x - y);
      const scale = Math.max(Math.abs(x), Math.abs(y), 1);
      return diff <= (rule.abs || 0) || diff / scale <= (rule.rel || 0);
    }
    case "serial": return normSerial(a) === normSerial(b);
    case "registration": return normRegistration(a) === normRegistration(b);
    case "loose_string":
    default: {
      const x = normLoose(a); const y = normLoose(b);
      if (!x || !y) return true;
      return x === y || x.includes(y) || y.includes(x);
    }
  }
}

/** Plain-language guess at why two sources disagree (§33 "likely reason"). */
function likelyReason(fieldKey, entries) {
  const dates = entries.map((e) => e.sourceDate).filter(Boolean);
  const spread = dates.length >= 2
    ? Math.abs(new Date(dates[0]) - new Date(dates[dates.length - 1])) / 86400000
    : 0;

  const hasListing = entries.some((e) => e.providerId === "abos_listing");
  const hasRegistry = entries.some((e) => getProvider(e.providerId)?.category === "registry");

  if (["total_time", "engine_tsn", "engine_smoh", "total_cycles", "propeller_since_overhaul"].includes(fieldKey)) {
    if (spread > 30) return `Different reporting dates — the sources are ${Math.round(spread)} days apart.`;
    return "Different reporting dates, or one figure predates recent flying.";
  }
  if (["asking_price", "estimated_value", "market_median", "value_low", "value_high"].includes(fieldKey)) {
    return "Different valuation dates, currencies or methodologies.";
  }
  if (fieldKey === "registered_owner" && hasRegistry) {
    return "A recent ownership change may not have propagated to every registry yet.";
  }
  if (hasListing && hasRegistry) {
    return "The listing description differs from the registry record.";
  }
  return "The sources record this differently; the reason is not established.";
}

/** What would actually settle it. */
function requiredAction(fieldKey) {
  if (["total_time", "engine_tsn", "engine_smoh", "total_cycles", "propeller_since_overhaul"].includes(fieldKey)) {
    return "Verify against the current logbook entry.";
  }
  if (["registered_owner", "operator", "ownership_since"].includes(fieldKey)) {
    return "Verify against the current registration certificate.";
  }
  if (["serial_number", "registration", "manufacturer", "model", "year"].includes(fieldKey)) {
    return "Verify against the data plate and the airworthiness certificate.";
  }
  if (["asking_price", "estimated_value", "market_median"].includes(fieldKey)) {
    return "Confirm the valuation date and currency for each figure.";
  }
  return "Verify against a primary document.";
}

/**
 * Merge every candidate value for one canonical field into a single data
 * point — or into a conflicting one that keeps both sides visible.
 *
 * @param {string} fieldKey
 * @param {Array<{value:any, source:Object, confidence?:number, dataClass?:string, calculation?:string}>} candidates
 */
export function reconcile(fieldKey, candidates = []) {
  const meta = FIELD_REGISTRY[fieldKey] || {};
  const usable = candidates.filter((c) => c && c.value !== null && c.value !== undefined && c.value !== "");

  if (!usable.length) {
    return {
      point: dataPoint(null, { status: DATA_STATUS.UNAVAILABLE, unit: meta.unit, label: meta.label, calculation: "No source consulted returned a value." }),
      conflict: null,
    };
  }

  // Trust weight: provider base confidence, nudged by how fresh the figure is.
  const weighted = usable.map((c) => {
    const provider = getProvider(c.source?.providerId);
    const base = c.confidence ?? provider?.confidence ?? 0.5;
    const ageDays = c.source?.sourceDate
      ? Math.max(0, (Date.now() - new Date(c.source.sourceDate).getTime()) / 86400000)
      : null;
    const freshnessPenalty = ageDays === null ? 0.05 : Math.min(0.25, ageDays / 365 * 0.15);
    return {
      ...c,
      providerId: c.source?.providerId,
      sourceDate: c.source?.sourceDate || null,
      weight: Math.max(0.05, base - freshnessPenalty),
    };
  }).sort((a, b) => b.weight - a.weight);

  const leader = weighted[0];
  const agreeing = weighted.filter((c) => valuesAgree(fieldKey, leader.value, c.value));
  const dissenting = weighted.filter((c) => !valuesAgree(fieldKey, leader.value, c.value));

  const sources = agreeing.map((c) => c.source);
  const crossChecked = agreeing.length > 1
    ? agreeing.map((c) => c.source?.providerName || c.providerId)
    : [];

  if (dissenting.length) {
    const conflict = buildConflict(fieldKey, meta, [leader, ...dissenting]);
    return {
      point: dataPoint(leader.value, {
        unit: meta.unit,
        label: meta.label,
        sources,
        status: DATA_STATUS.CONFLICTING,
        dataClass: leader.dataClass || DATA_CLASS.OBSERVED,
        // A contested figure never reads as more than moderately confident.
        confidence: Math.min(0.5, leader.weight),
        crossCheckedAgainst: crossChecked,
        conflict,
        calculation: leader.calculation || null,
      }),
      conflict,
    };
  }

  // Independent agreement is what earns VERIFIED.
  const independent = new Set(agreeing.map((c) => c.providerId)).size;
  const status = independent >= 2 ? DATA_STATUS.VERIFIED
    : leader.providerId === "abos_listing" ? DATA_STATUS.UNVERIFIED
      : DATA_STATUS.SUPPORTED;

  const confidence = status === DATA_STATUS.VERIFIED
    ? Math.min(0.98, leader.weight + 0.12 * (independent - 1))
    : leader.weight;

  return {
    point: dataPoint(leader.value, {
      unit: meta.unit,
      label: meta.label,
      sources,
      status,
      dataClass: leader.dataClass || DATA_CLASS.OBSERVED,
      confidence,
      crossCheckedAgainst: crossChecked,
      calculation: leader.calculation || null,
    }),
    conflict: null,
  };
}

function buildConflict(fieldKey, meta, entries) {
  const numeric = entries.every((e) => Number.isFinite(Number(e.value)));
  const values = entries.map((e) => ({
    provider: e.source?.providerName || e.providerId,
    provider_id: e.providerId,
    value: e.value,
    source_date: e.sourceDate,
  }));
  const difference = numeric
    ? Math.abs(Math.max(...entries.map((e) => Number(e.value))) - Math.min(...entries.map((e) => Number(e.value))))
    : null;

  return {
    field: fieldKey,
    label: meta.label || fieldKey,
    unit: meta.unit || null,
    values,
    difference,
    difference_display: difference !== null
      ? `${difference.toLocaleString("en-US", { maximumFractionDigits: 1 })}${meta.unit ? ` ${meta.unit}` : ""}`
      : null,
    likely_reason: likelyReason(fieldKey, entries),
    required_action: requiredAction(fieldKey),
    resolved: false,
  };
}

/**
 * Severity, so the UI can rank what actually matters. Identity disagreements
 * are serious; a 40-hour drift on airframe time usually is not.
 */
export function conflictSeverity(conflict) {
  if (!conflict) return "none";
  const identityFields = ["registration", "serial_number", "manufacturer", "model", "year"];
  if (identityFields.includes(conflict.field)) return "high";

  if (conflict.difference !== null) {
    const magnitudes = conflict.values.map((v) => Math.abs(Number(v.value) || 0));
    const scale = Math.max(...magnitudes, 1);
    const ratio = conflict.difference / scale;
    if (ratio > 0.25) return "high";
    if (ratio > 0.05) return "medium";
    return "low";
  }
  return "medium";
}

/** All conflicts on an aircraft, worst first. */
export function rankConflicts(conflicts = []) {
  const order = { high: 0, medium: 1, low: 2, none: 3 };
  return [...conflicts]
    .map((c) => ({ ...c, severity: conflictSeverity(c) }))
    .sort((a, b) => order[a.severity] - order[b.severity]);
}
