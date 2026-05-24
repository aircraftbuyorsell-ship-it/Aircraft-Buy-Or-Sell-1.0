// Aircraft live tracking proxy — primary: adsb.lol (free, no key), fallback: OpenSky OAuth2
// Actions:
//   action="state"       params: { icao24 }           → live position/altitude/velocity + fuel/ops estimates
//   action="flights"     params: { icao24, days=7 }   → recent flights (history)
//   action="track"       params: { icao24 }           → trajectory waypoints
//   action="inflight"    params: { icao24 }            → current flight ops (fuel burn, endurance)
//   action="map_states"  params: { lamin, lomin, lamax, lomax, allow_heavy, limit } → area sweep + enrichment
//   action="history_states" params: { lamin, lomin, lamax, lomax, ts, allow_heavy, limit } → archived or live fallback

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ADSBIOL_BASE = "https://api.adsb.lol/v2";
const OPENSKY_BASE = "https://opensky-network.org/api";
const TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const FETCH_TIMEOUT = 12000;
const RESERVE_MIN = 45;

// ─── ADSB.lol helpers ────────────────────────────────────────────────────────

async function adsbFetch(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${ADSBIOL_BASE}${path}`, {
      headers: { "User-Agent": "ABOS-Aviation-Platform/2.0" },
      signal: ctrl.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`adsb.lol ${res.status}`);
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("ADS-B request timed out — try again shortly");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Convert adsb.lol aircraft object → OpenSky-compatible state object
function parseAdsbAc(ac) {
  if (!ac || !ac.hex) return null;
  const lat = ac.lat ?? null;
  const lon = ac.lon ?? null;
  if (lat == null || lon == null) return null;

  // alt_baro is in feet for adsb.lol; convert to metres
  const altFt = typeof ac.alt_baro === "number" ? ac.alt_baro : null;
  const altM = altFt != null ? altFt * 0.3048 : null;

  // gs in knots → m/s
  const speedKt = typeof ac.gs === "number" ? ac.gs : null;
  const speedMs = speedKt != null ? speedKt * 0.514444 : null;

  // baro_rate in ft/min → m/s
  const vrateFtMin = typeof ac.baro_rate === "number" ? ac.baro_rate : null;
  const vrateMs = vrateFtMin != null ? vrateFtMin * 0.00508 : null;

  // category: adsb.lol uses strings like "A1"–"A7", "B1"–"B4", "C1"–"C7"
  let category = 0;
  if (ac.category) {
    const c = String(ac.category);
    if (c.startsWith("A")) category = parseInt(c[1]) || 0;
    else if (c.startsWith("B")) category = 8; // rotorcraft-ish
    else if (c.startsWith("C")) category = 9; // glider-ish
  }

  return {
    icao24: ac.hex.toLowerCase(),
    callsign: (ac.flight || ac.r || "").trim() || null,
    origin_country: ac.ownOp || null,
    time_position: ac.seen_pos != null ? Math.floor(Date.now() / 1000) - ac.seen_pos : null,
    last_contact: ac.seen != null ? Math.floor(Date.now() / 1000) - ac.seen : null,
    longitude: lon,
    latitude: lat,
    baro_altitude: altM,
    on_ground: ac.alt_baro === "ground" || altFt === 0,
    velocity: speedMs,
    true_track: typeof ac.track === "number" ? ac.track : null,
    vertical_rate: vrateMs,
    geo_altitude: typeof ac.alt_geom === "number" ? ac.alt_geom * 0.3048 : altM,
    squawk: ac.squawk || null,
    position_source: 0,
    category,
    // extra adsb.lol fields
    registration: ac.r || null,
    aircraft_type: ac.t || null,
  };
}

// Fetch aircraft in a bounding box from adsb.lol using lat/lon/radius point query
// adsb.lol doesn't support raw bbox, but supports point+radius and returns all aircraft
async function adsbFetchBbox(lamin, lamax, lomin, lomax, limit = 200) {
  // Compute centre + radius from bbox
  const clat = (lamin + lamax) / 2;
  const clon = (lomin + lomax) / 2;
  // Rough radius in nm: half diagonal of bbox
  const dLat = Math.abs(lamax - lamin) * 60; // nm
  const dLon = Math.abs(lomax - lomin) * 60 * Math.cos(clat * Math.PI / 180);
  const radius = Math.min(Math.ceil(Math.sqrt(dLat * dLat + dLon * dLon) / 2) + 10, 250);

  const data = await adsbFetch(`/lat/${clat.toFixed(4)}/lon/${clon.toFixed(4)}/dist/${radius}`);
  if (!data?.ac) return [];

  return data.ac
    .map(parseAdsbAc)
    .filter((s) => {
      if (!s) return false;
      // Filter to bbox
      return s.latitude >= lamin && s.latitude <= lamax &&
             s.longitude >= lomin && s.longitude <= lomax;
    })
    .slice(0, limit);
}

// Fetch single aircraft by ICAO24 hex from adsb.lol
async function adsbFetchHex(hex) {
  const data = await adsbFetch(`/hex/${hex}`);
  if (!data?.ac?.length) return null;
  return parseAdsbAc(data.ac[0]);
}

// ─── OpenSky fallback (OAuth2) ────────────────────────────────────────────────

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const clientId = Deno.env.get("OPENSKY_CLIENT_ID");
  const clientSecret = Deno.env.get("OPENSKY_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 30000) return cachedToken;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn("OpenSky auth failed:", res.status);
      return null;
    }
    const data = await res.json();
    cachedToken = data.access_token;
    cachedTokenExpiry = now + (data.expires_in || 1800) * 1000;
    return cachedToken;
  } catch (e) {
    console.warn("OpenSky auth error:", e.message);
    return null;
  }
}

async function openSkyFetch(path) {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${OPENSKY_BASE}${path}`, { headers, signal: ctrl.signal });
    if (res.status === 404) return null;
    if (res.status === 429) throw new Error("OpenSky rate limit — try again in a minute");
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("OpenSky request timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function parseOpenSkyState(arr) {
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
    position_source: arr[16],
    category: arr[17],
  };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function isValidHex(s) {
  return typeof s === "string" && /^[0-9a-f]{6}$/.test(s);
}

