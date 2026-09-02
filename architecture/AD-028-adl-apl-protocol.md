# AD-028: Formal ADL/APL protocol boundary

Status: **proposed / implementation-aligned**

## Decision

Treat the existing `gateway/src/apl.js` implementation as the ABOS ADL/APL reference runtime and formalize its contracts under `protocol/`.

Do **not** create a second agent runtime, a second MCP layer, or a new programming language.

## Boundary

```text
ADL  = capability definition + policy metadata
APL  = governed invocation + response envelope
MCP  = tool transport/exposure below APL
Agent/LLM = planner/decision-maker, not source of truth
Executor = actual data/action implementation
Audit = evidence of governed execution
```

## Existing implementation mapping

| Protocol concept | Existing ABOS implementation |
|---|---|
| ADL manifests | `gateway/src/apl.js::ADL_MANIFESTS` |
| APL version | `APL_VERSION = '1.0'` |
| Capability check | `checkCapability()` |
| Permission policy | `checkPermissions()` + allow/deny defaults |
| Risk policy | `checkRisk()` |
| MCP tool derivation | `aplToolList()` |
| Tool dispatch | `callAplTool()` / `EXECUTORS` |
| Evidence envelope | `result.evidence` |
| Audit event | `writeAudit()` |
| Hash chain | `previous_hash` / `current_hash` via `ABOS_AUDIT` KV |

## Canonical schemas

- `protocol/schemas/adl-manifest.schema.json`
- `protocol/schemas/apl-request.schema.json`
- `protocol/schemas/apl-response.schema.json`

These schemas document the wire contract. Domain payloads remain owned by their respective ABOS capabilities.

## Why this is the minimum clean architecture

The repository already contains a working governed gateway and verified ADL manifests. Formalizing the contracts makes the capability portable to ABOS Core API, MCP clients, Cloudflare Workers and future enterprise integrations without duplicating execution logic.

## Security note

The `ABOS_AUDIT` KV binding remains part of the security boundary. If it is absent, the current runtime correctly reports that the hash chain is not persisted. Production release should fail closed or otherwise block claims of tamper-evident audit until persistent chaining is available.
