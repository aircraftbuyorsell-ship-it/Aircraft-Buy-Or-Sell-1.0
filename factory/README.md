# ABOS Factory Control Plane

This directory is the operational index for the ABOS Base44 extraction and independent platform migration.

## Read First

1. [`../AGENTS.md`](../AGENTS.md)
2. [`00_FACTORY_MANIFEST.md`](00_FACTORY_MANIFEST.md)
3. [`01_PROGRAM_BOARD.md`](01_PROGRAM_BOARD.md)
4. [`02_CAPABILITY_REGISTRY.md`](02_CAPABILITY_REGISTRY.md)
5. [`03_AGENT_AND_MODEL_POLICY.md`](03_AGENT_AND_MODEL_POLICY.md)
6. [`04_DEFINITION_OF_DONE.md`](04_DEFINITION_OF_DONE.md)
7. [`05_SECURITY_AND_SECRETS.md`](05_SECURITY_AND_SECRETS.md)
8. [`06_EXTRACTION_REPORT.md`](06_EXTRACTION_REPORT.md)
9. [`07_MIGRATION_STRATEGY.md`](07_MIGRATION_STRATEGY.md)
10. [`08_CODEX_RUNBOOK.md`](08_CODEX_RUNBOOK.md)
11. [`09_BACKLOG.md`](09_BACKLOG.md)
12. [`state.json`](state.json)

## Current Execution Order

```text
TASK-001 Canonical API Contract Reconciliation
TASK-002 Normalized Secret Registry
TASK-003 Quality Baseline Ledger
TASK-004 Entity Classification
    |
    v
TASK-005 Search POC Contract
    |
    v
TASK-006 Cloudflare Search Runtime
    |
    v
TASK-007 SDK and Reference UI
    |
    v
TASK-008 Independent Validation
```

## Rules

- Do not use chat history as the primary implementation source.
- Do not store secret values in this directory.
- Do not mark work complete without executable evidence.
- Do not deploy from this branch without an explicit release task.
- Update `state.json` after every integrated task.

## Current Status

Factory bootstrap is committed. Source extraction is sufficient to begin four parallel preparation tasks. Production migration has not started.