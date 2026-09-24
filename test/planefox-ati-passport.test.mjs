import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeIcaoHex,
  normalizeTailnumber,
  buildPassportId,
  mapPlaneFoxListing,
  planIngest,
  IDENTITY_STATUS,
} from "../base44/functions/_shared/planeFoxAti.mjs";

test("normalizeIcaoHex accepts a well-formed 6-hex-digit address, case-insensitive", () => {
  assert.equal(normalizeIcaoHex("a1b2c3"), "A1B2C3");
  assert.equal(normalizeIcaoHex(" A1B2C3 "), "A1B2C3");
});

test("normalizeIcaoHex rejects anything that isn't exactly 6 hex digits", () => {
  for (const bad of [null, undefined, "", "A1B2", "A1B2C3D4", "GGGGGG", "N7692J"]) {
    assert.equal(normalizeIcaoHex(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

test("normalizeTailnumber trims, uppercases and strips whitespace", () => {
  assert.equal(normalizeTailnumber(" n7692j "), "N7692J");
});

test("buildPassportId matches the required ID_ABOS_PLANEFOX_{icao_hex}_{tailnumber} format", () => {
  assert.equal(buildPassportId("A1B2C3", "N7692J"), "ID_ABOS_PLANEFOX_A1B2C3_N7692J");
});

test("buildPassportId refuses to fabricate an ID from an invalid hex", () => {
  assert.throws(() => buildPassportId("N7692J", "N7692J"));
  assert.throws(() => buildPassportId(null, "N7692J"));
  assert.throws(() => buildPassportId("A1B2C3", null));
});

test("mapPlaneFoxListing normalizes a raw PlaneFox payload and tags evidence as unverified source material", () => {
  const normalized = mapPlaneFoxListing({
    listing_id: "PF-12345",
    listing_url: "https://planefox.com/listings/PF-12345",
    tailnumber: "n7692j",
    icao_hex: "a1b2c3",
    manufacturer: "Cessna",
    model: "Citation CJ3",
    serial_number: "525B-0123",
    year: 2011,
    photos: ["https://cdn.planefox.com/a.jpg"],
    documents: [{ url: "https://cdn.planefox.com/logbook.pdf", title: "Logbook excerpt" }],
  });

  assert.equal(normalized.source_record_id, "PF-12345");
  assert.equal(normalized.tailnumber, "N7692J");
  assert.equal(normalized.specific_icao_hex, "A1B2C3");
  assert.equal(normalized.manufacturer, "Cessna");
  assert.equal(normalized.evidence.length, 2);
  for (const item of normalized.evidence) {
    assert.equal(item.verified, false);
    assert.equal(item.status, "source_evidence");
    assert.equal(item.source, "planefox");
  }
});

test("mapPlaneFoxListing never fabricates an ICAO hex when the source field is missing or malformed", () => {
  const normalized = mapPlaneFoxListing({ listing_id: "PF-9", tailnumber: "N999AB" });
  assert.equal(normalized.specific_icao_hex, null);
});

test("mapPlaneFoxListing never fabricates year zero for a missing/blank year", () => {
  for (const badYear of [null, undefined, ""]) {
    const normalized = mapPlaneFoxListing({ listing_id: "PF-9", tailnumber: "N999AB", year: badYear });
    assert.equal(normalized.year, null, `expected null year for ${JSON.stringify(badYear)}`);
  }
  assert.equal(mapPlaneFoxListing({ listing_id: "PF-9", year: 2011 }).year, 2011);
  assert.equal(mapPlaneFoxListing({ listing_id: "PF-9", year: "2011" }).year, 2011);
});

const NOW = "2026-01-01T00:00:00.000Z";
function listing(overrides = {}) {
  return mapPlaneFoxListing({
    listing_id: "PF-12345",
    listing_url: "https://planefox.com/listings/PF-12345",
    tailnumber: "N7692J",
    icao_hex: "A1B2C3",
    manufacturer: "Cessna",
    model: "Citation CJ3",
    serial_number: "525B-0123",
    year: 2011,
    ...overrides,
  });
}

test("planIngest: first-seen aircraft with a valid hex creates a PARTIALLY_VERIFIED passport", () => {
  const plan = planIngest({ normalizedListing: listing(), preExistingTwin: null, existingPassport: null, now: NOW });
  assert.equal(plan.identity_status, IDENTITY_STATUS.PARTIALLY_VERIFIED);
  assert.equal(plan.passport_id, "ID_ABOS_PLANEFOX_A1B2C3_N7692J");
  assert.equal(plan.passport_action, "create");
  assert.equal(plan.response.created, true);
  assert.equal(plan.response.updated, false);
  assert.equal(plan.response.identity_status, IDENTITY_STATUS.PARTIALLY_VERIFIED);
});

test("planIngest: an aircraft identity from an independent ABOS source corroborates the identity as VERIFIED", () => {
  const plan = planIngest({
    normalizedListing: listing(),
    preExistingTwin: { registration: "N7692J", icao24: "a1b2c3", source: "faa_registry_sync" },
    existingPassport: null,
    now: NOW,
  });
  assert.equal(plan.identity_status, IDENTITY_STATUS.VERIFIED);
  assert.equal(plan.passport_action, "create");
});

test("planIngest: a twin planted by this same PlaneFox ingestion path is not independent corroboration", () => {
  // Re-ingesting the same single-source listing must not escalate to VERIFIED
  // just because an earlier call of ours already created the aircraft_passports row.
  const plan = planIngest({
    normalizedListing: listing(),
    preExistingTwin: { registration: "N7692J", icao24: "a1b2c3", source: "planefox_listing" },
    existingPassport: null,
    now: NOW,
  });
  assert.equal(plan.identity_status, IDENTITY_STATUS.PARTIALLY_VERIFIED);
});

test("planIngest: a twin with no hex on file yet does not corroborate, even from an independent source", () => {
  const plan = planIngest({
    normalizedListing: listing(),
    preExistingTwin: { registration: "N7692J", icao24: null, source: "user_created" },
    existingPassport: null,
    now: NOW,
  });
  assert.equal(plan.identity_status, IDENTITY_STATUS.PARTIALLY_VERIFIED);
});

test("planIngest: missing/invalid ICAO hex pauses passport creation and marks identity UNVERIFIED, but keeps the tailnumber", () => {
  const plan = planIngest({
    normalizedListing: listing({ icao_hex: null }),
    preExistingTwin: null,
    existingPassport: null,
    now: NOW,
  });
  assert.equal(plan.identity_status, IDENTITY_STATUS.UNVERIFIED);
  assert.equal(plan.passport_id, null);
  assert.equal(plan.passport_action, "skip");
  assert.equal(plan.response.created, false);
  assert.equal(plan.response.updated, false);
  assert.equal(plan.listing_patch.tailnumber, "N7692J");
});

test("planIngest: a hex that conflicts with ABOS's existing aircraft identity is flagged, not overwritten", () => {
  const plan = planIngest({
    normalizedListing: listing(),
    preExistingTwin: { registration: "N7692J", icao24: "FFFFFF", source: "faa_registry_sync" },
    existingPassport: null,
    now: NOW,
  });
  assert.equal(plan.identity_status, IDENTITY_STATUS.IDENTITY_CONFLICT);
  assert.equal(plan.passport_action, "skip");
  assert.equal(plan.response.created, false);
  // The deterministic ID is still surfaced so the conflict can be reviewed/located.
  assert.equal(plan.passport_id, "ID_ABOS_PLANEFOX_A1B2C3_N7692J");
});

test("planIngest idempotency: re-ingesting the same listing updates the existing passport instead of creating a duplicate", () => {
  const first = planIngest({ normalizedListing: listing(), preExistingTwin: null, existingPassport: null, now: NOW });
  assert.equal(first.response.created, true);

  const existingPassport = {
    id: "base44-record-id",
    registration: "N7692J",
    tailnumber: "N7692J",
    specific_icao_hex: "A1B2C3",
    passport_id: first.passport_id,
    provider: "planefox",
    serial_number: "525B-0123",
  };

  const second = planIngest({
    normalizedListing: listing(),
    preExistingTwin: null,
    existingPassport,
    now: "2026-01-02T00:00:00.000Z",
  });

  assert.equal(second.passport_id, first.passport_id);
  assert.equal(second.passport_action, "update");
  assert.equal(second.response.created, false);
  assert.equal(second.response.updated, true);
  // Fields ABOS already had on file are never re-sent/overwritten.
  assert.equal(second.passport_patch.serial_number, undefined);
  assert.equal(second.passport_patch.registration, undefined);
});

test("planIngest never overwrites a higher-priority value ABOS already verified", () => {
  const existingPassport = {
    registration: "N7692J",
    tailnumber: "N7692J",
    specific_icao_hex: "A1B2C3",
    serial_number: "TRUSTED-SERIAL-FROM-FAA",
    provider: undefined,
  };
  const plan = planIngest({
    normalizedListing: listing({ serial_number: "PLANEFOX-CLAIMED-SERIAL" }),
    preExistingTwin: null,
    existingPassport,
    now: NOW,
  });
  assert.equal(plan.passport_patch.serial_number, undefined);
});
