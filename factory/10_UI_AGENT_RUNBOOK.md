# ABOS UI Delivery Runbook

## Purpose

This runbook defines the approved hybrid workflow for UI and UX delivery when Fable 5 is available inside Base44.

Fable 5 is the primary visual builder for Base44 pages and components. Codex remains the repository, architecture, contract, testing and integration authority. The Program Director owns task selection and integration order. A separate Tester and Validator review the result.

## Executors

### Base44 Fable 5 — UI Builder

Responsibilities:

- audit the current Base44 page and visual hierarchy;
- create or refine presentation components;
- implement desktop, tablet and mobile layouts;
- implement loading, empty, partial, error, unauthorized and rate-limited states;
- improve interaction clarity and accessibility;
- reuse the approved ABOS design system and shared search patterns;
- work with typed fixtures when the canonical API is not ready;
- produce a clear summary of changed pages and components.

Fable 5 is not the API architect and must not define public contracts, database schemas, permissions or business rules.

### Codex — Repository and Integration Authority

Responsibilities:

- prepare task constraints, approved types and fixture contracts for Fable 5;
- inspect every resulting code diff;
- move business logic out of presentation components;
- connect the approved SDK or adapter interface;
- remove duplicated or unsafe generated code;
- add or repair tests;
- verify build, lint, type and accessibility behavior;
- prepare the integration pull request;
- preserve the legacy flow until cutover approval.

## Architecture boundaries

Fable 5 and Codex MUST:

- consume approved SDK methods or an explicit adapter interface;
- keep business rules outside presentation components;
- keep Aircraft identity separate from AircraftListing presentation state;
- preserve the legacy route until the replacement passes validation;
- use typed fixtures only for unimplemented integrations;
- mark placeholder intelligence values clearly as fixture data;
- document every new route, component and dependency.

They MUST NOT:

- invent endpoint paths, DTO fields, scopes or error codes;
- call Supabase directly from presentation components;
- embed provider keys, tokens or service-role credentials;
- change payment, valuation, ATI or authorization logic inside UI work;
- remove working legacy functionality before an approved cutover;
- deploy to production from an implementation task;
- weaken lint, type or accessibility rules merely to pass checks.

## Delivery modes

### Mode A — Visual Draft

Use while the canonical API contract is unresolved.

Allowed:

- layout and visual hierarchy;
- navigation and component structure;
- responsive behavior;
- interaction states;
- accessibility behavior;
- typed fixtures based only on explicitly approved fields;
- parallel UI route behind a feature flag or non-production path.

Blocked:

- live API wiring;
- new DTO assumptions;
- direct database access;
- replacement of the legacy production flow.

### Mode B — Contract Integration

Use only after the canonical contract and SDK adapter are approved.

Codex replaces fixtures with approved client calls, verifies error mapping, adds contract tests and submits the integrated result to Tester and Validator.

## Standard workflow

1. Program Director creates a GitHub Issue with scope, constraints and acceptance criteria.
2. Codex reads `AGENTS.md`, `factory/state.json`, the capability entry and the assigned Issue.
3. Codex prepares the minimal approved UI data contract or typed fixture interface.
4. Fable 5 performs the Base44 UI work without changing API or data architecture.
5. Resulting Base44 code changes are captured in the task branch through the configured repository workflow.
6. Codex reviews the complete diff and repairs architecture, typing, data access and component boundaries.
7. Codex runs build, focused type checks, lint checks and relevant UI tests.
8. Desktop, tablet and mobile evidence is captured for the primary states.
9. Tester verifies responsive, interaction and regression behavior.
10. Validator confirms contract, architecture and security compliance.
11. Only an approved integration PR may be merged.

## Branch convention

Use:

`base44/fable-<task-id>-<slug>`

Codex may create a separate integration branch when substantial cleanup is required:

`codex/integrate-<task-id>-<slug>`

## Required UI states

Every user-facing capability must consider:

- initial;
- loading;
- success;
- empty;
- partial data;
- recoverable error;
- non-recoverable error;
- unauthorized;
- forbidden;
- rate limited;
- offline or network failure when relevant.

## Model routing

Fable 5 is preferred for Base44 visual construction and page-level UI iteration.

Codex is preferred for:

- code architecture;
- repository-wide refactoring;
- SDK integration;
- contract enforcement;
- tests;
- security review;
- release preparation.

Escalate to a high-reasoning model only for cross-application navigation, design-system architecture, accessibility conflicts, contract ambiguity or security-sensitive behavior.

Model names are operational configuration, not public API or domain logic.

## Definition of done

A UI task is complete only when:

- required states are implemented;
- desktop, tablet and mobile behavior is verified;
- keyboard navigation is verified;
- labels and focus behavior are accessible;
- no direct database or secret access exists in presentation code;
- business logic is outside presentation components;
- build passes;
- new lint and type regressions are absent;
- integration assumptions are documented;
- Tester issues a pass;
- Validator confirms architecture and contract compliance.

## Current first task

`TASK-005` prepares Aircraft Search UI v2. Fable 5 may begin Mode A immediately in Base44. Live SDK/API integration remains blocked until `TASK-001` selects the canonical contract.

## Supersession

This runbook supersedes both the Cowork-only workflow and the Codex-only UI workflow. Cowork is not a required ABOS dependency.