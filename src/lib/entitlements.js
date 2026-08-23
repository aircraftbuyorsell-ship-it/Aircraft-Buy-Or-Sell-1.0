import { base44 } from '@/api/base44Client';

// Frontend SDK wrapper for the ABOS entitlement engine (base44/functions/abosEntitlements).
// All access decisions are made server-side; this is a thin client.

export async function listProducts() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'list_products' });
  return res.data || res;
}

// Returns { entitled, reason, existing_report_id, checkout_price_eur, active_sub_product }
export async function checkEntitlement(productKey, aircraftRegistration = '') {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'check',
    product_key: productKey,
    aircraft_registration: aircraftRegistration,
  });
  return res.data || res;
}

// Returns the user's entitlements + active subscription product
export async function listMyEntitlements() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'list_mine' });
  return res.data || res;
}

// Returns the user's purchased reports
export async function listMyReports() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'list_reports' });
  return res.data || res;
}

// Create a Stripe Checkout session for a product. Returns { url }.
export async function createCheckout(productKey, aircraftRegistration, returnUrl) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'create_checkout',
    product_key: productKey,
    aircraft_registration: aircraftRegistration || '',
    return_url: returnUrl || window.location.href,
  });
  return res.data || res;
}

// Create a Stripe Customer Portal session. Returns { url }.
export async function createCustomerPortal(returnUrl) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'customer_portal',
    return_url: returnUrl || window.location.href,
  });
  return res.data || res;
}

// Save a report result after a paid tool runs (idempotent per aircraft+product).
export async function saveReport({ product_key, aircraft_registration, aircraft_label, report_type, result_data, data_sources, provider, confidence, verification_status, inputs, methodology_version }) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'save_report',
    product_key,
    aircraft_registration,
    aircraft_label,
    report_type,
    result_data,
    data_sources,
    provider,
    confidence,
    verification_status,
    inputs,
    methodology_version,
  });
  return res.data || res;
}

// Record a usage event (after a paid tool runs under a subscription).
export async function recordUsage({ product_key, aircraft_registration, provider, cost_eur }) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'record_usage',
    product_key,
    aircraft_registration: aircraft_registration || '',
    provider: provider || 'abos_omvm',
    cost_eur: cost_eur || 0,
  });
  return res.data || res;
}

// Usage summary for the current user.
export async function usageSummary() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'usage_summary' });
  return res.data || res;
}

// Admin: monetization stats.
export async function adminStats(filters = {}) {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'admin_stats', filters });
  return res.data || res;
}