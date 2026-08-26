// Canonical public shape of an AircraftListing in the ABOS API contract.
//
// Shared between abosCoreApi (direct API-key / user-session callers) and
// tenantCoreApi (White-Label tenant callers) so the two cannot drift: a
// white-label customer must see exactly the same listing contract as a direct
// API customer, since both are documented as ABOS Core API v1.
//
// This is FORMATTING ONLY and deliberately contains no authorization logic.
// The "is this listing public" check stays inline at each entry point, where
// it is directly visible and independently guard-tested — a security check
// hidden behind a shared helper is easy to forget to call.

export function mapListing(l) {
  return {
    id: l.id,
    registration: l.registration || null,
    aircraft: { manufacturer: l.make, model: l.model, year: l.year || null },
    price: l.asking_price ? { value: l.asking_price, currency: l.currency || 'USD' } : null,
    location: null,
    status: l.status,
    intelligence: {
      ati_score: l.ati_score ?? null,
      omvm_value: l.omvm_value ?? null,
      deal_score: l.deal_score ?? null,
      deal_label: l.deal_label || null,
      discount_pct: l.discount_pct ?? null,
    },
    summary: l.ai_summary || null,
    photo_url: l.photo_url || null,
    created_at: l.created_date,
  };
}
