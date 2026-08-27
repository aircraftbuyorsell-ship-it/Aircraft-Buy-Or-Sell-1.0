import test from "node:test";
import assert from "node:assert/strict";
import SwaggerParser from "@apidevtools/swagger-parser";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { createSearchHandler, InMemoryListingRepository } from "../src/search.mjs";

test("the E2E search response validates against the approved OpenAPI SearchResponse", async () => {
  const contractPath = new URL("../../task001/openapi/abos-core-api-v1.yaml", import.meta.url).pathname;
  const contract = await SwaggerParser.dereference(contractPath);
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(contract.components.schemas.SearchResponse);
  const repository = new InMemoryListingRepository([{
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
    source: "fixture-authorized-listings",
    observed_at: "2026-07-17T00:00:00Z",
  }]);
  const handler = createSearchHandler({ listingRepository: repository, authenticate: async () => ({ scopes: ["search:read"] }) });
  const response = await handler(new Request("https://api.example.test/api/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "Citation Latitude under 8M in Europe" }),
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(validate(body), true, JSON.stringify(validate.errors));
});
