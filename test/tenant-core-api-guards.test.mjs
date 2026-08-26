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
