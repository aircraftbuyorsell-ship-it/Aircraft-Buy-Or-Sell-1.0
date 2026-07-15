# ABOS Factory Agent Instructions

## Authority

This file governs work performed by Codex and other coding agents on the `abos-factory/v1` branch and on task branches derived from it.

## Mission

Transform the current Base44-backed ABOS application into an API-first aviation intelligence platform with:

- GitHub as the source of truth for code;
- Cloudflare as the frontend and API runtime target;
- Supabase PostgreSQL as the planned authoritative operational data layer;
- OpenAPI as the external API contract;
- generated JavaScript and Python SDKs;
- MCP as a thin agent adapter;
- UI clients containing presentation logic only.

## Current Evidence Boundary

The uploaded source snapshot contains 740 files, including 86 pages, 376 component files, 116 Base44 function directories, 79 entity definitions, 6 connector definitions and 4 Base44 agent definitions.

The source snapshot builds successfully with `npm run build`, but does not currently pass the repository quality gates:

- `npm run lint`: fails with 140 unused-import errors;
- `npm run typecheck`: fails with multiple application type errors.

Do not report the repository as production-ready until these gates and the migration gates are closed.

## Non-Negotiable Architecture Rules

1. Do not add new business logic directly to UI pages.
2. Define or update the capability contract before implementing a new externally visible capability.
3. Treat the existing Base44 functions and entities as migration sources, not permanent public contracts.
4. Do not expose Supabase service-role credentials or provider secrets to frontend code.
5. Do not copy secret values into source files, issues, logs, prompts or generated documentation.
6. Preserve current behavior during extraction unless a task explicitly authorizes a breaking change.
7. OpenAPI, SDK and MCP changes must remain synchronized.
8. AI-generated search results must come from authorized data retrieval, not model memory.
9. Intelligence outputs must expose confidence, provenance and limitations where applicable.
10. Escrow is outside the initial migration critical path.

## Agent Operating Model

- `Program Director`: selects the next unblocked task and assigns ownership.
- `Builder`: implements exactly one bounded task.
- `Tester`: creates and runs tests independently from the builder.
- `Validator`: checks architecture, contract and acceptance criteria.
- `Security Reviewer`: checks auth, secrets, permissions and unsafe data flows.
- `Integrator`: resolves merge issues and confirms cumulative gates.

A builder must not self-approve its own work.

## Required Task Inputs

Every task must define:

- task ID;
- capability;
- source files;
- target architecture;
- allowed files;
- forbidden changes;
- acceptance criteria;
- test commands;
- rollback approach;
- dependencies.

## Required Completion Evidence

A task is complete only when:

- the scoped implementation exists;
- relevant tests pass;
- no new secret is committed;
- contract drift is checked when applicable;
- migration notes are updated;
- the validator records `GO`, `CONDITIONAL GO` or `NO-GO`;
- unresolved risks are explicit.

## Default Commands

```bash
npm ci
npm run build
npm run lint
npm run typecheck
```

The baseline snapshot currently passes only `npm run build`. A task may not hide existing failures; it must distinguish baseline failures from regressions introduced by the task.

## Branching

- Control plane: `abos-factory/v1`
- Implementation tasks: `factory/<task-id>-<slug>`
- UI tasks: `ui/<task-id>-<slug>`
- Migration tasks: `migration/<task-id>-<slug>`
- Security fixes: `security/<task-id>-<slug>`

Do not commit production implementation directly to `main`.