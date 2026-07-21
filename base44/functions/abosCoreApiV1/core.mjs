import { assertRepositoryPorts } from "./repositoryPorts.mjs";
import { assertOperationResponse } from "./contractValidation.mjs";

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

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

const requestContext = (request) => {
  const generated = `req_${crypto.randomUUID()}`;
  const supplied = request.headers.get("x-request-id");
  if (supplied === null) return { requestId: generated, error: null };
  if (!REQUEST_ID_PATTERN.test(supplied)) {
    return {
      requestId: generated,
      error: new ApiError(400, "INVALID_REQUEST_ID", "X-Request-ID must contain 1 to 128 safe identifier characters."),
    };
  }
  return { requestId: supplied, error: null };
};

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

const rejectUnknownFields = (value, allowedFields, objectName) => {
  const unknownFields = Object.keys(value).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) {
    throw new ApiError(400, "UNKNOWN_FIELDS", `${objectName} contains unsupported fields.`, {
      fields: unknownFields.sort(),
    });
  }
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

const normalizeNullableNumber = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new ApiError(400, "INVALID_FIELD", `${fieldName} must be a non-negative number or null.`, { field: fieldName });
  }
  return value;
};

const normalizeSearch = (body) => {
  const value = requireObject(body);
  rejectUnknownFields(value, new Set(["query", "page_size", "cursor"]), "SearchRequest");

  const query = typeof value.query === "string" ? value.query.trim() : "";
  if (!query) throw new ApiError(400, "QUERY_REQUIRED", "query is required.");
  if (Array.from(query).length > 500) throw new ApiError(400, "QUERY_TOO_LONG", "query must not exceed 500 characters.");

  const pageSize = value.page_size ?? 20;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new ApiError(400, "INVALID_PAGE_SIZE", "page_size must be an integer from 1 to 100.");
  }

  if (value.cursor !== undefined && value.cursor !== null && typeof value.cursor !== "string") {
    throw new ApiError(400, "INVALID_CURSOR", "cursor must be a string or null.");
  }

  return { query, pageSize, cursor: value.cursor ?? null };
};

const normalizeValuation = (body) => {
  const value = requireObject(body);
  rejectUnknownFields(
    value,
    new Set(["manufacturer", "model", "year", "total_time_hours", "engine_hours"]),
    "ValuationRequest",
  );

  const manufacturer = typeof value.manufacturer === "string" ? value.manufacturer.trim() : "";
  const model = typeof value.model === "string" ? value.model.trim() : "";
  if (!manufacturer || !model) {
    throw new ApiError(400, "AIRCRAFT_REQUIRED", "manufacturer and model are required.");
  }

  if (value.year !== undefined && value.year !== null && (!Number.isInteger(value.year) || value.year < 1903)) {
    throw new ApiError(400, "INVALID_YEAR", "year must be an integer greater than or equal to 1903, or null.");
  }

  return {
    manufacturer,
    model,
    year: value.year ?? null,
    total_time_hours: normalizeNullableNumber(value.total_time_hours, "total_time_hours"),
    engine_hours: normalizeNullableNumber(value.engine_hours, "engine_hours"),
  };
};

const PUBLIC_ID_PATTERNS = {
  aircraft: /^ac_[a-f0-9]{24}$/,
  listing: /^lst_[a-f0-9]{24}$/,
};

const readPublicId = (path, resource) => {
  const rawId = path.split("/").pop() || "";
  let publicId;
  try {
    publicId = decodeURIComponent(rawId);
  } catch {
    throw new ApiError(400, `INVALID_${resource.toUpperCase()}_ID`, `The ${resource} ID is not valid URL encoding.`);
  }

  if (!PUBLIC_ID_PATTERNS[resource].test(publicId)) {
    throw new ApiError(
      400,
      `INVALID_${resource.toUpperCase()}_ID`,
      `The ${resource} ID does not match the public ABOS identifier format.`,
    );
  }
  return publicId;
};

export function createRouter({ authenticate, listingRepository, aircraftRepository, intentInterpreter, valuationProvider, auditSink, rateLimiter, corsAllowlist = [] }) {
  if (typeof authenticate !== "function" || !intentInterpreter || typeof intentInterpreter.interpret !== "function" || !valuationProvider || typeof valuationProvider.valuate !== "function") {
    throw new TypeError("ABOS Core API service ports are incomplete.");
  }
  assertRepositoryPorts({ listingRepository, aircraftRepository });

  const recordAudit = async (event) => {
    try { await auditSink?.record(event); }
    catch { /* audit transport failures never change the public response */ }
  };

  return async function handle(request) {
    const { requestId, error: requestContextError } = requestContext(request);
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
      if (requestContextError) throw requestContextError;
      principal = await authenticate(request);

      if (rateLimiter) {
        const rate = await rateLimiter.check(principal, request);
        if (rate?.limited) throw new ApiError(429, "RATE_LIMITED", "Request rate limit exceeded.");
        if (rate) {
          const rateValues = [rate.limit, rate.remaining, rate.reset];
          if (!rateValues.every((value) => Number.isFinite(value) && value >= 0)) {
            throw new ApiError(503, "RATE_LIMITER_INVALID", "The configured rate limiter returned an invalid result.");
          }
          headers["x-ratelimit-limit"] = String(rate.limit);
          headers["x-ratelimit-remaining"] = String(rate.remaining);
          headers["x-ratelimit-reset"] = String(rate.reset);
        }
      }

      let operationId;
      let responseBody;
      if (request.method === "POST" && path === "/api/v1/search") {
        operationId = "searchListings";
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
        operationId = "getAircraft";
        requireScope(principal, "listings:read");
        const aircraft = await aircraftRepository.getByPublicId(readPublicId(path, "aircraft"));
        if (!aircraft) throw new ApiError(404, "AIRCRAFT_NOT_FOUND", "The requested aircraft was not found.");
        responseBody = aircraft;
      } else if (request.method === "GET" && /^\/api\/v1\/listings\/[^/]+$/.test(path)) {
        operationId = "getListing";
        requireScope(principal, "listings:read");
        const listing = await listingRepository.getByPublicId(readPublicId(path, "listing"));
        if (!listing) throw new ApiError(404, "LISTING_NOT_FOUND", "The requested aircraft listing was not found.");
        responseBody = listing;
      } else if (request.method === "POST" && path === "/api/v1/intelligence/valuate") {
        operationId = "requestValuation";
        requireScope(principal, "intelligence:request");
        const result = await valuationProvider.valuate(normalizeValuation(await parseJson(request)));
        responseBody = {
          valuation_id: `val_${crypto.randomUUID()}`,
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

      assertOperationResponse(operationId, responseBody);
      const response = json(200, responseBody, headers);
      await recordAudit({ requestId, principal, method: request.method, path, status: 200, durationMs: Date.now() - startedAt });
      return response;
    } catch (error) {
      const response = safeError(error, requestId);
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      await recordAudit({ requestId, principal, method: request.method, path: new URL(request.url).pathname, status: response.status, durationMs: Date.now() - startedAt });
      return response;
    }
  };
}
