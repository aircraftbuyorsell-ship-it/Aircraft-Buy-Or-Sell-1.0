# ABOS Codex Factory Runbook

## Goal

Allow a fresh Codex session on the temporary Mac mini to start work without replaying project chat history.

## Initial Setup

```bash
git clone https://github.com/aircraftbuyorsell-ship-it/abos-0.8-intrazone.git
cd abos-0.8-intrazone
git fetch --all --prune
git checkout abos-factory/v1
npm ci
npm run build
npm run lint || true
npm run typecheck || true
```

The final two commands are expected to fail on the current baseline. Codex must preserve their output as baseline evidence and must not claim clean quality gates.

## Required Reading Order

1. `AGENTS.md`
2. `factory/00_FACTORY_MANIFEST.md`
3. `factory/01_PROGRAM_BOARD.md`
4. `factory/02_CAPABILITY_REGISTRY.md`
5. `factory/05_SECURITY_AND_SECRETS.md`
6. `factory/06_EXTRACTION_REPORT.md`
7. `factory/07_MIGRATION_STRATEGY.md`
8. `factory/09_BACKLOG.md`

Read only task-relevant source after this control context.

## Program Director Loop

```text
Load current factory state
 -> select highest-priority unblocked task
 -> create bounded task branch
 -> assign builder
 -> run independent tester
 -> run validator
 -> run security reviewer when required
 -> integrate or reject
 -> update factory state and backlog
 -> repeat
```

## Worktree Strategy

Use separate worktrees for parallel non-overlapping tasks.

Example:

```bash
git worktree add ../abos-task-001 -b factory/TASK-001-contract-reconciliation abos-factory/v1
git worktree add ../abos-task-002 -b factory/TASK-002-secret-registry abos-factory/v1
```

Do not run parallel agents against the same working tree.

## First Task

The first implementation task is `TASK-001 — Canonical API Contract Reconciliation`.

It must compare:

- `base44/functions/abosCoreApi/entry.ts`;
- `base44/functions/abosOpenApiSpec/entry.ts`;
- the approved later OpenAPI RC artifacts supplied to the Codex workspace.

The task must not implement new product endpoints. It must produce a compatibility decision, selected canonical contract, migration adapter design, tests and a proposed patch.

## Secrets

Do not request that the user paste production secrets into chat or task files.

Use local untracked environment files and authenticated provider CLIs. Create target secret names and setup commands without embedding values.

## External Systems

Production writes are prohibited unless a task explicitly contains human approval for the exact action.

This includes:

- Cloudflare deployment or DNS changes;
- Supabase schema/data changes;
- Stripe product, webhook or payment changes;
- GitHub merge to `main`;
- provider credential rotation.

## Test Reporting

Every task report must include:

```text
Baseline commands and results
Changed commands and results
Tests added
Regressions introduced: yes/no
Existing failures remaining
Validator decision
Security review decision, when required
Rollback instructions
```

## End-of-Session Handoff

Before ending a Codex session:

- commit or preserve the patch;
- update the task status;
- record exact commands and results;
- list uncommitted files;
- identify the next unblocked task;
- avoid leaving credentials, temporary datasets or generated secrets in the worktree.