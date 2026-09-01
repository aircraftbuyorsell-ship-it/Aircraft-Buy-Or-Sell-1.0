import { base44 } from "@/api/base44Client";

/** Shared verification orchestration for Verify UI and ABOS Assistant. */
export async function runVerificationAssistant(registration, options = {}) {
  const reg = String(registration || "").trim().toUpperCase();
  if (!reg) throw new Error("Aircraft registration is required");

  const tasks = [
    ["digital_twin", () => base44.functions.invoke("initDigitalTwin", { registration: reg })],
    ["aircraft_data", () => base44.functions.invoke("aircraftDataHub", { registration: reg })],
    ["registry", () => base44.functions.invoke("registryLookup", { registration: reg })],
    ["traffic", () => base44.functions.invoke("fetchLiveTraffic", { registration: reg })],
    ["service_intelligence", () => base44.functions.invoke("aviationServiceIntel", { registration: reg })],
  ];

  const settled = await Promise.all(tasks.map(async ([name, fn]) => {
    try { return { name, status: "ok", data: (await fn())?.data ?? null }; }
    catch (error) { return { name, status: "error", error: error?.message || String(error) }; }
  }));

  return {
    registration: reg,
    verifiedAt: new Date().toISOString(),
    sources: ["base44", "supabase", "live-traffic", "service-intelligence", "dealers"],
    checks: settled,
    options,
  };
}

export const VERIFICATION_CAPABILITIES = [
  "registry", "identity", "serial", "ownership", "activity", "live_traffic",
  "service_intelligence", "dealers", "documents", "ati",
];
