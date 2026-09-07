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

    const airportDetail = {
      ...row,
      icao_code: row.ident || row.gps_code || null,
      iata_code: row.iata_code || null,
      country: row.iso_country ? { name: row.iso_country } : null,
      runways: runways || [],
      frequencies: frequencies || [],
      navaids: navaids || [],
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