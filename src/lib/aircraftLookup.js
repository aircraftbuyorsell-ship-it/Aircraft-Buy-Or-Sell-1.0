import { base44 } from "@/api/base44Client";

const DASH_PREFIXES = ["OK", "OM", "EC", "EA", "SE", "OO", "PH", "HB", "OE", "LN", "OY", "ZK", "VH", "CS", "SP", "HA", "LV", "LY", "ES", "UR", "9A", "LZ", "T7", "T9", "9H", "5B", "4O", "ER", "EW", "E7", "9M", "9V", "A7", "RP", "RA", "D", "G", "F", "I", "B"];

export function normalizeReg(value) {
  const compact = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return "";
  if (/^N-?\d/.test(compact)) return compact.replace(/-/g, "");
  if (/^\d{1,5}[A-Z]{0,2}$/.test(compact)) return `N${compact}`;
  if (compact.includes("-")) return compact;
  const prefix = DASH_PREFIXES.find((item) => compact.startsWith(item) && compact.length > item.length);
  return prefix ? `${prefix}-${compact.slice(prefix.length)}` : compact;
}

function isFound(data) { return Boolean(data?.found && data?.aircraft); }

function normalizeResult(data, registration) {
  if (!isFound(data)) return data;
  const aircraft = { ...data.aircraft };
  const rawStatus = String(aircraft.status_code || aircraft.status || aircraft.registration_status || "").trim();
  const status = /^(v|valid|active)$/i.test(rawStatus) ? "V" : rawStatus;
  aircraft.status = status;
  aircraft.status_code = status;
  aircraft.registration = normalizeReg(aircraft.registration || registration);
  aircraft.registered_owner = "****";
  for (const field of ["name", "owner", "owner_name", "owner_masked", "registered_owner_name"]) {
    if (field in aircraft) aircraft[field] = "****";
  }
  return { ...data, aircraft };
}

function toPublicTwinResult(data) {
  if (!data?.found) return data;
  return { found: true, source: "public_faa", origin_label: "United States (FAA)", aircraft: {
    registration: data.registration, year: data.year, make: data.make, model: data.model,
    serial_number: data.serial_number_masked, registered_owner: data.owner_masked,
    owner_match: data.owner_match, owner_match_label: data.owner_match_label,
    state: data.owner_state, status: data.registration_status === "Valid" ? "V" : data.registration_status,
    origin_country: "US",
  }, listing: null, areaServices: null };
}

/** The only aircraft lookup used by the public Advisor and Intelligence UI. */
export async function lookupAircraft(registration, options = {}) {
  const normalized = normalizeReg(registration);
  if (!normalized) return { found: false, error: "Aircraft registration is required." };
  const canonicalRegistration = normalized.replace(/-/g, "");
  const attempts = [
    { name: "globalAircraftLookup", payload: { registration: normalized, owner_query: options.ownerQuery || undefined } },
    { name: "publicTwinLookup", payload: { query: canonicalRegistration, owner_query: options.ownerQuery || undefined } },
  ];
  const statuses = [];
  for (let i = 0; i < attempts.length; i += 1) {
    const { name, payload } = attempts[i];
    try {
      const response = await base44.functions.invoke(name, payload);
      const data = name === "publicTwinLookup" ? toPublicTwinResult(response.data) : response.data;
      statuses.push({ source: name, status: isFound(data) ? "matched" : "no_match" });
      if (isFound(data)) return { ...normalizeResult(data, normalized), source_statuses: statuses, fallback_used: i > 0, intelligence_complete: data.schema_version === "advisor-v3" };
    } catch (_) {
      statuses.push({ source: name, status: "unavailable" });
    }
  }
  return { found: false, source_statuses: statuses, fallback_used: true,
    error: statuses.some(({ status }) => status === "unavailable")
      ? `No match confirmed for ${normalized}. Some registry sources are unavailable; please try again.`
      : `No registry record found for ${normalized}.` };
}