/**
 * Adapters: operational / ADS-B intelligence (master spec §12).
 *
 * Hard rule: do not overstate what ADS-B can prove. Absence of a track means
 * the aircraft was not seen by the receivers feeding this source — not that it
 * did not fly. Every candidate produced here says so in its own note.
 */

import { base44 } from "@/api/base44Client";
import { source, DATA_CLASS } from "../provenance";

function make(providerId, providerName, field, value, { sourceDate = null, note = null, dataClass = DATA_CLASS.OBSERVED } = {}) {
  if (value === null || value === undefined || value === "") return null;
  return {
    field,
    value,
    dataClass,
    calculation: note,
    source: source({ providerId, providerName, type: dataClass, sourceDate, note }),
  };
}

const COVERAGE_CAVEAT = "Based on ADS-B receivers feeding this source; coverage is not complete.";

export async function openSkyAdapter({ registration }) {
  let data = null;
  try {
    const res = await base44.functions.invoke("openSky", { registration });
    data = res?.data ?? res;
  } catch (error) {
    throw new Error(`OpenSky unavailable: ${error?.message || error}`);
  }

  const state = data?.state || data?.aircraft || data;
  if (!state || (!state.latitude && !state.last_contact && !data?.flights)) {
    return { candidates: [], note: "No ADS-B activity observed by this source." };
  }

  const p = "opensky";
  const name = "OpenSky Network";
  const seenAt = state.last_contact
    ? new Date(Number(state.last_contact) * 1000).toISOString()
    : (data?.last_seen || null);

  const position = state.latitude && state.longitude
    ? `${Number(state.latitude).toFixed(3)}, ${Number(state.longitude).toFixed(3)}`
    : null;

  const flights = Array.isArray(data?.flights) ? data.flights : null;

  const candidates = [
    make(p, name, "last_known_position", position, { sourceDate: seenAt, note: COVERAGE_CAVEAT }),
    make(p, name, "last_seen", seenAt, { sourceDate: seenAt, note: COVERAGE_CAVEAT }),
    flights ? make(p, name, "flights_90d", flights.length, {
      sourceDate: seenAt,
      note: `${COVERAGE_CAVEAT} Counted from observed tracks, not from logbooks.`,
      dataClass: DATA_CLASS.DERIVED,
    }) : null,
    make(p, name, "home_base", data?.home_base || state.estDepartureAirport, { sourceDate: seenAt, note: "Most frequent observed departure airport." }),
  ].filter(Boolean);

  return { candidates, freshnessH: 0, costEur: 0, meta: { observed_flights: flights?.length ?? null } };
}
