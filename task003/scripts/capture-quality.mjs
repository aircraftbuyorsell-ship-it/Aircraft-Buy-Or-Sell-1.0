#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Usage: capture-quality.mjs --root <checkout> --out <json> --ref <label>");
    }
    values[key.slice(2)] = value;
  }
  if (!values.root || !values.out || !values.ref) {
    throw new Error("Usage: capture-quality.mjs --root <checkout> --out <json> --ref <label>");
  }
  return values;
}

function executable(root, name) {
  return resolve(root, "node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    exit_code: typeof result.status === "number" ? result.status : null,
    signal: result.signal ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    spawn_error: result.error?.message ?? null,
  };
}

function normalizeMessage(message) {
  return String(message).trim().replace(/\s+/g, " ");
}

function multiset(fingerprints) {
  const counts = {};
  for (const fingerprint of fingerprints) counts[fingerprint] = (counts[fingerprint] ?? 0) + 1;
  return counts;
}

function unavailable(result, reason) {
  return {
    status: "unavailable",
    exit_code: result?.exit_code ?? null,
    signal: result?.signal ?? null,
    capture_error: reason,
    diagnostic_count: 0,
    fingerprints: {},
  };
}

function toolVersion(command, args, root) {
  const result = run(command, args, root);
  if (result.spawn_error || result.exit_code !== 0) return null;
  return normalizeMessage(result.stdout || result.stderr) || null;
}

function lockfileSha256(root) {
  try {
    return createHash("sha256").update(readFileSync(resolve(root, "package-lock.json"))).digest("hex");
  } catch {
    return null;
  }
}

function captureBuild(root) {
  const result = run("npm", ["run", "build"], root);
  if (result.spawn_error || result.exit_code === null) {
    return unavailable(result, result.spawn_error ?? "Build process did not return an exit code.");
  }
  return {
    status: result.exit_code === 0 ? "pass" : "fail",
    exit_code: result.exit_code,
    signal: result.signal,
    capture_error: null,
    diagnostic_count: 0,
    fingerprints: {},
  };
}

function captureLint(root) {
  const result = run(executable(root, "eslint"), [".", "--quiet", "--format", "json"], root);
  if (result.spawn_error) return unavailable(result, result.spawn_error);
  if (result.exit_code !== 0 && result.exit_code !== 1) {
    return unavailable(result, `ESLint returned unsupported exit code ${result.exit_code}; configuration or runtime failure is likely.`);
  }

  let reports;
  try {
    reports = JSON.parse(result.stdout || "[]");
  } catch {
    return unavailable(result, "ESLint output was not valid JSON.");
  }
  if (!Array.isArray(reports)) return unavailable(result, "ESLint JSON output was not an array.");

  const fingerprints = [];
  for (const report of reports) {
    const file = relative(root, report.filePath).replaceAll("\\", "/");
    for (const message of report.messages ?? []) {
      if ((message.severity ?? 0) < 2) continue;
      const rule = message.ruleId ?? "eslint/unknown";
      fingerprints.push(`${file}|${rule}|${normalizeMessage(message.message)}`);
    }
  }

  if (result.exit_code !== 0 && fingerprints.length === 0) {
    return unavailable(result, "ESLint failed without any parsed error diagnostics.");
  }
  if (result.exit_code === 0 && fingerprints.length > 0) {
    return unavailable(result, "ESLint returned success while reporting error diagnostics.");
  }

  return {
    status: result.exit_code === 0 ? "pass" : "fail",
    exit_code: result.exit_code,
    signal: result.signal,
    capture_error: null,
    diagnostic_count: fingerprints.length,
    fingerprints: multiset(fingerprints),
  };
}

function captureTypecheck(root) {
  const result = run(executable(root, "tsc"), ["-p", "./jsconfig.json", "--pretty", "false"], root);
  if (result.spawn_error) return unavailable(result, result.spawn_error);
  if (result.exit_code === null) return unavailable(result, "Typecheck process did not return an exit code.");

  const fingerprints = [];
  const pattern = /^(?:(.+?)\((\d+),(\d+)\): )?error (TS\d+): (.+)$/;
  for (const line of `${result.stdout}\n${result.stderr}`.split(/\r?\n/)) {
    const match = line.match(pattern);
    if (!match) continue;
    const file = match[1] ? relative(root, resolve(root, match[1])).replaceAll("\\", "/") : "<project>";
    fingerprints.push(`${file}|${match[4]}|${normalizeMessage(match[5])}`);
  }

  if (result.exit_code !== 0 && fingerprints.length === 0) {
    return unavailable(result, "Typecheck failed without any parsed TypeScript diagnostics.");
  }
  if (result.exit_code === 0 && fingerprints.length > 0) {
    return unavailable(result, "Typecheck returned success while reporting error diagnostics.");
  }

  return {
    status: result.exit_code === 0 ? "pass" : "fail",
    exit_code: result.exit_code,
    signal: result.signal,
    capture_error: null,
    diagnostic_count: fingerprints.length,
    fingerprints: multiset(fingerprints),
  };
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root);
const out = resolve(args.out);
const capture = {
  schema_version: "1.0.0",
  ref: args.ref,
  captured_at: new Date().toISOString(),
  environment: {
    platform: process.platform,
    arch: process.arch,
    toolchain: {
      node: process.version,
      npm: toolVersion("npm", ["--version"], root),
      eslint: toolVersion(executable(root, "eslint"), ["--version"], root),
      typescript: toolVersion(executable(root, "tsc"), ["--version"], root),
      lockfile_sha256: lockfileSha256(root),
    },
  },
  gates: {
    build: captureBuild(root),
    lint: captureLint(root),
    typecheck: captureTypecheck(root),
  },
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(capture, null, 2)}\n`, "utf8");
console.log(out);
