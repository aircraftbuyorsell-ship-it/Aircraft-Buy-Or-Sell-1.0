import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderStElmoAnswer } from "../src/lib/stElmo/report.js";
import { runStElmoWorker } from "../src/lib/stElmo/worker.js";

const chat = await readFile(new URL("../src/components/stelmo/StElmoChat.jsx", import.meta.url), "utf8");

// The bug this file exists for: the chat rendered the plan as the literal string
// "Plan ready:\n- VERIFY_REGISTRY" and never ran it, because it called
// stElmoReasoning directly and bypassed runABOSAgent (and so the worker).
test("the chat no longer renders a plan as text", () => {
  assert.ok(!chat.includes("Plan ready:"), 'the "Plan ready:" fallback must not come back');
});

test("the chat executes the plan through the worker", () => {
  assert.match(chat, /runStElmoWorker\(/, "the chat must run the worker on the returned plan");
  assert.match(chat, /buildStElmoEngines\(/, "the worker must be given the real ABOS engines");
});

test("a greeting answers in words, not an empty plan", () => {
  const answer = renderStElmoAnswer({
    reasoning: { plan: [], reasoning_summary: "Hello — tell me an aircraft and what you need checked." },
    run: { plan: [], steps: [], evidence: {}, rejected: [] },
  });
  assert.equal(answer, "Hello — tell me an aircraft and what you need checked.");
  assert.ok(!answer.includes("Plan ready"));
});

test("an empty plan with no summary still says something useful", () => {
  const answer = renderStElmoAnswer({ reasoning: { plan: [] }, run: null });
  assert.match(answer, /registration|verified|valued/i);
  assert.ok(answer.trim().length > 0);
});

test("an executed plan reports what actually ran", async () => {
  const run = await runStElmoWorker({
    plan: ["IDENTIFY_AIRCRAFT", "VERIFY_REGISTRY"],
    context: { registration: "N5511R" },
    engines: {
      IDENTIFY_AIRCRAFT: async () => ({ make: "Piper" }),
      VERIFY_REGISTRY: async () => ({ status: "active" }),
    },
  });
  const answer = renderStElmoAnswer({ reasoning: { reasoning_summary: "Checking the registry." }, run });

  assert.match(answer, /Ran 2 of 2 planned steps/);
  assert.match(answer, /IDENTIFY_AIRCRAFT/);
  assert.match(answer, /VERIFY_REGISTRY/);
  assert.match(answer, /Evidence returned/);
});

test("a blocked step explains the missing precondition in words", async () => {
  const run = await runStElmoWorker({
    plan: ["CALCULATE_ATI"],
    context: { registration: "N5511R" },
    engines: { CALCULATE_ATI: async () => ({ score: 90 }) },
  });
  const answer = renderStElmoAnswer({ reasoning: {}, run });

  assert.match(answer, /blocked, needs a completed verification/);
  assert.match(answer, /stopped short/);
  assert.ok(!answer.includes("90"), "a blocked step must not surface a score");
});

test("a failed engine is reported, not smoothed over", async () => {
  const run = await runStElmoWorker({
    plan: ["VERIFY_REGISTRY"],
    context: { registration: "N5511R" },
    engines: { VERIFY_REGISTRY: async () => { throw new Error("registry timeout"); } },
  });
  const answer = renderStElmoAnswer({ reasoning: {}, run });

  assert.match(answer, /failed/);
  assert.match(answer, /registry timeout/);
});

test("the chat carries the registration across follow-up turns", () => {
  assert.match(chat, /lastRegistrationRef/, '"go" after "n5511r check nreg" must keep the aircraft');
});

// An engine that fans out internally (runVerificationAssistant runs five sub-checks)
// swallows its own failures into { status: "error" }. The step reads "ran" while
// part of its evidence never arrived — the ledger must not let that read as complete.
test("a step that ran with failed sub-checks is reported as partial", async () => {
  const run = await runStElmoWorker({
    plan: ["VERIFY_AIRCRAFT"],
    context: { registration: "N5511R" },
    engines: {
      VERIFY_AIRCRAFT: async () => ({
        checks: [
          { name: "digital_twin", status: "ok" },
          { name: "aircraft_data", status: "error", error: "Request failed with status code 502" },
          { name: "registry", status: "ok" },
        ],
      }),
    },
  });
  const answer = renderStElmoAnswer({ reasoning: {}, run });

  assert.match(answer, /Verification is partial/);
  assert.match(answer, /1 of 3 sources failed/);
  assert.match(answer, /aircraft_data: Request failed with status code 502/);
});

test("fully healthy evidence is not labelled partial", async () => {
  const run = await runStElmoWorker({
    plan: ["VERIFY_AIRCRAFT"],
    context: { registration: "N5511R" },
    engines: { VERIFY_AIRCRAFT: async () => ({ checks: [{ name: "registry", status: "ok" }] }) },
  });
  assert.ok(!renderStElmoAnswer({ reasoning: {}, run }).includes("partial"));
});
