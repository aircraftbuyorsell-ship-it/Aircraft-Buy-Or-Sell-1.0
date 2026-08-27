import test from "node:test";
import assert from "node:assert/strict";
import {
  generateTenantApiKey,
  hashApiKey,
  looksLikeTenantApiKey,
  isLicenseActive,
  canTenantUseCapability,
  defaultCapabilitiesForPlan,
  checkRateLimit,
  isValidTenantId,
  validateProvisionRequest,
  capabilityForEndpoint,
  isKnownEndpoint,
  listEndpoints,
  mapStripeStatusToLicenseStatus,
  slugifyTenantId,
  WHITE_LABEL_CAPABILITIES,
  PLAN_CAPABILITIES,
  PLAN_RATE_LIMITS,
} from "../base44/functions/_shared/tenantLicense.mjs";

const validProvisionInput = {
  tenant_id: "skydeals_europe",
  display_name: "SkyDeals Europe",
  contact_email: "ops@skydealseurope.example",
  plan: "professional",
  agreement_version: "2026-08-26",
  accepted_by_email: "legal@skydealseurope.example",
};

test("generateTenantApiKey produces a well-formed, unique key each time", () => {
  const a = generateTenantApiKey();
  const b = generateTenantApiKey();
  assert.match(a.plaintext, /^abos_tenant_[0-9a-f]{48}$/);
  assert.notEqual(a.plaintext, b.plaintext);
  assert.ok(looksLikeTenantApiKey(a.plaintext));
  assert.ok(a.prefix.startsWith("abos_tenant_"));
  assert.ok(a.prefix.length < a.plaintext.length);
});

test("looksLikeTenantApiKey rejects malformed input", () => {
  assert.equal(looksLikeTenantApiKey("not-a-key"), false);
  assert.equal(looksLikeTenantApiKey(""), false);
  assert.equal(looksLikeTenantApiKey(undefined), false);
  assert.equal(looksLikeTenantApiKey("abos_live_deadbeef"), false); // user key prefix, not tenant
});

test("hashApiKey is deterministic and collision-resistant for distinct inputs", async () => {
  const { plaintext } = generateTenantApiKey();
  const h1 = await hashApiKey(plaintext);
  const h2 = await hashApiKey(plaintext);
  assert.equal(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/);

  const other = await hashApiKey(generateTenantApiKey().plaintext);
  assert.notEqual(h1, other);
});

test("isLicenseActive requires active status and an unexpired (or absent) expiry", () => {
  const now = Date.parse("2026-06-01T00:00:00Z");
  assert.equal(isLicenseActive(null, now), false);
  assert.equal(isLicenseActive({ status: "pending" }, now), false);
  assert.equal(isLicenseActive({ status: "suspended" }, now), false);
  assert.equal(isLicenseActive({ status: "expired" }, now), false);
  assert.equal(isLicenseActive({ status: "revoked" }, now), false);
  assert.equal(isLicenseActive({ status: "active" }, now), true); // no expiry = no fixed term
  assert.equal(isLicenseActive({ status: "active", expires_at: "2026-12-31T00:00:00Z" }, now), true);
  assert.equal(isLicenseActive({ status: "active", expires_at: "2026-01-01T00:00:00Z" }, now), false);
  // Exactly at the expiry instant counts as expired (<=), not a boundary grace period.
  assert.equal(isLicenseActive({ status: "active", expires_at: "2026-06-01T00:00:00Z" }, now), false);
});

test("canTenantUseCapability checks both license activity and the capability grant", () => {
  const active = { status: "active", allowed_capabilities: ["ati_score", "search"] };
  assert.equal(canTenantUseCapability(active, "ati_score"), true);
  assert.equal(canTenantUseCapability(active, "valuation"), false);

  const suspended = { status: "suspended", allowed_capabilities: ["ati_score"] };
  assert.equal(canTenantUseCapability(suspended, "ati_score"), false, "suspended license grants nothing, regardless of capability list");

  const noCaps = { status: "active" };
  assert.equal(canTenantUseCapability(noCaps, "ati_score"), false, "missing allowed_capabilities defaults to no access, not open access");
});

test("defaultCapabilitiesForPlan returns the documented per-plan set and falls back safely", () => {
  assert.deepEqual(defaultCapabilitiesForPlan("starter"), [...PLAN_CAPABILITIES.starter]);
  assert.deepEqual(defaultCapabilitiesForPlan("professional"), [...PLAN_CAPABILITIES.professional]);
  assert.deepEqual(defaultCapabilitiesForPlan("enterprise"), [...WHITE_LABEL_CAPABILITIES]);
  assert.deepEqual(defaultCapabilitiesForPlan("not_a_real_plan"), [...PLAN_CAPABILITIES.starter], "unknown plan defaults to the least-privileged set, not enterprise");
});

