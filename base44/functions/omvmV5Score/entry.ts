import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function median(values) {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 5000).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  return sorted[Math.floor(sorted.length / 2)];
}

async function getMarketFallbackValue(base44, listing, listingId) {
  const make = (listing.make || '').toLowerCase().trim();
  const model = (listing.model || '').toLowerCase().trim();
  const year = Number(listing.year) || null;

  const broadFilter = {};
  if (listing.make) broadFilter.make = listing.make;

  const marketRows = await base44.asServiceRole.entities.AircraftListing.filter(broadFilter, '-created_date', 500);
  const comparableRows = marketRows.filter((row) => {
    if (row.id === listingId || !row.asking_price || row.asking_price <= 5000) return false;
    const rowMake = (row.make || '').toLowerCase();
    const rowModel = (row.model || '').toLowerCase();
    const makeMatch = make && rowMake.includes(make);
    const modelMatch = model && (rowModel.includes(model) || model.includes(rowModel));
    const yearMatch = !year || !row.year || Math.abs(Number(row.year) - year) <= 10;
    return makeMatch && yearMatch && (modelMatch || !model);
  });

  const modelMedian = median(comparableRows.map((row) => row.asking_price));
  if (modelMedian) {
    return { value: modelMedian, confidence: comparableRows.length >= 5 ? 'MEDIUM' : 'LOW', sample: comparableRows.length, reason: 'market_comparable_median' };
  }

  const makeRows = marketRows.filter((row) => row.id !== listingId && row.asking_price > 5000);
  const makeMedian = median(makeRows.map((row) => row.asking_price));
  if (makeMedian) {
    return { value: makeMedian, confidence: 'LOW', sample: makeRows.length, reason: 'make_average_market_price' };
  }

  // Neither an asking-price anchor nor a floor constant belongs here. Anchoring
  // on the asking price is circular — the model ends up agreeing with whatever
  // number it was handed. A floor constant is worse: it looks like a valuation.
  return { value: null, confidence: null, sample: 0, reason: 'insufficient_comparables' };
}

/**
 * OMVM v5 — Off-Market Valuation Model
 * Log-linear depreciation + engine remaining curve + expert calibration.
 * Body: { listingId } OR { make, model, year, engine_hours, tbo, avionics, asking_price }
 */
