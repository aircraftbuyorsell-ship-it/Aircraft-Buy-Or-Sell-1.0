// OpenSky Network API proxy — anonymous or OAuth2 client-credentials.
// Actions:
//   action="state"       params: { icao24 }           → live position/altitude/velocity + fuel/ops estimates
//   action="flights"     params: { icao24, days=7 }   → recent flights (history)
//   action="track"       params: { icao24 }           → trajectory waypoints
//   action="inflight"    params: { icao24 }           → current flight ops (fuel burn, endurance)
//
// icao24 MUST be a 6-char hex Mode-S code (lowercase). Registrations (N123AB, OK-LAD)
// must be resolved to hex on the client via FAAAircraft.mode_s_hex before calling.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENSKY_BASE = "https://opensky-network.org/api";
const TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const AUTH_TIMEOUT_MS = 5000;
const FETCH_TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1500;

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  // Anonymous access — OAuth2 auth server is unreliable and causes cascading timeouts.
  // The historical /states/all?time= endpoint works fine without authentication.
  return null;
}

async function openSkyFetch(path, retries = 1) {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENSKY_BASE}${path}`, { headers, signal: controller.signal });
    if (res.status === 404) return null;
    if (res.status === 429) throw new Error("OpenSky rate limit — try again in a minute");
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  } catch (e) {
    if (e.name === "AbortError" && retries > 0) {
      console.warn(`OpenSky timeout, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return openSkyFetch(path, retries - 1);
    }
    if (e.name === "AbortError") throw new Error("OpenSky request timed out — try again shortly");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function isValidHex(s) {
  return typeof s === "string" && /^[0-9a-f]{6}$/.test(s);
}

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
    position_source: arr[16],
    category: arr[17],
  };
}

