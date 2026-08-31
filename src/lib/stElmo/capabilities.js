// Relative rather than aliased: the registry and the worker are the testable core
// of St. Elmo and must load under the plain Node test runner, without Vite.
import { APL_ACTIONS } from "../abosAgentProtocol.js";

/**
 * St. Elmo capability registry.
 *
 * St. Elmo M_1.0 plans; ABOS engines decide. This registry is the contract between
 * the two: for every capability the reasoning layer is allowed to put in a plan,
 * it declares which ABOS engine is authoritative, what evidence the capability
 * needs before it may run, and what it contributes back to the evidence ledger.
 *
 * Pure data and pure guards — no I/O — so the authority boundary stays testable
 * without a network, a Base44 session, or a reasoning backend.
 */

/** Evidence keys produced by the ABOS engines. St. Elmo may read these; it may never author them. */
export const EVIDENCE = Object.freeze({
  REGISTRATION: "registration",
  AIRCRAFT: "aircraft",
  VERIFICATION: "verification",
  ATI: "ati",
  OMVM: "omvm",
  MARKETSPACE: "marketspace",
  BUYERS: "buyers",
  TRANSACTION: "transaction",
});

/**
 * Capability descriptors.
 *
 * requires  — evidence keys that must already be present. A missing precondition
 *             blocks the step; it never licenses St. Elmo to guess the value.
 * produces  — the evidence key the engine's output is filed under.
 * engine    — the ABOS engine that owns this fact. St. Elmo never substitutes for it.
 */
export const CAPABILITIES = Object.freeze({
  [APL_ACTIONS.KNOWLEDGE_LOOKUP]: {
    requires: [],
    produces: "knowledge",
    engine: "abosKnowledgeBase",
    stage: "identify",
  },
  [APL_ACTIONS.IDENTIFY_AIRCRAFT]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.AIRCRAFT,
    engine: "aircraftDataHub",
    stage: "identify",
  },
  [APL_ACTIONS.VERIFY_AIRCRAFT]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "verificationAssistant",
    stage: "verify",
  },
  [APL_ACTIONS.VERIFY_REGISTRY]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "registryLookup",
    stage: "verify",
  },
  [APL_ACTIONS.VERIFY_IDENTITY]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "verificationEngine",
    stage: "verify",
  },
  [APL_ACTIONS.VERIFY_OWNERSHIP]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "registryLookup",
    stage: "verify",
  },
  [APL_ACTIONS.VERIFY_ACTIVITY]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "fetchLiveTraffic",
    stage: "verify",
  },
  [APL_ACTIONS.VERIFY_SERVICE]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "aviationServiceIntel",
    stage: "verify",
  },
  [APL_ACTIONS.VERIFY_DOCUMENTS]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.VERIFICATION,
    engine: "verificationEngine",
    stage: "verify",
  },
  [APL_ACTIONS.CALCULATE_ATI]: {
    // ATI is scored against verified evidence. Scoring an unverified aircraft would
    // publish a number ABOS cannot stand behind.
    requires: [EVIDENCE.REGISTRATION, EVIDENCE.VERIFICATION],
    produces: EVIDENCE.ATI,
    engine: "orchestrateATIScoring",
    stage: "analyse",
  },
  [APL_ACTIONS.CALCULATE_OMVM]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.OMVM,
    engine: "invokeOmvmValuation",
    stage: "analyse",
  },
  [APL_ACTIONS.ANALYSE_DEAL]: {
    // A deal verdict is only meaningful once both the condition score and the
    // valuation exist. Without them St. Elmo has an opinion, not an analysis.
    requires: [EVIDENCE.ATI, EVIDENCE.OMVM],
    produces: EVIDENCE.MARKETSPACE,
    engine: "marketspaceAssistant",
    stage: "analyse",
  },
  [APL_ACTIONS.COMPARE_AIRCRAFT]: {
    requires: [],
    produces: EVIDENCE.MARKETSPACE,
    engine: "marketspaceAssistant",
    stage: "analyse",
  },
  [APL_ACTIONS.FIND_BUYERS]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.BUYERS,
    engine: "cmrMatchEngine",
    stage: "match",
  },
  [APL_ACTIONS.CREATE_TRANSACTION]: {
    requires: [EVIDENCE.REGISTRATION, EVIDENCE.VERIFICATION],
    produces: EVIDENCE.TRANSACTION,
    engine: "pipelineIntegrations",
    stage: "transact",
  },
  [APL_ACTIONS.ADVANCE_PIPELINE]: {
    requires: [EVIDENCE.TRANSACTION],
    produces: EVIDENCE.TRANSACTION,
    engine: "onPipelineStatusChange",
    stage: "transact",
  },
  [APL_ACTIONS.OPEN_DEAL_ROOM]: {
    requires: [EVIDENCE.TRANSACTION],
    produces: EVIDENCE.TRANSACTION,
    engine: "pipelineIntegrations",
    stage: "transact",
  },
  [APL_ACTIONS.REQUEST_PREBUY]: {
    requires: [EVIDENCE.REGISTRATION],
    produces: EVIDENCE.TRANSACTION,
    engine: "managePreBuyInspection",
    stage: "transact",
  },
  [APL_ACTIONS.PREPARE_CLOSING]: {
    requires: [EVIDENCE.TRANSACTION],
    produces: EVIDENCE.TRANSACTION,
    engine: "pipelineIntegrations",
    stage: "close",
  },
});

