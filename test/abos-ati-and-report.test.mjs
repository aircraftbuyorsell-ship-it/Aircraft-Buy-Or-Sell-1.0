/**
 * ATI, knowledge state and the due diligence report.
 *
 * The rule these lock in: ATI measures TRANSPARENCY, not aircraft quality.
 * A European aircraft outside FAA/NTSB coverage scores lower because less is
 * visible — and every surface that shows the number has to say so.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { DATA_CLASS, source } from "../src/intelligence/provenance.js";
import { createAircraft, setField } from "../src/intelligence/schema.js";
import { reconcile } from "../src/intelligence/conflict.js";
import { computeATI, explainDimension, ATI_MAX } from "../src/intelligence/decision/ati.js";
import { knowledgeState, CAVEAT } from "../src/intelligence/decision/knowledge.js";
import { commitChecklist, screeningChecklist, STEP_STATE } from "../src/intelligence/decision/checklists.js";
import { buildReport, COMPLIANCE_STATE } from "../src/intelligence/decision/report.js";

const faa = (date = "2026-09-01") => source({ providerId: "faa", providerName: "FAA registry", sourceDate: date });
const czech = (date = "2026-09-01") => source({ providerId: "national_registries", providerName: "Czech CAA", sourceDate: date });
const listing = (date = "2026-09-15") => source({ providerId: "abos_listing", providerName: "ABOS listing", sourceDate: date });
const omvm = () => source({ providerId: "abos_omvm", providerName: "ABOS Market Model", type: DATA_CLASS.ABOS_CALCULATION, sourceDate: "2026-09-19" });

function build(fields = {}) {
  let aircraft = createAircraft();
  for (const [key, candidates] of Object.entries(fields)) {
    const { point } = reconcile(key, candidates);
    aircraft = setField(aircraft, key, point);
  }
  aircraft.conflicts = Object.values(aircraft.fields).map((p) => p.conflict).filter(Boolean);
  aircraft.identity_confidence = 0.9;
  aircraft.provider_calls = [];
  aircraft.gaps = [];
  return aircraft;
}

/** A well-documented US aircraft: lots of sources, lots corroborated. */
function wellDocumented() {
  return build({
    registration: [{ value: "N7692J", source: faa() }, { value: "N7692J", source: listing() }],
    serial_number: [{ value: "28R-8321957", source: faa() }],
    manufacturer: [{ value: "Piper", source: faa() }, { value: "Piper", source: listing() }],
    model: [{ value: "PA-28R-180", source: faa() }, { value: "PA-28R-180", source: listing() }],
    year: [{ value: 1983, source: faa() }],
    registration_status: [{ value: "Valid", source: faa() }],
    registered_owner: [{ value: "EXAMPLE HOLDINGS LLC", source: faa() }],
    country: [{ value: "US", source: faa() }],
    accident_records: [{ value: "0 record(s) found in NTSB sources checked", source: source({ providerId: "ntsb", providerName: "NTSB", sourceDate: "2026-09-10" }) }],
    total_time: [{ value: 1245, source: listing() }],
    engine_smoh: [{ value: 800, source: listing() }],
    engine_tbo: [{ value: 2000, source: listing() }],
    last_annual: [{ value: "2026-06-01", source: listing() }],
    asking_price: [{ value: 189000, source: listing() }],
    estimated_value: [{ value: 182000, source: omvm(), dataClass: DATA_CLASS.ABOS_CALCULATION }],
    value_low: [{ value: 160000, source: omvm(), dataClass: DATA_CLASS.ABOS_CALCULATION }],
    value_high: [{ value: 205000, source: omvm(), dataClass: DATA_CLASS.ABOS_CALCULATION }],
    comparable_count: [{ value: 12, source: omvm() }],
    last_seen: [{ value: "2026-09-18T10:00:00Z", source: source({ providerId: "opensky", providerName: "OpenSky Network", sourceDate: "2026-09-18" }) }],
  });
}

