/**
 * Verification checklists — the step lists shown on Screen, Assess and Commit.
 *
 * These are derived views over the canonical aircraft, not a separate store.
 * A step's state, its attributed source and its timestamp all come from the
 * data points that back it, so a checklist can never claim a verification that
 * the provenance does not support.
 *
 * States follow the mockups: verified / completed / in progress / review /
 * insufficient data / not started. "Insufficient data" is neutral — it means a
 * further check is needed, never that something is wrong (§9).
 */

import { field, FIELD_REGISTRY } from "../schema.js";
import { hasValue, DATA_STATUS } from "../provenance.js";

export const STEP_STATE = {
  VERIFIED: "verified",
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  INSUFFICIENT: "insufficient",
  NOT_STARTED: "not_started",
};

/**
 * Resolve a step from the fields that back it.
 *
 * @param {Object} aircraft
 * @param {Object} spec {key, label, description, fields[], requireAll?}
 */
function resolveStep(aircraft, spec) {
  const points = spec.fields
    .map((key) => ({ key, point: field(aircraft, key) }))
    .filter(({ point }) => point?.status !== DATA_STATUS.NOT_APPLICABLE);

  const present = points.filter(({ point }) => hasValue(point));
  const verified = present.filter(({ point }) => point.status === DATA_STATUS.VERIFIED);
  const conflicting = present.filter(({ point }) => point.status === DATA_STATUS.CONFLICTING);

  let state;
  if (conflicting.length) state = STEP_STATE.REVIEW;
  else if (!present.length) state = STEP_STATE.INSUFFICIENT;
  else if (verified.length === points.length) state = STEP_STATE.VERIFIED;
  else if (present.length === points.length) state = STEP_STATE.COMPLETED;
  else state = STEP_STATE.IN_PROGRESS;

  // Attribution: the most trusted source that actually contributed.
  const contributing = present.flatMap(({ point }) => point.sources || []);
  const primary = contributing[0] || null;
  const sourceNames = [...new Set(contributing.map((s) => s.providerName || s.providerId))];

  const dates = present
    .map(({ point }) => point.sourceDate || point.primarySource?.retrievedAt)
    .filter(Boolean)
    .sort();
  const at = dates.length ? String(dates[dates.length - 1]).slice(0, 16).replace("T", " ") : null;

  return {
    key: spec.key,
    label: spec.label,
    description: spec.description,
    state,
    source: sourceNames.length ? sourceNames.slice(0, 2).join(" / ") : null,
    at,
    result: buildResult(spec, present, conflicting, points.length),
    fields: spec.fields,
    points: present.map(({ point }) => point),
    primary_source: primary,
  };
}

function buildResult(spec, present, conflicting, total) {
  if (conflicting.length) {
    return `${conflicting.length} item(s) need review`;
  }
  if (!present.length) {
    return spec.emptyResult || "No source returned this";
  }
  if (spec.resultFrom) {
    const point = present.find(({ key }) => key === spec.resultFrom)?.point;
    if (point) return point.unit ? `${point.value} ${point.unit}` : String(point.value);
  }
  if (present.length === total) return "All items on record";
  return `${present.length} of ${total} on record`;
}

/* ------------------------------------------------------------- SCREEN */

const SCREENING_SPECS = [
  {
    key: "registry",
    label: "Registry",
    description: "Registration validity and current status",
    fields: ["registration", "registration_status", "registry"],
    resultFrom: "registration_status",
    emptyResult: "No registry record returned",
  },
  {
    key: "ownership",
    label: "Ownership history",
    description: "Registered owner and changes on record",
    fields: ["registered_owner", "ownership_changes", "ownership_since"],
    emptyResult: "Owner not returned",
  },
  {
    key: "incident",
    label: "Accident / incident",
    description: "Records held by the safety sources consulted",
    fields: ["accident_records", "damage_history"],
    resultFrom: "accident_records",
    emptyResult: "No safety source reachable",
  },
  {
    key: "airworthiness",
    label: "Airworthiness / ADs",
    description: "Airworthiness directives and inspection status",
    fields: ["ad_compliance", "last_annual", "certificate_issue_date"],
    emptyResult: "Not returned by any source",
  },
  {
    key: "maintenance",
    label: "Maintenance records",
    description: "Hours, engine status and tracking",
    fields: ["total_time", "engine_smoh", "maintenance_tracking"],
    emptyResult: "No maintenance data supplied",
  },
  {
    key: "market",
    label: "Market & valuation",
    description: "Asking price against comparable aircraft",
    fields: ["asking_price", "estimated_value", "comparable_count"],
    emptyResult: "Insufficient market data",
  },
  {
    key: "activity",
    label: "Operational activity",
    description: "Observed ADS-B tracks and utilisation",
    fields: ["last_seen", "flights_90d"],
    emptyResult: "No tracks observed",
  },
];

export function screeningChecklist(aircraft) {
  return SCREENING_SPECS.map((spec) => resolveStep(aircraft, spec));
}

/* ------------------------------------------------------------- ASSESS */

