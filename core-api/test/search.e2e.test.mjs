import test from "node:test";
import assert from "node:assert/strict";
import { createEnvAuthenticator, createSearchHandler, InMemoryListingRepository } from "../src/search.mjs";

const rows = [
  {
    id: "internal-base44-id-must-never-leak",
    owner: "internal-owner-id",
    public_listing_id: "lst_0123456789abcdef01234567",
    public_aircraft_id: "ac_0123456789abcdef01234567",
    make: "Cessna",
    model: "Citation Latitude",
    year: 2019,
    asking_price: 7_800_000,
    currency: "USD",
    status: "active",
    visibility: "public",
    location_region: "EUROPE",
    location_country: "DE",
    ati_score: 94,
    source: "fixture-authorized-listings",
    observed_at: "2026-07-17T00:00:00Z",
  },
  { public_listing_id: "lst_1123456789abcdef01234567", public_aircraft_id: "ac_1123456789abcdef01234567", make: "Cessna", model: "Citation Latitude", asking_price: 8_500_000, currency: "USD", status: "active", visibility: "public", location_region: "EUROPE" },
  { public_listing_id: "lst_2123456789abcdef01234567", public_aircraft_id: "ac_2123456789abcdef01234567", make: "Cessna", model: "Citation Latitude", asking_price: 7_000_000, currency: "USD", status: "active", visibility: "private", location_region: "EUROPE" },
];

const authorized = async () => ({ type: "api_key", scopes: ["search:read"] });
const handler = createSearchHandler({ listingRepository: new InMemoryListingRepository(rows), authenticate: authorized });

test("chat-first query returns only authorized matching public DTOs", async () => {
  const response = await handler(new Request("https://api.example.test/api/v1/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": "req_e2e" },
    body: JSON.stringify({ query: "Citation Latitude under 8M in Europe" }),
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "req_e2e");
  const body = await response.json();
  assert.equal(body.results.length, 1);
  assert.deepEqual(body.intent, { intent: "BUY", interpretation_status: "deterministic", constraints: { terms: ["citation", "latitude"] } });
  assert.equal(body.results[0].listing_id, "lst_0123456789abcdef01234567");
  assert.equal(body.results[0].aircraft.aircraft_id, "ac_0123456789abcdef01234567");
  assert.equal(body.results[0].asking_price.value, 7_800_000);
  assert.equal(body.results[0].source_provenance[0].retrieval_method, "authorized_repository");
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /internal-base44-id|internal-owner-id/);
});

test("rejects body credentials before authentication", async () => {
  const response = await handler(new Request("https://api.example.test/api/v1/search", { method: "POST", body: JSON.stringify({ query: "Citation", api_key: "secret" }) }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "CREDENTIAL_IN_BODY_FORBIDDEN");
});

test("enforces search scope", async () => {
  const scoped = createSearchHandler({ listingRepository: new InMemoryListingRepository(rows), authenticate: async () => ({ scopes: [] }) });
  const response = await scoped(new Request("https://api.example.test/api/v1/search", { method: "POST", body: JSON.stringify({ query: "Citation" }) }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "INSUFFICIENT_SCOPE");
});

test("environment authenticator rejects dual credentials and accepts configured key", async () => {
  const key = "test-key";
  const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const authenticate = createEnvAuthenticator({ ABOS_API_KEY_SHA256: digest, ABOS_API_KEY_SCOPES: "search:read" });
  await assert.rejects(() => authenticate(new Request("https://api.example.test", { headers: { authorization: `Bearer ${key}`, "x-abos-api-key": key } })), (error) => error.code === "AMBIGUOUS_CREDENTIALS");
  const principal = await authenticate(new Request("https://api.example.test", { headers: { "x-abos-api-key": key } }));
  assert.deepEqual(principal.scopes, ["search:read"]);
});
