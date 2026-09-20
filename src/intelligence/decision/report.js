/**
 * Due Diligence Report model (master spec §49).
 *
 * "Do not generate a boring PDF first. Create an interactive web report."
 * This builds the report's data model from everything the layer already
 * computed — it introduces no new facts of its own. PDF export renders this
 * same model, so the document and the screen can never disagree.
 *
 * Scores are transparency and confidence measures, not grades for the
 * aircraft. Every one of them states what it measures.
 */

import { value, displayName, knownFields, missingFields } from "../schema.js";
import { hasValue } from "../provenance.js";
import { conflictSeverity } from "../conflict.js";
import { computeATI } from "./ati.js";
import { screen, VERDICT } from "./screen.js";
import { assess } from "./assess.js";
import { commit } from "./commit.js";
import { knowledgeState } from "./knowledge.js";
import {
  screeningChecklist, assessChecklist, commitChecklist, documentsTable, STEP_STATE,
} from "./checklists.js";

export const COMPLIANCE_STATE = {
  COMPLIANT: "compliant",
  ATTENTION: "attention",
  NOT_APPLICABLE: "not_applicable",
  NOT_ASSESSED: "not_assessed",
};

const COMPLIANCE_LABEL = {
  [COMPLIANCE_STATE.COMPLIANT]: "Compliant",
  [COMPLIANCE_STATE.ATTENTION]: "Needs attention",
  [COMPLIANCE_STATE.NOT_APPLICABLE]: "N/A",
  [COMPLIANCE_STATE.NOT_ASSESSED]: "Not assessed",
};

/**
 * @param {Object} aircraft canonical aircraft
 * @param {Object} [options] { annualHours, holdYears }
 */
export function buildReport(aircraft, options = {}) {
  if (!aircraft || !aircraft.fields) {
    return { error: "No aircraft resolved.", sections: [] };
  }

  const ati = computeATI(aircraft);
  const screening = screen(aircraft);
  const assessment = assess(aircraft);
  const exposure = commit(aircraft, assessment, options);
  const knowledge = knowledgeState(aircraft, ati);

  const screeningSteps = screeningChecklist(aircraft);
  const assessSteps = assessChecklist(aircraft);
  const commitSteps = commitChecklist(aircraft);
  const documents = documentsTable(aircraft);

  const scores = buildScores({ screening, assessment, commitSteps, ati });
  const risk = buildRisk(aircraft, assessment);
  const compliance = buildCompliance(aircraft);

  return {
    meta: {
      title: "Aircraft Due Diligence Report",
      subject: displayName(aircraft),
      registration: value(aircraft, "registration"),
      manufacturer: value(aircraft, "manufacturer"),
      model: value(aircraft, "model"),
      serial_number: value(aircraft, "serial_number"),
      year: value(aircraft, "year"),
      country: value(aircraft, "country"),
      generated_at: new Date().toISOString(),
      confidentiality: "Confidential — for the recipient's internal use.",
      page_count: 8,
    },

    scores,
    ati,

    screening: {
      verdict: screening.verdict,
      headline: screening.headline,
      meaning: screening.meaning,
      tone: screening.verdict === VERDICT.GO ? "positive" : "attention",
      checks: screeningSteps,
      reasons: screening.reasons,
      recommendation: screening.next_step,
      disclaimer: screening.disclaimer,
    },

    assessment: {
      ...assessment,
      findings: assessSteps,
      tone: assessment.position?.state === "within" ? "positive"
        : assessment.position?.state === "unknown" ? "neutral" : "attention",
      noted_items: buildNotedItems(aircraft, assessment),
    },

    verification: {
      steps: commitSteps,
      completed: commitSteps.filter((s) => [STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state)).length,
      total: commitSteps.length,
      recommendation: buildVerificationRecommendation(commitSteps, screening, aircraft),
    },

    market: buildMarketSection(aircraft, assessment),
    exposure,
    documents,
    risk,
    compliance,
    knowledge,

    gaps: (aircraft.gaps || []).map((g) => ({ label: g.label, reason: g.reason, how_to_close: g.how_to_close })),

    sources: (aircraft.provider_calls || []).map((c) => ({
      provider: c.provider_name,
      category: c.category,
      outcome: !c.success ? "unavailable" : c.matched ? "matched" : "no_record",
      at: c.at,
    })),

    executive_summary: buildExecutiveSummary({
      aircraft, screening, assessment, ati, scores, commitSteps, knowledge,
    }),
  };
}

