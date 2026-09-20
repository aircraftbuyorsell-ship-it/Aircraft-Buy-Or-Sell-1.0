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

function normalizeRegistration(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function getSupabaseConfig() {
  return {
    url: Deno.env.get("SUPABASE_URL") || Deno.env.get("ABOS_SUPABASE_URL") || "",
    key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ABOS_SUPABASE_SERVICE_ROLE_KEY") || "",
  };
}

async function supabaseRest(path) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  if (!response.ok) return null;
  return response.json();
}

async function toPublicListing(record) {
  const listingId = await opaqueId("lst", record.id);
  const aircraftId = await opaqueId("ac", record.registration || record.id);
  const sourceProvenance = [{
    source: "legacy_marketplace",
    source_record_id: null,
    observed_at: record.updated_date || record.created_date || null,
    retrieval_method: "base44_adapter",
  }];

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
      source_provenance: sourceProvenance,
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
    source_provenance: sourceProvenance,
    created_at: record.created_date || null,
    updated_at: record.updated_date || null,
  };
}

async function toPublicReferenceAircraft(record, source) {
  const registration = normalizeRegistration(record.registration || record.callsign);
  if (!registration) return null;
  const aircraftId = await opaqueId("ac", registration);
  const observedAt = record.updated_at || record.updated_date || record.last_seen || null;
  const serial = record.serial_number || null;
  const make = record.make || record.manufacturer || null;
  const model = record.model || null;
  return {
    listing_id: null,
    aircraft: {
      aircraft_id: aircraftId,
      identity: { registration, serial_number: serial, registry_country: registration.startsWith("N") ? "US" : null },
      manufacturer: make,
      model,
      year: Number.isFinite(record.year_manufactured) ? record.year_manufactured : null,
      total_time_hours: null,
      engine_hours: null,
      source_provenance: [{ source, source_record_id: record.id || record.icao24 || null, observed_at, retrieval_method: "supabase_adapter" }],
    },
    asking_price: null,
    location: null,
    status: "reference",
    summary: "Aircraft identity reference found in ABOS data infrastructure; this is not a marketplace listing.",
    primary_image_url: null,
    intelligence: {
      ati_score: null,
      observed_market_value: null,
      deal_score: null,
      deal_label: null,
      generated_at: observedAt,
      engine_version: null,
      limitations: ["Reference record only; no marketplace listing or valuation is implied."],
    },
    source_provenance: [{ source, source_record_id: record.id || record.icao24 || null, observed_at, retrieval_method: "supabase_adapter" }],
    created_at: null,
    updated_at: observedAt,
  };
}

function hasPublicVisibility(record) {
  return record?.status === "active" && record?.visibility === "public";
}

async function searchSupabaseRegistration(registration) {
  const reg = normalizeRegistration(registration);
  if (!reg) return [];
  const encoded = encodeURIComponent(reg);
  const rows = await Promise.all([
    supabaseRest(`aircraft_passports?select=id,registration,serial_number,make,model,year_manufactured,icao24,updated_at&registration=eq.${encoded}&limit=1`),
    supabaseRest(`opensky_aircraft_metadata?select=*&registration=eq.${encoded}&limit=1`),
    supabaseRest(`aircraftbuyorsell_listings?select=id,registration,manufacturer,model,year,status,updated_at&registration=eq.${encoded}&limit=1`),
  ]);
  const [passportRows, openSkyRows, listingRows] = rows;
  const results = [];
  if (Array.isArray(passportRows) && passportRows[0]) results.push(await toPublicReferenceAircraft(passportRows[0], "supabase_aircraft_passports"));
  if (Array.isArray(openSkyRows) && openSkyRows[0]) results.push(await toPublicReferenceAircraft(openSkyRows[0], "supabase_opensky_aircraft_metadata"));
  if (Array.isArray(listingRows) && listingRows[0]) {
    const row = listingRows[0];
    results.push(await toPublicReferenceAircraft({ ...row, make: row.manufacturer }, "supabase_aircraftbuyorsell_listings"));
  }
  const seen = new Set();
  return results.filter(Boolean).filter((item) => {
    const key = item.aircraft.identity.registration;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
          ? listings.filter((listing) => {
              const searchable = [
                listing.aircraft.identity.registration,
                listing.aircraft.manufacturer,
                listing.aircraft.model,
                listing.summary,
              ].filter(Boolean).join(" ").toLowerCase();
              return terms.every((term) => searchable.includes(String(term).toLowerCase()));
            })
          : listings;

        const registration = terms.length === 1 && /^(N\d{1,5}[A-Z]{0,2}|[A-Z0-9]{1,2}-[A-Z0-9]{2,5})$/i.test(String(terms[0]));
        let referenceMatches = [];
        if (registration) {
          referenceMatches = await searchSupabaseRegistration(terms[0]);
        }
        const merged = [...matches, ...referenceMatches];
        const seen = new Set();
        const unique = merged.filter((item) => {
          const key = item.aircraft?.identity?.registration || item.listing_id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return { items: unique.sort((a, b) => (b.intelligence.ati_score || 0) - (a.intelligence.ati_score || 0)).slice(0, limit), nextCursor: null };
      },
    },
    aircraftRepository: {
      async getByPublicId(publicId) {
        const listing = (await readCandidates()).find((candidate) => candidate.aircraft.aircraft_id === publicId);
        return listing?.aircraft || null;
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
  if (scopes.has("listing:read")) scopes.add("listings:read");
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
    corsAllowlist: allowedOrigins(),
  });

  const originalPath = request.headers.get("x-abos-original-path");
  const originalMethod = request.headers.get("x-abos-original-method");
  const routedRequest = originalPath
    ? new Request(`https://abos-core.invalid${originalPath}`, { method: originalMethod || request.method, headers: request.headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body })
    : request;
  return router(routedRequest);
});
