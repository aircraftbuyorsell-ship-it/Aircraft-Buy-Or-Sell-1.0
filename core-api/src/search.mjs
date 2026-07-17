export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", ...headers },
});

const safeError = (error, requestId, headers) => {
  const known = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  return json(known.status, { error: {
    code: known.code,
    message: known.message,
    request_id: requestId,
    details: known.details,
    documentation_url: null,
  }}, headers);
};

const STOP_WORDS = new Set(["find", "me", "a", "an", "the", "aircraft", "plane", "for", "sale", "under", "below", "up", "to", "in", "within", "usd", "eur", "million", "thousand"]);
const REGION_ALIASES = new Map([["europe", "EUROPE"], ["eu", "EUROPE"], ["usa", "NORTH_AMERICA"], ["us", "NORTH_AMERICA"], ["canada", "NORTH_AMERICA"]]);

export function parseSearchQuery(rawQuery) {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (!query) throw new ApiError(400, "QUERY_REQUIRED", "query is required.");
  if (query.length > 500) throw new ApiError(400, "QUERY_TOO_LONG", "query must not exceed 500 characters.");
  const lower = query.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|up\s+to|max(?:imum)?)\s*(?:usd|eur|\$|€)?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?\b/);
  let budgetMax = null;
  if (budgetMatch) {
    const multiplier = ["m", "million"].includes(budgetMatch[2]) ? 1_000_000 : ["k", "thousand"].includes(budgetMatch[2]) ? 1_000 : 1;
    budgetMax = Number(budgetMatch[1]) * multiplier;
  }
  let region = null;
  for (const [alias, canonical] of REGION_ALIASES) if (new RegExp(`\\b${alias}\\b`).test(lower)) { region = canonical; break; }
  const terms = lower
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((term) => !STOP_WORDS.has(term) && !REGION_ALIASES.has(term) && !/^\d+(?:\.\d+)?[mk]?$/.test(term));
  return { intent: "BUY", interpretation_status: "deterministic", constraints: { terms, budget_max: budgetMax, region } };
}

const PUBLIC_LISTING_ID = /^lst_[a-f0-9]{24}$/;
const PUBLIC_AIRCRAFT_ID = /^ac_[a-f0-9]{24}$/;

