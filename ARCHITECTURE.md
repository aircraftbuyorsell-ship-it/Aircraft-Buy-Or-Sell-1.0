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
| 2/3 — Foundation + core integration | Done — entities, entitlement engine, `tenantProvision`, `tenantCoreApi` |
| 4 — White-label UI | Done — theme system, SDK, `AtiScoreCard`, `AircraftIntelligenceCard` |
| 5 — License + distribution | Done — deterministic package builder, Partner Portal, credential rotation |
| 6 — Installer | Done — 12-step CLI, 6 platform adapters, e2e verified |
| 7 — SkyDeals reference tenant | **Config only.** `skydeals_europe.json` exists and packages build for it. No live `Tenant`/`License` record — that writes to production Base44 and needs the account owner. |
| 8 — Security review | Ongoing per-piece (see §9). No dedicated adversarial pass yet. |
| 9 — Testing | 134 tests, green on Node 18 and 22, including installer e2e and a full package round-trip |
| 10 — Release | **Not started.** No v1.0.0 tag. |

### What is NOT done, stated plainly

The brief's Definition of Done is **not** met. Specifically:

1. **SkyDeals has a Tenant record but no licence.** The `Tenant` row exists on
   production Base44 with `status: 'pending'`. It has no `License` and no
   `TenantApiKey`, because it has no `ContractAcceptance` — nobody has actually
   accepted agreement version `2026-08-26`, and that version is still marked
   NOT LEGALLY REVIEWED. Writing an acceptance record for an acceptance that
   did not happen would forge the one thing the record exists to evidence, so
   the remaining three writes wait on a real acceptance.
2. **No Stripe products/prices for white-label plans.** What Starter /
   Professional / Enterprise cost is a pricing decision, not an engineering
   one. Until those exist, the payment → licence half of the commercial flow
   cannot be wired.
3. **`tenantCoreApi` does not serve every mapped endpoint yet.** Served:
   `whoami`, `search`, `listings.*`, `ati.score`, `valuate`, `ati.report`,
   `ati.report.pro`, `intelligence.market`. Still 501: `passport.get`,
   `registry.lookup`, `intelligence.advanced`. All three are capability-gated
   and return an honest "not yet available" rather than an empty success that
   looks like real data. None of the three is in the Starter or Professional
   capability set, so nothing currently sold is unserved.
4. **Contract acceptance is a mechanism, not a contract.** `ContractAcceptance`
   records who accepted which version and when. It does not make the agreement
   text legally reviewed or enforceable; that is still gated on the CZ legal
   review already tracked on the platform roadmap.
5. **Package delivery is manual.** The Portal shows what's available and the
   builder produces checksummed archives, but there is no authenticated
   download endpoint yet — packages are issued by an ABOS operator.
6. **No v1.0.0 tag or GitHub release.**

### Verified claims

Everything below was executed, not asserted:

- 134 tests pass on Node 18.20.5 and Node 22.
- `npm run build` exits 0 with the Partner Portal in the bundle.
- A package builds, its checksum verifies, `unzip` extracts it, the installer
  runs **from the extracted package** into a throwaway Next.js project, and the
  generated adapter proxies a live request with the key as a header while
  rejecting a non-allowlisted endpoint.
- Two builds of identical inputs are byte-identical.

### Bugs found and fixed while building this

| Bug | Impact |
|---|---|
| `npm test` globbed only `*.test.js` | 4 of 5 test files never ran in CI |
| `metadata.price_usd` sourced from the client request body | Client-controlled value in Stripe's audit trail (not exploitable — nothing consumed it) |
| Prototype-chain lookup on frozen object literals | `plan: "constructor"` passed validation, then crashed provisioning |
| `0o100644 << 16` signed overflow | Zip writer produced an invalid external-attributes field |
| Global `crypto` used in portable `.mjs` | Broke the suite on Node 18, which the CI matrix declares support for |
