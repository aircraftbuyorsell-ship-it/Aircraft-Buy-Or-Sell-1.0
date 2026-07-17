import test from "node:test";
import assert from "node:assert/strict";
import { SupabaseListingRepository } from "../src/supabase-repository.mjs";

test("uses the RLS-enforced public read endpoint and deterministic filters", async () => {
  let observed;
  const repository = new SupabaseListingRepository({
    url: "https://example.supabase.co",
    publishableKey: "publishable-test-key",
    fetchImpl: async (url, init) => {
      observed = { url, init };
      return Response.json([{ make: "Cessna", model: "Citation Latitude" }]);
    },
  });
  const result = await repository.search({ constraints: { terms: ["citation", "latitude"], budget_max: 8_000_000, region: "EUROPE" }, limit: 20, cursor: null });
  assert.equal(result.items.length, 1);
  assert.match(observed.url, /status=eq\.active/);
  assert.match(observed.url, /visibility=eq\.public/);
  assert.match(observed.url, /asking_price=lte\.8000000/);
  assert.match(observed.url, /location_region=eq\.EUROPE/);
  assert.equal(observed.init.headers.apikey, "publishable-test-key");
});