async function resolveNNumberToHex(base44, raw) {
  if (!raw) return null;
  const cleaned = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const nNum = cleaned.startsWith("N") ? cleaned.slice(1) : cleaned;
  if (!nNum) return null;
  try {
    const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNum }, "", 1);
    const hex = recs[0]?.mode_s_hex;
    if (hex && /^[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  } catch (e) {
    console.warn("N-number resolve failed:", e.message);
  }
  return null;
}

// ─── Fuel / endurance estimates ───────────────────────────────────────────────

const FUEL_SPECS = {
  "cessna 152": { cruise_gph: 6.0, tank_gal: 26, ac_class: "GA-single" },
  "cessna 172": { cruise_gph: 8.5, tank_gal: 53, ac_class: "GA-single" },
  "cessna 182": { cruise_gph: 12.0, tank_gal: 65, ac_class: "GA-single" },
  "cessna 206": { cruise_gph: 15.0, tank_gal: 92, ac_class: "GA-single" },
  "cessna 210": { cruise_gph: 16.0, tank_gal: 90, ac_class: "GA-single" },
  "cessna 208": { cruise_gph: 60.0, tank_gal: 335, ac_class: "turboprop-single" },
  "cirrus sr20": { cruise_gph: 8.5, tank_gal: 56, ac_class: "GA-single" },
  "cirrus sr22": { cruise_gph: 10.5, tank_gal: 92, ac_class: "GA-single" },
  "cirrus sr": { cruise_gph: 9.5, tank_gal: 70, ac_class: "GA-single" },
  "piper pa-28": { cruise_gph: 9.0, tank_gal: 50, ac_class: "GA-single" },
  "piper pa-32": { cruise_gph: 14.0, tank_gal: 84, ac_class: "GA-single" },
  "piper pa-46": { cruise_gph: 26.0, tank_gal: 120, ac_class: "GA-single" },
  "diamond da40": { cruise_gph: 6.5, tank_gal: 40, ac_class: "GA-single" },
  "diamond da20": { cruise_gph: 5.5, tank_gal: 24, ac_class: "GA-single" },
  "mooney m20": { cruise_gph: 10.0, tank_gal: 64, ac_class: "GA-single" },
  "beechcraft b36": { cruise_gph: 15.0, tank_gal: 74, ac_class: "GA-single" },
  "beechcraft a36": { cruise_gph: 15.0, tank_gal: 74, ac_class: "GA-single" },
  "socata tbm": { cruise_gph: 55.0, tank_gal: 282, ac_class: "turboprop-single" },
  "tbm 700": { cruise_gph: 48.0, tank_gal: 282, ac_class: "turboprop-single" },
  "tbm 850": { cruise_gph: 52.0, tank_gal: 282, ac_class: "turboprop-single" },
  "tbm 900": { cruise_gph: 55.0, tank_gal: 282, ac_class: "turboprop-single" },
  "tbm 930": { cruise_gph: 58.0, tank_gal: 282, ac_class: "turboprop-single" },
  "pilatus pc-12": { cruise_gph: 65.0, tank_gal: 401, ac_class: "turboprop-single" },
  "pilatus pc-6": { cruise_gph: 18.0, tank_gal: 130, ac_class: "turboprop-single" },
  "cessna 310": { cruise_gph: 22.0, tank_gal: 102, ac_class: "GA-twin" },
  "cessna 340": { cruise_gph: 28.0, tank_gal: 163, ac_class: "GA-twin" },
  "cessna 414": { cruise_gph: 30.0, tank_gal: 163, ac_class: "GA-twin" },
  "cessna 421": { cruise_gph: 32.0, tank_gal: 163, ac_class: "GA-twin" },
  "piper pa-34": { cruise_gph: 22.0, tank_gal: 107, ac_class: "GA-twin" },
  "piper pa-44": { cruise_gph: 20.0, tank_gal: 110, ac_class: "GA-twin" },
  "piper pa-31": { cruise_gph: 29.0, tank_gal: 200, ac_class: "GA-twin" },
  "piper pa-23": { cruise_gph: 18.0, tank_gal: 90, ac_class: "GA-twin" },
  "beechcraft b55": { cruise_gph: 22.0, tank_gal: 112, ac_class: "GA-twin" },
  "beechcraft b58": { cruise_gph: 26.0, tank_gal: 166, ac_class: "GA-twin" },
  "beechcraft b60": { cruise_gph: 30.0, tank_gal: 166, ac_class: "GA-twin" },
  "beechcraft b76": { cruise_gph: 18.0, tank_gal: 100, ac_class: "GA-twin" },
  "diamond da42": { cruise_gph: 9.5, tank_gal: 53, ac_class: "GA-twin" },
  "king air 90": { cruise_gph: 70.0, tank_gal: 384, ac_class: "turboprop-twin" },
  "king air c90": { cruise_gph: 70.0, tank_gal: 384, ac_class: "turboprop-twin" },
  "king air 200": { cruise_gph: 80.0, tank_gal: 544, ac_class: "turboprop-twin" },
  "king air b200": { cruise_gph: 80.0, tank_gal: 544, ac_class: "turboprop-twin" },
  "king air 350": { cruise_gph: 90.0, tank_gal: 544, ac_class: "turboprop-twin" },
  "beechcraft 1900": { cruise_gph: 130.0, tank_gal: 665, ac_class: "turboprop-twin" },
  "cessna conquest": { cruise_gph: 55.0, tank_gal: 290, ac_class: "turboprop-twin" },
  "piper cheyenne": { cruise_gph: 50.0, tank_gal: 260, ac_class: "turboprop-twin" },
  "mitsubishi mu-2": { cruise_gph: 75.0, tank_gal: 370, ac_class: "turboprop-twin" },
  "cessna citation cj1": { cruise_gph: 75.0, tank_gal: 441, ac_class: "bizjet-light" },
  "cessna citation cj2": { cruise_gph: 85.0, tank_gal: 551, ac_class: "bizjet-light" },
  "cessna citation cj3": { cruise_gph: 100.0, tank_gal: 688, ac_class: "bizjet-light" },
  "cessna citation cj4": { cruise_gph: 110.0, tank_gal: 690, ac_class: "bizjet-light" },
  "cessna citation m2": { cruise_gph: 80.0, tank_gal: 441, ac_class: "bizjet-light" },
  "cessna citation mustang": { cruise_gph: 60.0, tank_gal: 441, ac_class: "bizjet-vlight" },
  "cessna citation encore": { cruise_gph: 95.0, tank_gal: 688, ac_class: "bizjet-light" },
  "cessna citation excel": { cruise_gph: 130.0, tank_gal: 872, ac_class: "bizjet-mid" },
  "cessna citation xls": { cruise_gph: 130.0, tank_gal: 872, ac_class: "bizjet-mid" },
  "cessna citation x": { cruise_gph: 240.0, tank_gal: 6502, ac_class: "bizjet-super" },
  "embraer phenom 100": { cruise_gph: 70.0, tank_gal: 570, ac_class: "bizjet-vlight" },
  "embraer phenom 300": { cruise_gph: 100.0, tank_gal: 570, ac_class: "bizjet-light" },
  "embraer legacy 450": { cruise_gph: 175.0, tank_gal: 2000, ac_class: "bizjet-mid" },
  "embraer legacy 500": { cruise_gph: 190.0, tank_gal: 2200, ac_class: "bizjet-mid" },
  "embraer legacy 600": { cruise_gph: 220.0, tank_gal: 3000, ac_class: "bizjet-large" },
  "embraer lineage": { cruise_gph: 400.0, tank_gal: 7000, ac_class: "bizjet-large" },
  "learjet 31": { cruise_gph: 100.0, tank_gal: 800, ac_class: "bizjet-light" },
  "learjet 40": { cruise_gph: 110.0, tank_gal: 900, ac_class: "bizjet-light" },
  "learjet 45": { cruise_gph: 120.0, tank_gal: 1100, ac_class: "bizjet-mid" },
  "learjet 60": { cruise_gph: 165.0, tank_gal: 1260, ac_class: "bizjet-mid" },
  "learjet 70": { cruise_gph: 125.0, tank_gal: 1000, ac_class: "bizjet-mid" },
  "learjet 75": { cruise_gph: 140.0, tank_gal: 1260, ac_class: "bizjet-mid" },
  "hawker 400": { cruise_gph: 100.0, tank_gal: 720, ac_class: "bizjet-light" },
  "hawker 800": { cruise_gph: 165.0, tank_gal: 1407, ac_class: "bizjet-mid" },
  "hawker 900": { cruise_gph: 165.0, tank_gal: 1407, ac_class: "bizjet-mid" },
  "hawker 4000": { cruise_gph: 200.0, tank_gal: 2500, ac_class: "bizjet-super" },
  "bombardier challenger 300": { cruise_gph: 190.0, tank_gal: 8600, ac_class: "bizjet-super" },
  "bombardier challenger 350": { cruise_gph: 195.0, tank_gal: 8600, ac_class: "bizjet-super" },
  "bombardier challenger 600": { cruise_gph: 220.0, tank_gal: 8600, ac_class: "bizjet-large" },
  "bombardier global 5000": { cruise_gph: 260.0, tank_gal: 17800, ac_class: "bizjet-large" },
  "bombardier global 6000": { cruise_gph: 275.0, tank_gal: 17800, ac_class: "bizjet-large" },
  "bombardier global 7500": { cruise_gph: 300.0, tank_gal: 21500, ac_class: "bizjet-large" },
  "gulfstream g150": { cruise_gph: 130.0, tank_gal: 1319, ac_class: "bizjet-mid" },
  "gulfstream g200": { cruise_gph: 165.0, tank_gal: 2100, ac_class: "bizjet-super" },
  "gulfstream g280": { cruise_gph: 175.0, tank_gal: 2300, ac_class: "bizjet-super" },
  "gulfstream g350": { cruise_gph: 200.0, tank_gal: 13619, ac_class: "bizjet-large" },
  "gulfstream g450": { cruise_gph: 230.0, tank_gal: 13619, ac_class: "bizjet-large" },
  "gulfstream g500": { cruise_gph: 260.0, tank_gal: 16100, ac_class: "bizjet-large" },
  "gulfstream g550": { cruise_gph: 290.0, tank_gal: 15500, ac_class: "bizjet-large" },
  "gulfstream g600": { cruise_gph: 290.0, tank_gal: 16100, ac_class: "bizjet-large" },
  "gulfstream g650": { cruise_gph: 310.0, tank_gal: 17700, ac_class: "bizjet-large" },
  "gulfstream g700": { cruise_gph: 320.0, tank_gal: 20000, ac_class: "bizjet-large" },
  "dassault falcon 2000": { cruise_gph: 210.0, tank_gal: 9000, ac_class: "bizjet-large" },
  "dassault falcon 7x": { cruise_gph: 240.0, tank_gal: 14500, ac_class: "bizjet-large" },
  "dassault falcon 8x": { cruise_gph: 240.0, tank_gal: 14500, ac_class: "bizjet-large" },
  "dassault falcon 900": { cruise_gph: 250.0, tank_gal: 10800, ac_class: "bizjet-large" },
  "airbus a318": { cruise_gph: 650.0, tank_gal: 26070, ac_class: "airliner-narrow" },
  "airbus a319": { cruise_gph: 680.0, tank_gal: 26070, ac_class: "airliner-narrow" },
  "airbus a320": { cruise_gph: 750.0, tank_gal: 27200, ac_class: "airliner-narrow" },
  "airbus a321": { cruise_gph: 820.0, tank_gal: 27200, ac_class: "airliner-narrow" },
  "airbus a330": { cruise_gph: 1100.0, tank_gal: 55200, ac_class: "airliner-wide" },
  "airbus a340": { cruise_gph: 1300.0, tank_gal: 70000, ac_class: "airliner-wide" },
  "airbus a350": { cruise_gph: 950.0, tank_gal: 59000, ac_class: "airliner-wide" },
  "airbus a380": { cruise_gph: 1550.0, tank_gal: 85470, ac_class: "airliner-heavy" },
  "boeing 717": { cruise_gph: 600.0, tank_gal: 4500, ac_class: "airliner-narrow" },
  "boeing 737": { cruise_gph: 760.0, tank_gal: 6875, ac_class: "airliner-narrow" },
  "boeing 747": { cruise_gph: 1650.0, tank_gal: 63705, ac_class: "airliner-heavy" },
  "boeing 757": { cruise_gph: 950.0, tank_gal: 16700, ac_class: "airliner-narrow" },
  "boeing 767": { cruise_gph: 1200.0, tank_gal: 24140, ac_class: "airliner-wide" },
  "boeing 777": { cruise_gph: 900.0, tank_gal: 45220, ac_class: "airliner-wide" },
  "boeing 787": { cruise_gph: 650.0, tank_gal: 33340, ac_class: "airliner-wide" },
  "mcdonnell douglas md": { cruise_gph: 800.0, tank_gal: 20000, ac_class: "airliner-narrow" },
  "bombardier q400": { cruise_gph: 120.0, tank_gal: 1765, ac_class: "regional-prop" },
  "atr 42": { cruise_gph: 80.0, tank_gal: 1140, ac_class: "regional-prop" },
  "atr 72": { cruise_gph: 100.0, tank_gal: 1500, ac_class: "regional-prop" },
  "embraer erj 135": { cruise_gph: 230.0, tank_gal: 3800, ac_class: "regional-jet" },
  "embraer erj 145": { cruise_gph: 280.0, tank_gal: 3800, ac_class: "regional-jet" },
  "embraer e170": { cruise_gph: 360.0, tank_gal: 6960, ac_class: "airliner-narrow" },
  "embraer e175": { cruise_gph: 370.0, tank_gal: 6960, ac_class: "airliner-narrow" },
  "embraer e190": { cruise_gph: 400.0, tank_gal: 7000, ac_class: "airliner-narrow" },
  "embraer e195": { cruise_gph: 420.0, tank_gal: 7000, ac_class: "airliner-narrow" },
  "bombardier crj 200": { cruise_gph: 200.0, tank_gal: 2200, ac_class: "regional-jet" },
  "bombardier crj 700": { cruise_gph: 300.0, tank_gal: 4500, ac_class: "regional-jet" },
  "bombardier crj 900": { cruise_gph: 330.0, tank_gal: 5900, ac_class: "regional-jet" },
  "douglas dc-3": { cruise_gph: 70.0, tank_gal: 804, ac_class: "cargo-legacy" },
  "lockheed l-382": { cruise_gph: 600.0, tank_gal: 8600, ac_class: "cargo-heavy" },
  "robinson r22": { cruise_gph: 8.0, tank_gal: 19, ac_class: "heli-light" },
  "robinson r44": { cruise_gph: 14.0, tank_gal: 39, ac_class: "heli-light" },
  "robinson r66": { cruise_gph: 8.5, tank_gal: 73, ac_class: "heli-light" },
  "bell 206": { cruise_gph: 22.0, tank_gal: 91, ac_class: "heli-mid" },
  "bell 407": { cruise_gph: 52.0, tank_gal: 218, ac_class: "heli-mid" },
  "bell 429": { cruise_gph: 65.0, tank_gal: 230, ac_class: "heli-mid" },
  "airbus h125": { cruise_gph: 22.0, tank_gal: 148, ac_class: "heli-mid" },
  "airbus h130": { cruise_gph: 24.0, tank_gal: 148, ac_class: "heli-mid" },
  "airbus h135": { cruise_gph: 30.0, tank_gal: 158, ac_class: "heli-mid" },
  "airbus h145": { cruise_gph: 38.0, tank_gal: 200, ac_class: "heli-mid" },
  "airbus h160": { cruise_gph: 70.0, tank_gal: 380, ac_class: "heli-heavy" },
  "airbus h175": { cruise_gph: 120.0, tank_gal: 650, ac_class: "heli-heavy" },
  "airbus h215": { cruise_gph: 180.0, tank_gal: 700, ac_class: "heli-heavy" },
  "airbus h225": { cruise_gph: 200.0, tank_gal: 900, ac_class: "heli-heavy" },
  "sikorsky s-76": { cruise_gph: 125.0, tank_gal: 534, ac_class: "heli-heavy" },
  "sikorsky s-92": { cruise_gph: 220.0, tank_gal: 1398, ac_class: "heli-heavy" },
  "leonardo aw109": { cruise_gph: 55.0, tank_gal: 240, ac_class: "heli-mid" },
  "leonardo aw139": { cruise_gph: 140.0, tank_gal: 720, ac_class: "heli-heavy" },
};

