// Centralized pricing & token costs
// Display ratio: 1 token = 5 "credits" shown to user (psychological abundance)

export const CREDIT_RATIO = 5;

export const TIERS = {
  free_explorer: {
    id: "free_explorer",
    name: "Free Explorer",
    price: 9,
    price_label: "$9 one-time",
    tagline: "Verify & explore",
    tokens_included: 20, // = 100 credits displayed
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

// Token packs (raw tokens — display as `tokens * CREDIT_RATIO` credits)
// stripe_price_id: create these in your Stripe dashboard as one-time prices, then paste the IDs here
export const TOKEN_PACKS = [
  { id: "starter", name: "Starter", tokens: 100, price_usd: 29, badge: null, stripe_price_id: "" },
  { id: "pro", name: "Pro", tokens: 500, price_usd: 99, badge: "Most popular", bonus_pct: 10, stripe_price_id: "" },
  { id: "scale", name: "Scale", tokens: 2000, price_usd: 299, badge: "Best value", bonus_pct: 25, stripe_price_id: "" },
];

// Token costs per action (raw tokens)
export const TOKEN_COSTS = {
  ati_passport_full: 5,     // = 25 credits
  ati_passport_preview: 1,  // = 5 credits
  bulk_import_per_listing: 2,
  deal_radar_refresh: 1,
  lead_export: 3,
  branded_pdf: 2,
};

export const toCredits = (tokens) => (tokens || 0) * CREDIT_RATIO;
export const fromCredits = (credits) => Math.ceil((credits || 0) / CREDIT_RATIO);