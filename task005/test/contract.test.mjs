import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import SwaggerParser from "@apidevtools/swagger-parser";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { searchFixtures } from "../dist/fixtures.js";
import { createSearchRequest } from "../dist/search-model.js";

const contractPath = new URL("../../task001/openapi/abos-core-api-v1.yaml", import.meta.url);
const metadata = JSON.parse(await readFile(new URL("../contract-source.json", import.meta.url), "utf8"));

test("typed fixture source is pinned to the exact TASK-001 OpenAPI", async () => {
  const raw = await readFile(contractPath);
  assert.equal(crypto.createHash("sha256").update(raw).digest("hex"), metadata.sha256);
  assert.equal(metadata.operation, "POST /api/v1/search");
  assert.equal(metadata.requestSchema, "SearchRequest");
  assert.equal(metadata.responseSchema, "SearchResponse");
});

test("all response fixtures validate against canonical SearchResponse", async () => {
  const contract = await SwaggerParser.dereference(contractPath.pathname);
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(contract.components.schemas.SearchResponse);
  for (const [name, fixture] of Object.entries(searchFixtures)) {
    assert.equal(validate(fixture), true, `${name}: ${JSON.stringify(validate.errors)}`);
  }
});

test("UI request construction uses only canonical SearchRequest fields", async () => {
  const contract = await SwaggerParser.dereference(contractPath.pathname);
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const validate = ajv.compile(contract.components.schemas.SearchRequest);
  const request = createSearchRequest("Citation Latitude under 8M in Europe", null);
  assert.deepEqual(Object.keys(request).sort(), ["cursor", "page_size", "query"]);
  assert.equal(validate(request), true, JSON.stringify(validate.errors));
});

test("fixtures use public IDs and visibly bounded intelligence", () => {
  for (const fixture of Object.values(searchFixtures)) for (const listing of fixture.results) {
    assert.match(listing.listing_id, /^lst_[a-f0-9]{24}$/);
    assert.match(listing.aircraft.aircraft_id, /^ac_[a-f0-9]{24}$/);
    assert.ok(listing.intelligence.limitations.some((item) => /fixture/i.test(item)));
    assert.doesNotMatch(JSON.stringify(listing), /base44_|internal_id|service_role/i);
  }
});
