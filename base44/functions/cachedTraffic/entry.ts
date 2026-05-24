import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CACHE_TTL_MS = 5 * 60 * 1000;
const ADSBIOL_BASE = "https://api.adsb.lol/v2";
const FETCH_TIMEOUT = 10000;

// Manageable tiles for adsb.lol radius-based API
const WORLD_TILES = [
  { key: "europe",       clat: 51,   clon: 12,   dist: 1200 },
  { key: "usa-east",     clat: 38,   clon: -78,  dist: 1200 },
  { key: "usa-west",     clat: 38,   clon: -115, dist: 1200 },
  { key: "middle-east",  clat: 27,   clon: 47,   dist: 1200 },
  { key: "asia-east",    clat: 35,   clon: 120,  dist: 1500 },
  { key: "asia-south",   clat: 18,   clon: 82,   dist: 1200 },
  { key: "north-africa", clat: 15,   clon: 20,   dist: 1200 },
  { key: "atlantic",     clat: 45,   clon: -35,  dist: 900  },
  { key: "south-asia",   clat: 25,   clon: 67,   dist: 900  },
];

async function fetchTile(tile) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(
      `${ADSBIOL_BASE}/lat/${tile.clat}/lon/${tile.clon}/dist/${tile.dist}`,
      { headers: { "User-Agent": "ABOS-Aviation-Platform/2.0" }, signal: ctrl.signal }
    );
    if (!res.ok) return [];
    const text = await res.text();
    if (!text) return [];
    const data = JSON.parse(text);
    return data.ac || [];
  } catch (_) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseAc(ac) {
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
    origin_country: ac.ownOp || null,
    longitude: lon,
    latitude: lat,
    baro_altitude: altM,
    on_ground: ac.alt_baro === "ground" || altFt === 0,
    velocity: speedMs,
    true_track: typeof ac.track === "number" ? ac.track : null,
    vertical_rate: typeof ac.baro_rate === "number" ? ac.baro_rate * 0.00508 : null,
    geo_altitude: typeof ac.alt_geom === "number" ? ac.alt_geom * 0.3048 : altM,
    squawk: ac.squawk || null,
    category: ac.category ? (parseInt(String(ac.category)[1]) || 0) : 0,
    registration: ac.r || null,
    aircraft_type: ac.t || null,
    faa: null,
    listing: null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      region_key = 'world',
      region_label = 'Global',
      force_refresh = false,
      limit = 1000,
      allow_heavy = false,
    } = body;

    // Try to return fresh cache first
    const existing = await base44.asServiceRole.entities.TrafficSnapshot.filter({ region_key }, '-refreshed_at', 1);
    const cached = existing[0] || null;
    const cacheAgeMs = cached?.refreshed_at ? Date.now() - new Date(cached.refreshed_at).getTime() : Infinity;
    const cacheIsFresh = cacheAgeMs < CACHE_TTL_MS;

    if (cached && !force_refresh && cacheIsFresh) {
      return Response.json({
        source: 'cache',
        aircraft: JSON.parse(cached.aircraft_json || '[]').slice(0, limit),
        total_raw: cached.total_raw || 0,
        refreshed_at: cached.refreshed_at,
        refreshed_by: cached.refreshed_by,
        region_key,
        region_label: cached.region_label || region_label,
      });
    }

    // Fetch all tiles in parallel directly from adsb.lol
    const tileResults = await Promise.all(WORLD_TILES.map(fetchTile));

    // Merge and deduplicate by icao24
    const seenHex = new Set();
    const allAircraft = [];
    for (const acs of tileResults) {
      for (const raw of acs) {
        const parsed = parseAc(raw);
        if (parsed && !seenHex.has(parsed.icao24)) {
          // Filter heavy if needed
          if (!allow_heavy && parsed.category >= 5 && parsed.category < 8) continue;
          seenHex.add(parsed.icao24);
          allAircraft.push(parsed);
        }
      }
    }

    const refreshedAt = new Date().toISOString();

    // Persist a trimmed snapshot (first 200 aircraft) to avoid entity size limit
    const snapshotPayload = {
      region_key,
      region_label,
      bounds: {},
      aircraft_json: JSON.stringify(allAircraft.slice(0, 200)),
      opensky_time: Math.floor(Date.now() / 1000),
      total_raw: allAircraft.length,
      refreshed_by: user.email,
      refreshed_at: refreshedAt,
    };

    try {
      if (cached) {
        await base44.asServiceRole.entities.TrafficSnapshot.update(cached.id, snapshotPayload);
      } else {
        await base44.asServiceRole.entities.TrafficSnapshot.create(snapshotPayload);
      }
    } catch (_) { /* non-fatal */ }

    return Response.json({
      source: 'live',
      aircraft: allAircraft.slice(0, limit),
      total_raw: allAircraft.length,
      refreshed_at: refreshedAt,
      refreshed_by: user.email,
      region_key,
      region_label,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});