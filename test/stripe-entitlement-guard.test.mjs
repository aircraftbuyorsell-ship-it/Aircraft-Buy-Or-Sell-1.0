import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../base44/functions/stripeCreateCheckout/entry.ts", import.meta.url), "utf8");
const webhook = await readFile(new URL("../base44/functions/stripeWebhook/entry.ts", import.meta.url), "utf8");

test("checkout derives entitlements and metadata entirely from the allowlisted price, never from client input", () => {
  assert.match(checkout, /PRICE_CONFIG/);
  assert.match(checkout, /ABOS_CHECKOUT_RETURN_ORIGINS/);
  // The request body must not be destructured into anything that ends up in
  // checkout metadata unvalidated (regression: `priceUsd` from req.json() used
  // to flow straight into metadata.price_usd — dead data nothing consumed, but
  // client-controlled all the same).
  assert.doesNotMatch(checkout, /priceUsd/);
  assert.doesNotMatch(checkout, /tier:\s+tier/);
  // price_usd in metadata (if present) must be sourced from configuredPrice, not a bare variable.
  assert.doesNotMatch(checkout, /price_usd:\s+String\((?!configuredPrice)/);
});

test("webhook resolves grants from verified Stripe line items", () => {
  assert.match(webhook, /lineItems\??\.data/);
  assert.match(webhook, /PRICE_TOKEN_MAP\[priceId\]/);
  assert.doesNotMatch(webhook, /parseInt\(meta\.tokens/);
  // packName was dead code (extracted from metadata, never read) — must stay removed.
  assert.doesNotMatch(webhook, /packName/);
});