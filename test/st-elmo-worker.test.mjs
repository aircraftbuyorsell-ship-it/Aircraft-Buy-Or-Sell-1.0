import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runStElmoWorker, summarize } from "../src/lib/stElmo/worker.js";
import {
  CAPABILITIES,
  EVIDENCE,
  isKnownCapability,
  missingPreconditions,
  orderPlanByDependency,
  sanitizeCapabilityPlan,
} from "../src/lib/stElmo/capabilities.js";

const ok = (value) => async () => value;

test("only registry capabilities survive planning", () => {
  const plan = sanitizeCapabilityPlan([
    "VERIFY_AIRCRAFT",
    "DELETE_ALL_LISTINGS",
    "verify_aircraft",
    "CALCULATE_ATI",
    "",
    null,
  ]);
  assert.deepEqual(plan, ["VERIFY_AIRCRAFT", "CALCULATE_ATI"]);
  assert.equal(isKnownCapability("DELETE_ALL_LISTINGS"), false);
});

test("plan length is capped so a runaway model cannot queue unbounded work", () => {
  const plan = sanitizeCapabilityPlan(Object.keys(CAPABILITIES), { maxSteps: 3 });
  assert.equal(plan.length, 3);
});

test("evidence-producing steps are ordered ahead of the steps that consume them", () => {
  const ordered = orderPlanByDependency(["ANALYSE_DEAL", "CALCULATE_ATI", "VERIFY_AIRCRAFT", "IDENTIFY_AIRCRAFT"]);
  assert.deepEqual(ordered, ["IDENTIFY_AIRCRAFT", "VERIFY_AIRCRAFT", "CALCULATE_ATI", "ANALYSE_DEAL"]);
});

test("ATI cannot be scored before the aircraft is verified", () => {
  const missing = missingPreconditions("CALCULATE_ATI", { [EVIDENCE.REGISTRATION]: "N123AB" });
  assert.deepEqual(missing, [EVIDENCE.VERIFICATION]);
});

test("the worker runs the plan through the ABOS engines and files the evidence", async () => {
  const called = [];
  const run = await runStElmoWorker({
    plan: ["VERIFY_AIRCRAFT", "CALCULATE_ATI"],
    context: { registration: "N123AB" },
    engines: {
      VERIFY_AIRCRAFT: async (ctx) => { called.push(["VERIFY_AIRCRAFT", ctx.registration]); return { checks: [] }; },
      CALCULATE_ATI: async (ctx) => { called.push(["CALCULATE_ATI", ctx.evidence.verification !== undefined]); return { score: 84 }; },
    },
  });

  assert.deepEqual(called, [["VERIFY_AIRCRAFT", "N123AB"], ["CALCULATE_ATI", true]]);
  assert.equal(run.evidence.ati.score, 84);
  assert.equal(run.summary.executed, 2);
  assert.equal(run.phase, "completed");
});

test("a step with unmet preconditions is blocked, never answered by the model", async () => {
  const run = await runStElmoWorker({
    plan: ["CALCULATE_ATI"],
    context: { registration: "N123AB" }, // no verification evidence
    engines: { CALCULATE_ATI: ok({ score: 99 }) },
  });

  const step = run.steps[0];
  assert.equal(step.status, "blocked");
  assert.deepEqual(step.missing, [EVIDENCE.VERIFICATION]);
  assert.equal(run.evidence.ati, undefined, "a blocked capability must not produce evidence");
});

test("a capability with no engine binding is reported unavailable rather than improvised", async () => {
  const run = await runStElmoWorker({
    plan: ["CALCULATE_OMVM"],
    context: { registration: "N123AB" },
    engines: {},
  });

  assert.equal(run.steps[0].status, "unavailable");
  assert.equal(run.steps[0].reason, "no_engine_binding");
  assert.equal(run.evidence.omvm, undefined);
});

test("one failing engine does not fail the run, and dependent steps block instead of guessing", async () => {
  const run = await runStElmoWorker({
    plan: ["VERIFY_AIRCRAFT", "CALCULATE_ATI", "CALCULATE_OMVM"],
    context: { registration: "N123AB" },
    engines: {
      VERIFY_AIRCRAFT: async () => { throw new Error("registry timeout"); },
      CALCULATE_ATI: ok({ score: 70 }),
      CALCULATE_OMVM: ok({ value: 1_200_000 }),
    },
  });

  const byCapability = Object.fromEntries(run.steps.map((s) => [s.capability, s]));
  assert.equal(byCapability.VERIFY_AIRCRAFT.status, "failed");
  assert.equal(byCapability.CALCULATE_ATI.status, "blocked", "ATI must not score on a failed verification");
  assert.equal(byCapability.CALCULATE_OMVM.status, "ok", "an independent capability still runs");
  assert.equal(run.summary.failed, 1);
});

test("an empty or fully rejected plan completes cleanly and reports what it dropped", async () => {
  const run = await runStElmoWorker({ plan: ["DROP_TABLE_AIRCRAFT"], engines: {} });
  assert.deepEqual(run.plan, []);
  assert.deepEqual(run.rejected, ["DROP_TABLE_AIRCRAFT"]);
  assert.equal(run.phase, "completed");
  assert.equal(run.steps.length, 0);
});

test("phases move through the task engine's declared states", async () => {
  const phases = [];
  await runStElmoWorker({
    plan: ["VERIFY_AIRCRAFT"],
    context: { registration: "N123AB" },
    engines: { VERIFY_AIRCRAFT: ok({ checks: [] }) },
    onPhase: (phase) => phases.push(phase),
  });
  assert.deepEqual(phases, ["tools", "synthesis", "completed"]);
});

test("a throwing phase hook cannot take the run down", async () => {
  const run = await runStElmoWorker({
    plan: ["VERIFY_AIRCRAFT"],
    context: { registration: "N123AB" },
    engines: { VERIFY_AIRCRAFT: ok({ checks: [] }) },
    onPhase: () => { throw new Error("subscriber exploded"); },
  });
  assert.equal(run.phase, "completed");
});

test("the summary is derived from the step ledger, not from the model", () => {
  const summary = summarize({
    steps: [
      { capability: "VERIFY_AIRCRAFT", status: "ok" },
      { capability: "CALCULATE_ATI", status: "blocked", missing: ["verification"] },
      { capability: "CALCULATE_OMVM", status: "failed", error: "boom" },
    ],
    evidence: { registration: "N123AB", verification: {} },
  });
  assert.equal(summary.executed, 1);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.failed, 1);
  assert.deepEqual(summary.evidenceKeys, ["registration", "verification"]);
  assert.deepEqual(summary.failures, [{ capability: "CALCULATE_OMVM", error: "boom" }]);
});

// Regression guards for two regex literals that were double-escaped, which made
// them match a literal backslash instead of a word boundary / whitespace.
test("Marketspace can actually extract a registration", async () => {
  const source = await readFile(new URL("../src/lib/marketspaceAssistant.js", import.meta.url), "utf8");
  const line = source.split("\n").find((l) => l.includes("toUpperCase().match("));
  assert.ok(line, "extractRegistration matcher not found");
  assert.ok(!line.includes("\\\\b"), "the registration regex is double-escaped and matches nothing");
});

test("St. Elmo can parse a fenced JSON reasoning plan", async () => {
  const source = await readFile(new URL("../base44/functions/stElmoReasoning/entry.ts", import.meta.url), "utf8");
  const line = source.split("\n").find((l) => l.includes("const fenced"));
  assert.ok(line, "fenced-JSON matcher not found");
  assert.ok(!line.includes("\\\\s"), "the fenced-JSON regex is double-escaped and never matches");
});
