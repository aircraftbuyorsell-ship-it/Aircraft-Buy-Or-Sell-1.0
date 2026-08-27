# APL - ABOS Protocol Language

**Version 1.0** | Status: Draft | Supersedes: nothing (first machine-readable release)

APL is a semantic trust and communication protocol layer for AI skills and
aviation intelligence. It is not a programming language and not a model.

Source documents: RFC-001 (APL Core Specification), `docs/protocol/apl_core_compact.min.json`.
Reference implementation: `gateway/src/apl.js` (`APL_VERSION = '1.0'`).

## 1. Position in the stack

```
APL      identity, skill, permission, trust, audit, communication
MCP      tool / data access
OpenAPI  technical contract and endpoints
Base44   UI, workflow, app builder
```

MCP sits UNDER APL. A tool MUST NOT be exposed over MCP unless an ADL manifest
declares what it is, what it may do and at what risk level. The MCP tool list is
derived from manifests, never hand-written.

## 2. Principles

aircraft_first, skill_first_model_second, least_privilege, zero_trust_ai,
human_oversight, full_auditability.

## 3. Identity

```
apl://<namespace>/<domain>/<skill>/<agent>/<version>
```

ABOS namespace: `apl://aviation.abos`.
Domains: aircraft, valuation, maintenance, compliance, finance, insurance, marketplace.

> **OPEN DECISION (APL-1.0-D1).** The compact pack defines five segments, but every
> `apl_id` in `gateway/src/apl.js` uses four - the `skill` segment is absent
> (`apl://aviation.abos/valuation/omvm-agent/v1`). Until this is resolved the schema
> accepts both the four- and five-segment form. Resolution requires either relaxing
> the spec permanently or rewriting five identifiers in the gateway.

## 4. Request message

Fields: `apl_version`, `message_id`, `sender`, `receiver`, `intent`, `context`,
`security`, `payload`. Schema: `schemas/apl-request-1.0.schema.json`.

```json
{
  "apl_version": "1.0",
  "message_id": "4f1c...",
  "sender": "agent:buyer-assistant",
  "receiver": "apl://aviation.abos/valuation/omvm-agent/v1",
  "intent": "value_aircraft",
  "context": { "channel": "mcp", "human_approved": false },
  "payload": { "registration": "N758QV", "make": "Cessna", "model": "R172K", "year": 1979 }
}
```

`intent` MUST match one entry in the target manifest's `capabilities`. A request
without `intent` is a tool-level call and the capability is implied by the manifest.

## 5. Response envelope

Every successful response carries evidence and audit. Schema:
`schemas/apl-response-1.0.schema.json`.

```json
{
  "apl_version": "1.0",
  "agent": "apl://aviation.abos/valuation/omvm-agent/v1",
  "skill": "Open Market Value Model v5.1",
  "payload": { },
  "evidence": { "provenance": { }, "confidence": 0.0 },
  "audit": { "event_id": "...", "current_hash": "...", "level": "APL-A2", "chained": true }
}
```

When the audit store is unavailable the response MUST still be returned with
`chained: false` and an explicit `warning`. Degradation is reported, never hidden.

## 6. Permission model

Capability says what an agent CAN do. Permission says what it MAY do in this
context. Scope is ACTION + RESOURCE + CONDITION.

Allow-default: `aircraft.read`, `market.analyze`, `models.compare`, `report.create`,
`recommendation.generate`, `documentation.verify`, `audit.log`, `partner.read`.

Deny-default: `payment.execute`, `money.transfer`, `ownership.change`,
`contract.sign`, `registry.modify`, `approval.bypass`. These are unreachable
regardless of manifest content and require explicit human approval plus legal
implementation before they can ever be enabled.

A permission in neither set is DENIED. This is deliberate: the default answer to
an undeclared permission is no.

> **OPEN DECISION (APL-1.0-D2).** `listing.create` is required by the `create_listing`
> capability and appears in neither set, so that capability would be denied the moment
> governance is enforced on the Core API path. It must be either added to allow-default
> (with a risk level and an approval requirement) or explicitly denied.

## 7. Autonomy, trust, audit levels

| Autonomy | | Trust | | Audit | |
|---|---|---|---|---|---|
| A0 | informational | APL-T0 | unverified | APL-A0 | basic |
| A1 | analytical | APL-T1 | registered | APL-A1 | operational |
| A2 | advisory | APL-T2 | verified | APL-A2 | decision |
| A3 | operational | APL-T3 | certified | APL-A3 | regulated |
| A4 | autonomous | APL-T4 | regulated | | |

A skill with `risk_level: high` MUST NOT run at autonomy A4.

## 8. Audit events

Fields: `event_id`, `timestamp`, `agent_id`, `action`, `model`, `input_sources`,
`output`, `previous_hash`, `current_hash`. Version 1.0 adds `audit_level`, which the
reference implementation already emits.

`current_hash` = SHA-256 over
`event_id|timestamp|agent_id|action|JSON(output)|previous_hash`. The chain is only
meaningful if `previous_hash` survives between requests, which requires persistent
storage (today the `ABOS_AUDIT` KV binding).

## 9. Errors

| Code | Meaning |
|---|---|
| `APL_AUTH_FAILED` | caller identity could not be established |
| `APL_PERMISSION_DENIED` | capability or permission not granted |
| `APL_SKILL_NOT_FOUND` | no ADL manifest resolves the target |
| `APL_VERSION_ERROR` | manifest does not support the requested APL version |
| `APL_POLICY_BLOCKED` | a policy rule refused the request |
| `APL_EXECUTION_FAILED` | policy allowed it, execution failed (new in 1.0) |

`APL_EXECUTION_FAILED` is added because the reference implementation currently
returns `APL_POLICY_BLOCKED` for handler exceptions, which is untrue - no policy
blocked anything - and makes governance failures indistinguishable from outages.

## 10. Conformance

An implementation conforms to APL 1.0 if it validates every request against the
request schema, resolves an ADL manifest before execution, applies the checks in
`../binding/governance-decision-model.md` in the stated order, returns the response
envelope with evidence, and writes a hash-chained audit event for every ALLOW.
