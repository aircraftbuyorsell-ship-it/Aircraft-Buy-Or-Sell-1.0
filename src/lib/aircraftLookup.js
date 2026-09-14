import { base44 } from "@/api/base44Client";

const DASH_PREFIXES = ["OK", "EC", "EA", "SE", "OO", "PH", "HB", "OE", "LN", "OY", "ZK", "VH", "CS", "9M", "D", "G", "F", "I", "B"];

export function normalizeReg(value) {
  const compact = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return "";
  if (/^N-?\d/.test(compact)) return compact.replace(/-/g, "");
  if (/^\d{1,5}[A-Z]{0,2}$/.test(compact)) return `N${compact}`;
  if (compact.includes("-")) return compact;
  const prefix = DASH_PREFIXES.find((item) => compact.startsWith(item) && compact.length > item.length);
  return prefix ? `${prefix}-${compact.slice(prefix.length)}` : compact;
}

function normalizeResult(data, registration) {
  if (!isFound(data)) return data;
  const aircraft = { ...data.aircraft };
  const rawStatus = String(aircraft.status_code || aircraft.status || aircraft.registration_status || "").trim();
  const status = /^(v|valid|active)$/i.test(rawStatus) ? "V" : rawStatus;
  aircraft.status = status;
  aircraft.status_code = status;
  aircraft.registration = normalizeReg(aircraft.registration || registration);
  aircraft.registered_owner = "****";
  // Keep alternate owner-name fields from bypassing the same display policy.
  for (const field of ["name", "owner", "owner_name", "owner_masked", "registered_owner_name"]) {
    if (field in aircraft) aircraft[field] = "****";
  }
  return { ...data, aircraft };
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
  const normalized = normalizeReg(registration);
  if (!normalized) return { found: false, error: "Aircraft registration is required." };

  // Registry providers use compact keys; UI uses the formatted marking.
  const canonicalRegistration = normalized.replace(/-/g, "");

  // Fixed source priority, independent of response timing. All sources start together.
  const sources = [
    { name: "aircraftDataHub", payload: { registration: canonicalRegistration, owner_query: options.ownerQuery || undefined } },
    { name: "globalAircraftLookup", payload: { registration: canonicalRegistration } },
    { name: "publicTwinLookup", payload: { query: canonicalRegistration, owner_query: options.ownerQuery || undefined } },
  ];
  const outcomes = await Promise.allSettled(sources.map(async ({ name, payload }) => {
    const response = await base44.functions.invoke(name, payload);
    return name === "publicTwinLookup" ? toPublicTwinResult(response.data) : response.data;
  }));
  const source_statuses = outcomes.map((outcome, index) => ({
    source: sources[index].name,
    status: outcome.status === "rejected" || !outcome.value || (outcome.value.error && !isFound(outcome.value))
      ? "unavailable" : isFound(outcome.value) ? "matched" : "no_match",
  }));
  const selected = outcomes.findIndex((outcome) => outcome.status === "fulfilled" && isFound(outcome.value));
  if (selected !== -1) {
    return {
      ...normalizeResult(outcomes[selected].value, normalized),
      source_statuses,
      fallback_used: selected > 0,
    };
  }
  const incomplete = source_statuses.some(({ status }) => status === "unavailable");
  return {
    found: false,
    source_statuses,
    fallback_used: true,
    error: incomplete
      ? `No match confirmed for ${normalized}. Some registry sources are unavailable; please try again.`
      : `No registry record found for ${normalized}.`,
  };
}