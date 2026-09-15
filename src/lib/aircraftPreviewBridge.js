import { base44 } from "@/api/base44Client";
import { lookupAircraft, normalizeReg } from "@/lib/aircraftLookup";

const BRIDGE_FLAG = "__abosAircraftPreviewBridge";

function buildFallbackReport(registration, aircraft, score) {
  return {
    identity: { registration, manufacturer: aircraft?.make || aircraft?.manufacturer || null, model: aircraft?.model || null, year: aircraft?.year || null, serial_number: aircraft?.serial_number || aircraft?.serialNumber || null, mode_s_hex: aircraft?.mode_s_hex || aircraft?.icao24 || null },
    registry: { source: aircraft?.source || "ABOS federated lookup", status_code: aircraft?.status_code || aircraft?.status || null, certificate_issue_date: null, airworthiness_date: null, registration_expiry: null, location: aircraft?.location || null, owner: null },
    engine: null,
    ati: score ? { total: score.total ?? null, label: score.score_label || null, dimensions: score.dimensions || {}, strengths: score.strengths || null, risks: score.risks || null, recommendations: score.recommendations || null, data_gaps: [] } : null,
    valuation: score ? { omvm_value: null, live_market_avg: null, live_min_price: score.omvm_low ?? null, live_max_price: score.omvm_high ?? null, live_listings_count: null, market_data_source: "ATI Full Report", deal_score: null, deal_label: null, discount_pct: null } : null,
    verification: { status: "unverified", source_count: null, data_conflict: false, data_conflict_fields: [] },
    activity: { status: "UNKNOWN", evidence_type: "no_activity_observation_in_this_report", note: "UNKNOWN activity is not a negative finding about the aircraft." },
    market: { public_listings: [] },
    provenance: { generated_at: new Date().toISOString(), sources: ["ABOS federated lookup", "ATI Full Report"] },
    summary: score?.summary || null,
  };
}

export function installAircraftPreviewBridge() {
  const functions = base44?.functions;
  if (!functions?.invoke || functions[BRIDGE_FLAG]) return;
  const originalInvoke = functions.invoke.bind(functions);

  functions.invoke = async (name, payload) => {
    if (name === "aircraftPreview") {
      const registration = normalizeReg(payload?.registration || payload?.query);
      if (!registration) return { data: { found: false, registration: "", evidence: {} } };
      try {
        const result = await lookupAircraft(registration);
        if (result?.found && result?.aircraft) return { data: { found: true, registration, aircraft: result.aircraft, evidence: { registry: true, digital_twin: result.source === "public_faa", marketplace: Boolean(result.listing), activity_metadata: false, adsbdb: false }, searchedAt: new Date().toISOString() } };
        return { data: { found: false, registration, evidence: { registry: false, digital_twin: false, marketplace: false, activity_metadata: false, adsbdb: false }, source_statuses: result?.source_statuses || [] } };
      } catch (_) { return { data: { found: false, registration, evidence: {} } }; }
    }

    if (name === "aircraftIntelligenceReport") {
      try {
        return await originalInvoke(name, payload);
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status !== 404) throw err;
        const registration = normalizeReg(payload?.registration);
        try {
          const lookup = await lookupAircraft(registration);
          if (lookup?.found && lookup?.aircraft) {
            const scoreResponse = await originalInvoke("atiFullReportScore", { aircraft_data: JSON.stringify(lookup.aircraft), registration });
            const score = scoreResponse?.data || scoreResponse;
            if (score && score.error !== "payment_required") {
              return { data: { authorized: true, registration, found: true, source: "atiFullReportScore_fallback", report: buildFallbackReport(registration, lookup.aircraft, score) } };
            }
          }
        } catch (_) {
          // Keep the free identity preview usable if the legacy paid report
          // endpoint is unavailable or the fallback is not entitled.
        }
        // Do not leak a transport-level 404 into the Advisor UI.
        return { data: { authorized: false, registration, found: true, report: null, unavailable: true } };
      }
    }

    return originalInvoke(name, payload);
  };
  functions[BRIDGE_FLAG] = true;
}
