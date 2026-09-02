# ABOS ADL/APL Protocol v1

Status: **reference specification**

ABOS already implements an APL/ADL governance layer in `gateway/src/apl.js`. This document formalizes that existing behavior as a portable protocol boundary rather than introducing a second runtime.

## 1. Separation of concerns

- **ADL — Agent Definition Language:** describes an executable capability: identity, skill, capabilities, permissions, autonomy, trust, risk, evidence requirements and tool schema.
- **APL — Agent Protocol Layer:** describes a request to invoke a capability and the governed response envelope, including evidence and audit metadata.
- **MCP:** transport/tool exposure below APL. MCP tool definitions are derived from ADL manifests.
- **LLM/agent:** chooses the next action; it does not become the source of truth.
- **Tool/executor:** performs the actual data operation.

The core invariant is:

> ADL defines **what an agent/tool is allowed to do**. APL defines **how that capability is invoked and governed**.

## 2. Governance flow

```text
APL Request
   -> ADL manifest lookup
   -> ADL validation
   -> capability check
   -> permission check
   -> risk / human-approval policy
   -> execution
   -> evidence envelope
   -> hash-chained audit event
   -> APL Response
```

A failed governance check returns an `APL_*` error and execution does not occur.

## 3. ADL manifest

Each executable capability has a stable `adl_version`, `id`, `apl_id`, owner, skill description, capabilities, permissions, autonomy, trust, audit level, risk level, approval requirement, supported protocol versions and evidence requirements.

The manifest also contains the MCP `name` and `inputSchema`. This makes the manifest the authoritative declaration of the tool surface.

Existing ABOS verified manifests include OMVM valuation, ATI scoring, Deal Radar, FAA Registry and Partner Status.

## 4. APL request

Minimal request:

```json
{
  "apl_version": "1.0",
  "tool": "abos_ati_score",
  "args": {
    "registration": "N38DV"
  }
}
```

The runtime resolves the tool to its ADL manifest. Callers must not be able to grant themselves capabilities or permissions by adding fields to the request.

## 5. APL response

Successful calls return:

```json
{
  "result": {
    "apl_version": "1.0",
    "agent": "apl://aviation.abos/aircraft/ati-agent/v1",
    "skill": "Aircraft Transparency Index v2.1",
    "payload": {},
    "evidence": {
      "provenance": {},
      "confidence": 0.96
    },
    "audit": {
      "event_id": "...",
      "current_hash": "...",
      "level": "APL-A2",
      "chained": true
    }
  }
}
```

The payload remains domain-specific. The protocol envelope is stable across domains.

## 6. Error model

Reserved governance errors:

- `APL_SKILL_NOT_FOUND`
- `APL_POLICY_BLOCKED`
- `APL_VERSION_ERROR`
- `APL_PERMISSION_DENIED`
- `APL_UPSTREAM_ERROR`

Governance errors must be distinguishable from upstream service failures.

## 7. Evidence and provenance

Capabilities that declare evidence as required must return an evidence envelope. Provenance should identify the source(s) used to produce the result. Confidence is explicit when the underlying capability provides it.

ABOS does not convert absence of evidence into a positive assertion. Domain handlers remain responsible for the semantics of their evidence.

## 8. Audit

Each successful governed execution emits a timestamped event with:

- event ID
- timestamp
- agent/capability ID
- action
- model disclosure when available
- input source names
- material output summary
- previous hash
- current hash
- audit level

The Cloudflare Worker persists the chain through the `ABOS_AUDIT` KV binding. If the binding is absent, the implementation reports `chained: false`; it must not represent the event as tamper-evident.

## 9. Security invariants

1. Deny-default actions remain unreachable through the gateway: payment execution, money transfer, ownership change, contract signing, registry modification and approval bypass.
2. Capabilities must be declared by the ADL manifest.
3. Permissions must be declared and belong to the allowed policy set.
4. High-risk autonomous execution is refused.
5. Human approval is explicit where a manifest requires it.
6. Caller-supplied arguments cannot modify the manifest's policy.
7. Audit degradation is visible rather than silently treated as secure.

## 10. Portability

The protocol is intentionally JSON/TypeScript friendly. It can be exposed through:

- ABOS Core API
- MCP
- Cloudflare Workers
- other agent runtimes
- internal enterprise automation systems

A future implementation may add additional transports without changing the ADL manifest or APL response contract.

## 11. Commercial positioning

ABOS should present this as a **domain-proven agent governance and evidence protocol**, not as a replacement for MCP. The reference implementation demonstrates the protocol on aircraft intelligence, verification, valuation and marketplace workflows.
