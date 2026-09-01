import { base44 } from '@/api/base44Client';

// Frontend SDK wrapper for the ABOS entitlement engine (base44/functions/abosEntitlements).
// All access decisions are made server-side; this is a thin client.

export async function listProducts() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'list_products' });
  return res.data || res;
}

export async function authorizeCapability(capability, aircraftRegistration = '') {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'authorize_capability', capability, aircraft_registration: aircraftRegistration,
  });
  return res.data || res;
}

export async function checkEntitlement(productKey, aircraftRegistration = '') {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'check', product_key: productKey, aircraft_registration: aircraftRegistration,
  });
  return res.data || res;
}

export async function listMyEntitlements() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'list_mine' });
  return res.data || res;
}

export async function listMyReports() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'list_reports' });
  return res.data || res;
}

export async function createCheckout(productKey, aircraftRegistration, returnUrl) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'create_checkout', product_key: productKey,
    aircraft_registration: aircraftRegistration || '', return_url: returnUrl || window.location.href,
  });
  return res.data || res;
}

export async function createCustomerPortal(returnUrl) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'customer_portal', return_url: returnUrl || window.location.href,
  });
  return res.data || res;
}

export async function saveReport({ product_key, aircraft_registration, aircraft_label, report_type, result_data, data_sources, provider, confidence, verification_status, inputs, methodology_version }) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'save_report', product_key, aircraft_registration, aircraft_label, report_type,
    result_data, data_sources, provider, confidence, verification_status, inputs, methodology_version,
  });
  return res.data || res;
}

export async function recordUsage({ product_key, aircraft_registration, provider, cost_eur }) {
  const res = await base44.functions.invoke('abosEntitlements', {
    action: 'record_usage', product_key, aircraft_registration: aircraft_registration || '',
    provider: provider || 'abos_omvm', cost_eur: cost_eur || 0,
  });
  return res.data || res;
}

export async function usageSummary() {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'usage_summary' });
  return res.data || res;
}

export async function adminStats(filters = {}) {
  const res = await base44.functions.invoke('abosEntitlements', { action: 'admin_stats', filters });
  return res.data || res;
}

// Public API pricing / integration request. Runs through a server-side webhook
// so the request is captured and routed without exposing email infrastructure.
export async function submitApiInquiry(payload) {
  const res = await base44.functions.invoke('abosApiInquiry', payload);
  return res.data || res;
}
