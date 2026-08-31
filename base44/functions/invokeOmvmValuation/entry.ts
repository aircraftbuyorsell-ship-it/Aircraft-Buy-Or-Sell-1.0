import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * OMVM 2.0 Aircraft Valuation Skill
 * Bayesian fusion of depreciation prior + market evidence
 * Stores results in OmvmValuation entity
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    // Extract aircraft data
    const aircraft_registration = inputs.registration || inputs.aircraft_registration;
    const make = inputs.make;
    const model = inputs.model;
    const year = inputs.year;
    const engine_hours = inputs.engine_hours;
    const tbo_remaining_pct = inputs.tbo_remaining_pct;
    const avionics_score = inputs.avionics_score || 0.5;
    const market_listings = inputs.market_listings || [];
    const aircraft_listing_id = inputs.aircraft_listing_id;

    if (!aircraft_registration || !make || !model || !year) {
      return Response.json({
        ok: false,
        error: 'Missing required fields: registration, make, model, year'
      }, { status: 400 });
    }

    // Call OMVM valuation skill (import from src/skills)
    const { valuateAircraft } = await import('../../src/skills/omvm-valuation-v2-0/index.ts');

    const valuationRequest = {
      registration: aircraft_registration,
      make,
      model,
      year,
      engine_hours,
      tbo_remaining_pct,
      avionics_score,
      market_listings: market_listings.map((m: any) => ({
        source: m.source,
        price_usd: m.price_usd,
        observed_at: m.observed_at,
      })),
    };

    const valuationResult = await valuateAircraft(valuationRequest);

    // Store in OmvmValuation entity
    const omvmRecord = {
      aircraft_listing_id,
      aircraft_registration,
      make,
      model,
      year,
      engine_hours,
      tbo_remaining_pct,
      avionics_score,
      estimated_value_usd: valuationResult.estimated_value_usd,
      posterior_sigma_usd: valuationResult.posterior_sigma_usd,
      valuation_mode: valuationResult.valuation_mode,
      confidence_within_10_pct: valuationResult.confidence.within_10_pct,
      confidence_within_20_pct: valuationResult.confidence.within_20_pct,
      confidence_within_30_pct: valuationResult.confidence.within_30_pct,
      confidence_mode: valuationResult.confidence.mode,
      market_listings_used: market_listings.length,
      market_n_eff: valuationResult.market_evidence?.effective_sample_size || 0,
      market_value_usd: valuationResult.market_evidence?.market_value_usd || 0,
      market_sigma_log: valuationResult.market_evidence?.market_sigma_log || 0,
      depreciation_k: valuationResult.depreciation_k,
      audit_trace: valuationResult.audit_trace?.model_decisions || [],
      apl_message_id: valuationResult.request_id,
      apl_event_hash: valuationResult.event_hash,
      calibration_version: valuationResult.calibration_version,
      created_by: user.id,
      status: 'complete',
      created_at: new Date().toISOString(),
    };

    // Create OmvmValuation record
    const created = await base44.entities.create('OmvmValuation', omvmRecord);

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.omvm_valuation.v2.0',
      version: 'v2.0',
      result: {
        valuation_id: created.id,
        aircraft: `${year} ${make} ${model} (${aircraft_registration})`,
        estimated_value_usd: valuationResult.estimated_value_usd,
        posterior_sigma_usd: valuationResult.posterior_sigma_usd,
        valuation_mode: valuationResult.valuation_mode,
        confidence: {
          within_10_pct: (valuationResult.confidence.within_10_pct * 100).toFixed(1) + '%',
          within_20_pct: (valuationResult.confidence.within_20_pct * 100).toFixed(1) + '%',
          within_30_pct: (valuationResult.confidence.within_30_pct * 100).toFixed(1) + '%',
          level: valuationResult.confidence.mode,
        },
        market_evidence: {
          listings_used: market_listings.length,
          n_eff: valuationResult.market_evidence?.effective_sample_size || 0,
          market_value_usd: valuationResult.market_evidence?.market_value_usd || 0,
        },
      },
      confidence: valuationResult.confidence.within_20_pct,
      evidence: [
        `Aircraft: ${year} ${make} ${model}`,
        `Value: $${valuationResult.estimated_value_usd.toLocaleString()} ±${valuationResult.posterior_sigma_usd.toLocaleString()}`,
        `Mode: ${valuationResult.valuation_mode}`,
        `Confidence: ${(valuationResult.confidence.within_20_pct * 100).toFixed(0)}% within ±20%`,
      ],
      model_used: 'omvm:bayesian_fusion',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OMVM Valuation Error:', error);
    return Response.json({
      ok: false,
      error: error.message || 'Valuation failed',
      details: error.stack,
    }, { status: 500 });
  }
});
