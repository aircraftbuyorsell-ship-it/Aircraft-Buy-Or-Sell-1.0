import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../base44/functions/stripeCreateCheckout/entry.ts", import.meta.url), "utf8");
const webhook = await readFile(new URL("../base44/functions/stripeWebhook/entry.ts", import.meta.url), "utf8");

test("checkout derives entitlements from an allowlisted price and validates return URLs", () => {
  assert.match(checkout, /PRICE_CONFIG/);
  assert.match(checkout, /ABOS_CHECKOUT_RETURN_ORIGINS/);
  assert.doesNotMatch(checkout, /tokens:\s+String\(/);
  assert.doesNotMatch(checkout, /tier:\s+tier/);
});

test("webhook resolves grants from verified Stripe line items", () => {
  assert.match(webhook, /line_items\.data/);
  assert.match(webhook, /PRICE_TOKEN_MAP\[priceId\]/);
  assert.doesNotMatch(webhook, /parseInt\(meta\.tokens/);
  assert.doesNotMatch(webhook, /const packName\s+=\s+meta\.pack_name/);
});