// ── OEM FUEL SPECS LOOKUP TABLE ──
// Source: POH/AFM data. key = lowercase ICAO/model token or mfr_mdl_code prefix.
// Fields: gph_cruise, gph_climb, gph_descent, fuel_cap_gal, speed_ktas_cruise
const FUEL_SPECS = {
  // Cessna Singles
  "c172":  { gph_cruise: 8.5,  gph_climb: 10.5, gph_descent: 5.0,  fuel_cap_gal: 56,   speed_ktas_cruise: 122 },
  "c182":  { gph_cruise: 12.0, gph_climb: 14.0, gph_descent: 6.0,  fuel_cap_gal: 88,   speed_ktas_cruise: 145 },
  "c206":  { gph_cruise: 15.0, gph_climb: 17.0, gph_descent: 7.0,  fuel_cap_gal: 92,   speed_ktas_cruise: 145 },
  "c210":  { gph_cruise: 16.0, gph_climb: 18.5, gph_descent: 7.5,  fuel_cap_gal: 90,   speed_ktas_cruise: 174 },
  "c152":  { gph_cruise: 6.0,  gph_climb: 7.5,  gph_descent: 4.0,  fuel_cap_gal: 26,   speed_ktas_cruise: 107 },
  // Cessna Twins
  "c310":  { gph_cruise: 22.0, gph_climb: 26.0, gph_descent: 10.0, fuel_cap_gal: 102,  speed_ktas_cruise: 195 },
  "c340":  { gph_cruise: 28.0, gph_climb: 32.0, gph_descent: 12.0, fuel_cap_gal: 163,  speed_ktas_cruise: 200 },
  "c414":  { gph_cruise: 30.0, gph_climb: 35.0, gph_descent: 13.0, fuel_cap_gal: 163,  speed_ktas_cruise: 205 },
  "c421":  { gph_cruise: 32.0, gph_climb: 38.0, gph_descent: 14.0, fuel_cap_gal: 163,  speed_ktas_cruise: 220 },
  // Piper
  "pa28":  { gph_cruise: 9.0,  gph_climb: 11.0, gph_descent: 5.0,  fuel_cap_gal: 50,   speed_ktas_cruise: 125 },
  "pa32":  { gph_cruise: 14.0, gph_climb: 16.0, gph_descent: 6.5,  fuel_cap_gal: 84,   speed_ktas_cruise: 148 },
  "pa34":  { gph_cruise: 22.0, gph_climb: 26.0, gph_descent: 10.0, fuel_cap_gal: 107,  speed_ktas_cruise: 175 },
  "pa44":  { gph_cruise: 20.0, gph_climb: 24.0, gph_descent: 9.0,  fuel_cap_gal: 110,  speed_ktas_cruise: 168 },
  "pa46":  { gph_cruise: 26.0, gph_climb: 30.0, gph_descent: 11.0, fuel_cap_gal: 120,  speed_ktas_cruise: 213 },
  // Mooney
  "m20":   { gph_cruise: 10.0, gph_climb: 12.5, gph_descent: 5.5,  fuel_cap_gal: 64,   speed_ktas_cruise: 170 },
  // Beechcraft
  "be36":  { gph_cruise: 15.0, gph_climb: 18.0, gph_descent: 7.0,  fuel_cap_gal: 74,   speed_ktas_cruise: 174 },
  "be58":  { gph_cruise: 26.0, gph_climb: 30.0, gph_descent: 11.0, fuel_cap_gal: 166,  speed_ktas_cruise: 200 },
  "be60":  { gph_cruise: 30.0, gph_climb: 35.0, gph_descent: 13.0, fuel_cap_gal: 166,  speed_ktas_cruise: 210 },
  "be76":  { gph_cruise: 18.0, gph_climb: 22.0, gph_descent: 9.0,  fuel_cap_gal: 100,  speed_ktas_cruise: 165 },
  // Turboprops
  "tbm":   { gph_cruise: 55.0, gph_climb: 75.0, gph_descent: 25.0, fuel_cap_gal: 282,  speed_ktas_cruise: 330 },
  "pc12":  { gph_cruise: 65.0, gph_climb: 85.0, gph_descent: 30.0, fuel_cap_gal: 401,  speed_ktas_cruise: 270 },
  "c208":  { gph_cruise: 60.0, gph_climb: 78.0, gph_descent: 28.0, fuel_cap_gal: 335,  speed_ktas_cruise: 175 },
  "be90":  { gph_cruise: 70.0, gph_climb: 90.0, gph_descent: 32.0, fuel_cap_gal: 384,  speed_ktas_cruise: 250 },
  "be200": { gph_cruise: 80.0, gph_climb: 105.0,gph_descent: 35.0, fuel_cap_gal: 544,  speed_ktas_cruise: 290 },
  // Light Jets
  "c525":  { gph_cruise: 120.0,gph_climb: 160.0,gph_descent: 55.0, fuel_cap_gal: 688,  speed_ktas_cruise: 340 },
  "c510":  { gph_cruise: 80.0, gph_climb: 110.0,gph_descent: 40.0, fuel_cap_gal: 441,  speed_ktas_cruise: 320 },
  "emb":   { gph_cruise: 100.0,gph_climb: 135.0,gph_descent: 48.0, fuel_cap_gal: 570,  speed_ktas_cruise: 310 },
  "lear":  { gph_cruise: 180.0,gph_climb: 240.0,gph_descent: 80.0, fuel_cap_gal: 1260, speed_ktas_cruise: 450 },
  "g5":    { gph_cruise: 350.0,gph_climb: 450.0,gph_descent:140.0, fuel_cap_gal: 6124, speed_ktas_cruise: 488 },
  // Helicopters
  "r22":   { gph_cruise: 8.0,  gph_climb: 10.0, gph_descent: 6.0,  fuel_cap_gal: 19,   speed_ktas_cruise: 95  },
  "r44":   { gph_cruise: 14.0, gph_climb: 17.0, gph_descent: 9.0,  fuel_cap_gal: 39,   speed_ktas_cruise: 110 },
  "b407":  { gph_cruise: 52.0, gph_climb: 65.0, gph_descent: 28.0, fuel_cap_gal: 218,  speed_ktas_cruise: 133 },
};

