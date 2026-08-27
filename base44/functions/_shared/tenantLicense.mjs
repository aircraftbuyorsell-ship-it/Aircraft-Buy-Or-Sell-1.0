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

// Lookup tables are null-prototype so that a caller-supplied key can never
// resolve to an inherited Object.prototype member. Without this,
// PLAN_CAPABILITIES['constructor'] returns the Object function — truthy — which
// let a request with plan:"constructor" pass validation and then crash
// provisioning on the spread. Object.freeze alone does not sever the chain.
function frozenLookup(entries) {
  return Object.freeze(Object.assign(Object.create(null), entries));
}

import { webcrypto } from './webcrypto.mjs';

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

export const PLAN_CAPABILITIES = frozenLookup({
  starter: Object.freeze(['ati_score', 'search']),
  professional: Object.freeze(['ati_score', 'ati_basic_report', 'valuation', 'search', 'market_intelligence']),
  enterprise: Object.freeze([...WHITE_LABEL_CAPABILITIES]),
});

// Same numbers as abosCoreApi's PLAN_LIMITS for individual ApiKeys — one
// rate-limit policy, reused rather than re-invented for tenant keys.
export const PLAN_RATE_LIMITS = frozenLookup({
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
  webcrypto.getRandomValues(bytes);
  const plaintext = `${KEY_PREFIX}${hex(bytes)}`;
  return { plaintext, prefix: `${plaintext.slice(0, 20)}…` };
}

/** SHA-256 hex digest, using Web Crypto (available in both Deno and Node 18+). */
export async function hashApiKey(plaintext) {
  const data = new TextEncoder().encode(String(plaintext || ''));
  const digest = await webcrypto.subtle.digest('SHA-256', data);
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

// ── Provisioning validation ────────────────────────────────────────────────
// tenant_id is referenced by License, TenantApiKey and ContractAcceptance and
// appears in generated package filenames, so it is constrained hard: lowercase
// alphanumeric + underscore only, must start with a letter. Rejecting at
// provisioning time keeps every downstream consumer (package builder, config
// files, URLs) from having to re-sanitize it.
const TENANT_ID_PATTERN = /^[a-z][a-z0-9_]{2,49}$/;

// Reserved because they'd collide with routing/config namespaces or read as
// an ABOS-official tenant to a customer.
const RESERVED_TENANT_IDS = Object.freeze([
  'abos', 'admin', 'api', 'core', 'default', 'internal', 'system', 'test', 'www',
]);

export function isValidTenantId(tenantId) {
  if (typeof tenantId !== 'string') return false;
  if (!TENANT_ID_PATTERN.test(tenantId)) return false;
  return !RESERVED_TENANT_IDS.includes(tenantId);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a tenant-provisioning request. Pure: returns the normalized values
 * plus a list of errors, so the caller decides how to surface them. Never
 * throws — callers treat a non-empty `errors` array as a 400.
 */
export function validateProvisionRequest(input) {
  const errors = [];
  const tenantId = String(input?.tenant_id || '').trim().toLowerCase();
  const displayName = String(input?.display_name || '').trim();
  const contactEmail = String(input?.contact_email || '').trim().toLowerCase();
  const plan = String(input?.plan || '').trim();
  const agreementVersion = String(input?.agreement_version || '').trim();
  const acceptedByEmail = String(input?.accepted_by_email || '').trim().toLowerCase();

  if (!isValidTenantId(tenantId)) {
    errors.push('tenant_id must be 3-50 chars, lowercase letters/digits/underscore, start with a letter, and not be a reserved name');
  }
  if (!displayName) errors.push('display_name is required');
  if (!EMAIL_PATTERN.test(contactEmail)) errors.push('contact_email must be a valid email address');
  if (!PLAN_CAPABILITIES[plan]) {
    errors.push(`plan must be one of: ${Object.keys(PLAN_CAPABILITIES).join(', ')}`);
  }
  // Contract acceptance is required to provision — a license is never created
  // without a recorded acceptance of a specific agreement version.
  if (!agreementVersion) errors.push('agreement_version is required (contract acceptance must be recorded before a license is issued)');
  if (!EMAIL_PATTERN.test(acceptedByEmail)) errors.push('accepted_by_email must be a valid email address');

  return {
    valid: errors.length === 0,
    errors,
    normalized: { tenantId, displayName, contactEmail, plan, agreementVersion, acceptedByEmail },
  };
}

// ── Endpoint → capability mapping ──────────────────────────────────────────
// Mirrors abosCoreApi's capabilityForEndpoint(), but over the white-label
// capability vocabulary. An endpoint with no mapping is NOT open by default —
// tenantCoreApi rejects unknown endpoints outright.
const ENDPOINT_CAPABILITIES = frozenLookup({
  'search': 'search',
  'listings.get': 'search',
  'listings.list': 'search',
  'ati.score': 'ati_score',
  'ati.report': 'ati_basic_report',
  'ati.report.pro': 'ati_pro_report',
  'valuate': 'valuation',
  'passport.get': 'aircraft_passport',
  'registry.lookup': 'n_reg_lookup',
  'intelligence.market': 'market_intelligence',
  'intelligence.advanced': 'advanced_intelligence',
});

export function capabilityForEndpoint(endpoint) {
  return ENDPOINT_CAPABILITIES[endpoint] || null;
}

export function isKnownEndpoint(endpoint) {
  return Object.prototype.hasOwnProperty.call(ENDPOINT_CAPABILITIES, endpoint);
}

export function listEndpoints() {
  return Object.keys(ENDPOINT_CAPABILITIES);
}

// ── Self-serve tenant checkout (Stripe) ─────────────────────────────────────

/**
 * The agreement version a self-serve checkout records acceptance of.
 *
 * MUST correspond to a real file at docs/white-label/agreements/<version>.md —
 * a ContractAcceptance pointing at text nobody can produce is worthless as
 * evidence, which is the whole reason the record exists.
 * test/agreement-versions.test.mjs pins that correspondence.
 *
 * When a new agreement version is published, bump this. Existing acceptances
 * keep pointing at the version their signer actually saw; they are never
 * rewritten.
 */
export const CURRENT_AGREEMENT_VERSION = '2026-08-26';

/** ContractAcceptance.agreement_type for the white-label licence agreement. */
export const WHITE_LABEL_AGREEMENT_TYPE = 'white_label_license_agreement';

/**
 * The agreement version a self-serve checkout records acceptance of.
 *
 * MUST correspond to a real file at docs/white-label/agreements/<version>.md —
 * a ContractAcceptance pointing at text nobody can produce is worthless as
 * evidence, which is the whole reason the record exists. test/
 * agreement-versions.test.mjs pins that correspondence.
 *
 * When a new agreement version is published, bump this. Existing acceptances
 * keep pointing at the version their signer actually saw; they are never
 * rewritten.
 */
export const CURRENT_AGREEMENT_VERSION = '2026-08-26';

// Pure mapping + slug helpers used by stripeWebhook when a paid Stripe
// Checkout session (Starter/Professional self-serve plans) needs to become a
// Tenant/License/TenantApiKey. Kept here rather than in stripeWebhook/entry.ts
// so they get real `node --test` coverage — stripeWebhook's own Deno `npm:`
// imports mean it can otherwise only be verified by static source inspection.

/**
 * Maps a Stripe Subscription status to the License.status this app persists.
 * License has no "trialing" state of its own (see the entity schema) — a
 * trialing subscription from self-serve checkout already has a card on file
 * (Stripe Checkout's default; this app never sets payment_method_collection:
 * 'if_required'), so it is treated as a normal active license for capability
 * purposes. Only a failed, unpaid or cancelled subscription moves a license
 * to 'suspended'. Returns null for a Stripe status with no defined mapping —
 * callers must treat null as "leave the License alone", not as a value to write.
 */
export function mapStripeStatusToLicenseStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'trialing':
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
    case 'incomplete_expired':
    case 'canceled':
    case 'paused':
      return 'suspended';
    default:
      return null;
  }
}

/**
 * Turns free text (a company name, an email local-part) into a tenant_id
 * candidate matching TENANT_ID_PATTERN: lowercase letters/digits/underscore,
 * starting with a letter, 3-50 chars. Does not guarantee uniqueness or that
 * the result isn't reserved — callers still check isValidTenantId() and look
 * for an existing Tenant before using the result.
 */
export function slugifyTenantId(input) {
  let slug = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!slug || !/^[a-z]/.test(slug)) slug = `tenant_${slug}`;
  slug = slug.replace(/_+$/, '') || 'tenant';
  if (slug.length < 3) slug = `${slug}_org`;
  return slug.slice(0, 50);
}
