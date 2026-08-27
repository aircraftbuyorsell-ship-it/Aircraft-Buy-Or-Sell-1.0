// Shared tenant license constants and utilities used by both admin provisioning and webhook checkout

export const CURRENT_AGREEMENT_VERSION = '2026-08-26';
export const WHITE_LABEL_AGREEMENT_TYPE = 'white_label_license_agreement';

// Capability sets per plan
export const PLAN_CAPABILITIES = {
  starter: ['search', 'ati_score', 'ati_basic_report', 'market_intelligence'],
  professional: ['search', 'ati_score', 'ati_basic_report', 'ati_pro_report', 'valuation', 'market_intelligence'],
  enterprise: ['search', 'ati_score', 'ati_basic_report', 'ati_pro_report', 'valuation', 'market_intelligence'],
};

// Rate limits per plan (requests per minute / per day)
export const PLAN_RATE_LIMITS = {
  starter: { rpm: 60, rpd: 10000 },
  professional: { rpm: 300, rpd: 100000 },
  enterprise: { rpm: 1000, rpd: 500000 },
};

// Validate tenant ID format and characters
export function isValidTenantId(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') return false;
  if (tenantId.length < 3 || tenantId.length > 50) return false;
  // Alphanumeric, hyphens, underscores only
  return /^[a-z0-9_-]+$/i.test(tenantId);
}

// Convert display name to tenant ID slug
export function slugifyTenantId(displayName) {
  if (!displayName) return '';
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Validate tenant provisioning request
export function validateProvisionRequest(body) {
  const errors = [];

  if (!body.tenant_id || !isValidTenantId(body.tenant_id)) {
    errors.push('tenant_id must be alphanumeric, 3-50 chars');
  }
  if (!body.plan || !['starter', 'professional', 'enterprise'].includes(body.plan)) {
    errors.push('plan must be starter, professional, or enterprise');
  }
  if (!body.requested_capabilities || !Array.isArray(body.requested_capabilities)) {
    errors.push('requested_capabilities must be an array');
  }
  if (!body.agreement_version || body.agreement_version !== CURRENT_AGREEMENT_VERSION) {
    errors.push(`agreement_version must be ${CURRENT_AGREEMENT_VERSION}`);
  }
  if (!body.accepted_by_email || typeof body.accepted_by_email !== 'string') {
    errors.push('accepted_by_email is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get capabilities granted by a plan
export function defaultCapabilitiesForPlan(plan) {
  return PLAN_CAPABILITIES[plan] || [];
}

// Get rate limits for a plan
export function getRateLimitsForPlan(plan) {
  return PLAN_RATE_LIMITS[plan] || PLAN_RATE_LIMITS.starter;
}

// Generate a new tenant API key (plaintext)
export function generateTenantApiKey(tenantId) {
  const prefix = 'wl_';
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 64);
  return `${prefix}${tenantId}_${randomPart}`;
}

// Hash an API key for storage
export async function hashApiKey(plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Map Stripe subscription status to License.status
export function mapStripeStatusToLicenseStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'suspended';
    case 'canceled':
    case 'unpaid':
      return 'suspended';
    case 'ended':
      return 'expired';
    default:
      return 'suspended';
  }
}
