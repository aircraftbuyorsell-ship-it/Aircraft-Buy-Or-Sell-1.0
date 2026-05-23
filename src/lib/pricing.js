// Centralized pricing & token costs
// Display ratio: 1 token = 5 "credits" shown to user (psychological abundance)

export const CREDIT_RATIO = 5;

// ─── Stripe Live Price IDs (EUR) ──────────────────────────────────────────────
export const STRIPE_PRICES = {
  starter: {
    live: 'price_1TaO0mAT7Be3WR6Jepz0eQQS',
    amount: 2900,
    currency: 'eur',
    name: 'ABOS Starter',
    description: 'For individual pilots & aircraft enthusiasts',
  },
  pro: {
    live: 'price_1TaO1rAT7Be3WR6JaWnMa7mx',
    amount: 9900,
    currency: 'eur',
    name: 'ABOS Pro',
    description: 'For brokers, dealers & active market scouts',
  },
  enterprise: {
    live: 'price_1TaO2yAT7Be3WR6JjlhagUpB',
    amount: 29900,
    currency: 'eur',
    name: 'ABOS Enterprise',
    description: 'For transaction networks & institutional buyers',
  },
};

export function getPriceId(tier) {
  const tierConfig = STRIPE_PRICES[tier];
  if (!tierConfig) throw new Error(`Unknown tier: ${tier}`);
  return tierConfig.live;
}

export function getTierDetails(tier) {
  return STRIPE_PRICES[tier];
}

export function formatPrice(amount, currency = 'eur') {
  const symbols = { eur: '€', usd: '$', gbp: '£' };
  const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase();
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

export function getAllTiers() {
  return Object.entries(STRIPE_PRICES).reduce((acc, [key, tier]) => {
    acc[key] = { ...tier, displayPrice: formatPrice(tier.amount, tier.currency) };
    return acc;
  }, {});
}

// ─── UI Tiers ─────────────────────────────────────────────────────────────────
export const TIERS = {
  free_explorer: {
    id: "free_explorer",
    name: "Free Explorer",
    price: 9,
    price_label: "$9 one-time",
    tagline: "Verify & explore",
    tokens_included: 20,
    features: [
      "Verified member badge",
      "Browse all public listings",
      "20 ATI preview credits",
      "Basic market insights",
    ],
    cta: "Start exploring",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: null,
    price_label: "Token-based",
    tagline: "Pay-as-you-go, never overpay",
    tokens_included: 0,
    features: [
      "Everything in Free Explorer",
      "Full ATI Passport reports",
      "Deal Radar access",
      "Bulk import (ZIP / JSON)",
      "Leads CRM",
      "Branding & white-label",
      "Priority AI models",
    ],
    cta: "Buy tokens",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    price_label: "Custom",
    tagline: "Unlimited scale",
    features: [
      "Everything in Pro",
      "Unlimited tokens",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "Team seats",
      "SLA & priority support",
    ],
    cta: "Contact sales",
  },
};

// ─── Token Packs (linked to live Stripe prices) ───────────────────────────────
export const TOKEN_PACKS = [
  {
    id: "starter",
    name: "Starter",
    tokens: 100,
    price_usd: 29,
    badge: null,
    stripe_price_id: STRIPE_PRICES.starter.live,
    currency: STRIPE_PRICES.starter.currency,
    display_price: formatPrice(STRIPE_PRICES.starter.amount, STRIPE_PRICES.starter.currency),
  },
  {
    id: "pro",
    name: "Pro",
    tokens: 500,
    price_usd: 99,
    badge: "Most popular",
    bonus_pct: 10,
    stripe_price_id: STRIPE_PRICES.pro.live,
    currency: STRIPE_PRICES.pro.currency,
    display_price: formatPrice(STRIPE_PRICES.pro.amount, STRIPE_PRICES.pro.currency),
  },
  {
    id: "scale",
    name: "Scale",
    tokens: 2000,
    price_usd: 299,
    badge: "Best value",
    bonus_pct: 25,
    stripe_price_id: STRIPE_PRICES.enterprise.live,
    currency: STRIPE_PRICES.enterprise.currency,
    display_price: formatPrice(STRIPE_PRICES.enterprise.amount, STRIPE_PRICES.enterprise.currency),
  },
];

// ─── Token costs per action (raw tokens) ─────────────────────────────────────
export const TOKEN_COSTS = {
  ati_passport_full: 5,
  ati_passport_preview: 1,
  bulk_import_per_listing: 2,
  deal_radar_refresh: 1,
  lead_export: 3,
  branded_pdf: 2,
};

export const toCredits = (tokens) => (tokens || 0) * CREDIT_RATIO;
export const fromCredits = (credits) => Math.ceil((credits || 0) / CREDIT_RATIO);

export default STRIPE_PRICES;