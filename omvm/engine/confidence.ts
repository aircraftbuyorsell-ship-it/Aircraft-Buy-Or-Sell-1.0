/**
 * OMVM 2.0 Confidence Module
 * Converts posterior distribution to user-facing confidence metrics
 */

export interface ConfidenceMetrics {
  cv: number;                // Coefficient of variation: σ/μ
  within_10_pct: number;     // P(value within ±10%)
  within_20_pct: number;     // P(value within ±20%)
  within_30_pct: number;     // P(value within ±30%)
  mode: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Cumulative normal distribution function (approximation)
 * Using Hart approximation for speed and reasonable accuracy
 */
function normalCDF(z: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  const t = 1.0 / (1.0 + p * Math.abs(z));
  if (z >= 0) {
    return 1 -
      c *
      Math.exp(-0.5 * z * z) *
      t *
      (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  } else {
    return c *
      Math.exp(-0.5 * z * z) *
      t *
      (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  }
}

/**
 * Calculate P(X within ±percentage% of μ) for lognormal distribution
 *
 * For lognormal with ln(X) ~ N(μ_ln, σ_ln²):
 * We want P(μ * (1 - ε) < X < μ * (1 + ε))
 *
 * Take logs: ln(μ(1-ε)) < ln(X) < ln(μ(1+ε))
 * But ln(μ) ≠ μ_ln in log space; need to use CDF
 */
export function calculateConfidencePercentile(
  mean_usd: number,
  sigma_usd: number,
  percentage: number
): number {
  if (sigma_usd <= 0 || mean_usd <= 0 || percentage <= 0) {
    return 0;
  }

  // Lower and upper bounds
  const lower = mean_usd * (1 - percentage / 100);
  const upper = mean_usd * (1 + percentage / 100);

  // For lognormal, work with ln(X)
  const ln_mean = Math.log(mean_usd);
  const ln_sigma = sigma_usd / mean_usd; // σ_ln ≈ σ_linear / μ

  const ln_lower = Math.log(lower);
  const ln_upper = Math.log(upper);

  // Z-scores
  const z_lower = (ln_lower - ln_mean) / ln_sigma;
  const z_upper = (ln_upper - ln_mean) / ln_sigma;

  // CDF difference
  const prob = normalCDF(z_upper) - normalCDF(z_lower);
  return Math.min(1, Math.max(0, prob));
}

/**
 * Calculate coefficient of variation
 */
export function calculateCV(mean: number, sigma: number): number {
  if (mean <= 0) return NaN;
  return sigma / mean;
}

/**
 * Classify confidence level
 */
export function classifyConfidence(
  within_20_pct: number
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (within_20_pct >= 0.75) return 'HIGH';
  if (within_20_pct >= 0.55) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate comprehensive confidence metrics
 */
export function generateConfidenceMetrics(
  estimated_value_usd: number,
  posterior_sigma_usd: number
): ConfidenceMetrics {
  const cv = calculateCV(estimated_value_usd, posterior_sigma_usd);

  const within_10 = calculateConfidencePercentile(
    estimated_value_usd,
    posterior_sigma_usd,
    10
  );
  const within_20 = calculateConfidencePercentile(
    estimated_value_usd,
    posterior_sigma_usd,
    20
  );
  const within_30 = calculateConfidencePercentile(
    estimated_value_usd,
    posterior_sigma_usd,
    30
  );

  const mode = classifyConfidence(within_20);

  return {
    cv: parseFloat(cv.toFixed(4)),
    within_10_pct: parseFloat(within_10.toFixed(4)),
    within_20_pct: parseFloat(within_20.toFixed(4)),
    within_30_pct: parseFloat(within_30.toFixed(4)),
    mode,
  };
}

/**
 * Interpret confidence metrics as English prose
 */
export function describeConfidence(metrics: ConfidenceMetrics): string {
  const pct_20 = Math.round(metrics.within_20_pct * 100);
  return `${pct_20}% confidence that market value lies within ±20% of estimate`;
}

/**
 * Risk profile for display
 */
export function riskProfile(cv: number): string {
  if (cv < 0.08) return 'Very low uncertainty';
  if (cv < 0.12) return 'Low uncertainty';
  if (cv < 0.18) return 'Moderate uncertainty';
  if (cv < 0.25) return 'High uncertainty';
  return 'Very high uncertainty';
}
