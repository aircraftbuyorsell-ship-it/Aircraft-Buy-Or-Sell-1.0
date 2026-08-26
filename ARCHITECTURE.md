# ABOS White-Label Toolset & Installer — Architecture

Status: **in progress**. This document is the Phase 1 spec for the commercial
white-label distribution layer being built on top of the existing ABOS
platform, grounded in a Phase 0 audit of what already exists in this repo
(see "What already exists" below). It is updated as implementation proceeds;
treat any section not reflected in `git log` as design intent, not shipped
behavior.

First reference tenant: **SkyDeals Europe** (`tenant_id: skydeals_europe`).

## 1. What already exists (reused, not rebuilt)

| Layer | Where | Notes |
|---|---|---|
| Business logic | `base44/functions/*/entry.ts` (150+ Deno functions) | Executed on Base44's platform, not this repo's CI. This repo mirrors the source. |
| Individual-user entitlements | `base44/functions/_shared/accessControl.ts`, `Entitlement` entity | T1/T2/T3 tiers + per-product entitlements for ABOS.com *consumers*. Untouched — the tenant model below is a separate, B2B layer. |
| Stripe | `stripeCreateCheckout`, `stripeWebhook`, `abosEntitlements` | Real SDK usage, real webhook idempotency (`TokenTransaction`/`PaymentEvent` dedupe). |
| Edge/MCP | `gateway/` (`abos-widget-gateway`, deployed Cloudflare Worker) | OAuth 2.1+PKCE, MCP tool routing, APL/ADL governance + hash-chained audit log, ATI narrative scoring (calls Anthropic directly). Mostly proxies to Base44. Single-tenant today (`BASE44_APP_BASE_URL` is one hardcoded wrangler var). |
| Nascent white-label partner model | `PartnerConfig` entity + `widgetGateway` function | A *different* product line (escrow-marketplace embeddable widget, `embed_token` auth, `allowed_steps` wizard). Shares some shape with what we need but is not reused directly — see §3. |
| UI components | `src/components/**` (71+ folders), shadcn/ui + Tailwind + Radix | ATI score ring, passport PDF, valuation report, market-intelligence cards already built, not yet tenant-themed. |
| Individual API keys | `ApiKey` entity + `abosCoreApi/entry.ts` | Hashed key, prefix, scopes, plan-based sliding-window rate limits. Directly mirrored by `TenantApiKey` (§3). |

## 2. What's genuinely new (this initiative)

No tenant/org model, no license/activation system, no installer, no package
builder, no Partner Portal, no generic contract-acceptance audit trail
existed anywhere in the codebase before this work (confirmed by repo-wide
search, not assumption).

## 3. Data model

Four new Base44 entities (`base44/entities/`), admin-managed — provisioning
happens through a service-role function, not direct end-user CRUD:

- **`Tenant`** — a customer organization. `tenant_id` (immutable slug),
  `display_name`, `contact_email`, `status` (pending/active/suspended),
  branding (`brand_name`, `logo_url`, `primary_color`, `custom_domain`),
  `allowed_domains`.
- **`License`** — what a Tenant is entitled to. `tenant_id`, `plan`
  (starter/professional/enterprise), `status`
  (pending/active/suspended/expired/revoked), `allowed_capabilities`,
  `api_rate_plan`, `version_channel`, `expires_at`, Stripe references. The
  single authoritative source for tenant-level entitlement decisions.
- **`TenantApiKey`** — hashed server-to-server credential (`abos_tenant_...`)
  a tenant's backend/installer uses to call ABOS Core. Mirrors `ApiKey`'s
  hash/prefix/rate-window pattern rather than inventing a new one.
- **`ContractAcceptance`** — audit record of who accepted which license
  agreement version, when, from where. Records the *act* of acceptance;
  does not make the underlying agreement text legally reviewed or
  enforceable — see §7.

`Tenant` is deliberately **not** `PartnerConfig`: `PartnerConfig` is the
escrow-marketplace widget partner program (revenue share, Stripe Connect
payouts, wizard steps) — a different bounded context that happens to share
some shape (branding fields, embed auth). Conflating them would couple two
unrelated products' schemas together for no benefit.

## 4. Entitlement enforcement

`base44/functions/_shared/tenantLicense.mjs` — pure functions (key
generation/hashing, capability checks, sliding-window rate limiting), zero
Deno-specific imports, covered by real `node --test` unit tests
(`test/tenant-license.test.mjs`).

