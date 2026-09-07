import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('ABOS_SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('ABOS_SUPABASE_SERVICE_ROLE_KEY') || '';

async function supabaseQuery(path: string) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`Supabase query failed (${resp.status})`);
  return resp.json();
}

/**
 * SkyLink airport intelligence proxy.
 *
 * Given an airport code (ICAO like "KJFK" or IATA like "JFK"), returns the
 * airport profile (runways, frequencies, navaids) plus departure/arrival
 * schedules. Optionally accepts a `flight_number` to return live flight status.
 *
 * Returns a structured "not_configured" state when SKYLINK_API_KEY is absent,
 * so the frontend can degrade gracefully (the page never breaks).
 */

const BASE = 'https://data.skylinkapi.com/v3.1';

// 5-minute in-memory cache keyed by query signature.
const cache = new Map<string, { at: number; payload: unknown }>();
const CACHE_TTL_MS = 5 * 60_000;

async function skylink(path: string, params: URLSearchParams, apiKey: string) {
  const url = `${BASE}${path}?${params.toString()}`;
  const resp = await fetch(url, { headers: { 'x-api-key': apiKey } });
  if (!resp.ok) return null;
  return resp.json().catch(() => null);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return Response.json({ configured: false, status: 'not_configured', message: 'ABOS Supabase connection is not configured.' });
    }

    const apiKey = Deno.env.get('SKYLINK_API_KEY');
    const body = await req.json().catch(() => ({}));
    const { airport, flight_number } = body || {};

    const cacheKey = JSON.stringify({ airport, flight_number });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return Response.json(cached.payload);
    }

    // ── Flight status lookup (single flight) ──
    if (flight_number) {
      if (!apiKey) return Response.json({ configured: false, status: 'not_configured', message: 'SkyLink API key not set for live flight status.' });
      const fn = encodeURIComponent(String(flight_number).trim());
      const status = await skylink(`/flight_status/${fn}`, new URLSearchParams(), apiKey);
      const payload = { configured: true, source: 'skylink', flight_status: status };
      cache.set(cacheKey, { at: Date.now(), payload });
      return Response.json(payload);
    }

    if (!airport) {
      return Response.json({ configured: true, source: 'skylink', error: 'airport or flight_number required' }, { status: 400 });
    }

    const code = String(airport).trim().toUpperCase();
    const isIcao = /^[A-Z]{4}$/.test(code);
    const isIata = /^[A-Z]{3}$/.test(code);
    if (!isIcao && !isIata) {
      return Response.json({ configured: true, source: 'skylink', error: 'Airport code must be a 4-letter ICAO or 3-letter IATA code.' }, { status: 400 });
    }

    // Airport profile from ABOS-owned OurAirports data in Supabase.
    const airportFilter = isIcao
      ? `or=(ident.eq.${encodeURIComponent(code)},gps_code.eq.${encodeURIComponent(code)},iata_code.eq.${encodeURIComponent(code)})&limit=1`
      : `or=(iata_code.eq.${encodeURIComponent(code)},local_code.eq.${encodeURIComponent(code)})&limit=1`;
    const [airportRows] = await Promise.all([supabaseQuery(`abos_airports?${airportFilter}`)]);
    const row = airportRows?.[0] || null;

    if (!row) {
      const payload = { configured: true, source: 'supabase:ourairports', airport: null, schedules: { departures: [], arrivals: [], total_departures: 0, total_arrivals: 0 } };
      cache.set(cacheKey, { at: Date.now(), payload });
      return Response.json(payload);
    }

    const ident = row.ident || row.gps_code || row.iata_code;
    const [runways, frequencies, navaids] = await Promise.all([
      supabaseQuery(`abos_runways?airport_ident=eq.${encodeURIComponent(ident)}&limit=100`),
      supabaseQuery(`abos_airport_frequencies?airport_ident=eq.${encodeURIComponent(ident)}&limit=100`),
      supabaseQuery(`abos_navaids?associated_airport=eq.${encodeURIComponent(ident)}&limit=100`),
    ]);

    // Traffic intelligence: adsb.lol is the primary live source.
    // Query a tight airport-radius feed directly, then enrich with ABOS Supabase
    // only when the live source is unavailable. This keeps Airport Intelligence
    // genuinely live without depending on the stale historical live_traffic table.
    let liveTraffic = [];
    const adsbRadiusNm = 25;
    if (Number.isFinite(Number(row.latitude_deg)) && Number.isFinite(Number(row.longitude_deg))) {
      try {
        const adsbResp = await fetch(
          `https://api.adsb.lol/v2/lat/${encodeURIComponent(Number(row.latitude_deg))}/lon/${encodeURIComponent(Number(row.longitude_deg))}/dist/${adsbRadiusNm}`,
          { headers: { "User-Agent": "ABOS-Aviation-Platform/2.0" } }
        );
        if (adsbResp.ok) {
          const adsbData = await adsbResp.json();
          liveTraffic = (adsbData?.ac || []).map((ac) => ({
            icao24: ac.hex?.toLowerCase() || null,
            callsign: (ac.flight || "").trim() || null,
            registration: ac.r || null,
            latitude: ac.lat ?? null,
            longitude: ac.lon ?? null,
            altitude_ft: typeof ac.alt_baro === "number" ? Math.round(ac.alt_baro) : null,
            ground_speed_kt: typeof ac.gs === "number" ? Math.round(ac.gs) : null,
            heading: typeof ac.track === "number" ? Math.round(ac.track) : null,
            vertical_rate_fpm: typeof ac.baro_rate === "number" ? Math.round(ac.baro_rate) : null,
            on_ground: ac.alt_baro === "ground" || ac.alt_baro === 0,
            aircraft_category: ac.category || null,
            source: "adsb.lol"
          })).filter((ac) => ac.latitude != null && ac.longitude != null);
        }
      } catch (_) {
        liveTraffic = [];
      }
    }

    const airportLat = Number(row.latitude_deg);
    const airportLon = Number(row.longitude_deg);
    let traffic = liveTraffic;
    if (traffic.length === 0 && Number.isFinite(airportLat) && Number.isFinite(airportLon)) {
      const latDelta = 25 / 69;
      const lonDelta = 25 / Math.max(69 * Math.cos((airportLat * Math.PI) / 180), 1);
      const minLat = airportLat - latDelta;
      const maxLat = airportLat + latDelta;
      const minLon = airportLon - lonDelta;
      const maxLon = airportLon + lonDelta;
      traffic = await supabaseQuery(
        `live_traffic?latitude=gte.${minLat}&latitude=lte.${maxLat}&longitude=gte.${minLon}&longitude=lte.${maxLon}&order=recorded_at.desc&limit=150`
      );
      traffic = (traffic || []).map((t) => {
        const lat = Number(t.latitude);
        const lon = Number(t.longitude);
        const dLat = ((lat - airportLat) * Math.PI) / 180;
        const dLon = ((lon - airportLon) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((airportLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        const distanceNm = 3440.065 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
        return { ...t, distance_nm: Math.round(distanceNm * 10) / 10 };
      }).filter((t) => Number.isFinite(t.distance_nm) && t.distance_nm <= 25).sort((a, b) => a.distance_nm - b.distance_nm).slice(0, 30);
    }

    const latestTrafficAt = traffic.reduce((latest, t) => {
      const ts = t.recorded_at ? new Date(t.recorded_at).getTime() : 0;
      return ts > latest ? ts : latest;
    }, 0);
    const trafficAgeMinutes = latestTrafficAt ? Math.max(0, Math.round((Date.now() - latestTrafficAt) / 60000)) : null;

    const trafficIntelligence = {
      source: liveTraffic.length > 0 ? 'adsb.lol' : 'supabase:live_traffic',
      radius_nm: 25,
      count: traffic.length,
      airborne: traffic.filter((t) => t.on_ground === false).length,
      on_ground: traffic.filter((t) => t.on_ground === true).length,
      latest_recorded_at: latestTrafficAt ? new Date(latestTrafficAt).toISOString() : null,
      age_minutes: trafficAgeMinutes,
      status: trafficAgeMinutes == null ? 'no_coverage' : trafficAgeMinutes <= 15 ? 'live' : 'historical',
      coverage: traffic.length > 0 ? 'position_snapshot' : 'none',
      aircraft: traffic,
      primary_source: 'adsb.lol',
      fallback_source: 'supabase:live_traffic',
    };

    const airportDetail = {
      ...row,
      icao_code: row.ident || row.gps_code || null,
      iata_code: row.iata_code || null,
      country: row.iso_country ? { name: row.iso_country } : null,
      runways: runways || [],
      frequencies: frequencies || [],
      navaids: navaids || [],
      traffic: trafficIntelligence,
    };

    const payload = {
      configured: true,
      source: 'supabase:ourairports',
      airport: airportDetail,
      schedules: { departures: [], arrivals: [], total_departures: 0, total_arrivals: 0 },
    };
    cache.set(cacheKey, { at: Date.now(), payload });
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});