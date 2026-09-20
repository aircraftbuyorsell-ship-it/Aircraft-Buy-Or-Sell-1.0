/**
 * ABOS Intelligence Layer — behavioural tests.
 *
 * These lock in the rules that make the layer trustworthy rather than merely
 * functional: absence is never a negative fact, conflicts are never silently
 * resolved, and no premium provider is ever called on a free policy.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  DATA_STATUS, DATA_CLASS, dataPoint, unavailable, notApplicable, source,
  hasValue, explain, aggregateConfidence,
} from "../src/intelligence/provenance.js";
import { createAircraft, setField, field, value, toApiShape } from "../src/intelligence/schema.js";
import { reconcile, valuesAgree, conflictSeverity } from "../src/intelligence/conflict.js";
import { buildPlan, POLICY, providerAppliesTo } from "../src/intelligence/router.js";
import { getProvider, publicProviderView, publicProviderCatalogue } from "../src/intelligence/registry.js";
import { screen, VERDICT } from "../src/intelligence/decision/screen.js";
import { assess } from "../src/intelligence/decision/assess.js";

const faaSource = (date = "2026-09-01") => source({ providerId: "faa", providerName: "FAA registry", sourceDate: date });
const listingSource = (date = "2026-09-15") => source({ providerId: "abos_listing", providerName: "ABOS listing", sourceDate: date });
const jetnetSource = (date = "2026-08-20") => source({ providerId: "jetnet", providerName: "JETNET", sourceDate: date });

function build(fields = {}) {
  let aircraft = createAircraft();
  for (const [key, candidates] of Object.entries(fields)) {
    const { point } = reconcile(key, candidates);
    aircraft = setField(aircraft, key, point);
  }
  const conflicts = Object.values(aircraft.fields).map((p) => p.conflict).filter(Boolean);
  aircraft.conflicts = conflicts;
  aircraft.identity_confidence = fields.__identity ?? 0.9;
  aircraft.provider_calls = [];
  return aircraft;
}

/* ------------------------------------------------------ the absence rule */

test("missing data is UNAVAILABLE, never zero and never a negative finding", () => {
  const point = unavailable("No source consulted returned this.");
  assert.equal(point.status, DATA_STATUS.UNAVAILABLE);
  assert.equal(point.value, null);
  assert.notEqual(point.value, 0);
  assert.equal(point.dataClass, DATA_CLASS.MISSING);
  assert.equal(hasValue(point), false);

  const rendered = explain(point, { fieldLabel: "Airframe total time" });
  assert.equal(rendered.display, "No data available");
  assert.match(rendered.status, /Unavailable/);
});

test("a brand new aircraft has every field explicitly not-retrieved, not undefined", () => {
  const aircraft = createAircraft();
  assert.equal(field(aircraft, "total_time").status, DATA_STATUS.UNAVAILABLE);
  assert.equal(field(aircraft, "damage_history").value, null);
  assert.equal(value(aircraft, "asking_price", "fallback"), "fallback");
});

test("not-applicable is distinct from unavailable (EU aircraft, FAA-only fields)", () => {
  const point = notApplicable("This aircraft is not on the US register.");
  assert.equal(point.status, DATA_STATUS.NOT_APPLICABLE);
  // Aggregate confidence must not count an N/A field against coverage.
  const agg = aggregateConfidence([point, dataPoint("Cessna", { sources: [faaSource()] })]);
  assert.equal(agg.total, 1);
  assert.equal(agg.known, 1);
});

/* ---------------------------------------------------- reconcile: agreement */

test("two independent sources that agree promote a field to VERIFIED", () => {
  const { point, conflict } = reconcile("serial_number", [
    { value: "172S-10842", source: faaSource() },
    { value: "172S10842", source: jetnetSource() },
  ]);
  assert.equal(conflict, null);
  assert.equal(point.status, DATA_STATUS.VERIFIED);
  assert.ok(point.confidence > 0.85, `expected high confidence, got ${point.confidence}`);
  assert.equal(point.crossCheckedAgainst.length, 2);
});

test("a single listing-supplied figure stays UNVERIFIED", () => {
  const { point } = reconcile("total_time", [{ value: 3840, source: listingSource() }]);
  assert.equal(point.status, DATA_STATUS.UNVERIFIED);
  assert.ok(point.confidence < 0.6);
});

test("hour figures within reporting tolerance are treated as the same fact", () => {
  assert.equal(valuesAgree("total_time", 3842.6, 3840), true);
  assert.equal(valuesAgree("total_time", 3842.6, 3760), false);
  // Manufacturer naming noise is not a conflict.
  assert.equal(valuesAgree("manufacturer", "CESSNA AIRCRAFT CO", "Cessna"), true);
});

/* ---------------------------------------------------- reconcile: conflict */

