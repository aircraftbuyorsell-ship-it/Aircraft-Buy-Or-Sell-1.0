# APL / ADL Binding and Governance Decision Model

**Version 1.0**

How an APL request is bound to an ADL manifest, and what the runtime is allowed
to answer. This is the contract the reference runtime must satisfy; the order of
checks is normative.

## 1. Binding

A request is bound to exactly one manifest, resolved in this order:

1. `receiver` matches a manifest `apl_id`.
2. Otherwise, an MCP tool name matches a manifest `mcp.name`.

If neither resolves: `APL_SKILL_NOT_FOUND`. There is no default manifest and no
fallback executor. An unbound request is never executed.

## 2. Decision pipeline

```
APL Request
  |
  v
resolve manifest ............... APL_SKILL_NOT_FOUND
  |
  v
validate manifest .............. APL_POLICY_BLOCKED   (status not executable)
  (status, supported_protocols)   APL_VERSION_ERROR    (apl/1.0 not supported)
  |
  v
capability check ............... APL_PERMISSION_DENIED
  (intent in capabilities)
  |
  v
permission check ............... APL_POLICY_BLOCKED   (deny-default requested)
  (deny-default, then            APL_PERMISSION_DENIED (outside allow-default)
   allow-default)
  |
  v
risk policy .................... APPROVAL_REQUIRED
  (human approval, high+A4)      APL_POLICY_BLOCKED   (high risk at A4)
  |
  v
execute ........................ APL_EXECUTION_FAILED
  |
  v
evidence + audit (hash chain)
  |
  v
DECISION = ALLOW
```

## 3. Decisions

**ALLOW** - all checks passed, the skill ran, evidence and an audit event exist.

**DENY** - a check failed. The response carries the error code and enough detail
to tell the caller which rule refused, without leaking the policy set itself.

**APPROVAL_REQUIRED** - policy would allow this, but a human has not consented.
This is not an error and MUST NOT be reported as one. The reference implementation
currently collapses it into `APL_POLICY_BLOCKED`, so a client cannot tell
"never allowed" apart from "allowed once someone approves". Version 1.0 separates
them.

`human_approved` is only trustworthy when set by a surface that actually collected
consent. A calling agent asserting it about itself is not consent, and a runtime
MUST NOT accept it from an unauthenticated channel.

## 4. Ordering rules

The order is normative, not stylistic. Deny-default is evaluated before
allow-default so a manifest can never buy its way past a prohibited permission by
also declaring innocuous ones. Capability is checked before permission so the
error tells the caller the honest reason. Audit is written after execution but
before the response is returned, so nothing is ever answered off the record.

## 5. Audit

Every ALLOW writes one hash-chained event. Chaining requires persistent storage
for `previous_hash`; a stateless worker without it produces events that all link
to genesis, which is not tamper-evident. In that state the runtime MUST still
respond, MUST set `chained: false` and MUST include a warning. Silent degradation
of an audit trail is worse than no audit trail, because it looks like one.

DENY and APPROVAL_REQUIRED SHOULD also be recorded. A governance layer that only
logs what it permitted cannot answer the one question an auditor will ask, which
is what it refused.

## 6. Migration

The binding applies to both MCP paths in `gateway/src/index.js`. Today only the
legacy static-token path (`interceptApl`) is governed. `handleCoreMcp`, which
serves every per-user `abos_live_...` key and therefore the entire public
connector surface, bypasses all of it.

Suggested sequence:

1. Load `protocols/adl/manifests/` instead of the inline `ADL_MANIFESTS` array.
2. Validate the loaded manifests against the ADL schema in CI.
3. Route `handleCoreMcp` tool calls through the same decision pipeline.
4. Derive the MCP tool list and annotations from manifests on both paths.
5. Resolve the two open decisions (identity URI form, `listing.create`).

Steps 1-2 change no behaviour. Step 3 does, and should ship behind a flag with the
audit warning visible before it becomes the default.
