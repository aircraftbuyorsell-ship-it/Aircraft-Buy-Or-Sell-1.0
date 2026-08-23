# AD-027: Authoritative operational data store

## Decision

Supabase PostgreSQL is the intended authoritative operational store for migrated ABOS Core domains. This repository does not prove that aircraft, listings, API credentials, or payment projections have already migrated.

## Current state

- The marketplace code directly uses Base44 `AircraftListing`; it remains authoritative for listings.
- Supabase contains an RLS-protected `aircraftbuyorsell_listings` table and FAA-related tables, but the current write path and cutover status require verification.
- Stripe remains authoritative for payment state. Local records are projections only.

## Migration rule

Each domain has exactly one authoritative store. No bidirectional or uncontrolled dual writes may be introduced. The concrete status is recorded in `architecture/data-ownership-registry.yaml`.
