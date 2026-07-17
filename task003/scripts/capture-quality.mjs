#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
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

function captureBuild(root) {
  const result = run("npm", ["run", "build"], root);
  return {
    status: result.exit_code === 0 ? "pass" : "fail",
    exit_code: result.exit_code,
    signal: result.signal,
    capture_error: result.spawn_error,
    diagnostic_count: null,
    fingerprints: {},
  };
}

function captureLint(root) {
  const result = run(executable(root, "eslint"), [".", "--quiet", "--format", "json"], root);
  if (result.spawn_error) {
    return { status: "unavailable", exit_code: null, capture_error: result.spawn_error, diagnostic_count: null, fingerprints: {} };
  }

  let reports;
  try {
    reports = JSON.parse(result.stdout || "[]");
  } catch {
    return {
      status: "unavailable",
      exit_code: result.exit_code,
      capture_error: "ESLint output was not valid JSON.",
      diagnostic_count: null,
      fingerprints: {},
    };
  }

  const fingerprints = [];
  for (const report of reports) {
    const file = relative(root, report.filePath).replaceAll("\\", "/");
    for (const message of report.messages ?? []) {
      if ((message.severity ?? 0) < 2) continue;
      const rule = message.ruleId ?? "eslint/unknown";
      fingerprints.push(`${file}|${rule}|${normalizeMessage(message.message)}`);
    }
  }

  return {
    status: result.exit_code === 0 ? "pass" : "fail",
    exit_code: result.exit_code,
    capture_error: null,
    diagnostic_count: fingerprints.length,
    fingerprints: multiset(fingerprints),
  };
}

function captureTypecheck(root) {
  const result = run(executable(root, "tsc"), ["-p", "./jsconfig.json", "--pretty", "false"], root);
  if (result.spawn_error) {
    return { status: "unavailable", exit_code: null, capture_error: result.spawn_error, diagnostic_count: null, fingerprints: {} };
  }

  const fingerprints = [];
  const pattern = /^(?:(.+?)\((\d+),(\d+)\): )?error (TS\d+): (.+)$/;
  for (const line of `${result.stdout}\n${result.stderr}`.split(/\r?\n/)) {
    const match = line.match(pattern);
    if (!match) continue;
    const file = match[1] ? relative(root, resolve(root, match[1])).replaceAll("\\", "/") : "<project>";
    fingerprints.push(`${file}|${match[4]}|${normalizeMessage(match[5])}`);
  }

  const captureError = result.exit_code !== 0 && fingerprints.length === 0
    ? "Typecheck failed but no TypeScript diagnostics could be parsed."
    : null;

  return {
    status: captureError ? "unavailable" : result.exit_code === 0 ? "pass" : "fail",
    exit_code: result.exit_code,
    capture_error: captureError,
    diagnostic_count: captureError ? null : fingerprints.length,
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
    node: process.version,
    platform: process.platform,
    arch: process.arch,
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
