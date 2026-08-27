TEST-LINE-1
  TEST-LINE-2
{"a": 1}
# ABOS Protocols

Versioned, portable protocol layer for the ABOS platform.

```
protocols/
  apl/          APL - ABOS Protocol Language (the request: "what should happen?")
    specification.md
    schemas/
  adl/          ADL - Agent Definition Language (the executor: "who may do it?")
    specification.md
    schemas/
    manifests/
  binding/      how an APL request is bound to an ADL manifest and decided
    governance-decision-model.md
```

## Why this directory exists

Until now the APL/ADL layer existed in two disconnected places:

- `docs/protocol/` - normative source documents (Platform Specification, Protocol
  Suite APS-001..012, RFC-001 APL Core, `apl_core_compact.min.json`).
- `gateway/src/apl.js` - a working implementation with five ADL manifests
  hard-coded inline.

Neither one is a contract. The specification is not machine-readable and the
implementation is not portable. `protocols/` is the contract: schemas that can be
validated in CI, manifests that can be loaded at runtime, and a decision model
that says exactly what ALLOW, DENY and APPROVAL_REQUIRED mean.

## Version

APL 1.0 / ADL 1.0. Version 1.0 was chosen deliberately to match what the running
gateway already declares (`APL_VERSION = '1.0'`, `adl_version: '1.0'`) rather than
opening a parallel 0.1 line that would immediately contradict production.

## Where each layer lives

| Layer | Home | Role |
|---|---|---|
| Specification, schemas, manifests | GitHub (`protocols/`) | source of truth, versioned, reviewable |
| Runtime enforcement | Cloudflare Worker (`gateway/`) | validates, decides, executes |
| State and evidence | Supabase / Cloudflare KV | identities, policy state, audit chain |

The protocol is owned by the repository, not by any runtime vendor.

## Status

Specification stage. Nothing in this directory is wired into `gateway/` yet. The
gateway still carries its own inline manifests; migrating it to load these files
is the next step, and is deliberately a separate change so the contract can be
reviewed before behaviour moves.

## The gap this layer must close

`gateway/src/index.js` serves two MCP paths. The legacy static-token path runs
through APL governance (`interceptApl`). The per-user `abos_live_...` path
(`handleCoreMcp`) is a direct passthrough to `abosCoreApi` - no manifest
validation, no capability or permission check, no hash-chained audit. All six
publicly advertised connector capabilities (`search`, `valuate`,
`extract_listing_intelligence`, `get_listing`, `list_listings`,
`create_listing`) currently travel that ungoverned path.

The manifests in `adl/manifests/` exist to close that gap.

## Open decisions

Two questions are recorded in the specifications as OPEN DECISION and are not
resolved here, because resolving them changes either running code or the
permission surface:

1. APL identity URI - the compact pack defines five segments
   (`namespace/domain/skill/agent/version`) but every `apl_id` in `gateway/src/apl.js`
   uses four. The schema currently accepts both.
2. `listing.create` - a write permission that is in neither the allow-default nor
   the deny-default set, so `create_listing` would be denied today. Its manifest
   ships as `status: draft` and grants nothing until that is decided.
