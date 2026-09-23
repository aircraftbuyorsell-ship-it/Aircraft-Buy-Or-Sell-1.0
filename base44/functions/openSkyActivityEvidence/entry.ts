import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

const OPENSKY_BASE = 'https://opensky-network.org/api';
const OPENSKY_STATES_URL = `${OPENSKY_BASE}/states/all`;
const OPENSKY_FLIGHTS_URL = `${OPENSKY_BASE}/flights/aircraft`;
const OPENSKY_TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

const FETCH_TIMEOUT = 15000;
const MAX_LOOKBACK_DAYS = 30;
const DEFAULT_LOOKBACK_DAYS = 14;
const DAY_SECONDS = 86400;
const TWO_DAYS_SECONDS = 172800;

function normalizeHex(value: unknown) {
  const hex = String(value || '').trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(hex) ? hex : null;
}

function normalizeRegistration(value: unknown) {
  const reg = String(value || '').trim().toUpperCase();
  return reg || null;
}

async function getOpenSkyToken() {
  const clientId = Deno.env.get('OPENSKY_CLIENT_ID');
  const clientSecret = Deno.env.get('OPENSKY_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(OPENSKY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.access_token || null;
}

async function openSkyFetch(url: string, token: string | null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'ABOS-Aircraft-Verification/1.0',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    const remainingCredits = response.headers.get('X-Rate-Limit-Remaining');

    if (response.status === 404) {
      return {
        ok: true,
        http_status: 404,
        payload: null,
        remaining_credits: remainingCredits ? Number(remainingCredits) : null,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        http_status: response.status,
        payload: null,
        remaining_credits: remainingCredits ? Number(remainingCredits) : null,
      };
    }

    return {
      ok: true,
      http_status: response.status,
      payload: await response.json(),
      remaining_credits: remainingCredits ? Number(remainingCredits) : null,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCurrentState(icao24: string, token: string | null) {
  const url = `${OPENSKY_STATES_URL}?icao24=${encodeURIComponent(icao24)}`;
  const result = await openSkyFetch(url, token);

  if (!result.ok) {
    return {
      ok: false,
      state: null,
      http_status: result.http_status,
      remaining_credits: result.remaining_credits,
      source_url: url,
    };
  }

  const states = Array.isArray(result.payload?.states) ? result.payload.states : [];
  return {
    ok: true,
    state: states[0] || null,
    http_status: result.http_status,
    remaining_credits: result.remaining_credits,
    source_url: url,
  };
}

function normalizeFlight(flight: any, icao24: string) {
  if (!flight || typeof flight !== 'object') return null;

  const firstSeen = Number.isFinite(Number(flight.firstSeen)) ? Number(flight.firstSeen) : null;
  const lastSeen = Number.isFinite(Number(flight.lastSeen)) ? Number(flight.lastSeen) : null;

  return {
    icao24,
    callsign: flight.callsign ? String(flight.callsign).trim() : null,
    first_seen: firstSeen ? new Date(firstSeen * 1000).toISOString() : null,
    last_seen: lastSeen ? new Date(lastSeen * 1000).toISOString() : null,
    first_seen_unix: firstSeen,
    last_seen_unix: lastSeen,
    departure_airport: flight.estDepartureAirport || null,
    arrival_airport: flight.estArrivalAirport || null,
    departure_airport_horiz_distance_m: flight.estDepartureAirportHorizDistance ?? null,
    arrival_airport_horiz_distance_m: flight.estArrivalAirportHorizDistance ?? null,
    departure_airport_vert_distance_m: flight.estDepartureAirportVertDistance ?? null,
    arrival_airport_vert_distance_m: flight.estArrivalAirportVertDistance ?? null,
    departure_airport_candidates: flight.estDepartureAirportCandidates ?? null,
    arrival_airport_candidates: flight.estArrivalAirportCandidates ?? null,
    raw: flight,
  };
}

async function fetchHistoricalFlights(
  icao24: string,
  token: string,
  lookbackDays: number,
) {
  const now = Math.floor(Date.now() / 1000);

  // OpenSky flight records are batch-generated and available only for the
  // previous day or earlier. Start at the last completed UTC day.
  const endOfPreviousDay = Math.floor(now / DAY_SECONDS) * DAY_SECONDS - 1;
  const earliest = endOfPreviousDay - Math.max(1, lookbackDays) * DAY_SECONDS;

  const flights: any[] = [];
  let remainingCredits: number | null = null;
  let windowsChecked = 0;

  // The API accepts at most a 2-day interval. Walk backwards and stop at the
  // first window containing a flight because the caller wants latest activity.
  for (let end = endOfPreviousDay; end > earliest; end -= TWO_DAYS_SECONDS) {
    const begin = Math.max(earliest, end - TWO_DAYS_SECONDS + 1);
    const url =
      `${OPENSKY_FLIGHTS_URL}?icao24=${encodeURIComponent(icao24)}&begin=${begin}&end=${end}`;

    const result = await openSkyFetch(url, token);
    windowsChecked += 1;
    if (result.remaining_credits !== null) remainingCredits = result.remaining_credits;

    if (!result.ok) {
      return {
        ok: false,
        flights: [],
        latest_flight: null,
        windows_checked: windowsChecked,
        remaining_credits: remainingCredits,
        http_status: result.http_status,
        source_url: url,
      };
    }

    if (Array.isArray(result.payload) && result.payload.length) {
      const normalized = result.payload
        .map((flight: any) => normalizeFlight(flight, icao24))
        .filter(Boolean)
        .sort((a: any, b: any) => (b.last_seen_unix || 0) - (a.last_seen_unix || 0));

      flights.push(...normalized);

      return {
        ok: true,
        flights: normalized,
        latest_flight: normalized[0] || null,
        windows_checked: windowsChecked,
        remaining_credits: remainingCredits,
        source_url: url,
      };
    }
  }

  return {
    ok: true,
    flights: [],
    latest_flight: null,
    windows_checked: windowsChecked,
    remaining_credits: remainingCredits,
    source_url: `${OPENSKY_FLIGHTS_URL}?icao24=${encodeURIComponent(icao24)}`,
  };
}

function stateToEvidence(state: any, icao24: string, registration: string | null, sourceUrl: string) {
  const timePosition = state[3] ?? null;
  const lastContact = state[4] ?? null;
  const observedUnix = lastContact ?? timePosition ?? null;

  return {
    found: true,
    status: 'OBSERVED',
    source: 'opensky_network',
    source_role: 'activity_evidence',
    icao24: normalizeHex(state[0]) || icao24,
    registration,
    callsign: state[1] ? String(state[1]).trim() : null,
    origin_country: state[2] ?? null,
    time_position: timePosition,
    last_contact: lastContact,
    last_observed_at: observedUnix ? new Date(observedUnix * 1000).toISOString() : null,
    longitude: state[5] ?? null,
    latitude: state[6] ?? null,
    baro_altitude_m: state[7] ?? null,
    on_ground: state[8] ?? null,
    velocity_mps: state[9] ?? null,
    true_track_deg: state[10] ?? null,
    vertical_rate_mps: state[11] ?? null,
    geo_altitude_m: state[13] ?? null,
    squawk: state[14] ?? null,
    position_source: state[16] ?? null,
    observed_at: new Date().toISOString(),
    evidence: {
      type: 'aircraft_activity_observation',
      source: 'OpenSky Network',
      source_url: sourceUrl,
      collected_at: new Date().toISOString(),
    },
  };
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
        status: 'REQUIRES_IDENTIFIER',
        reason: 'icao24 required',
        source: 'opensky_network',
      }, { status: 400 });
    }

    const requestedLookback = Number(body.lookback_days ?? DEFAULT_LOOKBACK_DAYS);
    const lookbackDays = Math.min(
      MAX_LOOKBACK_DAYS,
      Math.max(1, Number.isFinite(requestedLookback) ? Math.floor(requestedLookback) : DEFAULT_LOOKBACK_DAYS),
    );
    const historical = body.historical !== false;

    const token = await getOpenSkyToken();
    if (historical && !token) {
      return Response.json({
        found: false,
        status: 'REQUIRES_AUTHENTICATED_ACCESS',
        customer_status: 'REQUIRES_DOCUMENTATION',
        meaning: 'Historical OpenSky flight records require authenticated API access.',
        source: 'opensky_network',
        icao24,
        registration,
        lookback_days: lookbackDays,
      });
    }

    // First check the live endpoint. An active/current observation is already
    // the strongest possible "last observed activity" for this source.
    const current = await fetchCurrentState(icao24, token);
    if (!current.ok) {
      return Response.json({
        found: false,
        status: 'SOURCE_ERROR',
        customer_status: 'REQUIRES_DOCUMENTATION',
        reason: `OpenSky HTTP ${current.http_status}`,
        source: 'opensky_network',
        icao24,
        registration,
        historical_available: Boolean(token),
        source_url: current.source_url,
      }, { status: 200 });
    }

    if (current.state) {
      const evidence = stateToEvidence(current.state, icao24, registration, current.source_url);
      return Response.json({
        ...evidence,
        activity_basis: 'current_observation',
        historical_checked: false,
        historical_reason: 'Current OpenSky observation is newer than the historical flight archive.',
        remaining_credits: current.remaining_credits,
        customer_statement: 'OpenSky currently has an observation for this aircraft; this is the latest activity identified from this source at query time.',
        coverage_note: 'Absence from OpenSky does not establish that an aircraft was inactive because network coverage and transponder/reporting conditions vary.',
      });
    }

    if (!historical) {
      return Response.json({
        found: false,
        status: 'NO_CURRENT_OBSERVATION',
        customer_status: 'NO MATCHING RECORD FOUND',
        meaning: 'No current OpenSky observation was returned for this aircraft at query time.',
        source: 'opensky_network',
        icao24,
        registration,
        historical_checked: false,
        customer_statement: 'No current OpenSky observation was identified at query time.',
        coverage_note: 'This does not establish that the aircraft was inactive.',
      });
    }

    const history = await fetchHistoricalFlights(icao24, token as string, lookbackDays);

    if (!history.ok) {
      return Response.json({
        found: false,
        status: 'SOURCE_ERROR',
        customer_status: 'REQUIRES_DOCUMENTATION',
        reason: `OpenSky historical HTTP ${history.http_status}`,
        source: 'opensky_network',
        icao24,
        registration,
        historical_checked: true,
        lookback_days: lookbackDays,
        windows_checked: history.windows_checked,
        remaining_credits: history.remaining_credits,
        source_url: history.source_url,
      }, { status: 200 });
    }

    if (!history.latest_flight) {
      return Response.json({
        found: false,
        status: 'NO_HISTORICAL_OBSERVATION_IDENTIFIED',
        customer_status: 'NO MATCHING RECORD FOUND',
        source: 'opensky_network',
        icao24,
        registration,
        historical_checked: true,
        lookback_days: lookbackDays,
        windows_checked: history.windows_checked,
        remaining_credits: history.remaining_credits,
        source_url: history.source_url,
        customer_statement: `No OpenSky flight record was identified in the reviewed ${lookbackDays}-day historical window.`,
        coverage_note: 'This is not evidence that the aircraft was inactive; an aircraft may be outside OpenSky coverage or may not provide position data to the network.',
      });
    }

    return Response.json({
      found: true,
      status: 'OBSERVED',
      customer_status: 'CORROBORATED',
      source: 'opensky_network',
      source_role: 'historical_activity_evidence',
      icao24,
      registration,
      last_observed_at: history.latest_flight.last_seen,
      last_observed_unix: history.latest_flight.last_seen_unix,
      latest_flight: history.latest_flight,
      historical_flights: history.flights,
      historical_checked: true,
      lookback_days: lookbackDays,
      windows_checked: history.windows_checked,
      remaining_credits: history.remaining_credits,
      source_url: history.source_url,
      evidence: {
        type: 'aircraft_historical_flight',
        source: 'OpenSky Network',
        source_url: history.source_url,
        collected_at: new Date().toISOString(),
        evidence_date: history.latest_flight.last_seen,
      },
      customer_statement: `Last OpenSky flight activity identified: ${history.latest_flight.last_seen || 'date not available'}.`,
      coverage_note: 'OpenSky records represent activity observed by its receiver network. No later record in the reviewed period does not prove that the aircraft did not fly.',
    });
  } catch (error) {
    return Response.json({
      found: false,
      status: 'SOURCE_ERROR',
      customer_status: 'REQUIRES_DOCUMENTATION',
      source: 'opensky_network',
      error: error?.message || String(error),
    }, { status: 200 });
  }
});
