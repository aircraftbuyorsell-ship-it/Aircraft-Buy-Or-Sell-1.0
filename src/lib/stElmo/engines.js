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

export function buildStElmoEngines(options = {}) {
  const reg = (ctx) => ctx.evidence?.registration || ctx.registration;

  return {
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
  };
}
