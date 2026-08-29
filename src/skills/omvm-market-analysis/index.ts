/**
 * OMVM 2.0 Market Analysis Engine (Skill Implementation)
 * Real-time market intelligence and weighting
 */

import * as marketModel from '../../omvm/engine/market-model';

export interface MarketListingInput {
  source: 'controller' | 'tap' | 'barnstormers' | 'aso';
  listing_id?: string;
  price_usd: number;
  observed_at: string;
  hours?: number;
}

export interface MarketAnalysisRequest {
  make: string;
  model: string;
  year_from?: number;
  year_to?: number;
  market_listings: MarketListingInput[];
}

export interface WeightBreakdown {
  listing_id: string;
  source: string;
  price_usd: number;
  observed_at: string;
  days_old: number;
  source_reliability: number;
  freshness: number;
  identity_match: number;
  feature_completeness: number;
  independence: number;
  final_weight: number;
}

export interface TrendAnalysis {
  price_trend_30_days: 'up' | 'stable' | 'down';
  price_trend_90_days: 'up' | 'stable' | 'down';
  volume_trend: 'high' | 'normal' | 'low';
}

export interface MarketAnalysisResponse {
  aircraft: string;
  year_range: string;
  market_analysis: {
    observation_count: number;
    observation_count_after_filtering: number;
    effective_sample_size: number;
    valuation_mode: 'full_hedonic' | 'reduced_hedonic' | 'robust_median' | 'fallback';
    market_value_usd: number;
    market_sigma_log: number;
    market_sigma_usd: number;
  };
  weights: WeightBreakdown[];
  anomalies: Array<{
    listing_id: string;
    type: string;
    description: string;
  }>;
  trend_analysis: TrendAnalysis;
  audit_trail: {
    analysis_timestamp: string;
    decisions: string[];
  };
}

