// ABOS V1 customer-facing product registry — single source of truth.
// Stripe Price IDs are intentionally resolved server-side. Never expose or trust them in the browser.
export const ABOS_PRODUCTS = {
  ADVISOR: {
    key: 'ADVISOR', name: 'Free Advisor', price: 0, currency: 'usd', displayPrice: 'Free',
    entitlement: null, path: '/finance-advisor', tier: 'free',
  },
  ATI_REPORT: {
    key: 'ATI_REPORT', name: 'ATI Report', price: 39, currency: 'usd', displayPrice: '$39',
    entitlement: 'ATI_REPORT', path: '/ati-full-report', tier: 'paid',
  },
  DEAL_ANALYSIS: {
    key: 'DEAL_ANALYSIS', name: 'Deal Analysis', price: 99, currency: 'usd', displayPrice: '$99',
    entitlement: 'DEAL_ANALYSIS', path: '/deal-analysis', tier: 'paid',
  },
  INVESTMENT: {
    key: 'INVESTMENT', name: 'Investment', price: 149, currency: 'usd', displayPrice: '$149',
    entitlement: 'INVESTMENT', path: '/investment-brief', tier: 'paid',
  },
  PROFESSIONAL: {
    key: 'PROFESSIONAL', name: 'Professional Review', price: 499, currency: 'usd', displayPrice: '$499+',
    entitlement: 'PROFESSIONAL', path: '/experts', tier: 'professional',
  },
  API_STARTER: {
    key: 'API_STARTER', name: 'ABOS API — Starter', price: 690, currency: 'usd', displayPrice: '$690/mo',
    entitlement: 'API_STARTER', path: '/api', tier: 'business', recurring: true,
  },
  API_PROFESSIONAL: {
    key: 'API_PROFESSIONAL', name: 'ABOS API — Professional', price: 1890, currency: 'usd', displayPrice: '$1,890/mo',
    entitlement: 'API_PROFESSIONAL', path: '/api', tier: 'business', recurring: true,
  },
};

export const ABOS_PRODUCT_ORDER = ['ADVISOR', 'ATI_REPORT', 'DEAL_ANALYSIS', 'INVESTMENT', 'PROFESSIONAL', 'API_STARTER', 'API_PROFESSIONAL'];
export const ABOS_PAID_PRODUCTS = ABOS_PRODUCT_ORDER.map(k => ABOS_PRODUCTS[k]).filter(p => p.price > 0);
export const ABOS_PUBLIC_PRICES = Object.fromEntries(ABOS_PRODUCT_ORDER.map(k => [k, ABOS_PRODUCTS[k].displayPrice]));

export function getAbosProduct(key) { return ABOS_PRODUCTS[key] || null; }
export function getAbosProductForEntitlement(key) { return ABOS_PAID_PRODUCTS.find(p => p.entitlement === key) || null; }
