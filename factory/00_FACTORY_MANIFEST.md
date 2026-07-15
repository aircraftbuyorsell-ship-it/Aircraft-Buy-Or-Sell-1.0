# ABOS Factory Control Plane v1.0

**Status:** Active  
**Branch:** `abos-factory/v1`  
**Repository:** `aircraftbuyorsell-ship-it/abos-0.8-intrazone`  
**Normative for agent execution:** Yes  
**Production deployment authority:** No

## Purpose

ABOS Factory is the control plane for extracting the existing Base44-backed application into an independent ABOS Platform.

It coordinates Codex, Cowork, Cloud AI Code and human review through one repository-backed operating model.

## Target Architecture

```text
GitHub
  |
  +-- Factory Control Plane
  +-- OpenAPI and Schemas
  +-- Core Services
  +-- SDK and MCP
  +-- React UI
  +-- Database Migrations
        |
        v
Cloudflare Pages / Workers
        |
        v
ABOS Core API
        |
        v
Supabase PostgreSQL / Auth / Storage
```

## Strategic Rules

1. API first.
2. Contract first.
3. SDK first for reusable clients.
4. MCP remains an adapter over Core API capabilities.
5. UI is a client, never the source of canonical business logic.
6. Existing Base44 code is extracted incrementally; no big-bang rewrite.
7. Production secrets are configured in deployment systems, never committed.
8. Every capability is implemented through the same delivery sequence.

## Capability Delivery Sequence

```text
Capability Definition
  -> APL Semantics
  -> ADL Data Contract
  -> OpenAPI Contract
  -> Runtime Implementation
  -> SDK
  -> MCP Adapter
  -> Tests
  -> Reference UI
  -> Documentation
  -> Release Gate
```

## Sources of Truth

| Domain | Source of truth |
|---|---|
| Agent execution | `AGENTS.md` |
| Program state | `factory/01_PROGRAM_BOARD.md` |
| Capability state | `factory/02_CAPABILITY_REGISTRY.md` |
| Existing source inventory | `factory/06_EXTRACTION_REPORT.md` |
| Secrets and credential migration | `factory/05_SECURITY_AND_SECRETS.md` |
| Migration order | `factory/07_MIGRATION_STRATEGY.md` |
| Task queue | `factory/09_BACKLOG.md` |
| API contract | versioned OpenAPI files |
| Production code | merged implementation branches |

## Release Boundaries

The Factory branch may contain planning, schemas, test specifications, migration manifests and non-deploying scaffolding.

It must not trigger a production deployment without a separate reviewed release decision.

## Current Checkpoint

The source snapshot is suitable for extraction rather than a full rewrite. It already contains Core API, OpenAPI, Supabase, Stripe and intelligence-related artifacts, but the present contracts and runtime are coupled to Base44 and contain contract drift that must be resolved before migration.