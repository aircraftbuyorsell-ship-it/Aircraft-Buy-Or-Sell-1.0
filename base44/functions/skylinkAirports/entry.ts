import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

    const apiKey = Deno.env.get('SKYLINK_API_KEY');
    if (!apiKey) {
      return Response.json({
        configured: false,
        status: 'not_configured',
        message: 'SkyLink API key not set. Add SKYLINK_API_KEY in app secrets to enable airport & schedule data.',
      });
    }

    const body = await req.json().catch(() => ({}));
    const { airport, flight_number } = body || {};

    const cacheKey = JSON.stringify({ airport, flight_number });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return Response.json(cached.payload);
    }

    // ── Flight status lookup (single flight) ──
    if (flight_number) {
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

    // Airport profile
    const airportParams = new URLSearchParams();
    if (isIcao) airportParams.set('icao', code);
    else airportParams.set('iata', code);
    const airportDetail = await skylink('/airports/search', airportParams, apiKey);

    // Schedules — prefer ICAO when available, fall back to IATA.
    const schedParams = new URLSearchParams();
    const scheduleCode = airportDetail?.icao_code || code;
    if (/^[A-Z]{4}$/.test(scheduleCode)) schedParams.set('icao', scheduleCode);
    else schedParams.set('iata', scheduleCode);

    const [departures, arrivals] = await Promise.all([
      skylink('/schedules/departures', schedParams, apiKey),
      skylink('/schedules/arrivals', schedParams, apiKey),
    ]);

    const payload = {
      configured: true,
      source: 'skylink',
      airport: airportDetail,
      schedules: {
        departures: departures?.flights || [],
        arrivals: arrivals?.flights || [],
        total_departures: departures?.total_flights ?? 0,
        total_arrivals: arrivals?.total_flights ?? 0,
      },
    };
    cache.set(cacheKey, { at: Date.now(), payload });
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});