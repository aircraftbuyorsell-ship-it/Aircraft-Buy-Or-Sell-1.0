import { runVerificationAssistant } from "@/lib/verificationAssistant";
import { runMarketspaceAssistant } from "@/lib/marketspaceAssistant";

/**
 * ABOS Agent orchestration layer.
 * One conversational entry point; capabilities remain modular internally.
 */
export async function runABOSAgent(request, options = {}) {
  const text = String(request || "").trim();
  if (!text) throw new Error("ABOS Agent request is required");

  const registration = extractRegistration(text);
  const wantsVerify = /\b(verify|verification|registry|ownership|serial|maintenance|service|pre-buy)\b/i.test(text);
  const wantsMarket = /\b(find|search|show|compare|deal|undervalued|below market|sell|buyer|buyers|market|listing|valuation|omvm)\b/i.test(text);
  const wantsTransaction = /\b(deal|buy|purchase|sell|seller|buyer|offer|pipeline|transaction|deal room|closing)\b/i.test(text);

  const result = {
    request: text,
    registration,
    workflow: { current: registration ? "aircraft_context" : "discovery", completed: [], blocked: [], next: [] },
    aircraft: null,
    verification: null,
    marketspace: null,
    transaction: null,
    timestamp: new Date().toISOString(),
    options,
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
  result.workflow.next = result.marketspace?.nextActions || [];
  return result;
}

export function extractRegistration(text) {
  return String(text || "").toUpperCase().match(/\b(?:N\d{1,5}[A-Z]{0,3}|[A-Z]{1,2}-[A-Z0-9]{2,6})\b/)?.[0] || null;
}
