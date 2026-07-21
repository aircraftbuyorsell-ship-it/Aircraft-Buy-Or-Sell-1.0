# ABOS Core API v1 Repository Port Contract

## Purpose

The Core API must not depend on Base44 entity shapes, Supabase table layouts, or SDK-specific records. Persistence implementations are adapters behind stable repository ports.

## Listing repository

```javascript
listingRepository.search({ intent, limit, cursor })
listingRepository.getByPublicId(listingId)
```

The repository returns canonical public `AircraftListing` DTOs. It must not expose internal database IDs, private records, unpublished records, credentials, or backend metadata.

## Aircraft repository

```javascript
aircraftRepository.getByPublicId(aircraftId)
```

The repository returns a canonical public `Aircraft` DTO or `null`.

## Implementation rules

1. A repository implementation performs backend-specific retrieval and mapping.
2. The Core API router performs HTTP validation, authentication, authorization, routing, and response handling.
3. Backend records never cross the repository boundary.
4. Each domain has exactly one authoritative write store during migration.
5. A Supabase adapter may replace the Base44 adapter without changing the OpenAPI contract or router behavior.
6. Repository implementations must be covered by adapter contract tests before they can be selected by the composition root.
