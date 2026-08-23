# TASK-004 Entity/domain map

This is a decision and evidence artifact, not a migration. It covers the exact 79 current-main entities across the exact 15 issue domains and emits no SQL.

## Revised gate result

- Inventory: 79/79. Domain coverage: 15/15.
- Duplicate audit: only NewPlaneBrowser → ScraperRun is confirmed, based on an exact ten-field business schema match. DealerLead, EditorProfile, SalesFunnel, TrafficAppearance, GlobalRegistry, UserProfile, and AppConfig are explicitly not merged without a later approved decision.
- Aircraft is a durable canonical identity (ac_) assembled from registry assertions. AircraftListing is a separate market offer (lst_) that requires Aircraft and has an independent lifecycle.
- Every entity includes its domain, target table, owner, access/exposure, retention/deletion, source-field sensitivity evidence, regulatory flags and dependencies.
- D-003 requires deny-by-default RLS and object-storage authorization across all 79 entities.

## Security decisions encoded

Public DTOs are allowlists. AircraftListing and ATICard each state authentication, allowed fields, redactions and denied fields. API keys are random, shown once and stored hash-only; request logs prohibit credentials, bodies and raw PII-bearing queries. ABOS must not handle PAN/CVV, and provider KYC/AML evidence stays at the escrow/custody provider boundary. Retention includes legal holds, object versions, backups and mandatory re-erasure after restore. Public-ID creation and aliases require atomic uniqueness/type/cycle checks and explicit authorization.

## Migration order

Approve all decisions first; establish identity and canonical Aircraft; add AircraftListing/search/partners; add ATI/documents/payments; add analytics/integrations; reconcile the single confirmed duplicate; then separately review escrow and settlement. Each gate is documented in the JSON.

## Validate

`node --test task004/test/entity-domain-map.test.mjs`

## Source relation and field audit

Every available schema is recursively audited. Each relationType records its field path, target, and whether the enclosing required[] makes it mandatory. Canonical dependencies preserve that source evidence; the single SalesPipeline passport upgrade is explicit and backfill-gated. Every declared schema field is also partitioned into sensitive or reviewed non-sensitive evidence and fingerprinted. The seven entities added after the supplied archive are pinned to current-main blob SHAs and exact counts.

## Final architect corrections

Required relation dependencies take precedence over optional conceptual links, so no entity has the same target in both dependency sets. The enumerated names, addresses, document links, raw payloads, expert comments and revenue fields are classified as sensitive. Transaction, ownership, inspection, document and ATI verification artifacts carry explicit regulatory-evidence flags. Source field counts, path fingerprints and relation evidence are unchanged.
