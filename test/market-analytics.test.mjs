import test from "node:test";
import assert from "node:assert/strict";
import { computeMarketAnalytics } from "../base44/functions/_shared/marketAnalytics.mjs";
import { mapMarketIntelligence } from "../base44/functions/_shared/marketIntelligenceMapper.mjs";

// Fixed reference time so month bucketing and days-on-market are reproducible.
const NOW = new Date("2026-08-26T12:00:00.000Z");

function listing(over = {}) {
  return {
    make: "Cessna",
    model: "172",
    status: "active",
    asking_price: 100000,
    created_date: "2026-08-01T00:00:00Z",
    ...over,
  };
}

/** Enough listings to clear the mapper's minimum-signal threshold. */
function sample(n = 6, over = {}) {
  return Array.from({ length: n }, (_, i) => listing({ asking_price: 100000 + i * 1000, ...over }));
}

test("summary counts active and sold separately", () => {
  const d = computeMarketAnalytics(
    [listing(), listing({ status: "sold" }), listing({ status: "draft" })],
    NOW,
  );
  assert.equal(d.summary.total, 3);
  assert.equal(d.summary.active, 1);
  assert.equal(d.summary.sold, 1);
});

test("median price is a true median, not a mean", () => {
  const prices = [100, 200, 900].map((p) => listing({ asking_price: p }));
  assert.equal(computeMarketAnalytics(prices, NOW).summary.medianPrice, 200);
  // Even count averages the two middle values.
  const even = [100, 200, 300, 900].map((p) => listing({ asking_price: p }));
  assert.equal(computeMarketAnalytics(even, NOW).summary.medianPrice, 250);
});

test("listings without a price or score are excluded, not counted as zero", () => {
  // Treating a missing price as 0 would drag the median toward nothing and
  // make the market look like it had collapsed.
  const d = computeMarketAnalytics(
    [listing({ asking_price: 200000, ati_score: 90 }), listing({ asking_price: null, ati_score: null })],
    NOW,
  );
  assert.equal(d.summary.medianPrice, 200000);
  assert.equal(d.summary.avgAti, 90);
});

test("an empty market yields nulls, never zeroes", () => {
  const d = computeMarketAnalytics([], NOW);
  assert.equal(d.summary.total, 0);
  assert.equal(d.summary.medianPrice, null);
  assert.equal(d.summary.avgAti, null);
  assert.equal(d.delta, null);
  assert.deepEqual(d.topModels, []);
});

test("the monthly trend always spans twelve buckets, gaps included", () => {
  const d = computeMarketAnalytics([listing()], NOW);
  assert.equal(d.monthly.length, 12);
  // A month with no listings reports a null average, not a zero one.
  const empty = d.monthly.find((m) => m.listings === 0);
  assert.ok(empty, "expected at least one empty month in this fixture");
  assert.equal(empty.avgPrice, null);
});

test("days on market measures sold listings to their sale, not to today", () => {
  const d = computeMarketAnalytics(
    [listing({
      status: "sold",
      created_date: "2026-06-01T00:00:00Z",
      updated_date: "2026-07-01T00:00:00Z",
    })],
    NOW,
  );
  assert.equal(d.daysOnMarket[0].avgDays, 30);
  assert.equal(d.daysOnMarket[0].sold, 1);
});

test("results are deterministic for a given reference time", () => {
  // The clock is injected precisely so this holds — otherwise these numbers
  // would drift under test and the module could not be pinned at all.
  const input = sample();
  assert.deepEqual(
    computeMarketAnalytics(input, NOW),
    computeMarketAnalytics(input, NOW),
  );
  assert.equal(computeMarketAnalytics(input, NOW).generated_at, NOW.toISOString());
});

test("a thin sample is withheld rather than reported as market signal", () => {
  // Aggregates over a handful of listings are noise. A tenant rendering a
  // "median price" from two of them presents ABOS's noise as ABOS's judgement.
  const thin = mapMarketIntelligence(computeMarketAnalytics(sample(2), NOW));
  assert.equal(thin.sufficient_data, false);
  assert.equal(thin.market, null);
  assert.equal(thin.price_change, null);
  assert.deepEqual(thin.price_trend, []);
  assert.deepEqual(thin.top_models, []);
  assert.deepEqual(thin.days_on_market, []);
  assert.deepEqual(thin.category_trends, []);
  assert.match(thin.note, /omitted rather than reported/i);
});

test("a sufficient sample is reported in the v1 contract shape", () => {
  const mapped = mapMarketIntelligence(computeMarketAnalytics(sample(6), NOW));
  assert.equal(mapped.sufficient_data, true);
  assert.equal(mapped.note, null);
  assert.equal(mapped.market.listings_total, 6);
  assert.equal(mapped.market.currency, "USD");
  assert.ok(Number.isFinite(mapped.market.median_asking_price));
  assert.equal(mapped.price_trend.length, 12);
  assert.ok("average_asking_price" in mapped.price_trend[0]);
  assert.equal(mapped.model_version, "market-intelligence-v1");
});

test("the ABOS dashboard's chart palette is not shipped to tenants", () => {
  // `color` is the ABOS dashboard's palette. A white-label tenant brands its
  // own UI; shipping our colours would invite them to render ours inside it.
  const raw = computeMarketAnalytics(sample(6), NOW);
  assert.ok("color" in raw.categoryTrends[0], "the internal shape does carry a colour");
  const mapped = mapMarketIntelligence(raw);
  for (const category of mapped.category_trends) {
    assert.ok(!("color" in category), "the v1 contract must not carry it");
  }
});

test("mapping degrades rather than throwing on a malformed analytics payload", () => {
  for (const input of [null, undefined, {}, { summary: null }]) {
    const mapped = mapMarketIntelligence(input);
    assert.equal(mapped.sufficient_data, false);
    assert.equal(mapped.market, null);
  }
});

test("every market payload carries its sample-scope disclaimer", () => {
  // The data describes the listings ABOS knows about, not the whole market.
  // Stating that travels with the payload rather than living only in docs.
  const mapped = mapMarketIntelligence(computeMarketAnalytics(sample(6), NOW));
  assert.match(mapped.disclaimer, /not an appraisal/i);
  assert.match(mapped.disclaimer, /describes that sample, not the whole market/i);
});