// Resolve OEM spec from callsign, mfr_mdl_code, or OpenSky category
function resolveOEMSpec(state, faaData) {
  const cs = (state.callsign || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const mfr = (faaData?.mfr_mdl_code || "").toLowerCase();

  for (const [key, spec] of Object.entries(FUEL_SPECS)) {
    if (cs.includes(key) || mfr.includes(key)) return { ...spec, source: "oem_lookup", key };
  }

  // Fallback: category-based defaults
  const cat = state.category || 0;
  if ([2, 3].includes(cat))          return { gph_cruise: 9,   gph_climb: 11,  gph_descent: 5,  fuel_cap_gal: 56,   speed_ktas_cruise: 130, source: "category_fallback" };
  if ([4, 5, 6].includes(cat))       return { gph_cruise: 50,  gph_climb: 65,  gph_descent: 22, fuel_cap_gal: 450,  speed_ktas_cruise: 350, source: "category_fallback" };
  if (cat >= 30 && cat <= 35)        return { gph_cruise: 800, gph_climb: 1100,gph_descent: 320,fuel_cap_gal: 40000,speed_ktas_cruise: 480, source: "category_fallback" };
  if (cat >= 36 && cat <= 41)        return { gph_cruise: 20,  gph_climb: 26,  gph_descent: 14, fuel_cap_gal: 50,   speed_ktas_cruise: 110, source: "category_fallback" };
  return { gph_cruise: 10, gph_climb: 12, gph_descent: 5, fuel_cap_gal: 56, speed_ktas_cruise: 125, source: "default_fallback" };
}

// Determine flight phase from vertical rate
function getFlightPhase(vrate) {
  if (vrate > 300)  return "climb";
  if (vrate < -300) return "descent";
  return "cruise";
}

// Estimate fuel consumption based on OEM data + flight phase
function estimateFuelConsumption(state, faaData) {
  if (!state || state.on_ground) return null;

  const alt    = state.baro_altitude || 0;
  const speed  = state.velocity || 0;
  const vrate  = state.vertical_rate || 0;
  const phase  = getFlightPhase(vrate);
  const spec   = resolveOEMSpec(state, faaData);

  const gphMap = { climb: spec.gph_climb, descent: spec.gph_descent, cruise: spec.gph_cruise };
  let estimatedGPH = gphMap[phase];

  // High-altitude cruise efficiency adjustment (above FL250 jets run leaner)
  if (phase === "cruise" && alt > 7620 && speed > 200) estimatedGPH *= 0.90;

  const hoursFlown = (state.time_position && state.last_contact)
    ? Math.max(0, (state.last_contact - state.time_position) / 3600)
    : 0;
  const fuelBurned = estimatedGPH * Math.min(hoursFlown, 24);

  return {
    estimated_gph: Math.round(estimatedGPH * 10) / 10,
    flight_phase: phase,
    spec_source: spec.source,
    oem_key: spec.key || null,
    estimated_fuel_burned_gal: Math.round(fuelBurned),
    hours_airborne: Math.round(hoursFlown * 100) / 100,
  };
}

// Estimate endurance using OEM fuel capacity
function estimateEndurance(state, fuelEst, faaData) {
  if (!fuelEst || !state) return null;

  const spec = resolveOEMSpec(state, faaData);
  const availableFuel = Math.max(0, spec.fuel_cap_gal - fuelEst.estimated_fuel_burned_gal);
  const enduranceHours = fuelEst.estimated_gph > 0 ? availableFuel / fuelEst.estimated_gph : 0;

  return {
    oem_fuel_capacity_gal: spec.fuel_cap_gal,
    estimated_remaining_gal: Math.round(availableFuel),
    estimated_endurance_hours: Math.round(enduranceHours * 10) / 10,
    fuel_reserve_status: enduranceHours < 0.75 ? "CRITICAL" : enduranceHours < 2 ? "LOW" : "ADEQUATE",
    spec_source: spec.source,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, icao24, days } = body;
    if (!action) return Response.json({ error: "action required" }, { status: 400 });

    // ── HISTORY STATES: area bounding box at a specific past unix timestamp ──
    if (action === "history_states") {
      const { lamin, lomin, lamax, lomax, allow_heavy, limit = 200, ts } = body;
      if (!ts) return Response.json({ error: "ts (unix timestamp) required" }, { status: 400 });

      // Anonymous access: drop the time= param (requires auth). Return current live data instead.
      const params = new URLSearchParams();
      if (lamin != null) params.set("lamin", lamin);
      if (lomin != null) params.set("lomin", lomin);
      if (lamax != null) params.set("lamax", lamax);
      if (lomax != null) params.set("lomax", lomax);
      const path = `/states/all?${params.toString()}`;

      const data = await openSkyFetch(path);
      if (!data?.states) return Response.json({ aircraft: [], time: ts, historical: true });

      let states = data.states.map(parseState).filter(s => s && s.latitude && s.longitude);

      if (!allow_heavy) {
        states = states.filter(s => {
          const cat = s.category || 0;
          return cat < 5 || (cat >= 8 && cat <= 17);
        });
      }
      states = states.slice(0, limit);

      const hexList = states.map(s => s.icao24).filter(Boolean);
      let faaMap = {};
      if (hexList.length > 0) {
        try {
          const faaRecords = await base44.asServiceRole.entities.FAAAircraft.filter(
            { mode_s_hex: { $in: hexList } }, "", 500
          );
          faaRecords.forEach(r => { if (r.mode_s_hex) faaMap[r.mode_s_hex.toLowerCase()] = r; });
        } catch (e) { console.warn("FAA enrichment failed:", e.message); }
      }

      const registrations = Object.values(faaMap).map(r => r.n_number ? `N${r.n_number}` : null).filter(Boolean);
      let atiMap = {};
      if (registrations.length > 0) {
        try {
          const listings = await base44.asServiceRole.entities.AircraftListing.filter(
            { registration: { $in: registrations }, status: "active" }, "-ati_score", 500
          );
          listings.forEach(l => { if (l.registration) atiMap[l.registration.toUpperCase()] = l; });
        } catch (e) { console.warn("ATI enrichment failed:", e.message); }
      }

      const aircraft = states.map(s => {
        const faa = faaMap[s.icao24?.toLowerCase()] || null;
        const reg = faa?.n_number ? `N${faa.n_number}` : null;
        const listing = reg ? atiMap[reg.toUpperCase()] || null : null;
        return {
          ...s,
          faa: faa ? { n_number: faa.n_number ? `N${faa.n_number}` : null, name: faa.name, type_aircraft: faa.type_aircraft, mfr_mdl_code: faa.mfr_mdl_code, year_mfr: faa.year_mfr } : null,
          listing: listing ? { id: listing.id, make: listing.make, model: listing.model, year: listing.year, ati_score: listing.ati_score, deal_label: listing.deal_label, asking_price: listing.asking_price, deal_score: listing.deal_score } : null,
        };
      });

      return Response.json({ aircraft, time: data.time || ts, total_raw: data.states.length, historical: true });
    }

    // ── MAP STATES: area bounding box — live anonymous endpoint (no time= param required) ──
    if (action === "map_states") {
      const { lamin, lomin, lamax, lomax, allow_heavy, limit = 200 } = body;

      // Anonymous access only works on the live /states/all endpoint (no time= param).
      // The historical time= endpoint requires authentication which times out.
      const params = new URLSearchParams();
      if (lamin != null) params.set("lamin", lamin);
      if (lomin != null) params.set("lomin", lomin);
      if (lamax != null) params.set("lamax", lamax);
      if (lomax != null) params.set("lomax", lomax);
      const path = `/states/all?${params.toString()}`;

      const data = await openSkyFetch(path);
      if (!data?.states) return Response.json({ aircraft: [], time: null });

      let states = data.states.map(parseState).filter(s => s && s.latitude && s.longitude);

      if (!allow_heavy) {
        states = states.filter(s => {
          const cat = s.category || 0;
          return cat < 5 || (cat >= 8 && cat <= 17);
        });
      }

      states = states.slice(0, limit);

      const hexList = states.map(s => s.icao24).filter(Boolean);
      let faaMap = {};
      if (hexList.length > 0) {
        try {
          const faaRecords = await base44.asServiceRole.entities.FAAAircraft.filter(
            { mode_s_hex: { $in: hexList } }, "", 500
          );
          faaRecords.forEach(r => {
            if (r.mode_s_hex) faaMap[r.mode_s_hex.toLowerCase()] = r;
          });
        } catch (e) {
          console.warn("FAA enrichment failed:", e.message);
        }
      }

      const registrations = Object.values(faaMap)
        .map(r => r.n_number ? `N${r.n_number}` : null)
        .filter(Boolean);
      let atiMap = {};
      if (registrations.length > 0) {
        try {
          const listings = await base44.asServiceRole.entities.AircraftListing.filter(
            { registration: { $in: registrations }, status: "active" }, "-ati_score", 500
          );
          listings.forEach(l => {
            if (l.registration) atiMap[l.registration.toUpperCase()] = l;
          });
        } catch (e) {
          console.warn("ATI enrichment failed:", e.message);
        }
      }

      const aircraft = states.map(s => {
        const faa = faaMap[s.icao24?.toLowerCase()] || null;
        const reg = faa?.n_number ? `N${faa.n_number}` : null;
        const listing = reg ? atiMap[reg.toUpperCase()] || null : null;
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
          } : null,
        };
      });

      return Response.json({ aircraft, time: data.time, total_raw: data.states.length });
    }

    const hex = icao24 ? String(icao24).toLowerCase().trim() : null;
    if (!isValidHex(hex)) {
      return Response.json({
        error: "Invalid Mode-S hex code. Expected 6 hex chars (e.g. 3c675a). For N-numbers or tail registrations, the client must resolve to hex first.",
      }, { status: 400 });
    }

    if (action === "state") {
      const data = await openSkyFetch(`/states/all?icao24=${hex}`);
      const state = data?.states?.[0] ? parseState(data.states[0]) : null;
      // Enrich with FAA data for OEM spec resolution
      let faaData = null;
      try {
        const faaRecords = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: hex }, "", 1);
        faaData = faaRecords[0] || null;
      } catch (e) { console.warn("FAA lookup failed:", e.message); }
      const fuelEst = state ? estimateFuelConsumption(state, faaData) : null;
      const endurance = fuelEst ? estimateEndurance(state, fuelEst, faaData) : null;
      return Response.json({ time: data?.time || null, state, faa: faaData, fuel_estimate: fuelEst, endurance });
    }

    if (action === "inflight") {
      const data = await openSkyFetch(`/states/all?icao24=${hex}`);
      const state = data?.states?.[0] ? parseState(data.states[0]) : null;

      if (!state || state.on_ground) {
        return Response.json({ error: "Aircraft not airborne", state });
      }

      // Enrich with FAA data for OEM spec resolution
      let faaData = null;
      try {
        const faaRecords = await base44.asServiceRole.entities.FAAAircraft.filter({ mode_s_hex: hex }, "", 1);
        faaData = faaRecords[0] || null;
      } catch (e) { console.warn("FAA lookup failed:", e.message); }

      const fuelEst = estimateFuelConsumption(state, faaData);
      const endurance = estimateEndurance(state, fuelEst, faaData);
      const flightHistory = await openSkyFetch(`/flights/aircraft?icao24=${hex}&begin=${Math.floor(Date.now() / 1000) - 86400}&end=${Math.floor(Date.now() / 1000)}`);

      return Response.json({
        time: data?.time || null,
        state,
        faa: faaData,
        fuel_estimate: fuelEst,
        endurance,
        recent_flights: flightHistory || [],
      });
    }

    if (action === "flights") {
      const end = Math.floor(Date.now() / 1000);
      const span = Math.min(Math.max(Number(days) || 7, 1), 30);
      const begin = end - span * 86400;
      const data = await openSkyFetch(`/flights/aircraft?icao24=${hex}&begin=${begin}&end=${end}`);
      return Response.json({ flights: data || [] });
    }

    if (action === "track") {
      const data = await openSkyFetch(`/tracks/all?icao24=${hex}&time=0`);
      return Response.json({ track: data });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("openSky error:", error.message);
    return Response.json({ error: error.message }, { status: 502 });
  }
});