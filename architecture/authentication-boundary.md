# ABOS Core API v1 Authentication Boundary

## Accepted credential transports

Exactly one credential transport is accepted per request:

1. `Authorization: Bearer <opaque-credential>`
2. `X-ABOS-API-Key: <opaque-credential>`

The legacy `X-ABOS-Key` header is intentionally not accepted by the v1 boundary. It remains a legacy API concern and must not leak into generated SDKs or the public OpenAPI contract.

## Authentication and authorization

Authentication resolves an opaque credential to an internal principal. Authorization is then enforced by the Core API router using the operation's required ABOS scope.

```text
credential transport
  -> credential hash lookup
  -> active and expiry checks
  -> normalized principal scopes
  -> operation scope enforcement
```

## Security rules

- Requests containing both supported credential transports fail with `400 MULTIPLE_CREDENTIALS`.
- Unsupported authorization schemes fail with `401 INVALID_AUTHORIZATION_SCHEME`.
- Missing, expired, malformed, inactive, or oversized credentials fail without disclosing which condition matched.
- Raw credentials are never written to logs, errors, DTOs, or repository calls.
- The `listing:read` to `listings:read` alias exists only for migration of legacy credential records and is not part of the public contract.
