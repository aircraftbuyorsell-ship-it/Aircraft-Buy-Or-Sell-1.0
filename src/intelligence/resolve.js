/**
 * ABOS Intelligence Layer — smart data orchestration (master spec §32).
 *
 * The user types N7692J and sees one unified result. Behind it:
 *
 *   1. resolve aircraft identity        6. query valuation if Assess+
 *   2. check the ABOS cache             7. cross-check records
 *   3. query the applicable registry    8. calculate confidence
 *   4. query licensed providers         9. generate intelligence
 *   5. query operational sources       10. display sources
 *
 * Providers are consulted in tier order so a free source can satisfy a field
 * before a paid one is asked for it at all.
 */

import { normalizeReg } from "@/lib/aircraftLookup";
import {
  createAircraft, setField, FIELD_REGISTRY, IDENTITY_KEYS, identity, value as fieldValue,
} from "./schema.js";
import { hasValue, DATA_STATUS } from "./provenance.js";
import { reconcile, rankConflicts } from "./conflict.js";
import { buildPlan, executeStep, stillWorthCalling, summariseCalls, POLICY, policyByName } from "./router.js";
import { adapterFor } from "./adapters/index.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

function cacheKey(registration, policyName) {
  return `${registration}::${policyName}`;
}

export function readCache(registration, policyName) {
  const entry = cache.get(cacheKey(registration, policyName));
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(cacheKey(registration, policyName));
    return null;
  }
  return entry.aircraft;
}

export function writeCache(registration, policyName, aircraft) {
  cache.set(cacheKey(registration, policyName), { at: Date.now(), aircraft });
}

export function clearCache(registration = null) {
  if (!registration) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.startsWith(`${registration}::`)) cache.delete(key);
  }
}

/**
 * Resolve one aircraft into the canonical object.
 *
 * @param {string} query               registration, or a canonical-ish string
 * @param {Object} [options]
 * @param {Object|string} [options.policy]   POLICY entry or its name
 * @param {boolean} [options.force]          bypass the cache
 * @param {Function} [options.onProgress]    (step) => void, for live UI
 * @returns {Promise<Object>} canonical aircraft
 */
export async function resolveAircraft(query, options = {}) {
  const policy = typeof options.policy === "string" ? policyByName(options.policy) : (options.policy || POLICY.SCREEN);
  const registration = normalizeReg(query);
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};

  if (!registration) {
    return {
      ...createAircraft(),
      error: "A registration, serial number or listing reference is required.",
      resolved_at: new Date().toISOString(),
    };
  }

  // Step 2 — cache before anything is paid for.
  if (!options.force) {
    const cached = readCache(registration, policy.name);
    if (cached) {
      onProgress({ phase: "cache", provider_id: "abos_cache", done: true });
      return { ...cached, from_cache: true };
    }
  }

  let aircraft = createAircraft({ abos_id: registration });
  const country = /^N\d/.test(registration.replace(/-/g, "")) ? "US" : null;

  const { plan, skipped, estimatedCostEur } = buildPlan({
    policy,
    context: { registration, country },
  });

  onProgress({ phase: "plan", plan, estimatedCostEur });

  /** field → candidate[] */
  const byField = new Map();
  const calls = [];
  const satisfied = new Set();

  // Execute tier by tier: everything free runs in parallel, then anything
  // paid is reconsidered against what the free tier already produced.
  const tiers = [...new Set(plan.map((s) => s.tier))].sort((a, b) => a - b);

  for (const tier of tiers) {
    const steps = plan
      .filter((s) => s.tier === tier)
      .filter((s) => stillWorthCalling(s, satisfied));

    if (!steps.length) continue;

    const results = await Promise.all(steps.map(async (step) => {
      onProgress({ phase: "call", provider_id: step.provider_id, done: false });
      const context = {
        registration,
        aircraft: {
          manufacturer: fieldValue(aircraft, "manufacturer"),
          model: fieldValue(aircraft, "model"),
          year: fieldValue(aircraft, "year"),
          total_time: fieldValue(aircraft, "total_time"),
          engine_smoh: fieldValue(aircraft, "engine_smoh"),
        },
      };
      const outcome = await executeStep(step, adapterFor(step.provider_id), context);
      onProgress({ phase: "call", provider_id: step.provider_id, done: true, success: outcome.call.success, matched: outcome.call.matched });
      return outcome;
    }));

    for (const { call, candidates } of results) {
      calls.push(call);
      for (const candidate of candidates || []) {
        if (!candidate || !FIELD_REGISTRY[candidate.field]) continue;
        if (!byField.has(candidate.field)) byField.set(candidate.field, []);
        byField.get(candidate.field).push(candidate);
      }
    }

    // Anything now VERIFIED from a free source does not need a paid lookup.
    for (const [key, candidates] of byField.entries()) {
      const distinctProviders = new Set(candidates.map((c) => c.source?.providerId)).size;
      if (distinctProviders >= 2) satisfied.add(key);
    }

    // After identity is known, the valuation tier gets real inputs.
    aircraft = applyCandidates(aircraft, byField);
  }

  // Step 7 & 8 — cross-check and score.
  aircraft = applyCandidates(aircraft, byField);

  const conflicts = [];
  for (const key of Object.keys(FIELD_REGISTRY)) {
    const point = aircraft.fields[key];
    if (point?.conflict) conflicts.push(point.conflict);
  }

  aircraft.conflicts = rankConflicts(conflicts);
  aircraft.provider_calls = calls;
  aircraft.call_summary = summariseCalls(calls);
  aircraft.plan = { plan, skipped, estimated_cost_eur: estimatedCostEur };
  aircraft.policy = policy.name;
  aircraft.identity_confidence = identityConfidence(aircraft);
  aircraft.identity_resolved = aircraft.identity_confidence >= 0.6;
  aircraft.gaps = buildGaps(aircraft, calls);
  aircraft.resolved_at = new Date().toISOString();
  aircraft.registration = registration;

  writeCache(registration, policy.name, aircraft);
  onProgress({ phase: "done", aircraft });
  return aircraft;
}