/** A European aircraft with no US coverage at all. */
function thinlyCovered() {
  return build({
    registration: [{ value: "OK-ABC", source: czech() }],
    manufacturer: [{ value: "Cessna", source: czech() }],
    model: [{ value: "172S", source: czech() }],
    registration_status: [{ value: "Valid", source: czech() }],
    country: [{ value: "CZ", source: czech() }],
  });
}

/* ------------------------------------------------------------------ ATI */

test("ATI scores transparency, and says so on the object itself", () => {
  const ati = computeATI(wellDocumented());
  assert.equal(ati.max, ATI_MAX);
  assert.match(ati.meaning, /not its condition/i);
  assert.match(ati.meaning, /less is visible/i);
  assert.equal(ati.dimensions.length, 8);
});

test("thin coverage scores lower than rich coverage — without implying a worse aircraft", () => {
  const rich = computeATI(wellDocumented());
  const thin = computeATI(thinlyCovered());
  assert.ok(rich.score > thin.score, `expected ${rich.score} > ${thin.score}`);

  // The low score must be explained as missing visibility, never as a finding.
  const history = explainDimension(thin, "history");
  assert.match(history.why, /visibility gap, not a finding/i);
});

test("a missing field earns no points but never scores negative", () => {
  const ati = computeATI(thinlyCovered());
  for (const dimension of ati.dimensions) {
    assert.ok(dimension.score >= 0, `${dimension.key} went negative`);
    assert.ok(dimension.score <= dimension.max, `${dimension.key} exceeded its max`);
  }
  assert.ok(ati.score >= 0 && ati.score <= ATI_MAX);
});

test("every dimension can explain itself and say how to improve", () => {
  const ati = computeATI(thinlyCovered());
  const documents = explainDimension(ati, "documents");
  assert.ok(documents.why);
  assert.ok(documents.missing.length > 0);
  assert.ok(documents.how_to_improve.length > 0);
  assert.match(documents.how_to_improve.join(" "), /\w/);
});

test("ATI names the biggest lifts with the action that closes them", () => {
  const ati = computeATI(thinlyCovered());
  assert.ok(ati.biggest_lifts.length > 0);
  for (const lift of ati.biggest_lifts) {
    assert.ok(lift.action, "a lift without an action is not actionable");
    assert.ok(lift.points_available > 0);
  }
});

test("an unresolved conflict costs integrity but does not zero the field", () => {
  const clean = computeATI(wellDocumented());
  const conflicted = wellDocumented();
  const { point } = reconcile("total_time", [
    { value: 1245, source: faa("2026-09-19") },
    { value: 950, source: listing("2026-06-01") },
  ]);
  conflicted.fields.total_time = point;
  conflicted.conflicts = [point.conflict];

  const after = computeATI(conflicted);
  const consistency = after.dimensions.find((d) => d.key === "consistency");
  const cleanConsistency = clean.dimensions.find((d) => d.key === "consistency");

  assert.ok(consistency.score < cleanConsistency.score, "a conflict must reduce data integrity");
  // The contested value still counts for maintenance traceability — the data exists.
  const maintenance = after.dimensions.find((d) => d.key === "maintenance");
  assert.ok(maintenance.score > 0);
});

/* ------------------------------------------------------- knowledge state */

test("knowledge state separates what is known from what is not, and never conflates them", () => {
  const knowledge = knowledgeState(thinlyCovered(), computeATI(thinlyCovered()));
  assert.ok(knowledge.know.length > 0);
  assert.ok(knowledge.dontKnow.length > 0);
  assert.equal(knowledge.caveat, CAVEAT);
  assert.match(knowledge.caveat, /does not automatically mean a negative result/i);

  // An absence must be phrased as not-established, never as a negative finding.
  const damage = knowledge.dontKnow.find((d) => d.key === "damage_history");
  assert.ok(damage);
  assert.match(damage.text, /not established/i);
  assert.ok(!/no damage/i.test(damage.text), "must not claim the aircraft has no damage");
});