// Constant-time comparison via SHA-256 of both sides, so neither the secret's
// contents nor its length leak through response timing.
async function timingSafeEqual(a: string | null, b: string | null): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// The live-market LLM call (web search + generation) is the slowest step by
// far — gemini_3_1_pro with add_context_from_internet routinely runs 25-35s,
// which pushes the whole function past the platform's wall-clock limit when it
// is chained behind abosCoreApi + the Cloudflare gateway. Cap it so the
// function always returns within budget and falls back to comps-only.
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Two ways in. Browsers arrive with a user session. The Cloudflare gateway
    // arrives with a shared secret and no session at all, which is why the
    // listing fetch below has to go through asServiceRole rather than the
    // user-scoped client.
    const isService = await timingSafeEqual(
      req.headers.get('x-gateway-secret'),
      Deno.env.get('GATEWAY_SECRET') ?? null
    );

    if (!isService) {
      // auth.me() throws rather than returning null for a sessionless caller,
      // so the check below was dead code and the SDK's error message ("Authentication
      // required to view users") leaked to the client as a 500 instead of a clean 401.
      const user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    // Accept listingId, listing_id and a nested aircraft object so the gateway
    // and the existing front-end callers can share one contract.
    const listingId = body.listingId || body.listing_id;

    let listing = null;
    if (listingId) {
      listing = await base44.asServiceRole.entities.AircraftListing.get(listingId);
      if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    } else {
      listing = body.aircraft && Object.keys(body.aircraft).length ? body.aircraft : body;
    }

    const currentYear = new Date().getFullYear();
    const hasYear = Number.isFinite(Number(listing.year)) && Number(listing.year) > 1900;
    const age = hasYear ? currentYear - Number(listing.year) : 0;

    // 1) Pull historical comps for make, then filter by model prefix in code
    const filter = {};
    if (listing.make) filter.make = listing.make;
    const comps = await base44.asServiceRole.entities.AircraftListing.filter(filter, '-created_date', 500);

    // Extract model prefix: "172S" → "172", "172RG" → "172", "152" → "152"
    const modelPrefix = (listing.model || '').replace(/[A-Z]+$/, '').trim();

    const valid = comps.filter(l => {
      const compPrefix = (l.model || '').replace(/[A-Z]+$/, '').trim();
      return (
        l.asking_price > 5000 &&
        l.year && l.year > 1950 &&
        l.id !== listingId &&
        compPrefix === modelPrefix
      );
    });

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

    // 3) Engine remaining value adjustment — only when BOTH the TBO and the
    // engine hours are genuinely known. Never fabricate a TBO (the old 2000
    // default is invalid for diesels/turbines) nor assume 0 engine hours; an
    // unknown engine life is simply skipped, not guessed.
    const tbo = (Number.isFinite(Number(listing.tbo)) && Number(listing.tbo) > 0) ? Number(listing.tbo) : null;
    const engineHours = (listing.engine_hours != null && Number.isFinite(Number(listing.engine_hours))) ? Number(listing.engine_hours) : null;
    const engineRemainingFrac = (tbo != null && engineHours != null)
      ? Math.max(0, Math.min(1, (tbo - engineHours) / tbo))
      : null;

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

    // 8) Base OMVM calculation — comps first, market fallback second
    let baseValue, confidence, fallbackReason = null;

    // The log-linear depreciation curve requires a real manufacture year;
    // without one, age is meaningless, so fall through to the comp median
    // rather than valuing a year-less aircraft as brand-new (age 0).
    if (valid.length >= 10 && hasYear) {
      baseValue = Math.exp(intercept + slope * age);
      confidence = 'HIGH';
    } else if (valid.length >= 3) {
      const prices = valid.map(l => l.asking_price).sort((a, b) => a - b);
      baseValue = prices[Math.floor(prices.length / 2)];
      confidence = 'MEDIUM';
    } else {
      const fallback = await getMarketFallbackValue(base44, listing, listingId);
      baseValue = fallback.value;
      confidence = fallback.confidence;
      fallbackReason = fallback.reason;
    }
    // Engine adjustment only applies when engine life is actually known.
    const engineAdj = engineRemainingFrac != null ? engineSlope * (engineRemainingFrac - 0.5) : 0;

    // ── Live market intelligence via LLM web search ──
    // Searches Controller.com, Trade-A-Plane, AircraftTrader etc. for real
    // current asking prices. Replaces the dead Piloterr API proxy.
    let liveMarketAvg = null, liveMinPrice = null, liveMaxPrice = null, liveListingsCount = null;
    let marketDataSource = 'none';
    let marketNotes = null;
    // Caller-selectable model (Valuation Studio). Defaults to the original
    // gemini_3_flash so existing callers are unaffected. Only the two Gemini
    // models support live web search; any other model falls back to a
    // knowledge-based estimate with a tighter timeout.
    const selectedModel = (typeof body.llm_model === 'string' && body.llm_model.trim()) ? body.llm_model.trim() : 'gemini_3_flash';
    const useWebSearch = selectedModel === 'gemini_3_flash' || selectedModel === 'gemini_3_1_pro';
    try {
      const aircraftQuery = [listing.year, listing.make, listing.model].filter(Boolean).join(' ');
      const webPrompt = `You are an aircraft market valuation expert. Search the web for current asking prices of a ${aircraftQuery} aircraft on marketplaces like Controller.com, Trade-A-Plane, AircraftTrader, Barnstormers, and similar.

Return the current market price range for this aircraft. Include only real, currently listed or recently sold aircraft of the same make and model (within ±5 years if year is specified). All prices in USD.

Aircraft: ${listing.year || 'Any year'} ${listing.make} ${listing.model || ''}

Return strict JSON only.`;
      const knowledgePrompt = `You are an aircraft market valuation expert. Estimate the current market value range for this aircraft from your training knowledge of the general aviation market (Controller.com, Trade-A-Plane, Vref, Aircraft Bluebook). Do not pretend to search the web.

Aircraft: ${listing.year || 'Any year'} ${listing.make} ${listing.model || ''}
${listing.engine_hours != null && tbo != null ? `Engine hours SMOH: ${listing.engine_hours} (TBO ${tbo})` : ''}
${listing.total_time != null ? `Airframe total time: ${listing.total_time} hours` : ''}

Return your best estimate of the market price range in USD. Return strict JSON only.`;
      const llmResult = await withTimeout(
        base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: useWebSearch ? webPrompt : knowledgePrompt,
        add_context_from_internet: useWebSearch,
        model: selectedModel,
        response_json_schema: {
          type: 'object',
          properties: {
            avg_price: { type: 'number', description: 'Average asking price in USD' },
            min_price: { type: 'number', description: 'Minimum asking price in USD' },
            max_price: { type: 'number', description: 'Maximum asking price in USD' },
            listings_count: { type: 'number', description: 'Number of comparable listings found' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            notes: { type: 'string' },
          },
        },
      }),
        useWebSearch ? 20000 : 15000,
        null
      );
      const market = llmResult?.data ?? llmResult;
      if (market && market.avg_price != null && market.avg_price > 5000) {
        liveMarketAvg = market.avg_price;
        liveMinPrice = market.min_price;
        liveMaxPrice = market.max_price;
        liveListingsCount = market.listings_count || 0;
        marketNotes = market.notes || null;
        marketDataSource = 'live';
      }
    } catch (marketErr) {
      console.warn('[omvmV5Score] LLM market intelligence failed:', marketErr.message);
    }

    if (baseValue == null) {
      if (liveMarketAvg && liveMarketAvg > 0) {
        baseValue = liveMarketAvg;
        confidence = 'LOW';
        fallbackReason = 'live_market_only';
      } else {
        return Response.json({
          ok: true,
          status: 'insufficient_comparables',
          model_used: selectedModel,
          omvm_value: null,
          deal_score: null,
          deal_label: null,
          discount_pct: null,
          confidence: null,
          fallback_reason: 'insufficient_comparables',
          comp_sample: valid.length,
          required_comps: 3,
          message: 'No comparable listings and no live market data — not enough evidence for a defensible valuation.',
          engine_remaining_pct: engineRemainingFrac != null ? Math.round(engineRemainingFrac * 100) : null,
          market_intelligence: {
            live_market_avg: null,
            live_min_price: null,
            live_max_price: null,
            live_listings_count: null,
            market_data_source: marketDataSource,
            notes: marketNotes,
          },
        });
      }
    }

    const rawOMVM = (baseValue + engineAdj + avionicsPremium) * calibrationMultiplier * atiDiscount;
    let omvmValue = Math.round(rawOMVM / 1000) * 1000;

    // Blend live market in only when it is genuinely a second opinion. If it is
    // already the base, blending it against itself would fake a corroboration.
    if (liveMarketAvg && fallbackReason !== 'live_market_only') {
      omvmValue = Math.round((0.7 * omvmValue + 0.3 * liveMarketAvg) / 1000) * 1000;
    }

    if (!Number.isFinite(omvmValue) || omvmValue <= 0) {
      return Response.json({
        ok: true,
        status: 'valuation_out_of_range',
        omvm_value: null,
        confidence: null,
        comp_sample: valid.length,
        message: 'Adjustments drove the valuation to a non-positive figure; inputs are inconsistent.',
      });
    }

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

      // Persist market intelligence metadata to most recent ATIPassport
      if (marketDataSource !== 'none') {
        try {
          const passports = await base44.asServiceRole.entities.ATIPassport.filter(
            { listing: listingId }, '-created_date', 1
          );
          if (passports.length > 0) {
            await base44.asServiceRole.entities.ATIPassport.update(passports[0].id, {
              live_market_avg: liveMarketAvg,
              live_min_price: liveMinPrice,
              live_max_price: liveMaxPrice,
              live_listings_count: liveListingsCount,
              market_data_source: marketDataSource,
            });
          }
        } catch (passportErr) {
          console.warn('[omvmV5Score] passport market metadata persist failed:', passportErr.message);
        }
      }
    }

    return Response.json({
      ok: true,
      status: 'ok',
      model_used: selectedModel,
      omvm_value: omvmValue,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
      confidence,
      fallback_reason: fallbackReason,
      comp_sample: valid.length,
      engine_remaining_pct: engineRemainingFrac != null ? Math.round(engineRemainingFrac * 100) : null,
      expert_calibration: { avg_delta_pct: avgExpertDelta, multiplier: calibrationMultiplier, sample: deltas.length },
      ati_transparency_discount: atiDiscount,
      market_intelligence: {
        live_market_avg: liveMarketAvg,
        live_min_price: liveMinPrice,
        live_max_price: liveMaxPrice,
        live_listings_count: liveListingsCount,
        market_data_source: marketDataSource,
        notes: marketNotes,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});