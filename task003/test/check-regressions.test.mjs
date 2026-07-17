import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checker = fileURLToPath(new URL("../scripts/check-regressions.mjs", import.meta.url));

function gate(status = "pass", fingerprints = {}) {
  return {
    status,
    exit_code: status === "pass" ? 0 : 1,
    capture_error: null,
    diagnostic_count: Object.values(fingerprints).reduce((sum, count) => sum + count, 0),
    fingerprints,
  };
}

function capture(ref, overrides = {}) {
  return {
    schema_version: "1.0.0",
    ref,
    gates: {
      build: gate(),
      lint: gate("fail", { "src/A.jsx|unused-imports/no-unused-imports|Unused import": 2 }),
      typecheck: gate("fail", { "src/B.jsx|TS2339|Property is missing": 1 }),
      ...overrides,
    },
  };
}

function compare(before, after) {
  const directory = mkdtempSync(join(tmpdir(), "abos-task003-"));
  const baselinePath = join(directory, "baseline.json");
  const candidatePath = join(directory, "candidate.json");
  writeFileSync(baselinePath, JSON.stringify(before));
  writeFileSync(candidatePath, JSON.stringify(after));
  const run = spawnSync(process.execPath, [
    checker,
    "--baseline", baselinePath,
    "--candidate", candidatePath,
  ], { encoding: "utf8" });
  return { status: run.status, output: JSON.parse(run.stdout) };
}

test("allows unchanged existing diagnostics", () => {
  const result = compare(capture("main"), capture("candidate"));
  assert.equal(result.status, 0);
  assert.equal(result.output.decision, "no_regression");
});

test("fails when a diagnostic multiplicity increases", () => {
  const candidate = capture("candidate", {
    lint: gate("fail", { "src/A.jsx|unused-imports/no-unused-imports|Unused import": 3 }),
  });
  const result = compare(capture("main"), candidate);
  assert.equal(result.status, 1);
  assert.equal(result.output.regressions[0].gate, "lint");
  assert.equal(result.output.regressions[0].diagnostics[0].count, 1);
});

test("fails when a passing build becomes failing", () => {
  const result = compare(capture("main"), capture("candidate", { build: gate("fail") }));
  assert.equal(result.status, 1);
  assert.equal(result.output.regressions[0].gate, "build");
});

test("returns indeterminate rather than a regression for unavailable evidence", () => {
  const unavailable = {
    status: "unavailable",
    exit_code: null,
    capture_error: "tool missing",
    diagnostic_count: null,
    fingerprints: {},
  };
  const result = compare(capture("main"), capture("candidate", { typecheck: unavailable }));
  assert.equal(result.status, 2);
  assert.equal(result.output.decision, "indeterminate");
  assert.equal(result.output.regressions.length, 0);
});
