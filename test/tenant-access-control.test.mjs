import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// tenantAccessControl.ts uses a `npm:` Deno import specifier and the global
// Response/crypto Deno provides, so — like the rest of base44/functions/* —
// it can't be executed directly under `node --test`. Its actual decision
// logic lives in tenantLicense.mjs (pure, zero Deno imports, fully covered
// by tenant-license.test.mjs); this file only guards the glue code's shape:
// that it delegates to the shared pure functions and never trusts anything
// from the request except the opaque API key.
const source = await readFile(
  new URL("../base44/functions/_shared/tenantAccessControl.ts", import.meta.url),
  "utf8",
);

test("tenant access control authenticates only via the hashed key header, never a client-supplied tenant/license id", () => {
  assert.match(source, /TENANT_KEY_HEADER = 'x-abos-tenant-key'/);
  assert.match(source, /req\.headers\.get\(TENANT_KEY_HEADER\)/);
  assert.match(source, /await hashApiKey\(raw\)/);
  // tenant_id / license_id must be looked up server-side from the resolved
  // record chain (apiKey -> license -> tenant), never read off the request.
  assert.doesNotMatch(source, /req\.(json|headers\.get\('x-abos-tenant-id'|headers\.get\('x-abos-license)/);
  assert.match(source, /license\.tenant_id/);
});

test("tenant access control fails closed at every stage before granting access", () => {
  assert.match(source, /if \(!raw\) return \{ ok: false/);
  assert.match(source, /apiKey\.status !== 'active'/);
  assert.match(source, /isLicenseActive\(license\)/);
  assert.match(source, /tenant\.status !== 'active'/);
  assert.match(source, /if \(!rate\.allowed\)/);
});

test("tenant access control delegates decisions to the shared pure module instead of re-implementing them", () => {
  assert.match(source, /from '\.\/tenantLicense\.mjs'/);
  assert.match(source, /canUseCapabilityPure\(access\.license, capability\)/);
});

test("a key whose tenant disagrees with its licence's tenant is refused", () => {
  // The tenant is resolved from the LICENCE, so a key pointing at another
  // tenant's licence would otherwise operate as that tenant — reading their
  // data and spending their quota. Nothing should be able to create such a
  // pairing, so it is treated as corruption and refused rather than resolved
  // in either direction.
  assert.match(source, /apiKey\.tenant_id && apiKey\.tenant_id !== license\.tenant_id/);
  assert.match(source, /status: 403/);
  assert.match(source, /Credential is not valid for this licence/);

  // The mismatch check must run BEFORE the tenant is loaded, so a mismatched
  // key never reaches another tenant's record at all.
  const mismatchIndex = source.indexOf("apiKey.tenant_id !== license.tenant_id");
  const tenantLoadIndex = source.indexOf("entities.Tenant.filter");
  assert.ok(mismatchIndex > -1 && tenantLoadIndex > mismatchIndex,
    "the tenant must not be loaded before the key/licence tenant match is verified");
});
