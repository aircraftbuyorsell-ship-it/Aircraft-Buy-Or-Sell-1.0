// ABOS Product Catalog — mirrors the server-side catalog in abosEntitlements.
// Source of truth for pricing UI display. Prices are also enforced server-side
// at checkout creation (frontend prices are never trusted for access).

export const PRODUCT_CATALOG = [
  // ── Individual (one-time) ──
  {
    key: 'ATI_SCORE',
    name: 'ATI Score',
    type: 'one_time',
    price_eur: 9.90,
    currency: 'eur',
    category: 'individual',
    icon: 'Shield',
    tagline: 'Aircraft Transparency Index score',
    features: [
      '120-point transparency score',
      'Key risk factors',
      'Basic aircraft transparency analysis',
      'Re-accessible for the same aircraft',
    ],
  },
  {
    key: 'ATI_BASIC_REPORT',
    name: 'ATI Report — Level 2',
    type: 'one_time',
    price_usd: 49.00,
    currency: 'usd',
    stripe_price_id: 'price_1U7dkVAT7Be3WR6JsraFG9Ki',
    currency: 'eur',
    category: 'individual',
    icon: 'FileBarChart',
    tagline: 'Complete due diligence report',
    features: [
      'Aircraft identity & data provenance',
      'Verification results',
      'Full transparency analysis',
      'Risk / exception indicators',
      'Sources used & confidence',
      'PDF export',
    ],
  },
  {
    key: 'ATI_PRO',
    name: 'ATI Pro — Investment Brief',
    type: 'one_time',
    price_usd: 199.00,
    currency: 'usd',
    stripe_price_id: 'price_1U7dkYAT7Be3WR6Jaf9jqrVV',
    category: 'professional',
    icon: 'FileBarChart',
    tagline: 'Investment-grade aircraft intelligence brief',
    features: ['CAPEX / OPEX analysis', 'Insurance & MRO analysis', 'Market intelligence', 'Rebuild ROI', 'Confidence & data sources'],
  },
  {
    key: 'ATI_PRO_TAX',
    name: 'ATI Pro Tax — Tax & Insurance Upgrade',
    type: 'one_time',
    price_usd: 499.00,
    currency: 'usd',
    stripe_price_id: 'price_1U7dkbAT7Be3WR6JDOjfF3Eg',
    category: 'professional',
    icon: 'Shield',
    tagline: 'Tax, insurance, fractional ownership and lease-rate analysis',
    features: ['Jurisdiction-specific tax analysis', 'Insurance analysis', 'Fractional ownership', 'Lease-rate analysis'],
  },
  {
    key: 'ATI_FULL_REPORT',
    name: 'ATI Full Report (legacy)',
    type: 'one_time',
    price_eur: 49.00,
    legacy: true,
    category: 'legacy',
    icon: 'FileBarChart',
    tagline: 'Legacy report access for existing purchases',
    features: ['Existing purchased report access'],
  },
  {
    key: 'VALUATION_STUDIO',
    name: 'Valuation Studio',
    type: 'one_time',
    price_eur: 29.00,
    currency: 'eur',
    category: 'individual',
    icon: 'TrendingUp',
    tagline: 'Full ABOS valuation analysis',
    features: [
      'Aircraft identity & configuration',
      'Available market comparables',
      'ABOS OMVM result',
      'Valuation methodology & inputs',
      'Confidence & data sources',
      'Provider-ready architecture (VREF, Bluebook…)',
    ],
  },
  {
    key: 'VERIFICATION_PACK',
    name: 'Verification Pack',
    type: 'one_time',
    price_eur: 19.90,
    currency: 'eur',
    category: 'individual',
    icon: 'BadgeCheck',
    tagline: 'Multi-check aircraft verification',
    features: [
      'N-REG lookup',
      'Serial number (S/N) check',
      'Owner check',
      'Activity check',
      'Aircraft identity verification',
    ],
  },
  // ── Professional (subscription) ──
  {
    key: 'PRO',
    name: 'ABOS Professional',
    type: 'subscription',
    price_eur: 99,
    currency: 'eur',
    interval: 'month',
    category: 'professional',
    icon: 'Crown',
    tagline: 'For active buyers & scouts',
    features: [
      'Increased search limits',
      'ATI Score access included',
      'Discounted ATI Full Reports',
      'Discounted Valuation Studio',
      'Advanced aircraft intelligence',
      'Market comparables',
      'Saved aircraft & reports',
      'Workspace functionality',
      'Priority access to new tools',
    ],
  },
  {
    key: 'BROKER',
    name: 'ABOS Broker / Dealer',
    type: 'subscription',
    price_eur: 299,
    currency: 'eur',
    interval: 'month',
    category: 'professional',
    icon: 'Building',
    tagline: 'For brokers, dealers & teams',
    features: [
      'Everything in Professional',
      'Higher usage limits',
      'Multiple aircraft / workspace management',
      'Bulk aircraft analysis',
      'Broker / dealer workflow',
      'Listing intelligence & advanced reports',
      'Team / workspace support',
      'API / MCP access when enabled',
      'Priority integration features',
    ],
  },
];

// Products included (free) under each subscription plan
export const SUB_INCLUDED = {
  PRO: ['ATI_SCORE', 'VERIFICATION_PACK'],
  BROKER: ['ATI_SCORE', 'VERIFICATION_PACK'],
};

// Discount applied to paid one-time products under each subscription plan
export const SUB_DISCOUNT = {
  PRO: 0.30,
  BROKER: 0.40,
};

export const ONE_TIME_PRODUCTS = PRODUCT_CATALOG.filter((p) => p.type === 'one_time');
export const SUBSCRIPTION_PRODUCTS = PRODUCT_CATALOG.filter((p) => p.type === 'subscription');

export function getProduct(key) {
  return PRODUCT_CATALOG.find((p) => p.key === key);
}

export function formatEur(amount) {
  return `€${Number(amount).toFixed(2)}`;
}

// Compute the effective price for a one-time product given the user's active subscription.
export function effectivePrice(productKey, activeSubProduct) {
  const p = getProduct(productKey);
  if (!p || p.type !== 'one_time') return null;
  if (activeSubProduct && SUB_INCLUDED[activeSubProduct]?.includes(productKey)) {
    return { eur: 0, included: true, original_eur: p.price_eur };
  }
  let eur = p.price_eur;
  if (activeSubProduct && SUB_DISCOUNT[activeSubProduct]) {
    eur = +(eur * (1 - SUB_DISCOUNT[activeSubProduct])).toFixed(2);
  }
  return { eur, included: false, original_eur: p.price_eur, discount_pct: activeSubProduct ? SUB_DISCOUNT[activeSubProduct] : 0 };
}