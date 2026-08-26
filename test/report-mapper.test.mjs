import test from "node:test";
import assert from "node:assert/strict";
import { mapReport, hasUsableReport } from "../base44/functions/_shared/reportMapper.mjs";

// A full, well-formed atiReportScoreInternal result.
function rawReport(overrides = {}) {
  return {
    total: 92,
    score_label: "STRONG",
    dimensions: {
      airframe: {
        score: 12,
        justification: "Low time, damage-free.",
        strengths: ["1,200 TT"],
        risks: ["No logs seen"],
        missing: ["Logbook scans"],
      },
      engines: { score: 9, justification: "Mid-time.", strengths: [], risks: [], missing: [] },
    },
    dimension_scores: { airframe: 12, engines: 9 },
    summary: "A solid airframe with mid-time engines.",
    spec_table: [{ label: "Year", value: "2011" }],
    registration_extracted: "N123AB",
    omvm_low: 900000,
    omvm_high: 1100000,
    asking_price: 1050000,
    recommendations: ["Request the logbooks before offer."],
    ...overrides,
  };
}

test("an engine failure is not a report", () => {
  // atiReportScoreInternal signals failure with an `error` property rather
  // than throwing. If that slipped through, it would be mapped into a
  // report-shaped object with a null score and read as a real assessment.
  assert.equal(hasUsableReport({ error: "LLM timeout" }), false);
  assert.equal(hasUsableReport(null), false);
  assert.equal(hasUsableReport(undefined), false);
  assert.equal(hasUsableReport({}), false, "no total means no report");
  assert.equal(hasUsableReport(rawReport()), true);
  // A genuine zero score is a report, not a failure.
  assert.equal(hasUsableReport(rawReport({ total: 0 })), true);
});

test("the basic tier carries every dimension's number, and none of its narrative", () => {
  const basic = mapReport(rawReport(), "basic");
  assert.equal(basic.tier, "basic");
  assert.deepEqual(Object.keys(basic.dimensions).sort(), ["airframe", "engines"]);
  assert.deepEqual(basic.dimensions.airframe, { score: 12, max: 15 });
  for (const field of ["justification", "strengths", "risks", "missing"]) {
    assert.ok(!(field in basic.dimensions.airframe), `basic tier must not carry ${field}`);
  }
  assert.deepEqual(basic.recommendations, [], "recommendations are pro-tier reasoning");
});

test("the pro tier adds the reasoning the basic tier withholds", () => {
  const pro = mapReport(rawReport(), "pro");
  assert.equal(pro.tier, "pro");
  assert.equal(pro.dimensions.airframe.score, 12);
  assert.equal(pro.dimensions.airframe.justification, "Low time, damage-free.");
  assert.deepEqual(pro.dimensions.airframe.risks, ["No logs seen"]);
  assert.deepEqual(pro.recommendations, ["Request the logbooks before offer."]);
});

test("both tiers report the same score — the tier changes depth, never the assessment", () => {
  // The licence forbids a tenant altering the presentation of an ATI Score.
  // That guarantee fails if a cheaper plan can round, rescale or re-band it.
  const raw = rawReport();
  const basic = mapReport(raw, "basic");
  const pro = mapReport(raw, "pro");
  assert.equal(basic.ati_score, pro.ati_score);
  assert.equal(basic.rating, pro.rating);
  assert.equal(basic.summary, pro.summary);
  assert.equal(basic.dimensions.airframe.score, pro.dimensions.airframe.score);
});

test("the score is passed through, never recomputed from the dimensions", () => {
  // If this layer derived the total itself it could disagree with the engine,
  // and the engine is the only place the ATI methodology is allowed to live.
  const raw = rawReport({ total: 71 });
  assert.equal(mapReport(raw, "pro").ati_score, 71);
  assert.equal(mapReport(raw, "pro").ati_score_max, 120);
});

test("an unknown tier string is treated as basic, never as pro", () => {
  // Fail closed: a typo or a future capability name must not hand out the
  // paid tier's content.
  for (const tier of ["", "PRO", "enterprise", undefined, null]) {
    const mapped = mapReport(rawReport(), tier);
    assert.equal(mapped.tier, "basic", `tier ${JSON.stringify(tier)} must not grant pro`);
    assert.ok(!("justification" in mapped.dimensions.airframe));
    assert.deepEqual(mapped.recommendations, []);
  }
});

test("absent valuation bounds stay null, never zero", () => {
  // Same rule as valuationMapper: "we could not value this" must never be
  // renderable as "this aircraft is worth nothing".
  const mapped = mapReport(rawReport({ omvm_low: 0, omvm_high: undefined, asking_price: null }), "basic");
  assert.equal(mapped.valuation.omvm_low, null);
  assert.equal(mapped.valuation.omvm_high, null);
  assert.equal(mapped.valuation.asking_price, null);
});

test("a real asking price of zero is preserved, not nulled", () => {
  // asking_price is the seller's number, not ABOS's assessment — a genuine 0
  // (or a giveaway/trade listing) is data, so it uses ?? not ||.
  assert.equal(mapReport(rawReport({ asking_price: 0 }), "basic").valuation.asking_price, 0);
});

test("a malformed engine result maps without throwing", () => {
  // Defensive: the engine is an LLM pipeline, so missing or wrong-typed
  // fields are a realistic failure mode. Mapping must degrade, not crash.
  const mapped = mapReport({ total: 40 }, "pro");
  assert.deepEqual(mapped.dimensions, {});
  assert.deepEqual(mapped.specs, []);
  assert.deepEqual(mapped.recommendations, []);
  assert.equal(mapped.summary, null);
  assert.equal(mapped.registration, null);
  assert.deepEqual(mapReport({ total: 40, spec_table: "nope", recommendations: "nope" }, "pro").specs, []);
  assert.deepEqual(mapReport({ total: 40, recommendations: "nope" }, "pro").recommendations, []);
});

test("every report carries the not-an-appraisal disclaimer", () => {
  // Clause 9.1 of the licence agreement is a promise about what reaches the
  // end user, so it ships with the payload rather than living only in docs.
  for (const tier of ["basic", "pro"]) {
    assert.match(mapReport(rawReport(), tier).disclaimer, /not an appraisal/i);
  }
});
