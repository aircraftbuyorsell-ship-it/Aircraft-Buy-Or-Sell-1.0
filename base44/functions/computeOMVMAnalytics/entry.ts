import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * OMVM Analytics engine — hybrid Musk (data-driven regressions) + Option 3
 * (expert intervention calibration).
 *
 * Pipeline:
 *  1) Pull historical AircraftListing records (optionally filter by make/model).
 *  2) Build depreciation curve: price vs age (year now - year manufactured).
 *     Fit log-linear regression (price = A * exp(-k * age)).
 *  3) Build engine-remaining impact curve: price vs (tbo - engine_hours)/tbo.
 *  4) Aggregate market-demand signal: listings per month (last 18 months).
 *  5) Project future valuation for a target aircraft using curve + demand trend.
 *  6) Blend in ExpertValuation deltas as a calibration multiplier (Option 3).
 *
 * Body: { make?, model?, targetListingId?, horizonYears? (default 5) }
 */

function linearRegression(points) {
  // points: [{x, y}]
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, sampleSize: n };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  let ssRes = 0, ssTot = 0;
  for (const p of points) {
    const pred = slope * p.x + intercept;
    ssRes += (p.y - pred) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2, sampleSize: n };
}

function median(values) {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function ageAdjustPrice(price, fromAge, toAge, slope) {
  if (!Number.isFinite(price) || price <= 0) return null;
  return price * Math.exp(slope * (toAge - fromAge));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { make, model, targetListingId, horizonYears = 5 } = body;

    // 1) Pull historical listings
    const filter = {};
    if (make) filter.make = make;
    if (model) filter.model = model;
    const listings = await base44.asServiceRole.entities.AircraftListing.filter(
      filter, "-created_date", 1000
    );
    const valid = listings.filter(
      (l) => l.asking_price > 5000 && l.year && l.year > 1950
    );

    const currentYear = new Date().getFullYear();

    let target = null;
    if (targetListingId) {
      target = await base44.asServiceRole.entities.AircraftListing.get(targetListingId);
    }

    // 2) Depreciation curve: age vs log(price)
    const agePoints = valid
      .filter((l) => l.asking_price > 0)
      .map((l) => ({ x: currentYear - l.year, y: Math.log(l.asking_price) }));
    const dep = linearRegression(agePoints);
    const priceSamples = valid.map((l) => l.asking_price);
    const medianComparablePrice = median(priceSamples);
    const targetAge = target ? currentYear - (target.year || currentYear) : null;
    const benchmarkValue = target?.asking_price || medianComparablePrice || 0;

    // price(age) = exp(intercept + slope * age), with data-driven fallback when samples are sparse
    const depreciationCurve = Array.from({ length: 51 }, (_, age) => {
      const regressionPrice = dep.sampleSize >= 2 ? Math.exp(dep.intercept + dep.slope * age) : null;
      const adjustedBenchmark = targetAge != null
        ? ageAdjustPrice(benchmarkValue, targetAge, age, dep.slope)
        : benchmarkValue;
      return {
        age,
        estimated_price: Math.round(regressionPrice || adjustedBenchmark || 0),
      };
    });
    const annualDepreciationPct = Math.round((1 - Math.exp(dep.slope)) * 1000) / 10;

    // 3) Engine-remaining impact: (tbo - engine_hours)/tbo vs price
    const engineValid = valid.filter(
      (l) => l.tbo > 0 && l.engine_hours >= 0 && l.asking_price > 0
    );
    const enginePoints = engineValid.map((l) => ({
      x: Math.max(0, Math.min(1, (l.tbo - l.engine_hours) / l.tbo)),
      y: l.asking_price,
    }));
    const eng = linearRegression(enginePoints);
    const engineImpactPer10pct = Math.round(eng.slope * 0.1);

    // 4) Market demand: listings per month (last 18 months)
    const now = Date.now();
    const monthMs = 30 * 24 * 3600 * 1000;
    const demandBuckets = Array.from({ length: 18 }, (_, i) => {
      const from = now - (i + 1) * monthMs;
      const to = now - i * monthMs;
      const count = valid.filter((l) => {
        const t = new Date(l.created_date).getTime();
        return t >= from && t < to;
      }).length;
      const d = new Date(to);
      return {
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        listings: count,
      };
    }).reverse();
    const avgDemand =
      demandBuckets.reduce((s, b) => s + b.listings, 0) / demandBuckets.length;
    const recent6 = demandBuckets.slice(-6);
    const recentAvg =
      recent6.reduce((s, b) => s + b.listings, 0) / recent6.length;
    const demandTrendPct =
      avgDemand === 0 ? 0 : Math.round(((recentAvg - avgDemand) / avgDemand) * 1000) / 10;

    // 5) Expert calibration multiplier (Option 3 feedback loop)
    const expertReviews = await base44.asServiceRole.entities.ExpertValuation.filter(
      { status: "accepted" }, "-created_date", 200
    );
    const deltas = expertReviews
      .filter((e) => Number.isFinite(e.delta_pct))
      .map((e) => e.delta_pct);
    const avgExpertDelta =
      deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
    const calibrationMultiplier = 1 + avgExpertDelta / 100;

    // 6) Projection for target listing (or synthetic)
    let projection = null;
    if (target) {
      const baseAge = currentYear - (target.year || currentYear);
      // Future demand factor: apply compounding demand trend diluted over years
      const years = Array.from({ length: horizonYears + 1 }, (_, i) => i);
      projection = years.map((y) => {
        const age = baseAge + y;
        const regressionPrice = dep.sampleSize >= 2 ? Math.exp(dep.intercept + dep.slope * age) : null;
        const benchmarkPrice = ageAdjustPrice(benchmarkValue, baseAge, age, dep.slope);
        const rawPrice = regressionPrice || benchmarkPrice || 0;
        // Engine adjustment relative to current engine (assume +100h/year usage)
        const projectedEngineHours = (target.engine_hours || 0) + y * 100;
        const engFrac = target.tbo
          ? Math.max(0, Math.min(1, (target.tbo - projectedEngineHours) / target.tbo))
          : 0.5;
        const engineAdj = eng.slope * (engFrac - 0.5); // center at 50% remaining
        const demandFactor = 1 + (demandTrendPct / 100) * Math.max(0, 1 - y * 0.2);
        const calibrated =
          (rawPrice + engineAdj) * demandFactor * calibrationMultiplier;
        return {
          year: currentYear + y,
          age,
          projected_value: Math.max(0, Math.round(calibrated)),
        };
      });
    }

    return Response.json({
      ok: true,
      sample_size: valid.length,
      filters: { make: make || null, model: model || null },
      depreciation: {
        curve: depreciationCurve,
        annual_pct: annualDepreciationPct,
        r2: Math.round(dep.r2 * 1000) / 1000,
      },
      engine_impact: {
        slope: Math.round(eng.slope),
        value_per_10pct_remaining: engineImpactPer10pct,
        r2: Math.round(eng.r2 * 1000) / 1000,
      },
      market_demand: {
        monthly: demandBuckets,
        trend_pct: demandTrendPct,
        avg_monthly: Math.round(avgDemand * 10) / 10,
      },
      expert_calibration: {
        avg_delta_pct: Math.round(avgExpertDelta * 100) / 100,
        multiplier: Math.round(calibrationMultiplier * 10000) / 10000,
        sample: deltas.length,
      },
      valuation_basis: {
        median_comparable_price: medianComparablePrice ? Math.round(medianComparablePrice) : null,
        benchmark_value: Math.round(benchmarkValue),
        regression_sample_size: dep.sampleSize,
        fallback_used: dep.sampleSize < 2,
      },
      projection,
      target: target
        ? {
            id: target.id,
            label: `${target.year} ${target.make} ${target.model}`,
            registration: target.registration,
            asking_price: target.asking_price,
          }
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});