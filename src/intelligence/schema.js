/**
 * ABOS Intelligence Layer — canonical Aircraft object (master spec §7, §62).
 *
 * The aircraft is the primary intelligence object. Identity, market, value,
 * history, verification, documents, maintenance, operations, costs, services,
 * financing, insurance and transaction all attach to it, and every source
 * feeds the same object.
 *
 * The frontend must never depend on a provider's terminology. Adapters
 * translate provider payloads into this shape; nothing else in the app should
 * know that JETNET calls it `acSerialNbr` or that the FAA calls it `MFR MDL`.
 */

import { dataPoint, unavailable, DATA_STATUS, aggregateConfidence, hasValue } from "./provenance.js";

/** Primary identity keys — the minimum needed to say "this is the same aircraft". */
export const IDENTITY_KEYS = ["registration", "serial_number", "manufacturer", "model"];

/** Secondary identity keys, used to strengthen a match where available. */
export const SECONDARY_IDENTITY_KEYS = [
  "engine_serial",
  "propeller_serial",
  "owner_entity_id",
  "operator_id",
  "country",
  "registry",
  "year",
];

/**
 * The canonical field registry. Every field the intelligence layer knows how
 * to hold, which section of the aircraft page it belongs to, its unit, and
 * whether it is part of identity resolution.
 *
 * Adding a provider never means adding a field here unless the field is
 * genuinely new to ABOS — that is the point of the abstraction.
 */
export const FIELD_REGISTRY = {
  // --- Identity -----------------------------------------------------------
  registration: { section: "identity", label: "Registration", identity: true },
  serial_number: { section: "identity", label: "Serial number", identity: true },
  manufacturer: { section: "identity", label: "Manufacturer", identity: true },
  model: { section: "identity", label: "Model", identity: true },
  year: { section: "identity", label: "Year of manufacture" },
  aircraft_type: { section: "identity", label: "Type" },
  country: { section: "identity", label: "Country of registry" },
  registry: { section: "identity", label: "Registry" },
  registration_status: { section: "identity", label: "Registration status" },
  certificate_issue_date: { section: "identity", label: "Certificate issued" },

  // --- Ownership ----------------------------------------------------------
  registered_owner: { section: "ownership", label: "Registered owner" },
  owner_entity_id: { section: "ownership", label: "Owner entity ID" },
  operator: { section: "ownership", label: "Operator" },
  operator_id: { section: "ownership", label: "Operator ID" },
  ownership_since: { section: "ownership", label: "Owned since" },
  ownership_changes: { section: "ownership", label: "Ownership changes on record" },

  // --- Airframe -----------------------------------------------------------
  total_time: { section: "airframe", label: "Airframe total time", unit: "h" },
  total_cycles: { section: "airframe", label: "Airframe cycles" },
  last_annual: { section: "airframe", label: "Last annual inspection" },
  next_inspection_due: { section: "airframe", label: "Next inspection due" },

  // --- Engine / propeller -------------------------------------------------
  engine_make_model: { section: "engine", label: "Engine" },
  engine_serial: { section: "engine", label: "Engine serial" },
  engine_count: { section: "engine", label: "Engines" },
  engine_tsn: { section: "engine", label: "Engine time since new", unit: "h" },
  engine_smoh: { section: "engine", label: "Engine SMOH", unit: "h" },
  engine_tbo: { section: "engine", label: "Engine TBO", unit: "h" },
  engine_program: { section: "engine", label: "Engine programme" },
  propeller_make_model: { section: "engine", label: "Propeller" },
  propeller_serial: { section: "engine", label: "Propeller serial" },
  propeller_since_overhaul: { section: "engine", label: "Propeller SPOH", unit: "h" },
  propeller_tbo: { section: "engine", label: "Propeller TBO", unit: "h" },

  // --- Avionics & configuration ------------------------------------------
  avionics_suite: { section: "avionics", label: "Avionics suite" },
  ads_b_out: { section: "avionics", label: "ADS-B Out" },
  autopilot: { section: "avionics", label: "Autopilot" },
  seating: { section: "configuration", label: "Seating" },
  interior_year: { section: "configuration", label: "Interior refurbished" },
  exterior_year: { section: "configuration", label: "Exterior refurbished" },
  stcs: { section: "configuration", label: "STCs / modifications" },

  // --- Market -------------------------------------------------------------
  asking_price: { section: "market", label: "Asking price", unit: "EUR" },
  currency: { section: "market", label: "Listing currency" },
  listing_status: { section: "market", label: "Listing status" },
  listing_url: { section: "market", label: "Listing" },
  days_on_market: { section: "market", label: "Days on market" },
  price_changes: { section: "market", label: "Price changes on record" },
  comparable_count: { section: "market", label: "Comparable aircraft" },
  market_median: { section: "market", label: "Market median", unit: "EUR" },

  // --- Value --------------------------------------------------------------
  estimated_value: { section: "value", label: "Estimated value", unit: "EUR" },
  value_low: { section: "value", label: "Range low", unit: "EUR" },
  value_high: { section: "value", label: "Range high", unit: "EUR" },

  // --- History ------------------------------------------------------------
  damage_history: { section: "history", label: "Damage / incident history" },
  accident_records: { section: "history", label: "Accident records checked" },
  export_import_history: { section: "history", label: "Export / import history" },

  // --- Maintenance --------------------------------------------------------
  ad_compliance: { section: "maintenance", label: "AD compliance" },
  open_sbs: { section: "maintenance", label: "Open service bulletins" },
  maintenance_tracking: { section: "maintenance", label: "Maintenance tracking" },
  deferred_maintenance: { section: "maintenance", label: "Deferred maintenance" },

  // --- Operations ---------------------------------------------------------
  last_known_position: { section: "operations", label: "Last known position" },
  last_seen: { section: "operations", label: "Last seen" },
  flights_90d: { section: "operations", label: "Flights (90 days)" },
  hours_12m: { section: "operations", label: "Utilisation (12 months)", unit: "h" },
  home_base: { section: "operations", label: "Home base" },

  // --- Documents ----------------------------------------------------------
  documents_on_file: { section: "documents", label: "Documents on file" },
  logbooks: { section: "documents", label: "Logbooks" },
};

