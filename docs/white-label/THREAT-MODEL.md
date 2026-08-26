# White-Label Toolset — Threat Model & Security Review

Internal document. Covers the White-Label Toolset only (tenant/licence model,
tenant API surface, Partner Portal, installer, package builder). The wider ABOS
platform is out of scope except where this work touches it.

Reviewed at commit `c9df4d4`. This is a self-review by the implementer, not an
independent audit — see [Limitations](#limitations).

## Assets

| Asset | Why it matters |
|---|---|
| Tenant API keys | Authorize billable API calls; grant a tenant's whole capability set |
| Licence records | The authorization source for every tenant request |
| Cross-tenant data | Tenant A must never read Tenant B's licence, keys or usage |
| ABOS proprietary logic | ATI/valuation logic staying server-side is the commercial basis of the product |
| ABOS master credentials | `GATEWAY_SECRET`, service-role access, Stripe keys |
| Customer packages | Downloaded, stored, often committed by the customer |

## Trust boundaries

```
Untrusted: the public internet, a customer's browser, tenant config files
   │
   ├─ Customer backend adapter ....... semi-trusted; holds ONE tenant's key
   │
   ├─ tenantCoreApi ................. machine auth (hashed key) → one tenant
   ├─ tenantPortal .................. person auth (session) → tenants they contact
   └─ tenantProvision ............... admin only
        │
   Trusted: ABOS Core (Base44 service role, scoring engines, Stripe)
```

Three separate authorization models exist on purpose. Collapsing them is how
tenant-breakout bugs get written:

| Surface | Principal | Authorization source |
|---|---|---|
| `abosCoreApi` | ABOS user or their personal key | `Entitlement` + tier |
| `tenantCoreApi` | A tenant's backend (machine) | `License` for that key |
| `tenantPortal` | A person (session) | Tenants where they are the contact |

## Threats and controls

### T1 — Credential exposure in client code
**Risk:** a tenant key shipped to browsers is readable by every visitor.

Controls, all structural rather than advisory:
- `createBrowserClient()` has no parameter that can accept a credential; a test
  attempts to smuggle one through the options bag and asserts it never reaches
  the wire.
- `createServerClient()` throws in a browser-like environment, so a bundler
  pulling it client-side fails loudly instead of leaking silently.
- The installer **refuses to install** into a static SPA — there is nowhere safe
  to hold the key, so it stops and explains how to add a backend.
- No generated file ever contains the key; `assertNoCredentials()` re-checks
  every artifact before it is written.
- Keys travel as a header, never in a URL (URLs land in access logs).

### T2 — Cross-tenant access (IDOR)
**Risk:** one partner reads another's licence, keys or data.

Controls:
- `tenantPortal` derives the accessible tenant set from the session's verified
  email; a request `tenant_id` may only *select* from that set, never serve as a
  lookup key. Key revocation is scoped the same way.
- `tenantCoreApi` never reads tenant identity from request data — only from the
  resolved key → licence → tenant chain.
- **Fixed during this review:** `resolveTenantAccess` resolved the tenant from
  the *licence* without checking it matched the *key's* own `tenant_id`. A key
  mis-paired with another tenant's licence would have operated as that tenant.
  Nothing can currently create such a pairing, but it now fails closed before
  the tenant record is loaded.

### T3 — Entitlement bypass
**Risk:** a tenant uses a capability they didn't buy.

Controls:
- Every endpoint is capability-gated server-side against `License`.
- The endpoint→capability map is **closed by default**; unknown endpoints 404.
- Lookup tables are null-prototype, so `plan: "constructor"` can't resolve to an
  inherited member (this was a real bug, found by test, now fixed).
- `enabled_features` in a customer's config is presentation only — the API
  ignores it entirely.
- The installer can only enable capabilities the licence grants, and says so
  when it drops a request.
- Provisioning filters requested capabilities against the plan's set, never
  unions with it, so it can narrow a licence but never mint capabilities.

### T4 — Forged or stale licences
Controls: keys stored hashed (SHA-256) and never recoverable; revocation
immediate; expiry checked on every request (`<=`, no grace window); suspended
tenant blocks access regardless of licence; a licence whose record is missing
fails closed.

### T5 — Package tampering / supply chain
Controls: deterministic builds (identical inputs → byte-identical archive), so a
published checksum is meaningful; per-file SHA-256 in the manifest; zip-slip
protection on entry paths; credential scanning refuses the build; server-side
source paths refused so proprietary logic can't ship.

### T6 — Adapter abuse
**Risk:** a customer's adapter becomes an open proxy against their quota.

Controls: every generated adapter ships an endpoint allowlist; docs tell
customers to authenticate their own users and rate-limit per user, since ABOS
rate-limits per *tenant* and cannot know who their users are.

## Accepted risks and known weaknesses

Stated plainly rather than left implicit.

### W1 — Rate-limit counters race under concurrency (medium)
`resolveTenantAccess` reads the counter, decides, then writes it back. Two
concurrent requests both read *N* and both write *N+1*, so a burst can exceed
the nominal limit. Base44 entities expose no atomic increment.

This is **shared with the existing `abosCoreApi`** rate limiter, so it is not a
regression introduced here. It means the per-tenant limit is a cost-control
approximation, not a hard security boundary.

*Mitigation:* put real rate limiting at the edge (Cloudflare) if abuse
protection needs to be strict. Not done — it's an infrastructure decision.

### W2 — Rate-limit persistence is fire-and-forget (low/medium)
The counter write is not awaited and failures are logged, not raised. Persistent
write failure means limits stop accumulating — i.e. it **fails open**.

Rationale for accepting: the counter lives in the same store as everything else
the request needs, so a store outage takes the API down anyway. Awaiting it
would add latency to every call for a control that W1 already makes approximate.
Matches the existing `trackUsage()` convention.

### W3 — Unbounded key creation per tenant (low)
A partner can issue keys repeatedly via the Portal. Self-inflicted only (their
own tenant), but there is no cap or cooldown. Worth a limit before GA.

### W4 — Contract acceptance is a mechanism, not a contract (blocking for GA)
`ContractAcceptance` records who accepted which version, when, and from where.
It does **not** make the agreement text legally reviewed or enforceable. Gated on
the CZ legal review already tracked on the platform roadmap. Do not represent
this as a binding agreement until that review lands.

### W5 — APL audit chain degrades silently (pre-existing)
`gateway/src/apl.js` falls back to `previous_hash: 'genesis'` when the
`ABOS_AUDIT` KV binding is absent — the chain stops proving anything, quietly.
Out of scope for this work, but it should fail loudly before it is the audit
trail a paying tenant relies on.

### W6 — No independent penetration test
See below.

## Limitations

- **Self-review, not an audit.** Written by the implementer; a reviewer with no
  stake in the design would likely find things this missed.
- **No live testing.** Everything is verified against unit tests, source guards
  and a mock ABOS. Nothing has been exercised against production Base44, because
  no tenant has been provisioned there.
- **Deno-runtime functions are guard-tested, not executed.** Their decision logic
  lives in pure modules that *are* executed; the glue is verified by source
  pattern. A behavioural bug in the glue that preserves the patterns would pass.
- **No dependency audit.** `npm audit` reports 74 pre-existing vulnerabilities on
  the default branch, untouched by this work and not assessed here.

## Before GA

- [ ] Independent security review, ideally with production access
- [ ] Edge rate limiting (W1)
- [ ] Key issuance cap (W3)
- [ ] Legal review of the agreement text (W4)
- [ ] Harden the APL audit chain to fail loudly (W5)
- [ ] Triage the existing dependency vulnerabilities
