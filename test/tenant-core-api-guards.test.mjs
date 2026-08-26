import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Deno-runtime functions can't execute under `node --test` (npm: specifiers,
// Deno.serve), so these are source guards in the same style as
// legacy-core-api-guards.test.mjs. The decision logic they depend on is
// separately covered by executable tests in tenant-license.test.mjs.
const tenantApi = await readFile(
  new URL("../base44/functions/tenantCoreApi/entry.ts", import.meta.url),
  "utf8",
);
const provision = await readFile(
  new URL("../base44/functions/tenantProvision/entry.ts", import.meta.url),
  "utf8",
);

test("tenant Core API authenticates before reading any data and never returns private listings", () => {
  // Auth must be resolved before the endpoint dispatch, not alongside it.
  const authIndex = tenantApi.indexOf("await resolveTenantAccess(req)");
  const handlerIndex = tenantApi.indexOf("handleEndpoint(endpoint");
  assert.ok(authIndex > -1, "must call resolveTenantAccess");
  assert.ok(handlerIndex > authIndex, "endpoint handling must come after authentication");

  // Same public-visibility guard the direct API enforces.
  assert.match(tenantApi, /listing\.visibility !== 'public'/);
  assert.match(tenantApi, /listing\.status !== 'active'/);
  assert.match(tenantApi, /\{ status: 'active', visibility: 'public' \}/);

  // Internal error detail must never reach the caller.
  assert.doesNotMatch(tenantApi, /message: \(error as any\)\?\.message/);
});

