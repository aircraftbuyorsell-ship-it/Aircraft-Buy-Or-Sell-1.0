import { webcrypto } from '../_shared/webcrypto.mjs';

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

const safeError = (error, requestId) => {
  const known = error instanceof ApiError
    ? error
    : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  return json(known.status, { error: {
    code: known.code,
    message: known.message,
    request_id: requestId,
    details: known.details,
    documentation_url: null,
  }});
};

const requireObject = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_REQUEST", "The request body must be a JSON object.");
  }
  return body;
};

const requireScope = (principal, scope) => {
  if (!principal?.scopes?.includes(scope)) {
    throw new ApiError(403, "INSUFFICIENT_SCOPE", `The ${scope} scope is required.`);
  }
};

const parseJson = async (request) => {
  try { return await request.json(); }
  catch { throw new ApiError(400, "INVALID_JSON", "The request body must contain valid JSON."); }
};

const normalizeSearch = (body) => {
  const value = requireObject(body);
  const query = typeof value.query === "string" ? value.query.trim() : "";
  if (!query) throw new ApiError(400, "QUERY_REQUIRED", "query is required.");
  const pageSize = value.page_size ?? 20;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new ApiError(400, "INVALID_PAGE_SIZE", "page_size must be an integer from 1 to 100.");
  }
  return { query, pageSize, cursor: typeof value.cursor === "string" ? value.cursor : null };
};

const normalizeValuation = (body) => {
  const value = requireObject(body);
  const manufacturer = typeof value.manufacturer === "string" ? value.manufacturer.trim() : "";
  const model = typeof value.model === "string" ? value.model.trim() : "";
  if (!manufacturer || !model) {
    throw new ApiError(400, "AIRCRAFT_REQUIRED", "manufacturer and model are required.");
  }
  return {
    manufacturer, model,
    year: Number.isInteger(value.year) ? value.year : null,
    total_time_hours: Number.isFinite(value.total_time_hours) ? value.total_time_hours : null,
    engine_hours: Number.isFinite(value.engine_hours) ? value.engine_hours : null,
  };
};

export function createRouter({ authenticate, listingRepository, aircraftRepository, intentInterpreter, valuationProvider, auditSink, rateLimiter, corsAllowlist = [] }) {
  if (!authenticate || !listingRepository || !aircraftRepository || !intentInterpreter || !valuationProvider) {
    throw new Error("ABOS Core API dependencies are incomplete.");
  }

  return async function handle(request) {
    const requestId = request.headers.get("x-request-id") || `req_${webcrypto.randomUUID()}`;
    const origin = request.headers.get("origin");
    const headers = { "x-request-id": requestId, vary: "Origin" };
    if (origin && corsAllowlist.includes(origin)) headers["access-control-allow-origin"] = origin;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        ...headers,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type, Idempotency-Key, X-ABOS-API-Key, X-Request-ID",
      }});
    }

    const startedAt = Date.now();
    let principal = null;
    try {
      const path = new URL(request.url).pathname;
      principal = await authenticate(request);

      const rate = rateLimiter ? await rateLimiter.check(principal, request) : { limit: 0, remaining: 0, reset: 0 };
      if (rate?.limited) throw new ApiError(429, "RATE_LIMITED", "Request rate limit exceeded.");
      if (rate) {
        headers["x-ratelimit-limit"] = String(rate.limit ?? 0);
        headers["x-ratelimit-remaining"] = String(rate.remaining ?? 0);
        headers["x-ratelimit-reset"] = String(rate.reset ?? 0);
      }

      let responseBody;
      if (request.method === "POST" && path === "/api/v1/search") {
        requireScope(principal, "search:read");
        const search = normalizeSearch(await parseJson(request));
        const intent = await intentInterpreter.interpret(search.query);
        const result = await listingRepository.search({ intent, limit: search.pageSize, cursor: search.cursor });
        responseBody = {
          query: search.query,
          intent,
          results: result.items,
          page: { page_size: search.pageSize, next_cursor: result.nextCursor ?? null, has_more: Boolean(result.nextCursor) },
          explanation: "Listings are retrieved deterministically from the configured authoritative repository after intent interpretation.",
        };
      } else if (request.method === "GET" && /^\/api\/v1\/aircraft\/[^/]+$/.test(path)) {
        requireScope(principal, "listings:read");
        const aircraft = await aircraftRepository.getByPublicId(decodeURIComponent(path.split("/").pop()));
        if (!aircraft) throw new ApiError(404, "AIRCRAFT_NOT_FOUND", "The requested aircraft was not found.");
        responseBody = aircraft;
      } else if (request.method === "GET" && /^\/api\/v1\/listings\/[^/]+$/.test(path)) {
        requireScope(principal, "listings:read");
        const listing = await listingRepository.getByPublicId(decodeURIComponent(path.split("/").pop()));
        if (!listing) throw new ApiError(404, "LISTING_NOT_FOUND", "The requested aircraft listing was not found.");
        responseBody = listing;
      } else if (request.method === "POST" && path === "/api/v1/intelligence/valuate") {
        requireScope(principal, "intelligence:request");
        const result = await valuationProvider.valuate(normalizeValuation(await parseJson(request)));
        responseBody = {
          valuation_id: `val_${webcrypto.randomUUID()}`,
          status: result.status,
          estimated_value: result.estimated_value ?? null,
          range: result.range ?? { minimum: null, maximum: null, currency: "USD" },
          confidence: result.confidence ?? null,
          data_completeness: result.data_completeness ?? 0,
          generated_at: new Date().toISOString(),
          engine_version: result.engine_version ?? null,
          source_provenance: result.source_provenance ?? [],
          limitations: result.limitations ?? ["No traceable valuation source is configured."],
        };
      } else {
        throw new ApiError(404, "ROUTE_NOT_FOUND", "The requested API route was not found.");
      }

      const response = json(200, responseBody, headers);
      await auditSink?.record({ requestId, principal, method: request.method, path, status: 200, durationMs: Date.now() - startedAt });
      return response;
    } catch (error) {
      const response = safeError(error, requestId);
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      await auditSink?.record({ requestId, principal, method: request.method, path: new URL(request.url).pathname, status: response.status, durationMs: Date.now() - startedAt });
      return response;
    }
  };
}