const CATEGORY_DEFAULTS = {
  2: { cruise_gph: 9, tank_gal: 56, ac_class: "GA-single" },
  3: { cruise_gph: 9, tank_gal: 56, ac_class: "GA-single" },
  4: { cruise_gph: 50, tank_gal: 450, ac_class: "bizjet-light" },
  5: { cruise_gph: 140, tank_gal: 1260, ac_class: "bizjet-mid" },
  6: { cruise_gph: 140, tank_gal: 1260, ac_class: "bizjet-mid" },
  30: { cruise_gph: 800, tank_gal: 30000, ac_class: "airliner-wide" },
  36: { cruise_gph: 20, tank_gal: 80, ac_class: "heli-light" },
  37: { cruise_gph: 20, tank_gal: 80, ac_class: "heli-light" },
  38: { cruise_gph: 55, tank_gal: 250, ac_class: "heli-mid" },
  40: { cruise_gph: 130, tank_gal: 600, ac_class: "heli-heavy" },
};

function getFuelSpecs(typeAircraft) {
  if (!typeAircraft) return null;
  const lower = String(typeAircraft).toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim();
  if (FUEL_SPECS[lower]) return { ...FUEL_SPECS[lower], match: "exact", key: lower };

  const tokens = lower.split(/\s+/);
  if (tokens.length >= 2) {
    const prefix = `${tokens[0]} ${tokens[1]}`;
    if (FUEL_SPECS[prefix]) return { ...FUEL_SPECS[prefix], match: "prefix", key: prefix };
  }

  let best = null;
  for (const [key, spec] of Object.entries(FUEL_SPECS)) {
    if (lower.includes(key) && (!best || key.length > best.key.length)) best = { spec, key };
  }
  return best ? { ...best.spec, match: "substring", key: best.key } : null;
}

