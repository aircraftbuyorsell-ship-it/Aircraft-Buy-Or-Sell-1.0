import { base44 } from "@/api/base44Client";

function isUnauthorized(error) {
  return [401, 403].includes(error?.response?.status || error?.status);
}

export async function lookupAircraft(registration) {
  try {
    const response = await base44.functions.invoke("globalAircraftLookup", { registration });
    return response.data;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;

    const response = await base44.functions.invoke("publicTwinLookup", { query: registration });
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
        state: data.owner_state,
        status: data.registration_status === "Valid" ? "V" : data.registration_status,
        origin_country: "US",
      },
      listing: null,
      areaServices: null,
    };
  }
}