// OpenSky Network API proxy — anonymous access.
// Actions:
//   action="state"   params: { icao24 }           → live position/altitude/velocity
//   action="flights" params: { icao24, days=7 }   → recent flights (history)
//   action="track"   params: { icao24 }           → trajectory waypoints
//
// If OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET are set, authenticated OAuth2
// client-credentials flow is used automatically (higher rate limits).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENSKY_BASE = "https://opensky-network.org/api";
const TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const id = Deno.env.get("OPENSKY_CLIENT_ID");
  const secret = Deno.env.get("OPENSKY_CLIENT_SECRET");
  if (!id || !secret) return null; // anonymous

  if (cachedToken && Date.now() < cachedTokenExpiry - 30_000) return cachedToken;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`OpenSky auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExpiry = Date.now() + (data.expires_in || 1800) * 1000;
  return cachedToken;
}

async function openSkyFetch(path) {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${OPENSKY_BASE}${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`OpenSky ${res.status}: ${await res.text()}`);
  return res.json();
}

// Convert raw state array → named object (per OpenSky StateVector spec)
function parseState(arr) {
  if (!Array.isArray(arr)) return null;
  return {
    icao24: arr[0],
    callsign: arr[1]?.trim() || null,
    origin_country: arr[2],
    time_position: arr[3],
    last_contact: arr[4],
    longitude: arr[5],
    latitude: arr[6],
    baro_altitude: arr[7],
    on_ground: arr[8],
    velocity: arr[9],
    true_track: arr[10],
    vertical_rate: arr[11],
    geo_altitude: arr[13],
    squawk: arr[14],
    category: arr[17],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, icao24, days } = await req.json();
    if (!action) return Response.json({ error: "action required" }, { status: 400 });

    const hex = icao24 ? String(icao24).toLowerCase().trim() : null;

    if (action === "state") {
      if (!hex) return Response.json({ error: "icao24 required" }, { status: 400 });
      const data = await openSkyFetch(`/states/all?icao24=${hex}`);
      const state = data?.states?.[0] ? parseState(data.states[0]) : null;
      return Response.json({ time: data?.time || null, state });
    }

    if (action === "flights") {
      if (!hex) return Response.json({ error: "icao24 required" }, { status: 400 });
      const end = Math.floor(Date.now() / 1000);
      const span = Math.min(Math.max(Number(days) || 7, 1), 30);
      const begin = end - span * 86400;
      const data = await openSkyFetch(`/flights/aircraft?icao24=${hex}&begin=${begin}&end=${end}`);
      return Response.json({ flights: data || [] });
    }

    if (action === "track") {
      if (!hex) return Response.json({ error: "icao24 required" }, { status: 400 });
      const data = await openSkyFetch(`/tracks/all?icao24=${hex}&time=0`);
      return Response.json({ track: data });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("openSky error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});