test("tenant Core API is closed by default for unknown endpoints", () => {
  assert.match(tenantApi, /isKnownEndpoint\(endpoint\)/);
  assert.match(tenantApi, /unknown_endpoint/);
  assert.match(tenantApi, /requireTenantCapability\(access, capability/);
});

test("tenant Core API never leaks credentials or cross-tenant fields in whoami", () => {
  // whoami echoes the resolved tenant's own record only. Key hashes and
  // billing identifiers must never appear in a tenant-facing response.
  assert.doesNotMatch(tenantApi, /key_hash/);
  assert.doesNotMatch(tenantApi, /stripe_customer_id/);
  assert.doesNotMatch(tenantApi, /stripe_subscription_id/);
  // Tenant identity comes from the resolved access object, never from the body.
  assert.doesNotMatch(tenantApi, /body\.tenant_id/);
  assert.match(tenantApi, /access\.tenant\.tenant_id/);
});

test("tenant provisioning is admin-only and cannot mint capabilities beyond the plan", () => {
  assert.match(provision, /isAdmin\(user\)/);
  assert.match(provision, /admin_required/);
  // Requested capabilities are filtered against the plan's set, never unioned.
  assert.match(provision, /requested\.filter\(\(c: string\) => planCapabilities\.includes\(c\)\)/);
  assert.doesNotMatch(provision, /\.\.\.planCapabilities,\s*\.\.\.requested/);
});

test("tenant provisioning refuses to create a license without a recorded contract acceptance", () => {
  // Validation (which requires agreement_version + accepted_by_email) must run
  // before any entity is created.
  const validateIndex = provision.indexOf("validateProvisionRequest(body)");
  const createIndex = provision.indexOf("entities.Tenant.create");
  assert.ok(validateIndex > -1, "must validate the provisioning request");
  assert.ok(createIndex > validateIndex, "no entity may be created before validation passes");

  // Acceptance is written before the license, so a partial failure still
  // leaves a truthful record of what was agreed.
  const acceptanceIndex = provision.indexOf("entities.ContractAcceptance.create");
  const licenseIndex = provision.indexOf("entities.License.create");
  assert.ok(acceptanceIndex > -1 && licenseIndex > acceptanceIndex);
});

test("tenant provisioning fails closed on tenant_id collision", () => {
  assert.match(provision, /tenant_exists/);
  assert.match(provision, /existing\.length > 0/);
});

test("tenant API key plaintext is returned once and only its hash is stored", () => {
  assert.match(provision, /const keyHash = await hashApiKey\(plaintext\)/);
  assert.match(provision, /key_hash: keyHash/);
  // The stored record must not carry the plaintext.
  assert.doesNotMatch(provision, /key:\s*plaintext,\s*\n\s*status: 'active'/);
  assert.match(provision, /shown only once/);
});

test("valuate uses asServiceRole for the internal engine invoke", () => {
  // This surface authenticates with x-abos-tenant-key, which Base44 knows
  // nothing about, so the plain client carries no Base44 credentials and an
  // internal invoke through it cannot resolve the app. abosCoreApi shipped
  // this bug once already — valuate was the only broken endpoint on that
  // whole surface — so it is guarded here rather than rediscovered.
  assert.match(tenantApi, /base44\.asServiceRole\.functions\.invoke\('omvmV5Score'/);
  assert.doesNotMatch(
    tenantApi,
    /base44\.functions\.invoke\('omvmV5Score'/,
    "must not invoke the engine through the plain client",
  );
});

test("valuate and ati.score never invent a number when ABOS has none", () => {
  // A refused valuation and an unscored aircraft must be distinguishable from
  // a genuinely low one — collapsing them would misrepresent an assessment to
  // a buyer.
  assert.match(tenantApi, /mapValuation\(v5, aircraft\)/);
  assert.match(tenantApi, /scored: score !== null/);
  assert.match(tenantApi, /has not been scored by ABOS yet/);
  assert.doesNotMatch(tenantApi, /ati_score: score \|\| 0/);
  assert.doesNotMatch(tenantApi, /ati_score: listing\.ati_score \|\| 0/);
});

test("ati.score only reads public, active listings", () => {
  // Same visibility guard as every other read on this surface.
  assert.match(tenantApi, /\{ registration, status: 'active', visibility: 'public' \}/);
});

test("both API surfaces shape valuations through the shared mapper", async () => {
  // If either stops using it, the documented v1 contract can silently diverge
  // between white-label and direct API customers.
  const coreApi = await readFile(
    new URL("../base44/functions/abosCoreApi/entry.ts", import.meta.url),
    "utf8",
  );
  assert.match(coreApi, /mapValuation\(/);
  assert.match(coreApi, /from '\.\.\/_shared\/valuationMapper\.mjs'/);
  assert.match(tenantApi, /from '\.\.\/_shared\/valuationMapper\.mjs'/);
});

test("ati.report uses asServiceRole for the report engine invoke", () => {
  // Same failure mode valuate hit: this surface authenticates with
  // x-abos-tenant-key, which Base44 knows nothing about, so the plain client
  // carries no Base44 credentials and an internal invoke through it cannot
  // resolve the app.
  const invokeIndex = tenantApi.indexOf("invoke('atiReportScoreInternal'");
  assert.ok(invokeIndex > -1, "ati.report must invoke the report engine");
  const before = tenantApi.slice(Math.max(0, invokeIndex - 120), invokeIndex);
  assert.match(before, /asServiceRole\.functions\./);
});

test("ati.report refuses to pass an engine failure off as a report", () => {
  // atiReportScoreInternal returns { error } instead of throwing, so a
  // try/catch alone would map a failure into a report-shaped object with a
  // null score — indistinguishable to a tenant from a real assessment.
  assert.match(tenantApi, /hasUsableReport\(raw\)/);
  assert.match(tenantApi, /report_generation_failed/);
  assert.match(tenantApi, /report_engine_unavailable/);
});

test("the pro report tier is granted only by the pro endpoint", () => {
  // The tier string must be derived from the endpoint (whose capability is
  // gated above), never from anything in the request body.
  assert.match(tenantApi, /endpoint === 'ati\.report\.pro' \? 'pro' : 'basic'/);
  assert.doesNotMatch(tenantApi, /params\.tier/);
});

test("report responses are shaped by the shared mapper, not built inline", () => {
  assert.match(tenantApi, /from '\.\.\/_shared\/reportMapper\.mjs'/);
  assert.match(tenantApi, /mapReport\(raw,/);
});

test("the 501 fallback no longer claims to cover implemented endpoints", () => {
  // A stale comment here is how an implemented endpoint gets re-broken: the
  // next person reads it and assumes the fallback still owns those names.
  const start = tenantApi.indexOf("// Remaining mapped endpoints");
  assert.ok(start > -1, "the 501 fallback should still explain which endpoints it covers");
  const comment = tenantApi.slice(start, tenantApi.indexOf("not_implemented", start));
  assert.doesNotMatch(comment, /ati\.report/, "ati.report is served, not deferred");
  assert.match(comment, /passport\.get/, "the endpoints still deferred should stay listed");
});
