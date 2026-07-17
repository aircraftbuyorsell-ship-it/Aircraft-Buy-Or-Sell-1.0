import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import SwaggerParser from "@apidevtools/swagger-parser";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const decisionUrl = new URL("../contracts/abos-core-api-v1-decision.json", import.meta.url);
const ledgerUrl = new URL("../contracts/operation-reconciliation.json", import.meta.url);
const openapiUrl = new URL("../openapi/abos-core-api-v1.yaml", import.meta.url);
const decision = JSON.parse(await readFile(decisionUrl, "utf8"));
const ledger = JSON.parse(await readFile(ledgerUrl, "utf8"));
const openapiText = await readFile(openapiUrl, "utf8");
const parsed = YAML.parse(openapiText);
const dereferenced = await SwaggerParser.dereference(openapiUrl.pathname);

function operationRoutes(document) {
  return Object.entries(document.paths).flatMap(([path, item]) =>
    ["get", "post", "put", "patch", "delete"]
      .filter((method) => item[method])
      .map((method) => `${method.toUpperCase()} ${path}`)
  );
}

function schemaValidator(schema) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

test("parses and structurally validates the pinned OpenAPI 3.1 document", async () => {
  assert.equal(parsed.openapi, "3.1.0");
  const validated = await SwaggerParser.validate(openapiUrl.pathname);
  assert.equal(validated.openapi, "3.1.0");
});

test("exposes exactly the four approved canonical operations", () => {
  const expected = decision.canonical_contract.operations.map(({ method, path }) => `${method} ${path}`);
  assert.deepEqual(operationRoutes(parsed), expected);
  assert.equal(new Set(decision.canonical_contract.operations.map(({ operation_id }) => operation_id)).size, 4);
  assert.equal(parsed.paths["/functions/abosCoreApi"], undefined);
});

test("keeps the Base44 gateway out of SDK and MCP contracts", () => {
  assert.equal(decision.legacy_gateway.status, "compatibility_only");
  assert.equal(decision.legacy_gateway.sdk_exposure, false);
  assert.equal(decision.legacy_gateway.mcp_exposure, false);
});

test("executable ledger covers all legacy and canonical operations without disposition drift", () => {
  assert.deepEqual(ledger.legacy_operations.map(({ operation }) => operation), decision.legacy_gateway.operations);
  assert.equal(ledger.legacy_operations.length, 9);
  assert.equal(ledger.canonical_operations.length, 4);
  assert.deepEqual(
    ledger.canonical_operations.map(({ operation }) => operation),
    decision.canonical_contract.operations.map(({ method, path }) => `${method} ${path}`)
  );
  const modes = Object.fromEntries(decision.compatibility_mappings.map(({ legacy, mode }) => [legacy, mode]));
  for (const entry of ledger.legacy_operations) assert.equal(entry.disposition, modes[entry.operation] ?? "legacy_only");
});

test("documents header-only authentication, dual-credential rejection, and scope migration", () => {
  assert.equal(parsed["x-abos-authentication-policy"]["api-keys-in-request-body"], "forbidden");
  assert.equal(parsed["x-abos-authentication-policy"]["dual-credential-request"], "reject");
  assert.equal(parsed["x-abos-authentication-policy"]["credential-precedence"], "none");
  assert.equal(parsed.components.securitySchemes.ApiKeyAuth.name, "X-ABOS-API-Key");
  assert.deepEqual(parsed["x-abos-scope-migration"], {
    "listing:read": { canonical: "listings:read", "legacy-alias-only": true },
    "intelligence:read": { canonical: "intelligence:request", "legacy-alias-only": true },
    "search:read": { canonical: "search:read", "legacy-alias-only": false },
    "listing:write": { canonical: null, "legacy-alias-only": true }
  });
});

test("complete valuation requires value, confidence, engine version, and traceable provenance", () => {
  const validate = schemaValidator(dereferenced.components.schemas.ValuationResult);
  const base = {
    valuation_id: "val_test",
    status: "complete",
    estimated_value: { value: 100000, currency: "USD" },
    range: { minimum: 90000, maximum: 110000, currency: "USD" },
    confidence: 0.8,
    data_completeness: 0.7,
    generated_at: "2026-07-17T00:00:00Z",
    engine_version: "omvm-test",
    source_provenance: [{ source: "test", source_record_id: "external-1", observed_at: "2026-07-17T00:00:00Z", retrieval_method: "fixture" }],
    limitations: []
  };
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...base, source_provenance: [] }), false);
  assert.equal(validate({ ...base, estimated_value: null }), false);
  assert.equal(validate({ ...base, confidence: null }), false);
  assert.equal(validate({ ...base, engine_version: null }), false);
});

test("insufficient-data valuation remains explicit and nullable", () => {
  const validate = schemaValidator(dereferenced.components.schemas.ValuationResult);
  const fixture = {
    valuation_id: "val_test",
    status: "insufficient_data",
    estimated_value: null,
    range: { minimum: null, maximum: null, currency: "USD" },
    confidence: null,
    data_completeness: 0,
    generated_at: "2026-07-17T00:00:00Z",
    engine_version: null,
    source_provenance: [],
    limitations: ["No traceable source."]
  };
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test("public DTO schemas reject internal-looking source IDs", () => {
  const validate = schemaValidator(dereferenced.components.schemas.SourceProvenance);
  const fixture = { source: "test", source_record_id: "507f1f77bcf86cd799439011", observed_at: null, retrieval_method: "fixture" };
  assert.equal(validate(fixture), false);
  assert.match(parsed.components.parameters.AircraftId.schema.pattern, /^\^ac_/);
  assert.match(parsed.components.parameters.ListingId.schema.pattern, /^\^lst_/);
});

test("sanitized error schema rejects nested objects and sensitive implementation keys", () => {
  const validate = schemaValidator(dereferenced.components.schemas.APIError);
  const safe = { error: { code: "INVALID_REQUEST", message: "Invalid request.", request_id: "req_test", details: { field: "query" }, documentation_url: null } };
  assert.equal(validate(safe), true, JSON.stringify(validate.errors));
  assert.equal(validate({ error: { ...safe.error, details: { internal_id: "secret" } } }), false);
  assert.equal(validate({ error: { ...safe.error, details: { context: { id: "secret" } } } }), false);
  assert.equal(validate({ error: { ...safe.error, details: { stack: "trace" } } }), false);
});

test("legacy valuation stays separate until explicit parity-tested cutover", () => {
  const valuation = decision.compatibility_mappings.find(({ legacy }) => legacy === "valuate");
  assert.equal(valuation.mode, "separate_during_coexistence");
  assert.equal(decision.invariants.legacy_behavior_must_not_change_in_task001, true);
  assert.equal(decision.invariants.valuation_without_traceable_sources, "insufficient_data");
});
