# TASK-005 Aircraft Search UI v2

Local Mode-A implementation package for issue #9. It provides a typed fixture contract, an injected search adapter boundary, responsive React presentation components, state coverage and integration notes without modifying the legacy application.

## Contract boundary

- Contract: TASK-001 `POST /api/v1/search`, `SearchRequest`, `SearchResponse`.
- UI sends only `query`, `page_size` and `cursor`.
- Structured controls demonstrate proposed fixture-only query composition; they are not approved search semantics or new API fields.
- Components receive `AircraftSearchAdapter`; they contain no endpoint, SDK transport, Base44 or Supabase access.
- Fixture intelligence is visibly marked as fixture-only and carries contract-approved limitations.

## Proposed host integration

1. Import `search-v2.css` once in the host.
2. Mount `AircraftSearchV2Route` at the parallel, non-production `/search-v2` route behind an approved feature flag and pass an explicit image-host allowlist if images are enabled.
3. Inject `FixtureAircraftSearchAdapter` in Mode A.
4. Mode A disclosure and card labels are unconditional. A future Mode-B task must deliberately revise this package when an approved generated-SDK adapter exists.
5. Keep `/listings`, `GlobalSearch` and registry lookup unchanged until cutover approval.

No route or host application file is modified by this package.

## Validate

```sh
npm install
npm test
```

The contract test dereferences the sibling TASK-001 OpenAPI artifact and verifies all response fixtures against the canonical schema and pinned hash.
