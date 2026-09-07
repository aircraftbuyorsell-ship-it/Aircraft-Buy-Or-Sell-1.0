// Shared parsing/config for adsb.lol's /v2/lat/{lat}/lon/{lon}/dist/{radius}
// endpoint, used by both cachedTraffic (world map tiles) and openSky
// (bbox/point lookups). One implementation so the two call sites can't
// silently drift apart — they already had, in the category mapping below.

// adsb.lol's /v2/lat/.../dist/{radius} endpoint clamps radius to 250nm
// server-side (min(radius, 250) in adsblol/api's api_v2.py) — never ask for
// more than this, the server silently ignores the excess.
export const MAX_TILE_DIST = 250;

// 250nm tiles positioned to actually cover the named regions (adsb.lol's
// server-side clamp above means a bigger `dist` buys nothing, only more
// tiles does).
export const WORLD_TILES = [
  // Europe
  { key: "europe-nw",   clat: 51, clon: 2,   dist: MAX_TILE_DIST }, // UK, Benelux, N France
  { key: "europe-c",    clat: 50, clon: 14,  dist: MAX_TILE_DIST }, // Germany, Czechia, S Poland
  { key: "europe-ne",   clat: 58, clon: 18,  dist: MAX_TILE_DIST }, // Scandinavia, Baltics
  { key: "europe-s",    clat: 43, clon: 3,   dist: MAX_TILE_DIST }, // Spain, S France
  { key: "europe-se",   clat: 42, clon: 16,  dist: MAX_TILE_DIST }, // Italy, W Balkans
  { key: "europe-e",    clat: 50, clon: 26,  dist: MAX_TILE_DIST }, // E Poland, Ukraine, Romania
  // North America
  { key: "usa-ne",      clat: 42, clon: -75,  dist: MAX_TILE_DIST },
  { key: "usa-se",      clat: 32, clon: -84,  dist: MAX_TILE_DIST },
  { key: "usa-mid",     clat: 40, clon: -95,  dist: MAX_TILE_DIST },
  { key: "usa-sc",      clat: 32, clon: -98,  dist: MAX_TILE_DIST },
  { key: "usa-mtn",     clat: 40, clon: -108, dist: MAX_TILE_DIST },
  { key: "usa-nw",      clat: 46, clon: -120, dist: MAX_TILE_DIST },
  { key: "usa-sw",      clat: 34, clon: -117, dist: MAX_TILE_DIST },
  // Middle East
  { key: "middle-east", clat: 27, clon: 47,  dist: MAX_TILE_DIST },
  { key: "levant",      clat: 33, clon: 36,  dist: MAX_TILE_DIST },
  // East Asia
  { key: "asia-east",   clat: 35, clon: 120, dist: MAX_TILE_DIST },
  { key: "japan",       clat: 36, clon: 138, dist: MAX_TILE_DIST },
  // South Asia
  { key: "asia-south",  clat: 19, clon: 78,  dist: MAX_TILE_DIST }, // India
  { key: "india-n",     clat: 28, clon: 77,  dist: MAX_TILE_DIST }, // N India
  { key: "south-asia",  clat: 25, clon: 67,  dist: MAX_TILE_DIST }, // Pakistan
  // Africa (Nile corridor has the region's densest feeder coverage)
  { key: "north-africa", clat: 28, clon: 31, dist: MAX_TILE_DIST },
  // Mid-Atlantic: ground-based ADS-B receivers are sparse this far from
  // land, so this tile mostly catches nothing regardless of radius.
  { key: "atlantic",    clat: 45, clon: -35, dist: MAX_TILE_DIST },
];

// adsb.lol's `category` field is a letter + digit (e.g. "A3", "B6", "C1"):
// A0-A7 = fixed-wing size/type classes, B0-B7 = glider/balloon/UAV/etc.,
// C0-C7 = surface vehicles/obstacles. Only the A-group digit is meaningful
// on a shared 0-9 severity scale (A5-A7 = heavy/high-performance/rotorcraft,
// used by the `allow_heavy` filter) — reusing that same digit for B/C
// aircraft would misclassify e.g. a B6 (UAV) as heavy just because "6" is
// in the heavy range. B and C map to their own fixed bucket instead.
function parseCategory(raw) {
  if (!raw) return 0;
  const c = String(raw);
  if (c.startsWith("A")) return parseInt(c[1]) || 0;
  if (c.startsWith("B")) return 8;
  if (c.startsWith("C")) return 9;
  return 0;
}

/**
 * adsb.lol `ac` object (from /v2/lat/.../dist/... or /v2/hex/...) -> normalised
 * aircraft state. Returns null when the object lacks a hex or a position —
 * both callers treat those as unusable rather than half-populated.
 */
export function parseAdsbAircraft(ac) {
  if (!ac?.hex) return null;
  const lat = ac.lat ?? null;
  const lon = ac.lon ?? null;
  if (lat == null || lon == null) return null;

  const altFt = typeof ac.alt_baro === "number" ? ac.alt_baro : null;
  const altM = altFt != null ? altFt * 0.3048 : null;
  const speedKt = typeof ac.gs === "number" ? ac.gs : null;
  const speedMs = speedKt != null ? speedKt * 0.514444 : null;

  return {
    icao24: ac.hex.toLowerCase(),
    callsign: (ac.flight || ac.r || "").trim() || null,
    // adsb.lol's /v2/point response has no operator/country field (no `ownOp`
    // in its V2Response_AcItem schema) — always null from this source.
    origin_country: null,
    time_position: ac.seen_pos != null ? Math.floor(Date.now() / 1000) - ac.seen_pos : null,
    last_contact: ac.seen != null ? Math.floor(Date.now() / 1000) - ac.seen : null,
    longitude: lon,
    latitude: lat,
    baro_altitude: altM,
    on_ground: ac.alt_baro === "ground" || altFt === 0,
    velocity: speedMs,
    true_track: typeof ac.track === "number" ? ac.track : null,
    vertical_rate: typeof ac.baro_rate === "number" ? ac.baro_rate * 0.00508 : null,
    geo_altitude: typeof ac.alt_geom === "number" ? ac.alt_geom * 0.3048 : altM,
    squawk: ac.squawk || null,
    position_source: 0,
    category: parseCategory(ac.category),
    registration: ac.r || null,
    aircraft_type: ac.t || null,
  };
}
