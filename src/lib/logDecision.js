import { base44 } from "@/api/base44Client";

/**
 * logDecision — fire-and-forget audit trail for every automated decision.
 *
 * Example:
 *   logDecision({
 *     type: "ati_score",
 *     subject: { type: "listing", id: listingId, label: "N1234A · Cessna 172" },
 *     inputs:  { ...listingSnapshot },
 *     outputs: { ati_total: 94, score_label: "STRONG BUY", deal_radar_eligible: true },
 *     version: "ati_v2",
 *     source:  "pages/ATIPassport:handleGenerate",
 *     actor:   "user@example.com",
 *     reasoning: "AI summary string",
 *   });
 *
 * Never throws — logging must not break the user flow.
 */
export async function logDecision({
  type,
  subject = {},
  inputs = {},
  outputs = {},
  version = "",
  source = "",
  actor = "system",
  reasoning = "",
}) {
  try {
    await base44.entities.DecisionLog.create({
      decision_type: type,
      subject_type: subject.type || "other",
      subject_id: subject.id || undefined,
      subject_label: subject.label || undefined,
      inputs,
      outputs,
      rule_version: version,
      rule_source: source,
      actor,
      reasoning,
    });
  } catch (err) {
    // Never block the caller on logging failures
    console.warn("[DecisionLog] failed to record:", err?.message || err);
  }
}