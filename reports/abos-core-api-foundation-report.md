# ABOS Core API v1 foundation report

Date: 2026-07-12
Branch: `feat/abos-core-api-v1-boundary`

## Scope

This is an additive migration slice. It does not replace the Base44 marketplace, deploy Cloudflare, change DNS, apply a Supabase migration, backfill data, change Stripe configuration, merge a PR, or delete production data.

## Repository findings

The GitHub repository `aircraftbuyorsell-ship-it/abos-0.8-intrazone` has `main` and an existing patch branch. Its package manifest matches the supplied Base44 ZIP. The current app directly reads and writes `AircraftListing` through Base44 and contains a legacy body-discriminator `abosCoreApi`. The supplied legacy OpenAPI JSON is 3.0.3 and exposes Base44 entity/function routes; it is not the canonical contract for this branch.

## Exact files changed

- `base44/functions/abosCoreApiV1/core.mjs`
- `base44/functions/abosCoreApiV1/entry.ts`
- `openapi/abos-core-api-v1.yaml`
- `gateway/cloudflare/src/index.js`
- `gateway/cloudflare/wrangler.toml.example`
- `test/abosCoreApiV1.test.mjs`
- `scripts/validate-abos-core-openapi.mjs`
- `.github/workflows/abos-core-api-v1.yml`
- `architecture/AD-026-api-deployment-boundary.md`
- `architecture/AD-027-authoritative-data-store.md`
- `architecture/data-ownership-registry.yaml`
- `architecture/migration-strategy.md`
- `architecture/request-flow.md`
- `reports/abos-core-api-foundation-report.md`

## Architecture implemented

`Client -> Cloudflare Worker gateway (scaffold) -> abosCoreApiV1 -> public router -> Base44 adapter (current) -> public DTO`

The new boundary implements only:

- `POST /api/v1/search`
- `GET /api/v1/aircraft/{aircraft_id}`
- `GET /api/v1/listings/{listing_id}`
- `POST /api/v1/intelligence/valuate`

The router validates request bodies, enforces scope placeholders, emits request IDs, adds audit and rate-limit hooks, returns sanitized errors, and uses explicit `insufficient_data` valuation output. HMAC-derived opaque public identifiers avoid exposing Base44 IDs. The existing `abosCoreApi` remains untouched for compatibility and is not the public contract.

## Current authoritative stores

Listings remain Base44-authoritative because the marketplace code writes `AircraftListing` there. Supabase contains RLS-protected listing and FAA-related tables but current production write-path/cutover evidence is incomplete. FAA registry facts remain externally authoritative with a Supabase projection. Stripe remains authoritative for payment state; local records are projections. These decisions are recorded in `architecture/data-ownership-registry.yaml`.

## Supabase findings

Project `bsvrcnyslqrotpllwfzm` is active and healthy (Postgres 17). Public tables observed include `aircraftbuyorsell_listings`, `faa_registry`, `organizations`, `transactions`, and other operational tables; RLS is enabled on listed public tables. Two migrations are registered: `create_business_finder_cache` and `create_ares_leads_table`. Active Edge Functions include `ares-proxy` and `presence-scorer` (JWT disabled) and `aircraftbuyorsell-sync` (JWT enabled). Advisor output includes multiple-permissive-policy warnings and broad public-role policies; these require separate remediation and were not changed here. No Supabase DDL or data write was performed.

## Stripe findings

Webhook signature verification uses the raw request body and environment-held secrets, which is correct. A critical payment-integrity issue remains: checkout accepts client-controlled token/tier/price metadata and the webhook uses it for entitlement grants. Additional risks are unvalidated return URLs, check-then-create idempotency races, and raw error propagation. No Stripe products, prices, subscriptions, or webhook configuration were changed.

## Security findings and scan limitation

Manual Codex Security review identified:

1. Critical: Stripe entitlement metadata tampering.
2. High: `syncFaaToAtiCard` can create or overwrite public listings for any authenticated user.
3. High: legacy `abosCoreApi` can disclose private listings to logged-in users and returns Base44 IDs.
4. High: concurrent webhook deliveries can double-grant entitlements.
5. Medium: unvalidated checkout return URL, raw legacy errors, and non-atomic legacy rate limits.

An exhaustive repository-wide Codex Security artifact scan could not be completed because the local checkout/shell runner remained unavailable. This report does not claim exhaustive file coverage; the listed findings are a manual, evidence-backed subset and must be re-run with a functioning scan runner before production release.

## Tests and CI

The branch adds Node tests for all four routes, public DTO isolation, sanitized errors, scope enforcement, and insufficient-data valuation. It adds an OpenAPI 3.1 contract guard and GitHub Actions workflow running `npm ci`, route tests, contract validation, and the existing application build. The observed GitHub Actions run for the latest PR commit ended in `startup_failure` with no jobs, so passing test/build results are not claimed; this is an unresolved CI blocker.

## Cloudflare requirements

Before deployment, confirm the exact production hostname and obtain a scoped Cloudflare API token. Configure `ABOS_UPSTREAM_URL`, `ABOS_UPSTREAM_SHARED_SECRET`, `ABOS_GATEWAY_SHARED_SECRET`, `ABOS_PUBLIC_ID_SALT`, and the CORS allowlist through secret management. The supplied Account ID and Zone ID are identifiers only. No Worker, route, or DNS deployment was attempted.

## Rollback

No deployed system changed. Revert the feature branch commits. If the gateway is later deployed, disable its route first, revoke the shared secret, and return traffic to the existing marketplace; do not alter Base44 or Supabase data during rollback.

## Unresolved blockers

- Complete the exhaustive Codex Security scan with a functioning local checkout.
- Diagnose the GitHub Actions startup failure and obtain passing route/build checks.
- Fix or explicitly disposition the Stripe entitlement and idempotency findings.
- Verify Supabase listing ownership and policy posture before cutover.
- Obtain the confirmed production hostname and scoped Cloudflare credentials.
