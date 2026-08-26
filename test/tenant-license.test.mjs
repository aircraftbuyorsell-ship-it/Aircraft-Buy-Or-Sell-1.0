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
  WHITE_LABEL_CAPABILITIES,
  PLAN_CAPABILITIES,
  PLAN_RATE_LIMITS,
} from "../base44/functions/_shared/tenantLicense.mjs";

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
