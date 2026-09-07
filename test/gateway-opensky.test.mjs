import test from "node:test";
import assert from "node:assert/strict";
import { getOpenSkyToken, stateRowToObject, fetchOpenSkyStates, BBOX } from "../gateway/src/opensky.js";

test("every named bounding box has ordered, in-range coordinates", () => {
  for (const [name, b] of Object.entries(BBOX)) {
    assert.ok(b.lamin < b.lamax, `${name}: lamin should be < lamax`);
    assert.ok(b.lomin < b.lomax, `${name}: lomin should be < lomax`);
    assert.ok(b.lamin >= -90 && b.lamax <= 90, `${name}: latitude out of range`);
    assert.ok(b.lomin >= -180 && b.lomax <= 180, `${name}: longitude out of range`);
  }
});

// A raw OpenSky /states/all row, per the documented field order.
function row(over = {}) {
  const base = [
    "3c6444",      // icao24
    "DLH9LF  ",    // callsign (padded, as OpenSky sends it)
    "Germany",     // origin_country
    1700000000,    // time_position
    1700000005,    // last_contact
    8.5705,        // longitude
    50.0333,       // latitude
    10972.8,       // baro_altitude (m)
    false,         // on_ground
    231.6,         // velocity (m/s)
    90.0,          // true_track
    0.0,           // vertical_rate
    null,          // sensors
    11277.6,       // geo_altitude (m)
    "1000",        // squawk
    false,         // spi
    0,             // position_source
    3,             // category
  ];
  const merged = [...base];
  for (const [k, v] of Object.entries(over)) {
    const idx = ["icao24","callsign","origin_country","time_position","last_contact","longitude","latitude","baro_altitude_m","on_ground","velocity_ms","true_track","vertical_rate","sensors","geo_altitude_m","squawk","spi","position_source","category"].indexOf(k);
    merged[idx] = v;
  }
  return merged;
}

test("stateRowToObject trims the callsign and converts units", () => {
  const s = stateRowToObject(row());
  assert.equal(s.icao24, "3c6444");
  assert.equal(s.callsign, "DLH9LF");
  assert.equal(s.on_ground, false);
  // 231.6 m/s -> ~450 kt
  assert.equal(s.velocity_kts, Math.round(231.6 * 1.944 * 10) / 10);
  // 10972.8 m -> ~36000 ft
  assert.equal(s.baro_altitude_ft, Math.round(10972.8 * 3.281));
});

test("stateRowToObject leaves a null callsign as null instead of crashing on trim", () => {
  const s = stateRowToObject(row({ callsign: null }));
  assert.equal(s.callsign, null);
});

test("stateRowToObject passes through category as-is, defaulting missing to null", () => {
  assert.equal(stateRowToObject(row({ category: 5 })).category, 5);
  assert.equal(stateRowToObject(row({ category: undefined })).category, null);
});

// ─── fetchOpenSkyStates: mock the two outbound calls (token, then states) ──

function fakeEnv(kvState = {}) {
  const store = { ...kvState };
  return {
    OPENSKY_KV: {
      async get(key) { return store[key] ?? null; },
      async put(key, value) { store[key] = JSON.parse(value); },
    },
  };
}

function installFetchMock(handlers) {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    for (const [match, respond] of handlers) {
      if (String(url).startsWith(match)) return respond(url, init);
    }
    throw new Error(`Unmocked fetch: ${url}`);
  };
  return { calls, restore: () => { global.fetch = original; } };
}

function jsonResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[k] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

test("fetchOpenSkyStates fetches a token once, then filters airborne states by default", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "tok123", expires_in: 1800 })],
    ["https://opensky-network.org/api/states/all", () => jsonResponse(200, {
      time: 1700000000,
      states: [row(), row({ icao24: "aaaaaa", on_ground: true })],
    })],
  ]);
  try {
    const env = fakeEnv();
    const result = await fetchOpenSkyStates(env, new URLSearchParams());
    assert.equal(result.status, 200);
    assert.equal(result.cacheable, true);
    // on_ground aircraft dropped unless all=1
    assert.equal(result.body.count, 1);
    assert.equal(result.body.states[0].icao24, "3c6444");
    assert.equal(mock.calls.filter((c) => c.url.includes("auth.opensky-network.org")).length, 1);
  } finally {
    mock.restore();
  }
});

