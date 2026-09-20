/**
 * Knowledge state — "What we know / What we don't know / What to verify next".
 *
 * This is the three-column panel at the foot of the aircraft page, and it is
 * the plainest expression of the ABOS trust model: the platform states what it
 * established, what it did not, and what would close the gap — in that order,
 * with equal prominence.
 *
 * Never phrase an unknown as a finding. "Full damage history — needs review"
 * is honest; "no damage history" from an empty result is not (§36).
 */

import { field, value, knownFields, missingFields, FIELD_REGISTRY, displayName } from "../schema.js";
import { hasValue, DATA_STATUS } from "../provenance.js";
import { conflictSeverity } from "../conflict.js";

/** Fields worth stating in plain language when they are known. */
const HEADLINE_KNOWN = [
  {
    key: "registration",
    say: (v, a) => `Aircraft is registered as ${v}${value(a, "country") ? ` in ${countryName(value(a, "country"))}` : ""}.`,
  },
  { key: "registration_status", say: (v) => `Registry reports the registration as ${String(v).toLowerCase()}.` },
  { key: "registered_owner", say: (v) => `Registered owner on record: ${v}.` },
  { key: "serial_number", say: (v) => `Serial number on record: ${v}.` },
  { key: "accident_records", say: (v) => `${v}.` },
  { key: "last_seen", say: (v) => `Recent ADS-B activity observed (last seen ${shortDate(v)}).` },
  { key: "total_time", say: (v) => `Airframe total time recorded at ${Number(v).toLocaleString("en-US")} h.` },
  { key: "ad_compliance", say: (v) => `AD compliance: ${v}.` },
  { key: "last_annual", say: (v) => `Last inspection recorded ${shortDate(v)}.` },
  { key: "asking_price", say: (v, a) => `Listed at ${formatMoney(v, value(a, "currency") || "EUR")}.` },
  { key: "estimated_value", say: (v, a) => `Market model values it around ${formatMoney(v, value(a, "currency") || "EUR")}.` },
];

/** Fields whose absence is worth naming explicitly. */
const HEADLINE_UNKNOWN = [
  { key: "damage_history", say: "Full damage and incident detail — not established from the sources consulted." },
  { key: "logbooks", say: "Logbook completeness — no records have been supplied." },
  { key: "total_time", say: "Airframe total time — no source returned a current figure." },
  { key: "engine_smoh", say: "Engine time since overhaul — not established." },
  { key: "ad_compliance", say: "AD and service-bulletin status — not established." },
  { key: "registered_owner", say: "Current registered owner — not returned by any registry consulted." },
  { key: "serial_number", say: "Serial number — not returned, so the data plate cannot be matched." },
  { key: "estimated_value", say: "Market value — insufficient input for the model to run." },
  { key: "comparable_count", say: "Comparable aircraft — limited comparable data for this type." },
  { key: "maintenance_tracking", say: "Maintenance tracking programme — not stated." },
  { key: "last_seen", say: "Operational activity — no ADS-B tracks observed by the feeds consulted." },
];

/**
 * @param {Object} aircraft canonical aircraft
 * @param {Object} [ati] result of computeATI(), used to rank verification steps
 */
