# ABOS Core API request flow

```text
Client
  -> Cloudflare Worker gateway (not deployed)
  -> abosCoreApiV1 anti-corruption boundary
  -> authentication, scope, request-id, audit and rate-limit hooks
  -> application route handler
  -> Base44 listing adapter (current) or Supabase repository (future)
  -> public ABOS DTO
```

The gateway forwards only canonical path and method metadata. The function rejects direct calls that do not carry the configured gateway secret. API responses never return Base44 entity names, database structures, credentials, or internal identifiers.
