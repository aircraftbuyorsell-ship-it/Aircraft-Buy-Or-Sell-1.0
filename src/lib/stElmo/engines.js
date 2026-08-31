import { base44 } from "@/api/base44Client";
import { runVerificationAssistant } from "@/lib/verificationAssistant";
import { runMarketspaceAssistant } from "@/lib/marketspaceAssistant";
import { APL_ACTIONS } from "@/lib/abosAgentProtocol";

/**
 * Binds St. Elmo capabilities to the ABOS engines that own the corresponding facts.
 *
 * Kept apart from the worker so the execution logic stays free of Base44 imports
 * and can be tested with stub engines. A capability with no binding here is
 * reported as unavailable by the worker rather than answered by the model.
 */

const invoke = async (fn, payload) => (await base44.functions.invoke(fn, payload))?.data ?? null;

const ABOS_KNOWLEDGE = Object.freeze({
  ati: {
    title: "ATI — Aircraft Transparency Index",
    definition: "ATI (Aircraft Transparency Index) is ABOS's framework for assessing how complete, consistent, and verifiable the available evidence is for a specific aircraft. It is evidence-driven and is not a substitute for the underlying registry, ownership, service, activity, or transaction records.",
    source: "ABOS product definition",
  },
  omvm: {
    title: "OMVM — Off-Market Valuation Model",
    definition: "OMVM is ABOS's valuation framework for estimating an aircraft's market value from available evidence and market signals. A valuation is an estimate, not an authoritative transaction price.",
    source: "ABOS product definition",
  },
});

function lookupKnowledge(request) {
  const text = String(request || "").toLowerCase();
  if (/\\bati\\b|aircraft transparency index|transparency score/.test(text)) return ABOS_KNOWLEDGE.ati;
  if (/\\bomvm\\b|off[- ]market valuation/.test(text)) return ABOS_KNOWLEDGE.omvm;
  return { title: "ABOS knowledge", definition: "I do not have a verified ABOS knowledge entry for that term yet.", source: "ABOS knowledge base" };
}

export function buildStElmoEngines(options = {}) {
  const reg = (ctx) => ctx.evidence?.registration || ctx.registration;

  return {
    [APL_ACTIONS.KNOWLEDGE_LOOKUP]: (ctx) => lookupKnowledge(ctx.request),
    [APL_ACTIONS.IDENTIFY_AIRCRAFT]: (ctx) => invoke("aircraftDataHub", { registration: reg(ctx) }),
    [APL_ACTIONS.VERIFY_AIRCRAFT]: (ctx) => runVerificationAssistant(reg(ctx), { ...options, entry: "st_elmo_worker" }),
    [APL_ACTIONS.VERIFY_REGISTRY]: (ctx) => invoke("registryLookup", { registration: reg(ctx) }),
    [APL_ACTIONS.VERIFY_OWNERSHIP]: (ctx) => invoke("registryLookup", { registration: reg(ctx) }),
    [APL_ACTIONS.VERIFY_ACTIVITY]: (ctx) => invoke("fetchLiveTraffic", { registration: reg(ctx) }),
    [APL_ACTIONS.VERIFY_SERVICE]: (ctx) => invoke("aviationServiceIntel", { registration: reg(ctx) }),
    [APL_ACTIONS.CALCULATE_ATI]: (ctx) => invoke("orchestrateATIScoring", { registration: reg(ctx) }),
    [APL_ACTIONS.CALCULATE_OMVM]: (ctx) => invoke("invokeOmvmValuation", { registration: reg(ctx) }),
    [APL_ACTIONS.ANALYSE_DEAL]: (ctx) => runMarketspaceAssistant(ctx.request || reg(ctx), { ...options, entry: "st_elmo_worker" }),
    [APL_ACTIONS.COMPARE_AIRCRAFT]: (ctx) => runMarketspaceAssistant(ctx.request || "compare aircraft", { ...options, entry: "st_elmo_worker" }),
    [APL_ACTIONS.FIND_BUYERS]: (ctx) => invoke("cmrMatchEngine", { registration: reg(ctx) }),
    [APL_ACTIONS.CREATE_TRANSACTION]: (ctx) => invoke("pipelineIntegrations", { action: "create", registration: reg(ctx), aircraft: ctx.evidence?.aircraft, verification: ctx.evidence?.verification }),
    [APL_ACTIONS.ADVANCE_PIPELINE]: (ctx) => invoke("onPipelineStatusChange", { action: "advance", registration: reg(ctx), transaction: ctx.evidence?.transaction }),
    [APL_ACTIONS.OPEN_DEAL_ROOM]: (ctx) => invoke("pipelineIntegrations", { action: "open_deal_room", registration: reg(ctx), transaction: ctx.evidence?.transaction }),
    [APL_ACTIONS.REQUEST_PREBUY]: (ctx) => invoke("managePreBuyInspection", { registration: reg(ctx), aircraft: ctx.evidence?.aircraft }),
    [APL_ACTIONS.PREPARE_CLOSING]: (ctx) => invoke("pipelineIntegrations", { action: "prepare_closing", registration: reg(ctx), transaction: ctx.evidence?.transaction }),
  };
}
