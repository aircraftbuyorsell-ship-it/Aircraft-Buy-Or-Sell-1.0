import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * OMVM v5 — Off-Market Valuation Model
 * Log-linear depreciation + engine remaining curve + expert calibration.
 * Body: { listingId } OR { make, model, year, engine_hours, tbo, avionics, asking_price }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { listingId } = body;

    let listing = null;
    if (listingId) {
      listing = await base44.entities.AircraftListing.get(listingId);
      if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    } else {
      listing = body; // inline data
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - (listing.year || currentYear);

    // 1) Pull historical comps for make/model
    const filter = {};
    if (listing.make) filter.make = listing.make;
    if (listing.model) filter.model = listing.model;
    const comps = await base44.asServiceRole.entities.AircraftListing.filter(filter, '-created_date', 500);
    const valid = comps.filter(l => l.asking_price > 5000 && l.year && l.year > 1950 && l.id !== listingId);

    // 2) Depreciation curve — log-linear regression: ln(price) ~ age
    let slope = -0.04, intercept = 12.5; // sensible defaults
    if (valid.length >= 3) {
      const pts = valid.map(l => ({ x: currentYear - l.year, y: Math.log(l.asking_price) }));
      const n = pts.length;
      const sx = pts.reduce((s, p) => s + p.x, 0) / n;
      const sy = pts.reduce((s, p) => s + p.y, 0) / n;
      let num = 0, den = 0;
      for (const p of pts) { num += (p.x - sx) * (p.y - sy); den += (p.x - sx) ** 2; }
      if (den > 0) { slope = num / den; intercept = sy - slope * sx; }
    }

    // 3) Engine remaining value adjustment
    const tbo = listing.tbo || 2000;
    const engineHours = listing.engine_hours || 0;
    const engineRemainingFrac = Math.max(0, Math.min(1, (tbo - engineHours) / tbo));

    // Engine impact: ~$25k premium for fresh engine (fraction = 1.0) vs run-out (0)
    let engineSlope = 25000;
    const engValid = valid.filter(l => l.tbo > 0 && l.engine_hours >= 0);
    if (engValid.length >= 3) {
      const pts = engValid.map(l => ({
        x: Math.max(0, Math.min(1, (l.tbo - l.engine_hours) / l.tbo)),
        y: l.asking_price
      }));
      const n = pts.length;
      const sx = pts.reduce((s, p) => s + p.x, 0) / n;
      const sy = pts.reduce((s, p) => s + p.y, 0) / n;
      let num = 0, den = 0;
      for (const p of pts) { num += (p.x - sx) * (p.y - sy); den += (p.x - sx) ** 2; }
      if (den > 0) engineSlope = num / den;
    }

    // 4) Expert calibration multiplier
    const expertReviews = await base44.asServiceRole.entities.ExpertValuation.filter(
      { status: 'accepted' }, '-created_date', 100
    );
    const deltas = expertReviews.filter(e => Number.isFinite(e.delta_pct)).map(e => e.delta_pct);
    const avgExpertDelta = deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
    const calibrationMultiplier = 1 + avgExpertDelta / 100;

    // 5) Avionics premium
    const avionicsList = (listing.avionics || '').split(',').map(a => a.trim()).filter(Boolean);
    const avionicsPremium = avionicsList.length * 3500;

    // 6) Base OMVM calculation
    const regressionBase = valid.length >= 3 ? Math.exp(intercept + slope * age) : null;

    // Fallback: use median of comps if regression fails
    const prices = valid.map(l => l.asking_price).sort((a, b) => a - b);
    const medianBase = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 150000;

    const baseValue = regressionBase || medianBase;
    const engineAdj = engineSlope * (engineRemainingFrac - 0.5); // centered at 50% remaining
    const rawOMVM = (baseValue + engineAdj + avionicsPremium) * calibrationMultiplier;
    const omvmValue = Math.max(10000, Math.round(rawOMVM / 1000) * 1000);

    // 7) Deal scoring
    const askingPrice = listing.asking_price || null;
    const discountPct = askingPrice ? Math.round(((omvmValue - askingPrice) / omvmValue) * 1000) / 10 : null;
    const dealScore = discountPct == null ? null
      : discountPct > 25 ? 9.5
      : discountPct > 15 ? 8.5
      : discountPct > 8 ? 7.5
      : discountPct > 2 ? 6.5
      : discountPct < -15 ? 2.5
      : discountPct < -5 ? 4.0
      : 5.0;
    const dealLabel = dealScore == null ? null
      : dealScore >= 8.5 ? 'hot deal'
      : dealScore >= 6.5 ? 'good deal'
      : dealScore >= 5 ? 'fair'
      : 'overpriced';

    // 8) Confidence
    const confidence = valid.length >= 10 ? 'HIGH' : valid.length >= 3 ? 'MEDIUM' : 'LOW';

    // 9) Persist to listing if we have an ID
    if (listingId) {
      await base44.entities.AircraftListing.update(listingId, {
        omvm_value: omvmValue,
        deal_score: dealScore,
        deal_label: dealLabel,
        discount_pct: discountPct,
      });
    }

    return Response.json({
      ok: true,
      omvm_value: omvmValue,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
      confidence,
      comp_sample: valid.length,
      engine_remaining_pct: Math.round(engineRemainingFrac * 100),
      expert_calibration: { avg_delta_pct: avgExpertDelta, multiplier: calibrationMultiplier, sample: deltas.length },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});