export function knowledgeState(aircraft, ati = null) {
  if (!aircraft || !aircraft.fields) {
    return { subject: null, know: [], dontKnow: [], verifyNext: [], caveat: CAVEAT };
  }

  // --- What we know -------------------------------------------------------
  const know = [];
  for (const entry of HEADLINE_KNOWN) {
    const point = field(aircraft, entry.key);
    if (!hasValue(point)) continue;
    if (point.status === DATA_STATUS.CONFLICTING) continue; // belongs in don't-know
    know.push({
      key: entry.key,
      text: entry.say(point.value, aircraft),
      status: point.status,
      sources: (point.sources || []).map((s) => s.providerName || s.providerId),
      point,
    });
  }

  // --- What we don't know -------------------------------------------------
  const dontKnow = [];
  for (const entry of HEADLINE_UNKNOWN) {
    const point = field(aircraft, entry.key);
    if (hasValue(point) && point.status !== DATA_STATUS.CONFLICTING) continue;
    if (point?.status === DATA_STATUS.NOT_APPLICABLE) continue;

    dontKnow.push({
      key: entry.key,
      text: point?.status === DATA_STATUS.CONFLICTING
        ? `${FIELD_REGISTRY[entry.key]?.label || entry.key} — sources disagree, not yet settled.`
        : entry.say,
      status: point?.status || DATA_STATUS.UNAVAILABLE,
      point,
    });
  }

  // Conflicts always surface as things we do not know, whatever the field.
  for (const conflict of aircraft.conflicts || []) {
    if (dontKnow.some((d) => d.key === conflict.field)) continue;
    dontKnow.push({
      key: conflict.field,
      text: `${conflict.label} — ${conflict.values.length} sources disagree (${conflict.difference_display || "values differ"}).`,
      status: DATA_STATUS.CONFLICTING,
      point: field(aircraft, conflict.field),
    });
  }

  // --- What to verify next -------------------------------------------------
  const verifyNext = buildVerificationQueue(aircraft, ati, dontKnow);

  return {
    subject: displayName(aircraft),
    registration: value(aircraft, "registration"),
    know,
    dontKnow,
    verifyNext,
    caveat: CAVEAT,
    counts: {
      known: knownFields(aircraft).length,
      missing: missingFields(aircraft).length,
      conflicting: (aircraft.conflicts || []).length,
    },
  };
}

export const CAVEAT =
  "Missing or unverified data does not automatically mean a negative result. It indicates the need for further verification.";

/**
 * The action queue, ordered by how much it would move the picture. ATI's
 * biggest lifts come first when available, because those are the steps with a
 * measurable payoff.
 */
function buildVerificationQueue(aircraft, ati, dontKnow) {
  const queue = [];
  const seen = new Set();

  const push = (item) => {
    if (!item?.action || seen.has(item.action)) return;
    seen.add(item.action);
    queue.push(item);
  };

  // Conflicts first — a disagreement is a live problem, not a gap.
  for (const conflict of aircraft.conflicts || []) {
    push({
      action: conflict.required_action,
      reason: `${conflict.label}: ${conflict.likely_reason}`,
      priority: conflictSeverity(conflict) === "high" ? "high" : "medium",
      kind: "conflict",
      ati_points: null,
    });
  }

  // Then whatever raises transparency the most.
  for (const lift of ati?.biggest_lifts || []) {
    push({
      action: lift.action,
      reason: `Raises ${lift.dimension} — up to ${lift.points_available} ATI points available.`,
      priority: lift.points_available >= 8 ? "high" : "medium",
      kind: "ati_lift",
      ati_points: lift.points_available,
    });
  }

  // Then the remaining named unknowns.
  for (const gap of aircraft.gaps || []) {
    push({
      action: gap.how_to_close,
      reason: gap.label,
      priority: "low",
      kind: "gap",
      ati_points: null,
    });
  }

  if (!queue.length && dontKnow.length) {
    push({
      action: "Request a pre-purchase inspection to establish condition directly.",
      reason: "Remote sources have been exhausted for this aircraft.",
      priority: "medium",
      kind: "gap",
      ati_points: null,
    });
  }

  return queue.slice(0, 8);
}

/* ------------------------------------------------------------- helpers */

function countryName(code) {
  const map = { US: "the United States", CZ: "Czechia", DE: "Germany", GB: "the United Kingdom", FR: "France", PL: "Poland", SK: "Slovakia", AT: "Austria", CH: "Switzerland" };
  return map[String(code).toUpperCase()] || String(code);
}

function shortDate(v) {
  if (!v) return "date unknown";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
}

function formatMoney(n, currency = "EUR") {
  if (!Number.isFinite(Number(n))) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return `${symbol}${Math.round(Number(n)).toLocaleString("en-US")}`;
}
