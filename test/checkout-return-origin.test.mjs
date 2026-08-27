import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Extracts the real allowedReturnOrigin() out of the deployed function source
// and evaluates it against a stubbed Deno.env, so these assertions exercise the
// shipped logic rather than a copy of it.
const source = await readFile(
  new URL("../base44/functions/stripeCreateCheckout/entry.ts", import.meta.url),
  "utf8",
);

function loadAllowedReturnOrigin(envValue) {
  const defaults = source.match(/const DEFAULT_RETURN_ORIGINS = \[[\s\S]*?\];/);
  const suffixes = source.match(/const DEFAULT_RETURN_ORIGIN_SUFFIXES = \[[\s\S]*?\];/);
  const fn = source.match(/function allowedReturnOrigin\(returnUrl: string\): boolean \{[\s\S]*?\n\}/);
  assert.ok(defaults, "DEFAULT_RETURN_ORIGINS must be present");
  assert.ok(suffixes, "DEFAULT_RETURN_ORIGIN_SUFFIXES must be present");
  assert.ok(fn, "allowedReturnOrigin must be present");

  const js = `${defaults[0]}\n${suffixes[0]}\n${fn[0]}\nreturn allowedReturnOrigin;`
    .replace(/: string\): boolean/, ")");

  return new Function("Deno", js)({
    env: { get: (key) => (key === "ABOS_CHECKOUT_RETURN_ORIGINS" ? envValue : undefined) },
  });
}

test("an unset allowlist still permits the real ABOS origins (regression: every checkout 400'd)", () => {
  const allowed = loadAllowedReturnOrigin(undefined);
  assert.equal(allowed("https://aircraftbuyorsell.com/partner-portal?checkout=success"), true);
  assert.equal(allowed("https://www.aircraftbuyorsell.com/partner-portal"), true);
  assert.equal(allowed("https://abos-marketspace.com/partner-portal"), true);
});

test("an unset allowlist permits Base44-hosted builds of the app", () => {
  const allowed = loadAllowedReturnOrigin("");
  assert.equal(allowed("https://aircraft-buy-or-sell.base44.app/partner-portal"), true);
  assert.equal(allowed("https://base44.app/partner-portal"), true);
});

test("an unset allowlist permits this account's Cloudflare Workers deploys", () => {
  const allowed = loadAllowedReturnOrigin("");
  // Production worker, per-branch preview, and per-commit preview.
  assert.equal(allowed("https://aircraft-buy-or-sell-1-0.aircraftbuyorsell.workers.dev/partner-portal"), true);
  assert.equal(
    allowed("https://claude-fix-stripe-payments-frontend-aircraft-buy-or-sell-1-0.aircraftbuyorsell.workers.dev/partner-portal"),
    true,
  );
  assert.equal(allowed("https://1e81e783-aircraft-buy-or-sell-1-0.aircraftbuyorsell.workers.dev/x"), true);
});

test("an unset allowlist still rejects foreign origins and non-TLS targets", () => {
  const allowed = loadAllowedReturnOrigin(undefined);
  assert.equal(allowed("https://evil.example.com/steal"), false);
  assert.equal(allowed("https://aircraftbuyorsell.com.evil.example/steal"), false);
  assert.equal(allowed("https://notbase44.app/steal"), false);
  assert.equal(allowed("http://aircraftbuyorsell.com/partner-portal"), false);
  assert.equal(allowed("javascript:alert(1)"), false);
  assert.equal(allowed("not-a-url"), false);
});

test("suffix matching cannot be defeated by prefixing another account's namespace", () => {
  const allowed = loadAllowedReturnOrigin(undefined);
  // Another Cloudflare account's subdomain, and a lookalike that only shares a
  // trailing substring — neither may match the account-scoped suffix.
  assert.equal(allowed("https://evil.workers.dev/steal"), false);
  assert.equal(allowed("https://evilaircraftbuyorsell.workers.dev/steal"), false);
  assert.equal(allowed("https://aircraftbuyorsell.workers.dev.evil.example/steal"), false);
});

test("a configured allowlist stays authoritative and disables the fallbacks", () => {
  const allowed = loadAllowedReturnOrigin("https://staging.aircraftbuyorsell.com");
  assert.equal(allowed("https://staging.aircraftbuyorsell.com/partner-portal"), true);
  // Configured list wins outright: defaults and the base44.app fallback go away.
  assert.equal(allowed("https://aircraftbuyorsell.com/partner-portal"), false);
  assert.equal(allowed("https://aircraft-buy-or-sell.base44.app/partner-portal"), false);
});
