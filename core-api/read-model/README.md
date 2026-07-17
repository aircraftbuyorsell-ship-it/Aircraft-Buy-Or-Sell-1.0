# Public listing read model gate

This directory defines the evidence required before `abos_public_listings_v1` may be used outside local integration tests. It intentionally contains no `CREATE VIEW`, grants, policies, or production writes because the checked-in source snapshot does not identify a Supabase listing relation.

## Confirmed source evidence

The supplied application snapshot defines Base44 `AircraftListing` fields and Base44 read rules (`visibility = public` or owner/admin). It does not contain a Supabase listing table, public IDs, location columns, or SQL migrations. Base44 RLS metadata is not proof of PostgreSQL RLS.

## Read boundary

The worker may request only the columns in `PUBLIC_LISTING_SELECT`. The read relation must return rows conforming to `public-listing-row.schema.json`, must expose only `active` and `public` listings, and must not expose registration, owner, email, source-table keys, raw JSON, or write metadata.

`location_*` fields are part of the proposed API read-row interface, not confirmed source columns. Region search remains blocked until an authorized source and transformation are documented.

## Public ID lifecycle

- Assign separate `lst_` and `ac_` identifiers once using 12 cryptographically random bytes.
- Persist IDs in a private mapping owned by the authorized sync process; enforce uniqueness and immutability.
- Never derive an identifier from, expose, or reuse a Base44/Supabase internal ID.
- Unpublishing a record removes it from the public relation but does not recycle its IDs.
- `source_record_id` is an external source identifier only. Emit `null` when none has been reviewed.

## Required acceptance evidence

1. Identify the authoritative listing source and exact source columns.
2. Identify the owner of the authorized sync and public-ID mapping writes.
3. Run `preflight.sql` read-only against the target environment and archive the result.
4. Prove the publishable role can select only the approved relation and cannot insert, update, delete, or access the private mapping/source tables.
5. Prove private, draft, and sold rows are invisible through an integration test using the publishable key.
6. Prove deterministic ordering/search and stable IDs across source updates.

Until all six gates pass, this read model is integration-only and deployment remains NO-GO.
