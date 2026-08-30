import { base44 } from "@/api/base44Client";
import { authorizeCapability } from "@/lib/entitlements";

/** Shared Marketspace orchestration. UI and ABOS Assistant can call the same workflow. */
export async function runMarketspaceAssistant(request, options = {}) {
  const text = String(request || "").trim();
  if (!text) throw new Error("Market request is required");

  const lower = text.toLowerCase();
  const intent = lower.includes("sell") || lower.includes("listing") && lower.includes("my")
    ? "sell"
    : lower.includes("buyer") || lower.includes("buyers")
    ? "buyers"
    : lower.includes("compare")
    ? "compare"
    : lower.includes("deal") || lower.includes("undervalued") || lower.includes("below market") || lower.includes("omvm")
    ? "evaluate"
    : lower.includes("watch") || lower.includes("alert") || lower.includes("notify")
    ? "signals"
    : lower.includes("verify") || lower.includes("verification")
    ? "verify"
    : lower.includes("cross-border") || lower.includes("cross border") || lower.includes("import")
    ? "cross-border"
    : "discover";

  const result = { request: text, intent, createdAt: new Date().toISOString(), aircraft: [], evidence: [], nextActions: [], options };

  const registration = extractRegistration(text);
  if (registration) {
    try {
      const twin = await base44.functions.invoke("publicTwinLookup", { query: registration });
      result.digitalTwin = twin?.data || null;
      result.requestedRegistration = registration;
    } catch (_) {}
  }

  if (["discover", "evaluate", "compare"].includes(intent)) {
    const listings = await base44.entities.AircraftListing.filter({ status: "active" }, "-updated_date", 100);
    result.aircraft = listings.slice(0, 25);
    if (registration) result.aircraft = result.aircraft.filter(a => String(a.registration || "").toUpperCase() === registration);
    result.evidence.push({ source: "base44", type: "active_listings", count: listings.length });
  }

  if (intent === "evaluate") {
    if (registration) {
      result.entitlement = await authorizeCapability("market.deal_analysis", registration).catch(() => ({ allowed: false, reason: "entitlement_check_unavailable" }));
    }
    if (result.entitlement?.allowed === false) {
      result.premiumLocked = true;
      result.nextActions = ["Review free market signals", "Verify aircraft", "Unlock Deal Analysis — $99"];
    } else {
      result.aircraft = [...result.aircraft].sort((a, b) => (b.deal_score ?? -1) - (a.deal_score ?? -1)).slice(0, 10);
    }
    if (!result.premiumLocked) result.nextActions = ["Open Deal Radar", "Verify top candidate", "Review OMVM and ATI"];
  } else if (intent === "discover") {
    result.nextActions = ["Shortlist aircraft", "Compare candidates", "Verify selected aircraft"];
  } else if (intent === "compare") {
    result.nextActions = ["Select aircraft", "Run side-by-side comparison", "Evaluate strongest candidate"];
  } else if (intent === "sell") {
    result.nextActions = ["Identify aircraft", "Run verification", "Calculate OMVM", "Prepare market listing", "Find qualified buyers"];
  } else if (intent === "buyers") {
    result.nextActions = ["Identify aircraft", "Open Leads", "Match qualified buyers", "Create Deal Room"];
  } else if (intent === "signals") {
    result.nextActions = ["Create market signal", "Monitor new listings", "Monitor price changes", "Monitor ATI / valuation changes"];
  } else if (intent === "cross-border") {
    result.nextActions = ["Identify aircraft", "Verify aircraft", "Review cross-border requirements", "Evaluate landed transaction"];
  } else if (intent === "verify") {
    result.nextActions = ["Open Verification Assistant", "Review Digital Twin", "Review evidence", "Calculate ATI"];
  }

  // Transaction layer: Sales Pipeline is the execution state for a market opportunity.
  // It reuses the same registration / aircraft context instead of creating a second aircraft record.
  if (["sell", "buyers", "evaluate", "discover", "compare", "verify"].includes(intent)) {
    if (registration) {
      const pipelines = await base44.entities.SalesPipeline.filter({ registration }, "-updated_date", 1).catch(() => []);
      result.transaction = {
        registration,
        existingPipelineId: pipelines[0]?.id || null,
        status: pipelines[0]?.status || "not_started",
        progressPct: pipelines[0]?.progress_pct ?? 0,
      };
      result.nextActions = [...result.nextActions, pipelines[0] ? "Open Transaction Pipeline" : "Create Transaction Pipeline", "Verify aircraft", "Review Digital Twin", "Review ATI / OMVM"];
    }
  }

  return result;
}

export function extractRegistration(text) {
  const match = String(text || "").toUpperCase().match(/\b(?:N\d{1,5}[A-Z]{0,3}|[A-Z]{1,2}-[A-Z0-9]{2,6})\b/);
  return match?.[0] || null;
}

export function marketspaceSummary(result) {
  if (!result) return "";
  if (result.transaction?.existingPipelineId) return `The aircraft is connected to an active transaction pipeline at ${result.transaction.progressPct}% progress. Continue verification, valuation and deal execution from the same aircraft state.`;
  if (result.intent === "verify") return `Verification workflow is ready for ${result.requestedRegistration || 'the aircraft'}. Continue in Verification Assistant using the same Digital Twin and evidence state.`;
  const count = result.aircraft?.length || 0;
  if (result.intent === "evaluate" && result.premiumLocked) return `I found ${count} active aircraft, but Deal Analysis / OMVM / Deal Score is locked for this aircraft. Unlock Deal Analysis to run the premium evaluation.`;
  if (result.intent === "evaluate") return `I found ${count} active aircraft and ranked the strongest market opportunities by Deal Score. The next step is to verify and review OMVM/ATI for the top candidates.`;
  if (result.intent === "discover") return `I found ${count} active aircraft matching the current market search space. Select candidates to shortlist, compare or verify.`;
  if (result.intent === "compare") return `I prepared ${count} active aircraft as the comparison pool. Select the aircraft you want to compare.`;
  if (result.intent === "sell") return "I started the selling workflow. The aircraft should move through verification, valuation, market positioning and buyer matching using the same shared aircraft state.";
  if (result.intent === "buyers") return "I started the buyer workflow. The next step is to match qualified buyers against the aircraft and move strong matches into the Deal Room.";
  return `Marketspace workflow started: ${result.intent}.`;
}
