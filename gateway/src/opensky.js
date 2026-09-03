// OpenSky Network integration for abos-widget-gateway.
//
// Split out of index.js so the OAuth-token / KV-caching logic and the
// /opensky/states request shaping live in one place, independent of how a
// given caller got authorized (widget CORS vs. bearer token) — that
// decision stays in index.js's handleOpenSkyStates.
//
// Required Worker secrets (wrangler secret put ...):
//   OPENSKY_CLIENT_ID
//   OPENSKY_CLIENT_SECRET
//
// Required binding (wrangler.toml):
//   [[kv_namespaces]]
//   binding = "OPENSKY_KV"
//   id = "<create with: wrangler kv:namespace create OPENSKY_KV>"

const TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const STATES_URL = 'https://opensky-network.org/api/states/all';

const TOKEN_KV_KEY = 'opensky_token';
const TOKEN_REFRESH_MARGIN_SEC = 30;

// Common bounding boxes — extend as needed.
const BBOX = {
  czech: { lamin: 48.5, lomin: 12.0, lamax: 51.1, lomax: 18.9 },
  cee: { lamin: 45.0, lomin: 10.0, lamax: 55.0, lomax: 25.0 },
  europe: { lamin: 34.0, lomin: -25.0, lamax: 72.0, lomax: 45.0 },
  conus: { lamin: 24.0, lomin: -125.0, lamax: 50.0, lomax: -66.0 },
};

/**
 * Get a valid Bearer token, using KV as a shared cache across requests/isolates.
 * Falls back to a fresh OAuth2 client_credentials fetch if missing/expired.
 *
 * No lock around the refresh: if several requests race in with an expired
 * token they will each fetch a new one independently. OpenSky's token
 * endpoint tolerates that fine, so this trades a little duplicate work for
 * not needing a KV-based mutex.
 */
async function getOpenSkyToken(env) {
  const cached = await env.OPENSKY_KV.get(TOKEN_KV_KEY, 'json');
  const now = Math.floor(Date.now() / 1000);

  if (cached && cached.expires_at && now < cached.expires_at - TOKEN_REFRESH_MARGIN_SEC) {
    return cached.access_token;
  }

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.OPENSKY_CLIENT_ID,
      client_secret: env.OPENSKY_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenSky token refresh failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const expiresIn = data.expires_in || 1800; // seconds, default 30 min
  const expires_at = now + expiresIn;

  // Store with a TTL slightly beyond expiry so KV doesn't evict early.
  await env.OPENSKY_KV.put(
    TOKEN_KV_KEY,
    JSON.stringify({ access_token: data.access_token, expires_at }),
    { expirationTtl: expiresIn + 60 },
  );

  return data.access_token;
}

/**
 * Raw OpenSky state vector row -> named object.
 * Field order per OpenSky /states/all spec.
 */
function stateRowToObject(row) {
  const [
    icao24,
    callsign,
    origin_country,
    time_position,
    last_contact,
    longitude,
    latitude,
    baro_altitude,
    on_ground,
    velocity,
    true_track,
    vertical_rate,
    sensors,
    geo_altitude,
    squawk,
    spi,
    position_source,
    category,
  ] = row;

  return {
    icao24,
    callsign: callsign ? callsign.trim() : null,
    origin_country,
    time_position,
    last_contact,
    longitude,
    latitude,
    baro_altitude_m: baro_altitude,
    baro_altitude_ft: baro_altitude != null ? Math.round(baro_altitude * 3.281) : null,
    on_ground,
    velocity_ms: velocity,
    velocity_kts: velocity != null ? Math.round(velocity * 1.944 * 10) / 10 : null,
    true_track,
    vertical_rate,
    geo_altitude_m: geo_altitude,
    squawk,
    spi,
    position_source,
    category: category ?? null,
  };
}

/**
 * Runs the actual OpenSky /states/all call and shapes the result.
 * Returns { status, body, cacheable } rather than a Response — the caller
 * (handleOpenSkyStates in index.js) owns CORS headers, so plumbing a bare
 * Response back and forth would mean re-cloning it just to add headers.
 */
async function fetchOpenSkyStates(env, searchParams) {
  const token = await getOpenSkyToken(env);

  const openskyParams = new URLSearchParams();
  openskyParams.set('extended', '1');

  const bboxName = searchParams.get('bbox');
  if (bboxName && BBOX[bboxName]) {
    const b = BBOX[bboxName];
    openskyParams.set('lamin', b.lamin);
    openskyParams.set('lomin', b.lomin);
    openskyParams.set('lamax', b.lamax);
    openskyParams.set('lomax', b.lomax);
  } else if (searchParams.get('lamin')) {
    ['lamin', 'lomin', 'lamax', 'lomax'].forEach((k) => {
      if (searchParams.get(k)) openskyParams.set(k, searchParams.get(k));
    });
  }

  const icao24 = searchParams.get('icao24');
  if (icao24) {
    icao24
      .split(',')
      .map((hex) => hex.trim().toLowerCase())
      .filter((hex) => /^[0-9a-f]{6}$/.test(hex)) // drop anything that isn't a plausible ICAO24 hex address
      .forEach((hex) => openskyParams.append('icao24', hex));
  }

  const resp = await fetch(`${STATES_URL}?${openskyParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (resp.status === 429) {
    const retryAfter = resp.headers.get('X-Rate-Limit-Retry-After-Seconds') || '60';
    return {
      status: 429,
      cacheable: false,
      body: { error: 'rate_limited', retry_after_seconds: Number(retryAfter) },
    };
  }

  if (!resp.ok) {
    const text = await resp.text();
    return {
      status: 502,
      cacheable: false,
      body: { error: 'opensky_upstream_error', status: resp.status, detail: text.slice(0, 300) },
    };
  }

  const data = await resp.json();
  const rawStates = data.states || [];
  const states = rawStates
    .map(stateRowToObject)
    // Airborne + has a position by default; pass ?all=1 to include everything.
    .filter((s) => searchParams.get('all') === '1' || (!s.on_ground && s.latitude != null));

  return {
    status: 200,
    cacheable: true,
    body: { time: data.time, count: states.length, states },
  };
}

export { getOpenSkyToken, stateRowToObject, fetchOpenSkyStates, BBOX };