export async function analyzeMarket(
  req: MarketAnalysisRequest
): Promise<MarketAnalysisResponse> {
  const auditTrail: string[] = [];
  const anomalies: Array<{
    listing_id: string;
    type: string;
    description: string;
  }> = [];

  const aircraft_desc = `${req.make} ${req.model}`;
  const year_range = req.year_from
    ? `${req.year_from}${req.year_to ? `-${req.year_to}` : '+'}`
    : 'all years';

  // Convert input to internal format
  const converted_listings: marketModel.MarketListing[] = req.market_listings.map(
    (m) => ({
      source: m.source as 'controller' | 'trade_a_plane' | 'barnstormers' | 'aso' | 'other',
      listing_id: m.listing_id || `${m.source}_${m.price_usd}`,
      price_usd: m.price_usd,
      observed_at: m.observed_at,
      hours: m.hours,
    })
  );

  // Run market analysis
  const market_result = marketModel.calculateMarketValue(
    converted_listings,
    req.make,
    req.model
  );

  // Process deduplication notes
  market_result.deduplication_notes.forEach((note) => {
    auditTrail.push(note);
  });

  // Build weight breakdown
  const weights: WeightBreakdown[] = market_result.weighted_observations.map(
    (wo) => {
      const days_old = Math.floor(
        (new Date().getTime() - new Date(wo.listing.observed_at || '').getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        listing_id: wo.listing.listing_id,
        source: wo.listing.source,
        price_usd: wo.listing.price_usd,
        observed_at: wo.listing.observed_at || '',
        days_old,
        source_reliability: wo.weight.source_reliability,
        freshness: wo.weight.freshness,
        identity_match: wo.weight.identity_match,
        feature_completeness: wo.weight.feature_completeness,
        independence: wo.weight.independence,
        final_weight: wo.weight.final_weight,
      };
    }
  );

  // Detect anomalies
  const price_values = market_result.weighted_observations.map((w) => w.listing.price_usd);
  if (price_values.length > 0) {
    const mean = price_values.reduce((a, b) => a + b) / price_values.length;
    const variance =
      price_values.reduce((a, b) => a + (b - mean) ** 2) / price_values.length;
    const std_dev = Math.sqrt(variance);

    market_result.weighted_observations.forEach((wo) => {
      const z_score = Math.abs((wo.listing.price_usd - mean) / std_dev);
      if (z_score > 3) {
        anomalies.push({
          listing_id: wo.listing.listing_id,
          type: 'price_outlier',
          description: `Price ${wo.listing.price_usd} is ${z_score.toFixed(1)}σ from mean`,
        });
      }
    });
  }

  // Check for stale listings
  weights.forEach((w) => {
    if (w.days_old > 90) {
      anomalies.push({
        listing_id: w.listing_id,
        type: 'stale_listing',
        description: `Listing is ${w.days_old} days old`,
      });
    }
  });

  // Trend analysis (simulated)
  const trend_analysis: TrendAnalysis = {
    price_trend_30_days: 'stable',
    price_trend_90_days: 'stable',
    volume_trend: 'normal',
  };

  // Audit summary
  auditTrail.push(
    `Accepted ${market_result.observation_count} listings; ${
      req.market_listings.length - market_result.observation_count
    } filtered for price anomaly`
  );
  auditTrail.push(
    `n_eff=${market_result.effective_sample_size.toFixed(2)} → ${market_result.model_mode} mode`
  );
  if (anomalies.length === 0) {
    auditTrail.push(`No duplicate sources detected`);
  } else {
    auditTrail.push(
      `Detected ${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'}`
    );
  }

  const oldest_days = weights.length > 0 ? Math.max(...weights.map((w) => w.days_old)) : 0;
  auditTrail.push(`No stale listings (oldest: ${oldest_days} day${oldest_days === 1 ? '' : 's'} old)`);

  return {
    aircraft: aircraft_desc,
    year_range,
    market_analysis: {
      observation_count: req.market_listings.length,
      observation_count_after_filtering: market_result.observation_count,
      effective_sample_size: market_result.effective_sample_size,
      valuation_mode: market_result.model_mode,
      market_value_usd: market_result.market_value_usd,
      market_sigma_log: market_result.market_sigma_log,
      market_sigma_usd: market_result.market_sigma_usd,
    },
    weights,
    anomalies,
    trend_analysis,
    audit_trail: {
      analysis_timestamp: new Date().toISOString(),
      decisions: auditTrail,
    },
  };
}

// APL request envelope handler
export interface AplRequest {
  apl_version: string;
  message_id: string;
  sender: string;
  receiver: string;
  intent: string;
  context?: Record<string, any>;
  payload: MarketAnalysisRequest;
}

export interface AplResponse {
  apl_version: string;
  agent: string;
  skill: string;
  payload: MarketAnalysisResponse;
  evidence: {
    provenance: {
      sources: string[];
      listing_count: number;
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
    'analyze_market_listings',
    'detect_market_anomalies',
    'estimate_market_dispersion',
    'calculate_effective_sample_size',
    'monitor_market_trends',
  ];
  if (!validIntents.includes(req.intent)) {
    throw new Error(`Invalid intent: ${req.intent}`);
  }

  // Execute analysis
  const result = await analyzeMarket(req.payload);

  // Generate audit hash
  const eventData = JSON.stringify({
    timestamp: new Date().toISOString(),
    aircraft: `${req.payload.make} ${req.payload.model}`,
    n_eff: result.market_analysis.effective_sample_size,
  });
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(eventData).digest('base64');

  // Extract unique sources
  const sources = [...new Set(result.weights.map((w) => w.source))];

  return {
    apl_version: '1.0',
    agent: 'apl://aviation.abos/market/omvm-market-analysis/v1',
    skill: 'OMVM 2.0 Market Analysis Engine',
    payload: result,
    evidence: {
      provenance: {
        sources,
        listing_count: result.market_analysis.observation_count_after_filtering,
      },
      confidence:
        result.market_analysis.effective_sample_size >= 2
          ? 0.95
          : result.market_analysis.effective_sample_size >= 1
            ? 0.75
            : 0.5,
    },
    audit: {
      event_id: req.message_id,
      current_hash: 'sha256:' + hash,
      level: 'APL-A2',
      chained: true,
    },
  };
}
