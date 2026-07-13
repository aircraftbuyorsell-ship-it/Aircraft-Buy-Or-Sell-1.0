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
];

const missing = required.filter((marker) => !spec.includes(marker));
if (missing.length) {
  console.error(`OpenAPI contract is missing required markers: ${missing.join(", ")}`);
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
