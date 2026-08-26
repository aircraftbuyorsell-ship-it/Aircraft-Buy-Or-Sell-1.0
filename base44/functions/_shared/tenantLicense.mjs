// Pure, framework-agnostic White-Label Toolset license/entitlement logic.
//
// Deliberately has zero Deno-specific or @base44/sdk imports so it can be
// imported both from Base44 Deno functions (tenantAccessControl.ts) and from
// this repo's `node --test` suite for real, executable unit coverage — unlike
// most of base44/functions/*, which can only be verified by static source
// inspection because of their `npm:` Deno imports.
//
// This is the tenant-level counterpart to _shared/accessControl.ts: that
// module gates what an individual ABOS.com *user* can do; this one gates
// what a *tenant's* White-Label license lets its API keys do. The two are
// intentionally separate — a tenant license is a B2B grant to a customer
// organization, not a consumer entitlement — but they share the same shape
// (capability checks, sliding-window rate limits) as the existing ApiKey /
// accessControl pattern on purpose, per the "single authoritative model,
// don't duplicate pricing logic" principle: this is that model's tenant-
// scoped counterpart, not a second, competing one.

export const WHITE_LABEL_CAPABILITIES = Object.freeze([
  'ati_score',
  'ati_basic_report',
  'ati_pro_report',
  'valuation',
  'aircraft_passport',
  'n_reg_lookup',
  'market_intelligence',
  'advanced_intelligence',
  'search',
]);

export const PLAN_CAPABILITIES = Object.freeze({
  starter: Object.freeze(['ati_score', 'search']),
  professional: Object.freeze(['ati_score', 'ati_basic_report', 'valuation', 'search', 'market_intelligence']),
  enterprise: Object.freeze([...WHITE_LABEL_CAPABILITIES]),
});

// Same numbers as abosCoreApi's PLAN_LIMITS for individual ApiKeys — one
// rate-limit policy, reused rather than re-invented for tenant keys.
export const PLAN_RATE_LIMITS = Object.freeze({
  free: Object.freeze({ rpm: 20, rpd: 500 }),
  pro: Object.freeze({ rpm: 300, rpd: 20000 }),
  enterprise: Object.freeze({ rpm: 10000, rpd: 1000000 }),
});

const KEY_PREFIX = 'abos_tenant_';
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function hex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a new tenant API key. Returns the plaintext (show once, never
 * stored) and a display-safe prefix. Caller is responsible for hashing the
 * plaintext with hashApiKey() before persisting.
 */
export function generateTenantApiKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const plaintext = `${KEY_PREFIX}${hex(bytes)}`;
  return { plaintext, prefix: `${plaintext.slice(0, 20)}…` };
}

/** SHA-256 hex digest, using Web Crypto (available in both Deno and Node 18+). */
export async function hashApiKey(plaintext) {
  const data = new TextEncoder().encode(String(plaintext || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return hex(new Uint8Array(digest));
}

/** Does the plaintext look like a well-formed tenant API key (cheap pre-check before a hash lookup)? */
export function looksLikeTenantApiKey(plaintext) {
  return typeof plaintext === 'string' && /^abos_tenant_[0-9a-f]{48}$/.test(plaintext);
}

/** Is this License currently usable — active status and not past its expiry? */
export function isLicenseActive(license, now = Date.now()) {
  if (!license) return false;
  if (license.status !== 'active') return false;
  if (license.expires_at && Date.parse(license.expires_at) <= now) return false;
  return true;
}

/** Does an active License grant the given capability? */
export function canTenantUseCapability(license, capability) {
  if (!isLicenseActive(license)) return false;
  const allowed = Array.isArray(license.allowed_capabilities) ? license.allowed_capabilities : [];
  return allowed.includes(capability);
}

/** Default capability set for a plan, used when provisioning a new License. */
export function defaultCapabilitiesForPlan(plan) {
  return [...(PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.starter)];
}

/**
 * Sliding minute+day rate window, same algorithm as abosCoreApi's per-ApiKey
 * limiter. Pure — takes the persisted window state and current plan, returns
 * whether this request is allowed and the state to persist back.
 */
export function checkRateLimit(state, plan, now = Date.now()) {
  const limits = PLAN_RATE_LIMITS[plan] || PLAN_RATE_LIMITS.free;
  let minuteStart = state?.minuteStart || 0;
  let minuteCount = state?.minuteCount || 0;
  let dayStart = state?.dayStart || 0;
  let dayCount = state?.dayCount || 0;

  if (now - minuteStart > MINUTE_MS) { minuteStart = now; minuteCount = 0; }
  if (now - dayStart > DAY_MS) { dayStart = now; dayCount = 0; }

  if (minuteCount >= limits.rpm) {
    return { allowed: false, reason: 'rate_limited', limits, state: { minuteStart, minuteCount, dayStart, dayCount } };
  }
  if (dayCount >= limits.rpd) {
    return { allowed: false, reason: 'daily_limit_exceeded', limits, state: { minuteStart, minuteCount, dayStart, dayCount } };
  }
  return { allowed: true, limits, state: { minuteStart, minuteCount: minuteCount + 1, dayStart, dayCount: dayCount + 1 } };
}
