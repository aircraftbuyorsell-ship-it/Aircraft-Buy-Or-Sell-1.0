/**
 * ABOS Core API Gateway — Cloudflare Worker
 *
 * Public entry point for ABOS Core API v1 (architecture/AD-026-api-deployment-boundary.md).
 * base44/functions/abosCoreApiV1/entry.ts refuses every request that doesn't carry
 * X-ABOS-Gateway-Secret, so it can't be called directly from the internet — this
 * Worker is the only thing that's supposed to hold that secret and add it.
 *
 * Request shape in:  METHOD https://api.abos.group/api/v1/search  (public contract, openapi/abos-core-api-v1.yaml)
 * Request shape out: POST https://<app>.base44.app/functions/abosCoreApiV1
 *                     headers: X-ABOS-Gateway-Secret, X-ABOS-Original-Path, X-ABOS-Original-Method
 *                     (see base44/functions/abosCoreApiV1/entry.ts lines 74-79 for the receiving side)
 *
 * Required Worker configuration (see wrangler.toml + README in this directory):
 *   secret  GATEWAY_SECRET        — shared with ABOS_GATEWAY_SHARED_SECRET on the Base44 side
 *   var     BASE44_APP_BASE_URL   — e.g. https://abos-0-8-intrazone-XXXXXXXX.base44.app
 *   var     CORS_ALLOWED_ORIGINS  — comma-separated, mirrors ABOS_CORS_ALLOWED_ORIGINS on the Base44 side
 *
 * This Worker does not implement business logic, auth, or validation itself —
 * all of that lives in abosCoreApiV1 and is already tested there. This is
 * transport only: TLS termination, secret injection, path rewrite, CORS.
 */

const ALLOWED_METHODS = new Set(['GET', 'POST', 'OPTIONS']);

function corsHeaders(origin, allowedOrigins) {
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type, X-ABOS-API-Key, X-Request-ID',
    vary: 'Origin',
  };
}

function jsonError(status, code, message, extraHeaders = {}) {
  return new Response(
    JSON.stringify({ error: { code, message, request_id: null, details: {}, documentation_url: null } }),
    { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders } },
  );
}

export function buildUpstreamRequest(request, env) {
  const url = new URL(request.url);
  const upstreamUrl = `${env.BASE44_APP_BASE_URL.replace(/\/$/, '')}/functions/abosCoreApiV1`;

  const headers = new Headers(request.headers);
  headers.set('x-abos-gateway-secret', env.GATEWAY_SECRET);
  headers.set('x-abos-original-path', url.pathname + url.search);
  headers.set('x-abos-original-method', request.method);
  // Host/connection-level headers must not be forwarded verbatim to a different origin.
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('x-forwarded-for');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return new Request(upstreamUrl, {
    method: 'POST', // Base44 function invocation is always POST; the real method/path travel in headers above.
    headers,
    body: hasBody ? request.body : undefined,
    // Required by the Fetch spec whenever body is a stream (Workers and modern
    // Node's fetch both support this); safe to always set when there is a body.
    ...(hasBody ? { duplex: 'half' } : {}),
  });
}

export default {
  async fetch(request, env) {
    if (!env.GATEWAY_SECRET) return jsonError(503, 'GATEWAY_NOT_CONFIGURED', 'GATEWAY_SECRET is not set on this Worker.');
    if (!env.BASE44_APP_BASE_URL) return jsonError(503, 'GATEWAY_NOT_CONFIGURED', 'BASE44_APP_BASE_URL is not set on this Worker.');

    const allowedOrigins = (env.CORS_ALLOWED_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean);
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!ALLOWED_METHODS.has(request.method)) {
      return jsonError(405, 'METHOD_NOT_ALLOWED', `${request.method} is not supported.`, cors);
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/v1/')) {
      return jsonError(404, 'ROUTE_NOT_FOUND', 'The requested API route was not found.', cors);
    }

    const upstreamRequest = buildUpstreamRequest(request, env);
    const upstreamResponse = await fetch(upstreamRequest);

    const responseHeaders = new Headers(upstreamResponse.headers);
    Object.entries(cors).forEach(([key, value]) => responseHeaders.set(key, value));

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  },
};
