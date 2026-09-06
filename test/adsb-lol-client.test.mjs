import test from "node:test";
import assert from "node:assert/strict";
import { MAX_TILE_DIST, WORLD_TILES, parseAdsbAircraft } from "../base44/functions/_shared/adsbLolClient.mjs";

function ac(over = {}) {
  return {
    hex: "a1b2c3",
    lat: 50.1,
    lon: 14.4,
    alt_baro: 35000,
    gs: 420,
    track: 270,
    baro_rate: -500,
    alt_geom: 35200,
    squawk: "1200",
    flight: "OK123",
    r: "OK-ABC",
    t: "C172",
    category: "A3",
    ...over,
  };
}

test("WORLD_TILES never asks for more than adsb.lol's 250nm server-side cap", () => {
  // adsblol/api's api_v2.py does min(radius, 250) — anything above 250 is
  // silently truncated, so a tile requesting more is a tile lying about its
  // own coverage.
  for (const tile of WORLD_TILES) {
    assert.ok(tile.dist <= MAX_TILE_DIST, `${tile.key} requests dist=${tile.dist} > ${MAX_TILE_DIST}`);
  }
});

test("WORLD_TILES has no duplicate keys and valid coordinates", () => {
  const keys = WORLD_TILES.map((t) => t.key);
  assert.deepEqual(keys, [...new Set(keys)], "duplicate tile key");
  for (const tile of WORLD_TILES) {
    assert.ok(tile.clat >= -90 && tile.clat <= 90, `${tile.key} has invalid latitude`);
    assert.ok(tile.clon >= -180 && tile.clon <= 180, `${tile.key} has invalid longitude`);
  }
});

test("parses a normal airborne aircraft, converting units", () => {
  const parsed = parseAdsbAircraft(ac());
  assert.equal(parsed.icao24, "a1b2c3");
  assert.equal(parsed.callsign, "OK123");
  assert.equal(parsed.registration, "OK-ABC");
  assert.equal(parsed.aircraft_type, "C172");
  assert.equal(parsed.on_ground, false);
  // 35000 ft -> m
  assert.ok(Math.abs(parsed.baro_altitude - 10668) < 1);
  // 420 kt -> m/s
  assert.ok(Math.abs(parsed.velocity - 216.07) < 0.1);
});

test("falls back to registration for callsign when flight is absent", () => {
  assert.equal(parseAdsbAircraft(ac({ flight: null })).callsign, "OK-ABC");
  assert.equal(parseAdsbAircraft(ac({ flight: null, r: null })).callsign, null);
});

test("a whitespace-only flight number does not fall back to registration", () => {
  // `(ac.flight || ac.r || "").trim()` short-circuits on the truthy
  // whitespace string before trimming, so a blank-but-present flight field
  // wins over a real registration and the result is null, not r. Documented
  // here as current behavior rather than changed, since it's shared by both
  // callers and out of scope for the adsb.lol coverage/category fixes.
  assert.equal(parseAdsbAircraft(ac({ flight: "   " })).callsign, null);
});

test("no hex or no position means unusable, not half-populated", () => {
  assert.equal(parseAdsbAircraft(ac({ hex: null })), null);
  assert.equal(parseAdsbAircraft(ac({ lat: null })), null);
  assert.equal(parseAdsbAircraft(ac({ lon: null })), null);
  assert.equal(parseAdsbAircraft(null), null);
});

test("on_ground is detected from the ground sentinel or a zero altitude", () => {
  assert.equal(parseAdsbAircraft(ac({ alt_baro: "ground" })).on_ground, true);
  assert.equal(parseAdsbAircraft(ac({ alt_baro: 0 })).on_ground, true);
  assert.equal(parseAdsbAircraft(ac({ alt_baro: 1000 })).on_ground, false);
});

test("origin_country is always null — adsb.lol's /v2/point response has no operator/country field", () => {
  // Regression: this used to read ac.ownOp, a field that doesn't exist in
  // adsb.lol's V2Response_AcItem schema, so it silently always evaluated to
  // null anyway. Locking in the explicit null so nobody re-adds a dead read.
  assert.equal(parseAdsbAircraft(ac()).origin_country, null);
});

test("category: only the A-group digit is a severity scale; B and C get their own fixed bucket", () => {
  // Regression: cachedTraffic used to take parseInt(category[1]) for every
  // prefix, so a "B6" (UAV) landed on category=6 — indistinguishable from an
  // "A6" (high-performance aircraft) under the allow_heavy filter, which
  // treats 5-7 as heavy. B/C aircraft must not fall in that range by accident.
  assert.equal(parseAdsbAircraft(ac({ category: "A0" })).category, 0);
  assert.equal(parseAdsbAircraft(ac({ category: "A5" })).category, 5);
  assert.equal(parseAdsbAircraft(ac({ category: "A7" })).category, 7);
  assert.equal(parseAdsbAircraft(ac({ category: "B6" })).category, 8);
  assert.equal(parseAdsbAircraft(ac({ category: "C1" })).category, 9);
  assert.equal(parseAdsbAircraft(ac({ category: null })).category, 0);
});