/* ------------------------------------------------------------- scores */

/**
 * Three stage scores plus an overall. Each one states what it measures, so a
 * reader cannot mistake a confidence score for a quality grade.
 */
function buildScores({ screening, assessment, commitSteps, ati }) {
  const screeningScore = Math.round((screening.confidence || 0) * 100);
  const assessmentScore = Math.round((assessment.confidence || 0) * 100);

  const done = commitSteps.filter((s) => [STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state)).length;
  const verificationScore = commitSteps.length ? Math.round((done / commitSteps.length) * 100) : 0;
  const overall = Math.round((screeningScore + assessmentScore + verificationScore) / 3);

  return {
    screening: {
      value: screeningScore,
      max: 100,
      label: "Screening",
      measures: "How much the free and cached sources could establish, and how consistent it was.",
    },
    assessment: {
      value: assessmentScore,
      max: 100,
      label: "Assessment",
      measures: "How well supported the valuation is by market data and known aircraft specifics.",
    },
    verification: {
      value: verificationScore,
      max: 100,
      label: "Commit",
      measures: "How many verification checks closed against a named source.",
    },
    overall: {
      value: overall,
      max: 100,
      label: "Overall",
      measures: "The average of the three stage scores. It measures evidence, not aircraft quality.",
    },
    ati: {
      value: ati.score,
      max: ati.max,
      label: "ATI",
      measures: ati.meaning,
    },
  };
}

/* -------------------------------------------------------------- market */

function buildMarketSection(aircraft, assessment) {
  const currency = assessment.currency || "EUR";
  const synth = assessment.synthesized || {};

  const drivers = [
    { key: "total_time", label: "Total time" },
    { key: "damage_history", label: "Damage history" },
    { key: "engine_smoh", label: "Engine status" },
    { key: "avionics_suite", label: "Avionics / equipment" },
    { key: "country", label: "Location" },
  ].map((d) => ({
    ...d,
    known: hasValue(aircraft.fields?.[d.key]),
    display: hasValue(aircraft.fields?.[d.key]) ? String(aircraft.fields[d.key].value) : null,
  }));

  return {
    currency,
    asking: assessment.asking,
    range_low: synth.low,
    range_high: synth.high,
    midpoint: synth.midpoint,
    method: synth.method,
    confidence_pct: Math.round((assessment.confidence || 0) * 100),
    market_median: assessment.market_median,
    comparable_count: assessment.comparable_count,
    valuations: assessment.valuations,
    position: assessment.position,
    value_drivers: drivers,
    summary: assessment.conclusion,
    caveats: assessment.caveats,
    disclaimer: assessment.disclaimer,
  };
}

/* ---------------------------------------------------------------- risk */

