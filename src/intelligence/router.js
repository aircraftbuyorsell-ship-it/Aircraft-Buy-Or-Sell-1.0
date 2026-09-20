/**
 * ABOS Intelligence Layer — provider routing engine (master spec §30–§32).
 *
 * The router decides WHICH sources get asked, in WHAT order, and WHEN to stop.
 * It exists so that no screen ever hard-codes a provider, and so that an
 * expensive call is never made when a cached or free source already answers
 * the question.
 *
 * Preference order (§31):
 *   1. existing ABOS cached data
 *   2. free / open source
 *   3. licensed provider
 *   4. premium provider
 *   5. live lookup
 *
 * Every call records estimated_cost, actual_cost, latency, success and
 * freshness, so the economics of a feature are observable rather than assumed.
 */

import { ACCESS_TIER, PROVIDER_CATEGORY, getProvider, allProviders } from "./registry.js";

/**
 * Policies. A policy is "how much is this question worth?" — SCREEN must stay
 * nearly free because it runs on every search; COMMIT is a paid product and
 * can afford premium sources.
 */
export const POLICY = {
  SCREEN: {
    name: "screen",
    label: "Screen",
    maxTier: ACCESS_TIER.OPEN,
    budgetEur: 0,
    categories: [
      PROVIDER_CATEGORY.INTERNAL,
      PROVIDER_CATEGORY.REGISTRY,
      PROVIDER_CATEGORY.MARKETPLACE,
      PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
    ],
    allowLiveLookup: false,
    maxStalenessH: 720,
  },
  ASSESS: {
    name: "assess",
    label: "Assess",
    maxTier: ACCESS_TIER.PREMIUM,
    budgetEur: 8,
    categories: [
      PROVIDER_CATEGORY.INTERNAL,
      PROVIDER_CATEGORY.REGISTRY,
      PROVIDER_CATEGORY.MARKETPLACE,
      PROVIDER_CATEGORY.VALUATION,
      PROVIDER_CATEGORY.AIRCRAFT_INTELLIGENCE,
      PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
      PROVIDER_CATEGORY.DOCUMENT,
    ],
    allowLiveLookup: true,
    maxStalenessH: 168,
  },
  COMMIT: {
    name: "commit",
    label: "Commit",
    maxTier: ACCESS_TIER.LIVE_LOOKUP,
    budgetEur: 40,
    categories: Object.values(PROVIDER_CATEGORY),
    allowLiveLookup: true,
    maxStalenessH: 72,
  },
  API: {
    name: "api",
    label: "Partner API",
    maxTier: ACCESS_TIER.LICENSED,
    budgetEur: 2,
    categories: [
      PROVIDER_CATEGORY.INTERNAL,
      PROVIDER_CATEGORY.REGISTRY,
      PROVIDER_CATEGORY.MARKETPLACE,
      PROVIDER_CATEGORY.VALUATION,
      PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
    ],
    allowLiveLookup: false,
    maxStalenessH: 168,
  },
};

export function policyByName(name) {
  const key = String(name || "").toUpperCase();
  return POLICY[key] || POLICY.SCREEN;
}

/**
 * Is a registry provider relevant to this aircraft at all? Asking the FAA
 * about OK-XYZ is a wasted call, and — more importantly — a "not found" from
 * the FAA about a Czech aircraft must never read as a negative finding (§9).
 */
export function providerAppliesTo(provider, { registration = "", country = "" } = {}) {
  const reg = String(registration || "").toUpperCase();
  const isUS = /^N\d/.test(reg.replace(/-/g, "")) || String(country).toUpperCase() === "US";

  if (provider.provider_id === "faa" || provider.provider_id === "ntsb") return isUS;
  if (provider.provider_id === "national_registries") return !isUS;
  return true;
}

/**
 * Build the ordered call plan for a request.
 *
 * @param {Object}   options
 * @param {Object}   options.policy      one of POLICY
 * @param {string[]} [options.fields]    canonical field keys the caller needs
 * @param {string[]} [options.categories] restrict to these provider categories
 * @param {Object}   [options.context]   { registration, country }
 * @param {string[]} [options.exclude]   provider ids to skip
 * @returns {{plan: Array, skipped: Array, estimatedCostEur: number}}
 */
