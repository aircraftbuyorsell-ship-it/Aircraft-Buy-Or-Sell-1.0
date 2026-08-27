# Proposed route and component structure

## Route

Propose `/search-v2` as a parallel, feature-flagged non-production route. Do not replace or redirect `/listings` and do not change `GlobalSearch` during Mode A.

```text
host App router
└── /search-v2 (approved feature flag)
    └── AircraftSearchV2Route
        └── AircraftSearchV2
            ├── SearchBar (shared ABOS pattern)
            ├── StructuredFilters (secondary mode)
            ├── SearchFeedback
            └── SearchResultCard[]
```

## Boundaries

| Layer | Responsibility | Forbidden |
|---|---|---|
| Host route | Feature flag, adapter creation, navigation callback | Removing legacy route; embedding credentials |
| `AircraftSearchAdapter` | Approved search operation boundary | Exposing transport/storage to components |
| Search model | Request validation, fixture-only proposed structured-query composition, deterministic view-state mapping | Network and React concerns |
| Page controller | Cancellation, submitting, pagination, state orchestration | DTO invention, direct database access |
| Presentation | Layout, labels, keyboard/native behavior, approved-field rendering | Base44/Supabase/SDK calls; business rules |

## Mode-B adapter

When the generated SDK is approved, a host-owned adapter may delegate its `search(request, {signal})` method to the approved SDK `searchListings` operation. This package intentionally does not specify transport setup or an endpoint string. Authorization stays at the trusted API/SDK boundary.

The Mode-A page always shows its typed-fixture disclosure and fixture intelligence labels. Unauthorized and forbidden actions are optional host callbacks; the package does not collect or store credentials. Pagination failures preserve rendered results and retry the exact failed cursor request.

## Rollback/coexistence

- Disable the v2 feature flag or remove only the parallel route registration.
- No legacy file, DTO or database record is changed.
- Fixture mode is never a silent live fallback; it displays a persistent notice.
