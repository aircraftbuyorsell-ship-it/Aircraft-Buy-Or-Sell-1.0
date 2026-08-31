/**
 * ABOS Stripe plan catalog — one simple plan for Buyers & Sellers (monthly / annual)
 * plus volume-based plans for Marketplaces.
 * Amounts must stay in sync with base44/functions/stripeCreateCheckout/entry.ts
 */

export const PRO_PLANS = [
  {
    plan_type: "abos_pro_monthly",
    label: "ABOS Pro — Monthly",
    price_eur: 199,
    interval: "month",
    billing_note: "Billed monthly, cancel anytime",
  },
  {
    plan_type: "abos_pro_annual",
    label: "ABOS Pro — Annual",
    price_eur: 1990,
    interval: "year",
    billing_note: "2 months free vs monthly",
    popular: true,
  },
];

export const PRO_FEATURES = [
  "Unlimited FAA & international registry lookups",
  "Full ATI Passport reports & Digital Twin",
  "OMVM valuations with market comparables",
  "All financial calculators (OPEX, leasing, insurance, tax)",
  "Deal Radar, alerts & sales pipeline",
  "AI assistant access from ChatGPT & Claude",
];

export const MARKETPLACE_PLANS = [
  {
    plan_type: "abos_market_growth",
    label: "Growth",
    price_eur: 499,
    interval: "month",
    volume: "Up to 250 active listings",
    features: ["Bulk listing import", "API access (10k calls / mo)", "Team seats: 5"],
  },
  {
    plan_type: "abos_market_scale",
    label: "Scale",
    price_eur: 999,
    interval: "month",
    volume: "Up to 1,000 active listings",
    features: ["Everything in Growth", "API access (50k calls / mo)", "Team seats: 20", "Priority support"],
    popular: true,
  },
  {
    plan_type: "abos_market_enterprise",
    label: "Enterprise",
    price_eur: 1999,
    interval: "month",
    volume: "Unlimited listings",
    features: ["Everything in Scale", "Unlimited API calls", "White-label & custom domain", "Dedicated account manager"],
  },
];

export const formatEur = (value) => `€${value.toLocaleString("en-US")}`;