function buildRisk(aircraft, assessment) {
  const categories = [
    { key: "incident", label: "Accident / incident history" },
    { key: "ad_sb", label: "AD / SB open" },
    { key: "maintenance", label: "Maintenance gaps" },
    { key: "ownership", label: "Ownership / title issues" },
    { key: "regulatory", label: "Regulatory compliance" },
  ];

  const counts = Object.fromEntries(categories.map((c) => [c.key, { count: 0, note: null }]));

  if (hasValue(aircraft.fields?.damage_history)) {
    counts.incident = { count: 1, note: String(value(aircraft, "damage_history")) };
  }

  const ad = String(value(aircraft, "ad_compliance") || "").toLowerCase();
  if (ad && /overdue|open|outstanding|not current/.test(ad)) {
    counts.ad_sb = { count: 1, note: value(aircraft, "ad_compliance") };
  }

  const missingMaintenance = ["total_time", "engine_smoh", "last_annual", "maintenance_tracking"]
    .filter((k) => !hasValue(aircraft.fields?.[k]));
  if (missingMaintenance.length) {
    counts.maintenance = {
      count: missingMaintenance.length,
      note: `${missingMaintenance.length} maintenance data point(s) not established`,
      informational: true,
    };
  }

  const ownershipConflicts = (aircraft.conflicts || [])
    .filter((c) => ["registered_owner", "ownership_changes", "operator"].includes(c.field));
  if (ownershipConflicts.length) {
    counts.ownership = { count: ownershipConflicts.length, note: ownershipConflicts[0].likely_reason };
  }

  const status = String(value(aircraft, "registration_status") || "").toLowerCase();
  if (status && !/valid|active|current/.test(status)) {
    counts.regulatory = { count: 1, note: `Registration status: ${value(aircraft, "registration_status")}` };
  }

  // Genuine findings only — a maintenance data gap is informational, not a risk.
  const findings = categories.filter((c) => counts[c.key].count > 0 && !counts[c.key].informational).length;
  const highConflicts = (aircraft.conflicts || []).filter((c) => conflictSeverity(c) === "high").length;
  const priceRisk = assessment?.position?.state === "above" && assessment.position.delta_pct > 25;

  const level = highConflicts || findings >= 2 ? "elevated"
    : findings === 1 || priceRisk ? "moderate"
      : "low";

  return {
    level,
    label: level === "low" ? "Low risk" : level === "moderate" ? "Moderate risk" : "Elevated risk",
    summary: level === "low"
      ? "No critical risks identified in the sources consulted. Minor items require attention."
      : level === "moderate"
        ? "One material item needs resolving before capital moves."
        : "Multiple material items need resolving before capital moves.",
    categories: categories.map((c) => ({ ...c, ...counts[c.key] })),
    caveat: "A low risk level reflects the sources ABOS could reach. It is not a warranty of condition and does not replace a pre-purchase inspection.",
  };
}

/* ---------------------------------------------------------- compliance */

/**
 * Compliance is only ever reported as compliant where there is actual
 * evidence. Everywhere else it is "not assessed" — ABOS does not certify
 * compliance it has not checked.
 */
function buildCompliance(aircraft) {
  const country = String(value(aircraft, "country") || "").toUpperCase();
  const isUS = country === "US" || /^N\d/.test(String(value(aircraft, "registration") || "").replace(/-/g, ""));
  const status = String(value(aircraft, "registration_status") || "").toLowerCase();
  const registrationValid = /valid|active|current/.test(status);

  const rows = [
    {
      key: "faa",
      label: "FAA",
      state: !isUS ? COMPLIANCE_STATE.NOT_APPLICABLE
        : registrationValid ? COMPLIANCE_STATE.COMPLIANT
          : status ? COMPLIANCE_STATE.ATTENTION
            : COMPLIANCE_STATE.NOT_ASSESSED,
      note: !isUS ? "Not a US-registered aircraft."
        : registrationValid ? "Registration reported valid by the FAA registry."
          : status ? `Registry reports: ${value(aircraft, "registration_status")}.`
            : "No FAA record was returned.",
    },
    {
      key: "easa",
      label: "EASA / national authority",
      state: isUS ? COMPLIANCE_STATE.NOT_APPLICABLE
        : registrationValid ? COMPLIANCE_STATE.COMPLIANT
          : COMPLIANCE_STATE.NOT_ASSESSED,
      note: isUS ? "Not an EASA-state aircraft."
        : registrationValid ? `Registration reported valid by ${value(aircraft, "registry") || "the national registry"}.`
          : "No national registry record was returned.",
    },
    {
      key: "import_export",
      label: "Import / export",
      state: hasValue(aircraft.fields?.export_import_history)
        ? COMPLIANCE_STATE.COMPLIANT
        : COMPLIANCE_STATE.NOT_ASSESSED,
      note: hasValue(aircraft.fields?.export_import_history)
        ? String(value(aircraft, "export_import_history"))
        : "No import or export history was available. ABOS has not assessed this.",
    },
    {
      key: "ad_compliance",
      label: "Airworthiness directives",
      state: hasValue(aircraft.fields?.ad_compliance)
        ? (/overdue|open|outstanding/i.test(String(value(aircraft, "ad_compliance")))
          ? COMPLIANCE_STATE.ATTENTION
          : COMPLIANCE_STATE.COMPLIANT)
        : COMPLIANCE_STATE.NOT_ASSESSED,
      note: hasValue(aircraft.fields?.ad_compliance)
        ? String(value(aircraft, "ad_compliance"))
        : "AD status was not returned by any source consulted.",
    },
  ];

  return {
    rows: rows.map((r) => ({ ...r, stateLabel: COMPLIANCE_LABEL[r.state] })),
    caveat: "ABOS reports compliance only where a source supplied evidence. “Not assessed” means ABOS has not checked it, not that the aircraft is non-compliant.",
  };
}

