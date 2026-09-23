# ABOS Widget Gateway V2

Clean replacement path for the legacy `abos-widget-gateway`.

## Design rule

V2 never performs direct Supabase aircraft lookup and never generates the legacy federated SQL pattern:

- `upper(trim(...))`
- `UNION ALL` across FAA / passport / listing / OpenSky tables

Aircraft lookup is delegated to `abosCoreApiV1`, whose current registration path uses indexed equality predicates.

## Endpoints

- `GET /health`
- `POST /aircraft/lookup` with `{"registration":"N7692J"}`
- `POST /mcp` with the minimal `lookup_aircraft` MCP tool

## Required Cloudflare secret

`ABOS_GATEWAY_SHARED_SECRET` must match the Base44 function secret used by `abosCoreApiV1`.

## Smoke test

1. Deploy V2 to a new Worker name.
2. Set the required secret.
3. Call `GET /health`.
4. Call `POST /aircraft/lookup` for `N7692J`.
5. Compare Supabase `pg_stat_statements` before/after.
6. Confirm queryid `4536891731605513921` remains at its historical call count.

Do not switch the production MCP URL until the V2 smoke test is clean.
