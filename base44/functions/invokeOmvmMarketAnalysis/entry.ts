import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * OMVM 2.0 Market Analysis Skill
 * Real-time market intelligence with weighting and anomaly detection
 * Stores results in OmvmMarketAnalysis entity
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const make = inputs.make;
    const model = inputs.model;
    const year_from = inputs.year_from;
    const year_to = inputs.year_to;
    const market_listings = inputs.market_listings || [];

    if (!make || !model) {
      return Response.json({
        ok: false,
        error: 'Missing required fields: make, model'
      }, { status: 400 });
    }

    // Call OMVM market analysis skill
    const { analyzeMarket } = await import('../../src/skills/omvm-market-analysis/index.ts');

    const marketRequest = {
      make,
      model,
      year_from,
      year_to,
      market_listings: market_listings.map((m: any) => ({
        source: m.source || 'other',
        listing_id: m.listing_id,
        price_usd: m.price_usd,
        observed_at: m.observed_at,
        hours: m.hours,
      })),
    };

    const marketResult = await analyzeMarket(marketRequest);

    // Store in OmvmMarketAnalysis entity
    const omvmRecord = {
      aircraft_make: make,
      aircraft_model: model,
      year_from,
      year_to,
      observation_count: marketResult.market_analysis.observation_count,
      observation_count_after_filtering: marketResult.market_analysis.observation_count_after_filtering,
      effective_sample_size: marketResult.market_analysis.effective_sample_size,
      valuation_mode: marketResult.market_analysis.valuation_mode,
      market_value_usd: marketResult.market_analysis.market_value_usd,
      market_sigma_log: marketResult.market_analysis.market_sigma_log,
      market_sigma_usd: marketResult.market_analysis.market_sigma_usd,
      sources: [...new Set(marketResult.weights.map((w: any) => w.source))],
      price_trend_30_days: marketResult.trend_analysis.price_trend_30_days,
      price_trend_90_days: marketResult.trend_analysis.price_trend_90_days,
      volume_trend: marketResult.trend_analysis.volume_trend,
      anomalies_detected: marketResult.anomalies.length,
      anomaly_details: marketResult.anomalies,
      stale_listings_count: marketResult.weights.filter((w: any) => w.days_old > 90).length,
      oldest_listing_days: marketResult.weights.length > 0
        ? Math.max(...marketResult.weights.map((w: any) => w.days_old))
        : 0,
      source_reliability_weights: {
        controller: 1.0,
        tap: 0.95,
        barnstormers: 0.8,
        aso: 0.9,
      },
      audit_decisions: marketResult.audit_trail.decisions,
      created_by: user.id,
      status: 'complete',
      created_at: new Date().toISOString(),
    };

    // Create OmvmMarketAnalysis record
    const created = await base44.entities.create('OmvmMarketAnalysis', omvmRecord);

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.omvm_market_analysis.v2.0',
      version: 'v2.0',
      result: {
        analysis_id: created.id,
        aircraft: `${make} ${model}`,
        year_range: year_from && year_to ? `${year_from}-${year_to}` : 'all years',
        market_analysis: {
          observation_count: marketResult.market_analysis.observation_count,
          observations_after_filtering: marketResult.market_analysis.observation_count_after_filtering,
          effective_sample_size: marketResult.market_analysis.effective_sample_size.toFixed(2),
          valuation_mode: marketResult.market_analysis.valuation_mode,
          market_value_usd: marketResult.market_analysis.market_value_usd.toLocaleString(),
          market_sigma_log: marketResult.market_analysis.market_sigma_log.toFixed(3),
          market_sigma_usd: marketResult.market_analysis.market_sigma_usd.toLocaleString(),
        },
        trend_analysis: {
          price_30_days: marketResult.trend_analysis.price_trend_30_days,
          price_90_days: marketResult.trend_analysis.price_trend_90_days,
          volume: marketResult.trend_analysis.volume_trend,
        },
        anomalies: {
          count: marketResult.anomalies.length,
          details: marketResult.anomalies.slice(0, 5), // First 5
        },
        sources_used: [...new Set(marketResult.weights.map((w: any) => w.source))],
        weight_summary: {
          total_listings: marketResult.weights.length,
          average_weight: (marketResult.weights.reduce((sum: number, w: any) => sum + w.final_weight, 0) / marketResult.weights.length).toFixed(3),
          oldest_days: marketResult.weights.length > 0
            ? Math.max(...marketResult.weights.map((w: any) => w.days_old))
            : 0,
        },
      },
      confidence: marketResult.market_analysis.effective_sample_size >= 2 ? 0.95 : 0.5,
      evidence: [
        `Aircraft: ${make} ${model}${year_from ? ` (${year_from}-${year_to})` : ''}`,
        `Listings: ${marketResult.market_analysis.observation_count} → ${marketResult.market_analysis.observation_count_after_filtering} after filtering`,
        `n_eff: ${marketResult.market_analysis.effective_sample_size.toFixed(2)} (${marketResult.market_analysis.valuation_mode})`,
        `Market Value: $${marketResult.market_analysis.market_value_usd.toLocaleString()}`,
        `Anomalies: ${marketResult.anomalies.length} detected`,
      ],
      model_used: 'omvm:market_weighting',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OMVM Market Analysis Error:', error);
    return Response.json({
      ok: false,
      error: error.message || 'Market analysis failed',
      details: error.stack,
    }, { status: 500 });
  }
});
