#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";

const SCHEMA_VERSION = "1.0.0";
const GATES = ["build", "lint", "typecheck"];
const STATUSES = new Set(["pass", "fail", "unavailable"]);
const TOOLCHAIN_KEYS = ["node", "npm", "eslint", "typescript", "lockfile_sha256"];

function emptyResult() {
  return {
    schema_version: SCHEMA_VERSION,
    baseline_ref: null,
    candidate_ref: null,
    decision: "indeterminate",
    regressions: [],
    indeterminate: [],
  };
}

function emit(result, exitCode) {
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = exitCode;
}

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
    throw new Error("Both --baseline and --candidate are required.");
  }
  return values;
}

function load(path, label) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`${label} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateCapture(capture, label) {
  const errors = [];
  if (!isPlainObject(capture)) return [`${label} must be an object.`];
  if (capture.schema_version !== SCHEMA_VERSION) {
    errors.push(`${label}.schema_version must equal ${SCHEMA_VERSION}.`);
  }
  if (typeof capture.ref !== "string" || capture.ref.length === 0) {
    errors.push(`${label}.ref must be a non-empty string.`);
  }

  const toolchain = capture.environment?.toolchain;
  if (!isPlainObject(toolchain)) {
    errors.push(`${label}.environment.toolchain must be an object.`);
  } else {
    for (const key of TOOLCHAIN_KEYS) {
      if (typeof toolchain[key] !== "string" || toolchain[key].length === 0) {
        errors.push(`${label}.environment.toolchain.${key} must be a non-empty string.`);
      }
    }
  }

  if (!isPlainObject(capture.gates)) {
    errors.push(`${label}.gates must be an object.`);
    return errors;
  }

  for (const gateName of GATES) {
    const gate = capture.gates[gateName];
    if (!isPlainObject(gate)) {
      errors.push(`${label}.gates.${gateName} is required.`);
      continue;
    }
    if (!STATUSES.has(gate.status)) {
      errors.push(`${label}.gates.${gateName}.status is unsupported.`);
    }
    if (!(gate.exit_code === null || (Number.isInteger(gate.exit_code) && gate.exit_code >= 0))) {
      errors.push(`${label}.gates.${gateName}.exit_code must be null or a nonnegative integer.`);
    }
    if (!(gate.capture_error === null || typeof gate.capture_error === "string")) {
      errors.push(`${label}.gates.${gateName}.capture_error must be null or a string.`);
    }
    if (gate.status === "unavailable" && !(typeof gate.capture_error === "string" && gate.capture_error.length > 0)) {
      errors.push(`${label}.gates.${gateName} unavailable status requires capture_error.`);
    }
    if (gate.status !== "unavailable" && gate.capture_error !== null) {
      errors.push(`${label}.gates.${gateName} pass/fail status requires capture_error null.`);
    }
    if (!isPlainObject(gate.fingerprints)) {
      errors.push(`${label}.gates.${gateName}.fingerprints must be an object.`);
      continue;
    }

    let total = 0;
    for (const [fingerprint, count] of Object.entries(gate.fingerprints)) {
      if (fingerprint.length === 0 || !Number.isInteger(count) || count < 0) {
        errors.push(`${label}.gates.${gateName}.fingerprints contains an invalid multiplicity.`);
      } else {
        total += count;
      }
    }
    if (!Number.isInteger(gate.diagnostic_count) || gate.diagnostic_count < 0) {
      errors.push(`${label}.gates.${gateName}.diagnostic_count must be a nonnegative integer.`);
    } else if (gate.diagnostic_count !== total) {
      errors.push(`${label}.gates.${gateName}.diagnostic_count must equal the fingerprint multiplicity sum.`);
    }
  }
  return errors;
}

function toolchainDifferences(baseline, candidate) {
  const before = baseline.environment.toolchain;
  const after = candidate.environment.toolchain;
  return TOOLCHAIN_KEYS.filter((key) => before[key] !== after[key]).map((key) => ({
    field: key,
    baseline: before[key],
    candidate: after[key],
  }));
}

function newDiagnostics(baseline, candidate) {
  const added = [];
  for (const [fingerprint, count] of Object.entries(candidate.fingerprints)) {
    const delta = count - (baseline.fingerprints[fingerprint] ?? 0);
    if (delta > 0) added.push({ fingerprint, count: delta });
  }
  return added;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const baseline = load(args.baseline, "baseline");
  const candidate = load(args.candidate, "candidate");
  const validationErrors = [
    ...validateCapture(baseline, "baseline"),
    ...validateCapture(candidate, "candidate"),
  ];
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(" "));
  }

  const result = emptyResult();
  result.baseline_ref = baseline.ref;
  result.candidate_ref = candidate.ref;

  const differences = toolchainDifferences(baseline, candidate);
  if (differences.length > 0) {
    result.indeterminate.push({
      gate: null,
      reason: "unapproved_toolchain_transition",
      differences,
    });
    emit(result, 2);
  } else {
    result.decision = "no_regression";
    for (const gateName of GATES) {
      const before = baseline.gates[gateName];
      const after = candidate.gates[gateName];

      if (before.status === "unavailable" || after.status === "unavailable") {
        result.indeterminate.push({
          gate: gateName,
          reason: before.status === "unavailable"
            ? "baseline_capture_unavailable"
            : "candidate_capture_unavailable",
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

    if (result.regressions.length > 0) {
      result.decision = "regression";
      emit(result, 1);
    } else if (result.indeterminate.length > 0) {
      result.decision = "indeterminate";
      emit(result, 2);
    } else {
      emit(result, 0);
    }
  }
} catch (error) {
  const result = emptyResult();
  result.indeterminate.push({
    gate: null,
    reason: "input_or_validation_error",
    details: error instanceof Error ? error.message : String(error),
  });
  emit(result, 2);
}
