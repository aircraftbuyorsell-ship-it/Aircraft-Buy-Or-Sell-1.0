// Cloudflare Worker gateway for ABOS.
//
// Routes, and their trust models:
//
//   /mcp   -> Two callers share this path, told apart by which bearer token
//             shows up:
//               - the static MCP_BEARER_TOKEN (personal/service use) forwards
//                 to Base44's native MCP endpoint, unchanged from before.
//               - a per-user `abos_live_...` key (see /oauth/*) is served
//                 locally by handleCoreMcp, which maps MCP tool calls onto
//                 the scoped abosCoreApi REST surface.
//             Callers are MCP clients (Claude Desktop, Cursor, ChatGPT,
//             agents), NOT browsers - no Origin header, so the CORS
//             allowlist below does not apply here.
//
//   /oauth/*, /.well-known/oauth-* -> OAuth 2.1 + PKCE "Connect to ABOS"
//             flow so platform users can authorize an MCP client with their
//             own ABOS login instead of copy-pasting an API key. Mostly
//             thin proxies to Base44 functions; /oauth/authorize redirects
//             to the actual consent page (a Base44 app route, since it needs
//             the user's browser session).
//
//   /*     -> Legacy widget path. Browser callers. Origin allowlist + injected
//             GATEWAY_SECRET, forwarded to the widgetGateway function.
//             Behaviour unchanged.

const MCP_ACCEPT = 'application/json, text/event-stream';

import { handleOmvm, handleAtiScore } from './ati.js';
import { aplToolList, isAplTool, callAplTool } from './apl.js';
import { ABOS_ICON_SVG, ABOS_ICON_PNG_BYTES } from './icon.js';

// Base44's MCP transport answers in SSE even for plain JSON-RPC, so anything
// read back from upstream has to come out of `data:` frames.
function parseSseJson(text) {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload) continue;
    try {
      return JSON.parse(payload);
    } catch {
      /* keep scanning */
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function upstreamTools(baseUrl, headers) {
  try {
    const res = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 'tools', method: 'tools/list', params: {} }),
    });
    const parsed = parseSseJson(await res.text());
    return parsed?.result?.tools || [];
  } catch {
    return [];
  }
}

