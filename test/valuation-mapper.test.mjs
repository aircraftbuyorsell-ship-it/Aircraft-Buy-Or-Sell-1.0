import test from "node:test";
import assert from "node:assert/strict";
import { mapValuation, hasUsableValuation } from "../base44/functions/_shared/valuationMapper.mjs";

const AIRCRAFT = { manufacturer: "Cessna", model: "172", year: 2019, hours: 1200 };

test("hasUsableValuation distinguishes a real valuation from a refusal", () => {
  assert.equal(hasUsableValuation({ omvm_value: 250000 }), true);
  assert.equal(hasUsableValuation({ status: "insufficient_comparables", omvm_value: null }), false);
  assert.equal(hasUsableValuation({ omvm_value: null }), false);
  assert.equal(hasUsableValuation(null), false);
  assert.equal(hasUsableValuation(undefined), false);

  // A genuine zero-ish value is still a valuation, not a refusal.
  assert.equal(hasUsableValuation({ omvm_value: 0 }), true);
});

test("a refused valuation returns null, never zero", () => {
  // Rendering a refusal as 0 would tell a buyer the aircraft is worthless,
  // which is a materially different (and false) claim from "we don't know".
  const result = mapValuation({ status: "insufficient_comparables" }, AIRCRAFT);
  assert.equal(result.estimated_value, null);
  assert.equal(result.range.min, null);
  assert.equal(result.range.max, null);
  assert.equal(result.confidence, null);
  assert.match(result.rationale, /not enough evidence/i);
  assert.equal(result.model_version, "omvm-v5");
});

test("a refusal carries the engine's own message when it gives one", () => {
  const result = mapValuation({ status: "insufficient_comparables", message: "Only 1 comparable found." }, AIRCRAFT);
  assert.equal(result.rationale, "Only 1 comparable found.");
});

test("a usable valuation is mapped with a derived range", () => {
  const result = mapValuation({ omvm_value: 200000, confidence: "HIGH", comp_sample: 7 }, AIRCRAFT);
  assert.equal(result.estimated_value, 200000);
  assert.equal(result.range.min, 170000, "15% below");
  assert.equal(result.range.max, 230000, "15% above");
  assert.equal(result.currency, "USD");
  assert.equal(result.confidence, "high", "confidence is normalized to lowercase");
  assert.match(result.rationale, /7 comparable/);
});

test("live market prices override the derived range when present", () => {
  const result = mapValuation({
    omvm_value: 200000,
    confidence: "medium",
    market_intelligence: { live_min_price: 180000, live_max_price: 260000, notes: "Live market spread." },
  }, AIRCRAFT);
  assert.equal(result.range.min, 180000);
  assert.equal(result.range.max, 260000);
  assert.equal(result.rationale, "Live market spread.");
});

test("the derived range floor never goes negative", () => {
  const result = mapValuation({ omvm_value: 100 }, AIRCRAFT);
  assert.ok(result.range.min >= 0, "a valuation range must not imply negative value");
});

test("the request aircraft is echoed back, with nulls for anything absent", () => {
  const full = mapValuation({ omvm_value: 1000 }, AIRCRAFT);
  assert.deepEqual(full.aircraft, AIRCRAFT);

  const sparse = mapValuation({ omvm_value: 1000 }, { manufacturer: "Piper" });
  assert.deepEqual(sparse.aircraft, { manufacturer: "Piper", model: null, year: null, hours: null });

  const none = mapValuation({ omvm_value: 1000 }, undefined);
  assert.deepEqual(none.aircraft, { manufacturer: null, model: null, year: null, hours: null });
});

test("confidence passes through unchanged when it isn't a string", () => {
  assert.equal(mapValuation({ omvm_value: 1, confidence: 0.82 }, AIRCRAFT).confidence, 0.82);
  assert.equal(mapValuation({ omvm_value: 1 }, AIRCRAFT).confidence, undefined);
});

test("both valuation shapes always carry the same keys", () => {
  // A consumer must not have to branch on which shape it got.
  const refused = mapValuation({ status: "insufficient_comparables" }, AIRCRAFT);
  const valued = mapValuation({ omvm_value: 200000 }, AIRCRAFT);
  assert.deepEqual(Object.keys(refused).sort(), Object.keys(valued).sort());
  assert.deepEqual(Object.keys(refused.range).sort(), Object.keys(valued.range).sort());
});
