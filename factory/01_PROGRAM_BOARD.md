# ABOS Factory Program Board

**Status:** Active  
**Progress policy:** Evidence only. Percentages without commits, tests or reviewed artifacts are prohibited.

## Current Baseline

| Evidence | Result |
|---|---|
| Source snapshot files | 740 |
| React pages | 86 |
| Component files | 376 |
| Base44 function directories | 116 |
| Base44 entity definitions | 79 |
| Connector definitions | 6 |
| Base44 agent definitions | 4 |
| `npm run build` | PASS |
| `npm run lint` | FAIL — 140 errors |
| `npm run typecheck` | FAIL — multiple application errors |
| Typical hardcoded private-key patterns | No match in initial focused scan |

## Program Gates

| Gate | Definition | State | Evidence / blocker |
|---|---|---|---|
| F0 Control Plane | Factory files and Codex rules committed | In Progress | Initial files committed to `abos-factory/v1` |
| F1 Source Inventory | Functions, entities, integrations and dependencies inventoried | In Progress | Counts and first domain map complete |
| F2 Security Inventory | All secret names and credential flows mapped | In Progress | 20 environment-variable names identified |
| F3 Contract Baseline | One canonical OpenAPI contract selected and validated | Blocked | Base44 runtime contract differs from later RC2 artifacts |
| F4 Quality Baseline | Build, lint and typecheck baseline recorded | Complete | Build passes; lint/typecheck fail |
| F5 Cloudflare Skeleton | Non-production Pages/Workers scaffold | Not Started | Requires approved implementation task |
| F6 Supabase Schema | Authoritative schema and migrations | Not Started | Requires entity reconciliation |
| F7 First Extracted Capability | One capability runs outside Base44 | Not Started | Search recommended as first vertical slice |
| F8 UI Reference Client | New UI consumes SDK/Core API only | Not Started | Blocked by F3 and F7 |
| F9 Production Cutover | Base44 backend no longer required | Not Started | Long-term gate |

## Active Epics

### EPIC-000 — Factory Control Plane

Deliver the operational files used by Codex and other agents.

### EPIC-001 — Source Extraction and Reconciliation

Map the Base44 source snapshot to target domains and identify contract drift.

### EPIC-002 — Security and Secrets Migration

Move provider credentials and privileged access to Cloudflare/Supabase/GitHub secret stores with rotation and verification.

### EPIC-003 — Canonical Contract Selection

Reconcile the Base44 single-gateway OpenAPI 3.0.3 implementation with the later four-operation OpenAPI RC architecture. No new endpoint implementation begins before this gate.

### EPIC-004 — Search Vertical Slice

Extract natural-language intent parsing and deterministic listing retrieval as the first proof of concept.

### EPIC-005 — Platform Runtime Bootstrap

Create Cloudflare Workers, Supabase migrations, CI and observability scaffolding after the contract baseline is accepted.

### EPIC-006 — UI Extraction

Move existing React UI to a platform-client model and build new pages beside legacy pages.

## Immediate Critical Path

```text
Control Plane
 -> Contract Reconciliation
 -> Secrets Plan
 -> Search Vertical Slice
 -> SDK Integration
 -> Reference UI
 -> Additional Capabilities
```

## Stop Conditions

Stop an implementation task and escalate when it would:

- expose a secret to the client;
- redefine a public contract without review;
- require direct production database changes;
- silently change payment behavior;
- create a second canonical Aircraft or Listing model;
- introduce unsupported ATI or valuation semantics;
- activate escrow or production deployment.