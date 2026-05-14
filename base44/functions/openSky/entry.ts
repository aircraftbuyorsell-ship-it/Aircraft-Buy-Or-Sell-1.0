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

// Estimate fuel consumption based on aircraft type & flight phase
function estimateFuelConsumption(state) {
  if (!state || state.on_ground) return null;
  
  const alt = state.baro_altitude || 0;
  const speed = state.velocity || 0;
  const vrate = state.vertical_rate || 0;
  
  // Simple aircraft type guess from category code
  const category = state.category || 0;
  const isCommercial = [30, 31, 32, 33, 34, 35].includes(category); // B77, B78, A320, etc.
  const isSEP = [2, 3].includes(category); // Single-engine prop, multi-engine prop
  const isHeli = [36, 37, 38, 39, 40, 41].includes(category);
  
  // Base fuel burn estimates (gallons/hour) — typical values
  let baseBurnGPH = 10; // Default SEP
  if (isCommercial) baseBurnGPH = 800; // Large jet
  if (category === 4 || category === 5) baseBurnGPH = 50; // Business jet
  if (isSEP) baseBurnGPH = 8; // GA single-engine
  if (isHeli) baseBurnGPH = 20;
  
  // Adjust for flight phase
  let phaseMult = 1;
  if (Math.abs(vrate) > 500) phaseMult = 1.3; // Climb/descent = high burn
  if (alt > 15000 && speed > 400) phaseMult = 0.85; // Cruise at altitude = efficient
  if (speed < 50) phaseMult = 0.5; // Slow flight
  
  const estimatedGPH = baseBurnGPH * phaseMult;
  const hoursFlown = state.last_contact ? (Date.now() / 1000 - state.time_position) / 3600 : 0;
  const fuelBurned = Math.max(0, estimatedGPH * Math.min(hoursFlown, 24)); // Cap at 24h to avoid overflow
  
  return {
    estimated_gph: Math.round(estimatedGPH * 10) / 10,
    phase_multiplier: phaseMult,
    estimated_fuel_burned_gal: Math.round(fuelBurned),
    hours_airborne: Math.round(hoursFlown * 100) / 100,
  };
}

// Estimate endurance based on typical fuel tanks & burn rate
function estimateEndurance(state, fuelEst) {
  if (!fuelEst || !state) return null;
  
  const category = state.category || 0;
  const isCommercial = [30, 31, 32, 33, 34, 35].includes(category);
  const isSEP = [2, 3].includes(category);
  
  let typicalFuelCap = 50; // SEP default (gal)
  if (isCommercial) typicalFuelCap = 50000;
  if (category === 4 || category === 5) typicalFuelCap = 6000;
  
  const availableFuel = Math.max(0, typicalFuelCap - fuelEst.estimated_fuel_burned_gal);
  const enduranceHours = availableFuel / fuelEst.estimated_gph;
  
  return {
    typical_fuel_capacity_gal: typicalFuelCap,
    estimated_remaining_gal: Math.round(availableFuel),
    estimated_endurance_hours: Math.round(enduranceHours * 10) / 10,
    fuel_reserve_status: enduranceHours < 1 ? "CRITICAL" : enduranceHours < 3 ? "LOW" : "ADEQUATE",
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

      // OpenSky /states/all accepts &time= for historical snapshots (authenticated only)
      const params = new URLSearchParams({ time: String(Math.floor(ts)) });
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

    // ── MAP STATES: area bounding box — uses 15-min delayed snapshot for full traffic coverage ──
    if (action === "map_states") {
      const { lamin, lomin, lamax, lomax, allow_heavy, limit = 200 } = body;

      // Use a 15-minute delay: OpenSky historical endpoint returns complete global traffic
      // whereas the live endpoint is heavily rate-limited and capped.
      const delayedTs = Math.floor(Date.now() / 1000) - 15 * 60;

      let path = "/states/all";
      const params = new URLSearchParams({ time: String(delayedTs) });
      if (lamin != null) params.set("lamin", lamin);
      if (lomin != null) params.set("lomin", lomin);
      if (lamax != null) params.set("lamax", lamax);
      if (lomax != null) params.set("lomax", lomax);
      path += `?${params.toString()}`;

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
      const fuelEst = state ? estimateFuelConsumption(state) : null;
      const endurance = fuelEst ? estimateEndurance(state, fuelEst) : null;
      return Response.json({ time: data?.time || null, state, fuel_estimate: fuelEst, endurance });
    }
    
    if (action === "inflight") {
      // Get current state + compute full in-flight metrics
      const data = await openSkyFetch(`/states/all?icao24=${hex}`);
      const state = data?.states?.[0] ? parseState(data.states[0]) : null;
      
      if (!state || state.on_ground) {
        return Response.json({ error: "Aircraft not airborne", state });
      }
      
      const fuelEst = estimateFuelConsumption(state);
      const endurance = estimateEndurance(state, fuelEst);
      const flightHistory = await openSkyFetch(`/flights/aircraft?icao24=${hex}&begin=${Math.floor(Date.now() / 1000) - 86400}&end=${Math.floor(Date.now() / 1000)}`);
      
      return Response.json({
        time: data?.time || null,
        state,
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