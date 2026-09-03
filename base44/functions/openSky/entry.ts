// Aircraft live tracking — dual-source: adsb.lol (free) + OpenSky Network (auth, higher limits)
// Actions:
//   action="state"       params: { icao24, source? }                           → live position + fuel estimates
//   action="inflight"    params: { icao24, source? }                           → current flight ops
//   action="map_states"  params: { lamin, lamax, lomin, lomax, allow_heavy, limit, source? } → area sweep
//   action="history_states" params: { lamin, lamax, lomin, lomax, allow_heavy, limit } → same as map_states (adsb.lol only)
//   source: "adsblol" (default, anonymous) | "opensky" (authenticated, 4,000 credits/day, 5s resolution)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient as createSupabaseClient } from 'npm:@supabase/supabase-js@2';

const ADSBIOL_BASE = "https://api.adsb.lol/v2";
const ADSBIOL_HISTORY_BASE = "https://adsb.lol";
const ADSBIOL_LICENSE = "ODbL-1.0";
const OPENSKY_BASE = "https://opensky-network.org/api";
const OPENSKY_TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const FETCH_TIMEOUT = 12000;
const RESERVE_MIN = 45;

// ─── adsb.lol fetch helpers ──────────────────────────────────────────────────

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

// Convert adsb.lol aircraft object → normalised state object
function parseAdsbAc(ac) {
  if (!ac || !ac.hex) return null;
  const lat = ac.lat ?? null;
  const lon = ac.lon ?? null;
  if (lat == null || lon == null) return null;

  const altFt = typeof ac.alt_baro === "number" ? ac.alt_baro : null;
  const altM  = altFt != null ? altFt * 0.3048 : null;
  const speedKt = typeof ac.gs === "number" ? ac.gs : null;
  const speedMs = speedKt != null ? speedKt * 0.514444 : null;
  const vrateFtMin = typeof ac.baro_rate === "number" ? ac.baro_rate : null;
  const vrateMs = vrateFtMin != null ? vrateFtMin * 0.00508 : null;

  let category = 0;
  if (ac.category) {
    const c = String(ac.category);
    if (c.startsWith("A")) category = parseInt(c[1]) || 0;
    else if (c.startsWith("B")) category = 8;
    else if (c.startsWith("C")) category = 9;
  }

  return {
    icao24:        ac.hex.toLowerCase(),
    callsign:      (ac.flight || ac.r || "").trim() || null,
    origin_country: ac.ownOp || null,
    time_position: ac.seen_pos != null ? Math.floor(Date.now() / 1000) - ac.seen_pos : null,
    last_contact:  ac.seen   != null ? Math.floor(Date.now() / 1000) - ac.seen   : null,
    longitude:     lon,
    latitude:      lat,
    baro_altitude: altM,
    on_ground:     ac.alt_baro === "ground" || altFt === 0,
    velocity:      speedMs,
    true_track:    typeof ac.track === "number" ? ac.track : null,
    vertical_rate: vrateMs,
    geo_altitude:  typeof ac.alt_geom === "number" ? ac.alt_geom * 0.3048 : altM,
    squawk:        ac.squawk || null,
    position_source: 0,
    category,
    registration:  ac.r  || null,
    aircraft_type: ac.t  || null,
  };
}

async function adsbFetchHex(hex) {
  const data = await adsbFetch(`/hex/${hex}`);
  if (!data?.ac?.length) return null;
  return parseAdsbAc(data.ac[0]);
}

