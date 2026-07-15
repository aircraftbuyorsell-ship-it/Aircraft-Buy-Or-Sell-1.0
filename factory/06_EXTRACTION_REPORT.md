# ABOS Base44 Extraction Report v0.1

**Source:** uploaded `aviation-marketspace last(1).zip` snapshot  
**Purpose:** establish the real migration baseline before implementation.

## Executive Finding

The project should be extracted incrementally, not rewritten from zero.

The source is a React/Vite application with a large Base44 runtime surface. Existing platform-oriented artifacts already exist, but they are not yet an independent ABOS backend.

## Inventory

| Area | Count / evidence |
|---|---:|
| Total files | 740 |
| `src/pages` files | 86 |
| `src/components` files | 376 |
| Base44 function directories | 116 |
| Base44 entity definitions | 79 |
| Base44 connectors | 6 |
| Base44 agents | 4 |
| Files referencing Base44 SDK/runtime terms | 296 |
| Files referencing Supabase | 28 |
| Files referencing Stripe | 35 |

## Build Baseline

```text
npm ci                PASS
npm run build         PASS
npm run lint          FAIL — 140 unused-import errors
npm run typecheck     FAIL — multiple application type errors
```

The successful Vite build proves the snapshot is buildable. It does not prove type safety, release readiness or backend independence.

## Existing Platform Seeds

### API / Developer

- `base44/functions/abosCoreApi/entry.ts`
- `base44/functions/abosOpenApiSpec/entry.ts`
- `src/pages/CoreAPI.jsx`
- `src/pages/Developers.jsx`
- `src/pages/IntegrationKit.jsx`
- `ApiKey` and `ApiRequestLog` entities

### Supabase

- `src/lib/supabase.js`
- `getSupabaseConfig`
- `intraZoneSupabase`
- `listSupabaseProjects`
- `setupDatabase`
- registry and FAA synchronization functions

### Payments

- Stripe checkout and webhook functions
- billing, order, settlement and tier entities

### Intelligence

- ATI scoring and verification functions
- OMVM and expert valuation functions
- market analytics, forecasting and reports
- matching and negotiation functions

## Contract Drift Requiring Resolution

The source snapshot contains a Base44 function gateway contract with these characteristics:

- one `/abosCoreApi` function endpoint;
- an `endpoint` discriminator in the JSON request body;
- OpenAPI `3.0.3`;
- API key header named `x-abos-key`;
- operations including key management, search, valuation, extraction and listing operations;
- a universal success envelope.

Later ABOS RC artifacts discussed in the project use a different model:

- four explicit REST operations;
- OpenAPI `3.1.0`;
- direct operation-specific DTOs;
- different authentication transport naming;
- stricter intelligence and valuation invariants.

The source snapshot must not silently overwrite the later contract, and the later contract must not be assumed to match the deployed Base44 runtime. `TASK-001` must reconcile this evidence and select the canonical migration contract.

## Coupling Assessment

### Frontend coupling

The UI uses Base44 SDK-generated entity and function access broadly. New pages can be built beside legacy pages, but the shared client boundary must be introduced before large-scale UI migration.

### Backend coupling

Most backend functions import `createClientFromRequest` and access Base44 entities, auth or integrations directly. These functions require adapters or extraction into independent services.

### Data coupling

The 79 entity definitions include overlapping operational, intelligence, analytics, payment, developer and experimental objects. They must be classified before generating Supabase migrations.

### Integration coupling

Base44 connector definitions currently cover:

- GitHub;
- Supabase;
- Gmail;
- Google Docs;
- Google Calendar;
- Google Search Console.

These integrations will require explicit target credentials, OAuth consent and least-privilege scopes.

## Recommended Domain Groups

1. Identity and Developer Access
2. Aircraft Identity and Registry
3. Listings and Marketplace
4. Search
5. ATI and Verification
6. Valuation and OMVM
7. Matching and Deal Intelligence
8. Payments and Entitlements
9. Documents and Inspection
10. Messaging and Notifications
11. Traffic and External Data
12. Analytics and Growth
13. Partner Integrations
14. Experimental Skills and Agents
15. Deferred Escrow and Settlement

## Preserve / Extract / Retire Policy

### Preserve

- working React presentation components;
- verified business rules;
- current user-facing behavior needed for coexistence;
- auditable payment and entitlement behavior;
- validated aircraft and listing data.

### Extract

- auth and API key management;
- Core API operations;
- deterministic search and listing retrieval;
- ATI and valuation engines;
- provider integrations;
- Stripe webhooks;
- automation triggers;
- canonical data access.

### Retire or Reassess

- duplicate experimental pages and functions;
- ambiguous shared credential aliases;
- Base44-only public contract shapes;
- stale or unverified intelligence score semantics;
- escrow paths outside the approved launch scope.

## First Vertical Slice

Extract `Aircraft Search` through coexistence:

```text
Legacy Search Page --------------> existing Base44 behavior
New Search Page -> JS SDK -> Cloudflare Worker -> Search Service -> Supabase
```

Both paths remain available until response parity, authorization, observability and rollback gates pass.

## Immediate Risks

- OpenAPI/runtime drift;
- broad service-role use in backend functions;
- frontend quality gate failures;
- overlapping entity semantics;
- payment and entitlement complexity;
- duplicated AI provider integrations;
- possible connector over-permission;
- incomplete provenance for intelligence outputs.

## Audit Limitation

This report is based on static source inspection and local build/lint/typecheck execution. It does not prove deployed Base44 configuration, live secret values, production data shape, Cloudflare settings, Supabase RLS state or Stripe account configuration.