test("checkRateLimit allows under the per-minute limit and denies at it", () => {
  const now = 1_000_000;
  let state = undefined;
  const limit = PLAN_RATE_LIMITS.free.rpm;
  for (let i = 0; i < limit; i++) {
    const result = checkRateLimit(state, "free", now);
    assert.equal(result.allowed, true, `request ${i + 1}/${limit} should be allowed`);
    state = result.state;
  }
  const overLimit = checkRateLimit(state, "free", now);
  assert.equal(overLimit.allowed, false);
  assert.equal(overLimit.reason, "rate_limited");
});

test("checkRateLimit resets the minute window after it elapses", () => {
  const t0 = 1_000_000;
  let state = checkRateLimit(undefined, "free", t0).state;
  const laterSameWindow = checkRateLimit(state, "free", t0 + 1000);
  assert.equal(laterSameWindow.state.minuteCount, 2);

  const nextWindow = checkRateLimit(state, "free", t0 + 61_000);
  assert.equal(nextWindow.allowed, true);
  assert.equal(nextWindow.state.minuteCount, 1, "count resets once 60s have elapsed");
});

test("checkRateLimit enforces the daily cap independently of the minute window", () => {
  const t0 = 1_000_000;
  let state = { minuteStart: t0, minuteCount: 0, dayStart: t0, dayCount: PLAN_RATE_LIMITS.free.rpd };
  // Advance past the minute window each call so only the daily cap is being tested.
  const result = checkRateLimit(state, "free", t0 + 61_000);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "daily_limit_exceeded");
});

test("checkRateLimit uses the free plan when given an unknown plan name", () => {
  const result = checkRateLimit(undefined, "not_a_real_plan", Date.now());
  assert.equal(result.limits, PLAN_RATE_LIMITS.free);
});

test("isValidTenantId enforces the slug format and rejects reserved names", () => {
  assert.equal(isValidTenantId("skydeals_europe"), true);
  assert.equal(isValidTenantId("a1b"), true);

  assert.equal(isValidTenantId("SkyDeals"), false, "uppercase rejected");
  assert.equal(isValidTenantId("1skydeals"), false, "must start with a letter");
  assert.equal(isValidTenantId("sky-deals"), false, "hyphen rejected");
  assert.equal(isValidTenantId("sky deals"), false, "space rejected");
  assert.equal(isValidTenantId("ab"), false, "too short");
  assert.equal(isValidTenantId("a".repeat(51)), false, "too long");
  assert.equal(isValidTenantId("../etc/passwd"), false, "path traversal rejected");
  assert.equal(isValidTenantId(""), false);
  assert.equal(isValidTenantId(undefined), false);

  for (const reserved of ["abos", "admin", "api", "core", "system", "www"]) {
    assert.equal(isValidTenantId(reserved), false, `${reserved} must be reserved`);
  }
});

test("validateProvisionRequest accepts a well-formed request and normalizes casing", () => {
  const result = validateProvisionRequest({
    ...validProvisionInput,
    tenant_id: "  SkyDeals_Europe  ",
    contact_email: "  OPS@SkyDealsEurope.example ",
  });
  assert.equal(result.valid, true, `unexpected errors: ${result.errors.join("; ")}`);
  assert.equal(result.normalized.tenantId, "skydeals_europe");
  assert.equal(result.normalized.contactEmail, "ops@skydealseurope.example");
  assert.deepEqual(result.errors, []);
});

test("validateProvisionRequest requires a recorded contract acceptance", () => {
  const noAgreement = validateProvisionRequest({ ...validProvisionInput, agreement_version: "" });
  assert.equal(noAgreement.valid, false);
  assert.ok(noAgreement.errors.some((e) => e.includes("agreement_version")));

  const noSigner = validateProvisionRequest({ ...validProvisionInput, accepted_by_email: "" });
  assert.equal(noSigner.valid, false);
  assert.ok(noSigner.errors.some((e) => e.includes("accepted_by_email")));
});

test("validateProvisionRequest rejects bad plans, emails and tenant ids", () => {
  const badPlan = validateProvisionRequest({ ...validProvisionInput, plan: "unlimited_free" });
  assert.equal(badPlan.valid, false);
  assert.ok(badPlan.errors.some((e) => e.includes("plan must be one of")));

  const badEmail = validateProvisionRequest({ ...validProvisionInput, contact_email: "not-an-email" });
  assert.equal(badEmail.valid, false);

  const badId = validateProvisionRequest({ ...validProvisionInput, tenant_id: "abos" });
  assert.equal(badId.valid, false);

  const empty = validateProvisionRequest({});
  assert.equal(empty.valid, false);
  assert.ok(empty.errors.length >= 5, "an empty request should report every missing field");
});

test("validateProvisionRequest never throws on hostile input", () => {
  for (const input of [null, undefined, "", 42, [], { tenant_id: { nested: true } }]) {
    const result = validateProvisionRequest(input);
    assert.equal(result.valid, false);
    assert.ok(Array.isArray(result.errors));
  }
});