function validIsoDate(value) {
  return typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

async function adsbFetchHistoryDay(hex, date) {
  if (!validIsoDate(date)) throw new Error("date must be YYYY-MM-DD");
  const [yyyy, mm, dd] = date.split("-");
  const last2 = hex.slice(-2).toLowerCase();
  const url = `${ADSBIOL_HISTORY_BASE}/globe_history/${yyyy}/${mm}/${dd}/traces/${last2}/trace_full_${hex}.json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ABOS-Aviation-Platform/2.0" }, signal: ctrl.signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`adsb.lol history ${res.status}`);
    const payload = await res.json();
    return { payload, url };
  } catch (e) {
    if (e.name === "AbortError") throw new Error("ADSB.lol historical trace request timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeTrace(payload, date) {
  if (!payload?.trace || !Array.isArray(payload.trace)) return [];
  const baseTimestamp = Number(payload.timestamp);
  if (!Number.isFinite(baseTimestamp)) return [];
  const rootReg = payload.r || null;
  const rootType = payload.t || null;

  return payload.trace.map((p) => {
    if (!Array.isArray(p) || p.length < 3) return null;
    const offset = Number(p[0]);
    const lat = Number(p[1]);
    const lon = Number(p[2]);
    if (!Number.isFinite(offset) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const aircraft = p[8] && typeof p[8] === "object" ? p[8] : null;
    const alt = typeof p[3] === "number" ? p[3] : null;
    const gs = typeof p[4] === "number" ? p[4] : null;
    const track = typeof p[5] === "number" ? p[5] : null;
    const flags = typeof p[6] === "number" ? p[6] : 0;
    const vrate = typeof p[7] === "number" ? p[7] : null;
    const geomAlt = typeof p[10] === "number" ? p[10] : null;
    const geomVrate = typeof p[11] === "number" ? p[11] : null;
    const ias = typeof p[12] === "number" ? p[12] : null;
    const roll = typeof p[13] === "number" ? p[13] : null;
    const observedAt = new Date((baseTimestamp + offset) * 1000).toISOString();

    return {
      icao24: String(payload.icao || "").toLowerCase(),
      registration: aircraft?.r || rootReg || null,
      aircraft_type: aircraft?.t || rootType || null,
      observation_date: date,
      observed_at: observedAt,
      latitude: lat,
      longitude: lon,
      altitude_ft: alt,
      ground_speed_kt: gs,
      track_deg: track,
      vertical_rate_fpm: vrate,
      flags,
      position_stale: Boolean(flags & 1),
      new_leg: Boolean(flags & 2),
      geometric_altitude_ft: geomAlt,
      geometric_vertical_rate_fpm: geomVrate,
      indicated_airspeed_kt: ias,
      roll_deg: roll,
      source: "adsb.lol",
      source_license: ADSBIOL_LICENSE,
      raw_point: p,
    };
  }).filter(Boolean);
}

async function persistHistoryToSupabase(points, sourceUrl) {
  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey || !points.length) return { persisted: false, reason: "Supabase service credentials not configured" };

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);
  const rows = points.map((p) => ({
    icao24: p.icao24,
    registration: p.registration,
    aircraft_type: p.aircraft_type,
    observation_date: p.observation_date,
    observed_at: p.observed_at,
    latitude: p.latitude,
    longitude: p.longitude,
    altitude_ft: p.altitude_ft,
    ground_speed_kt: p.ground_speed_kt,
    track_deg: p.track_deg,
    vertical_rate_fpm: p.vertical_rate_fpm,
    source: p.source,
    source_license: p.source_license,
    source_url: sourceUrl,
    raw_point: p.raw_point,
  }));

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("adsblol_flight_history")
      .upsert(batch, { onConflict: "icao24,observed_at", ignoreDuplicates: false });
    if (error) throw new Error(`Supabase history upsert failed: ${error.message}`);
    inserted += batch.length;
  }
  return { persisted: true, rows: inserted };
}

async function adsbFetchBbox(lamin, lamax, lomin, lomax, limit = 200) {
  const clat = (lamin + lamax) / 2;
  const clon = (lomin + lomax) / 2;
  const dLat = Math.abs(lamax - lamin) * 60;
  const dLon = Math.abs(lomax - lomin) * 60 * Math.cos(clat * Math.PI / 180);
  const radius = Math.min(Math.ceil(Math.sqrt(dLat * dLat + dLon * dLon) / 2) + 10, 250);

  const data = await adsbFetch(`/lat/${clat.toFixed(4)}/lon/${clon.toFixed(4)}/dist/${radius}`);
  if (!data?.ac) return [];

  return data.ac
    .map(parseAdsbAc)
    .filter((s) => s &&
      s.latitude  >= lamin && s.latitude  <= lamax &&
      s.longitude >= lomin && s.longitude <= lomax)
    .slice(0, limit);
}

// ─── N-number → ICAO24 hex resolution ────────────────────────────────────────

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
  "learjet 31": { cruise_gph: 100.0, tank_gal: 800, ac_class: "bizjet-light" },
  "learjet 40": { cruise_gph: 110.0, tank_gal: 900, ac_class: "bizjet-light" },
  "learjet 45": { cruise_gph: 120.0, tank_gal: 1100, ac_class: "bizjet-mid" },
  "learjet 60": { cruise_gph: 165.0, tank_gal: 1260, ac_class: "bizjet-mid" },
  "learjet 70": { cruise_gph: 125.0, tank_gal: 1000, ac_class: "bizjet-mid" },
  "learjet 75": { cruise_gph: 140.0, tank_gal: 1260, ac_class: "bizjet-mid" },
  "hawker 400": { cruise_gph: 100.0, tank_gal: 720, ac_class: "bizjet-light" },
  "hawker 800": { cruise_gph: 165.0, tank_gal: 1407, ac_class: "bizjet-mid" },
  "hawker 900": { cruise_gph: 165.0, tank_gal: 1407, ac_class: "bizjet-mid" },
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
  "airbus a350": { cruise_gph: 950.0, tank_gal: 59000, ac_class: "airliner-wide" },
  "airbus a380": { cruise_gph: 1550.0, tank_gal: 85470, ac_class: "airliner-heavy" },
  "boeing 737": { cruise_gph: 760.0, tank_gal: 6875, ac_class: "airliner-narrow" },
  "boeing 747": { cruise_gph: 1650.0, tank_gal: 63705, ac_class: "airliner-heavy" },
  "boeing 757": { cruise_gph: 950.0, tank_gal: 16700, ac_class: "airliner-narrow" },
  "boeing 767": { cruise_gph: 1200.0, tank_gal: 24140, ac_class: "airliner-wide" },
  "boeing 777": { cruise_gph: 900.0, tank_gal: 45220, ac_class: "airliner-wide" },
  "boeing 787": { cruise_gph: 650.0, tank_gal: 33340, ac_class: "airliner-wide" },
  "robinson r22": { cruise_gph: 8.0, tank_gal: 19, ac_class: "heli-light" },
  "robinson r44": { cruise_gph: 14.0, tank_gal: 39, ac_class: "heli-light" },
  "robinson r66": { cruise_gph: 8.5, tank_gal: 73, ac_class: "heli-light" },
  "bell 206": { cruise_gph: 22.0, tank_gal: 91, ac_class: "heli-mid" },
  "bell 407": { cruise_gph: 52.0, tank_gal: 218, ac_class: "heli-mid" },
  "airbus h125": { cruise_gph: 22.0, tank_gal: 148, ac_class: "heli-mid" },
  "airbus h135": { cruise_gph: 30.0, tank_gal: 158, ac_class: "heli-mid" },
  "sikorsky s-76": { cruise_gph: 125.0, tank_gal: 534, ac_class: "heli-heavy" },
  "sikorsky s-92": { cruise_gph: 220.0, tank_gal: 1398, ac_class: "heli-heavy" },
};

const CATEGORY_DEFAULTS = {
  2: { cruise_gph: 9,   tank_gal: 56,    ac_class: "GA-single" },
  3: { cruise_gph: 9,   tank_gal: 56,    ac_class: "GA-single" },
  4: { cruise_gph: 50,  tank_gal: 450,   ac_class: "bizjet-light" },
  5: { cruise_gph: 140, tank_gal: 1260,  ac_class: "bizjet-mid" },
  8: { cruise_gph: 20,  tank_gal: 80,    ac_class: "heli-light" },
  9: { cruise_gph: 55,  tank_gal: 250,   ac_class: "heli-mid" },
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
  const alt   = state.baro_altitude ?? 0;
  const speed = state.velocity ?? 0;
  const vrate = state.vertical_rate ?? 0;
  const faaType = faaData?.type_aircraft || state.aircraft_type || null;

  let baseCruiseGPH = null, specSource = "default_fallback", oemKey = null, acClass = null;
  const spec = getFuelSpecs(faaType);
  if (spec) { baseCruiseGPH = spec.cruise_gph; specSource = `oem_${spec.match}`; oemKey = spec.key; acClass = spec.ac_class; }

  if (baseCruiseGPH == null) {
    const catSpec = CATEGORY_DEFAULTS[state.category ?? 0];
    baseCruiseGPH = catSpec?.cruise_gph ?? 10;
    acClass = catSpec?.ac_class ?? "unknown";
    specSource = catSpec ? "category_fallback" : "default_fallback";
  }

  let phaseMult = 1, phaseName = "cruise";
  if (vrate > 2.54) { phaseMult = 1.4; phaseName = "climb"; }
  else if (vrate < -1.52) { phaseMult = 0.7; phaseName = "descent"; }
  else if (alt > 7620 && speed > 154) { phaseMult = 0.8; phaseName = "cruise_high"; }

  const estimatedGPH = baseCruiseGPH * phaseMult;
  const hoursFlown = (state.time_position && state.last_contact)
    ? Math.max(0, (state.last_contact - state.time_position) / 3600) : 0;

  return {
    faa_type: faaType ?? "Unknown",
    ac_class: acClass ?? "unknown",
    estimated_gph: Math.round(estimatedGPH * 10) / 10,
    flight_phase: phaseName,
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
    estimated_remaining_gal: Math.round(available),
    estimated_endurance_hours: Math.round(enduranceHours * 10) / 10,
    flightable_hours_after_reserve: Math.round(flightableHours * 10) / 10,
    fuel_reserve_status: flightableHours < 0.5 ? "CRITICAL" : flightableHours < 1 ? "LOW" : flightableHours < 2 ? "MODERATE" : "ADEQUATE",
    reserve_minutes_applied: RESERVE_MIN,
  };
}

// ─── OpenSky Network API (authenticated, higher limits) ────────────────────────

let _openskyToken = null, _openskyTokenExp = 0;

async function getOpenSkyToken() {
  if (_openskyToken && Date.now() < _openskyTokenExp) return _openskyToken;
  const cid = Deno.env.get("OPENSKY_CLIENT_ID");
  const csec = Deno.env.get("OPENSKY_CLIENT_SECRET");
  if (!cid || !csec) return null;

  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: cid, client_secret: csec });
  const res = await fetch(OPENSKY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  _openskyToken = data.access_token;
  _openskyTokenExp = Date.now() + (data.expires_in - 30) * 1000;
  return _openskyToken;
}

function parseOpenSkyAc(ac) {
  // OpenSky state array: [icao24, callsign, origin_country, time_position, last_contact,
  //   longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate,
  //   sensors, geo_altitude, squawk, spi, position_source, category]
  if (!ac || !ac[0]) return null;
  const lat = ac[6], lon = ac[5];
  if (lat == null || lon == null) return null;
  return {
    icao24:         String(ac[0]).toLowerCase(),
    callsign:       (ac[1] || "").trim() || null,
    origin_country:  ac[2] || null,
    time_position:   ac[3] || null,
    last_contact:    ac[4] || null,
    longitude:       lon,
    latitude:        lat,
    baro_altitude:   ac[7] ?? null,
    on_ground:       !!ac[8],
    velocity:        ac[9] ?? null,
    true_track:      ac[10] ?? null,
    vertical_rate:   ac[11] ?? null,
    geo_altitude:    ac[13] ?? null,
    squawk:          ac[14] || null,
    position_source: ac[16] ?? 0,
    category:        ac[17] ?? 0,
  };
}

async function openskyFetchBbox(lamin, lamax, lomin, lomax, limit = 200) {
  const token = await getOpenSkyToken();
  const url = `${OPENSKY_BASE}/states/all?extended=1&lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
  const headers = { "User-Agent": "ABOS-Aviation-Platform/2.0" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const timeout = 25000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const data = await res.json();
    if (!data?.states) return { states: [], time: data.time || Math.floor(Date.now() / 1000), credits: null };
    const credits = res.headers.get("X-Rate-Limit-Remaining");
    const states = data.states.map(parseOpenSkyAc).filter(Boolean).slice(0, limit);
    return { states, time: data.time || Math.floor(Date.now() / 1000), credits: credits ? parseInt(credits) : null };
  } catch (e) {
    if (e.name === "AbortError") throw new Error("OpenSky request timed out — try adsb.lol source instead or check network");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function openskyFetchHex(hex) {
  const token = await getOpenSkyToken();
  const url = `${OPENSKY_BASE}/states/all?extended=1&icao24=${hex}`;
  const headers = { "User-Agent": "ABOS-Aviation-Platform/2.0" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const timeout = 25000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const data = await res.json();
    if (!data?.states?.length) return null;
    return parseOpenSkyAc(data.states[0]);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("OpenSky request timed out — try adsb.lol source instead");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function enrichStates(base44, states, includeDealReadiness = false) {
  const hexList = states.map((s) => s.icao24).filter(Boolean);
  let faaMap = {};
  if (hexList.length > 0) {
    try {
      const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: { $in: hexList } }, "", 500);
      recs.forEach((r) => { if (r.mode_s_hex) faaMap[r.mode_s_hex.toLowerCase()] = r; });
    } catch (e) { console.warn("FAA enrichment failed:", e.message); }
  }

  const registrations = Object.values(faaMap).map((r) => r.n_number ? `N${r.n_number}` : null).filter(Boolean);
  let atiMap = {};
  if (registrations.length > 0) {
    try {
      const listings = await base44.asServiceRole.entities.AircraftListing.filter(
        { registration: { $in: registrations }, status: "active" }, "-ati_score", 500
      );
      listings.forEach((l) => { if (l.registration) atiMap[l.registration.toUpperCase()] = l; });
    } catch (e) { console.warn("ATI enrichment failed:", e.message); }
  }

  // ── FAA LADD check, batched ── aircraft on the current LADD list must not
  // have their FAA-sourced registry data (registration, owner name, etc.)
  // publicly displayed. ADS-B position/altitude/speed are NOT FAA-source
  // data and are unaffected by LADD, so those still render normally.
  let laddBlockedSet = new Set();
  const nNumbersOnly = Object.values(faaMap).map((r) => r.n_number).filter(Boolean);
  if (nNumbersOnly.length > 0) {
    try {
      const blocked = await base44.asServiceRole.entities.LaddBlockList.filter(
        { n_number: { $in: nNumbersOnly }, active: true }, "", 500
      );
      laddBlockedSet = new Set(blocked.map((b) => b.n_number));
    } catch (e) {
      // Fail CLOSED for the affected aircraft: if we can't verify LADD status,
      // suppress FAA data for every aircraft in this batch rather than risk
      // showing data for one that's actually blocked.
      console.warn("LADD check failed — suppressing FAA overlay for this batch:", e.message);
      laddBlockedSet = new Set(nNumbersOnly);
    }
  }

  return states.map((s) => {
    const faaRaw = faaMap[s.icao24?.toLowerCase()] || null;
    const isLaddBlocked = !!(faaRaw?.n_number && laddBlockedSet.has(faaRaw.n_number));
    const faa = isLaddBlocked ? null : faaRaw;
    const reg = faa?.n_number ? `N${faa.n_number}` : (isLaddBlocked ? null : (s.registration || null));
    const listing = reg ? atiMap[reg.toUpperCase()] || null : null;
    const fuelEst = estimateFuelConsumption(s, faa);
    const endurance = fuelEst ? estimateEndurance(s, fuelEst, faa) : null;
    return {
      ...s,
      ladd_blocked: isLaddBlocked,
      faa: faa ? { n_number: `N${faa.n_number}`, name: faa.name, type_aircraft: faa.type_aircraft, mfr_mdl_code: faa.mfr_mdl_code, year_mfr: faa.year_mfr } : null,
      listing: listing ? { id: listing.id, make: listing.make, model: listing.model, year: listing.year, ati_score: listing.ati_score, deal_label: listing.deal_label, asking_price: listing.asking_price } : null,
      fuel_estimate: fuelEst,
      endurance,
    };
  });
}

function filterHeavy(states, allowHeavy) {
  if (allowHeavy) return states;
  return states.filter((s) => { const c = s.category ?? 0; return c < 5 || (c >= 8 && c <= 17); });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, icao24, source = "adsblol" } = body;
    if (!action) return Response.json({ error: "action required" }, { status: 400 });

    const useOpenSky = source === "opensky";

    if (action === "history") {
      if (source !== "adsblol") return Response.json({ error: "Historical archive is currently provided by adsb.lol only" }, { status: 400 });
      let hex = icao24 ? String(icao24).toLowerCase().trim() : null;
      if (!isValidHex(hex) && body.icao24) hex = await resolveNNumberToHex(base44, body.icao24);
      if (!isValidHex(hex)) return Response.json({ error: "Provide a 6-character ICAO24 hex or a US N-number" }, { status: 400 });

      const date = body.date;
      const result = await adsbFetchHistoryDay(hex, date);
      if (!result) return Response.json({ error: "No historical trace found for this aircraft and date", icao24: hex, date, source: "adsb.lol" }, { status: 404 });
      const points = normalizeTrace(result.payload, date);
      let persisted = { persisted: false, reason: "persist=false" };
      if (body.persist === true) persisted = await persistHistoryToSupabase(points, result.url);

      return Response.json({
        source: "adsb.lol",
        license: ADSBIOL_LICENSE,
        source_url: result.url,
        icao24: hex,
        registration: result.payload.r || null,
        aircraft_type: result.payload.t || null,
        date,
        timestamp: result.payload.timestamp || null,
        point_count: points.length,
        persisted,
        trace: points,
      });
    }

    if (action === "map_states" || action === "history_states") {
      const { allow_heavy = false, limit = 200, lamin, lamax, lomin, lomax } = body;

      if (useOpenSky) {
        const result = await openskyFetchBbox(lamin, lamax, lomin, lomax, 500);
        let states = filterHeavy(result.states, allow_heavy).slice(0, limit);
        const aircraft = await enrichStates(base44, states, true);
        return Response.json({
          aircraft, time: result.time, total_raw: result.states.length,
          source: "opensky-network", credits_remaining: result.credits,
        });
      }

      let states = await adsbFetchBbox(lamin, lamax, lomin, lomax, 500);
      states = filterHeavy(states, allow_heavy).slice(0, limit);
      const aircraft = await enrichStates(base44, states, true);
      return Response.json({ aircraft, time: Math.floor(Date.now() / 1000), total_raw: states.length, source: "adsb.lol" });
    }

    // Resolve ICAO24 hex or N-number
    let hex = icao24 ? String(icao24).toLowerCase().trim() : null;
    if (!isValidHex(hex) && body.icao24) {
      hex = await resolveNNumberToHex(base44, body.icao24);
    }
    if (!isValidHex(hex)) {
      return Response.json({ error: "Provide a 6-character ICAO24 hex (e.g. 3c675a) or US N-number (e.g. N123AB)." }, { status: 400 });
    }

    if (action === "state" || action === "inflight") {
      let state;
      if (useOpenSky) {
        state = await openskyFetchHex(hex);
      } else {
        state = await adsbFetchHex(hex);
      }

      let faaData = null;
      try {
        const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: hex }, "", 1);
        faaData = recs[0] || null;
      } catch (e) { console.warn("FAA lookup failed:", e.message); }

      if (action === "inflight" && (!state || state.on_ground)) {
        return Response.json({ error: "Aircraft not currently airborne", state });
      }

      const fuelEst = state ? estimateFuelConsumption(state, faaData) : null;
      const endurance = fuelEst ? estimateEndurance(state, fuelEst, faaData) : null;
      return Response.json({
        time: Math.floor(Date.now() / 1000), state, faa: faaData,
        fuel_estimate: fuelEst, endurance,
        source: useOpenSky ? "opensky-network" : "adsb.lol",
      });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("openSky error:", error.message);
    return Response.json({ error: error.message }, { status: 502 });
  }
});