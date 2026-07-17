import { ApiError } from "./search.mjs";

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
    const params = new URLSearchParams({ select: "*", status: "eq.active", visibility: "eq.public", limit: String(Math.min(limit * 5, 100)) });
    if (constraints.budget_max) params.set("asking_price", `lte.${constraints.budget_max}`);
    if (constraints.region) params.set("location_region", `eq.${constraints.region}`);
    const response = await this.fetch(`${this.url}/rest/v1/${encodeURIComponent(this.view)}?${params}`, {
      headers: { apikey: this.publishableKey, authorization: `Bearer ${this.publishableKey}`, accept: "application/json" },
    });
    if (!response.ok) throw new ApiError(503, "LISTING_REPOSITORY_UNAVAILABLE", "The listing repository is temporarily unavailable.");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new ApiError(503, "INVALID_REPOSITORY_RESPONSE", "The listing repository returned an invalid response.");
    const terms = constraints.terms || [];
    const items = rows.filter((row) => terms.every((term) => `${row.make || ""} ${row.model || ""}`.toLowerCase().includes(term))).slice(0, limit);
    return { items, nextCursor: null };
  }
}
