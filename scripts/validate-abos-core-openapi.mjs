import { readFile } from "node:fs/promises";

const spec = await readFile(new URL("../openapi/abos-core-api-v1.yaml", import.meta.url), "utf8");
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
console.log("ABOS Core API OpenAPI contract guard passed.");