/**
 * OMVM 2.0 Uncertainty Propagation
 * Combines epistemic and aleatoric uncertainty from multiple sources
 */

export interface UncertaintyComponent {
  source: string;
  magnitude_log: number;
  weight: number;
  description: string;
}

export interface TotalUncertainty {
  model_error_log: number;
  parameter_uncertainty_log: number;
  data_dispersion_log: number;
  source_correlation_log: number;
  staleness_log: number;
  missing_features_log: number;
  total_sigma_log: number;
  components: UncertaintyComponent[];
}

/**
 * Estimate model error uncertainty
 * Based on historical residuals of depreciation model
 */
export function estimateModelError(
  model_type: 'full_hedonic' | 'reduced_hedonic' | 'robust_median' | 'fallback',
  aircraft_class?: string
): number {
  // Model error increases with complexity/uncertainty
  const base_error = {
    full_hedonic: 0.08,        // Rich data, lower residual error
    reduced_hedonic: 0.12,     // Some data, moderate error
    robust_median: 0.16,       // Limited data, higher error
    fallback: 0.22,            // Sparse data, high uncertainty
  }[model_type];

  // Class-specific adjustments
  const class_multiplier = {
    jet: 1.3,                  // Thinner market, higher error
    turboprop: 1.1,
    piston_twin: 1.05,
    piston_single: 1.0,
  }[aircraft_class || 'piston_single'] || 1.1;

  return base_error * class_multiplier;
}

/**
 * Estimate parameter uncertainty (from ridge regularization)
 */
export function estimateParameterUncertainty(
  ridge_lambda: number,
  effective_sample_size: number
): number {
  // Higher lambda → lower variance estimates but higher bias
  // Lower n_eff → higher parameter variance
  if (effective_sample_size < 2) return 0.20;
  if (effective_sample_size < 5) return 0.15;
  if (effective_sample_size < 8) return 0.10;

  // Ridge penalty adds uncertainty
  const ridge_factor = Math.sqrt(ridge_lambda);
  return (0.06 + ridge_factor * 0.02);
}

/**
 * Estimate data dispersion
 * How much do market prices vary around the mean?
 */
export function estimateDataDispersion(
  market_sigma_log?: number,
  effective_sample_size: number = 1
): number {
  if (!market_sigma_log || effective_sample_size < 2) {
    return 0.12; // Default aleatoric noise
  }

  // Market dispersion is an aleatoric component
  // We keep it but acknowledge it's not model error
  return Math.min(market_sigma_log, 0.25); // Cap at 25% to avoid outliers
}

/**
 * Estimate source correlation uncertainty
 * When data sources inform each other (not independent)
 */
export function estimateSourceCorrelation(
  sources: Array<{ type: string; count: number }>
): number {
  if (!sources || sources.length === 0) return 0;

  const dedup_factor = sources.reduce((acc, s) => {
    if (s.count > 1) {
      // Duplicate sources → correlation
      return acc + (s.count - 1) * 0.03;
    }
    return acc;
  }, 0);

  // Max correlation-induced uncertainty: 10%
  return Math.min(dedup_factor, 0.10);
}

/**
 * Estimate staleness uncertainty
 * Market data ages → less informative
 */
export function estimateStalenessUncertainty(
  oldest_listing_days_ago: number,
  freshness_weighted_avg: number
): number {
  if (!oldest_listing_days_ago) return 0;

  // Linear decay: +0.5% uncertainty per 30 days
  const age_factor = (oldest_listing_days_ago / 30) * 0.005;

  // Freshness-weighted average addresses temporal coverage
  // (1 - avg_freshness) tells us how stale the data is on average
  const freshness_factor = (1 - freshness_weighted_avg) * 0.08;

  return Math.min(age_factor + freshness_factor, 0.15);
}

/**
 * Estimate missing feature uncertainty
 * How complete is our feature set?
 */
export function estimateMissingFeatureUncertainty(
  available_features: string[],
  important_features: string[] = [
    'hours',
    'tbo_remaining',
    'avionics',
    'damage_history',
  ]
): number {
  const available_set = new Set(available_features);
  const missing_count = important_features.filter(
    (f) => !available_set.has(f)
  ).length;

  // Each missing important feature adds ~2-3% uncertainty
  return Math.min(missing_count * 0.025, 0.15);
}

/**
 * Combine uncertainty components into total standard deviation
 * Uses RSS (root sum of squares) for independent sources
 */
export function combinedUncertainty(
  components: UncertaintyComponent[]
): number {
  // RSS: σ_total = sqrt(sum(w_i * σ_i²))
  const sum_weighted_variance = components.reduce((sum, comp) => {
    return sum + comp.weight * comp.magnitude_log ** 2;
  }, 0);

  return Math.sqrt(sum_weighted_variance);
}

/**
 * Build complete uncertainty model
 */
export function buildUncertaintyModel(
  model_type: 'full_hedonic' | 'reduced_hedonic' | 'robust_median' | 'fallback',
  aircraft_class: string,
  ridge_lambda: number,
  effective_sample_size: number,
  market_sigma_log: number,
  sources: Array<{ type: string; count: number }>,
  oldest_listing_days: number,
  freshness_avg: number,
  available_features: string[]
): TotalUncertainty {
  const model_error = estimateModelError(model_type, aircraft_class);
  const param_uncertainty = estimateParameterUncertainty(ridge_lambda, effective_sample_size);
  const data_dispersion = estimateDataDispersion(market_sigma_log, effective_sample_size);
  const source_correlation = estimateSourceCorrelation(sources);
  const staleness = estimateStalenessUncertainty(oldest_listing_days, freshness_avg);
  const missing_features = estimateMissingFeatureUncertainty(available_features);

  const components: UncertaintyComponent[] = [
    {
      source: 'model_error',
      magnitude_log: model_error,
      weight: 0.3,
      description: 'Depreciation model residual error',
    },
    {
      source: 'parameter_uncertainty',
      magnitude_log: param_uncertainty,
      weight: 0.25,
      description: 'Ridge regression parameter uncertainty',
    },
    {
      source: 'data_dispersion',
      magnitude_log: data_dispersion,
      weight: 0.2,
      description: 'Market price dispersion (aleatoric)',
    },
    {
      source: 'source_correlation',
      magnitude_log: source_correlation,
      weight: 0.1,
      description: 'Correlation between data sources',
    },
    {
      source: 'staleness',
      magnitude_log: staleness,
      weight: 0.1,
      description: 'Age of market data',
    },
    {
      source: 'missing_features',
      magnitude_log: missing_features,
      weight: 0.05,
      description: 'Incomplete feature data',
    },
  ];

  const total_sigma_log = combinedUncertainty(components);

  return {
    model_error_log: model_error,
    parameter_uncertainty_log: param_uncertainty,
    data_dispersion_log: data_dispersion,
    source_correlation_log: source_correlation,
    staleness_log: staleness,
    missing_features_log: missing_features,
    total_sigma_log,
    components,
  };
}
