import { base44 } from "@/api/base44Client";

function normalizeRegistration(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "");
}

function isFound(data) {
  return Boolean(data?.found && data?.aircraft);
}

function toPublicTwinResult(data) {
  if (!data?.found) return data;

  return {
    found: true,
    source: "public_faa",
    origin_label: "United States (FAA)",
    aircraft: {
      registration: data.registration,
      year: data.year,
      make: data.make,
      model: data.model,
      serial_number: data.serial_number_masked,
      registered_owner: data.owner_masked,
      owner_match: data.owner_match,
      owner_match_label: data.owner_match_label,
      state: data.owner_state,
      status: data.registration_status === "Valid" ? "V" : data.registration_status,
      origin_country: "US",
    },
    listing: null,
    areaServices: null,
  };
}

export async function lookupAircraft(registration, options = {}) {
  const normalized = normalizeRegistration(registration);
  if (!normalized) return { found: false, error: "Aircraft registration is required." };

  const canonicalRegistration = normalized.startsWith("N")
    ? normalized
    : normalized;

  // Try every available registry source when a source is unavailable OR
  // returns a valid response with found:false. A negative result from one
  // source must never prevent the remaining sources from being queried.
  try {
    const response = await base44.functions.invoke("aircraftDataHub", {
      registration: canonicalRegistration,
      owner_query: options.ownerQuery || undefined,
    });
    if (isFound(response.data)) return response.data;
  } catch (_) {
    // Continue to the next registry source.
  }

  try {
    const response = await base44.functions.invoke("globalAircraftLookup", {
      registration: canonicalRegistration,
    });
    const data = response.data;
    if (isFound(data)) {
      if (data.aircraft) {
        data.aircraft = { ...data.aircraft, registered_owner: "****" };
      }
      return data;
    }
  } catch (_) {
    // Continue to the public FAA twin.
  }

  try {
    const response = await base44.functions.invoke("publicTwinLookup", {
      query: canonicalRegistration,
      owner_query: options.ownerQuery || undefined,
    });
    return toPublicTwinResult(response.data);
  } catch (_) {
    return {
      found: false,
      error: `No registry record found for ${canonicalRegistration}.`,
    };
  }
}
