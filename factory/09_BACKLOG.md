# ABOS Factory Backlog v0.1

## Status Values

- `READY`: bounded and unblocked.
- `BLOCKED`: missing evidence or decision.
- `ACTIVE`: assigned to one builder.
- `VALIDATING`: implementation complete, independent review pending.
- `DONE`: evidence and gate decision recorded.

## P0 Tasks

### TASK-001 — Canonical API Contract Reconciliation

**Status:** READY  
**Owner role:** High-reasoning architect + contract builder  
**Risk:** High

Compare the Base44 function-gateway contract against the later explicit REST RC contract.

Deliverables:

- operation-by-operation comparison;
- authentication transport comparison;
- response and error DTO comparison;
- intelligence/valuation invariant comparison;
- selected canonical migration contract;
- compatibility adapter design;
- breaking-change report;
- executable contract tests;
- patch plan without production deployment.

Forbidden:

- inventing new endpoints;
- treating proposed endpoints as implemented;
- changing production runtime;
- deleting the legacy gateway.

### TASK-002 — Normalized Secret Registry and Environment Templates

**Status:** READY  
**Owner role:** Security-aware builder  
**Risk:** High

Deliverables:

- normalized secret names;
- `.env.example` and `.dev.vars.example` without values;
- Cloudflare binding manifest;
- GitHub Actions environment matrix;
- provider owner and rotation checklist;
- removal plan for ambiguous aliases such as `Default_API_Key`.

### TASK-003 — Quality Baseline Ledger

**Status:** READY  
**Owner role:** Tester  
**Risk:** Low

Deliverables:

- machine-readable baseline of build/lint/typecheck results;
- categorized lint errors;
- categorized type errors;
- regression-detection script that fails only on newly introduced errors during migration;
- plan to reach fully clean gates.

### TASK-004 — Entity Classification and Supabase Domain Map

**Status:** READY  
**Owner role:** Data architect  
**Risk:** High

Classify all 79 Base44 entities as canonical, supporting, analytics, experimental, duplicate or deferred.

Deliverables:

- entity-to-domain map;
- proposed canonical PostgreSQL tables;
- public DTO separation;
- ownership and retention rules;
- migration order;
- unresolved duplicates.

### TASK-005 — Search POC Contract Package

**Status:** BLOCKED by TASK-001  
**Owner role:** Contract builder  
**Risk:** Medium

Deliverables:

- APL search intent schema;
- ADL search request/result models;
- canonical OpenAPI operation;
- deterministic retrieval rules;
- authorization and rate-limit requirements;
- SDK and MCP method mappings;
- acceptance tests.

### TASK-006 — Cloudflare Search Runtime

**Status:** BLOCKED by TASK-005 and TASK-004  
**Owner role:** Backend builder  
**Risk:** Medium

Implement the non-production Search vertical slice in Cloudflare Workers using a repository abstraction and approved Supabase read model.

### TASK-007 — Search SDK and Reference UI

**Status:** BLOCKED by TASK-006  
**Owner role:** SDK builder + UI builder  
**Risk:** Medium

Generate/implement the JS SDK method and a new UI page that runs beside the legacy search page.

### TASK-008 — Search Independent Validation

**Status:** BLOCKED by TASK-007  
**Owner role:** Tester + validator + security reviewer  
**Risk:** Medium

Validate behavior parity, authorization, invalid inputs, observability, data provenance and rollback.

## P1 Tasks

### TASK-101 — Aircraft Identity and Listing Separation

**Status:** BLOCKED by TASK-004

### TASK-102 — API Key Lifecycle Migration

**Status:** BLOCKED by TASK-001 and TASK-004

### TASK-103 — Supabase RLS Policy Suite

**Status:** BLOCKED by TASK-004

### TASK-104 — ATI Semantic Contract

**Status:** BLOCKED by TASK-001 and Aircraft model selection

### TASK-105 — OMVM Valuation Contract and Provenance

**Status:** BLOCKED by TASK-001 and data-source inventory

### TASK-106 — Stripe Payment and Entitlement Reconciliation

**Status:** READY for read-only audit; implementation blocked pending separate approval

## P2 Tasks

- partner/webhook architecture;
- documents and vault migration;
- traffic integration extraction;
- messaging and notification migration;
- Developer Portal implementation;
- MCP catalog expansion;
- analytics separation.

## Deferred

- escrow runtime migration;
- on-chain settlement;
- production cutover;
- DNS changes;
- public v1.0 release.

## Parallel Start Set

The Program Director may start these tasks in parallel because their primary write sets are independent:

- TASK-001 Contract Reconciliation;
- TASK-002 Secret Registry;
- TASK-003 Quality Baseline Ledger;
- TASK-004 Entity Classification.

Each task must use a separate branch/worktree and an independent validator.