const ASSESS_SPECS = [
  {
    key: "identity",
    label: "Identity & registry",
    description: "Registration, aircraft details, configuration",
    fields: ["registration", "serial_number", "manufacturer", "model", "year"],
  },
  {
    key: "ownership_evidence",
    label: "Ownership evidence",
    description: "Registered owner, chain of title, bill of sale",
    fields: ["registered_owner", "ownership_changes", "operator"],
  },
  {
    key: "documents",
    label: "Documents",
    description: "Airworthiness, registration, maintenance, ADs",
    fields: ["documents_on_file", "logbooks", "certificate_issue_date", "ad_compliance"],
  },
  {
    key: "damage",
    label: "Damage / history",
    description: "Accidents, incidents, insurance claims",
    fields: ["accident_records", "damage_history", "export_import_history"],
  },
  {
    key: "adsb",
    label: "ADS-B / activity",
    description: "Flight history, usage, location, anomalies",
    fields: ["last_seen", "last_known_position", "flights_90d", "home_base"],
  },
  {
    key: "consistency",
    label: "Listing consistency",
    description: "Cross-check listing against records and data",
    fields: ["asking_price", "total_time", "engine_smoh", "avionics_suite"],
  },
  {
    key: "comparables",
    label: "Market comparables",
    description: "Value, pricing, demand, similar aircraft",
    fields: ["comparable_count", "market_median", "estimated_value", "days_on_market"],
    emptyResult: "Insufficient data",
  },
];

export function assessChecklist(aircraft) {
  return ASSESS_SPECS.map((spec) => resolveStep(aircraft, spec));
}

/* ------------------------------------------------------------- COMMIT */

const COMMIT_SPECS = [
  {
    key: "registration_ownership",
    label: "Registration & ownership",
    description: "Verify registration, owner history and chain of title",
    fields: ["registration", "registration_status", "registered_owner"],
  },
  {
    key: "airworthiness_maintenance",
    label: "Airworthiness & maintenance",
    description: "Check airworthiness status, ADs, SBs and maintenance records",
    fields: ["ad_compliance", "last_annual", "maintenance_tracking"],
  },
  {
    key: "engine_propeller",
    label: "Engine & propeller",
    description: "Verify engine history, time since overhaul, propeller status",
    fields: ["engine_make_model", "engine_smoh", "engine_tbo", "propeller_since_overhaul"],
  },
  {
    key: "accident_history",
    label: "Accident & incident history",
    description: "Search safety databases for records on this airframe",
    fields: ["accident_records", "damage_history"],
  },
  {
    key: "documents_logbooks",
    label: "Documents & logbooks",
    description: "Verify aircraft documents, bills of sale and logbooks",
    fields: ["documents_on_file", "logbooks"],
    emptyResult: "Upload required",
  },
  {
    key: "compliance",
    label: "Compliance & regulatory",
    description: "Check export status, sanctions, import and export rules",
    fields: ["export_import_history", "country", "registry"],
  },
  {
    key: "final_risk",
    label: "Final risk assessment",
    description: "Generate the verification summary and risk score",
    fields: [],
    emptyResult: "Available once the checks above complete",
  },
];

export function commitChecklist(aircraft) {
  const steps = COMMIT_SPECS.map((spec) => (
    spec.fields.length ? resolveStep(aircraft, spec) : {
      key: spec.key,
      label: spec.label,
      description: spec.description,
      state: STEP_STATE.NOT_STARTED,
      source: null,
      at: null,
      result: spec.emptyResult,
      fields: [],
      points: [],
    }
  ));

  // The final step only becomes available once everything before it is done.
  const priorDone = steps.slice(0, -1).every((s) => [STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state));
  if (priorDone) {
    const last = steps[steps.length - 1];
    last.state = STEP_STATE.IN_PROGRESS;
    last.result = "Ready to generate";
  }

  return steps;
}

/* ------------------------------------------------------- documents view */

/**
 * The Documents & Data table (report page 5). Each row is a source ABOS
 * consulted, its status and when it answered — including the ones that had
 * nothing, which is data about coverage rather than about the aircraft.
 */
export function documentsTable(aircraft) {
  const rows = [];

  for (const call of aircraft?.provider_calls || []) {
    rows.push({
      key: `call_${call.provider_id}`,
      label: call.provider_name,
      category: call.category,
      status: !call.success ? "unavailable" : call.matched ? "verified" : "no_record",
      statusLabel: !call.success ? "Unavailable" : call.matched ? "Verified" : "No record",
      date: call.at ? String(call.at).slice(0, 10) : null,
      note: call.error || call.note || null,
    });
  }

  // Fields sourced from an uploaded document get their own rows.
  for (const [key, point] of Object.entries(aircraft?.fields || {})) {
    const docSource = (point?.sources || []).find((s) => s.providerId === "document_intelligence");
    if (!docSource) continue;
    rows.push({
      key: `doc_${key}`,
      label: FIELD_REGISTRY[key]?.label || key,
      category: "document",
      status: "verified",
      statusLabel: "Verified",
      date: docSource.sourceDate ? String(docSource.sourceDate).slice(0, 10) : null,
      note: docSource.documentId ? `Document ${docSource.documentId}` : null,
    });
  }

  return rows;
}

/** Counts for the tab filters above the documents table. */
export function documentsSummary(rows = []) {
  return {
    all: rows.length,
    verified: rows.filter((r) => r.status === "verified").length,
    no_record: rows.filter((r) => r.status === "no_record").length,
    unavailable: rows.filter((r) => r.status === "unavailable").length,
  };
}