function estimateFuelConsumption(state, faaData) {
  if (!state || state.on_ground) return null;

  const alt = state.baro_altitude ?? 0;
  const speed = state.velocity ?? 0;
  const vrate = state.vertical_rate ?? 0;
  const faaType = faaData?.type_aircraft || state.aircraft_type || null;

  let baseCruiseGPH = null;
  let specSource = "default_fallback";
  let oemKey = null;
  let acClass = null;

  const spec = getFuelSpecs(faaType);
  if (spec) {
    baseCruiseGPH = spec.cruise_gph;
    specSource = `oem_${spec.match}`;
    oemKey = spec.key;
    acClass = spec.ac_class;
  }

  if (baseCruiseGPH == null) {
    const mfr = String(faaData?.mfr_mdl_code || "").toLowerCase();
    const cs = String(state.callsign || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    let best = null;
    for (const [key, item] of Object.entries(FUEL_SPECS)) {
      const flat = key.replace(/[\s-]/g, "");
      if ((cs.includes(flat) || mfr.includes(flat)) && (!best || key.length > best.key.length)) best = { spec: item, key };
    }
    if (best) {
      baseCruiseGPH = best.spec.cruise_gph;
      specSource = "oem_mfr_code";
      oemKey = best.key;
      acClass = best.spec.ac_class;
    }
  }

  if (baseCruiseGPH == null) {
    const catSpec = CATEGORY_DEFAULTS[state.category ?? 0];
    baseCruiseGPH = catSpec?.cruise_gph ?? 10;
    acClass = catSpec?.ac_class ?? "unknown";
    specSource = catSpec ? "category_fallback" : "default_fallback";
  }

  let phaseMult = 1;
  let phaseName = "cruise";
  if (vrate > 2.54) { phaseMult = 1.4; phaseName = "climb"; }
  else if (vrate < -1.52) { phaseMult = 0.7; phaseName = "descent"; }
  else if (alt > 7620 && speed > 154) { phaseMult = 0.8; phaseName = "cruise_high"; }
  else if (alt < 610 && speed < 41) { phaseMult = 1.1; phaseName = "approach"; }
  else if (alt >= 2438 && alt <= 5486 && speed >= 100 && speed <= 206) { phaseMult = 0.95; phaseName = "cruise_optimal"; }

  const estimatedGPH = baseCruiseGPH * phaseMult;
  const hoursFlown = (state.time_position && state.last_contact)
    ? Math.max(0, (state.last_contact - state.time_position) / 3600) : 0;

  return {
    faa_type: faaType ?? "Unknown",
    ac_class: acClass ?? "unknown",
    estimated_gph: Math.round(estimatedGPH * 10) / 10,
    flight_phase: phaseName,
    phase_multiplier: Math.round(phaseMult * 100) / 100,
    spec_source: specSource,
    oem_key: oemKey,
    estimated_fuel_burned_gal: Math.round(estimatedGPH * Math.min(hoursFlown, 24)),
    hours_airborne: Math.round(hoursFlown * 100) / 100,
    confidence: specSource.startsWith("oem") ? "HIGH" : "LOW",
  };
}

function estimateEndurance(state, fuelEst, faaData) {
  if (!fuelEst || !state) return null;

  const faaType = faaData?.type_aircraft || state.aircraft_type || null;
  const spec = getFuelSpecs(faaType);
  const tankGal = spec?.tank_gal ?? CATEGORY_DEFAULTS[state.category ?? 0]?.tank_gal ?? 50;
  const available = Math.max(0, tankGal - fuelEst.estimated_fuel_burned_gal);
  const enduranceHours = fuelEst.estimated_gph > 0 ? available / fuelEst.estimated_gph : 0;
  const flightableHours = Math.max(0, enduranceHours - (RESERVE_MIN / 60));

  return {
    aircraft_type: faaType ?? "Unknown",
    oem_fuel_capacity_gal: tankGal,
    estimated_fuel_burned_gal: fuelEst.estimated_fuel_burned_gal,
    estimated_remaining_gal: Math.round(available),
    estimated_endurance_hours: Math.round(enduranceHours * 10) / 10,
    flightable_hours_after_reserve: Math.round(flightableHours * 10) / 10,
    fuel_reserve_status: flightableHours < 0.5 ? "CRITICAL" : flightableHours < 1 ? "LOW" : flightableHours < 2 ? "MODERATE" : "ADEQUATE",
    reserve_minutes_applied: RESERVE_MIN,
    spec_source: fuelEst.spec_source,
  };
}

function calculateDealReadiness(state, listing, endurance) {
  if (!listing || !endurance || !state) return null;

  const landingSoon = (endurance.flightable_hours_after_reserve ?? Infinity) < 1;
  const createdAt = listing.created_date || listing.created_at || null;
  const recentlyListed = createdAt ? Date.now() - new Date(createdAt).getTime() < 7 * 86400 * 1000 : false;
  const dealLabel = listing.deal_label ?? "";
  const motivated = dealLabel.toLowerCase().includes("motivated") || dealLabel.toLowerCase().includes("reduced");

  return {
    landing_soon: landingSoon,
    recently_listed: recentlyListed,
    motivated_seller: motivated,
    is_live_opportunity: landingSoon && recentlyListed && motivated,
    ati_score: listing.ati_score ?? null,
    deal_label: dealLabel || null,
    fuel_reserve_status: endurance.fuel_reserve_status,
    flightable_hours: endurance.flightable_hours_after_reserve,
  };
}

async function enrichStates(base44, states, includeDealReadiness = false) {
  const hexList = states.map((s) => s.icao24).filter(Boolean);
  let faaMap = {};

  if (hexList.length > 0) {
    try {
      const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: { $in: hexList } }, "", 500);
      recs.forEach((r) => {
        if (r.mode_s_hex) faaMap[String(r.mode_s_hex).toLowerCase()] = r;
      });
    } catch (e) {
      console.warn("FAA enrichment failed:", e.message);
    }
  }

  const registrations = Object.values(faaMap).map((r) => r.n_number ? `N${r.n_number}` : null).filter(Boolean);
  let atiMap = {};

  if (registrations.length > 0) {
    try {
      const listings = await base44.asServiceRole.entities.AircraftListing.filter(
        { registration: { $in: registrations }, status: "active" }, "-ati_score", 500
      );
      listings.forEach((l) => {
        if (l.registration) atiMap[String(l.registration).toUpperCase()] = l;
      });
    } catch (e) {
      console.warn("ATI enrichment failed:", e.message);
    }
  }

  return states.map((s) => {
    const faa = faaMap[s.icao24?.toLowerCase()] || null;
    const reg = faa?.n_number ? `N${faa.n_number}` : (s.registration || null);
    const listing = reg ? atiMap[String(reg).toUpperCase()] || null : null;
    const fuelEst = estimateFuelConsumption(s, faa);
    const endurance = fuelEst ? estimateEndurance(s, fuelEst, faa) : null;

    return {
      ...s,
      faa: faa ? {
        n_number: faa.n_number ? `N${faa.n_number}` : null,
        name: faa.name,
        type_aircraft: faa.type_aircraft,
        mfr_mdl_code: faa.mfr_mdl_code,
        eng_mfr_mdl: faa.eng_mfr_mdl,
        year_mfr: faa.year_mfr,
      } : null,
      listing: listing ? {
        id: listing.id,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        ati_score: listing.ati_score,
        deal_label: listing.deal_label,
        asking_price: listing.asking_price,
        deal_score: listing.deal_score,
        created_date: listing.created_date,
      } : null,
      fuel_estimate: fuelEst,
      endurance,
      deal_readiness: includeDealReadiness ? calculateDealReadiness(s, listing, endurance) : null,
    };
  });
}

