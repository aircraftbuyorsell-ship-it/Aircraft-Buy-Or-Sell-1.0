#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Usage: check-regressions.mjs --baseline <json> --candidate <json>");
    }
    values[key.slice(2)] = value;
  }
  if (!values.baseline || !values.candidate) {
    throw new Error("Usage: check-regressions.mjs --baseline <json> --candidate <json>");
  }
  return values;
}

function load(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function unavailable(gate) {
  return !gate || gate.status === "unavailable" || Boolean(gate.capture_error);
}

function newDiagnostics(baseline, candidate) {
  const added = [];
  const baselineSet = baseline.fingerprints ?? {};
  const candidateSet = candidate.fingerprints ?? {};
  for (const [fingerprint, count] of Object.entries(candidateSet)) {
    const delta = Number(count) - Number(baselineSet[fingerprint] ?? 0);
    if (delta > 0) added.push({ fingerprint, count: delta });
  }
  return added;
}

const args = parseArgs(process.argv.slice(2));
const baseline = load(args.baseline);
const candidate = load(args.candidate);
const result = {
  schema_version: "1.0.0",
  baseline_ref: baseline.ref ?? null,
  candidate_ref: candidate.ref ?? null,
  decision: "no_regression",
  regressions: [],
  indeterminate: [],
};

for (const gateName of ["build", "lint", "typecheck"]) {
  const before = baseline.gates?.[gateName];
  const after = candidate.gates?.[gateName];

  if (unavailable(before) || unavailable(after)) {
    result.indeterminate.push({
      gate: gateName,
      reason: unavailable(before) ? "baseline_capture_unavailable" : "candidate_capture_unavailable",
    });
    continue;
  }

  if (gateName === "build") {
    if (before.status === "pass" && after.status !== "pass") {
      result.regressions.push({ gate: gateName, reason: "previously_passing_gate_failed" });
    }
    continue;
  }

  const added = newDiagnostics(before, after);
  if (added.length > 0) {
    result.regressions.push({ gate: gateName, reason: "new_diagnostics", diagnostics: added });
  }
}

let exitCode = 0;
if (result.regressions.length > 0) {
  result.decision = "regression";
  exitCode = 1;
} else if (result.indeterminate.length > 0) {
  result.decision = "indeterminate";
  exitCode = 2;
}

console.log(JSON.stringify(result, null, 2));
process.exitCode = exitCode;
