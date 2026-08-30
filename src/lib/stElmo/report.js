import { CAPABILITIES } from "./capabilities.js";

/**
 * Turns a St. Elmo worker run into the text the chat shows.
 *
 * Derived entirely from the step ledger and the evidence the engines returned,
 * so the answer cannot claim work that did not happen. The reasoning summary is
 * shown as St. Elmo's own words, never as a finding.
 */

const LABELS = Object.freeze({
  registration: "Registration",
  aircraft: "Aircraft identity",
  verification: "Verification",
  ati: "ATI",
  omvm: "OMVM",
  marketspace: "Marketspace",
  buyers: "Buyer matches",
  transaction: "Transaction",
});

const MISSING_LABEL = Object.freeze({
  registration: "an aircraft registration",
  verification: "a completed verification",
  ati: "an ATI score",
  omvm: "an OMVM valuation",
  transaction: "an open transaction",
  aircraft: "an identified aircraft",
});

/** Human phrasing for a blocked step, so the reason is legible rather than a key dump. */
function blockedReason(missing = []) {
  const parts = missing.map((key) => MISSING_LABEL[key] || key);
  if (!parts.length) return "a missing precondition";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Some engines fan out internally and swallow their own failures:
 * runVerificationAssistant runs five sub-checks and reports each as
 * { name, status: "error" } rather than throwing. The step then reads "ran"
 * while part of its evidence is missing. Surface those, or the ledger overstates
 * what came back — exactly what it exists to prevent.
 */
export function degradedChecks(evidence = {}) {
  const degraded = [];
  for (const [key, value] of Object.entries(evidence)) {
    const checks = Array.isArray(value?.checks) ? value.checks : null;
    if (!checks) continue;
    const failed = checks.filter((check) => check?.status === "error");
    if (failed.length) degraded.push({ evidence: key, failed, total: checks.length });
  }
  return degraded;
}

function stepLine(step) {
  const engine = step.engine ? ` · \`${step.engine}\`` : "";
  switch (step.status) {
    case "ok":
      return `- **${step.capability}** — ran${engine}`;
    case "blocked":
      return `- **${step.capability}** — blocked, needs ${blockedReason(step.missing)}`;
    case "failed":
      return `- **${step.capability}** — failed${engine}: ${step.error || "unknown error"}`;
    case "unavailable":
      return `- **${step.capability}** — not wired to an ABOS engine yet`;
    default:
      return `- **${step.capability}** — ${step.status}`;
  }
}

/**
 * @param {object} input
 * @param {object} [input.reasoning] Raw stElmoReasoning response.
 * @param {object} [input.run]       Worker run, when a plan was executed.
 */
export function renderStElmoAnswer({ reasoning = null, run = null } = {}) {
  const summary = String(reasoning?.reasoning_summary || "").trim();

  // No executable plan: St. Elmo was talking, not working. Show what it said
  // rather than an empty "Plan ready:".
  if (!run || !run.plan?.length) {
    if (summary) return summary;
    if (run?.rejected?.length) {
      return `I couldn't turn that into an ABOS capability I'm allowed to run (dropped: ${run.rejected.join(", ")}). Tell me the aircraft or what you want checked and I'll plan it properly.`;
    }
    return "I don't have an ABOS capability to run for that yet. Give me a registration or tell me what you want verified, valued or matched.";
  }

  const lines = [];
  if (summary) lines.push(summary, "");

  const ran = run.steps.filter((step) => step.status === "ok");
  const blocked = run.steps.filter((step) => step.status === "blocked");
  const failed = run.steps.filter((step) => step.status === "failed");
  const unavailable = run.steps.filter((step) => step.status === "unavailable");

  lines.push(`**Ran ${ran.length} of ${run.steps.length} planned steps.**`, "");
  lines.push(...run.steps.map(stepLine));

  const gathered = Object.keys(run.evidence).filter((key) => key !== "registration");
  if (gathered.length) {
    lines.push("", `**Evidence returned:** ${gathered.map((key) => LABELS[key] || key).join(", ")}.`);
  }

  // A step can report "ran" while an engine that fans out internally lost some of
  // its own sources. Say so rather than letting partial evidence read as complete.
  for (const { evidence, failed, total } of degradedChecks(run.evidence)) {
    lines.push(
      "",
      `**${LABELS[evidence] || evidence} is partial** — ${failed.length} of ${total} sources failed:`,
      ...failed.map((check) => `- ${check.name}: ${check.error || "unknown error"}`),
    );
  }

  if (blocked.length) {
    lines.push(
      "",
      `I stopped short on ${blocked.length === 1 ? "one step" : `${blocked.length} steps`} rather than filling the gap myself — the ABOS engines own those facts.`,
    );
  }
  if (failed.length) {
    lines.push("", `${failed.length === 1 ? "One engine" : `${failed.length} engines`} errored; anything depending on that is blocked rather than estimated.`);
  }
  if (unavailable.length) {
    lines.push("", `Not yet wired to an engine: ${unavailable.map((step) => step.capability).join(", ")}.`);
  }

  return lines.join("\n");
}

/** Short status line for the chat header while a run is in flight. */
export function describePhase(phase, capability) {
  if (phase === "tools" && capability) return `running ${capability}`;
  return { queued: "queued", reasoning: "reasoning", tools: "running ABOS engines", synthesis: "synthesising", completed: "done", failed: "failed" }[phase] || phase;
}

/** Capabilities the worker could execute if their preconditions were met. */
export function executableCapabilities() {
  return Object.keys(CAPABILITIES);
}