// APL sits above MCP: tools declared by an ADL manifest are served here, the
// Base44 entity readers still come from upstream, and tools/list merges the
// two so a client sees a single server.
async function interceptApl(bodyText, env, baseUrl, upstreamHeaders) {
  let rpc;
  try {
    rpc = JSON.parse(bodyText);
  } catch {
    return null;
  }
  if (!rpc || Array.isArray(rpc)) return null;

  if (rpc.method === 'tools/list') {
    const merged = [...aplToolList(), ...(await upstreamTools(baseUrl, upstreamHeaders))];
    return json({ jsonrpc: '2.0', id: rpc.id, result: { tools: merged } });
  }

  if (rpc.method === 'tools/call' && isAplTool(rpc.params?.name)) {
    const outcome = await callAplTool(rpc.params.name, rpc.params.arguments || {}, env, baseUrl);
    const payload = outcome.error || outcome.result;
    return json({
      jsonrpc: '2.0',
      id: rpc.id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        isError: !!outcome.error,
      },
    });
  }

  return null;
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// Base44 functions do not always fail in JSON. A function timeout or an
// unhandled runtime fault comes back as an HTML or plain-text error page,
// and `await res.json()` on that throws. Reading the body as text first
// keeps the upstream status, content type and a body snippet alive in the
// error we hand back, instead of flattening every distinct failure into one
// opaque "Invalid upstream response" with nothing to debug from.
async function readUpstreamJson(upstream, label) {
  const text = await upstream.text();
  try {
    return { ok: true, payload: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      payload: {
        status: 'error',
        error: {
          code: 'upstream_not_json',
          message: `${label} returned HTTP ${upstream.status} with a non-JSON body — `
            + 'usually a function timeout or an unhandled runtime error upstream.',
          upstream_status: upstream.status,
          upstream_content_type: upstream.headers.get('Content-Type') || null,
          body_snippet: text.slice(0, 300),
        },
      },
    };
  }
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

// Hash both sides before comparing so neither the token contents nor its
// length leak through timing.
async function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function bearerFrom(request) {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

// Thin MCP tool -> abosCoreApi endpoint map. Kept in lockstep with
// base44/functions/abosOpenApiSpec, which describes the same surface for
// ChatGPT's OpenAPI-based Actions.
const CORE_TOOLS = [
  {
    name: 'search',
    endpoint: 'search',
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    description: 'Chat-first natural language aircraft search across active marketplace listings.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: { query: { type: 'string', description: 'e.g. "Citation Latitude under 8M USD in Europe"' } },
    },
  },
  {
    name: 'valuate',
    endpoint: 'valuate',
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      // OMVM v5 supplements internal comps with a live grounded web market
      // search, so this one genuinely reaches outside the closed dataset.
      openWorldHint: true,
      destructiveHint: false,
    },
    description: 'OMVM market valuation for a given aircraft manufacturer/model/year/hours.',
    inputSchema: {
      type: 'object',
      required: ['manufacturer', 'model'],
      properties: {
        manufacturer: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'number' },
        hours: { type: 'number' },
      },
    },
  },
  {
    name: 'extract_listing_intelligence',
    endpoint: 'intelligence.extract',
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    description: 'Extract a structured aircraft listing from unstructured text (e.g. a Facebook post).',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: { text: { type: 'string' } },
    },
  },
  {
    name: 'get_listing',
    endpoint: 'listings.get',
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    description: 'Fetch a single marketplace listing by id.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  },
  {
    name: 'list_listings',
    endpoint: 'listings.list',
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    description: 'List/filter active marketplace listings.',
    inputSchema: {
      type: 'object',
      properties: {
        manufacturer: { type: 'string' },
        model: { type: 'string' },
        max_price: { type: 'number' },
        limit: { type: 'number', maximum: 50 },
      },
    },
  },
  {
    name: 'report_checkout',
    endpoint: 'report.checkout',
    annotations: {
      // Creates a Stripe Checkout session — no local state changes, but it
      // does reach out to Stripe, so it isn't a closed-world read.
      readOnlyHint: false,
      idempotentHint: false,
      openWorldHint: true,
      destructiveHint: false,
    },
    description: 'Buy ATI Full Report credits via Stripe Checkout. Returns a checkout_url. Requires the report:paid scope.',
    inputSchema: {
      type: 'object',
      properties: {
        credits: { type: 'number', description: 'Number of report credits to buy (1-100). Defaults to 1.' },
        success_url: { type: 'string' },
        cancel_url: { type: 'string' },
      },
    },
  },
  {
    name: 'report_get',
    endpoint: 'report.get',
    annotations: {
      // Spends a purchased credit, so it is a real state change even though
      // it only reads aircraft data to produce the report.
      readOnlyHint: false,
      idempotentHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
    description: 'Generate the full 8-dimension ATI report for an aircraft, spending one report credit. Returns payment_required (with a checkout_endpoint) if no credits remain. Requires the report:paid scope.',
    inputSchema: {
      type: 'object',
      required: ['aircraft_data'],
      properties: {
        aircraft_data: { type: 'string', description: 'Free-text listing or spec dump for the aircraft.' },
        registration: { type: 'string' },
      },
    },
  },
  {
    name: 'create_listing',
    endpoint: 'listings.create',
    annotations: {
      // The only writer on this surface. It creates a draft/private listing,
      // so it adds state but never overwrites or removes any.
      readOnlyHint: false,
      idempotentHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
    description: 'Create a new marketplace listing.',
    inputSchema: {
      type: 'object',
      required: ['manufacturer', 'model'],
      properties: {
        manufacturer: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'number' },
        registration: { type: 'string' },
        price: { type: 'number' },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CZK', 'CHF'] },
        hours: { type: 'number' },
        source_url: { type: 'string' },
      },
    },
  },
];

function rpcResult(id, result) {
  return json({ jsonrpc: '2.0', id, result });
}

function rpcError(id, code, message) {
  return json({ jsonrpc: '2.0', id, error: { code, message } });
}

// APL-served tools that the per-user OAuth path is allowed to expose, and the
// scope each one needs. These execute inside the worker using GATEWAY_SECRET,
// which means they bypass abosCoreApi's own requireScope() checks entirely —
// so the gate has to live here, against the calling key's granted scopes.
//
// abos_partner_status is deliberately absent. It is gated on a partner
// presenting their own embed_token, and no marketplace scope in VALID_SCOPES
// could ever legitimately grant it, so it stays on the static-token path.
const APL_SCOPE = {
  abos_omvm_value: 'intelligence:read',
  abos_ati_score: 'intelligence:read',
  abos_deal_radar: 'listing:read',
  abos_faa_registry: 'listing:read',
};

// Resolves what the calling abos_live_... key is actually allowed to do.
// Fails closed: any error yields no scopes, so an APL tool is refused rather
// than run unchecked.
async function callerScopes(baseUrl, apiKey) {
  let upstream;
  try {
    upstream = await fetch(`${baseUrl}/functions/abosCoreApi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-abos-key': apiKey },
      body: JSON.stringify({ endpoint: 'whoami', params: {} }),
    });
  } catch {
    return { revoked: false, scopes: [] };
  }
  if (upstream.status === 401) return { revoked: true, scopes: [] };
  const { ok, payload } = await readUpstreamJson(upstream, 'abosCoreApi whoami');
  if (!ok || payload.status === 'error') return { revoked: false, scopes: [] };
  return { revoked: false, scopes: payload.data?.scopes || [] };
}

// Serves MCP for callers authenticated with a per-user abos_live_... key
// (see /oauth/token). Every tool call is a straight passthrough to
// abosCoreApi with that key as x-abos-key - abosCoreApi already owns scope
// checks, rate limiting and auditing, so there is nothing to duplicate here.
async function handleCoreMcp(request, env, baseUrl, apiKey, gatewayOrigin) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
  }

  let rpc;
  try {
    rpc = JSON.parse(await request.text());
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }
  if (!rpc || Array.isArray(rpc)) return rpcError(null, -32600, 'Invalid request');

  // JSON-RPC notifications are identified by the absence of `id`, not by
  // method name, and must never get a response body - regardless of which
  // notification method it is (notifications/initialized, .../cancelled, ...).
  if (!('id' in rpc)) {
    return new Response(null, { status: 202 });
  }
  if (rpc.method === 'ping') {
    return rpcResult(rpc.id, {});
  }

  if (rpc.method === 'initialize') {
    return rpcResult(rpc.id, {
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: {
        name: 'abos-marketspace',
        title: 'ABOS MarketSpace',
        version: '1.1.0',
        // Served from this worker (see /icon.png and /icon.svg below) rather
        // than from media.base44.com, so the icon survives anything that
        // happens to the app's published domain. PNG first — clients that
        // decline remote SVG still get a mark.
        icons: [
          { src: `${gatewayOrigin}/icon.png`, mimeType: 'image/png', sizes: ['256x256'] },
          { src: `${gatewayOrigin}/icon.svg`, mimeType: 'image/svg+xml', sizes: ['any'] },
        ],
      },
    });
  }

  if (rpc.method === 'tools/list') {
    // The APL surface used to be visible only on the static-token path, which
    // meant no OAuth user ever saw Deal Radar, the FAA registry lookup or the
    // ATI scorer. Merge both surfaces so one connection sees one server.
    const core = CORE_TOOLS.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations }));
    const apl = aplToolList().filter((t) => Object.prototype.hasOwnProperty.call(APL_SCOPE, t.name));
    return rpcResult(rpc.id, { tools: [...core, ...apl] });
  }

  if (rpc.method === 'tools/call') {
    const toolName = rpc.params?.name;

    // A dead/revoked key needs to surface as a real 401 so the MCP client
    // knows to restart the OAuth flow, not as a 200 the client has to
    // inspect to discover auth failed.
    const unauthorized = () => json({ error: 'unauthorized' }, 401, {
      'WWW-Authenticate': `Bearer realm="abos-mcp", resource_metadata="${gatewayOrigin}/.well-known/oauth-protected-resource"`,
    });

    const toolError = (body) => rpcResult(rpc.id, {
      content: [{ type: 'text', text: JSON.stringify(body, null, 2) }],
      isError: true,
    });

    // ── APL-served tools: scope-gated, then executed in-worker ──
    if (isAplTool(toolName)) {
      const needed = APL_SCOPE[toolName];
      if (!needed) {
        return rpcError(rpc.id, -32602, `Tool not available on this connection: ${toolName}`);
      }
      const { revoked, scopes } = await callerScopes(baseUrl, apiKey);
      if (revoked) return unauthorized();
      if (!scopes.includes('*') && !scopes.includes(needed)) {
        return toolError({
          status: 'error',
          error: {
            code: 'insufficient_scope',
            message: `${toolName} requires the '${needed}' scope.`,
            granted: scopes,
          },
        });
      }
      const outcome = await callAplTool(toolName, rpc.params?.arguments || {}, env, baseUrl);
      const payload = outcome.error || outcome.result;
      return rpcResult(rpc.id, {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        isError: !!outcome.error,
      });
    }

    // ── Core tools: straight passthrough to abosCoreApi ──
    const tool = CORE_TOOLS.find((t) => t.name === toolName);
    if (!tool) return rpcError(rpc.id, -32602, `Unknown tool: ${toolName}`);

    let upstream;
    try {
      upstream = await fetch(`${baseUrl}/functions/abosCoreApi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-abos-key': apiKey },
        body: JSON.stringify({ endpoint: tool.endpoint, params: rpc.params?.arguments || {} }),
      });
    } catch (err) {
      return toolError({
        status: 'error',
        error: {
          code: 'upstream_unreachable',
          message: `Could not reach abosCoreApi for '${tool.endpoint}': ${err.message}`,
        },
      });
    }

    if (upstream.status === 401) return unauthorized();

    const { payload } = await readUpstreamJson(upstream, `abosCoreApi '${tool.endpoint}'`);
    return rpcResult(rpc.id, {
      content: [{ type: 'text', text: JSON.stringify(payload.data ?? payload.error ?? payload, null, 2) }],
      isError: payload.status === 'error',
    });
  }

  return rpcError(rpc.id ?? null, -32601, `Method not found: ${rpc.method}`);
}

