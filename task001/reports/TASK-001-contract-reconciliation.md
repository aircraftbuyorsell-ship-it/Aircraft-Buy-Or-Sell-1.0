# TASK-001 — Canonical ABOS API Contract Reconciliation

## Decision

Adopt the explicit, vendor-neutral OpenAPI 3.1 REST contract as the canonical ABOS Core API v1 draft. Keep the current Base44 `/functions/abosCoreApi` body-discriminator gateway available only as a coexistence adapter until its supported callers migrate.

The legacy gateway is an implemented migration source. It is not the contract used to generate the ABOS JavaScript SDK, Python SDK, MCP adapter, or new UI clients.

## Evidence Compared

- `main:base44/functions/abosCoreApi/entry.ts`
- `main:base44/functions/abosOpenApiSpec/entry.ts`
- `feat/abos-core-api-v1-boundary:openapi/abos-core-api-v1.yaml`
- `feat/abos-core-api-v1-boundary:base44/functions/abosCoreApiV1/core.mjs`
- `feat/abos-core-api-v1-boundary:test/abosCoreApiV1.test.mjs`

The old feature branch is evidence only because it has materially diverged from `main`. This task does not merge that branch or claim that its runtime is deployed. The exact reviewed YAML is pinned at `task001/openapi/abos-core-api-v1.yaml` so this decision is self-contained and immutable within the task branch.

## Contract Comparison

| Concern | Implemented Base44 gateway | Canonical v1 draft | Decision |
|---|---|---|---|
| Routing | One POST endpoint with `endpoint` in JSON | Explicit HTTP methods and REST paths | Canonical REST; adapter accepts legacy discriminator |
| OpenAPI | 3.0.3 | 3.1.0 | Use 3.1.0 |
| Authentication | `x-abos-key`, body `api_key`, or Base44 session | Bearer or `X-ABOS-API-Key` | Normalize at edge; never accept body keys on canonical routes |
| Responses | `{status,data}` success envelope | Operation-specific DTO | Canonical DTOs; adapter unwraps/translates |
| Errors | `{status,error:{code,message}}` | Sanitized `APIError` with request ID and details | Canonical error schema |
| IDs | Base44 entity `id` | Stable `ac_` and `lst_` public IDs | Internal IDs cannot cross the public boundary |
| Search | LLM intent plus in-memory filtering of up to 200 records | Intent interpretation plus deterministic repository retrieval | Preserve chat-first input; require deterministic retrieval and provenance |
| Valuation | LLM estimate based on model memory | Traceable valuation or explicit `insufficient_data` | Legacy estimate cannot be promoted to a canonical complete result |
| Listing read | `listings.get`, `listings.list` | Listing-by-ID and search | Adapt compatible reads |
| Listing write | `listings.create` | Not defined in selected four-operation draft | Keep legacy-only until ownership and idempotency are specified |
| Key management | Three legacy operations | Not defined | Keep legacy-only; address in API-key lifecycle task |
| Extraction | `intelligence.extract` | Not defined | Keep legacy-only pending a separate capability contract |

## Operation Mapping

1. `search` maps to `POST /api/v1/search`. The adapter maps `params.query` to `query`; the canonical service provides pagination, public DTOs, limitations, and provenance.
2. Legacy `valuate` and canonical `POST /api/v1/intelligence/valuate` remain separate during coexistence. The legacy route preserves its current provider and response. The canonical route returns `status: insufficient_data` and a null estimate without traceable comparable data. Any later adapter or cutover requires separate approval and parity tests.
3. `listings.get` maps to `GET /api/v1/listings/{listing_id}` after resolving the internal Base44 identifier to a stable public identifier.
4. `listings.list` maps to deterministic search constraints behind `POST /api/v1/search`.
5. Key management, extraction, and listing creation remain available through the legacy gateway but are excluded from v1 SDK and MCP generation.
6. `GET /api/v1/aircraft/{aircraft_id}` has no direct legacy equivalent; it is a canonical read model, not evidence of an already deployed endpoint.

## Compatibility Adapter Design

The future compatibility adapter sits before canonical routing and performs only transport and DTO translation. TASK-001 does not implement or activate it:

1. Authenticate using the current Base44 session or legacy API-key mechanism.
2. Validate the legacy endpoint and required scope.
3. Translate only operations marked `future_adapter` after characterization and parity tests exist. `separate_during_coexistence` operations must not be redirected.
4. Invoke the same service/repository boundary used by canonical REST routes.
5. Translate canonical results back into the legacy `{status,data}` envelope.
6. Preserve `X-Request-ID`, rate-limit behavior, audit logging, and registration masking.
7. Never expose internal repository/entity objects.

No canonical service may call the legacy HTTP gateway. A future migration may move both transports onto a shared application service only after legacy characterization tests prove preserved behavior.

The exhaustive request, response, error and disposition ledger for all nine legacy operations and four canonical operations is `task001/contracts/operation-reconciliation.json`.

## Breaking Changes

- Canonical clients must change from a body discriminator to explicit REST paths.
- The API-key header becomes `X-ABOS-API-Key`; request-body keys are forbidden. A request containing both Bearer and API-key credentials is rejected rather than resolved by precedence.
- `listing:read` becomes `listings:read`; `intelligence:read` becomes `intelligence:request` for valuation requests. Old names remain legacy aliases only and are never emitted by generated canonical clients.
- Success responses are no longer wrapped in `{status,data}`.
- Listing `id` becomes `listing_id`; aircraft receives a separate `aircraft_id`.
- `price` becomes `asking_price`; `photo_url` becomes `primary_image_url`.
- Canonical intelligence includes timestamps, engine version, provenance, and limitations.
- Untraceable LLM-only valuations become `insufficient_data` rather than apparently complete estimates.

These are intentionally isolated behind coexistence adapters. They are not safe for an unannounced in-place replacement of the deployed gateway.

## Security and Governance

- Never accept API keys in canonical JSON bodies or URLs.
- Never log raw credentials or authorization headers.
- Search results must derive from authorized repositories, not model memory.
- Valuation outputs require source provenance, data completeness, confidence, engine version, and limitations.
- Error responses must not expose stack traces or provider errors.
- Write operations remain outside this contract until ownership, authorization, idempotency, and audit requirements are approved.

## Tests

Run:

```bash
npm --prefix task001 ci
npm --prefix task001 test
```

The tests parse YAML, structurally validate and dereference the pinned OpenAPI 3.1 document, pin the four canonical routes, executable-check the 9+4 operation ledger, prevent SDK/MCP exposure of the legacy gateway, verify header-only authentication and scope migration, validate complete/insufficient valuation fixtures, reject internal-looking source IDs, reject nested or sensitive error details, and preserve legacy valuation separation.

## Rollback

Delete the three `task001/` files from the task branch. No runtime, deployment, database, payment, DNS, or production contract is changed by this patch.

## Validation Gate

**Builder recommendation: CONDITIONAL GO.**

Conditions before F3 Contract Baseline can be marked complete:

1. Independent validator reviews the corrected self-contained contract package and issues `GO`.
2. The approved package is transplanted onto a current-main-derived integration branch without merging stale history.
3. A tested compatibility adapter is implemented in a later task without changing deployed legacy behavior.
4. Public ID persistence and resolution are defined by TASK-004 before runtime cutover.