export const SECTIONS = [
  "identity", "ownership", "airframe", "engine", "avionics", "configuration",
  "market", "value", "history", "maintenance", "operations", "documents",
];

export const SECTION_LABEL = {
  identity: "Identity",
  ownership: "Ownership",
  airframe: "Airframe",
  engine: "Engine & propeller",
  avionics: "Avionics",
  configuration: "Configuration",
  market: "Market",
  value: "Value",
  history: "History",
  maintenance: "Maintenance",
  operations: "Operations",
  documents: "Documents",
};

/**
 * Create an empty canonical aircraft. Every registered field starts as an
 * explicit "not retrieved" rather than undefined, so the UI can never mistake
 * a missing field for a zero.
 */
export function createAircraft(seed = {}) {
  const fields = {};
  for (const key of Object.keys(FIELD_REGISTRY)) {
    fields[key] = unavailable("Not retrieved.", { label: FIELD_REGISTRY[key].label });
  }

  return {
    abos_id: seed.abos_id || null,
    identity_confidence: 0,
    identity_resolved: false,
    fields,
    /** Every provider call that contributed, with cost/latency/freshness (§31). */
    provider_calls: [],
    /** Unresolved disagreements between sources (§33). */
    conflicts: [],
    /** Fields ABOS wanted but could not obtain — shown as gaps, not failures. */
    gaps: [],
    resolved_at: null,
    ...seed,
  };
}

/** Read a canonical field's data point. */
export function field(aircraft, key) {
  return aircraft?.fields?.[key] || null;
}

/** Read a canonical field's raw value, with a fallback. */
export function value(aircraft, key, fallback = null) {
  const point = field(aircraft, key);
  return hasValue(point) ? point.value : fallback;
}

