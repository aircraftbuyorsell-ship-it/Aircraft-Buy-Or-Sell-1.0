# Supabase Repository Adapter Readiness

## Inspection mode

This assessment is based on a read-only schema inspection of the connected `IntraZone` Supabase project. No SQL, migration, policy, row, or configuration change was executed.

## Current findings

- `public.aircraftbuyorsell_listings` has the closest listing-oriented shape but currently contains zero rows.
- `public.aircraft_cards` also contains zero rows and represents a private card/workflow model whose status and visibility vocabulary does not match the public Listing contract.
- `public.aircraft_passports` contains aircraft identity records, not authoritative marketplace listings.
- `public.faa_registry` is a large external-registry projection and must not be treated as a marketplace listing source.
- All inspected candidate tables have RLS enabled, but RLS alone does not establish ownership, field parity, freshness, or a safe Core API read path.

## Decision

Do not select a Supabase listing repository adapter yet. The Base44 adapter remains the only implemented listing read adapter until the following evidence exists:

1. approved authoritative table and ownership decision;
2. non-empty validated backfill;
3. field-parity mapping to canonical `AircraftListing`;
4. freshness and row-count reconciliation;
5. RLS and service-role access review;
6. cutover and rollback plan;
7. removal plan for the legacy authoritative write path.

A future Supabase aircraft-identity adapter may use `aircraft_passports` and approved registry projections, but it must not silently synthesize marketplace listings.
