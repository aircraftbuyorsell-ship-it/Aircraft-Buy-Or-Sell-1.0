# ABOS Agent Operating Model and Model Routing Policy

## Core Units

The Factory uses four permanent control roles and a dynamic builder pool.

### 1. Program Director

Responsibilities:

- select the next unblocked task;
- preserve program architecture and priorities;
- create, suspend or close builder tasks;
- decide whether a task requires human approval;
- review tester and validator outputs;
- authorize integration only after gates pass.

The Program Director does not perform large implementation tasks when a builder can own them independently.

### 2. Builder

A temporary agent created for one bounded task.

Responsibilities:

- change only allowed files;
- implement acceptance criteria;
- add or update tests;
- document assumptions and residual risk;
- stop when scope or contract is ambiguous.

The builder exits after handing off a commit or patch and completion evidence.

### 3. Tester

Independent from the builder.

Responsibilities:

- test behavior, edge cases and regressions;
- distinguish baseline failures from new failures;
- produce reproducible commands and results;
- never approve architecture.

### 4. Validator

Independent from the builder.

Responsibilities:

- verify APL, ADL, OpenAPI and architecture alignment;
- review acceptance criteria and migration safety;
- issue `GO`, `CONDITIONAL GO` or `NO-GO`;
- require a new task for unresolved defects.

### On-Demand Roles

- `Security Reviewer`: auth, permissions, secrets, injection and data exposure.
- `Integrator`: cumulative merge, conflict and release-gate verification.
- `Knowledge Curator`: updates decisions, contracts and machine-readable state.
- `UI Builder`: builds presentation components against approved SDK contracts.

## Lifecycle

```text
Program Director creates task
  -> Builder implements
  -> Tester executes independent tests
  -> Validator checks architecture and acceptance criteria
  -> Security Reviewer runs when risk classification requires it
  -> Integrator confirms cumulative gates
  -> Program Director closes task and selects next work
```

## Concurrency Rules

Parallel work is allowed only when task write sets do not overlap or an explicit integration owner is assigned.

Never assign multiple agents to independently rewrite the same contract, schema, migration or authentication boundary.

## Model Routing

Model names vary by tool availability. Route by risk and task shape, not brand preference.

| Task class | Reasoning tier | Expected execution |
|---|---|---|
| Architecture, auth, payments, data cutover, release gate | Highest available reasoning | Deliberate review, low concurrency |
| OpenAPI and schema design | High reasoning | Contract-first, validator required |
| Standard implementation from approved task | Coding-optimized model | Bounded builder task |
| Test creation and regression execution | Coding-optimized or standard model | Independent tester |
| UI copy and design-system composition | UI/copy-optimized model | Must consume approved contracts |
| Formatting, inventory and deterministic transformations | Low-cost model or scripts | No architectural decisions |
| Security review | Security-specialized workflow plus high reasoning | Independent from builder |

## Context Routing

No agent receives the entire project history by default.

Minimum context package:

1. `AGENTS.md`;
2. relevant task file;
3. relevant capability registry entry;
4. approved contract/schema files;
5. directly affected source files;
6. relevant security and migration notes.

Historical chats, unrelated RFCs and broad design documents are loaded only when a concrete ambiguity requires them.

## Token and Cost Controls

- Prefer scripts for inventory, formatting and mechanical transformations.
- Reuse stable summaries rather than replaying long discussion history.
- End a temporary agent after its bounded task.
- Do not ask a high-reasoning model to perform bulk boilerplate when a coding model can follow an approved specification.
- Do not run duplicate reviewers unless the task affects production auth, payments, secrets, data cutover or public contract compatibility.

## Escalation Triggers

Immediate Program Director review is required for:

- public API breaking changes;
- credential lifecycle changes;
- production database migrations;
- Stripe webhook or entitlement changes;
- RLS or authorization changes;
- AI output semantics used in commercial decisions;
- production deployment or DNS changes.