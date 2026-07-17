import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const decision = JSON.parse(await readFile(new URL("../contracts/abos-core-api-v1-decision.json", import.meta.url), "utf8"));
const openapi = await readFile(new URL("../openapi/abos-core-api-v1.yaml", import.meta.url), "utf8");

function operationRoutes(source) {
  const routes = [];
  let path = null;
  for (const line of source.split("\n")) {
    const pathMatch = line.match(/^  (\/api\/v1\/[^:]+):\s*$/);
    if (pathMatch) path = pathMatch[1];
    const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/);
    if (path && methodMatch) routes.push(`${methodMatch[1].toUpperCase()} ${path}`);
  }
  return routes;
}

test("selects explicit OpenAPI 3.1 operations as the canonical public contract", () => {
  assert.equal(decision.canonical_contract.openapi, "3.1.0");
  const expected = decision.canonical_contract.operations.map(({ method, path }) => `${method} ${path}`);
  assert.deepEqual(operationRoutes(openapi), expected);
  assert.match(openapi, /^openapi: 3\.1\.0$/m);
  assert.doesNotMatch(openapi, /\/functions\/abosCoreApi|endpoint discriminator/);
});

test("keeps the Base44 discriminator gateway out of generated SDK and MCP contracts", () => {
  assert.equal(decision.legacy_gateway.status, "compatibility_only");
  assert.equal(decision.legacy_gateway.sdk_exposure, false);
  assert.equal(decision.legacy_gateway.mcp_exposure, false);
});

test("maps only compatible legacy capabilities and defers uncontracted writes", () => {
  const mappings = Object.fromEntries(decision.compatibility_mappings.map((item) => [item.legacy, item]));
  assert.equal(mappings.search.canonical, "POST /api/v1/search");
  assert.equal(mappings.valuate.mode, "separate_during_coexistence");
  assert.equal(mappings["listings.create"].mode, "legacy_only");
  assert.equal(mappings["keys.create"].canonical, null);
});

test("forbids unsupported valuation claims and internal identifier leakage", () => {
  assert.equal(decision.invariants.valuation_without_traceable_sources, "insufficient_data");
  assert.equal(decision.invariants.source_provenance_required, true);
  assert.equal(decision.invariants.internal_ids_forbidden, true);
  assert.equal(decision.invariants.request_id_required, true);
  assert.equal(decision.invariants.complete_valuation_requires_nonempty_traceable_provenance, true);
});

test("pins header-only authentication and explicit legacy scope aliases", () => {
  assert.equal(decision.canonical_contract.authentication.api_keys_in_body_forbidden, true);
  assert.equal(decision.canonical_contract.authentication.dual_credential_policy, "reject");
  assert.equal(decision.scope_migration["listing:read"].canonical, "listings:read");
  assert.equal(decision.scope_migration["intelligence:read"].canonical, "intelligence:request");
  assert.match(openapi, /name: X-ABOS-API-Key/);
  assert.doesNotMatch(openapi, /name:\s+api_key\s*$/m);
});

test("requires public identifiers, sanitized errors, and provenance fields", () => {
  assert.match(openapi, /pattern: '\^ac_\[a-f0-9\]\{24\}\$'/);
  assert.match(openapi, /pattern: '\^lst_\[a-f0-9\]\{24\}\$'/);
  for (const field of ["request_id", "details", "documentation_url", "source_provenance", "limitations"]) {
    assert.match(openapi, new RegExp(`\\b${field}:`));
  }
});

test("keeps legacy valuation behavior separate from canonical provenance enforcement", () => {
  const valuation = decision.compatibility_mappings.find(({ legacy }) => legacy === "valuate");
  assert.equal(valuation.mode, "separate_during_coexistence");
  assert.equal(decision.invariants.legacy_behavior_must_not_change_in_task001, true);
  assert.equal(decision.invariants.valuation_without_traceable_sources, "insufficient_data");
});
