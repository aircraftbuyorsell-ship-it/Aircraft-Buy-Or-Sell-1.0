/**
 * Adapters: aviation registries and safety records.
 *
 * These wrap the existing ABOS server functions rather than re-implementing
 * lookups. Owner masking applied by the existing lookup layer is preserved —
 * the intelligence layer never widens the privacy surface.
 *
 * A registry that returns nothing is NOT a negative finding. It produces no
 * candidates and the router records the call as "no match", which surfaces in
 * the UI as Unavailable, never as a red flag (§9).
 */

import { base44 } from "@/api/base44Client";
import { lookupAircraft } from "@/lib/aircraftLookup";
import { source, DATA_CLASS } from "../provenance.js";

function make(providerId, providerName, field, value, { sourceDate = null, url = null } = {}) {
  if (value === null || value === undefined || value === "") return null;
  return {
    field,
    value,
    dataClass: DATA_CLASS.OBSERVED,
    source: source({ providerId, providerName, type: DATA_CLASS.OBSERVED, sourceDate, url }),
  };
}

/**
 * US registry (FAA). The router only routes here for N-numbers, so a miss
 * genuinely means "not on the US register" rather than "wrong registry asked".
 */
export async function faaAdapter({ registration }) {
  const result = await lookupAircraft(registration);
  if (!result?.found || !result?.aircraft) {
    return { candidates: [], note: result?.error || "No FAA record returned." };
  }
  const a = result.aircraft;
  const p = "faa";
  const name = "FAA registry";
  const date = a.last_action_date || a.certificate_issue_date || null;

  const candidates = [
    make(p, name, "registration", a.registration, { sourceDate: date }),
    make(p, name, "serial_number", a.serial_number, { sourceDate: date }),
    make(p, name, "manufacturer", a.make || a.manufacturer, { sourceDate: date }),
    make(p, name, "model", a.model, { sourceDate: date }),
    make(p, name, "year", toNumber(a.year), { sourceDate: date }),
    make(p, name, "registration_status", statusLabel(a.status), { sourceDate: date }),
    make(p, name, "certificate_issue_date", a.certificate_issue_date, { sourceDate: date }),
    make(p, name, "registered_owner", a.registered_owner, { sourceDate: date }),
    make(p, name, "country", a.origin_country || "US", { sourceDate: date }),
    make(p, name, "registry", "FAA", { sourceDate: date }),
    make(p, name, "engine_make_model", a.engine_make_model || a.engine, { sourceDate: date }),
    make(p, name, "seating", toNumber(a.seats), { sourceDate: date }),
  ].filter(Boolean);

  return { candidates, freshnessH: 168, costEur: 0, meta: { source_statuses: result.source_statuses } };
}

/** Non-US national registries, via the existing registryLookup function. */
export async function nationalRegistryAdapter({ registration }) {
  let data = null;
  try {
    const res = await base44.functions.invoke("registryLookup", { registration });
    data = res?.data ?? res;
  } catch (error) {
    throw new Error(`registryLookup unavailable: ${error?.message || error}`);
  }
  const a = data?.aircraft || (data?.found ? data : null);
  if (!a) return { candidates: [], note: "No national registry record returned." };

  const p = "national_registries";
  const name = data?.registry_name || data?.origin_label || "National registry";
  const date = a.last_updated || data?.retrieved_at || null;

  const candidates = [
    make(p, name, "registration", a.registration || registration, { sourceDate: date }),
    make(p, name, "serial_number", a.serial_number || a.msn, { sourceDate: date }),
    make(p, name, "manufacturer", a.make || a.manufacturer, { sourceDate: date }),
    make(p, name, "model", a.model || a.type, { sourceDate: date }),
    make(p, name, "year", toNumber(a.year), { sourceDate: date }),
    make(p, name, "registration_status", statusLabel(a.status), { sourceDate: date }),
    make(p, name, "country", a.origin_country || a.country, { sourceDate: date }),
    make(p, name, "registry", data?.registry_code || a.registry, { sourceDate: date }),
    make(p, name, "registered_owner", a.registered_owner || a.owner, { sourceDate: date }),
    make(p, name, "operator", a.operator, { sourceDate: date }),
  ].filter(Boolean);

  return { candidates, freshnessH: 336, costEur: 0 };
}

/** NTSB accident / incident evidence. */
export async function ntsbAdapter({ registration }) {
  let data = null;
  try {
    const res = await base44.functions.invoke("safetyEvidenceLookup", { registration });
    data = res?.data ?? res;
  } catch (error) {
    throw new Error(`safetyEvidenceLookup unavailable: ${error?.message || error}`);
  }

  const events = data?.events || data?.records || [];
  const p = "ntsb";
  const name = "NTSB";
  const date = data?.retrieved_at || null;

  // Important: an empty result means "no record found in the sources checked",
  // which we state as exactly that — never as "no accident history" (§36).
  const candidates = [
    make(p, name, "accident_records", `${events.length} record(s) found in NTSB sources checked`, { sourceDate: date }),
  ];
  if (events.length) {
    candidates.push(make(p, name, "damage_history", summariseEvents(events), { sourceDate: date }));
  }

  return { candidates: candidates.filter(Boolean), freshnessH: 720, costEur: 0, meta: { event_count: events.length, events } };
}

function summariseEvents(events) {
  const worst = events.find((e) => /destroyed|substantial/i.test(e.damage || "")) || events[0];
  const year = worst?.event_date ? String(worst.event_date).slice(0, 4) : "date unknown";
  return `${events.length} recorded event(s); most significant: ${worst?.damage || "damage not stated"} (${year})`;
}

function statusLabel(status) {
  const s = String(status || "").trim();
  if (!s) return null;
  if (/^(v|valid|active)$/i.test(s)) return "Valid";
  return s;
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
