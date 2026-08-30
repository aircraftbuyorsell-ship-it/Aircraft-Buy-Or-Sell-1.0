import { runVerificationAssistant } from "@/lib/verificationAssistant";
import { runMarketspaceAssistant } from "@/lib/marketspaceAssistant";
import { buildAgentWorkflow } from "@/lib/abosAgentProtocol";
import { base44 } from "@/api/base44Client";
import { ST_ELMO_MODEL } from "@/lib/model/provider/nemotron/config";

/**
 * ABOS Agent orchestration layer.
 * One conversational entry point; capabilities remain modular internally.
 */
export async function runABOSAgent(request, options = {}) {
  const text = String(request || "").trim();
  if (!text) throw new Error("ABOS Agent request is required");

  const registration = extractRegistration(text);
  const requestedIntent = String(options.intent || "").toLowerCase();
  const wantsVerify = requestedIntent === "verify" || /\b(verify|verification|registry|ownership|serial|maintenance|service|pre-buy)\b/i.test(text);
  const wantsMarket = requestedIntent === "analyse" || /\b(find|search|show|compare|deal|undervalued|below market|sell|buyer|buyers|market|listing|valuation|omvm)\b/i.test(text);
  const wantsInspect = requestedIntent === "inspect" || /\b(inspect|inspection|camera|video|visual|vision)\b/i.test(text);
  const wantsTransaction = /\b(deal|buy|purchase|sell|seller|buyer|offer|pipeline|transaction|deal room|closing)\b/i.test(text);

  let reasoning = null;
  if (options.useReasoning !== false) {
    try {
      const response = await base44.functions.invoke("stElmoReasoning", {
        request: text,
        context: { registration, intent: requestedIntent || null },
      });
      reasoning = response?.data || null;
    } catch (_) {
      // Deterministic ABOS routing remains the safe fallback when the reasoning backend is unavailable.
    }
  }

  const result = {
    request: text,
    model: ST_ELMO_MODEL,
    reasoning,
    registration,
    workflow: { current: registration ? "aircraft_context" : "discovery", completed: [], blocked: [], next: [], reasoningPlan: reasoning?.plan || [] },
    aircraft: null,
    verification: null,
    marketspace: null,
    transaction: null,
    timestamp: new Date().toISOString(),
    options,
    inspection: wantsInspect ? { status: "requested", capability: "APL.VISION_INSPECTION", engine: "vision_adapter" } : null,
  };

  if (registration && wantsVerify) {
    result.verification = await runVerificationAssistant(registration, { ...options, entry: "abos_agent" });
    result.workflow.completed.push("verification");
  }

  if (wantsMarket || (!wantsVerify && registration)) {
    result.marketspace = await runMarketspaceAssistant(text, { ...options, entry: "abos_agent" });
    result.workflow.completed.push("marketspace");
    result.aircraft = result.marketspace.digitalTwin || result.marketspace.aircraft?.[0] || null;
  }

  if (registration && wantsTransaction) {
    result.transaction = {
      aircraft_id: result.aircraft?.aircraft_id || result.aircraft?.id || result.verification?.aircraft_id || null,
      registration,
      pipeline: result.marketspace?.transaction || null,
      status: result.marketspace?.transaction?.status || "not_started",
      next: result.marketspace?.transaction?.existingPipelineId ? "open_pipeline" : "create_pipeline",
    };
    result.workflow.completed.push("transaction_context");
  }

  result.workflow.current = result.transaction ? "transaction" : result.verification ? "analysis" : result.marketspace ? "marketspace" : "discovery";
  result.workflow = { ...result.workflow, ...buildAgentWorkflow({ aircraft: result.aircraft, verification: result.verification, marketspace: result.marketspace, transaction: result.transaction }) };
  result.workflow.nextActions = result.marketspace?.nextActions || [];
  return result;
}

export function extractRegistration(text) {
  return String(text || "").toUpperCase().match(/\b(?:N\d{1,5}[A-Z]{0,3}|[A-Z]{1,2}-[A-Z0-9]{2,6})\b/)?.[0] || null;
}
