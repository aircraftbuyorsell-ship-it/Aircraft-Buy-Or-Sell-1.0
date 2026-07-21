import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const contractUrl = new URL("../openapi/abos-core-api-v1.yaml", import.meta.url);
const spec = await readFile(contractUrl, "utf8");

const required = [
  "openapi: 3.1.0",
  "/api/v1/search:",
  "/api/v1/aircraft/{aircraft_id}:",
  "/api/v1/listings/{listing_id}:",
  "/api/v1/intelligence/valuate:",
  "AircraftListing:",
  "APIError:",
  "SourceProvenance:",
  "X-Request-ID",
  "Idempotency-Key",
  "x-abos-required-scopes:",
  "- search:read",
  "- listings:read",
  "- intelligence:request",
];

const missing = required.filter((marker) => !spec.includes(marker));
if (missing.length) {
  console.error(`OpenAPI contract is missing required markers: ${missing.join(", ")}`);
  process.exit(1);
}

const securityRequirements = [...spec.matchAll(/^\s*-\s+(BearerAuth|ApiKeyAuth):\s*\[([^\]]*)\]/gm)];
const invalidSecurityRequirements = securityRequirements.filter((match) => match[2].trim().length > 0);
if (invalidSecurityRequirements.length) {
  console.error("HTTP bearer and apiKey security requirements must use empty arrays. ABOS authorization scopes belong in x-abos-required-scopes.");
  process.exit(1);
}

const scopeExtensionCount = (spec.match(/^\s*x-abos-required-scopes:\s*$/gm) || []).length;
if (scopeExtensionCount !== 4) {
  console.error(`Expected x-abos-required-scopes on exactly four operations, found ${scopeExtensionCount}.`);
  process.exit(1);
}

const undeployedRateLimitMarkers = ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
  .filter((marker) => spec.includes(marker));
if (undeployedRateLimitMarkers.length) {
  console.error(`The RC1 contract must not advertise rate-limit headers before a durable limiter is configured: ${undeployedRateLimitMarkers.join(", ")}`);
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  command,
  ["--yes", "@redocly/cli@1.34.5", "lint", "openapi/abos-core-api-v1.yaml", "--format=stylish"],
  {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    stdio: "pipe",
  },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error(`Unable to run the pinned OpenAPI validator: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("ABOS Core API OpenAPI validation failed.");
  process.exit(result.status ?? 1);
}

console.log("ABOS Core API OpenAPI validation passed.");
