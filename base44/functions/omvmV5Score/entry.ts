import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Category depreciation table for rare aircraft with < 3 comps.
 * Returns a depreciated base value using (base * (1 - rate)^age), floored at $10K.
 */
function getCategoryBaseValue(make, model, age) {
  const categories = {
    // Single-engine piston
    'cessna':       { base: 80000,   annualDepreciation: 0.03 },
    'piper':        { base: 75000,   annualDepreciation: 0.03 },
    'beechcraft':   { base: 120000,  annualDepreciation: 0.035 },
    'cirrus':       { base: 350000,  annualDepreciation: 0.04 },
    'mooney':       { base: 100000,  annualDepreciation: 0.03 },
    'diamond':      { base: 200000,  annualDepreciation: 0.035 },
    // Multi-engine piston
    'baron':        { base: 250000,  annualDepreciation: 0.04 },
    'seneca':       { base: 180000,  annualDepreciation: 0.04 },
    'twin':         { base: 200000,  annualDepreciation: 0.04 },
    // Turboprop
    'king air':     { base: 800000,  annualDepreciation: 0.05 },
    'pilatus':      { base: 2500000, annualDepreciation: 0.05 },
    'tbm':          { base: 1800000, annualDepreciation: 0.05 },
    'socata':       { base: 1500000, annualDepreciation: 0.05 },
    // Light jet
    'citation':     { base: 3000000, annualDepreciation: 0.06 },
    'phenom':       { base: 2500000, annualDepreciation: 0.06 },
    'eclipse':      { base: 1200000, annualDepreciation: 0.06 },
    // Experimental / homebuilt
    'experimental': { base: 60000,  annualDepreciation: 0.02 },
    'homebuilt':    { base: 60000,  annualDepreciation: 0.02 },
    'rv-':          { base: 80000,  annualDepreciation: 0.02 },
    // Default
    'default':      { base: 80000,  annualDepreciation: 0.03 },
  };

  const makeLower = (make || '').toLowerCase();
  const modelLower = (model || '').toLowerCase();
  let category = categories['default'];

  for (const [key, value] of Object.entries(categories)) {
    if (key !== 'default' && (makeLower.includes(key) || modelLower.includes(key))) {
      category = value;
      break;
    }
  }

  const depreciatedValue = category.base * Math.pow(1 - category.annualDepreciation, Math.max(0, age));
  return Math.max(depreciatedValue, 10000);
}

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
    // Defaults: intercept=11.0 → exp(11.0)=$59k base, slope=-0.03 → ~3% annual depreciation
    let slope = -0.03, intercept = 11.0;
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

    // 4) ATI transparency impact — lower ATI = discount on valuation
    let atiDiscount = 1.0;
    if (listingId) {
      const passports = await base44.asServiceRole.entities.ATIPassport.filter(
        { listing: listingId }, '-created_date', 1
      );
      if (passports.length > 0) {
        const ati = passports[0].ati_total || 0;
        // ATI 0-50 = -30%, 50-70 = -15%, 70-90 = -5%, 90+ = 0%
        if (ati < 50) atiDiscount = 0.7;
        else if (ati < 70) atiDiscount = 0.85;
        else if (ati < 90) atiDiscount = 0.95;
      }
    }

    // 5) Expert calibration multiplier
    const expertReviews = await base44.asServiceRole.entities.ExpertValuation.filter(
      { status: 'accepted' }, '-created_date', 100
    );
    const deltas = expertReviews.filter(e => Number.isFinite(e.delta_pct)).map(e => e.delta_pct);
    const avgExpertDelta = deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
    const calibrationMultiplier = 1 + avgExpertDelta / 100;

    // 6) Avionics premium (capped to avoid inflating low-sample valuations)
    const avionicsList = (listing.avionics || '').split(',').map(a => a.trim()).filter(Boolean);
    const avionicsPremium = Math.min(avionicsList.length * 2500, 15000);

    // 8) Base OMVM calculation — 3-tier fallback
    let baseValue, confidence;

    if (valid.length >= 10) {
      // HIGH: log-linear regression on comps
      baseValue = Math.exp(intercept + slope * age);
      confidence = 'HIGH';
    } else if (valid.length >= 3) {
      // MEDIUM: median of available comps
      const prices = valid.map(l => l.asking_price).sort((a, b) => a - b);
      baseValue = prices[Math.floor(prices.length / 2)];
      confidence = 'MEDIUM';
    } else {
      // LOW: category depreciation table (prevents $55K hardcoded nonsense)
      baseValue = getCategoryBaseValue(listing.make, listing.model, age);
      confidence = 'LOW';
    }
    const engineAdj = engineSlope * (engineRemainingFrac - 0.5); // centered at 50% remaining
    const rawOMVM = (baseValue + engineAdj + avionicsPremium) * calibrationMultiplier * atiDiscount;
    const omvmValue = Math.max(10000, Math.round(rawOMVM / 1000) * 1000);

    // 9) Deal scoring
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

    // 11) Persist to listing if we have an ID
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
      ati_transparency_discount: atiDiscount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});