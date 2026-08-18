import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checker = fileURLToPath(new URL("../scripts/check-regressions.mjs", import.meta.url));
const capturer = fileURLToPath(new URL("../scripts/capture-quality.mjs", import.meta.url));
const toolchain = {
  node: "v22.0.0",
  npm: "10.0.0",
  eslint: "v9.19.0",
  typescript: "Version 5.8.2",
  lockfile_sha256: "abc123",
};

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
    environment: { toolchain: { ...toolchain } },
    gates: {
      build: gate(),
      lint: gate("fail", { "src/A.jsx|unused-imports/no-unused-imports|Unused import": 2 }),
      typecheck: gate("fail", { "src/B.jsx|TS2339|Property is missing": 1 }),
      ...overrides,
    },
  };
}

function runChecker(baselineRaw, candidateRaw, args = true) {
  const directory = mkdtempSync(join(tmpdir(), "abos-task003-check-"));
  const baselinePath = join(directory, "baseline.json");
  const candidatePath = join(directory, "candidate.json");
  writeFileSync(baselinePath, typeof baselineRaw === "string" ? baselineRaw : JSON.stringify(baselineRaw));
  writeFileSync(candidatePath, typeof candidateRaw === "string" ? candidateRaw : JSON.stringify(candidateRaw));
  const argv = args ? [checker, "--baseline", baselinePath, "--candidate", candidatePath] : [checker];
  const run = spawnSync(process.execPath, argv, { encoding: "utf8" });
  return { status: run.status, output: JSON.parse(run.stdout) };
}

function fakeTool(path, version, exitCode, output) {
  writeFileSync(path, `#!/usr/bin/env node
if (process.argv.includes("--version")) {
  console.log(${JSON.stringify(version)});
  process.exit(0);
}
console.log(${JSON.stringify(output)});
process.exit(${exitCode});
`);
  chmodSync(path, 0o755);
}

function runCaptureWithEslint(exitCode, output = "[]") {
  const root = mkdtempSync(join(tmpdir(), "abos-task003-capture-"));
  const bin = join(root, "node_modules", ".bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { build: "node -e \"\"" } }));
  writeFileSync(join(root, "package-lock.json"), "{}");
  writeFileSync(join(root, "jsconfig.json"), "{}");
  fakeTool(join(bin, "eslint"), "v9.19.0", exitCode, output);
  fakeTool(join(bin, "tsc"), "Version 5.8.2", 0, "");
  const out = join(root, "capture.json");
  const run = spawnSync(process.execPath, [
    capturer, "--root", root, "--out", out, "--ref", "fixture",
  ], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  return JSON.parse(readFileSync(out, "utf8"));
}

test("allows unchanged existing diagnostics", () => {
  const result = runChecker(capture("main"), capture("candidate"));
  assert.equal(result.status, 0);
  assert.equal(result.output.decision, "no_regression");
});

test("fails when a diagnostic multiplicity increases", () => {
  const candidate = capture("candidate", {
    lint: gate("fail", { "src/A.jsx|unused-imports/no-unused-imports|Unused import": 3 }),
  });
  const result = runChecker(capture("main"), candidate);
  assert.equal(result.status, 1);
  assert.equal(result.output.regressions[0].diagnostics[0].count, 1);
});

test("fails when a passing build becomes failing", () => {
  const result = runChecker(capture("main"), capture("candidate", { build: gate("fail") }));
  assert.equal(result.status, 1);
  assert.equal(result.output.regressions[0].gate, "build");
});

test("returns indeterminate for unavailable evidence", () => {
  const unavailable = {
    status: "unavailable",
    exit_code: 2,
    capture_error: "tool missing",
    diagnostic_count: 0,
    fingerprints: {},
  };
  const result = runChecker(capture("main"), capture("candidate", { typecheck: unavailable }));
  assert.equal(result.status, 2);
  assert.equal(result.output.decision, "indeterminate");
  assert.equal(result.output.regressions.length, 0);
});

test("captures ESLint configuration exit code as unavailable", { skip: process.platform === "win32" }, () => {
  const result = runCaptureWithEslint(2);
  assert.equal(result.gates.lint.status, "unavailable");
  assert.equal(result.gates.lint.exit_code, 2);
  assert.equal(result.gates.lint.diagnostic_count, 0);
});

test("captures ESLint exit one without diagnostics as unavailable", { skip: process.platform === "win32" }, () => {
  const result = runCaptureWithEslint(1);
  assert.equal(result.gates.lint.status, "unavailable");
  assert.match(result.gates.lint.capture_error, /without any parsed error diagnostics/);
});

test("invalid JSON emits structured indeterminate", () => {
  const result = runChecker("{", capture("candidate"));
  assert.equal(result.status, 2);
  assert.equal(result.output.decision, "indeterminate");
  assert.equal(result.output.indeterminate[0].reason, "input_or_validation_error");
});

test("missing arguments emit structured indeterminate", () => {
  const result = runChecker(capture("main"), capture("candidate"), false);
  assert.equal(result.status, 2);
  assert.match(result.output.indeterminate[0].details, /required/);
});

test("unsupported schema version is indeterminate", () => {
  const baseline = capture("main");
  baseline.schema_version = "2.0.0";
  const result = runChecker(baseline, capture("candidate"));
  assert.equal(result.status, 2);
  assert.match(result.output.indeterminate[0].details, /schema_version/);
});

test("missing gate is indeterminate", () => {
  const candidate = capture("candidate");
  delete candidate.gates.typecheck;
  const result = runChecker(capture("main"), candidate);
  assert.equal(result.status, 2);
  assert.match(result.output.indeterminate[0].details, /typecheck is required/);
});

test("negative or fractional fingerprint counts are indeterminate", () => {
  for (const malformed of [-1, 1.5]) {
    const candidate = capture("candidate");
    candidate.gates.lint.fingerprints = { bad: malformed };
    candidate.gates.lint.diagnostic_count = malformed;
    const result = runChecker(capture("main"), candidate);
    assert.equal(result.status, 2);
    assert.match(result.output.indeterminate[0].details, /invalid multiplicity/);
  }
});

test("inconsistent diagnostic total is indeterminate", () => {
  const candidate = capture("candidate");
  candidate.gates.lint.diagnostic_count = 99;
  const result = runChecker(capture("main"), candidate);
  assert.equal(result.status, 2);
  assert.match(result.output.indeterminate[0].details, /multiplicity sum/);
});

test("toolchain mismatch is indeterminate", () => {
  const candidate = capture("candidate");
  candidate.environment.toolchain.eslint = "v10.0.0";
  const result = runChecker(capture("main"), candidate);
  assert.equal(result.status, 2);
  assert.equal(result.output.indeterminate[0].reason, "unapproved_toolchain_transition");
  assert.equal(result.output.indeterminate[0].differences[0].field, "eslint");
});
