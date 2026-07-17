import assert from "node:assert/strict";
import test from "node:test";
import { FixtureAircraftSearchAdapter, searchFixtures } from "../dist/fixtures.js";
import { SearchPresentationError } from "../dist/adapter.js";
import { buildStructuredQuery, createSearchRequest, mergeSearchResponses, stateFromError, stateFromResponse } from "../dist/search-model.js";

test("structured controls compose query instead of inventing request fields", () => {
  const query = buildStructuredQuery({ manufacturer: "Cessna", model: "Citation Latitude", maximumPrice: "8M", region: "Europe" });
  assert.equal(query, "Cessna Citation Latitude under 8M in Europe");
  assert.deepEqual(createSearchRequest(query), { query, page_size: 20, cursor: null });
});

test("request validation is deterministic", () => {
  assert.throws(() => createSearchRequest("   "), /Enter an aircraft/);
  assert.throws(() => createSearchRequest("x".repeat(501)), /500/);
});

test("responses map to success, empty and partial states", () => {
  assert.equal(stateFromResponse(searchFixtures.success).kind, "success");
  assert.equal(stateFromResponse(searchFixtures.empty).kind, "empty");
  assert.equal(stateFromResponse(searchFixtures.partial).kind, "partial");
});

test("presentation failure categories remain client-side state", () => {
  const request = createSearchRequest("Citation");
  const state = stateFromError(new SearchPresentationError("rate_limited", "Fixture wait.", 60), request);
  assert.deepEqual(state, { kind: "failure", failure: "rate_limited", message: "Fixture wait.", retryAfterSeconds: 60, request });
});

test("fixture adapter supports all required exceptional UI states", async () => {
  for (const scenario of ["unauthorized", "forbidden", "rate_limited", "offline", "recoverable", "fatal"]) {
    const adapter = new FixtureAircraftSearchAdapter(scenario);
    await assert.rejects(adapter.search({ query: "Citation", page_size: 20, cursor: null }), (error) => error.kind === scenario);
  }
});

test("fixture adapter keeps query and intent terms semantically aligned", async () => {
  const response = await new FixtureAircraftSearchAdapter("success").search(createSearchRequest("Citation Latitude in Europe"));
  assert.equal(response.query, "Citation Latitude in Europe");
  assert.deepEqual(response.intent.constraints.terms, ["citation", "latitude", "in", "europe"]);
});

test("page append merge preserves existing results", () => {
  const next = structuredClone(searchFixtures.partial);
  next.page = { page_size: 20, next_cursor: null, has_more: false };
  const merged = mergeSearchResponses(searchFixtures.success, next);
  assert.equal(merged.results.length, searchFixtures.success.results.length + next.results.length);
  assert.equal(merged.results[0].listing_id, searchFixtures.success.results[0].listing_id);
  assert.equal(merged.results.at(-1).listing_id, next.results[0].listing_id);
});
