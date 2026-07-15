# ABOS Migration Strategy v1.0

## Decision

Use an incremental strangler migration. Do not perform a big-bang rewrite or immediate Base44 shutdown.

## Target Runtime

```text
React UI on Cloudflare Pages
        |
ABOS JavaScript SDK
        |
Cloudflare Workers API Gateway
        |
Core and Intelligence Services
        |
Supabase PostgreSQL / Auth / Storage
```

GitHub is the code source of truth. Cloudflare and Supabase are managed runtime dependencies, not sources of business contracts.

## Migration Principles

1. Migrate capabilities, not directories.
2. Preserve legacy behavior until replacement gates pass.
3. Use adapters to support coexistence.
4. Select one authoritative contract before writing replacement runtime code.
5. Separate public API schemas from Base44 entity shapes.
6. Move secrets by rotation and reconfiguration, not source copying.
7. Migrate read paths before high-risk write paths.
8. Keep payments, auth and data cutover behind explicit release gates.

## Waves

### Wave 0 — Control Plane and Contract Reconciliation

- commit Factory control files;
- reconcile Base44 gateway OpenAPI with later RC artifacts;
- select canonical API transport and DTOs;
- establish CI quality baseline;
- create normalized environment-variable registry.

### Wave 1 — Read-Only Search Vertical Slice

- define APL search intent;
- define canonical SearchRequest/SearchResponse;
- implement Cloudflare Worker route;
- read from a controlled Supabase view or repository adapter;
- generate JS SDK method;
- add contract, authorization and parity tests;
- build a new search page beside legacy search.

### Wave 2 — Aircraft and Listing Read Models

- separate Aircraft identity from Listing offer;
- reconcile FAA/registry/listing entities;
- implement read endpoints and SDK models;
- migrate detail pages to the SDK.

### Wave 3 — Identity, API Keys and Organizations

- select Supabase Auth and organization membership model;
- migrate API key hashing, scope and lifecycle behavior;
- add environment-separated credentials;
- verify RLS and server-side authorization.

### Wave 4 — Intelligence

- migrate valuation and ATI as separate versioned services;
- persist provenance, confidence, limitations and engine versions;
- implement fail-closed insufficient-data behavior;
- add SDK and MCP mappings.

### Wave 5 — Listing Writes and Automations

- create/update/publish listing flows;
- media and document storage;
- queue/workflow triggers;
- webhook delivery and idempotency.

### Wave 6 — Payments and Entitlements

- migrate Stripe checkout and webhook handling;
- preserve signature verification and entitlement idempotency;
- reconcile billing/order/tier entities;
- run test-mode cutover before live configuration.

### Wave 7 — Remaining Clients and Integrations

- Developer Portal;
- ChatGPT/MCP clients;
- partner integrations;
- selected Google and email workflows;
- analytics and growth systems.

### Deferred Wave

Escrow, settlement and on-chain monitoring remain outside the initial production migration unless separately approved.

## Data Migration Pattern

For each domain:

1. classify Base44 entities;
2. define canonical SQL schema and external DTOs;
3. write idempotent migrations;
4. create import/reconciliation scripts;
5. validate row counts and sampled records;
6. run dual-read or shadow-read comparison;
7. enable target reads;
8. migrate writes only after parity;
9. retain rollback access until stability window closes.

## Compatibility Adapter

During coexistence, UI code should call an ABOS client interface that can route to either:

- the legacy Base44 function adapter; or
- the new Cloudflare Core API.

Capability routing must be configuration-controlled and observable. Do not scatter environment checks across UI components.

## Cutover Gate

A Base44 capability may be disabled only after:

- target runtime tests pass;
- authorization parity is verified;
- data parity is verified;
- observability and rollback are tested;
- the new UI/SDK path is accepted;
- dependent automations are migrated;
- the Program Director records `GO`.

## Rollback

Every wave must preserve a rollback path that does not require restoring source from memory. Rollback instructions belong in the capability migration file and must identify:

- feature flag or routing switch;
- data synchronization implications;
- credential changes;
- webhook endpoint behavior;
- maximum safe rollback window.