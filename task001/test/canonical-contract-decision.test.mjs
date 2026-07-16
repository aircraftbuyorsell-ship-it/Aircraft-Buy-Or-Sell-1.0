import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const decision = JSON.parse(await readFile(new URL("../contracts/abos-core-api-v1-decision.json", import.meta.url), "utf8"));

test("selects explicit OpenAPI 3.1 operations as the canonical public contract", () => {
  assert.equal(decision.canonical_contract.openapi, "3.1.0");
  assert.deepEqual(
    decision.canonical_contract.operations.map(({ method, path }) => `${method} ${path}`),
    [
      "POST /api/v1/search",
      "GET /api/v1/aircraft/{aircraft_id}",
      "GET /api/v1/listings/{listing_id}",
      "POST /api/v1/intelligence/valuate"
    ]
  );
});

test("keeps the Base44 discriminator gateway out of generated SDK and MCP contracts", () => {
  assert.equal(decision.legacy_gateway.status, "compatibility_only");
  assert.equal(decision.legacy_gateway.sdk_exposure, false);
  assert.equal(decision.legacy_gateway.mcp_exposure, false);
});

test("maps only compatible legacy capabilities and defers uncontracted writes", () => {
  const mappings = Object.fromEntries(decision.compatibility_mappings.map((item) => [item.legacy, item]));
  assert.equal(mappings.search.canonical, "POST /api/v1/search");
  assert.equal(mappings.valuate.mode, "guarded_adapt");
  assert.equal(mappings["listings.create"].mode, "legacy_only");
  assert.equal(mappings["keys.create"].canonical, null);
});

test("forbids unsupported valuation claims and internal identifier leakage", () => {
  assert.equal(decision.invariants.valuation_without_traceable_sources, "insufficient_data");
  assert.equal(decision.invariants.source_provenance_required, true);
  assert.equal(decision.invariants.internal_ids_forbidden, true);
  assert.equal(decision.invariants.request_id_required, true);
});
