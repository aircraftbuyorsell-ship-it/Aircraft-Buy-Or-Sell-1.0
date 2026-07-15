# ABOS Cowork Runbook

## Purpose

Cowork is the UI and interaction-design execution lane for ABOS. It translates approved capabilities, API contracts and design references into implementation-ready interface work without owning business logic, data authority or production deployment.

## Scope

Cowork may:

- audit the existing Base44 user interface;
- extract reusable visual patterns and interaction rules;
- define the ABOS design system and responsive layout rules;
- create or refactor React presentation components;
- prepare desktop, tablet and mobile interface variants;
- implement loading, empty, error and permission states;
- connect approved SDK interfaces through adapters supplied by Codex;
- produce screenshots, interaction notes and accessibility evidence.

Cowork must not:

- invent new API endpoints or DTO fields;
- move business logic into UI components;
- access production secrets;
- write directly to Supabase from presentation code;
- change authentication, authorization, payments or valuation logic;
- deploy to production;
- replace an approved API contract with a UI-specific contract.

## Operating Boundary

```text
Approved Capability Contract
        |
        v
SDK / UI Adapter supplied by Codex
        |
        v
Cowork UI implementation
        |
        v
Visual, responsive and accessibility validation
```

The OpenAPI contract remains the API source of truth. The ABOS SDK remains the preferred client boundary. Cowork consumes typed interfaces and does not redefine them.

## Branch and Task Policy

- Branch prefix: `cowork/`
- One capability or bounded UI surface per branch.
- Every branch must reference one GitHub issue.
- No direct writes to `main`.
- No direct writes to `abos-factory/v1` except approved documentation updates.
- UI work blocked by unresolved contracts must use typed fixtures and clearly marked adapters.

Example:

```text
cowork/task-005-aircraft-search-ui-v2
```

## Required Inputs

Before implementation, Cowork must receive:

1. capability objective;
2. approved user journeys;
3. OpenAPI or typed SDK interface;
4. permission states;
5. loading, empty and error behavior;
6. desktop and mobile acceptance criteria;
7. approved brand and visual references;
8. explicit legacy behavior that must remain available.

## Required Outputs

Each Cowork task must deliver:

- component and route inventory;
- implementation or editable design artifact;
- responsive behavior at desktop, tablet and mobile widths;
- loading, empty, error and unauthorized states;
- keyboard and screen-reader considerations;
- screenshot evidence for primary states;
- handoff notes for Codex integration;
- list of unresolved contract dependencies;
- no-regression confirmation for preserved legacy flows.

## First Vertical Slice: Aircraft Search

Cowork prepares the new Aircraft Search interface while TASK-001 reconciles the canonical API contract.

Allowed before TASK-001 completion:

- information architecture;
- responsive layouts;
- design-system primitives;
- typed fixtures;
- visual states;
- interaction prototype;
- adapter interface definition without runtime assumptions.

Blocked until TASK-001 completion:

- final runtime integration;
- production search requests;
- final error mapping;
- SDK method binding;
- removal of the legacy search interface.

## Definition of Done

A Cowork task is complete only when:

- the UI consumes an approved typed boundary;
- no business logic is duplicated in the frontend;
- all required states are implemented;
- desktop and mobile layouts are verified;
- accessibility checks are documented;
- Codex can integrate the result without redesigning the interface;
- Tester verifies behavior;
- Validator confirms contract and architecture compliance.

## Handoff Protocol

```text
Program Director
  -> assigns bounded UI task
Cowork
  -> produces UI implementation and evidence
Codex
  -> connects approved SDK adapter and resolves code integration
Tester
  -> executes functional and responsive tests
Validator
  -> checks architecture, contract and release compliance
```

Cowork is therefore a parallel production lane, not a replacement for Codex. Cowork owns the interface; Codex owns application integration and runtime correctness.