async function handleMcp(request, env, baseUrl, gatewayOrigin) {
  if (!['POST', 'GET', 'DELETE'].includes(request.method)) {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST, GET, DELETE' });
  }

  const presented = bearerFrom(request);

  if (env.MCP_BEARER_TOKEN && presented && (await timingSafeEqual(presented, env.MCP_BEARER_TOKEN))) {
    return handleLegacyMcp(request, env, baseUrl);
  }

  if (presented && presented.startsWith('abos_live_')) {
    return handleCoreMcp(request, env, baseUrl, presented, gatewayOrigin);
  }

  return json({ error: 'unauthorized' }, 401, {
    'WWW-Authenticate': `Bearer realm="abos-mcp", resource_metadata="${gatewayOrigin}/.well-known/oauth-protected-resource"`,
  });
}

// Static-token path: forwards to Base44's own native MCP endpoint
// (currently exposes no entity operations - kept for whatever it grows
// into, and for callers who already depend on MCP_BEARER_TOKEN).
async function handleLegacyMcp(request, env, baseUrl) {
  // A missing binding used to fall through as an empty header, which Base44
  // rejects identically to a wrong secret: an indistinguishable 401. Fail
  // loudly here instead of forwarding a request that can never succeed.
  if (!env.GATEWAY_SECRET) {
    return json({ error: 'gateway_secret_not_configured' }, 500);
  }

  const upstreamHeaders = new Headers();
  // Base44 rejects requests that don't advertise both JSON and SSE (406).
  upstreamHeaders.set('Accept', request.headers.get('Accept') || MCP_ACCEPT);
  upstreamHeaders.set('x-gateway-secret', env.GATEWAY_SECRET);

  for (const name of ['Content-Type', 'Mcp-Session-Id', 'MCP-Protocol-Version', 'Last-Event-ID']) {
    const value = request.headers.get(name);
    if (value) upstreamHeaders.set(name, value);
  }

  // JSON-RPC payloads are small; buffering avoids duplex-stream edge cases.
  const body = request.method === 'POST' ? await request.text() : undefined;

  if (body) {
    const handled = await interceptApl(body, env, baseUrl, upstreamHeaders);
    if (handled) return handled;
  }

  let upstream;
  try {
    upstream = await fetch(`${baseUrl}/api/mcp`, {
      method: request.method,
      headers: upstreamHeaders,
      body,
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable' }, 502);
  }

  const responseHeaders = new Headers();
  responseHeaders.set(
    'Content-Type',
    upstream.headers.get('Content-Type') || 'application/json'
  );
  responseHeaders.set('Cache-Control', 'no-store');
  for (const name of ['Mcp-Session-Id', 'MCP-Protocol-Version']) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  // Stream the body rather than awaiting .text() so SSE responses stay live.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

async function handleWidget(request, env, baseUrl) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const originAllowed = allowedOrigins.includes(origin);

  const corsHeaders = originAllowed
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      }
    : {};

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: originAllowed ? 204 : 403, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, corsHeaders);
  }

  if (!originAllowed) {
    return json({ error: 'origin_not_allowed' }, 403);
  }

  // A missing binding used to fall through as an empty header, which Base44
  // rejects identically to a wrong secret: an indistinguishable 401. Fail
  // loudly here instead of forwarding a request that can never succeed.
  if (!env.GATEWAY_SECRET) {
    return json({ error: 'gateway_secret_not_configured' }, 500, corsHeaders);
  }

  const upstreamResponse = await fetch(`${baseUrl}/functions/widgetGateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-secret': env.GATEWAY_SECRET,
      'x-widget-origin': origin,
    },
    body: await request.text(),
  });

  const responseBody = await upstreamResponse.text();
  return new Response(responseBody, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json',
      ...corsHeaders,
    },
  });
}

// OAuth 2.1 + PKCE "Connect to ABOS" flow. Everything here is a thin proxy
// to Base44 functions except /authorize, which is a browser-navigable page
// (needs the user's login session) and so gets redirected to the actual
// Base44 app route instead of being fetched server-side.
async function handleOAuth(request, env, baseUrl, pathname, url) {
  if (pathname === '/.well-known/oauth-authorization-server' || pathname === '/.well-known/oauth-protected-resource') {
    const resourceParam = pathname.endsWith('protected-resource') ? '?resource=protected' : '';
    const upstream = await fetch(`${baseUrl}/functions/abosOAuthMetadata${resourceParam}`);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (pathname === '/oauth/authorize') {
    const dest = new URL(`${baseUrl}/oauth-authorize`);
    dest.search = url.search;
    return Response.redirect(dest.toString(), 302);
  }

  if (pathname === '/oauth/register' || pathname === '/oauth/token') {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    const fnName = pathname === '/oauth/register' ? 'abosOAuthRegister' : 'abosOAuthToken';
    const upstream = await fetch(`${baseUrl}/functions/${fnName}`, {
      method: request.method,
      headers: { 'Content-Type': request.headers.get('Content-Type') || 'application/json' },
      body: request.method === 'POST' ? await request.text() : undefined,
    });
    const responseHeaders = { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json', 'Access-Control-Allow-Origin': '*' };
    // /oauth/token responses carry a live abos_live_... credential - RFC 6749
    // 5.1 requires these not be cached by any intermediary.
    if (pathname === '/oauth/token') {
      responseHeaders['Cache-Control'] = 'no-store';
      responseHeaders['Pragma'] = 'no-cache';
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  }

  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(request, env) {
    if (!env.BASE44_APP_BASE_URL) {
      return json({ error: 'gateway_misconfigured' }, 500);
    }
    const baseUrl = env.BASE44_APP_BASE_URL.replace(/\/$/, '');
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/oauth/authorize' || pathname === '/oauth/register' || pathname === '/oauth/token'
      || pathname === '/.well-known/oauth-authorization-server' || pathname === '/.well-known/oauth-protected-resource') {
      return handleOAuth(request, env, baseUrl, pathname, url);
    }

    if (pathname === '/mcp' || pathname.startsWith('/mcp/')) {
      return handleMcp(request, env, baseUrl, `${url.protocol}//${url.host}`);
    }

    // Brand mark for serverInfo.icons. Public and cacheable — an MCP client
    // fetches these unauthenticated, before any token exists.
    if (pathname === '/icon.svg' || pathname === '/icon.png') {
      const isSvg = pathname === '/icon.svg';
      return new Response(isSvg ? ABOS_ICON_SVG : ABOS_ICON_PNG_BYTES, {
        headers: {
          'Content-Type': isSvg ? 'image/svg+xml; charset=utf-8' : 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ATI / OMVM — replaces the n8n ATI Score Pipeline. POST only; these are
    // machine endpoints, not browser ones, so the CORS allowlist below does
    // not apply to them.
    if (pathname === '/omvm' || pathname === '/ati/score') {
      if (request.method !== 'POST') {
        return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
      }
      const presented = bearerFrom(request);
      if (!env.MCP_BEARER_TOKEN || !(await timingSafeEqual(presented, env.MCP_BEARER_TOKEN))) {
        return json({ error: 'unauthorized' }, 401, {
          'WWW-Authenticate': 'Bearer realm="abos-ati"',
        });
      }
      return pathname === '/omvm'
        ? handleOmvm(request, env, baseUrl)
        : handleAtiScore(request, env, baseUrl);
    }

    return handleWidget(request, env, baseUrl);
  },
};