function filterHeavy(states, allowHeavy) {
  if (allowHeavy) return states;
  return states.filter((s) => {
    const cat = s.category ?? 0;
    return cat < 5 || (cat >= 8 && cat <= 17);
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, icao24, days } = body;
    if (!action) return Response.json({ error: "action required" }, { status: 400 });

    // ── map_states: bounding box sweep ──
    if (action === "map_states") {
      const { allow_heavy = false, limit = 200, lamin, lamax, lomin, lomax } = body;
      let states = await adsbFetchBbox(lamin, lamax, lomin, lomax, 500);
      states = filterHeavy(states, allow_heavy).slice(0, limit);
      const aircraft = await enrichStates(base44, states, true);
      return Response.json({ aircraft, time: Math.floor(Date.now() / 1000), total_raw: states.length, source: "adsb.lol" });
    }

    // ── history_states: use adsb.lol live (no history support) ──
    if (action === "history_states") {
      const { allow_heavy = false, limit = 200, lamin, lamax, lomin, lomax, ts } = body;
      if (!ts) return Response.json({ error: "ts (unix timestamp) required" }, { status: 400 });
      let states = await adsbFetchBbox(lamin, lamax, lomin, lomax, 500);
      states = filterHeavy(states, allow_heavy).slice(0, limit);
      const aircraft = await enrichStates(base44, states, false);
      return Response.json({ aircraft, time: Math.floor(Date.now() / 1000), total_raw: states.length, historical: false, fallback_live: true, source: "adsb.lol" });
    }

    // ── Resolve ICAO24 hex (or N-number) ──
    let hex = icao24 ? String(icao24).toLowerCase().trim() : null;
    if (!isValidHex(hex) && body.icao24) {
      const resolved = await resolveNNumberToHex(base44, body.icao24);
      if (resolved) hex = resolved;
    }
    if (!isValidHex(hex)) {
      return Response.json({
        error: "Aircraft not found. Provide a 6-character ICAO24 hex (e.g. 3c675a) or a US N-number registered in the FAA database (e.g. N123AB).",
      }, { status: 400 });
    }

    if (action === "state") {
      const state = await adsbFetchHex(hex);
      let faaData = null;
      try {
        const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: hex }, "", 1);
        faaData = recs[0] || null;
      } catch (e) {
        console.warn("FAA lookup failed:", e.message);
      }
      const fuelEst = state ? estimateFuelConsumption(state, faaData) : null;
      const endurance = fuelEst ? estimateEndurance(state, fuelEst, faaData) : null;
      return Response.json({ time: Math.floor(Date.now() / 1000), state, faa: faaData, fuel_estimate: fuelEst, endurance, source: "adsb.lol" });
    }

    if (action === "inflight") {
      const state = await adsbFetchHex(hex);
      if (!state || state.on_ground) return Response.json({ error: "Aircraft not airborne", state });

      let faaData = null;
      try {
        const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: hex }, "", 1);
        faaData = recs[0] || null;
      } catch (e) {
        console.warn("FAA lookup failed:", e.message);
      }

      const fuelEst = estimateFuelConsumption(state, faaData);
      const endurance = fuelEst ? estimateEndurance(state, fuelEst, faaData) : null;

      // Try OpenSky for flight history (adsb.lol doesn't have historical flights)
      let recentFlights = [];
      try {
        const end = Math.floor(Date.now() / 1000);
        const data = await openSkyFetch(`/flights/aircraft?icao24=${hex}&begin=${end - 86400}&end=${end}`);
        recentFlights = data || [];
      } catch (e) {
        console.warn("Flight history unavailable:", e.message);
      }

      return Response.json({ time: Math.floor(Date.now() / 1000), state, faa: faaData, fuel_estimate: fuelEst, endurance, recent_flights: recentFlights, source: "adsb.lol" });
    }

    if (action === "flights") {
      // OpenSky only for historical flight data
      try {
        const end = Math.floor(Date.now() / 1000);
        const span = Math.min(Math.max(Number(days) || 7, 1), 30);
        const begin = end - span * 86400;
        const data = await openSkyFetch(`/flights/aircraft?icao24=${hex}&begin=${begin}&end=${end}`);
        return Response.json({ flights: data || [], source: "opensky" });
      } catch (e) {
        return Response.json({ flights: [], error: e.message, source: "unavailable" });
      }
    }

    if (action === "track") {
      // OpenSky only for track data
      try {
        const data = await openSkyFetch(`/tracks/all?icao24=${hex}&time=0`);
        return Response.json({ track: data, source: "opensky" });
      } catch (e) {
        return Response.json({ track: null, error: e.message, source: "unavailable" });
      }
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("openSky error:", error.message);
    return Response.json({ error: error.message }, { status: 502 });
  }
});