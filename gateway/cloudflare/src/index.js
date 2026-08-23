const API_PATHS = new Set([
  "POST /api/v1/search",
  "GET /api/v1/aircraft/:id",
  "GET /api/v1/listings/:id",
  "POST /api/v1/intelligence/valuate",
]);

function routeKey(request) {
  const path = new URL(request.url).pathname
    .replace(/^\/api\/v1\/aircraft\/[^/]+$/, "/api/v1/aircraft/:id")
    .replace(/^\/api\/v1\/listings\/[^/]+$/, "/api/v1/listings/:id");
  return `${request.method} ${path}`;
}

export default {
  async fetch(request, env) {
    const key = routeKey(request);
    if (!API_PATHS.has(key)) return new Response(JSON.stringify({ error: { code: "ROUTE_NOT_FOUND", message: "The requested API route was not found.", request_id: null, details: {}, documentation_url: null } }), { status: 404, headers: { "content-type": "application/json" } });
    if (!env.ABOS_UPSTREAM_URL || !env.ABOS_UPSTREAM_SHARED_SECRET) {
      return new Response(JSON.stringify({ error: { code: "GATEWAY_NOT_CONFIGURED", message: "The API gateway is not configured.", request_id: null, details: {}, documentation_url: null } }), { status: 503, headers: { "content-type": "application/json" } });
    }

    const requestId = request.headers.get("x-request-id") || `req_${crypto.randomUUID()}`;
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.set("x-abos-gateway-secret", env.ABOS_UPSTREAM_SHARED_SECRET);
    upstreamHeaders.set("x-abos-original-path", new URL(request.url).pathname);
    upstreamHeaders.set("x-abos-original-method", request.method);
    upstreamHeaders.set("x-request-id", requestId);
    upstreamHeaders.delete("host");

    const upstream = await fetch(env.ABOS_UPSTREAM_URL, {
      method: request.method,
      headers: upstreamHeaders,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });
    const headers = new Headers(upstream.headers);
    headers.set("x-request-id", requestId);
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};