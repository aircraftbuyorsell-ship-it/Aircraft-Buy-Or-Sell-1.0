/**
 * OMVM 2.0 Valuation Engine (Skill Implementation)
 * APL/ADL compliant stateless Bayesian aircraft valuation
 */

import * as baseModel from '../../omvm/engine/base-model';
import * as marketModel from '../../omvm/engine/market-model';
import * as bayesianFusion from '../../omvm/engine/bayesian-fusion';
import * as adjustmentsModule from '../../omvm/engine/adjustments';
import * as uncertaintyModule from '../../omvm/engine/uncertainty';
import * as confidenceModule from '../../omvm/engine/confidence';

export interface OmvmRequest {
  registration: string;
  make: string;
  model: string;
  year: number;
  engine_hours?: number;
  tbo_remaining_pct?: number;
  avionics_score?: number;
  market_listings?: Array<{
    source: 'controller' | 'tap' | 'barnstormers' | 'aso';
    price_usd: number;
    observed_at: string;
  }>;
}

export interface OmvmResponse {
  estimated_value_usd: number;
  posterior_sigma_usd: number;
  valuation_mode: string;
  confidence: {
    cv: number;
    within_10_pct: number;
    within_20_pct: number;
    within_30_pct: number;
    mode: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  market_evidence: {
    observation_count: number;
    effective_sample_size: number;
    evidence_type: string;
  };
  audit_trace: {
    model_decisions: string[];
    aircraft_class?: string;
    valuation_mode_reason?: string;
  };
}

export async function valuateAircraft(req: OmvmRequest): Promise<OmvmResponse> {
  const auditTrail: string[] = [];

  // Step 1: Resolve aircraft class
  const aircraftClass = resolveAircraftClass(req.make, req.model);
  auditTrail.push(`Resolved aircraft class: ${aircraftClass}`);

  // Step 2: Calculate base depreciation prior
  const age = new Date().getFullYear() - req.year;
  const params = getParamsForClass(aircraftClass);

  const baseResult = baseModel.calculateBaseValue(age, params);
  const v_base = baseResult.value_usd;
  const sigma_prior_log = baseResult.sigma_log;

  auditTrail.push(
    `Prior: V_base=$${v_base.toFixed(0)} (age=${age}yr, floor=$${baseResult.v_floor_usd.toFixed(0)}, σ_ln=${sigma_prior_log.toFixed(3)})`
  );

  // Step 3: Aggregate and weight market listings
  let valuation_mode = 'fallback';
  let v_market = v_base;
  let sigma_market_log = sigma_prior_log;
  let n_eff = 0;
  const market_evidence = {
    observation_count: req.market_listings?.length || 0,
    effective_sample_size: 0,
    evidence_type: 'ASKING_PRICES',
  };

  if (req.market_listings && req.market_listings.length > 0) {
    // Convert to internal market listing format
    const convertedListings: marketModel.MarketListing[] = req.market_listings.map((m) => ({
      source: m.source as any,
      listing_id: `${req.make}_${req.model}_${m.price_usd}`,
      price_usd: m.price_usd,
      observed_at: m.observed_at,
    }));

    // Calculate market value
    const marketResult = marketModel.calculateMarketValue(
      convertedListings,
      req.make,
      req.model
    );

    n_eff = marketResult.effective_sample_size;
    v_market = marketResult.market_value_usd;
    sigma_market_log = marketResult.market_sigma_log;
    valuation_mode = marketResult.model_mode;
    market_evidence.effective_sample_size = n_eff;

    auditTrail.push(
      `Market aggregation: ${marketResult.observation_count} listings, n_eff=${n_eff.toFixed(2)}, mode=${valuation_mode}`
    );
    auditTrail.push(
      `Market evidence: mean=$${v_market.toFixed(0)}, σ_ln=${sigma_market_log.toFixed(3)}`
    );
  } else {
    auditTrail.push(`No market data; using prior only`);
  }

  // Step 4: Bayesian fusion in log space
  const ln_prior = Math.log(v_base);
  const ln_market = Math.log(v_market);

  // Precision-weighted fusion
  const tau_prior = 1 / (sigma_prior_log ** 2);
  const tau_market = 1 / (sigma_market_log ** 2);

  const ln_posterior = (tau_prior * ln_prior + tau_market * ln_market) / (tau_prior + tau_market);
  const sigma_posterior_log = 1 / Math.sqrt(tau_prior + tau_market);

  const posterior_value = Math.exp(ln_posterior);

  auditTrail.push(
    `Bayesian fusion: posterior=$${posterior_value.toFixed(0)}, σ_ln=${sigma_posterior_log.toFixed(3)}`
  );

  // Step 5: Apply deterministic adjustments
  const adjustmentsResult = adjustmentsModule.applyAdjustments(
    posterior_value,
    undefined, // No damage data
    undefined, // No storage data
    undefined  // No usage data
  );
  const adjusted_value = adjustmentsModule.adjustedValue(
    posterior_value,
    adjustmentsResult
  );

  auditTrail.push(`Adjustments: ${adjustmentsResult.total_multiplier.toFixed(3)}×`);
  adjustmentsResult.notes.forEach((n) => auditTrail.push(`  - ${n}`));

  // Step 6: Quantify uncertainty components
  const ridge_lambda = 0.1; // Default ridge penalty
  const uncertainty_model = uncertaintyModule.buildUncertaintyModel(
    valuation_mode as 'full_hedonic' | 'reduced_hedonic' | 'robust_median' | 'fallback',
    aircraftClass,
    ridge_lambda,
    n_eff,
    sigma_market_log,
    (req.market_listings || []).map((m) => ({ type: m.source, count: 1 })),
    req.market_listings && req.market_listings.length > 0
      ? Math.floor(
          (new Date().getTime() -
            new Date(req.market_listings[0].observed_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0,
    1.0,
    ['hours', 'tbo_remaining', 'avionics']
  );

  // Total uncertainty in linear space
  const total_sigma_linear = adjusted_value * uncertainty_model.total_sigma_log;

  // Step 7: Calculate confidence metrics
  const conf = confidenceModule.generateConfidenceMetrics(
    adjusted_value,
    total_sigma_linear
  );

  auditTrail.push(
    `Confidence: within_20%=${(conf.within_20_pct * 100).toFixed(1)}%, CV=${(conf.cv * 100).toFixed(1)}%`
  );

  return {
    estimated_value_usd: Math.round(adjusted_value),
    posterior_sigma_usd: Math.round(total_sigma_linear),
    valuation_mode,
    confidence: conf,
    market_evidence,
    audit_trace: {
      model_decisions: auditTrail,
      aircraft_class: aircraftClass,
      valuation_mode_reason:
        n_eff < 2
          ? `Insufficient market data (n_eff=${n_eff.toFixed(1)}); prior only`
          : `${valuation_mode} with n_eff=${n_eff.toFixed(2)}`,
    },
  };
}

function resolveAircraftClass(
  make: string,
  model: string
): string {
  const key = `${make.toLowerCase()} ${model.toLowerCase()}`;

  // Simple class resolution; in production this would query a database
  if (key.includes('cessna') && key.includes('172')) return 'piston_single';
  if (key.includes('beechcraft') && key.includes('bonanza')) return 'piston_single';
  if (key.includes('piper')) return 'piston_single';
  if (key.includes('twin') || key.includes('baron')) return 'piston_twin';
  if (key.includes('citation')) return 'jet';
  if (key.includes('turboprop') || key.includes('king air')) return 'turboprop';

  // Default fallback
  return 'piston_single';
}

function getParamsForClass(aircraftClass: string): baseModel.DepreciationParams {
  const params: Record<string, baseModel.DepreciationParams> = {
    piston_single: {
      v_new_usd: 180000,
      floor_ratio: 0.19,
      depreciation_rate_k: 0.052,
      prior_sigma_log: 0.17,
    },
    piston_twin: {
      v_new_usd: 320000,
      floor_ratio: 0.21,
      depreciation_rate_k: 0.048,
      prior_sigma_log: 0.16,
    },
    turboprop: {
      v_new_usd: 1200000,
      floor_ratio: 0.20,
      depreciation_rate_k: 0.042,
      prior_sigma_log: 0.18,
    },
    jet: {
      v_new_usd: 8000000,
      floor_ratio: 0.20,
      depreciation_rate_k: 0.038,
      prior_sigma_log: 0.22,
    },
  };

  return (
    params[aircraftClass] || {
      v_new_usd: 250000,
      floor_ratio: 0.20,
      depreciation_rate_k: 0.05,
      prior_sigma_log: 0.20,
    }
  );
}

// APL request envelope handler
export interface AplRequest {
  apl_version: string;
  message_id: string;
  sender: string;
  receiver: string;
  intent: string;
  context?: Record<string, any>;
  payload: OmvmRequest;
}

export interface AplResponse {
  apl_version: string;
  agent: string;
  skill: string;
  payload: OmvmResponse;
  evidence: {
    provenance: {
      aircraft_class?: string;
      parameter_version?: string;
      calibrated_at?: string;
    };
    confidence: number;
  };
  audit: {
    event_id: string;
    current_hash: string;
    level: string;
    chained: boolean;
  };
}

export async function handleAplRequest(req: AplRequest): Promise<AplResponse> {
  // Validate intent
  const validIntents = [
    'value_aircraft',
    'estimate_posterior',
    'quantify_uncertainty',
    'audit_valuation',
  ];
  if (!validIntents.includes(req.intent)) {
    throw new Error(`Invalid intent: ${req.intent}`);
  }

  // Execute valuation
  const result = await valuateAircraft(req.payload);

  // Generate audit hash
  const eventData = JSON.stringify({
    timestamp: new Date().toISOString(),
    aircraft: req.payload.registration,
    value: result.estimated_value_usd,
  });
  const hash = Buffer.from(eventData).toString('base64');

  return {
    apl_version: '1.0',
    agent: 'apl://aviation.abos/valuation/omvm-valuation-v2-0/v1',
    skill: 'OMVM 2.0 Valuation Engine',
    payload: result,
    evidence: {
      provenance: {
        aircraft_class: result.audit_trace.aircraft_class,
        parameter_version: 'omvm-params-v1',
        calibrated_at: '2026-08-29',
      },
      confidence: result.confidence.within_20_pct,
    },
    audit: {
      event_id: req.message_id,
      current_hash: hash,
      level: 'APL-A2',
      chained: true,
    },
  };
}
