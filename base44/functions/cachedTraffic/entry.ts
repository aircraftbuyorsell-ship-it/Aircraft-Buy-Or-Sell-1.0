import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CACHE_TTL_MS = 5 * 60 * 1000;
const ADSBIOL_BASE = "https://api.adsb.lol/v2";
const FETCH_TIMEOUT = 10000;

// adsb.lol's /v2/lat/.../dist/{radius} endpoint silently clamps radius to
// 250nm server-side (min(radius, 250) in adsblol/api's api_v2.py), so a
// tile's `dist` here can never exceed that — asking for more just means the
// server ignores the excess instead of erroring. Coverage of a region
// therefore comes from having enough 250nm tiles, not from a bigger `dist`.
const MAX_TILE_DIST = 250;
const WORLD_TILES = [
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
    // adsb.lol's /v2/point response has no operator/country field (no `ownOp`
    // in its V2Response_AcItem schema) — always null from this source.
    origin_country: null,
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

    // ── Enrich with existing ABOS listings ────────────────────────────
    // Collect unique registrations from adsb.lol data
    const allRegs = [...new Set(allAircraft.map(ac => ac.registration).filter(Boolean))];
    if (allRegs.length > 0) {
      const listingMap = {};
      // Batch lookup in groups of 50 to avoid rate limits
      for (let i = 0; i < allRegs.length; i += 50) {
        const batch = allRegs.slice(i, i + 50);
        const results = await Promise.allSettled(
          batch.map(reg => base44.asServiceRole.entities.AircraftListing.filter(
            { registration: reg, status: 'active' }, '-created_date', 1
          ))
        );
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value[0]) {
            listingMap[batch[idx]] = r.value[0];
          }
        });
      }
      
      // Attach listing data to aircraft
      for (const ac of allAircraft) {
        if (ac.registration && listingMap[ac.registration]) {
          ac.listing = {
            id: listingMap[ac.registration].id,
            year: listingMap[ac.registration].year,
            make: listingMap[ac.registration].make,
            model: listingMap[ac.registration].model,
            ati_score: listingMap[ac.registration].ati_score,
            asking_price: listingMap[ac.registration].asking_price,
            deal_label: listingMap[ac.registration].deal_label,
          };
        }
      }
    }

    const refreshedAt = new Date().toISOString();

    // Persist full snapshot (all aircraft) to TrafficSnapshot
    const snapshotPayload = {
      region_key,
      region_label,
      bounds: {},
      aircraft_json: JSON.stringify(allAircraft),
      opensky_time: Math.floor(Date.now() / 1000),
      total_raw: allAircraft.length,
      refreshed_by: user.email,
      refreshed_at: refreshedAt,
    };

    let snapshotId = cached?.id || null;
    try {
      if (cached) {
        await base44.asServiceRole.entities.TrafficSnapshot.update(cached.id, snapshotPayload);
      } else {
        const created = await base44.asServiceRole.entities.TrafficSnapshot.create(snapshotPayload);
        snapshotId = created.id;
      }
    } catch (e) {
      console.error('Failed to persist snapshot:', e.message);
    }

    // ── Save historical appearances for aircraft with registrations ──────
    const aircraftWithReg = allAircraft.filter(ac => ac.registration && ac.icao24);
    if (aircraftWithReg.length > 0 && snapshotId) {
      const bulkAppearances = aircraftWithReg.slice(0, 500).map(ac => ({
        icao24: ac.icao24,
        callsign: ac.callsign || null,
        registration: ac.registration,
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
        snapshot_id: snapshotId,
        region_key,
        has_listing: !!ac.listing,
        captured_at: refreshedAt,
      }));

      try {
        await base44.asServiceRole.entities.TrafficAppearance.bulkCreate(bulkAppearances);
      } catch (e) {
        console.error('Failed to persist appearances:', e.message);
      }
    }

    return Response.json({
      source: 'live',
      aircraft: allAircraft.slice(0, limit),
      total_raw: allAircraft.length,
      refreshed_at: refreshedAt,
      refreshed_by: user.email,
      region_key,
      region_label,
      snapshot_id: snapshotId,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});