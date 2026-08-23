import { base44 } from "@/api/base44Client";

function isUnauthorized(error) {
  return [401, 403].includes(error?.response?.status || error?.status);
}

export async function lookupAircraft(registration, options = {}) {
  try {
    const response = await base44.functions.invoke("aircraftDataHub", {
      registration,
      owner_query: options.ownerQuery || undefined,
    });
    return response.data;
  } catch (hubError) {
    try {
      const response = await base44.functions.invoke("globalAircraftLookup", { registration });
      const data = response.data;
      if (data?.aircraft) data.aircraft = { ...data.aircraft, registered_owner: "****" };
      return data;
    } catch (error) {
      if (!isUnauthorized(error)) throw hubError;
    }

    const response = await base44.functions.invoke("publicTwinLookup", {
      query: registration,
      owner_query: options.ownerQuery || undefined,
    });
    const data = response.data;
    if (!data.found) return data;

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
}