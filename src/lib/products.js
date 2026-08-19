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
    key: 'ATI_FULL_REPORT',
    name: 'ATI Full Report',
    type: 'one_time',
    price_eur: 29.90,
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
    key: 'VALUATION_STUDIO',
    name: 'Valuation Studio',
    type: 'one_time',
    price_eur: 49.00,
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
  // ── Developer API (subscription) ──
  {
    key: 'API_PRO',
    name: 'API Pro',
    type: 'subscription',
    price_eur: 49,
    currency: 'eur',
    interval: 'month',
    category: 'developer',
    icon: 'Code',
    tagline: 'For developers building with ABOS',
    features: [
      '300 requests / min',
      '20,000 requests / day',
      'All API scopes (search, valuate, extract, listings)',
      'ADL & APL protocol access',
      'MCP server connectivity',
      'Webhook event delivery',
      'Integration Kit & Widget Gateway',
      'Email support',
    ],
  },
  {
    key: 'API_ENTERPRISE',
    name: 'API Enterprise',
    type: 'subscription',
    price_eur: 199,
    currency: 'eur',
    interval: 'month',
    category: 'developer',
    icon: 'Crown',
    tagline: 'For platforms & high-volume partners',
    features: [
      'Custom rate limits',
      'Unlimited daily requests',
      'All API scopes + white-label',
      'ADL & APL protocol access',
      'Dedicated MCP instance',
      'Webhook event delivery + retries',
      'Integration Kit & Widget Gateway',
      'Multiple API keys & team management',
      'SLA & priority support',
    ],
  },
];

// Products included (free) under each subscription plan
export const SUB_INCLUDED = {
  PRO: ['ATI_SCORE', 'VERIFICATION_PACK'],
  BROKER: ['ATI_SCORE', 'VERIFICATION_PACK'],
};

// Developer API tiers — maps to ApiKey.plan on payment
export const API_TIERS = {
  free: {
    id: 'free',
    label: 'Free',
    price_eur: 0,
    rate_limit_min: 20,
    rate_limit_day: 500,
    scopes: ['search:read', 'listing:read'],
    features: [
      '20 requests / min',
      '500 requests / day',
      'Search & listing read scopes',
      'Community support',
    ],
  },
  API_PRO: {
    id: 'API_PRO',
    label: 'API Pro',
    price_eur: 49,
    rate_limit_min: 300,
    rate_limit_day: 20000,
    scopes: ['listing:read', 'listing:write', 'search:read', 'intelligence:read'],
    features: [
      '300 requests / min',
      '20,000 requests / day',
      'All API scopes',
      'ADL & APL protocol access',
      'MCP server connectivity',
      'Webhook delivery',
      'Email support',
    ],
  },
  API_ENTERPRISE: {
    id: 'API_ENTERPRISE',
    label: 'API Enterprise',
    price_eur: 199,
    rate_limit_min: null,
    rate_limit_day: null,
    scopes: ['listing:read', 'listing:write', 'search:read', 'intelligence:read'],
    features: [
      'Custom rate limits',
      'Unlimited daily requests',
      'All scopes + white-label',
      'ADL & APL protocol access',
      'Dedicated MCP instance',
      'Webhook + retries',
      'Multiple API keys',
      'SLA & priority support',
    ],
  },
};

// Discount applied to paid one-time products under each subscription plan
export const SUB_DISCOUNT = {
  PRO: 0.30,
  BROKER: 0.40,
};

export const ONE_TIME_PRODUCTS = PRODUCT_CATALOG.filter((p) => p.type === 'one_time');
export const SUBSCRIPTION_PRODUCTS = PRODUCT_CATALOG.filter((p) => p.type === 'subscription');
export const DEVELOPER_API_PRODUCTS = PRODUCT_CATALOG.filter((p) => p.category === 'developer');

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