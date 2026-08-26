// Canonical public shape of an OMVM valuation in the ABOS API contract.
//
// Shared between abosCoreApi (direct API-key / user-session callers) and
// tenantCoreApi (White-Label tenant callers), for the same reason as
// listingMapper: a white-label customer must see exactly the same valuation
// contract as a direct API customer, since both are documented as ABOS Core
// API v1.
//
// Formatting only — no authorization, no engine logic. The valuation itself is
// produced by the omvmV5Score Base44 function; this just shapes its output.

const SPREAD_RATIO = 0.15;

/**
 * Is this a usable valuation, or did the engine decline to produce one?
 *
 * Declining is a legitimate, meaningful outcome: with no comparables there is
 * no defensible number, and inventing one would be worse than saying so.
 */
export function hasUsableValuation(v5) {
  return !!v5 && v5.status !== 'insufficient_comparables' && v5.omvm_value != null;
}

/**
 * Maps an omvmV5Score result into the v1 valuation contract.
 *
 * @param {object} v5 Raw omvmV5Score output
 * @param {object} aircraft Echoed request aircraft {manufacturer, model, year, hours}
 */
export function mapValuation(v5, aircraft) {
  const echo = {
    manufacturer: aircraft?.manufacturer ?? null,
    model: aircraft?.model ?? null,
    year: aircraft?.year ?? null,
    hours: aircraft?.hours ?? null,
  };

  if (!hasUsableValuation(v5)) {
    // estimated_value stays null rather than 0: a refused valuation must never
    // be renderable as "this aircraft is worth nothing".
    return {
      aircraft: echo,
      estimated_value: null,
      range: { min: null, max: null },
      currency: 'USD',
      confidence: null,
      rationale: v5?.message || 'No comparable listings and no live market data — not enough evidence for a defensible valuation.',
      model_version: 'omvm-v5',
    };
  }

  const spread = Math.round(v5.omvm_value * SPREAD_RATIO);
  return {
    aircraft: echo,
    estimated_value: v5.omvm_value,
    range: {
      min: v5.market_intelligence?.live_min_price ?? Math.max(0, v5.omvm_value - spread),
      max: v5.market_intelligence?.live_max_price ?? v5.omvm_value + spread,
    },
    currency: 'USD',
    confidence: typeof v5.confidence === 'string' ? v5.confidence.toLowerCase() : v5.confidence,
    rationale: v5.market_intelligence?.notes
      || `OMVM v5 comp-based valuation (${v5.comp_sample ?? 0} comparable listing(s), ${v5.confidence || 'unknown'} confidence).`,
    model_version: 'omvm-v5',
  };
}
