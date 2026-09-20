/**
 * ABOS SCREEN — "Is this aircraft worth spending more time and money on?"
 * (master spec §1)
 *
 * Screen is the first filter. It is deliberately cheap: it runs on free and
 * cached sources only, and it answers GO / INVESTIGATE / STOP.
 *
 * What Screen is NOT: a legal determination, an airworthiness determination,
 * or a statement that the aircraft is sound. It is a triage verdict about
 * whether the next euro of diligence is justified.
 */

import { field, value, sectionConfidence, missingFields, displayName } from "../schema";
import { hasValue, DATA_STATUS, aggregateConfidence } from "../provenance";
import { conflictSeverity } from "../conflict";

export const VERDICT = {
  GO: "GO",
  INVESTIGATE: "INVESTIGATE",
  STOP: "STOP",
};

export const VERDICT_MEANING = {
  GO: "Nothing here argues against going deeper. Proceed to Assess.",
  INVESTIGATE: "There are open questions that should be answered before money moves.",
  STOP: "Something material does not hold up. Resolve it before spending anything further.",
};

export const DISCLAIMER =
  "Screen is a triage view built from the sources ABOS could reach. It is not an airworthiness determination, not a legal opinion, and not a substitute for a pre-purchase inspection.";

/** One line item in the screen. Never scores an absence as a failure. */
function check(id, label, { state, detail, weight = 1, evidence = null }) {
  return { id, label, state, detail, weight, evidence };
}

export const CHECK_STATE = {
  PASS: "pass",
  ATTENTION: "attention",
  RISK: "risk",
  UNKNOWN: "unknown",
};

/**
 * @param {Object} aircraft canonical aircraft from resolveAircraft()
 * @returns {Object} screen result
 */