test("capabilityForEndpoint maps every known endpoint to a real capability and is closed by default", () => {
  assert.equal(capabilityForEndpoint("ati.score"), "ati_score");
  assert.equal(capabilityForEndpoint("valuate"), "valuation");
  assert.equal(capabilityForEndpoint("search"), "search");

  assert.equal(capabilityForEndpoint("not.a.real.endpoint"), null);
  assert.equal(capabilityForEndpoint(""), null);
  assert.equal(capabilityForEndpoint(undefined), null);
  assert.equal(isKnownEndpoint("not.a.real.endpoint"), false);

  // Prototype keys must not leak through as "known" endpoints.
  assert.equal(isKnownEndpoint("constructor"), false);
  assert.equal(isKnownEndpoint("toString"), false);
  assert.equal(capabilityForEndpoint("constructor"), null);

  // Every mapped capability must be a real white-label capability.
  for (const endpoint of listEndpoints()) {
    const capability = capabilityForEndpoint(endpoint);
    assert.ok(
      WHITE_LABEL_CAPABILITIES.includes(capability),
      `endpoint ${endpoint} maps to unknown capability ${capability}`,
    );
  }
});

test("starter plan cannot reach professional/enterprise-only endpoints", () => {
  const starter = { status: "active", allowed_capabilities: [...PLAN_CAPABILITIES.starter] };
  assert.equal(canTenantUseCapability(starter, capabilityForEndpoint("ati.score")), true);
  assert.equal(canTenantUseCapability(starter, capabilityForEndpoint("valuate")), false);
  assert.equal(canTenantUseCapability(starter, capabilityForEndpoint("intelligence.advanced")), false);

  const enterprise = { status: "active", allowed_capabilities: [...PLAN_CAPABILITIES.enterprise] };
  assert.equal(canTenantUseCapability(enterprise, capabilityForEndpoint("intelligence.advanced")), true);
});

test("mapStripeStatusToLicenseStatus maps active/trialing to active and lapsed states to suspended", () => {
  assert.equal(mapStripeStatusToLicenseStatus("trialing"), "active");
  assert.equal(mapStripeStatusToLicenseStatus("active"), "active");
  assert.equal(mapStripeStatusToLicenseStatus("past_due"), "suspended");
  assert.equal(mapStripeStatusToLicenseStatus("unpaid"), "suspended");
  assert.equal(mapStripeStatusToLicenseStatus("incomplete_expired"), "suspended");
  assert.equal(mapStripeStatusToLicenseStatus("canceled"), "suspended");
  assert.equal(mapStripeStatusToLicenseStatus("paused"), "suspended");
  // Unmapped statuses (e.g. Stripe's transient "incomplete") must not be
  // silently coerced into either bucket — callers treat null as "don't write".
  assert.equal(mapStripeStatusToLicenseStatus("incomplete"), null);
  assert.equal(mapStripeStatusToLicenseStatus("not_a_real_status"), null);
  assert.equal(mapStripeStatusToLicenseStatus(undefined), null);
});

test("slugifyTenantId always produces a valid tenant_id", () => {
  assert.equal(slugifyTenantId("SkyDeals Europe"), "skydeals_europe");
  assert.ok(isValidTenantId(slugifyTenantId("SkyDeals Europe")));

  // Starts with a digit — must be prefixed to still start with a letter.
  assert.ok(isValidTenantId(slugifyTenantId("42 Aviation")));
  assert.match(slugifyTenantId("42 Aviation"), /^[a-z]/);

  // Too short on its own — must be padded to the 3-char minimum.
  assert.ok(isValidTenantId(slugifyTenantId("ab")));

  // Empty / garbage input must still produce something valid, never throw.
  for (const input of ["", undefined, null, "___", "!!!", "a".repeat(200)]) {
    const slug = slugifyTenantId(input);
    assert.equal(typeof slug, "string");
    assert.ok(slug.length > 0);
    assert.ok(slug.length <= 50, `slug too long: ${slug}`);
  }

  // A reserved word alone isn't rejected by slugifyTenantId itself (that's
  // isValidTenantId's job) — callers combine the two, e.g. by appending a
  // numeric suffix until isValidTenantId passes.
  assert.equal(slugifyTenantId("admin"), "admin");
  assert.equal(isValidTenantId("admin"), false);
});

test("lookup tables cannot resolve inherited Object.prototype members", () => {
  // Regression: these tables were plain frozen object literals, so a
  // caller-supplied key like "constructor" resolved to Object.prototype's
  // member (truthy), letting plan:"constructor" pass validation and then
  // crash provisioning on the capability spread.
  for (const key of ["constructor", "toString", "hasOwnProperty", "__proto__", "valueOf"]) {
    assert.equal(capabilityForEndpoint(key), null, `capabilityForEndpoint(${key})`);
    assert.equal(isKnownEndpoint(key), false, `isKnownEndpoint(${key})`);

    const result = validateProvisionRequest({ ...validProvisionInput, plan: key });
    assert.equal(result.valid, false, `plan=${key} must be rejected`);

    // Must fall back to least privilege rather than throwing.
    assert.deepEqual(defaultCapabilitiesForPlan(key), [...PLAN_CAPABILITIES.starter]);
    assert.equal(checkRateLimit(undefined, key, 1_000_000).limits, PLAN_RATE_LIMITS.free);
  }
});
