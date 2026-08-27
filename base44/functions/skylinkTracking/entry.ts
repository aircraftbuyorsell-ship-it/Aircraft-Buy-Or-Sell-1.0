import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * SkyLink ADS-B live tracking proxy.
 *
 * Fetches real-time aircraft positions from SkyLink's /adsb/aircraft endpoint
 * for the requested viewport (bbox or lat/lon/radius) and normalizes them into
 * the same shape ABOS uses for OpenSky / adsb.lol traffic so they merge cleanly
 * on the Traffic Map globe.
 *
 * Returns a structured "not_configured" state when SKYLINK_API_KEY is absent,
 * so the frontend can degrade gracefully (the page never breaks).
 */

const BASE = 'https://data.skylinkapi.com/v3.1';

// 30-second in-memory cache keyed by query signature (respects plan quotas).
const cache = new Map<string, { at: number; payload: unknown }>();
const CACHE_TTL_MS = 30_000;

const ftToM = (ft: number | null) => (ft == null ? null : ft / 3.28084);
const ktsToMps = (kts: number | null) => (kts == null ? null : kts * 0.514444);
const fpmToMps = (fpm: number | null) => (fpm == null ? null : fpm / 196.85);

// SkyLink returns type descriptions like "Boeing B738". The globe filters
// commercial types by exact ICAO code (e.g. "B738"), so take the last token.
function normalizeTypeCode(raw: string | null): string | null {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/);
  return parts[parts.length - 1].toUpperCase();
}

function normalizeAircraft(a: Record<string, unknown>) {
  return {
    icao24: a.icao24 ?? null,
    callsign: a.callsign ?? null,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    baro_altitude: ftToM(typeof a.altitude === 'number' ? a.altitude : null),
    velocity: ktsToMps(typeof a.ground_speed === 'number' ? a.ground_speed : null),
    true_track: a.track ?? null,
    vertical_rate: fpmToMps(typeof a.vertical_rate === 'number' ? a.vertical_rate : null),
    on_ground: a.is_on_ground ?? false,
    registration: a.registration ?? null,
    aircraft_type: normalizeTypeCode(typeof a.aircraft_type === 'string' ? a.aircraft_type : null),
    airline: a.airline ?? null,
    last_seen: a.last_seen ?? null,
    _source: 'skylink',
  };
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
        message: 'SkyLink API key not set. Add SKYLINK_API_KEY in app secrets to enable live ADS-B tracking.',
        aircraft: [],
      });
    }

    const body = await req.json().catch(() => ({}));
    const { bbox, lat, lon, radius, limit } = body || {};

    // Build query params — circle mode (lat+lon+radius) or rectangle mode (bbox).
    const params = new URLSearchParams();
    if (bbox) {
      params.set('bbox', String(bbox));
    } else if (lat != null && lon != null && radius != null) {
      params.set('lat', String(lat));
      params.set('lon', String(lon));
      params.set('radius', String(radius));
    } else {
      // Default to a broad world viewport so the globe always gets data.
      params.set('bbox', '-60,-170,60,170');
    }
    if (limit) params.set('limit', String(limit));

    const cacheKey = params.toString();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return Response.json(cached.payload);
    }

    const url = `${BASE}/adsb/aircraft?${cacheKey}`;
    const resp = await fetch(url, { headers: { 'x-api-key': apiKey } });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return Response.json({
        configured: true,
        source: 'skylink',
        error: `SkyLink request failed (${resp.status})`,
        details: text.slice(0, 500),
        aircraft: [],
      }, { status: 502 });
    }

    const json = await resp.json();
    const rawAircraft = Array.isArray(json.aircraft) ? json.aircraft : [];
    const aircraft = rawAircraft.map(normalizeAircraft);

    const payload = {
      configured: true,
      source: 'skylink',
      aircraft,
      total_count: json.total_count ?? aircraft.length,
      timestamp: json.timestamp ?? new Date().toISOString(),
    };
    cache.set(cacheKey, { at: Date.now(), payload });
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message, aircraft: [] }, { status: 500 });
  }
});