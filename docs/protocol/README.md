# ABOS Protocol Documentation

Canonical protocol specifications for the ABOS platform. Imported here so GitHub is the actual
source of truth for the protocol design, per the goal stated in `factory/00_FACTORY_MANIFEST.md`
(branch `abos-factory/v1`): *"GitHub is the code source of truth. Cloudflare and Supabase are
managed runtime dependencies."*

None of this has been merged into any running code yet. These are design/specification
documents only.

## Hierarchy

Per `ABOS_Protocol_Suite_APS.pdf`:

```
Level 1  ABOS Vision
Level 2  ABOS Platform Specification        (ABOS_Platform_Specification_v1.0.pdf)
Level 3  ABOS Protocol Suite (APS)          (ABOS_Protocol_Suite_APS.pdf)
           APS-001 APL Specification         <- RFC-001 (this repo)
           APS-002 API Specification
           APS-003 Event Specification
           APS-004 ATI Specification
           APS-005 Knowledge Graph Specification
           APS-006 MCP Integration Specification
           APS-007 Security Specification
           APS-008 Aircraft Identity Specification
           APS-009 Agent Specification
           APS-010 Discovery Specification
           APS-011 SDK Specification
           APS-012 Certification Specification
Level 4  RFC Series                          (RFC-001.1 .. RFC-001.10 inside RFC-001)
Level 5  Reference Implementations
```

## Files in this directory

| File | What it is |
|---|---|
| `ABOS_Platform_Specification_v1.0.pdf` | Normative top-level spec: platform components, service boundaries, AI runtime, security, developer platform, appendices A–K (OpenAPI, JSON Schemas, APL Schemas, Event Catalog, Agent Catalog, MCP Tools, Error Catalog, Glossary, Reference Implementations, Security Guidelines, Conformance Test Suite) |
| `ABOS_Protocol_Suite_APS.pdf` | Breaks the platform into 12 independently-versioned protocol specs (APS-001..012), each with its own RFC series |
| `RFC-001_ABOS_Protocol_Language_APL_Core_Specification_v0.1.docx` | Full APL spec across 10 milestones: Vision, Agent Manifest, Identity Namespace, Capability & Permission, Audit & Transparency, Communication Protocol, Registry & Marketplace, Developer SDK, Security & Trust Framework, Reference Architecture |
| `apl_core_compact.min.json` | Machine-readable compact summary of APL Core (principles, identity format, permission model, autonomy levels A0–A4, trust levels T0–T4, audit levels A0–A3, error codes) |

## APL vs. ADL

The existing `factory/` branches (`abos-factory/v1`, `factory/task-001-contract-reconciliation`)
reference a capability delivery pipeline `Capability Definition -> APL Semantics -> ADL Data
Contract -> OpenAPI Contract -> ...` and list `apl.schema.json` / `adl.schema.json` as expected
capability-package files, but neither term was defined anywhere in those branches, and no schema
files exist yet.

**APL is now fully specified** by `RFC-001` above. **ADL was defined inline by the founder** (no
standalone RFC/APS document yet — sourced from a file called `ABOS Update and Next Steps.txt`,
not yet added to this repo):

**ADL = Agent Definition Language.** Machine-readable trust manifest for an agent, tool, workflow,
or service — declares what it is, what it can do, and under what conditions it's allowed to act.

| APL | ADL |
|---|---|
| Communication language | Definition & validation language |
| Describes the request — "what should happen?" | Describes the executor — "who is allowed to do it?" |
| Request/Response | Identity, capabilities, policy |

Minimal ADL manifest shape:

```yaml
adl_version: 1.0
id: abos.aircraft.search
type: tool
owner:
  organization: ABOS
capabilities:
  - search_aircraft
  - search_listings
permissions:
  - aircraft:read
  - listings:read
risk_level: low
requires_human_approval: false
supported_protocols:
  - apl/1.0
evidence:
  provenance: required
  confidence: required
status: verified
```

Governance flow combining both:

```
Agent -> APL Request -> ADL Validation -> Capability Check -> Permission Check
      -> Risk Policy -> Execution -> Evidence -> Audit Log
```

If `ABOS Update and Next Steps.txt` (or a standalone ADL RFC) becomes available, it should be
added to this directory and this section updated to point at it instead of this summary.

## Related, unmerged work

`factory/00_FACTORY_MANIFEST.md` and the rest of the `factory/*` files on branch
`abos-factory/v1` describe a matching migration plan (Base44 -> Cloudflare Pages/Workers +
Supabase) with its own 8-wave strangler strategy. That work is not merged into `main` or into
this branch — see the branch directly for its current state.
