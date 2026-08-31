/**
 * OMVM 2.0 Deterministic Adjustments
 * Applies damage, storage, and usage-based multiplicative adjustments
 */

export interface DamageEvidence {
  ntsb_finding?: boolean;
  ntsb_score: number; // 0.0 = no evidence, 1.0 = confirmed major event
  faa_sdr_count?: number;
  known_repairs?: string[];
  confidence: number;
}

export interface StorageProfile {
  type: 'unknown' | 'active_use' | 'occasional_use' | 'stored_dry_hangar' | 'stored_outside';
  months_stored?: number;
  coastal_exposure?: boolean;
  annual_maintenance?: string;
}

export interface UsageProfile {
  operator_type: 'unknown' | 'private_owner' | 'flight_training' | 'commercial_charter' | 'corporate' | 'government';
  annual_hours?: number;
  utilization_rate?: number; // 0-1
}

export interface AdjustmentResult {
  damage_multiplier: number;
  storage_multiplier: number;
  usage_multiplier: number;
  total_multiplier: number;
  notes: string[];
  uncertainty_propagation?: {
    damage_sigma: number;
    storage_sigma: number;
    usage_sigma: number;
  };
}

/**
 * Calculate damage adjustment
 * Multiplier is multiplicative: 0.91 means 9% discount
 */
export function calculateDamageAdjustment(
  evidence: DamageEvidence,
  base_value: number
): { multiplier: number; note: string } {
  const score = evidence.ntsb_score;

  let multiplier = 1.0;
  let note = '';

  if (score < 0.1) {
    multiplier = 1.0;
    note = 'No material damage evidence found';
  } else if (score < 0.35) {
    multiplier = 0.97;
    note = 'Weak damage evidence: minor incident or repair history';
  } else if (score < 0.70) {
    multiplier = 0.91;
    note = 'Material damage evidence: significant incident or major repair';
  } else {
    multiplier = 0.75;
    note = 'Confirmed major structural/engine damage';
  }

  // SDR adjustment: frequent service difficulties add risk
  if (evidence.faa_sdr_count && evidence.faa_sdr_count > 5) {
    const sdr_factor = Math.max(0.92, 1.0 - evidence.faa_sdr_count * 0.02);
    multiplier *= sdr_factor;
    note += `; ${evidence.faa_sdr_count} FAA SDRs`;
  }

  return { multiplier, note };
}

/**
 * Calculate storage adjustment based on exposure and time
 */
export function calculateStorageAdjustment(
  profile: StorageProfile
): { multiplier: number; note: string } {
  const base: Record<string, number> = {
    unknown: 1.0,
    active_use: 1.0,
    occasional_use: 0.99,
    stored_dry_hangar: 0.98,
    stored_outside: 0.94,
  };

  let multiplier = base[profile.type] || 1.0;
  let note = `Storage: ${profile.type}`;

  // Coastal exposure penalty
  if (profile.coastal_exposure) {
    multiplier *= 0.91;
    note += '; coastal corrosion risk';
  }

  // Long-term storage degradation
  if (profile.months_stored && profile.months_stored > 24) {
    const storage_factor = Math.max(0.85, 1.0 - (profile.months_stored - 24) * 0.005);
    multiplier *= storage_factor;
    note += `; ${profile.months_stored} months stored`;
  }

  return { multiplier, note };
}

/**
 * Calculate usage profile adjustment
 * Commercial/training usage can add value; neglect reduces it
 */
export function calculateUsageAdjustment(
  profile: UsageProfile
): { multiplier: number; note: string } {
  const base: Record<string, number> = {
    unknown: 1.0,
    private_owner: 1.0,
    flight_training: 1.02,    // Premium for well-maintained training
    commercial_charter: 1.05,
    corporate: 1.03,
    government: 1.02,
  };

  let multiplier = base[profile.operator_type] || 1.0;
  let note = `Usage: ${profile.operator_type}`;

  // High utilization can indicate strong maintenance
  if (profile.utilization_rate !== undefined) {
    if (profile.utilization_rate > 0.7) {
      multiplier *= 1.02;
      note += '; high utilization (well-maintained)';
    } else if (profile.utilization_rate < 0.1) {
      multiplier *= 0.98;
      note += '; low utilization (storage risk)';
    }
  }

  return { multiplier, note };
}

/**
 * Apply all adjustments to posterior value
 */
export function applyAdjustments(
  posterior_value_usd: number,
  damage?: DamageEvidence,
  storage?: StorageProfile,
  usage?: UsageProfile
): AdjustmentResult {
  const notes: string[] = [];
  let total_multiplier = 1.0;

  const damage_adj = damage
    ? calculateDamageAdjustment(damage, posterior_value_usd)
    : { multiplier: 1.0, note: 'No damage assessment' };

  const storage_adj = storage
    ? calculateStorageAdjustment(storage)
    : { multiplier: 1.0, note: 'Storage unknown' };

  const usage_adj = usage
    ? calculateUsageAdjustment(usage)
    : { multiplier: 1.0, note: 'Usage profile unknown' };

  notes.push(damage_adj.note, storage_adj.note, usage_adj.note);

  total_multiplier =
    damage_adj.multiplier * storage_adj.multiplier * usage_adj.multiplier;

  // Uncertainty propagation for adjustments
  // Each multiplier has ~2-5% uncertainty
  const uncertainty_propagation = {
    damage_sigma: damage_adj.multiplier * 0.03,
    storage_sigma: storage_adj.multiplier * 0.02,
    usage_sigma: usage_adj.multiplier * 0.02,
  };

  return {
    damage_multiplier: damage_adj.multiplier,
    storage_multiplier: storage_adj.multiplier,
    usage_multiplier: usage_adj.multiplier,
    total_multiplier,
    notes,
    uncertainty_propagation,
  };
}

/**
 * Final value with adjustments applied
 */
export function adjustedValue(
  posterior_value_usd: number,
  adjustments: AdjustmentResult
): number {
  return posterior_value_usd * adjustments.total_multiplier;
}
