import { ApiError } from "./search.mjs";

export const PUBLIC_LISTING_SELECT = [
  "public_listing_id", "public_aircraft_id", "make", "model", "year", "total_time", "engine_hours",
  "asking_price", "currency", "status", "visibility", "location_country", "location_region", "location_city",
  "ati_score", "omvm_value", "deal_score", "deal_label", "ai_summary", "photo_url", "registry_country",
  "source", "source_record_id", "observed_at", "intelligence_generated_at", "intelligence_engine_version",
  "intelligence_limitations", "created_at", "updated_at",
].join(",");

export class SupabaseListingRepository {
  constructor({ url, publishableKey, view = "abos_public_listings_v1", fetchImpl = fetch }) {
    if (!url || !publishableKey) throw new Error("Supabase public read configuration is incomplete.");
    this.url = url.replace(/\/$/, "");
    this.publishableKey = publishableKey;
    this.view = view;
    this.fetch = fetchImpl;
  }

  async search({ constraints, limit, cursor }) {
    if (cursor) throw new ApiError(400, "INVALID_CURSOR", "Cursor pagination is not available in the first search slice.");
    const params = new URLSearchParams({
      select: PUBLIC_LISTING_SELECT,
      status: "eq.active",
      visibility: "eq.public",
      order: "ati_score.desc.nullslast,public_listing_id.asc",
      limit: String(limit),
    });
    if (constraints.budget_max) params.set("asking_price", `lte.${constraints.budget_max}`);
    if (constraints.region) params.set("location_region", `eq.${constraints.region}`);
    if (constraints.terms?.length) {
      params.set("and", `(${constraints.terms.map((term) => `or(make.ilike.*${term}*,model.ilike.*${term}*)`).join(",")})`);
    }
    const response = await this.fetch(`${this.url}/rest/v1/${encodeURIComponent(this.view)}?${params}`, {
      headers: { apikey: this.publishableKey, authorization: `Bearer ${this.publishableKey}`, accept: "application/json" },
    });
    if (!response.ok) throw new ApiError(503, "LISTING_REPOSITORY_UNAVAILABLE", "The listing repository is temporarily unavailable.");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new ApiError(503, "INVALID_REPOSITORY_RESPONSE", "The listing repository returned an invalid response.");
    return { items: rows.slice(0, limit), nextCursor: null };
  }
}
