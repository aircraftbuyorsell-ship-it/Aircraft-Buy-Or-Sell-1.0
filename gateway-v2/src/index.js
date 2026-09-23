const JSON_HEADERS = { "Content-Type": "application/json" };

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return origin && allowed.includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type,X-ABOS-API-Key",
        "Vary": "Origin",
      }
    : {};
}

function bearer(request) {
  const value = request.headers.get("Authorization") || "";
  return value.replace(/^Bearer\s+/i, "").trim() || null;
}

function apiKey(request, env) {
  return (
    request.headers.get("X-ABOS-API-Key") ||
    request.headers.get("X-ABOS-Key") ||
    bearer(request) ||
    env.V2_TEST_API_KEY ||
    null
  );
}

function normalizeRegistration(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

async function coreRequest(request, env, path, body = null) {
  const base = (env.BASE44_APP_BASE_URL || "").replace(/\/$/, "");
  const key = apiKey(request, env);
  if (!env.ABOS_GATEWAY_SHARED_SECRET) {
    return json({ error: "gateway_misconfigured", code: "MISSING_GATEWAY_SECRET" }, 500);
  }
  if (!key) {
    return json({ error: "unauthorized", code: "API_KEY_REQUIRED" }, 401);
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-abos-gateway-secret", env.ABOS_GATEWAY_SHARED_SECRET);
  headers.set("x-abos-api-key", key);
  headers.set("x-abos-original-path", path);
  headers.set("x-abos-original-method", request.method);

  const upstream = await fetch(base + "/functions/abosCoreApiV1", {
    method: "POST",
    headers,
    body: body === null ? null : JSON.stringify(body),
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    },
  });
}

async function aircraftLookup(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const registration = normalizeRegistration(body.registration || body.tail_number);
  if (!registration) {
    return json({ error: "registration_required" }, 400);
  }

  // V2 never performs the legacy federated SQL lookup.
  // The Core API owns the indexed Supabase lookup.
  return coreRequest(request, env, "/search", { query: registration });
}

async function legacyWidgetCompat(request, env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const base = (env.BASE44_APP_BASE_URL || "").replace(/\/$/, "");
  if (!env.ABOS_GATEWAY_SHARED_SECRET) {
    return json({ error: "gateway_misconfigured", code: "MISSING_GATEWAY_SECRET" }, 500);
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-abos-gateway-secret", env.ABOS_GATEWAY_SHARED_SECRET);
  headers.set("x-widget-origin", request.headers.get("Origin") || request.headers.get("x-widget-origin") || "");

  const body = await request.text();
  const upstream = await fetch(base + "/functions/widgetGatewayV2", {
    method: "POST",
    headers,
    body,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function mcp(request, env) {
  let rpc;
  try {
    rpc = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }

  if (!rpc || Array.isArray(rpc)) {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } }, 400);
  }

  if (rpc.method === "initialize") {
    return json({
      jsonrpc: "2.0",
      id: rpc.id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "abos-widget-gateway-v2", title: "ABOS Widget Gateway V2", version: "2.0.0" },
      },
    });
  }

  if (rpc.method === "tools/list") {
    return json({
      jsonrpc: "2.0",
      id: rpc.id,
      result: {
        tools: [{
          name: "lookup_aircraft",
          description: "Look up an aircraft by registration through the ABOS Core API.",
          inputSchema: {
            type: "object",
            required: ["registration"],
            properties: { registration: { type: "string" } },
          },
        }],
      },
    });
  }

  if (rpc.method === "tools/call" && rpc.params?.name === "lookup_aircraft") {
    const result = await aircraftLookup(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(rpc.params.arguments || {}),
      }),
      env
    );
    const text = await result.text();
    return json({
      jsonrpc: "2.0",
      id: rpc.id,
      result: {
        content: [{ type: "text", text }],
        isError: !result.ok,
      },
    }, 200);
  }

  return json({
    jsonrpc: "2.0",
    id: rpc.id,
    error: { code: -32601, message: "Method or tool not found" },
  }, 404);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    try {
      let response;
      if (url.pathname === "/health") {
        response = json({
          status: "ok",
          gateway: "abos-widget-gateway-v2",
          version: "2.0.0",
          lookup_mode: "core-api-indexed",
          legacy_federated_lookup: false,
        });
      } else if (url.pathname === "/aircraft/lookup" && request.method === "POST") {
        response = await aircraftLookup(request, env);
      } else if (url.pathname === "/mcp" && request.method === "POST") {
        response = await mcp(request, env);
      } else if (request.method === "POST") {
        // Drop-in replacement for the old gateway's legacy widget fallback.
        // V2 routes the fallback to widgetGatewayV2, never widgetGateway.
        response = await legacyWidgetCompat(request, env);
      } else {
        response = json({ error: "not_found" }, 404);
      }

      Object.entries(cors).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    } catch (error) {
      return json({
        error: "gateway_error",
        message: error instanceof Error ? error.message : String(error),
      }, 500, cors);
    }
  },
};
