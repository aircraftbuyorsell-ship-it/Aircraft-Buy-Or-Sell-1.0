# TASK-002 Evidence Report

## Scope and source

- Read-only source baseline: `main@5112f7f43113627b2fa1c1d8495c52d6b0fbca30`.
- Control-plane inputs: `AGENTS.md`, `factory/05_SECURITY_AND_SECRETS.md`, and `factory/09_BACKLOG.md` from `abos-factory/v1`.
- Write set: `task002/**` only.
- No secret value, runtime, workflow, environment, issue, PR or deployment was changed.

## Direct evidence on current main

| Path | Evidence | Registry consequence |
|---|---|---|
| `src/lib/app-params.js` | Browser reads `VITE_BASE44_APP_ID`, `VITE_BASE44_FUNCTIONS_VERSION` and `VITE_BASE44_APP_BASE_URL`; an access token may arrive through a URL and is moved to local storage | Base44 names are compatibility-only; no privileged provider secret belongs in the browser template |
| `vite.config.js` | Build reads `BASE44_LEGACY_SDK_IMPORTS` | Rename as explicit compatibility config and exclude from production by default |
| `base44/functions/expertCheckout/entry.ts` | Server reads `STRIPE_SECRET_KEY` | Cloudflare Worker secret, unique per environment |
| `base44/functions/stripeCreateCheckout/entry.ts` | Server reads `STRIPE_SECRET_KEY` | Same canonical Stripe runtime binding |
| `base44/functions/stripeWebhook/entry.ts` | Server reads `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and verifies the raw request signature | Preserve server-side storage and environment-specific webhook secret |
| `base44/functions/getOpenSkyToken/entry.ts` | Server reads `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` | Worker secrets; token issuance needs a separately reviewed authorization boundary |
| `base44/functions/aircraftDataHub/entry.ts` | Base44 Supabase connector returns a management access token; function lists projects/keys and dynamically obtains `service_role` | Do not copy this flow into public runtime; separate CI/admin token from a rotated Worker service-role secret |
| `base44/functions/intraZoneSupabase/entry.ts` | Same connector/management API pattern; endpoint is restricted to admin roles | Management token remains administration-only; preserve authorization during future extraction |
| `base44/functions/intrazoneMarketSignals/entry.ts` and `intrazoneNetworkIntel/entry.ts` | Connector token is used for Supabase management read-only SQL endpoint | Replace with an approved read model; do not expose management credentials to the new client/runtime |

## Control-plane inventory evidence

The focused Factory inventory identifies these additional source names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `ANTHROPIC_API_KEY`, `OpenAI_API_Key_abos_marketspace`, `GOOGLE_API_KEY`, `HUGGINGFACE_API_KEY`, `NVIDIA_API_KEY`, `SAKANA_12byteflow_API_KEY`, `12byteflow_key`, `Default_API_Key`, `ALCHEMY_RPC_URL`, `ESCROW_API_KEY`, and `ESCROW_API_USER`. Code search indexing returned no results during this run, so these items are classified as inventory evidence rather than falsely claimed as reconfirmed consumers.

## Findings and unresolved risks

1. **High:** current Supabase flows can dynamically retrieve a service-role credential through a connector management token. The target must eliminate this runtime management-plane dependency.
2. **High:** `Default_API_Key` has no safe canonical mapping until every consumer is traced.
3. **High:** ownership of the two 12byteflow/Sakana aliases is unverified; activation is blocked.
4. **High:** publishable Supabase browser configuration is safe only after RLS policy verification.
5. **Medium:** OpenSky currently returns an access token to any authenticated user; future runtime extraction needs entitlement/scope validation.
6. **Medium:** Base44 browser access-token compatibility is not redesigned here and must be removed in an authorized auth migration.
7. **Deferred:** Alchemy and escrow bindings are documented but excluded from the active launch runtime.
8. **Operational:** templates are non-functional placeholders; actual values and rotation evidence must stay outside Git.

## Builder recommendation

**CONDITIONAL GO for independent validation.** The registry and templates are safe to review and use as a naming contract. Do not configure production values or change runtime consumers until the unresolved aliases, Supabase RLS/read model, OpenSky authorization boundary and environment ownership are validated.
