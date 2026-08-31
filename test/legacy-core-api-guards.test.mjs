import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../base44/functions/abosCoreApi/entry.ts", import.meta.url), "utf8");

test("legacy Core API does not accept body API keys or return private listings", () => {
  assert.match(source, /req\.headers\.get\('x-abos-key'\)/);
  assert.doesNotMatch(source, /body\.api_key/);
  assert.match(source, /listing\.visibility !== 'public'/);
  assert.match(source, /listing\.status !== 'active'/);
  assert.doesNotMatch(source, /error: error\.message/);
});
test("computeMarketAnalytics still auths, caches and returns its original shape", async () => {
  // Its aggregation moved into _shared/marketAnalytics.mjs so the tenant
  // surface can reuse it. That refactor must not have changed what the ABOS
  // dashboard receives, nor dropped the user-auth gate that keeps this
  // whole-pool view internal.
  const source = await readFile(
    new URL("../base44/functions/computeMarketAnalytics/entry.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /await base44\.auth\.me\(\)/);
  assert.match(source, /if \(!user\) return Response\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\)/);
  assert.match(source, /from '\.\.\/_shared\/marketAnalytics\.mjs'/);
  assert.match(source, /computeMarketAnalytics\(listings, new Date\(\)\)/);
  // Cache and response shape unchanged.
  assert.match(source, /CACHE\.set\('global', \{ at: Date\.now\(\), data \}\)/);
  assert.match(source, /Response\.json\(\{ \.\.\.cached\.data, cached: true \}\)/);
  assert.match(source, /Response\.json\(\{ \.\.\.data, cached: false \}\)/);
});
