/**
 * ABOS Hybrid Monetization Engine
 * ─────────────────────────────────
 * Credit-based pricing with 1.3x fiat index for non-subscriber pay-per-use.
 *
 * Model:
 *   - Subscribers pay with ABOS Credits (pre-purchased bundles)
 *   - Non-subscribers pay fiat (Stripe checkout) at 1.3x the credit-equivalent price
 *   - Free pipeline: Registry lookup, serial number, ICAO, owner check, basic OMVM valuation
 *   - Paid: ATI Score Card, OPEX, Full Report, Insurance, Leasing, Tracking
 *   - OPEX unlocks all sub-calculators (avionics, exterior, interior, detailing) for the session
 */

export const FIAT_INDEX = 1.3;       // non-subscriber markup
export const CREDIT_TO_EUR = 0.15;   // 1 credit ≈ €0.15

/**
 * Feature pricing map.
 * `credits` = cost for subscribers (in ABOS Credits)
 * `fiat_eur` = one-time price for non-subscribers (already includes 1.3x index + floor)
 * `free` = part of the free pipeline
 */
export const FEATURE_PRICING = {
  // ── FREE PIPELINE (Data Magnet) ──
  registry_lookup:        { free: true,  credits: 0, fiat_eur: 0,   label: 'N-Reg / ICAO / S/N Lookup', desc: 'FAA + international registry search' },
  owner_check:            { free: true,  credits: 0, fiat_eur: 0,   label: 'Owner Verification',         desc: 'Registered owner cross-reference' },
  basic_valuation:        { free: true,  credits: 0, fiat_eur: 0,   label: 'OMVM Estimated Value',       desc: 'Market-estimated aircraft value' },

  // ── PAID: Intelligence ──
  ati_quick_score:        { free: false, credits: 5,  fiat_eur: 9,   label: 'ATI Quick Score',            desc: '120-point aircraft transparency score', list_price_eur: 199, member_price_eur: 59 },
  ati_full_report:        { free: false, credits: 20, fiat_eur: 49,  label: 'ATI Full Report',            desc: 'Complete due diligence report with PDF', list_price_eur: 99, member_price_eur: 49 },
  ati_verify:             { free: false, credits: 15, fiat_eur: 26,  label: 'ATI Verify Session',         desc: 'Live expert verification session' },

  // ── PAID: Financial Calculators ──
  opex_calculator:        { free: false, credits: 3,  fiat_eur: 5,   label: 'OPEX Calculator',            desc: 'Full operating cost analysis — unlocks avionics, exterior, interior, detailing for session', list_price_eur: 79, member_price_eur: 49, unlocks: ['avionics_upgrade', 'exterior_refurb', 'interior_refurb', 'detailing'] },
  insurance_calculator:   { free: false, credits: 2,  fiat_eur: 4,   label: 'Insurance Calculator',       desc: 'Premium estimation with risk factors' },
  leasing_calculator:     { free: false, credits: 2,  fiat_eur: 4,   label: 'Leasing Calculator',         desc: 'Dry lease rate + tax benefit analysis' },
  tax_benefit:            { free: false, credits: 3,  fiat_eur: 5,   label: 'Tax Benefit Report',         desc: 'Rental tax shield calculation for flight schools' },

  // ── PAID: MRO / Upgrades (included with OPEX session) ──
  avionics_upgrade:       { free: false, credits: 1,  fiat_eur: 2,   label: 'Avionics Upgrade Calc',      desc: 'Included with OPEX session', bundled_with: 'opex_calculator' },
  exterior_refurb:        { free: false, credits: 1,  fiat_eur: 2,   label: 'Exterior Refurb Calc',       desc: 'Included with OPEX session', bundled_with: 'opex_calculator' },
  interior_refurb:        { free: false, credits: 1,  fiat_eur: 2,   label: 'Interior Refurb Calc',       desc: 'Included with OPEX session', bundled_with: 'opex_calculator' },
  detailing:              { free: false, credits: 0,  fiat_eur: 0,   label: 'Detailing Calc',             desc: 'Free lead magnet' },

  // ── PAID: Tracking ──
  aircraft_tracking:      { free: false, credits: 10, fiat_eur: 19,  label: 'Aircraft Tracker (monthly)', desc: 'Live ADS-B tracking + historical data + movement alerts', recurring: true },

  // ── PAID: Market Data ──
  market_report:          { free: false, credits: 8,  fiat_eur: 15,  label: 'Market Report',              desc: 'Make/model market analysis with comparables' },
  investment_brief:       { free: false, credits: 5,  fiat_eur: 9,   label: 'Investment Brief',           desc: 'AI-powered investment health analysis' },

  // ── PAID: Newsletter ──
  newsletter_subscription:{ free: false, credits: 0,  fiat_eur: 12,  label: 'Weekly Briefing Subscription', desc: 'Aviation market intelligence — 8 sectors, delivered weekly', recurring: true, recurring_interval: 'month' },
};

