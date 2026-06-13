import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ADSBIOL_BASE = "https://api.adsb.lol/v2";
const FETCH_TIMEOUT = 15000;

const WORLD_TILES = [
  { key: "europe",       clat: 51,   clon: 12,   dist: 1200 },
  { key: "usa-east",     clat: 38,   clon: -78,  dist: 1200 },
  { key: "usa-west",     clat: 38,   clon: -115, dist: 1200 },
  { key: "middle-east",  clat: 27,   clon: 47,   dist: 1200 },
  { key: "asia-east",    clat: 35,   clon: 120,  dist: 1500 },
  { key: "asia-south",   clat: 18,   clon: 82,   dist: 1200 },
  { key: "south-america",clat: -15,  clon: -58,  dist: 1400 },
  { key: "australia",    clat: -27,  clon: 138,  dist: 1200 },
  { key: "africa",       clat: -5,   clon: 25,   dist: 1400 },
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
  return {
    icao24: ac.hex.toLowerCase(),
    callsign: (ac.flight || "").trim() || null,
    longitude: lon,
    latitude: lat,
    baro_altitude: altFt != null ? altFt * 0.3048 : null,
    on_ground: ac.alt_baro === "ground" || altFt === 0,
    velocity: typeof ac.gs === "number" ? ac.gs : null,
    true_track: typeof ac.track === "number" ? ac.track : null,
    vertical_rate: typeof ac.baro_rate === "number" ? ac.baro_rate * 0.00508 : null,
    squawk: ac.squawk || null,
    category: ac.category ? (parseInt(String(ac.category)[1]) || 0) : 0,
    registration: ac.r || null,
    aircraft_type: ac.t || null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Accept both authenticated and service-role invocations
    if (!user && req.headers.get("x-scheduled-automation") !== "true") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tiles
    const tileResults = await Promise.all(WORLD_TILES.map(fetchTile));

    // Merge and deduplicate by icao24
    const seenHex = new Set();
    const allAircraft = [];
    for (const acs of tileResults) {
      for (const raw of acs) {
        const parsed = parseAc(raw);
        if (parsed && !seenHex.has(parsed.icao24)) {
          seenHex.add(parsed.icao24);
          allAircraft.push(parsed);
        }
      }
    }

    const capturedAt = new Date().toISOString();

    // Upsert: for each aircraft, update the latest position in a dedicated "latest" record
    // We use the existing AircraftListing or just plain entity approach
    // Instead, we bulk-create TrafficAppearance records (the log) for all aircraft
    // Then update the TrafficSnapshot (the latest state)

    const MAX_BULK = 500;
    let stored = 0;
    let skipped = 0;

    for (let i = 0; i < allAircraft.length; i += MAX_BULK) {
      const batch = allAircraft.slice(i, i + MAX_BULK);
      const appearances = batch.map(ac => ({
        icao24: ac.icao24,
        callsign: ac.callsign || null,
        registration: ac.registration || null,
        aircraft_type: ac.aircraft_type || null,
        latitude: ac.latitude,
        longitude: ac.longitude,
        altitude_ft: ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.28084) : null,
        speed_kt: ac.velocity != null ? Math.round(ac.velocity * 1.94384) : null,
        heading: ac.true_track != null ? Math.round(ac.true_track) : null,
        vertical_rate_fpm: ac.vertical_rate != null ? Math.round(ac.vertical_rate * 196.85) : null,
        on_ground: ac.on_ground || false,
        squawk: ac.squawk || null,
        category: ac.category || 0,
        has_listing: false,
        captured_at: capturedAt,
      }));

      try {
        await base44.asServiceRole.entities.TrafficAppearance.bulkCreate(appearances);
        stored += appearances.length;
      } catch (e) {
        console.error("Bulk insert failed:", e.message);
        skipped += appearances.length;
      }
    }

    // Persist latest snapshot as JSON for quick dashboard loading
    try {
      const existing = await base44.asServiceRole.entities.TrafficSnapshot.filter(
        { region_key: "world" }, "-refreshed_at", 1
      );
      const payload = {
        region_key: "world",
        region_label: "Global Live",
        bounds: {},
        aircraft_json: JSON.stringify(allAircraft.slice(0, 2000)),
        opensky_time: Math.floor(Date.now() / 1000),
        total_raw: allAircraft.length,
        refreshed_by: user?.email || "automation",
        refreshed_at: capturedAt,
      };
      if (existing[0]) {
        await base44.asServiceRole.entities.TrafficSnapshot.update(existing[0].id, payload);
      } else {
        await base44.asServiceRole.entities.TrafficSnapshot.create(payload);
      }
    } catch (e) {
      console.error("Snapshot persist failed:", e.message);
    }

    return Response.json({
      ok: true,
      total_fetched: allAircraft.length,
      stored_appearances: stored,
      skipped,
      captured_at: capturedAt,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});