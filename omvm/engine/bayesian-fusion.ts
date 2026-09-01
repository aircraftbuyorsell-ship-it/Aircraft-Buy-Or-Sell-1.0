/**
 * OMVM 2.0 Bayesian Fusion Engine
 * Combines prior and market distributions using weighted precision fusion
 * Works in log space to handle multiplicative nature of aircraft prices
 */

export interface FusionInput {
  // Prior (base model)
  prior_mu_log: number;
  prior_sigma_log: number;

  // Market (live listings)
  market_mu_log: number;
  market_sigma_log: number;

  // Optional: prior correlation with market (default 0 = independent)
  correlation?: number;
}

export interface FusionResult {
  posterior_mu_log: number;
  posterior_sigma_log: number;

  // Posterior in linear space
  posterior_mean_usd: number;
  posterior_sigma_usd: number;

  // Weight attribution
  prior_weight: number;
  market_weight: number;

  // Diagnostic
  prior_precision: number;
  market_precision: number;
  posterior_precision: number;
}

/**
 * Fuse two log-normal distributions via weighted precision
 *
 * Given:
 *   Prior: ln(V) ~ N(μ_b, σ_b²)
 *   Market: ln(V) ~ N(μ_m, σ_m²)
 *
 * Posterior (assuming independence):
 *   ln(V) ~ N(μ_post, σ_post²)
 *
 * Where:
 *   τ_post = τ_b + τ_m  (precision sum)
 *   μ_post = (τ_b μ_b + τ_m μ_m) / τ_post
 *
 * And τ = 1/σ² is precision
 */
export function fuseBayesian(input: FusionInput): FusionResult {
  const {
    prior_mu_log,
    prior_sigma_log,
    market_mu_log,
    market_sigma_log,
    correlation = 0,
  } = input;

  // Precision (inverse variance)
  const prior_precision = 1 / (prior_sigma_log ** 2);
  const market_precision = 1 / (market_sigma_log ** 2);

  // Handle correlation (if any)
  let covariance = 0;
  if (correlation !== 0) {
    covariance = correlation * prior_sigma_log * market_sigma_log;
  }

  // Posterior precision in uncorrelated case
  const posterior_precision = prior_precision + market_precision;

  if (posterior_precision <= 0) {
    throw new Error('Posterior precision is non-positive; check input variances');
  }

  // Posterior mean (weighted combination)
  const posterior_mu_log =
    (prior_precision * prior_mu_log + market_precision * market_mu_log) /
    posterior_precision;

  // Posterior standard deviation
  const posterior_sigma_log = Math.sqrt(1 / posterior_precision);

  // Weight attribution (how much does each source contribute to posterior)
  const prior_weight = prior_precision / posterior_precision;
  const market_weight = market_precision / posterior_precision;

  // Convert to linear space
  // E[V] = exp(μ_log + σ_log²/2)
  const posterior_mean_usd = Math.exp(
    posterior_mu_log + (posterior_sigma_log ** 2) / 2
  );

  // σ_linear ≈ E[V] * σ_log for moderate σ
  const posterior_sigma_usd = posterior_mean_usd * posterior_sigma_log;

  return {
    posterior_mu_log,
    posterior_sigma_log,
    posterior_mean_usd,
    posterior_sigma_usd,
    prior_weight,
    market_weight,
    prior_precision,
    market_precision,
    posterior_precision,
  };
}

/**
 * Attempt to estimate correlation between prior and market estimates
 * Returns 0 if they use disjoint information, positive if aligned
 */
export function estimateCorrelation(
  prior_uses_faa: boolean = true,
  prior_uses_market: boolean = false,
  market_uses_model_features: boolean = false
): number {
  // If prior and market use completely different signals, correlation ≈ 0
  // If both use asking prices (circular), correlation → 1
  // If prior uses specs and market uses prices, correlation ≈ 0

  if (prior_uses_market && market_uses_model_features) {
    // Both are informed by same asking-price market
    return 0.3; // Weak positive correlation (not same price)
  }

  // Default: uncorrelated sources
  return 0;
}

/**
 * Reverse fusion: given posterior and one input, recover the other
 * Useful for validation and sensitivity analysis
 */
export function reverseFusion(
  posterior_mu_log: number,
  posterior_sigma_log: number,
  known_input: 'prior' | 'market',
  known_mu_log: number,
  known_sigma_log: number
): { recovered_mu_log: number; recovered_sigma_log: number } {
  const posterior_precision = 1 / (posterior_sigma_log ** 2);
  const known_precision = 1 / (known_sigma_log ** 2);

  if (known_input === 'prior') {
    // Recover market from posterior and prior
    const market_precision = posterior_precision - known_precision;
    if (market_precision <= 0) {
      throw new Error('Cannot recover market estimate: posterior less precise than prior');
    }
    const market_sigma_log = Math.sqrt(1 / market_precision);
    const market_mu_log =
      (posterior_precision * posterior_mu_log - known_precision * known_mu_log) /
      market_precision;
    return { recovered_mu_log: market_mu_log, recovered_sigma_log: market_sigma_log };
  } else {
    // Recover prior from posterior and market
    const prior_precision = posterior_precision - known_precision;
    if (prior_precision <= 0) {
      throw new Error('Cannot recover prior estimate: posterior less precise than market');
    }
    const prior_sigma_log = Math.sqrt(1 / prior_precision);
    const prior_mu_log =
      (posterior_precision * posterior_mu_log - known_precision * known_mu_log) /
      prior_precision;
    return { recovered_mu_log: prior_mu_log, recovered_sigma_log: prior_sigma_log };
  }
}