/**
 * Write a data point onto the aircraft. Refuses to silently overwrite a
 * populated field with a different value — that is what the conflict engine
 * is for (§7: "Never allow conflicting records to silently overwrite").
 */
export function setField(aircraft, key, point) {
  if (!FIELD_REGISTRY[key]) {
    throw new Error(`Unknown canonical field: ${key}. Add it to FIELD_REGISTRY first.`);
  }
  const labelled = { ...point, label: point.label || FIELD_REGISTRY[key].label };
  return {
    ...aircraft,
    fields: { ...aircraft.fields, [key]: labelled },
  };
}

/** All fields belonging to one section, in registry order. */
export function sectionFields(aircraft, section) {
  return Object.keys(FIELD_REGISTRY)
    .filter((key) => FIELD_REGISTRY[key].section === section)
    .map((key) => ({ key, ...FIELD_REGISTRY[key], point: field(aircraft, key) }));
}

/** Confidence roll-up for one section. */
export function sectionConfidence(aircraft, section) {
  return aggregateConfidence(sectionFields(aircraft, section).map((f) => f.point));
}

/** Fields that carry an actual value. */
export function knownFields(aircraft) {
  return Object.entries(aircraft.fields || {})
    .filter(([, point]) => hasValue(point))
    .map(([key, point]) => ({ key, ...FIELD_REGISTRY[key], point }));
}

/** Fields ABOS looked for and did not find — the honest gap list. */
export function missingFields(aircraft) {
  return Object.entries(aircraft.fields || {})
    .filter(([, point]) => point?.status === DATA_STATUS.UNAVAILABLE)
    .map(([key, point]) => ({ key, ...FIELD_REGISTRY[key], point }));
}

/**
 * The canonical identity envelope (§7). This is what the API returns and what
 * other providers are matched against.
 */
export function identity(aircraft) {
  const sources = new Set();
  for (const key of IDENTITY_KEYS) {
    for (const s of field(aircraft, key)?.sources || []) sources.add(s.providerId);
  }
  return {
    registration: value(aircraft, "registration"),
    serial_number: value(aircraft, "serial_number"),
    manufacturer: value(aircraft, "manufacturer"),
    model: value(aircraft, "model"),
    year: value(aircraft, "year"),
    country: value(aircraft, "country"),
    registry: value(aircraft, "registry"),
    identity_confidence: aircraft.identity_confidence,
    sources: [...sources],
  };
}

/** Short human label, e.g. "2004 Cessna 172S — N7692J". */
export function displayName(aircraft) {
  const parts = [
    value(aircraft, "year"),
    value(aircraft, "manufacturer"),
    value(aircraft, "model"),
  ].filter(Boolean);
  const reg = value(aircraft, "registration");
  if (!parts.length) return reg || "Unidentified aircraft";
  return reg ? `${parts.join(" ")} — ${reg}` : parts.join(" ");
}

/**
 * Serialise for the public API (§29): data and provenance side by side,
 * never data alone.
 */
export function toApiShape(aircraft) {
  const data = {};
  const provenance = { fields: {}, sources: [], calls: aircraft.provider_calls, conflicts: aircraft.conflicts };
  const seen = new Map();

  for (const [key, point] of Object.entries(aircraft.fields || {})) {
    if (!hasValue(point)) continue;
    data[key] = point.unit ? { value: point.value, unit: point.unit } : point.value;
    provenance.fields[key] = {
      status: point.status,
      confidence: Number(point.confidence.toFixed(2)),
      type: point.dataClass,
      sources: point.sources.map((s) => s.providerId),
      source_date: point.sourceDate,
      calculation: point.calculation,
    };
    for (const s of point.sources) {
      if (!seen.has(s.providerId)) {
        seen.set(s.providerId, { provider: s.providerId, name: s.providerName, type: s.type, retrieved_at: s.retrievedAt });
      }
    }
  }
  provenance.sources = [...seen.values()];

  return {
    aircraft: { ...identity(aircraft), ...data },
    provenance,
    gaps: aircraft.gaps,
    resolved_at: aircraft.resolved_at,
  };
}

export { dataPoint, unavailable };
