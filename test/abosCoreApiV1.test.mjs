import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../base44/functions/abosCoreApiV1/core.mjs";

const listing = {
  listing_id: "lst_0123456789abcdef01234567",
  aircraft: { aircraft_id: "ac_0123456789abcdef01234567", identity: { registration: "N123AB", serial_number: null, registry_country: null }, manufacturer: "Cessna", model: "172", year: 2000, total_time_hours: null, engine_hours: null },
  asking_price: { value: 100000, currency: "USD" },
  location: null,
  status: "active",
  intelligence: { ati_score: null, observed_market_value: null, deal_score: null, deal_label: null, generated_at: null, engine_version: null, limitations: [] },
  source_provenance: [],
  created_at: null,
  updated_at: null,
};

function router(scopes = ["search:read", "listings:read", "intelligence:request"]) {
  return createRouter({
    authenticate: async () => ({ type: "api_key", scopes }),
    listingRepository: { search: async () => ({ items: [listing], nextCursor: null }), getByPublicId: async () => null },
    aircraftRepository: { getByPublicId: async () => null },
    intentInterpreter: { interpret: async () => ({ intent: "search", interpretation_status: "deterministic", constraints: { terms: [] } }) },
    valuationProvider: { valuate: async () => ({ status: "insufficient_data", estimated_value: null, range: { minimum: null, maximum: null, currency: "USD" }, confidence: null, data_completeness: 0, source_provenance: [], limitations: ["No traceable source."] }) },
    auditSink: { record: async () => {} },
  });
}

test("search returns only public DTOs", async () => {
  const response = await router()(new Request("https://example.test/api/v1/search", { method: "POST", body: JSON.stringify({ query: "Cessna 172" }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.results[0].listing_id, listing.listing_id);
  assert.equal("id" in body.results[0], false);
  assert.equal(response.headers.has("x-request-id"), true);
});

test("listing not found uses sanitized error contract", async () => {
  const response = await router()(new Request("https://example.test/api/v1/listings/lst_0123456789abcdef01234567"));
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "details", "documentation_url", "message", "request_id"]);
  assert.equal(body.error.code, "LISTING_NOT_FOUND");
});

test("scope enforcement rejects unauthorized search", async () => {
  const response = await router([])(new Request("https://example.test/api/v1/search", { method: "POST", body: JSON.stringify({ query: "Cessna" }) }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "INSUFFICIENT_SCOPE");
});

test("valuation is explicitly insufficient without traceable data", async () => {
  const response = await router()(new Request("https://example.test/api/v1/intelligence/valuate", { method: "POST", body: JSON.stringify({ manufacturer: "Pilatus", model: "PC-12" }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "insufficient_data");
  assert.equal(body.estimated_value, null);
  assert.equal(body.source_provenance.length, 0);
});