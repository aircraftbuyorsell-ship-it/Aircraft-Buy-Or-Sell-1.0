# Capability: Aircraft Search

First vertical slice through the full ABOS capability pipeline (`factory/00_FACTORY_MANIFEST.md`'s
"Capability Delivery Sequence": Capability Definition → APL Semantics → ADL Data Contract →
OpenAPI Contract → Runtime Implementation → SDK → MCP Adapter → Tests → Reference UI →
Documentation → Release Gate). Chosen first because `factory/02_CAPABILITY_REGISTRY.md` names it
the recommended proof-of-concept capability.

## Status by pipeline stage

| Stage | Status | Where |
|---|---|---|
| Capability Definition | ✅ | This file |
| ADL Data Contract | ✅ | `adl.json` |
| APL Semantics | 🟡 Partial | Search intent is deterministic keyword matching today (see `intentInterpreter` in `base44/functions/abosCoreApiV1/entry.ts`), not a full APL-negotiated agent request yet |
| OpenAPI Contract | ✅ | `openapi/abos-core-api-v1.yaml` — `POST /api/v1/search`, `GET /api/v1/aircraft/{id}`, `GET /api/v1/listings/{id}` |
| Runtime Implementation | ✅ | `base44/functions/abosCoreApiV1/` — real, tested, backed by live `AircraftListing` data (not fixtures) via `adapters/base44Repositories.mjs` |
| Tests | ✅ | `test/abosCoreApiV1.test.mjs`, `test/base44Repositories.test.mjs`, `test/base44Authenticator.test.mjs`, `test/abosCoreApiClient.test.mjs` — 32 tests, all passing (`node --test test/*.test.mjs`) |
| SDK | 🟡 Minimal | `sdk/js/abosCoreApiClient.mjs` — server-side only, see limitation below |
| MCP Adapter | 🟡 Documented only | `mcp/search_aircraft.json` — no MCP server actually serves it yet |
| Reference UI | ⬜ Not started | `Listings.jsx` still queries `AircraftListing` directly client-side; wiring it to this API requires the gateway (below) |
| Release Gate | ⬜ Not started | Not deployed, not public |

## What's real vs. what's still a gap

**Real and working today:**
- The OpenAPI contract validates cleanly (`node scripts/validate-abos-core-openapi.mjs`).
- The runtime queries live `AircraftListing` records (`status: active, visibility: public`),
  maps them through an anti-corruption adapter into the canonical public DTO shape (opaque
  `lst_`/`ac_` IDs, no internal Base44 IDs, structured provenance), and enforces scoped
  API-key auth against the existing `ApiKey` entity.
- All 32 tests pass on this branch, not just in isolation.

**Known gap — the API gateway isn't deployed.** `base44/functions/abosCoreApiV1/entry.ts`
only accepts requests carrying `X-ABOS-Gateway-Secret` (see
`architecture/AD-026-api-deployment-boundary.md`), i.e. it expects to sit behind a Cloudflare
Worker gateway. That gateway (`core-api/src/worker.mjs` on branch
`integration/core-api-v1-current-main`) exists as code but is marked NO-GO — not deployed. Until
it is, this endpoint is only reachable by a trusted caller that has the gateway secret directly
(another Base44 function, a test, an operator with server-side access) — not from the browser,
and not yet as a real public developer-facing API. `sdk/js/abosCoreApiClient.mjs` and
`mcp/search_aircraft.json` are written against the real contract and will work unchanged once the
gateway exists; nothing here is faked to look more finished than it is.

**Existing legacy overlap:** `base44/functions/abosCoreApi/entry.ts` (no `V1` suffix) is an
existing, already-live search/listings endpoint used by `CoreAPI.jsx` / `Developers.jsx` today.
`abosCoreApiV1` is additive — a coexistence adapter per `factory/07_MIGRATION_STRATEGY.md`, not a
replacement. Cutting the Developer Portal UI over to v1 is future work, not done here.

## Next steps (not done in this pass)

1. Deploy the Cloudflare Worker gateway (or an interim alternative) so v1 is reachable from
   outside a trusted server context.
2. Wire a reference UI page against the SDK client once the gateway exists.
3. Replace the deterministic keyword `intentInterpreter` with real APL-negotiated search intent.
4. Point `CoreAPI.jsx` / `Developers.jsx` docs at v1 alongside the legacy endpoint.