export function buildPlan({
  policy = POLICY.SCREEN,
  fields = null,
  categories = null,
  context = {},
  exclude = [],
} = {}) {
  const wanted = categories || policy.categories;
  const skipped = [];
  const plan = [];
  let estimatedCostEur = 0;

  const candidates = allProviders()
    .filter((p) => {
      if (exclude.includes(p.provider_id)) return false;
      if (!p.enabled) { skipped.push({ provider_id: p.provider_id, reason: "not_enabled" }); return false; }
      if (!wanted.includes(p.category)) { skipped.push({ provider_id: p.provider_id, reason: "category_not_in_policy" }); return false; }
      if (p.tier > policy.maxTier) { skipped.push({ provider_id: p.provider_id, reason: "above_policy_tier" }); return false; }
      if (!providerAppliesTo(p, context)) { skipped.push({ provider_id: p.provider_id, reason: "not_applicable_to_registry" }); return false; }
      if (fields && !p.provides.includes("*") && !fields.some((f) => p.provides.includes(f))) {
        skipped.push({ provider_id: p.provider_id, reason: "provides_nothing_requested" });
        return false;
      }
      return true;
    })
    // Cheap and trusted first: tier ascending, then confidence descending.
    .sort((a, b) => a.tier - b.tier || b.confidence - a.confidence || a.cost_per_call_eur - b.cost_per_call_eur);

  for (const provider of candidates) {
    const cost = provider.cost_per_call_eur || 0;
    if (cost > 0 && estimatedCostEur + cost > policy.budgetEur) {
      skipped.push({ provider_id: provider.provider_id, reason: "over_budget" });
      continue;
    }
    estimatedCostEur += cost;
    plan.push({
      provider_id: provider.provider_id,
      name: provider.name,
      category: provider.category,
      tier: provider.tier,
      estimated_cost_eur: cost,
      expected_freshness_h: provider.data_freshness_h,
      provides: provider.provides,
    });
  }

  return { plan, skipped, estimatedCostEur: round2(estimatedCostEur) };
}

/**
 * Do we still need to call this provider, given what we already hold?
 * A premium source is not worth paying for if every field it offers is
 * already VERIFIED from a free one.
 */
export function stillWorthCalling(step, satisfiedFields = new Set(), { fields = null } = {}) {
  if (step.estimated_cost_eur === 0) return true;
  if (step.provides.includes("*")) return true;
  const target = fields ? step.provides.filter((f) => fields.includes(f)) : step.provides;
  if (!target.length) return false;
  return target.some((f) => !satisfiedFields.has(f));
}

/**
 * Invoke one provider through its adapter and record the telemetry.
 * Never throws: a provider that fails is recorded as unavailable, which is
 * not the same thing as the aircraft having no such data (§9, §36).
 *
 * @param {Object}   step     entry from buildPlan().plan
 * @param {Function} adapter  async (request) => { candidates, freshnessH, meta }
 * @param {Object}   request
 */
export async function executeStep(step, adapter, request = {}) {
  const provider = getProvider(step.provider_id);
  const startedAt = Date.now();

  if (typeof adapter !== "function") {
    return {
      call: callRecord(step, { success: false, latencyMs: 0, error: "no_adapter" }),
      candidates: [],
    };
  }

  try {
    const result = await adapter(request, { provider });
    const latencyMs = Date.now() - startedAt;
    const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
    return {
      call: callRecord(step, {
        success: true,
        latencyMs,
        freshnessH: result?.freshnessH ?? provider?.data_freshness_h ?? null,
        matched: candidates.length > 0,
        actualCostEur: result?.costEur ?? step.estimated_cost_eur,
        note: result?.note || null,
      }),
      candidates,
      meta: result?.meta || null,
    };
  } catch (error) {
    return {
      call: callRecord(step, {
        success: false,
        latencyMs: Date.now() - startedAt,
        // A failed call costs nothing to ABOS's story about the aircraft.
        actualCostEur: 0,
        error: error?.message || String(error),
      }),
      candidates: [],
    };
  }
}

function callRecord(step, {
  success, latencyMs, freshnessH = null, matched = false,
  actualCostEur = 0, error = null, note = null,
}) {
  return {
    provider_id: step.provider_id,
    provider_name: step.name,
    category: step.category,
    tier: step.tier,
    estimated_cost_eur: step.estimated_cost_eur,
    actual_cost_eur: round2(actualCostEur),
    latency_ms: latencyMs,
    freshness_h: freshnessH,
    success,
    matched,
    error,
    note,
    at: new Date().toISOString(),
  };
}

/** Roll the call log up into something worth putting on an admin screen. */
export function summariseCalls(calls = []) {
  const total = calls.length;
  const succeeded = calls.filter((c) => c.success).length;
  const matched = calls.filter((c) => c.matched).length;
  const cost = calls.reduce((sum, c) => sum + (c.actual_cost_eur || 0), 0);
  const latency = calls.reduce((sum, c) => sum + (c.latency_ms || 0), 0);
  return {
    calls: total,
    succeeded,
    failed: total - succeeded,
    matched,
    total_cost_eur: round2(cost),
    total_latency_ms: latency,
    slowest: calls.slice().sort((a, b) => (b.latency_ms || 0) - (a.latency_ms || 0))[0] || null,
    unavailable_providers: calls.filter((c) => !c.success).map((c) => c.provider_id),
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