export function screen(aircraft) {
  if (!aircraft || aircraft.error) {
    return {
      verdict: VERDICT.INVESTIGATE,
      headline: "Aircraft not identified",
      subject: null,
      checks: [],
      reasons: [aircraft?.error || "No aircraft could be resolved from that input."],
      missing: [],
      confidence: 0,
      disclaimer: DISCLAIMER,
    };
  }

  const checks = [];

  // --- Identity ----------------------------------------------------------
  const idConfidence = aircraft.identity_confidence || 0;
  checks.push(check("identity", "Aircraft identity", {
    state: idConfidence >= 0.8 ? CHECK_STATE.PASS
      : idConfidence >= 0.5 ? CHECK_STATE.ATTENTION
        : CHECK_STATE.UNKNOWN,
    detail: idConfidence >= 0.8
      ? "Registration, serial and model agree across independent sources."
      : idConfidence >= 0.5
        ? "Identity established from a single source; not independently confirmed."
        : "Identity could not be confirmed from the sources checked.",
    weight: 3,
    evidence: field(aircraft, "registration"),
  }));

  // --- Registration status ----------------------------------------------
  const status = field(aircraft, "registration_status");
  const statusText = String(value(aircraft, "registration_status") || "").toLowerCase();
  checks.push(check("registration_status", "Registration status", {
    state: !hasValue(status) ? CHECK_STATE.UNKNOWN
      : /valid|active|current/.test(statusText) ? CHECK_STATE.PASS
        : /expired|revoked|deregist|cancel/.test(statusText) ? CHECK_STATE.RISK
          : CHECK_STATE.ATTENTION,
    detail: hasValue(status)
      ? `Registry reports: ${value(aircraft, "registration_status")}.`
      : "No registry returned a current registration status.",
    weight: 3,
    evidence: status,
  }));

  // --- Serial number present --------------------------------------------
  const serial = field(aircraft, "serial_number");
  checks.push(check("serial", "Serial number on record", {
    state: hasValue(serial) ? CHECK_STATE.PASS : CHECK_STATE.UNKNOWN,
    detail: hasValue(serial)
      ? "A serial number is on record and can be matched against the data plate."
      : "No serial number was returned. This is a gap to close, not a finding against the aircraft.",
    weight: 2,
    evidence: serial,
  }));

  // --- Listing consistency ----------------------------------------------
  const conflicts = aircraft.conflicts || [];
  const highConflicts = conflicts.filter((c) => conflictSeverity(c) === "high");
  const mediumConflicts = conflicts.filter((c) => conflictSeverity(c) === "medium");
  checks.push(check("consistency", "Source consistency", {
    state: highConflicts.length ? CHECK_STATE.RISK
      : mediumConflicts.length ? CHECK_STATE.ATTENTION
        : conflicts.length ? CHECK_STATE.ATTENTION
          : CHECK_STATE.PASS,
    detail: conflicts.length
      ? `${conflicts.length} disagreement(s) between sources: ${conflicts.slice(0, 3).map((c) => c.label).join(", ")}.`
      : "No disagreements between the sources consulted.",
    weight: highConflicts.length ? 4 : 2,
    evidence: null,
  }));

  // --- Basic history ------------------------------------------------------
  const damage = field(aircraft, "damage_history");
  const accidents = field(aircraft, "accident_records");
  checks.push(check("history", "History records", {
    state: hasValue(damage) ? CHECK_STATE.ATTENTION
      : hasValue(accidents) ? CHECK_STATE.PASS
        : CHECK_STATE.UNKNOWN,
    detail: hasValue(damage)
      ? `${value(aircraft, "damage_history")} — review the repair documentation.`
      : hasValue(accidents)
        ? `${value(aircraft, "accident_records")}. This reflects the sources checked, not a guarantee of a clean history.`
        : "No history source was reachable for this aircraft. Nothing is implied about its record.",
    weight: 2,
    evidence: damage || accidents,
  }));

  // --- Market position ----------------------------------------------------
  const asking = value(aircraft, "asking_price");
  const estimate = value(aircraft, "estimated_value");
  const low = value(aircraft, "value_low");
  const high = value(aircraft, "value_high");
  let marketState = CHECK_STATE.UNKNOWN;
  let marketDetail = "No asking price and estimate pair was available to position this aircraft.";

  if (asking && (low || high || estimate)) {
    const lo = low ?? (estimate ? estimate * 0.9 : null);
    const hi = high ?? (estimate ? estimate * 1.1 : null);
    if (lo && hi) {
      if (asking >= lo && asking <= hi) {
        marketState = CHECK_STATE.PASS;
        marketDetail = "The asking price falls inside the modelled range.";
      } else if (asking > hi) {
        const over = ((asking - hi) / hi) * 100;
        marketState = over > 25 ? CHECK_STATE.RISK : CHECK_STATE.ATTENTION;
        marketDetail = `The asking price is about ${Math.round(over)}% above the top of the modelled range.`;
      } else {
        const under = ((lo - asking) / lo) * 100;
        marketState = CHECK_STATE.ATTENTION;
        marketDetail = `The asking price is about ${Math.round(under)}% below the modelled range. A discount that size usually has a reason worth finding.`;
      }
    }
  }
  checks.push(check("market", "Market position", { state: marketState, detail: marketDetail, weight: 2 }));

  // --- Information completeness -------------------------------------------
  const coverage = aggregateConfidence(
    ["identity", "airframe", "engine", "market"].flatMap((s) => sectionFieldsPoints(aircraft, s)),
  );
  checks.push(check("coverage", "Information available", {
    state: coverage.coverage >= 0.6 ? CHECK_STATE.PASS
      : coverage.coverage >= 0.3 ? CHECK_STATE.ATTENTION
        : CHECK_STATE.UNKNOWN,
    detail: `${coverage.known} of ${coverage.total} core data points were returned by the sources consulted.`,
    weight: 1,
  }));

  // --- Verdict --------------------------------------------------------------
  const risk = checks.filter((c) => c.state === CHECK_STATE.RISK);
  const attention = checks.filter((c) => c.state === CHECK_STATE.ATTENTION);
  const unknown = checks.filter((c) => c.state === CHECK_STATE.UNKNOWN);

  const riskWeight = risk.reduce((s, c) => s + c.weight, 0);
  const attentionWeight = attention.reduce((s, c) => s + c.weight, 0);

  let verdict;
  if (riskWeight >= 3) verdict = VERDICT.STOP;
  else if (riskWeight > 0 || attentionWeight >= 4 || idConfidence < 0.5) verdict = VERDICT.INVESTIGATE;
  else if (unknown.length >= 4) verdict = VERDICT.INVESTIGATE;
  else verdict = VERDICT.GO;

  const reasons = [
    ...risk.map((c) => c.detail),
    ...attention.map((c) => c.detail),
  ].slice(0, 5);

  if (!reasons.length) {
    reasons.push("Nothing in the sources consulted argues against a closer look.");
  }

  return {
    verdict,
    meaning: VERDICT_MEANING[verdict],
    headline: headlineFor(verdict, aircraft),
    subject: displayName(aircraft),
    registration: value(aircraft, "registration"),
    checks,
    reasons,
    missing: missingFields(aircraft).slice(0, 8).map((f) => ({ key: f.key, label: f.label })),
    conflicts,
    confidence: Number(((idConfidence * 0.5) + (coverage.confidence * 0.5)).toFixed(2)),
    coverage,
    next_step: verdict === VERDICT.STOP
      ? "Resolve the item above before spending anything further."
      : verdict === VERDICT.INVESTIGATE
        ? "Run Assess to test whether the price is defensible, and close the open items."
        : "Run Assess to test whether the price is defensible.",
    disclaimer: DISCLAIMER,
    sources_consulted: (aircraft.provider_calls || []).map((c) => ({
      provider: c.provider_name, success: c.success, matched: c.matched,
    })),
  };
}

function sectionFieldsPoints(aircraft, section) {
  return Object.entries(aircraft.fields || {})
    .filter(([key]) => sectionOf(aircraft, key) === section)
    .map(([, point]) => point);
}

function sectionOf(aircraft, key) {
  // Imported lazily to avoid a circular import at module load.
  // eslint-disable-next-line global-require
  const { FIELD_REGISTRY } = require("../schema");
  return FIELD_REGISTRY[key]?.section;
}

function headlineFor(verdict, aircraft) {
  const name = displayName(aircraft);
  switch (verdict) {
    case VERDICT.GO: return `${name} is worth a closer look`;
    case VERDICT.STOP: return `${name} has an unresolved issue`;
    default: return `${name} needs more information`;
  }
}

export { sectionConfidence, DATA_STATUS };
