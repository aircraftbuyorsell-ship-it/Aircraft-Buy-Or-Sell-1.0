/**
 * OMVM 2.0 Market Model
 * Processes live asking-price listings with sophisticated weighting and deduplication
 */

export interface MarketListing {
  source: 'controller' | 'trade_a_plane' | 'barnstormers' | 'aso' | 'other';
  listing_id: string;
  price_usd: number;
  hours?: number;
  observed_at?: string;
  feature_completeness?: number;
}

export interface ListingWeight {
  source_reliability: number;
  freshness: number;
  identity_match: number;
  feature_completeness: number;
  independence: number;
  final_weight: number;
}

export interface MarketModelResult {
  observation_count: number;
  effective_sample_size: number;
  market_value_usd: number;
  market_sigma_usd: number;
  market_sigma_log: number;
  weighted_observations: Array<{
    listing: MarketListing;
    weight: ListingWeight;
    log_price: number;
  }>;
  model_mode: 'full_hedonic' | 'reduced_hedonic' | 'robust_median' | 'fallback';
  deduplication_notes: string[];
}

/**
 * Source reliability weights (intrinsic quality of platform)
 */
const SOURCE_WEIGHTS: Record<string, number> = {
  controller: 1.0,        // Most reliable, professional platform
  trade_a_plane: 0.95,    // Well-established
  aso: 0.90,              // Aircraft Shopper Online
  barnstormers: 0.80,     // Less curated
  other: 0.70,            // Unknown sources
};

/**
 * Calculate freshness decay: 100% at 7 days ago, decays to 50% at 90 days
 */
function calculateFreshness(observed_at?: string): number {
  if (!observed_at) return 0.7; // Unknown age: penalty

  const now = new Date();
  const listing_date = new Date(observed_at);
  const days_old = (now.getTime() - listing_date.getTime()) / (1000 * 60 * 60 * 24);

  if (days_old < 0) return 0.5; // Future date: ignore
  if (days_old <= 7) return 1.0;
  if (days_old <= 30) return 1.0 - (days_old - 7) / 23 * 0.1; // Decay 1% per day after 7
  if (days_old <= 90) return 0.9 - (days_old - 30) / 60 * 0.4; // Then 0.4% per day
  return Math.max(0.3, 0.5 - (days_old - 90) / 100 * 0.2); // Minimum 0.3
}

/**
 * Calculate identity match score
 * Perfect if same make/model, partial if same make only
 */
function calculateIdentityMatch(
  listing: MarketListing,
  subject_make: string,
  subject_model: string
): number {
  const listing_make = (listing.listing_id || '').split('_')[0]?.toLowerCase() || '';
  const listing_model = (listing.listing_id || '').split('_')[1]?.toLowerCase() || '';

  const subject_make_norm = subject_make.toLowerCase();
  const subject_model_norm = subject_model.toLowerCase();

  if (listing_make === subject_make_norm && listing_model === subject_model_norm) {
    return 1.0; // Exact match
  }
  if (listing_make === subject_make_norm) {
    return 0.8; // Same make, different model
  }
  return 0.5; // Unrelated aircraft (fallback listing)
}

/**
 * Feature completeness of a listing (0-1)
 */
function getFeatureCompleteness(listing: MarketListing): number {
  if (listing.feature_completeness !== undefined) {
    return listing.feature_completeness;
  }
  // Heuristic: if hours present and price seems reasonable, estimate 0.8
  if (listing.hours !== undefined && listing.price_usd > 5000) {
    return 0.8;
  }
  return 0.6; // Conservative default
}

/**
 * Calculate independence of two listings
 * Penalize if same dealer/platform within 2 weeks
 */
function calculateIndependence(
  current: MarketListing,
  previous: MarketListing,
  all_listings: MarketListing[]
): number {
  // Simple heuristic: if same source and within 14 days, likely same dealer
  const is_same_source = current.source === previous.source;
  const days_apart = (new Date(current.observed_at || '').getTime() -
                      new Date(previous.observed_at || '').getTime()) / (1000 * 60 * 60 * 24);

  if (is_same_source && Math.abs(days_apart) < 14) {
    return 0.6; // Correlated observations
  }
  return 1.0; // Assumed independent
}