`base44/functions/_shared/tenantAccessControl.ts` — thin Base44-SDK glue:
`resolveTenantAccess(req)` reads the `x-abos-tenant-key` header, hashes it,
looks up `TenantApiKey` → `License` → `Tenant`, and fails closed at every
stage (invalid/revoked key → 401; inactive/expired license → 403; inactive
tenant → 403; rate limit → 429) before anything is trusted. Mirrors
`accessControl.ts`'s shape for the tenant-auth case. Nothing about
tenant/license identity is ever read from client-supplied request data —
only the opaque API key.

**Not yet wired up**: no HTTP route calls `resolveTenantAccess` yet. The
next concrete step is a `tenantCoreApi` (or similarly named) Base44 function
that authenticates via this module and proxies to the same underlying data
`abosCoreApi` already serves, capability-gated per license.

## 5. Target architecture (customer-facing)

```
CUSTOMER WEBSITE (e.g. skydealseurope.com)
        |
WHITE-LABEL UI (tenant-themed components over existing ATI/valuation UI)
        |
ABOS SDK / API CLIENT  (uses TenantApiKey — never a master ABOS secret)
        |
CUSTOMER BACKEND OR SECURE SERVER-SIDE ADAPTER
        |
ABOS CORE API  (tenantAccessControl -> capability check -> existing
                abosCoreApi / gateway MCP tools, same data both power
                the first-party ABOS product)
        |
ATI / VALUATION / REPORTS / INTELLIGENCE  (unchanged — Base44 + Anthropic)
```

The white-label SDK/API client never receives ABOS's own
`GATEWAY_SECRET`/`MCP_BEARER_TOKEN`/service-role credentials — only its
tenant's own `TenantApiKey`, scoped and rate-limited independently.

## 6. Repository strategy

Building inside `Aircraft-Buy-Or-Sell-1.0`, **not** a new multi-repo split.
Rationale (brief §18: "choose the minimum clean architecture, avoid
fragmentation"): the existing platform is already effectively a monorepo
(`gateway/`, `security-worker/`, `core-api/`, `base44/`, `src/`) with clear
module boundaries via `package.json` names and deploy workflows per module.
Adding `license`/`tenant` as a bounded context inside `base44/` and a future
`white-label/` UI-kit package follows that existing convention rather than
inventing a new one. Revisit only if/when the installer or package builder
genuinely need independent versioning/release cadence from the core app.

## 7. Known open items (tracked honestly, not hidden)

- **Legal**: `ContractAcceptance` records acceptance; it does not make the
  agreement text enforceable. This account's own roadmap (`PLATFORM-STATE.md`)
  flags ToS/Privacy legal review as pending a CZ lawyer — the same review
  gap applies to any white-label license agreement text.
- **APL audit chain degrades silently**: `gateway/src/apl.js` falls back to
  `previous_hash: 'genesis'` (i.e. stops chaining) if the `ABOS_AUDIT` KV
  binding is ever absent, rather than failing loudly. Worth hardening before
  this becomes the audit trail a paying tenant relies on — not yet done.
- **`security-worker` and `core-api` are single-tenant** (hardcoded zone ID
  / API key, sandbox config respectively) — not reusable per-tenant without
  refactoring. Out of scope unless a tenant capability specifically needs
  per-tenant Cloudflare zone scanning.
- No HTTP endpoint yet calls `resolveTenantAccess` — see §4.
- No Stripe product/price configuration exists yet for White-Label plans —
  this is a pricing decision, not an engineering one.

## 8. Phase status

| Phase | Status |
|---|---|
| 0 — Discovery | Done |
| 1 — Product spec | This document; living |
| 2/3 — Foundation + core integration | Data model + entitlement engine done; HTTP wiring not started |
| 4 — White-label UI | Not started |
| 5 — License + distribution | Data model done; provisioning endpoint + package builder not started |
| 6 — Installer | Not started |
| 7 — SkyDeals reference tenant | Not started (no `Tenant` record created yet) |
| 8 — Security review | Ongoing as each piece lands (see commit history for fixes already made to existing Stripe checkout metadata as a side effect of restoring full test coverage) |
| 9 — Testing | Unit tests exist for what's built (`test/tenant-license.test.mjs`, `test/tenant-access-control.test.mjs`); integration/e2e not applicable until there's an endpoint to test against |
| 10 — Release | Not started |
