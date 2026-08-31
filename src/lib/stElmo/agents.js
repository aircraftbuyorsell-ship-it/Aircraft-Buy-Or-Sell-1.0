import { ADL_AGENTS, APL_ACTIONS, capabilityOwner } from "@/lib/abosAgentProtocol";

/**
 * St. Elmo M_1.0 agent topology.
 *
 * One user-facing Master agent delegates to four governed specialist agents.
 * APL remains the executable action vocabulary; ADL remains the authority,
 * trust, autonomy and audit contract. Specialists never become alternate chat
 * entry points and never invent evidence.
 */
export const ST_ELMO_AGENTS = Object.freeze({
  master: {
    ...ADL_AGENTS.MASTER,
    role: "orchestrator",
    acceptsUserInput: true,
    capabilities: Object.values(APL_ACTIONS),
  },
  verification: {
    ...ADL_AGENTS.VERIFICATION,
    role: "verification",
    acceptsUserInput: false,
    capabilities: [
      APL_ACTIONS.IDENTIFY_AIRCRAFT,
      APL_ACTIONS.VERIFY_AIRCRAFT,
      APL_ACTIONS.VERIFY_REGISTRY,
      APL_ACTIONS.VERIFY_IDENTITY,
      APL_ACTIONS.VERIFY_OWNERSHIP,
      APL_ACTIONS.VERIFY_ACTIVITY,
      APL_ACTIONS.VERIFY_SERVICE,
      APL_ACTIONS.VERIFY_DOCUMENTS,
      APL_ACTIONS.REQUEST_PREBUY,
    ],
  },
  intelligence: {
    ...ADL_AGENTS.INTELLIGENCE,
    role: "intelligence",
    acceptsUserInput: false,
    capabilities: [APL_ACTIONS.CALCULATE_ATI, APL_ACTIONS.CALCULATE_OMVM],
  },
  marketspace: {
    ...ADL_AGENTS.MARKETSPACE,
    role: "marketspace",
    acceptsUserInput: false,
    capabilities: [APL_ACTIONS.ANALYSE_DEAL, APL_ACTIONS.COMPARE_AIRCRAFT, APL_ACTIONS.FIND_BUYERS],
  },
  deal: {
    ...ADL_AGENTS.DEAL,
    role: "deal",
    acceptsUserInput: false,
    capabilities: [APL_ACTIONS.CREATE_TRANSACTION, APL_ACTIONS.ADVANCE_PIPELINE, APL_ACTIONS.OPEN_DEAL_ROOM, APL_ACTIONS.PREPARE_CLOSING],
  },
});

export function delegateAPLPlan(plan = []) {
  const seen = new Set();
  return plan.map((capability) => {
    const ownerId = capabilityOwner(capability);
    if (seen.has(capability)) return null;
    seen.add(capability);
    const agent = Object.values(ST_ELMO_AGENTS).find((candidate) => candidate.id === ownerId) || ST_ELMO_AGENTS.master;
    return {
      capability,
      owner: agent.id,
      role: agent.role,
      autonomy: agent.autonomy,
      trust: agent.trust,
      audit: agent.audit,
      handoff: ownerId === ST_ELMO_AGENTS.master.id ? "self" : "master_to_specialist",
    };
  }).filter(Boolean);
}

export function buildADLContext({ request, registration = null, plan = [], sessionId = null } = {}) {
  return Object.freeze({
    protocol: { apl: "1.0", adl: "1.0" },
    session_id: sessionId || crypto.randomUUID(),
    master: ST_ELMO_AGENTS.master.id,
    request: String(request || ""),
    registration,
    delegation: delegateAPLPlan(plan),
    policy: {
      evidenceAuthority: "abos-engine",
      modelMayPlan: true,
      modelMayAuthorEvidence: false,
      specialistMayAcceptUserInput: false,
    },
  });
}
