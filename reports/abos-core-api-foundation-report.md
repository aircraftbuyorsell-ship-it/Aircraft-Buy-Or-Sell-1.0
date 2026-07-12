# ABOS Core API foundation report

## Scope

This branch creates the smallest safe public API boundary without replacing the Base44 marketplace. It adds no production deployment, Cloudflare route, DNS change, Supabase migration, data backfill, Stripe configuration change, or merge.

## Repository findings

- The marketplace is a Vite/React application using Base44 entities and functions directly.
- The existing `abosCoreApi` and `abosOpenApiSpec` are legacy Base44 surfaces. They remain unchanged for compatibility and are not the canonical public API.
- The supplied Base44 ZIP and GitHub repository share the same application dependency manifest.
- The supplied legacy OpenAPI documents are OpenAPI 3.0.3 and expose Base44 entity/function routes; they are not carried forward as the public contract.

## Implemented files

- `base44/functions/abosCoreApiV1/core.mjs`: route boundary, validation, standardized errors, scope checks, request IDs, audit/rate-limit hooks.
- `base44/functions/abosCoreApiV1/entry.ts`: Base44 anti-corruption adapter, header-only API-key authentication, HMAC public IDs, public listing mapping, explicit insufficient-data valuation provider.
- `gateway/cloudflare/src/index.js` and `gateway/cloudflare/wrangler.toml.example`: non-deployed Worker gateway scaffold.
- `openapi/abos-core-api-v1.yaml`: OpenAPI 3.1 contract for search, aircraft, listing, and valuation only.
- `architecture/*`: AD-026, AD-027, request flow, migration strategy, and data ownership registry.
- `test/abosCoreApiV1.test.mjs`, `scripts/validate-abos-core-openapi.mjs`, and `.github/workflows/abos-core-api-v1.yml`: route/contract/CI coverage.

## Architecture applied

`Client -> Cloudflare Worker gateway (scaffold) -> abosCoreApiV1 -> public router -> Base44 adapter (current) -> public DTO`

The direct function requires an internal gateway secret. The gateway has no account, zone, route, or domain configuration, so it cannot deploy accidentally.

## Current authoritative stores

See `architecture/data-ownership-registry.yaml`. Listings remain Base44-authoritative. Supabase contains RLS-protected listing and FAA-related tables but current production write-path/cutover evidence is incomplete. Stripe is authoritative for payment state.

## Security findings

1. **Critical:** Stripe entitlement metadata is client-controlled in checkout and trusted by the webhook, enabling token/tier tampering.
2. **High:** `syncFaaToAtiCard` can create or overwrite public listings for any authenticated user.
3. **High:** Legacy `abosCoreApi` can disclose private listings to logged-in users and returns Base44 IDs.
4. **High:** Stripe webhook idempotency and balance updates can double grant under concurrent delivery.
5. **Medium:** checkout return URL is unvalidated; several legacy functions expose raw internal errors; legacy rate limits are non-atomic and omit session callers.

These issues are intentionally not changed in this migration branch because they affect existing production payment and marketplace behavior and need a separately tested remediation approval.

## Supabase findings

- Project `bsvrcnyslqrotpllwfzm` is active and healthy.
- Public tables observed include `aircraftbuyorsell_listings`, `faa_registry`, `organizations`, `transactions`, and other operational tables; RLS is enabled on listed public tables.
- Two migrations are registered: `create_business_finder_cache` and `create_ares_leads_table`.
- Existing edge functions include `ares-proxy`, `presence-scorer` (both JWT disabled), and `aircraftbuyorsell-sync` (JWT enabled).
- Security advisor output must be triaged separately; no database change is made here.
- Several policies grant `public` access with permissive predicates, including audit/lead/cache tables. Treat these as a production security-review backlog, not as permission to expose them via the Core API.

## Stripe integration findings

Stripe webhook signature verification is implemented with raw request text and environment-loaded secrets. Price IDs are identifiers, not secrets. The critical entitlement and duplicate-grant issues above block reliance on the existing Stripe projection for Core API authorization or billing state.

## Required environment variables

- `ABOS_PUBLIC_ID_SALT`
- `ABOS_GATEWAY_SHARED_SECRET`
- `ABOS_CORS_ALLOWED_ORIGINS`
- Cloudflare Worker secrets after deployment approval: `ABOS_UPSTREAM_URL`, `ABOS_UPSTREAM_SHARED_SECRET`

## Tests and validation

- Added Node route tests for all four public routes.
- Added an OpenAPI contract guard and a GitHub Actions workflow that runs `npm ci`, route tests, contract guard, and `npm run build`.
- CI results are pending the draft pull request.

## Migration blockers and next slice

1. Urgently remediate Stripe entitlement integrity and idempotency.
2. Verify Base44-to-Supabase listing parity, freshness, and production write ownership.
3. Approve and deploy the gateway only after an exact hostname, scoped Cloudflare token, secret storage, CORS policy, rate-limit policy, and rollback runbook are reviewed.
4. Add a Supabase migration only after a backfill and rollback plan are approved.

## Rollback

Because no deployed system is changed, rollback is a Git revert of this branch. If the gateway is later deployed, remove its route first, revoke the shared secret, and return traffic to the existing marketplace; do not alter Base44 or Supabase data as part of rollback.