/**
 * Process market listings and calculate weighted market value estimate
 */
export function calculateMarketValue(
  listings: MarketListing[],
  subject_make: string,
  subject_model: string
): MarketModelResult {
  const notes: string[] = [];

  if (!listings || listings.length === 0) {
    return {
      observation_count: 0,
      effective_sample_size: 0,
      market_value_usd: NaN,
      market_sigma_usd: NaN,
      market_sigma_log: NaN,
      weighted_observations: [],
      model_mode: 'fallback',
      deduplication_notes: ['No listings provided'],
    };
  }

  // Filter: price sanity check
  const valid_listings = listings.filter((l) => {
    if (l.price_usd <= 5000) {
      notes.push(`Filtered out ${l.source}/${l.listing_id}: price too low (${l.price_usd})`);
      return false;
    }
    if (l.price_usd > 100000000) {
      notes.push(`Filtered out ${l.source}/${l.listing_id}: price suspiciously high`);
      return false;
    }
    return true;
  });

  // Calculate weights for each listing
  const weighted: Array<{
    listing: MarketListing;
    weight: ListingWeight;
    log_price: number;
  }> = [];

  valid_listings.forEach((listing, idx) => {
    const source_reliability = SOURCE_WEIGHTS[listing.source] || 0.7;
    const freshness = calculateFreshness(listing.observed_at);
    const identity_match = calculateIdentityMatch(listing, subject_make, subject_model);
    const feature_completeness = getFeatureCompleteness(listing);

    // Independence: check against prior listings in array
    let independence = 1.0;
    if (idx > 0) {
      independence = Math.min(
        ...valid_listings.slice(0, idx).map((prev) =>
          calculateIndependence(listing, prev, valid_listings)
        )
      );
    }

    const final_weight =
      source_reliability *
      freshness *
      identity_match *
      feature_completeness *
      independence;

    weighted.push({
      listing,
      weight: {
        source_reliability,
        freshness,
        identity_match,
        feature_completeness,
        independence,
        final_weight,
      },
      log_price: Math.log(listing.price_usd),
    });
  });

  // Calculate effective sample size
  const sum_w = weighted.reduce((sum, w) => sum + w.weight.final_weight, 0);
  const sum_w2 = weighted.reduce((sum, w) => sum + w.weight.final_weight ** 2, 0);
  const effective_n = sum_w2 > 0 ? sum_w ** 2 / sum_w2 : 0;

  // Decide model mode based on effective sample size
  let model_mode: typeof weighted[0]['weight']['final_weight'] | 'full_hedonic' | 'reduced_hedonic' | 'robust_median' | 'fallback';
  if (effective_n >= 8) {
    model_mode = 'full_hedonic';
  } else if (effective_n >= 5) {
    model_mode = 'reduced_hedonic';
  } else if (effective_n >= 2) {
    model_mode = 'robust_median';
  } else {
    model_mode = 'fallback';
  }

  // Calculate weighted mean and variance in log space
  const mean_log =
    sum_w > 0 ?
      weighted.reduce((sum, w) => sum + w.weight.final_weight * w.log_price, 0) / sum_w :
      NaN;

  const variance_log =
    sum_w > 0 ?
      weighted.reduce((sum, w) => sum + w.weight.final_weight * (w.log_price - mean_log) ** 2, 0) / sum_w :
      NaN;

  const sigma_log = Math.sqrt(variance_log);

  // Convert back to linear space
  const market_value_usd = Math.exp(mean_log + sigma_log ** 2 / 2);
  const market_sigma_usd = market_value_usd * sigma_log;

  return {
    observation_count: valid_listings.length,
    effective_sample_size: effective_n,
    market_value_usd,
    market_sigma_usd,
    market_sigma_log: sigma_log,
    weighted_observations: weighted,
    model_mode: model_mode as any,
    deduplication_notes: notes,
  };
}
