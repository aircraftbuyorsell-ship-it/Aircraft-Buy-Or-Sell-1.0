/**
 * OMVM 2.0 Base Model
 * Calculates prior aircraft value using log-linear depreciation
 * V_base(t) = V_floor + (V_new - V_floor) * exp(-k*t)
 */

export interface DepreciationParams {
  v_new_usd: number;
  floor_ratio: number;
  depreciation_rate_k: number;
  prior_sigma_log: number;
}

export interface BaseValuationResult {
  value_usd: number;
  sigma_usd: number;
  sigma_log: number;
  formula: string;
  age_years: number;
  v_floor_usd: number;
}

/**
 * Calculate aircraft base value from depreciation parameters
 * Returns point estimate and uncertainty in both linear and log space
 */
export function calculateBaseValue(
  age_years: number,
  params: DepreciationParams
): BaseValuationResult {
  const v_floor = params.v_new_usd * params.floor_ratio;
  const depth = params.v_new_usd - v_floor;

  // V_base(t) = V_floor + depth * exp(-k*t)
  const value_usd = v_floor + depth * Math.exp(-params.depreciation_rate_k * age_years);

  // For uncertainty propagation in log space:
  // ln(V) = ln(V_floor + depth * exp(-k*t))
  // We model uncertainty as N(ln(value), sigma_log²)
  const ln_value = Math.log(value_usd);
  const sigma_log = params.prior_sigma_log;

  // Convert log-space uncertainty to linear space
  // E[V] ≈ exp(μ_ln + σ²/2)
  // σ_V ≈ exp(μ_ln) * σ_log for moderate σ_log
  const sigma_usd = value_usd * sigma_log;

  return {
    value_usd,
    sigma_usd,
    sigma_log,
    formula: `V_floor=${v_floor.toFixed(0)} + depth=${depth.toFixed(0)} * exp(-${params.depreciation_rate_k}*${age_years})`,
    age_years,
    v_floor_usd: v_floor,
  };
}

/**
 * Select parameter set for aircraft by class/family/model hierarchy
 * Falls back progressively: model → family → class → generic
 */
export function selectParameterSet(
  aircraft_class: string,
  model_family?: string,
  model?: string,
  year?: number,
  all_params?: DepreciationParams[]
): DepreciationParams {
  if (!all_params || all_params.length === 0) {
    return getGenericParams();
  }

  // Try exact model match first
  if (model && year) {
    const exact = all_params.find(
      (p) =>
        p.aircraft_class === aircraft_class &&
        p.model === model &&
        p.year_from <= year &&
        p.year_to >= year
    );
    if (exact) return exact;
  }

  // Try family match
  if (model_family && year) {
    const family = all_params.find(
      (p) =>
        p.aircraft_class === aircraft_class &&
        p.model_family === model_family &&
        p.year_from <= year &&
        p.year_to >= year
    );
    if (family) return family;
  }

  // Try class match
  if (year) {
    const classMatch = all_params.find(
      (p) =>
        p.aircraft_class === aircraft_class &&
        !p.model &&
        !p.model_family &&
        p.year_from <= year &&
        p.year_to >= year
    );
    if (classMatch) return classMatch;
  }

  // Generic fallback
  return getGenericParams();
}

function getGenericParams(): DepreciationParams {
  return {
    v_new_usd: 250000,
    floor_ratio: 0.20,
    depreciation_rate_k: 0.05,
    prior_sigma_log: 0.22,
  };
}

export interface ParamSet {
  aircraft_class: string;
  model_family?: string;
  model?: string;
  year_from: number;
  year_to: number;
  v_new_usd: number;
  floor_ratio: number;
  depreciation_rate_k: number;
  prior_sigma_log: number;
  ridge_lambda?: number;
  model_features?: Record<string, any>;
  notes?: string;
}

export interface DepreciationParams extends Pick<ParamSet, 'v_new_usd' | 'floor_ratio' | 'depreciation_rate_k' | 'prior_sigma_log'> {
}
