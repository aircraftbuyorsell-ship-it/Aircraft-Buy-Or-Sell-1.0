/**
 * ABOS V1 commercial product registry.
 * Keep this registry UI-facing only; checkout must use the server allowlist.
 */
export const ABOS_PRODUCTS = {
  ADVISOR: {
    key: 'ADVISOR',
    name: 'Free Advisor',
    price: 0,
    currency: 'USD',
    entitlement: null,
    cta: 'Ask ABOS',
    description: 'AI aircraft advisor with search, basic intelligence and ATI Score.',
  },
  ATI_REPORT: {
    key: 'ATI_REPORT',
    name: 'ATI Report',
    price: 39,
    currency: 'USD',
    entitlement: 'ATI_REPORT',
    cta: 'Get ATI Report',
    description: 'Expanded aircraft transparency, verification signals, risk flags and sources.',
  },
  DEAL_ANALYSIS: {
    key: 'DEAL_ANALYSIS',
    name: 'Deal Analysis',
    price: 99,
    currency: 'USD',
    entitlement: 'DEAL_ANALYSIS',
    cta: 'Analyze This Deal',
    description: 'ATI + valuation + market + economics + risk + buy/negotiation decision support.',
  },
  INVESTMENT: {
    key: 'INVESTMENT',
    name: 'Investment',
    price: 149,
    currency: 'USD',
    entitlement: 'INVESTMENT',
    cta: 'Run Investment Analysis',
    description: 'Ownership economics, scenarios, depreciation and investment decision support.',
  },
  PROFESSIONAL_REVIEW: {
    key: 'PROFESSIONAL_REVIEW',
    name: 'Professional Review',
    price: 499,
    currency: 'USD',
    priceLabel: 'from $499',
    entitlement: 'PROFESSIONAL_REVIEW',
    cta: 'Request Professional Review',
    description: 'AI analysis prepared for review by an appropriately credentialed aviation professional.',
  },
};

export const ABOS_PRODUCT_ORDER = [
  'ADVISOR',
  'ATI_REPORT',
  'DEAL_ANALYSIS',
  'INVESTMENT',
  'PROFESSIONAL_REVIEW',
];

export function getAbosProduct(key) {
  return ABOS_PRODUCTS[key] || null;
}