/* ----------------------------------------------------------- summaries */

function buildNotedItems(aircraft, assessment) {
  const items = [];

  for (const conflict of aircraft.conflicts || []) {
    items.push(`${conflict.label}: sources disagree — ${conflict.required_action.toLowerCase()}`);
  }

  const smoh = Number(value(aircraft, "engine_smoh"));
  const tbo = Number(value(aircraft, "engine_tbo"));
  if (Number.isFinite(smoh) && Number.isFinite(tbo)) {
    const remaining = Math.max(0, tbo - smoh);
    items.push(`Engine has approximately ${Math.round(remaining)} h remaining to a TBO of ${tbo} h.`);
  }

  for (const factor of (assessment.unaccounted_factors || []).slice(0, 3)) {
    items.push(`${factor.label} was not available to the valuation model (up to ±${factor.max_swing_pct}% effect).`);
  }

  return items.slice(0, 6);
}

function buildVerificationRecommendation(steps, screening, aircraft) {
  const open = steps.filter((s) => ![STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state));
  const conflicts = (aircraft.conflicts || []).length;

  if (screening.verdict === VERDICT.STOP) {
    return "Not ready for transaction. Resolve the screening finding before proceeding.";
  }
  if (conflicts) {
    return `${conflicts} data conflict(s) remain unresolved. Settle them against primary documents before committing capital.`;
  }
  if (!open.length) {
    return "Every check ABOS can run from the available sources has closed. A pre-purchase inspection remains the way to establish physical condition.";
  }
  return `${open.length} check(s) remain open: ${open.slice(0, 3).map((s) => s.label.toLowerCase()).join(", ")}.`;
}

function buildExecutiveSummary({ aircraft, screening, assessment, ati, scores, commitSteps, knowledge }) {
  const highlights = knowledge.know.slice(0, 5).map((k) => k.text);
  const nextSteps = knowledge.verifyNext.slice(0, 4).map((t) => t.action);

  const open = commitSteps.filter((s) => ![STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state)).length;
  const conflicts = (aircraft.conflicts || []).length;

  const outcome = screening.verdict === VERDICT.STOP ? "Not ready for transaction"
    : conflicts || open > 2 ? "Further verification required"
      : "Evidence supports proceeding";

  return {
    outcome,
    tone: screening.verdict === VERDICT.STOP ? "attention"
      : outcome === "Evidence supports proceeding" ? "positive" : "attention",
    statement: screening.verdict === VERDICT.STOP
      ? "A material item did not hold up. Resolve it before spending anything further."
      : conflicts || open > 2
        ? "Nothing disqualifying was found, but material items remain unverified. The score reflects evidence gathered, not aircraft quality."
        : "The evidence available supports proceeding to a pre-purchase inspection and negotiation.",
    scores: [scores.screening, scores.assessment, scores.verification],
    overall: scores.overall,
    ati_score: ati.score,
    ati_max: ati.max,
    ati_band: ati.band_label,
    key_highlights: highlights,
    recommended_next_steps: nextSteps,
    known_count: knownFields(aircraft).length,
    missing_count: missingFields(aircraft).length,
    conclusion_caveat: "This report summarises what ABOS could establish from the sources it reached. It is not an appraisal, not an airworthiness determination, and not a substitute for a pre-purchase inspection.",
    price_summary: assessment.position?.state === "unknown"
      ? "Price could not be positioned against a modelled range."
      : `${assessment.position.label}. ${assessment.position.detail}`,
  };
}
