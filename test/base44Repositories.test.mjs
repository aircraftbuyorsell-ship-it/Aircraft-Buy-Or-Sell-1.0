import test from "node:test";
import assert from "node:assert/strict";
import { createBase44Repositories } from "../base44/functions/abosCoreApiV1/adapters/base44Repositories.mjs";
import { assertRepositoryPorts } from "../base44/functions/abosCoreApiV1/repositoryPorts.mjs";

const ACTIVE_PUBLIC = {
  id: "internal-listing-1",
  status: "active",
  visibility: "public",
  registration: "N123AB",
  serial_number: "172-12345",
  registry_country: "US",
  make: "Cessna",
  model: "172S",
  year: 2004,
  total_time: 2400,
  engine_hours: 600,
  asking_price: 185000,
  currency: "USD",
  country: "US",
  region: "Nevada",
  city: "Reno",
  ati_score: 84,
  created_date: "2026-07-01T00:00:00.000Z",
  updated_date: "2026-07-10T00:00:00.000Z",
};

const createPublicId = async (prefix, value) => {
  if (prefix === "lst" && value === ACTIVE_PUBLIC.id) return "lst_0123456789abcdef01234567";
  if (prefix === "ac" && value === ACTIVE_PUBLIC.registration) return "ac_0123456789abcdef01234567";
  return `${prefix}_ffffffffffffffffffffffff`;
};

function fakeBase44(records) {
  const calls = [];
  return {
    calls,
    client: {
      asServiceRole: {
        entities: {
          AircraftListing: {
            async filter(...args) {
              calls.push(args);
              return records;
            },
          },
        },
      },
    },
  };
}

test("repository ports require the canonical methods", () => {
  assert.throws(
    () => assertRepositoryPorts({ listingRepository: {}, aircraftRepository: {} }),
    /listingRepository\.search/,
  );
});

test("Base44 adapter retrieves only active public candidates", async () => {
  const privateRecord = { ...ACTIVE_PUBLIC, id: "private", visibility: "private" };
  const inactiveRecord = { ...ACTIVE_PUBLIC, id: "inactive", status: "sold" };
  const fake = fakeBase44([ACTIVE_PUBLIC, privateRecord, inactiveRecord]);
  const repositories = createBase44Repositories({ base44: fake.client, createPublicId });

  const result = await repositories.listingRepository.search({
    intent: { constraints: { terms: [] } },
    limit: 20,
    cursor: null,
  });

  assert.equal(result.items.length, 1);
  assert.deepEqual(fake.calls[0], [{ status: "active", visibility: "public" }, "-created_date", 200]);
});

test("Base44 records are mapped to canonical public DTOs without internal IDs", async () => {
  const fake = fakeBase44([ACTIVE_PUBLIC]);
  const repositories = createBase44Repositories({ base44: fake.client, createPublicId });
  const result = await repositories.listingRepository.search({
    intent: { constraints: { terms: ["cessna", "n123ab"] } },
    limit: 20,
    cursor: null,
  });

  const listing = result.items[0];
  assert.equal(listing.listing_id, "lst_0123456789abcdef01234567");
  assert.equal(listing.aircraft.aircraft_id, "ac_0123456789abcdef01234567");
  assert.equal(listing.aircraft.identity.serial_number, "172-12345");
  assert.deepEqual(listing.location, { country: "US", region: "Nevada", city: "Reno" });
  assert.equal("id" in listing, false);
  assert.equal(JSON.stringify(listing).includes("internal-listing-1"), false);
  assert.equal(listing.source_provenance[0].source_record_id, null);
});

test("Base44 adapter resolves listings and aircraft by opaque public ID", async () => {
  const fake = fakeBase44([ACTIVE_PUBLIC]);
  const repositories = createBase44Repositories({ base44: fake.client, createPublicId });

  const listing = await repositories.listingRepository.getByPublicId("lst_0123456789abcdef01234567");
  const aircraft = await repositories.aircraftRepository.getByPublicId("ac_0123456789abcdef01234567");

  assert.equal(listing?.aircraft.identity.registration, "N123AB");
  assert.equal(aircraft?.manufacturer, "Cessna");
});

test("Base44 adapter fails closed when the backend returns a non-array", async () => {
  const fake = fakeBase44(null);
  const repositories = createBase44Repositories({ base44: fake.client, createPublicId });

  await assert.rejects(
    repositories.listingRepository.search({ intent: { constraints: { terms: [] } }, limit: 20, cursor: null }),
    /must return an array/,
  );
});

test("Base44 adapter normalizes legacy values before they reach the public contract", async () => {
  const fake = fakeBase44([{
    ...ACTIVE_PUBLIC,
    registry_country: "usa",
    country: "united states",
    currency: "usd",
    year: 1800,
    total_time: -5,
    asking_price: -1,
    omvm_value: 190000,
    photo_url: "not a url",
    created_date: "invalid",
  }]);
  const repositories = createBase44Repositories({ base44: fake.client, createPublicId });
  const result = await repositories.listingRepository.search({ intent: { constraints: { terms: [] } }, limit: 20, cursor: null });
  const listing = result.items[0];

  assert.equal(listing.aircraft.identity.registry_country, null);
  assert.equal(listing.location.country, null);
  assert.equal(listing.aircraft.year, null);
  assert.equal(listing.aircraft.total_time_hours, null);
  assert.equal(listing.asking_price, null);
  assert.equal(listing.primary_image_url, null);
  assert.equal(listing.created_at, null);
  assert.equal(listing.intelligence.observed_market_value.currency, "USD");
});
