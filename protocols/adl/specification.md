# ADL - Agent Definition Language

**Version 1.0** | Status: Draft

ADL is the machine-readable trust manifest for an agent, tool, workflow or
service. It declares what the thing is, what it can do, and under what conditions
it is allowed to act.

| APL | ADL |
|---|---|
| communication language | definition and validation language |
| describes the request - "what should happen?" | describes the executor - "who is allowed to do it?" |
| request / response | identity, capabilities, policy |

Schema: `schemas/adl-manifest-1.0.schema.json`. Manifests: `manifests/`.

## 1. Naming

> ADL in this repository means **Agent Definition Language** and nothing else.
> The ABOS *Architecture Decision Log* previously carried the identifier
> `ABOS-ADL-1.0` in the platform PDFs. That document should be renamed to
> **ADR Log** so a single abbreviation does not denote two unrelated artefacts.
> No code in this repository depends on the old meaning.

## 2. Required fields

`adl_version`, `id`, `apl_id`, `type`, `owner`, `skill`, `description`,
`capabilities`, `permissions`, `autonomy`, `trust`, `audit`, `risk_level`,
`requires_human_approval`, `supported_protocols`, `evidence`, `status`.

Optional: `mcp` (how the capability is exposed to MCP clients) and `execution`
(which executor the runtime binds it to).

## 3. Field semantics

**id** - stable ADL identifier, `abos.<area>.<thing>`. Never reused after revocation.

**apl_id** - the APL identity this manifest governs. One manifest governs exactly
one identity.

**type** - `agent` | `tool` | `workflow` | `service`.

**capabilities** - what the executor CAN do. An APL `intent` must match one of
these or the request is denied.

**permissions** - what it MAY do, checked against the APL allow-default and
deny-default sets. Anything in neither set is denied.

**autonomy** - A0 informational, A1 analytical, A2 advisory, A3 operational,
A4 autonomous. Declares how far the executor may act without a human.

**trust** - APL-T0 unverified through APL-T4 regulated. A manifest with
`status: verified` MUST be at least APL-T2.

**audit** - APL-A0 basic through APL-A3 regulated. Sets the audit level written
into every event.

**risk_level** - `low` | `medium` | `high`. A high-risk skill MUST NOT run at A4.

**requires_human_approval** - when true the runtime returns APPROVAL_REQUIRED
unless the request context carries `human_approved: true` from a surface that
actually collected consent.

**evidence** - whether provenance and confidence are `required`, `optional` or
`none`. When required, the response envelope must carry the field even if the
value is null; a null means the skill could not establish it, which is itself an
auditable answer.

**status** - `draft` | `registered` | `verified` | `certified` | `revoked`.
Only `verified` and `certified` manifests are executable. `draft` manifests are
published for review and grant nothing.

## 4. Manifests in this release

Five manifests already exist inline in `gateway/src/apl.js` and are governed today:
`abos.valuation.omvm`, `abos.aircraft.ati`, `abos.market.dealradar`,
`abos.registry.faa`, `abos.partner.status`. They are intentionally NOT duplicated
here yet - extracting them is a code change and belongs in the migration commit, not
in the contract commit.

Six manifests are new and cover the Core API surface that is currently exposed
without any governance at all (`handleCoreMcp` in `gateway/src/index.js` is a direct
passthrough to `abosCoreApi`):

| Manifest | MCP tool | Core endpoint | Risk | Status |
|---|---|---|---|---|
| `abos.marketplace.search` | `search` | `search` | low | verified |
| `abos.valuation.core` | `valuate` | `valuate` | low | verified |
| `abos.intelligence.extract` | `extract_listing_intelligence` | `intelligence.extract` | low | verified |
| `abos.marketplace.listing_get` | `get_listing` | `listings.get` | low | verified |
| `abos.marketplace.listing_list` | `list_listings` | `listings.list` | low | verified |
| `abos.marketplace.listing_create` | `create_listing` | `listings.create` | medium | **draft** |

## 5. Read/write honesty

All six Core tools currently declare `readOnlyHint: false`, including `search`,
`get_listing` and `list_listings`, which only read. Under ADL 1.0 the MCP
annotations are derived from the manifest rather than hand-written, so a read-only
capability advertises itself as read-only and only `create_listing` is marked as
writing. Telling a client that everything might write is not conservative - it is
noise that hides the one call that actually does.

## 6. Conformance

A manifest conforms if it validates against `schemas/adl-manifest-1.0.schema.json`,
declares at least one capability and one permission, supports `apl/1.0`, and does
not request a deny-default permission.
