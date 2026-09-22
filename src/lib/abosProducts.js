// Compatibility layer over the one catalog in `@/lib/products`.
//
// This file used to be a SECOND product registry with its own prices, and the
// two drifted: it still advertised Deal Analysis $99, Investment $149 and
// Professional $499 after those SKUs were archived in Stripe. Nothing is
// defined here any more — every value is derived from PRODUCT_CATALOG.
//
// The old keys survive only because four UI call sites still use them:
//   DEAL_ANALYSIS and INVESTMENT both collapse onto ATI Pro, which is what they
//   always were — the doc names it "ATI Pro (Investment Brief)" and it is the
//   sub-€500k Trade Desk entry. PROFESSIONAL is Professional Review, kept.
//
// Deprecated: new code imports from `@/lib/products` directly.

import { getProduct, formatProductPrice } from '@/lib/products';

function view(key, { path, tier }) {
  const p = getProduct(key);
  if (!p) return null;
  return {
    key: p.key,
    name: p.name,
    price: p.price_usd ?? p.price_eur ?? 0,
    currency: p.currency,
    displayPrice: formatProductPrice(p),
    entitlement: p.free ? null : p.key,
    path,
    tier,
  };
}

export const ABOS_PRODUCTS = {
  // The Advisor is free and is an entry point into verification, not a product.
  ADVISOR: { key: 'ADVISOR', name: 'Aircraft Advisor', price: 0, currency: 'eur', displayPrice: 'Free', entitlement: null, path: '/advisor', tier: 'free' },
  ATI_REPORT: view('ATI_REPORT', { path: '/ati-full-report', tier: 'paid' }),
  DEAL_ANALYSIS: view('ATI_PRO', { path: '/investment-brief', tier: 'paid' }),
  INVESTMENT: view('ATI_PRO', { path: '/investment-brief', tier: 'paid' }),
  PROFESSIONAL: view('PROFESSIONAL_REVIEW', { path: '/experts', tier: 'professional' }),
};

export const ABOS_PRODUCT_ORDER = ['ADVISOR', 'ATI_REPORT', 'DEAL_ANALYSIS', 'PROFESSIONAL'];
export const ABOS_PAID_PRODUCTS = ABOS_PRODUCT_ORDER.map(k => ABOS_PRODUCTS[k]).filter(p => p && p.price > 0);
export const ABOS_PUBLIC_PRICES = Object.fromEntries(ABOS_PRODUCT_ORDER.map(k => [k, ABOS_PRODUCTS[k]?.displayPrice]));

export function getAbosProduct(key) { return ABOS_PRODUCTS[key] || null; }
export function getAbosProductForEntitlement(key) { return ABOS_PAID_PRODUCTS.find(p => p.entitlement === key) || null; }