function applyCandidates(aircraft, byField) {
  let next = aircraft;
  for (const [key, candidates] of byField.entries()) {
    const { point } = reconcile(key, candidates);
    next = setField(next, key, point);
  }
  return next;
}

/**
 * Identity confidence (§7). Weighted by which keys matched and how many
 * independent sources agree. Never reports certainty from a single
 * self-reported source.
 */
export function identityConfidence(aircraft) {
  const weights = { registration: 0.35, serial_number: 0.3, manufacturer: 0.15, model: 0.2 };
  let score = 0;
  let conflictPenalty = 0;

  for (const key of IDENTITY_KEYS) {
    const point = aircraft.fields[key];
    if (!hasValue(point)) continue;
    const independent = new Set((point.sources || []).map((s) => s.providerId)).size;
    const selfReportedOnly = independent === 1 && point.sources[0]?.providerId === "abos_listing";
    const quality = point.status === DATA_STATUS.VERIFIED ? 1
      : selfReportedOnly ? 0.5
        : 0.8;
    score += weights[key] * quality;
    if (point.status === DATA_STATUS.CONFLICTING) conflictPenalty += 0.15;
  }

  return Math.max(0, Math.min(0.99, score - conflictPenalty));
}

/**
 * The honest gap list. A gap says what was not established and why — it is
 * never rendered as a deficiency of the aircraft.
 */
function buildGaps(aircraft, calls) {
  const unavailableProviders = calls.filter((c) => !c.success).map((c) => c.provider_name);
  const gaps = [];

  const important = [
    "serial_number", "total_time", "engine_smoh", "last_annual",
    "damage_history", "registered_owner", "estimated_value",
  ];

  for (const key of important) {
    const point = aircraft.fields[key];
    if (hasValue(point)) continue;
    gaps.push({
      field: key,
      label: FIELD_REGISTRY[key]?.label || key,
      status: point?.status || DATA_STATUS.UNAVAILABLE,
      reason: unavailableProviders.length
        ? `No source consulted returned this. Some sources were unavailable: ${[...new Set(unavailableProviders)].join(", ")}.`
        : "No source consulted returned this value.",
      how_to_close: howToClose(key),
    });
  }
  return gaps;
}

function howToClose(key) {
  switch (key) {
    case "serial_number": return "Confirm from the data plate or the registration certificate.";
    case "total_time":
    case "engine_smoh": return "Upload the current logbook page or a maintenance status sheet.";
    case "last_annual": return "Upload the most recent annual / ARC inspection record.";
    case "damage_history": return "Request a damage-history declaration and, for non-US aircraft, the national authority's records.";
    case "registered_owner": return "Upload the registration certificate.";
    case "estimated_value": return "Provide make, model, year and hours so the market model can run.";
    default: return "Provide a primary document covering this item.";
  }
}

/** Convenience: the identity envelope only, for search results and lists. */
export async function resolveIdentity(query, options = {}) {
  const aircraft = await resolveAircraft(query, { ...options, policy: POLICY.SCREEN });
  return { ...identity(aircraft), gaps: aircraft.gaps, conflicts: aircraft.conflicts };
}
