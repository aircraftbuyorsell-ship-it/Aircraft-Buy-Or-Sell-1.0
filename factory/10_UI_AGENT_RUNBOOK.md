# ABOS UI Agent Runbook

## Purpose

This runbook defines how UI and UX work is executed without Cowork or any other dedicated visual coding agent.

The default executor is a scoped Codex UI Agent working in an isolated branch or worktree. The Program Director owns task selection and integration order. A separate Tester and Validator review the result.

## Executor

### Codex UI Agent

Responsibilities:

- audit the current React UI;
- create and refactor presentation components;
- implement responsive layouts;
- implement loading, empty, partial, error, unauthorized and rate-limited states;
- implement keyboard and screen-reader behavior;
- create typed fixtures and Storybook-like isolated states when practical;
- produce screenshots or other visual evidence;
- write integration handoff notes.

The UI Agent is not a backend architect and must not define the public API contract.

## Architecture boundaries

The UI Agent MUST:

- consume approved SDK methods or an explicit adapter interface;
- keep business rules outside presentation components;
- keep aircraft identity separate from listing presentation state;
- preserve the legacy flow until the replacement passes validation;
- use typed fixtures only for unimplemented integrations;
- mark placeholder intelligence values clearly as fixture data;
- document every new route, component and dependency.

The UI Agent MUST NOT:

- invent endpoint paths, DTO fields, scopes or error codes;
- call Supabase directly from presentation components;
- embed provider keys, tokens or service-role credentials;
- change payment, valuation, ATI or authorization logic;
- remove working legacy functionality before an approved cutover;
- deploy to production;
- weaken lint, type or accessibility rules to make a task pass.

## Standard workflow

1. Read `AGENTS.md`, `factory/state.json`, the capability entry and the assigned GitHub Issue.
2. Create an isolated branch or worktree using `codex/ui-<task-id>-<slug>`.
3. Audit the existing route and reusable components before coding.
4. Write a short implementation plan inside the task branch.
5. Build presentation components against approved types or local typed fixtures.
6. Run build, focused type checks, lint checks and relevant UI tests.
7. Capture desktop, tablet and mobile evidence for the primary states.
8. Create a handoff note listing integration assumptions and unresolved contract dependencies.
9. Submit the branch for Tester review.
10. Submit the tested result for Validator review.

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

Use a standard coding model for implementation. Escalate to a high-reasoning model only for:

- cross-application navigation decisions;
- design-system architecture;
- accessibility conflicts;
- contract ambiguity;
- security-sensitive UI behavior.

Do not hardcode vendor-specific model names in repository logic. Runtime configuration maps logical model classes to available models.

## Definition of done

A UI task is complete only when:

- required states are implemented;
- desktop, tablet and mobile behavior is verified;
- keyboard navigation is verified;
- labels and focus behavior are accessible;
- no direct database or secret access exists in presentation code;
- build passes;
- new lint and type regressions are absent;
- integration assumptions are documented;
- Tester issues a pass;
- Validator confirms architecture and contract compliance.

## Current first task

`TASK-005` prepares Aircraft Search UI v2. Visual and component work can run in parallel with API contract reconciliation, but runtime integration remains blocked until `TASK-001` selects the canonical contract.

## Supersession

This runbook supersedes `factory/10_COWORK_RUNBOOK.md`. Cowork is not a required ABOS dependency.