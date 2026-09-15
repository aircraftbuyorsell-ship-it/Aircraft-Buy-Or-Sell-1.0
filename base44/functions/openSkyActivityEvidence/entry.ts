import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

const OPENSKY_STATES_URL = 'https://opensky-network.org/api/states/all';
const FETCH_TIMEOUT = 15000;

function normalizeHex(value: unknown) {
  const hex = String(value || '').trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(hex) ? hex : null;
}

function normalizeRegistration(value: unknown) {
  const reg = String(value || '').trim().toUpperCase();
  return reg || null;
}

async function fetchOpenSky(icao24: string) {
  const url = `${OPENSKY_STATES_URL}?icao24=${encodeURIComponent(icao24)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    // Anonymous development/test access: intentionally no Authorization header.
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ABOS-Aircraft-Verification/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, http_status: response.status, states: [] };
    }
    const payload = await response.json();
    return { ok: true, http_status: response.status, states: Array.isArray(payload?.states) ? payload.states : [] };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const icao24 = normalizeHex(body.icao24);
    const registration = normalizeRegistration(body.registration);

    if (!icao24) {
      return Response.json({
        found: false,
        status: 'UNKNOWN',
        reason: 'icao24 required',
        source: 'opensky_network',
      }, { status: 400 });
    }

    const result = await fetchOpenSky(icao24);
    if (!result.ok) {
      return Response.json({
        found: false,
        status: 'UNKNOWN',
        reason: `OpenSky HTTP ${result.http_status}`,
        source: 'opensky_network',
        icao24,
        registration,
        observed_at: new Date().toISOString(),
      });
    }

    const state = result.states[0] || null;
    const observedAt = new Date().toISOString();

    if (!state) {
      return Response.json({
        found: false,
        status: 'UNKNOWN',
        meaning: 'No OpenSky observation was returned for this aircraft at query time.',
        source: 'opensky_network',
        icao24,
        registration,
        observed_at: observedAt,
      });
    }

    const stateRegistration = normalizeRegistration(state[1]);
    return Response.json({
      found: true,
      status: 'OBSERVED',
      source: 'opensky_network',
      source_role: 'activity_evidence',
      icao24: normalizeHex(state[0]) || icao24,
      registration: stateRegistration || registration,
      callsign: state[1] ? String(state[1]).trim() : null,
      origin_country: state[2] ?? null,
      time_position: state[3] ?? null,
      last_contact: state[4] ?? null,
      longitude: state[5] ?? null,
      latitude: state[6] ?? null,
      baro_altitude_m: state[7] ?? null,
      on_ground: state[8] ?? null,
      velocity_mps: state[9] ?? null,
      true_track_deg: state[10] ?? null,
      vertical_rate_mps: state[11] ?? null,
      geo_altitude_m: state[13] ?? null,
      squawk: state[14] ?? null,
      position_source: state[15] ?? null,
      observed_at: observedAt,
      evidence: {
        type: 'aircraft_activity_observation',
        source: 'OpenSky Network',
        source_url: urlForEvidence(icao24),
        collected_at: observedAt,
      },
    });
  } catch (error) {
    return Response.json({
      found: false,
      status: 'UNKNOWN',
      source: 'opensky_network',
      error: error?.message || String(error),
    }, { status: 200 });
  }
});

function urlForEvidence(icao24: string) {
  return `${OPENSKY_STATES_URL}?icao24=${encodeURIComponent(icao24)}`;
}
