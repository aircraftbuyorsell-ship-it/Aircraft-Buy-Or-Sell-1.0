import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Source guards, in the same style as the other Deno-runtime function tests.
const portal = await readFile(
  new URL("../base44/functions/tenantPortal/entry.ts", import.meta.url),
  "utf8",
);
const page = await readFile(
  new URL("../src/pages/PartnerPortal.jsx", import.meta.url),
  "utf8",
);

test("portal derives the accessible tenant set from the session, never from the request", () => {
  // The authorized set must come from the verified session email.
  assert.match(portal, /const email = String\(user\.email \|\| ''\)\.toLowerCase\(\)/);
  assert.match(portal, /Tenant\.filter\(\{ contact_email: email \}/);

  // A requested tenant_id may only select from that set — never be used as a
  // direct lookup key, which would be an IDOR letting any partner read another
  // partner's licence and keys by guessing a slug.
  assert.match(portal, /tenants\.find\(\(t: any\) => t\.tenant_id === requestedId\)/);
  assert.doesNotMatch(
    portal,
    /Tenant\.filter\(\{ tenant_id: (requestedId|body\.tenant_id)/,
    "must not look up a tenant directly from request input",
  );
});

test("portal authenticates before reading anything", () => {
  const authIndex = portal.indexOf("base44.auth.me()");
  const readIndex = portal.indexOf("entities.Tenant.filter");
  assert.ok(authIndex > -1 && readIndex > authIndex, "must resolve the user before querying tenants");
  assert.match(portal, /if \(!user\) return fail\(401/);
});

test("portal never exposes key hashes or billing identifiers to the client", () => {
  // publicKey/publicLicense are the only shapes returned; neither may carry
  // a hash or a Stripe id.
  const publicKeyFn = portal.slice(portal.indexOf("function publicKey"), portal.indexOf("Deno.serve"));
  assert.doesNotMatch(publicKeyFn, /key_hash/);

  const publicLicenseFn = portal.slice(portal.indexOf("function publicLicense"), portal.indexOf("function publicKey"));
  assert.doesNotMatch(publicLicenseFn, /stripe_customer_id/);
  assert.doesNotMatch(publicLicenseFn, /stripe_subscription_id/);
});

test("key revocation is scoped to the caller's own tenant", () => {
  // Keys are fetched for the resolved tenant and then matched by id, so a key
  // id belonging to another tenant is simply not found.
  assert.match(portal, /TenantApiKey\.filter\(\{ tenant_id: tenant\.tenant_id \}/);
  assert.match(portal, /keys\.find\(\(k: any\) => k\.id === body\.key_id\)/);
  assert.doesNotMatch(
    portal,
    /TenantApiKey\.get\(body\.key_id\)/,
    "must not fetch a key directly by a client-supplied id",
  );
});

test("rotation does not implicitly revoke the previous key", () => {
  // Revoking on rotate would break a partner's live integration the instant
  // they clicked the button; overlap has to be possible.
  assert.match(portal, /if \(body\.revoke_key_id\)/);
  assert.match(portal, /overlap/i);
});

test("a new key is issued only against an active licence", () => {
  assert.match(portal, /license\.status !== 'active'/);
  assert.match(portal, /license_inactive/);
});

test("the portal page tells the partner the key is shown only once", () => {
  assert.match(page, /only time it will be shown/i);
  assert.match(page, /ABOS_TENANT_API_KEY/);
  assert.match(page, /never in client-side code/i);
});

test("the portal page treats 'no tenant' as a normal state, not an error", () => {
  // Most ABOS users are not white-label partners, so this must explain rather
  // than look like a failure.
  assert.match(page, /No white-label organization on this account/);
  assert.match(page, /signed in with the email address/i);
});

test("the portal page never sends a tenant id the server did not give it", () => {
  // tenant_id is only ever echoed back from loaded data.
  assert.match(page, /tenant_id: data\?\.tenant\?\.tenant_id/);
  assert.doesNotMatch(page, /tenant_id: ['"`]/, "must not hardcode or accept a free-text tenant id");
});
