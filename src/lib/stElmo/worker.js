import { CAPABILITIES, EVIDENCE, missingPreconditions, orderPlanByDependency, sanitizeCapabilityPlan } from "./capabilities.js";

/**
 * St. Elmo worker — the execution half of the reasoning agent.
 *
 * St. Elmo M_1.0 produces a capability plan. Until now nothing ran it: the plan
 * was rendered as text and ABOS routing happened separately by keyword. This
 * worker closes that loop. It walks the plan, asks the ABOS engines for each
 * fact, and files what comes back into an evidence ledger.
 *
 * The authority boundary is enforced here, not requested politely in a prompt:
 *   - only registry capabilities run; anything else is blocked, never improvised
 *   - a step whose preconditions are unmet is blocked with a reason, so a missing
 *     fact can never be filled in by the reasoning layer
 *   - only engine output becomes evidence; the worker writes no facts of its own
 *
 * Engines are injected, so the worker is testable without a network or a session.
 */

export const WORKER_PHASES = Object.freeze(["queued", "reasoning", "tools", "synthesis", "completed", "failed"]);

const DEFAULT_MAX_STEPS = 8;

/**
 * @param {object}   input
 * @param {string[]} input.plan      Capability plan from St. Elmo's reasoning step.
 * @param {object}   input.engines   Capability -> async (ctx) => evidence. Injected.
 * @param {object}   [input.context] Seed evidence (e.g. a registration parsed from the request).
 * @param {function} [input.onPhase] Called as the worker moves through its phases.
 * @param {function} [input.onStep]  Called after each step settles.
 */
export async function runStElmoWorker({
  plan,
  engines = {},
  context = {},
  onPhase,
  onStep,
  maxSteps = DEFAULT_MAX_STEPS,
} = {}) {
  const startedAt = new Date().toISOString();
  const sanitized = sanitizeCapabilityPlan(plan, { maxSteps });
  const rejected = rejectedFrom(plan, sanitized);
  const evidence = seedEvidence(context);
  const ordered = orderPlanByDependency(sanitized, Object.keys(evidence));
  const steps = [];
  const run = {
    startedAt,
    plan: ordered,
    rejected,
    steps,
    evidence,
    phase: "queued",
    status: "queued",
    completedAt: null,
  };

  const phase = (next) => {
    run.phase = next;
    run.status = next;
    try { onPhase?.(next, run); } catch { /* a reporting hook must never fail the run */ }
  };

  if (!ordered.length) {
    phase("completed");
    run.completedAt = new Date().toISOString();
    run.summary = summarize(run);
    return run;
  }

  phase("tools");

  for (const capability of ordered) {
    const descriptor = CAPABILITIES[capability];
    const missing = missingPreconditions(capability, evidence);

    if (missing.length) {
      steps.push(record(capability, descriptor, { status: "blocked", missing }));
      onStep?.(steps[steps.length - 1], run);
      continue;
    }

    const engine = engines[capability];
    if (typeof engine !== "function") {
      // No binding means ABOS has not delegated this fact to the worker. Planning it
      // is allowed; inventing the answer is not.
      steps.push(record(capability, descriptor, { status: "unavailable", reason: "no_engine_binding" }));
      onStep?.(steps[steps.length - 1], run);
      continue;
    }

    const stepStartedAt = Date.now();
    try {
      const data = await engine({ ...context, evidence, capability });
      if (data !== undefined && data !== null) evidence[descriptor.produces] = data;
      steps.push(record(capability, descriptor, { status: "ok", durationMs: Date.now() - stepStartedAt }));
    } catch (error) {
      // One engine failing is not the run failing: later steps that depend on this
      // fact will block on their own preconditions rather than run on a guess.
      steps.push(record(capability, descriptor, {
        status: "failed",
        error: error?.message || String(error),
        durationMs: Date.now() - stepStartedAt,
      }));
    }
    onStep?.(steps[steps.length - 1], run);
  }

  phase("synthesis");
  run.completedAt = new Date().toISOString();
  run.summary = summarize(run);
  phase(steps.some((step) => step.status === "ok") || !steps.length ? "completed" : "failed");
  return run;
}

function seedEvidence(context) {
  const evidence = {};
  if (context?.registration) evidence[EVIDENCE.REGISTRATION] = context.registration;
  for (const key of Object.values(EVIDENCE)) {
    if (context?.evidence?.[key] !== undefined) evidence[key] = context.evidence[key];
  }
  return evidence;
}

function rejectedFrom(plan, sanitized) {
  if (!Array.isArray(plan)) return [];
  const kept = new Set(sanitized);
  return [...new Set(plan.map((x) => String(x || "").trim().toUpperCase()).filter((x) => x && !kept.has(x)))];
}

function record(capability, descriptor, extra) {
  return {
    capability,
    engine: descriptor?.engine || null,
    stage: descriptor?.stage || null,
    produces: descriptor?.produces || null,
    authority: "abos-engine",
    ...extra,
  };
}

/**
 * A plain-language account of what actually ran. Deliberately derived from the
 * step ledger rather than from the model, so the summary cannot claim evidence
 * the engines never returned.
 */
export function summarize(run) {
  const counts = run.steps.reduce((acc, step) => ({ ...acc, [step.status]: (acc[step.status] || 0) + 1 }), {});
  const blocked = run.steps.filter((step) => step.status === "blocked");
  const failed = run.steps.filter((step) => step.status === "failed");
  return {
    executed: counts.ok || 0,
    blocked: counts.blocked || 0,
    failed: counts.failed || 0,
    unavailable: counts.unavailable || 0,
    evidenceKeys: Object.keys(run.evidence),
    blockedReasons: blocked.map((step) => ({ capability: step.capability, missing: step.missing })),
    failures: failed.map((step) => ({ capability: step.capability, error: step.error })),
  };
}
