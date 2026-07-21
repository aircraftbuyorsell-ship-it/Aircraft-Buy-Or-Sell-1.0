# ABOS Core API migration strategy

1. Keep legacy Base44 flows operational.
2. Serve new public reads through `abosCoreApiV1` and public DTOs only.
3. Before migrating a domain, add a reviewed Supabase migration, backfill plan, idempotent one-way synchronization, validation query, cutover plan, rollback plan, ownership-registry update, and a removal plan for legacy writes.
4. Do not apply a production migration or backfill in this slice.
5. The first candidate migration is listing read projection after row-count, freshness, and field-parity validation between Base44 and Supabase.