export function toPublicListing(row) {
  if (!PUBLIC_LISTING_ID.test(row.public_listing_id || "") || !PUBLIC_AIRCRAFT_ID.test(row.public_aircraft_id || "")) {
    throw new ApiError(500, "PUBLIC_ID_UNAVAILABLE", "A listing is not ready for public API delivery.");
  }
  const observedAt = row.observed_at || row.updated_at || row.created_at || null;
  const source = row.source || "abos-authoritative-listings";
  return {
    listing_id: row.public_listing_id,
    aircraft: {
      aircraft_id: row.public_aircraft_id,
      identity: { registration: null, serial_number: null, registry_country: row.registry_country || null },
      manufacturer: row.make || null,
      model: row.model || null,
      year: row.year ?? null,
      total_time_hours: row.total_time ?? null,
      engine_hours: row.engine_hours ?? null,
      source_provenance: [{ source, source_record_id: row.public_aircraft_id, observed_at: observedAt, retrieval_method: "authorized_repository" }],
    },
    asking_price: Number.isFinite(row.asking_price) ? { value: row.asking_price, currency: row.currency || "USD" } : null,
    location: row.location_country || row.location_region ? { country: row.location_country || null, region: row.location_region || null, city: row.location_city || null } : null,
    status: row.status,
    summary: row.summary || row.ai_summary || null,
    primary_image_url: row.primary_image_url || row.photo_url || null,
    intelligence: {
      ati_score: row.ati_score ?? null,
      observed_market_value: Number.isFinite(row.omvm_value) ? { value: row.omvm_value, currency: row.currency || "USD" } : null,
      deal_score: row.deal_score ?? null,
      deal_label: row.deal_label || null,
      generated_at: row.intelligence_generated_at || null,
      engine_version: row.intelligence_engine_version || null,
      limitations: row.intelligence_limitations || ["Intelligence fields may be unavailable for this listing."],
    },
    source_provenance: [{ source, source_record_id: row.public_listing_id, observed_at: observedAt, retrieval_method: "authorized_repository" }],
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

export class InMemoryListingRepository {
  constructor(rows) { this.rows = rows; }
  async search({ constraints, limit, cursor }) {
    if (cursor) throw new ApiError(400, "INVALID_CURSOR", "The supplied cursor is not valid for this repository.");
    const terms = constraints.terms || [];
    const items = this.rows.filter((row) => {
      if (row.status !== "active" || row.visibility !== "public") return false;
      if (constraints.budget_max && (!Number.isFinite(row.asking_price) || row.asking_price > constraints.budget_max)) return false;
      if (constraints.region && row.location_region !== constraints.region) return false;
      const haystack = `${row.make || ""} ${row.model || ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => (b.ati_score || 0) - (a.ati_score || 0));
    return { items: items.slice(0, limit), nextCursor: null };
  }
}

export function createSearchHandler({ listingRepository, authenticate }) {
  if (!listingRepository?.search || typeof authenticate !== "function") throw new Error("Search handler dependencies are incomplete.");
  return async function handle(request) {
    const incomingRequestId = request.headers.get("x-request-id");
    const requestId = incomingRequestId && incomingRequestId.length <= 128 ? incomingRequestId : `req_${crypto.randomUUID()}`;
    const headers = { "x-request-id": requestId };
    try {
      const url = new URL(request.url);
      if (request.method !== "POST" || url.pathname !== "/api/v1/search") throw new ApiError(404, "ROUTE_NOT_FOUND", "The requested API route was not found.");
      let body;
      try { body = await request.json(); } catch { throw new ApiError(400, "INVALID_JSON", "The request body must contain valid JSON."); }
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "INVALID_REQUEST", "The request body must be a JSON object.");
      if ("api_key" in body || "apiKey" in body) throw new ApiError(400, "CREDENTIAL_IN_BODY_FORBIDDEN", "API credentials must be sent in an approved header.");
      const principal = await authenticate(request);
      if (!principal.scopes?.includes("search:read")) throw new ApiError(403, "INSUFFICIENT_SCOPE", "The search:read scope is required.");
      const pageSize = body.page_size ?? 20;
      if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError(400, "INVALID_PAGE_SIZE", "page_size must be an integer from 1 to 100.");
      const intent = parseSearchQuery(body.query);
      const result = await listingRepository.search({ constraints: intent.constraints, limit: pageSize, cursor: body.cursor || null, principal });
      return json(200, {
        query: body.query.trim(),
        intent: { intent: intent.intent, interpretation_status: intent.interpretation_status, constraints: { terms: intent.constraints.terms } },
        results: result.items.map(toPublicListing),
        page: { page_size: pageSize, next_cursor: result.nextCursor || null, has_more: Boolean(result.nextCursor) },
        explanation: "Results were retrieved deterministically from an authorized ABOS listing repository.",
      }, headers);
    } catch (error) {
      return safeError(error, requestId, headers);
    }
  };
}

export function createEnvAuthenticator(env) {
  return async (request) => {
    const bearer = request.headers.get("authorization");
    const apiKey = request.headers.get("x-abos-api-key");
    if (bearer && apiKey) throw new ApiError(400, "AMBIGUOUS_CREDENTIALS", "Use exactly one authentication mechanism.");
    const raw = apiKey || (bearer?.startsWith("Bearer ") ? bearer.slice(7).trim() : null);
    if (!raw) throw new ApiError(401, "UNAUTHORIZED", "Provide an ABOS API credential.");
    if (!env.ABOS_API_KEY_SHA256) throw new ApiError(503, "AUTH_NOT_CONFIGURED", "API authentication is not configured.");
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (digest !== env.ABOS_API_KEY_SHA256.toLowerCase()) throw new ApiError(401, "INVALID_API_KEY", "The API credential is invalid.");
    return { type: "api_key", scopes: String(env.ABOS_API_KEY_SCOPES || "").split(/[ ,]+/).filter(Boolean) };
  };
}
