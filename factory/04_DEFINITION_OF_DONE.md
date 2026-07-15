# ABOS Definition of Done

## Task-Level Definition of Done

A task is complete only when all applicable requirements are satisfied.

### Scope

- The implementation matches the task acceptance criteria.
- Only allowed files were changed, or scope expansion is documented and approved.
- No unrelated refactor is mixed into the task.

### Contract

- OpenAPI, APL and ADL artifacts are updated when external behavior changes.
- Request and response examples reflect executable behavior.
- Breaking changes are explicit and reviewed.
- SDK and MCP mappings are regenerated or confirmed unchanged.

### Security

- No secret value is committed.
- Server-only credentials remain server-side.
- Authentication and authorization are enforced at the trusted boundary.
- Privileged Supabase access is not exposed to client code.
- Logs and errors do not disclose credentials or sensitive payloads.

### Quality

- Relevant unit and integration tests pass.
- `npm run build` passes for frontend-affecting work.
- `npm run lint` and `npm run typecheck` introduce no new failures.
- Existing baseline failures are listed separately from regressions.
- Error handling is deterministic and testable.

### Migration

- Current behavior and target behavior are documented.
- Rollback or coexistence strategy exists.
- Data ownership and synchronization behavior are explicit.
- Legacy code is not deleted before the replacement is verified.

### Evidence

- Tester provides commands and results.
- Validator provides a gate decision.
- Security review is attached when required by risk classification.
- Program state and capability state are updated.

## Capability-Level Definition of Done

A capability reaches `Platform` state only when:

1. capability semantics are documented;
2. canonical data contract is versioned;
3. public/partner API contract is valid;
4. runtime implementation runs outside Base44;
5. Supabase access follows approved authorization and RLS rules;
6. JavaScript SDK support exists;
7. Python SDK support exists when the capability is externally reusable;
8. MCP mapping exists when agent use is approved;
9. tests cover success, authorization, invalid input and failure behavior;
10. observability includes request IDs and actionable errors;
11. a reference UI or example client proves usability;
12. migration and rollback procedures are tested;
13. security and release gates issue `GO`.

## Release Decisions

- `GO`: all mandatory gates pass.
- `CONDITIONAL GO`: non-critical limitations are explicit, bounded and accepted.
- `NO-GO`: a mandatory contract, security, data, quality or operational gate fails.

A `CONDITIONAL GO` must have an owner, expiry date and follow-up task.