/** Capabilities the reasoning layer is allowed to name at all. */
export function isKnownCapability(capability) {
  return Object.prototype.hasOwnProperty.call(CAPABILITIES, capability);
}

/**
 * Drops anything the reasoning backend invented, de-duplicates, and caps plan
 * length. Mirrors the server-side sanitiser so a plan is filtered on both sides
 * of the boundary rather than trusted because it already crossed it once.
 */
export function sanitizeCapabilityPlan(plan, { maxSteps = 8 } = {}) {
  if (!Array.isArray(plan)) return [];
  const seen = new Set();
  const clean = [];
  for (const entry of plan) {
    const capability = String(entry || "").trim().toUpperCase();
    if (!isKnownCapability(capability) || seen.has(capability)) continue;
    seen.add(capability);
    clean.push(capability);
    if (clean.length >= maxSteps) break;
  }
  return clean;
}

/**
 * Reports which preconditions a capability is still missing, given the evidence
 * gathered so far. An empty array means the step may run.
 */
export function missingPreconditions(capability, evidence = {}) {
  const descriptor = CAPABILITIES[capability];
  if (!descriptor) return ["unknown_capability"];
  return descriptor.requires.filter((key) => {
    const value = evidence[key];
    return value === undefined || value === null || value === "";
  });
}

/**
 * Orders a sanitised plan so that every step runs after the steps producing the
 * evidence it requires, whatever order the model emitted them in.
 *
 * Stage rank alone is too coarse: CALCULATE_ATI and ANALYSE_DEAL share the
 * "analyse" stage, yet one consumes what the other produces. So dependency comes
 * first — a step waits while anything still in the plan can produce what it needs
 * — and workflow stage only breaks ties between steps that are equally ready
 * (identify before verify, which the requires/produces edges do not express).
 * A requirement nothing in the plan can satisfy is left to the worker's
 * precondition check rather than silently reordered around.
 */
const STAGE_RANK = Object.freeze({ identify: 0, verify: 1, analyse: 2, match: 3, transact: 4, close: 5 });

export function orderPlanByDependency(plan, seededEvidence = []) {
  const remaining = [...plan];
  const satisfied = new Set(seededEvidence);
  const ordered = [];

  while (remaining.length) {
    const producible = new Set(
      remaining.map((capability) => CAPABILITIES[capability]?.produces).filter(Boolean),
    );
    // Ready = nothing it still needs is going to be produced later in this plan.
    const ready = remaining
      .map((capability, index) => ({ capability, index }))
      .filter(({ capability }) =>
        (CAPABILITIES[capability]?.requires || []).every(
          (key) => satisfied.has(key) || !producible.has(key),
        ),
      );

    // A cycle leaves nothing ready; fall back to plan order so the worker can
    // still block the offending step with a reason instead of hanging here.
    const next = ready.length
      ? ready.sort(
          (a, b) =>
            (STAGE_RANK[CAPABILITIES[a.capability]?.stage] ?? 9) -
              (STAGE_RANK[CAPABILITIES[b.capability]?.stage] ?? 9) || a.index - b.index,
        )[0]
      : { index: 0 };

    const [capability] = remaining.splice(next.index, 1);
    ordered.push(capability);
    const produces = CAPABILITIES[capability]?.produces;
    if (produces) satisfied.add(produces);
  }

  return ordered;
}