test("disagreeing sources produce a conflict — never a silent overwrite", () => {
  const { point, conflict } = reconcile("total_time", [
    { value: 3842.6, source: faaSource("2026-09-19") },
    { value: 3760, source: listingSource("2026-06-01") },
  ]);

  assert.equal(point.status, DATA_STATUS.CONFLICTING);
  assert.ok(point.conflict, "the data point must carry its conflict");
  assert.equal(conflict.values.length, 2);

  const values = conflict.values.map((v) => v.value).sort((a, b) => a - b);
  assert.deepEqual(values, [3760, 3842.6]);

  assert.ok(Math.abs(conflict.difference - 82.6) < 0.01);
  assert.match(conflict.likely_reason, /reporting dates/i);
  assert.match(conflict.required_action, /logbook/i);

  // A contested figure never reads as confident.
  assert.ok(point.confidence <= 0.5, `contested value should not be confident, got ${point.confidence}`);
});

test("identity conflicts rank above hour drift", () => {
  const identityConflict = reconcile("serial_number", [
    { value: "172S-10842", source: faaSource() },
    { value: "172S-99999", source: jetnetSource() },
  ]).conflict;
  const hoursConflict = reconcile("total_time", [
    { value: 3842.6, source: faaSource() },
    { value: 3760, source: listingSource() },
  ]).conflict;

  assert.equal(conflictSeverity(identityConflict), "high");
  assert.ok(["low", "medium"].includes(conflictSeverity(hoursConflict)));
});

/* ------------------------------------------------------------ the router */

test("SCREEN never routes to a premium provider and never spends money", () => {
  const { plan, estimatedCostEur } = buildPlan({
    policy: POLICY.SCREEN,
    context: { registration: "N7692J", country: "US" },
  });
  assert.equal(estimatedCostEur, 0);
  const ids = plan.map((s) => s.provider_id);
  assert.ok(!ids.includes("jetnet"));
  assert.ok(!ids.includes("vref"));
  assert.ok(!ids.includes("flightaware"));
  assert.ok(ids.includes("faa"), "a US registration must reach the FAA");
});

test("the plan is ordered cheapest and most trusted first", () => {
  const { plan } = buildPlan({ policy: POLICY.ASSESS, context: { registration: "N7692J" } });
  const tiers = plan.map((s) => s.tier);
  assert.deepEqual(tiers, [...tiers].sort((a, b) => a - b), "tiers must ascend");
  assert.equal(plan[0].estimated_cost_eur, 0, "the first call must be free");
});

test("registry providers are only asked about registrations they cover", () => {
  const faa = getProvider("faa");
  const national = getProvider("national_registries");

  assert.equal(providerAppliesTo(faa, { registration: "N7692J" }), true);
  assert.equal(providerAppliesTo(faa, { registration: "OK-ABC" }), false);
  assert.equal(providerAppliesTo(national, { registration: "OK-ABC" }), true);
  assert.equal(providerAppliesTo(national, { registration: "N7692J" }), false);

  const { plan } = buildPlan({ policy: POLICY.SCREEN, context: { registration: "OK-ABC" } });
  const ids = plan.map((s) => s.provider_id);
  assert.ok(!ids.includes("faa"), "asking the FAA about an OK- aircraft is a wasted call");
  assert.ok(!ids.includes("ntsb"));
  assert.ok(ids.includes("national_registries"));
});

test("a provider is skipped rather than routed when it is above the budget", () => {
  const tight = { ...POLICY.COMMIT, budgetEur: 1 };
  const { plan, skipped } = buildPlan({ policy: tight, context: { registration: "N7692J" } });
  const ids = plan.map((s) => s.provider_id);
  const overBudget = skipped.filter((s) => s.reason === "over_budget").map((s) => s.provider_id);
  for (const id of ids) {
    assert.ok((getProvider(id)?.cost_per_call_eur || 0) <= 1);
  }
  assert.ok(Array.isArray(overBudget));
});

test("public provider views never leak pricing or contract terms", () => {
  const view = publicProviderView(getProvider("jetnet"));
  assert.equal(view.label, "JETNET");
  assert.equal(view.status, "available on request");
  assert.equal(view.cost_per_call_eur, undefined);
  assert.equal(view.pricing_model, undefined);
  assert.equal(view.commercial_use, undefined);

  for (const p of publicProviderCatalogue()) {
    assert.equal(Object.keys(p).some((k) => /cost|pricing|commercial|licen/i.test(k)), false);
  }
});

/* ------------------------------------------------------------ SCREEN */

test("a European aircraft with no US data is not penalised into STOP", () => {
  const aircraft = build({
    registration: [{ value: "OK-ABC", source: source({ providerId: "national_registries", providerName: "Czech CAA", sourceDate: "2026-09-01" }) }],
    manufacturer: [{ value: "Cessna", source: source({ providerId: "national_registries", providerName: "Czech CAA" }) }],
    model: [{ value: "172S", source: source({ providerId: "national_registries", providerName: "Czech CAA" }) }],
    registration_status: [{ value: "Valid", source: source({ providerId: "national_registries", providerName: "Czech CAA" }) }],
  });

  const result = screen(aircraft);
  assert.notEqual(result.verdict, VERDICT.STOP, "missing FAA/NTSB data must never produce STOP");
  assert.ok(result.checks.length > 0);

  const history = result.checks.find((c) => c.id === "history");
  assert.equal(history.state, "unknown");
  assert.match(history.detail, /Nothing is implied/i);
});

