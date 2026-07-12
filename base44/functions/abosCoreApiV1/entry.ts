import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { ApiError, createRouter } from "./core.mjs";

const text = new TextEncoder();

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", text.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function opaqueId(prefix, value) {
  const secret = Deno.env.get("ABOS_PUBLIC_ID_SALT");
  if (!secret) throw new ApiError(503, "CORE_API_NOT_CONFIGURED", "The public identifier service is not configured.");
  const key = await crypto.subtle.importKey("raw", text.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, text.encode(value));
  return `${prefix}_${[...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24)}`;
}

function allowedOrigins() {
  return (Deno.env.get("ABOS_CORS_ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);
}

async function toPublicListing(record) {
  const listingId = await opaqueId("lst", record.id);
  const aircraftId = await opaqueId("ac", record.registration || record.id);
  return {
    listing_id: listingId,
    aircraft: {
      aircraft_id: aircraftId,
      identity: { registration: record.registration || null, serial_number: null, registry_country: null },
      manufacturer: record.make || null,
      model: record.model || null,
      year: Number.isFinite(record.year) ? record.year : null,
      total_time_hours: Number.isFinite(record.total_time) ? record.total_time : null,
      engine_hours: Number.isFinite(record.engine_hours) ? record.engine_hours : null,
    },
    asking_price: Number.isFinite(record.asking_price) ? { value: record.asking_price, currency: record.currency || "USD" } : null,
    location: null,
    status: record.status || "unknown",
    summary: record.ai_summary || null,
    primary_image_url: record.photo_url || null,
    intelligence: {
      ati_score: Number.isFinite(record.ati_score) ? record.ati_score : null,
      observed_market_value: Number.isFinite(record.omvm_value) ? { value: record.omvm_value, currency: "USD" } : null,
      deal_score: Number.isFinite(record.deal_score) ? record.deal_score : null,
      deal_label: record.deal_label || null,
      generated_at: record.updated_date || null,
      engine_version: null,
      limitations: ["Legacy intelligence values do not yet carry a complete calculation provenance record."],
    },
    source_provenance: [{ source: "legacy_marketplace", source_record_id: null, observed_at: record.updated_date || record.created_date || null, retrieval_method: "base44_adapter" }],
    created_at: record.created_date || null,
    updated_at: record.updated_date || null,
  };
}

function hasPublicVisibility(record) {
  return record?.status === "active" && record?.visibility === "public";
}

function makeRepositories(base44) {
  const readCandidates = async () => {
    const records = await base44.asServiceRole.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-created_date", 200);
    return Promise.all(records.filter(hasPublicVisibility).map(toPublicListing));
  };

  return {
    listingRepository: {
      async getByPublicId(publicId) {
        return (await readCandidates()).find((listing) => listing.listing_id === publicId) || null;
      },
      async search({ intent, limit }) {
        const listings = await readCandidates();
        const terms = Array.isArray(intent.constraints?.terms) ? intent.constraints.terms : [];
        const matches = terms.length
          ? listings.filter((listing) => terms.every((term) => `${listing.aircraft.manufacturer || ""} ${listing.aircraft.model || ""}`.toLowerCase().includes(term)))
          : listings;
        return { items: matches.sort((a, b) => (b.intelligence.ati_score || 0) - (a.intelligence.ati_score || 0)).slice(0, limit), nextCursor: null };
      },
    },
    aircraftRepository: {
      async getByPublicId(publicId) {
        const listing = (await readCandidates()).find((candidate) => candidate.aircraft.aircraft_id === publicId);
        return listing ? { ...listing.aircraft, source_provenance: listing.source_provenance } : null;
      },
    },
  };
}

async function authenticate(base44, request) {
  const authorization = request.headers.get("authorization") || "";
  const rawKey = request.headers.get("x-abos-api-key") || request.headers.get("x-abos-key") || (authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "");
  if (!rawKey) throw new ApiError(401, "AUTHENTICATION_REQUIRED", "A bearer token or X-ABOS-API-Key header is required.");
  const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: await sha256(rawKey) }, undefined, 1);
  const key = keys[0];
  if (!key || key.status !== "active" || (key.expires_at && Date.parse(key.expires_at) <= Date.now())) {
    throw new ApiError(401, "INVALID_API_KEY", "The supplied API credential is invalid or inactive.");
  }
  const scopes = new Set(key.scopes || []);
  if (scopes.has("listing:read")) scopes.add("listings:read"); // documented compatibility for existing Base44 keys
  return { type: "api_key", keyId: key.id, scopes: [...scopes], plan: key.plan || "free" };
}

Deno.serve(async (request) => {
  const gatewaySecret = Deno.env.get("ABOS_GATEWAY_SHARED_SECRET");
  if (!gatewaySecret || request.headers.get("x-abos-gateway-secret") !== gatewaySecret) {
    return Response.json({ error: { code: "GATEWAY_AUTH_REQUIRED", message: "This endpoint accepts requests only through the configured API gateway.", request_id: null, details: {}, documentation_url: null } }, { status: 401 });
  }

  const base44 = createClientFromRequest(request);
  const repositories = makeRepositories(base44);
  const router = createRouter({
    authenticate: (incomingRequest) => authenticate(base44, incomingRequest),
    ...repositories,
    intentInterpreter: {
      async interpret(query) {
        const terms = query.toLowerCase().replace(/[^a-z0-9 -]/g, " ").split(/\s+/).filter((term) => term.length > 1).slice(0, 8);
        return { intent: "search", interpretation_status: "deterministic", constraints: { terms } };
      },
    },
    valuationProvider: {
      async valuate() {
        return {
          status: "insufficient_data",
          estimated_value: null,
          range: { minimum: null, maximum: null, currency: "USD" },
          confidence: null,
          data_completeness: 0,
          engine_version: null,
          source_provenance: [],
          limitations: ["No traceable comparable-set and valuation-engine provenance have been configured for the public API."],
        };
      },
    },
    auditSink: {
      async record(event) {
        try {
          await base44.asServiceRole.entities.ApiRequestLog.create({
            request_id: event.requestId,
            endpoint: event.path,
            caller_type: event.principal?.type || "anonymous",
            api_key_id: event.principal?.keyId || undefined,
            status: event.status,
            duration_ms: event.durationMs,
          });
        } catch (_) { /* audit failures never change the public response */ }
      },
    },
    rateLimiter: { async check() { return { limit: 0, remaining: 0, reset: 0 }; } },
    corsAllowlist: allowedOrigins(),
  });

  const originalPath = request.headers.get("x-abos-original-path");
  const originalMethod = request.headers.get("x-abos-original-method");
  const routedRequest = originalPath
    ? new Request(`https://abos-core.invalid${originalPath}`, { method: originalMethod || request.method, headers: request.headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body })
    : request;
  return router(routedRequest);
});
