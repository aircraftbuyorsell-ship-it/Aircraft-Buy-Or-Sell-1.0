import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { ApiError, createRouter } from "./core.mjs";
import { createBase44Repositories } from "./adapters/base44Repositories.mjs";
import { createBase44Authenticator } from "./adapters/base44Authenticator.mjs";

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

Deno.serve(async (request) => {
  const gatewaySecret = Deno.env.get("ABOS_GATEWAY_SHARED_SECRET");
  if (!gatewaySecret || request.headers.get("x-abos-gateway-secret") !== gatewaySecret) {
    return Response.json({ error: { code: "GATEWAY_AUTH_REQUIRED", message: "This endpoint accepts requests only through the configured API gateway.", request_id: null, details: {}, documentation_url: null } }, { status: 401 });
  }

  const base44 = createClientFromRequest(request);
  const repositories = createBase44Repositories({ base44, createPublicId: opaqueId });
  const authenticate = createBase44Authenticator({ base44, hashCredential: sha256 });
  const router = createRouter({
    authenticate,
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