test("fetchOpenSkyStates with all=1 keeps grounded aircraft too", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "tok123", expires_in: 1800 })],
    ["https://opensky-network.org/api/states/all", () => jsonResponse(200, {
      time: 1700000000,
      states: [row(), row({ icao24: "aaaaaa", on_ground: true })],
    })],
  ]);
  try {
    const env = fakeEnv();
    const params = new URLSearchParams({ all: "1" });
    const result = await fetchOpenSkyStates(env, params);
    assert.equal(result.body.count, 2);
  } finally {
    mock.restore();
  }
});

test("fetchOpenSkyStates reuses a cached, unexpired token instead of re-authenticating", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => { throw new Error("should not re-authenticate"); }],
    ["https://opensky-network.org/api/states/all", () => jsonResponse(200, { time: 1, states: [] })],
  ]);
  try {
    const farFuture = Math.floor(Date.now() / 1000) + 1000;
    const env = fakeEnv({ opensky_token: { access_token: "cached-tok", expires_at: farFuture } });
    const result = await fetchOpenSkyStates(env, new URLSearchParams());
    assert.equal(result.status, 200);
  } finally {
    mock.restore();
  }
});

test("fetchOpenSkyStates surfaces a 429 as a structured, non-cacheable rate-limit response", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "tok123", expires_in: 1800 })],
    ["https://opensky-network.org/api/states/all", () => jsonResponse(429, {}, { "X-Rate-Limit-Retry-After-Seconds": "42" })],
  ]);
  try {
    const env = fakeEnv();
    const result = await fetchOpenSkyStates(env, new URLSearchParams());
    assert.equal(result.status, 429);
    assert.equal(result.cacheable, false);
    assert.equal(result.body.retry_after_seconds, 42);
  } finally {
    mock.restore();
  }
});

test("fetchOpenSkyStates surfaces a non-429 upstream failure as a 502", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "tok123", expires_in: 1800 })],
    ["https://opensky-network.org/api/states/all", () => jsonResponse(500, { detail: "boom" })],
  ]);
  try {
    const env = fakeEnv();
    const result = await fetchOpenSkyStates(env, new URLSearchParams());
    assert.equal(result.status, 502);
    assert.equal(result.cacheable, false);
    assert.equal(result.body.error, "opensky_upstream_error");
  } finally {
    mock.restore();
  }
});

test("fetchOpenSkyStates drops malformed icao24 values instead of forwarding them upstream", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "tok123", expires_in: 1800 })],
    ["https://opensky-network.org/api/states/all", (url) => {
      const parsed = new URL(url);
      assert.deepEqual(parsed.searchParams.getAll("icao24"), ["3c6444"]);
      return jsonResponse(200, { time: 1, states: [] });
    }],
  ]);
  try {
    const env = fakeEnv();
    const params = new URLSearchParams({ icao24: "3C6444, not-hex, 12" });
    await fetchOpenSkyStates(env, params);
  } finally {
    mock.restore();
  }
});

test("fetchOpenSkyStates resolves a named bbox to lat/lon params", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "tok123", expires_in: 1800 })],
    ["https://opensky-network.org/api/states/all", (url) => {
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get("lamin"), String(BBOX.czech.lamin));
      assert.equal(parsed.searchParams.get("lomax"), String(BBOX.czech.lomax));
      return jsonResponse(200, { time: 1, states: [] });
    }],
  ]);
  try {
    const env = fakeEnv();
    await fetchOpenSkyStates(env, new URLSearchParams({ bbox: "czech" }));
  } finally {
    mock.restore();
  }
});

test("getOpenSkyToken refreshes and caches a new token when none is stored", async () => {
  const mock = installFetchMock([
    ["https://auth.opensky-network.org", () => jsonResponse(200, { access_token: "fresh-tok", expires_in: 1800 })],
  ]);
  try {
    const env = fakeEnv();
    const token = await getOpenSkyToken(env);
    assert.equal(token, "fresh-tok");
  } finally {
    mock.restore();
  }
});
