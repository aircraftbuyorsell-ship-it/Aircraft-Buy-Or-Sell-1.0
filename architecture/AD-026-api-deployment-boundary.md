# AD-026: ABOS API deployment boundary

## Decision

The public ABOS Core API is a path-based, OpenAPI-defined boundary behind a gateway. It does not expose Base44 entities, SDK types, function names, database schemas, or Base44 authentication behavior.

## First implementation

`gateway/cloudflare/src/index.js` is a non-deployed Cloudflare Worker scaffold. It accepts only the four canonical routes and forwards the original path, method, request ID, and caller credential to `abosCoreApiV1` using an internal shared secret. The Base44 function is an anti-corruption adapter, not the public contract.

## Consequences

- Existing `abosCoreApi` remains unchanged for the marketplace UI and legacy key management.
- Deployment needs a scoped Cloudflare token, confirmed production hostname, `ABOS_UPSTREAM_URL`, `ABOS_UPSTREAM_SHARED_SECRET`, `ABOS_GATEWAY_SHARED_SECRET`, CORS allowlist, and `ABOS_PUBLIC_ID_SALT`.
- No Worker, route, DNS, or Base44 deployment is performed by this change.
