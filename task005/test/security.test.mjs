import assert from "node:assert/strict";
import test from "node:test";
import { sanitizePrimaryImageUrl } from "../dist/image-policy.js";
import { assertSafeSearchResponse } from "../dist/response-guard.js";
import { searchFixtures } from "../dist/fixtures.js";

const hosts = ["images.example.test"];

test("primary image policy permits only HTTPS exact allowlisted hosts", () => {
  assert.equal(sanitizePrimaryImageUrl("https://images.example.test/aircraft/a.jpg", hosts), "https://images.example.test/aircraft/a.jpg");
  assert.equal(sanitizePrimaryImageUrl("http://images.example.test/aircraft/a.jpg", hosts), null);
  assert.equal(sanitizePrimaryImageUrl("data:image/png;base64,abc", hosts), null);
  assert.equal(sanitizePrimaryImageUrl("https://unapproved.example.test/a.jpg", hosts), null);
  assert.equal(sanitizePrimaryImageUrl("https://cdn.images.example.test/a.jpg", hosts), null);
  assert.equal(sanitizePrimaryImageUrl("https://user:pass@images.example.test/a.jpg", hosts), null);
});

test("runtime response guard accepts fixture public identities", () => {
  assert.equal(assertSafeSearchResponse(searchFixtures.success), searchFixtures.success);
});

test("runtime response guard rejects malformed IDs and internal provenance", () => {
  const listingId = structuredClone(searchFixtures.success);
  listingId.results[0].listing_id = "lst_short";
  assert.throws(() => assertSafeSearchResponse(listingId), /invalid listing identifier/);

  const aircraftId = structuredClone(searchFixtures.success);
  aircraftId.results[0].aircraft.aircraft_id = "ac_0123456789abcdef0123456z";
  assert.throws(() => assertSafeSearchResponse(aircraftId), /invalid aircraft identifier/);

  for (const forbidden of ["base44_record", "internal_record", "0123456789abcdef01234567"]) {
    const response = structuredClone(searchFixtures.success);
    response.results[0].source_provenance[0].source_record_id = forbidden;
    assert.throws(() => assertSafeSearchResponse(response), /forbidden source record identifier/);
  }
});