test("STOP requires an actual finding, not an absence", () => {
  const aircraft = build({
    registration: [{ value: "N7692J", source: faaSource() }],
    registration_status: [{ value: "Revoked", source: faaSource() }],
    serial_number: [
      { value: "172S-10842", source: faaSource() },
      { value: "172S-99999", source: jetnetSource() },
    ],
  });
  const result = screen(aircraft);
  assert.equal(result.verdict, VERDICT.STOP);
  assert.ok(result.reasons.length > 0);
});

test("screen always carries its disclaimer and never claims airworthiness", () => {
  const result = screen(build({ registration: [{ value: "N7692J", source: faaSource() }] }));
  assert.match(result.disclaimer, /not an airworthiness determination/i);
  assert.match(result.disclaimer, /not a legal opinion/i);
});

/* ------------------------------------------------------------ ASSESS */

function valuedAircraft({ asking = 1250000, omvm = 1210000, low = 1150000, high = 1320000 } = {}) {
  const omvmSource = source({ providerId: "abos_omvm", providerName: "ABOS Market Model", type: DATA_CLASS.ABOS_CALCULATION, sourceDate: "2026-09-19" });
  return build({
    registration: [{ value: "N7692J", source: faaSource() }],
    manufacturer: [{ value: "Cessna", source: faaSource() }],
    model: [{ value: "Citation XLS", source: faaSource() }],
    asking_price: [{ value: asking, source: listingSource() }],
    estimated_value: [{ value: omvm, source: omvmSource, dataClass: DATA_CLASS.ABOS_CALCULATION, calculation: "OMVM v5" }],
    value_low: [{ value: low, source: omvmSource, dataClass: DATA_CLASS.ABOS_CALCULATION }],
    value_high: [{ value: high, source: omvmSource, dataClass: DATA_CLASS.ABOS_CALCULATION }],
    comparable_count: [{ value: 12, source: omvmSource }],
  });
}

test("assess keeps every valuation attributable — no merged mystery number", () => {
  const result = assess(valuedAircraft());
  assert.ok(result.valuations.length >= 1);
  for (const v of result.valuations) {
    assert.ok(v.provider_id, "every valuation must name its provider");
    assert.ok(v.label);
  }
  assert.ok(result.synthesized.method, "the synthesized range must explain itself");
  assert.ok(result.synthesized.inputs.length > 0);
});

test("assess positions the asking price against the modelled range", () => {
  const within = assess(valuedAircraft({ asking: 1250000 }));
  assert.equal(within.position.state, "within");

  const above = assess(valuedAircraft({ asking: 2000000 }));
  assert.equal(above.position.state, "above");
  assert.ok(above.position.delta_pct > 0);
  assert.match(above.conclusion, /above the modelled range/i);

  const below = assess(valuedAircraft({ asking: 500000 }));
  assert.equal(below.position.state, "below");
});

test("assess names the condition factors it could not account for", () => {
  const result = assess(valuedAircraft());
  assert.ok(result.unaccounted_factors.length > 0);
  assert.ok(result.unexplained_swing_pct > 0);
  const labels = result.unaccounted_factors.map((f) => f.label);
  assert.ok(labels.includes("Engine status"));
});

test("assess with no valuation input says so instead of inventing a number", () => {
  const bare = build({ registration: [{ value: "N7692J", source: faaSource() }] });
  const result = assess(bare);
  assert.equal(result.synthesized.low, null);
  assert.equal(result.position.state, "unknown");
  assert.match(result.conclusion, /does not currently have enough/i);
});

test("assess is never described as a certified appraisal", () => {
  const result = assess(valuedAircraft());
  assert.match(result.disclaimer, /not a certified appraisal/i);
  assert.match(result.disclaimer, /znaleck/i);
});

/* ------------------------------------------------------------ API shape */

test("the API returns data and provenance together, never data alone", () => {
  const aircraft = valuedAircraft();
  aircraft.resolved_at = new Date().toISOString();
  const api = toApiShape(aircraft);

  assert.ok(api.aircraft.registration);
  assert.ok(api.provenance, "provenance is not optional");
  assert.ok(api.provenance.sources.length > 0);

  for (const key of Object.keys(api.aircraft)) {
    if (["identity_confidence", "sources", "registration", "serial_number", "manufacturer", "model", "year", "country", "registry"].includes(key)) continue;
    assert.ok(api.provenance.fields[key], `field ${key} was returned without provenance`);
  }
});