/**
 * Credit bundle pricing — pre-paid packages.
 * Larger bundles = better per-credit rate.
 */
export const CREDIT_BUNDLES = [
  { id: 'starter',   credits: 50,   price_eur: 75,   per_credit: 1.50, label: 'Starter Pack',    popular: false },
  { id: 'pro',       credits: 200,  price_eur: 240,  per_credit: 1.20, label: 'Pro Pack',        popular: true },
  { id: 'business',  credits: 500,  price_eur: 500,  per_credit: 1.00, label: 'Business Pack',   popular: false },
  { id: 'enterprise',credits: 2000, price_eur: 1600, per_credit: 0.80, label: 'Enterprise Pack', popular: false },
];

/**
 * Subscription tiers — monthly plans that include credits + discounts.
 */
export const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    label: 'Free Explorer',
    price_eur: 0,
    credits_monthly: 0,
    fiat_multiplier: FIAT_INDEX,
    features: ['Free registry lookup', 'Free OMVM estimate', 'Full fiat pricing on paid features'],
    cta: 'Current plan',
  },
  {
    id: 'starter',
    label: 'Starter',
    price_eur: 29,
    credits_monthly: 50,
    fiat_multiplier: 1,
    features: ['50 credits / month', 'All calculators unlocked', 'ATI Quick Score included', 'Member pricing on reports'],
    cta: 'Subscribe',
    popular: false,
  },
  {
    id: 'pro',
    label: 'Pro',
    price_eur: 99,
    credits_monthly: 200,
    fiat_multiplier: 1,
    features: ['200 credits / month', 'Full ATI Report included', 'Aircraft tracking (1 aircraft)', 'Priority support', 'Tax benefit reports'],
    cta: 'Subscribe',
    popular: true,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price_eur: 249,
    credits_monthly: 500,
    fiat_multiplier: 1,
    features: ['500 credits / month', 'Unlimited tracking', 'White-label API', 'Dedicated account manager', 'Custom branding'],
    cta: 'Contact sales',
    popular: false,
  },
];

/**
 * Get the price for a feature based on user's auth/subscription status.
 * Returns { method, credits, fiat_eur, display_price, is_free, show_discount_banner }
 */
export function getFeaturePrice(featureId, userContext = {}) {
  const feature = FEATURE_PRICING[featureId];
  if (!feature) return null;

  if (feature.free) {
    return { method: 'free', credits: 0, fiat_eur: 0, display_price: 'Free', is_free: true };
  }

  const isRegistered = !!userContext.email;
  const isVerified = userContext.verified === true;
  const hasSubscription = !!userContext.subscription_tier && userContext.subscription_tier !== 'free';
  const creditBalance = userContext.credit_balance || 0;

  // Registered subscriber with credits → pay with credits
  if (hasSubscription && creditBalance >= feature.credits) {
    return {
      method: 'credits',
      credits: feature.credits,
      fiat_eur: feature.fiat_eur,
      display_price: `${feature.credits} credits`,
      is_free: false,
      member_price_eur: feature.member_price_eur,
      list_price_eur: feature.list_price_eur,
    };
  }

  // Non-subscriber or insufficient credits → fiat with 1.3x index
  // Show full list price to anonymous, discount to registered
  const showDiscountBanner = !isRegistered || (!hasSubscription && feature.list_price_eur);

  return {
    method: 'fiat',
    credits: feature.credits,
    fiat_eur: feature.fiat_eur,
    display_price: `€${feature.fiat_eur}`,
    is_free: false,
    list_price_eur: feature.list_price_eur,
    member_price_eur: feature.member_price_eur,
    show_discount_banner: showDiscountBanner,
    discount_pct: feature.list_price_eur ? Math.round((1 - feature.member_price_eur / feature.list_price_eur) * 100) : 30,
  };
}

/**
 * Check if a feature is unlocked for the current session (e.g., OPEX was purchased).
 */
export function isFeatureUnlocked(featureId, sessionState = {}) {
  const feature = FEATURE_PRICING[featureId];
  if (!feature) return false;
  if (feature.free) return true;

  // Check if bundled with an already-purchased feature
  if (feature.bundled_with && sessionState.unlockedFeatures?.includes(feature.bundled_with)) {
    return true;
  }

  // Check OPEX unlocks
  if (FEATURE_PRICING.opex_calculator?.unlocks?.includes(featureId) && sessionState.unlockedFeatures?.includes('opex_calculator')) {
    return true;
  }

  return sessionState.unlockedFeatures?.includes(featureId) || false;
}