test("verification queue puts conflicts before transparency lifts", () => {
  const aircraft = wellDocumented();
  const { point } = reconcile("registered_owner", [
    { value: "EXAMPLE HOLDINGS LLC", source: faa() },
    { value: "SOMEONE ELSE INC", source: listing() },
  ]);
  aircraft.fields.registered_owner = point;
  aircraft.conflicts = [point.conflict];

  const knowledge = knowledgeState(aircraft, computeATI(aircraft));
  assert.equal(knowledge.verifyNext[0].kind, "conflict");
});

/* ------------------------------------------------------------ checklists */

test("a checklist step never claims a verification without naming a source", () => {
  for (const step of screeningChecklist(wellDocumented())) {
    if ([STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(step.state)) {
      assert.ok(step.source, `${step.key} claims ${step.state} with no source attributed`);
    }
  }
});

test("a step with no data reads as insufficient, not as a failure", () => {
  const steps = screeningChecklist(thinlyCovered());
  const maintenance = steps.find((s) => s.key === "maintenance");
  assert.equal(maintenance.state, STEP_STATE.INSUFFICIENT);
  assert.equal(maintenance.source, null);
});

test("the final commit step unlocks only once the ones before it close", () => {
  const thin = commitChecklist(thinlyCovered());
  assert.equal(thin[thin.length - 1].state, STEP_STATE.NOT_STARTED);
});

/* ---------------------------------------------------------------- report */

test("the report states what each score measures", () => {
  const report = buildReport(wellDocumented());
  for (const key of ["screening", "assessment", "verification", "overall", "ati"]) {
    assert.ok(report.scores[key].measures, `${key} score has no stated meaning`);
  }
  assert.match(report.scores.overall.measures, /evidence, not aircraft quality/i);
});

test("compliance is never reported as compliant without evidence", () => {
  const report = buildReport(thinlyCovered());
  const importExport = report.compliance.rows.find((r) => r.key === "import_export");
  assert.equal(importExport.state, COMPLIANCE_STATE.NOT_ASSESSED);
  assert.match(report.compliance.caveat, /has not checked it, not that the aircraft is non-compliant/i);

  // FAA must be N/A for a Czech aircraft, never a failure.
  const faaRow = report.compliance.rows.find((r) => r.key === "faa");
  assert.equal(faaRow.state, COMPLIANCE_STATE.NOT_APPLICABLE);
});

test("a maintenance data gap is informational, not a risk finding", () => {
  const report = buildReport(thinlyCovered());
  const maintenance = report.risk.categories.find((c) => c.key === "maintenance");
  assert.ok(maintenance.count > 0);
  assert.equal(maintenance.informational, true);
  // Gaps alone must not push the aircraft into an elevated risk level.
  assert.equal(report.risk.level, "low");
});

test("a real finding does raise the risk level", () => {
  const aircraft = wellDocumented();
  aircraft.fields.registration_status = reconcile("registration_status", [
    { value: "Revoked", source: faa() },
  ]).point;
  aircraft.fields.damage_history = reconcile("damage_history", [
    { value: "1 recorded event; substantial damage (2016)", source: source({ providerId: "ntsb", providerName: "NTSB" }) },
  ]).point;

  const report = buildReport(aircraft);
  assert.notEqual(report.risk.level, "low");
});

test("the report carries its disclaimers and never calls itself an appraisal", () => {
  const report = buildReport(wellDocumented());
  assert.match(report.executive_summary.conclusion_caveat, /not an appraisal/i);
  assert.match(report.executive_summary.conclusion_caveat, /not an airworthiness determination/i);
  assert.match(report.risk.caveat, /not a warranty of condition/i);
  assert.equal(report.meta.page_count, 8);
});

test("the report introduces no facts the layer did not already hold", () => {
  const aircraft = thinlyCovered();
  const report = buildReport(aircraft);
  // Nothing invented for a field no source supplied.
  assert.equal(report.market.asking, null);
  assert.equal(report.market.range_low, null);
  assert.match(report.market.summary, /does not currently have enough/i);
});
