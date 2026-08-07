// Cloudflare Worker gateway for ABOS.
//
// Two routes, two different trust models:
//
//   /mcp   -> Base44 MCP endpoint. Callers are MCP clients (Claude Desktop,
//             Cursor, agents), NOT browsers. They send no Origin header, so
//             the CORS allowlist cannot apply here. Auth is a Bearer token
//             compared in constant time. Responses may be SSE and are
//             streamed through unbuffered.
//
//   /*     -> Legacy widget path. Browser callers. Origin allowlist + injected
//             GATEWAY_SECRET, forwarded to the widgetGateway function.
//             Behaviour unchanged.

const MCP_ACCEPT = 'application/json, text/event-stream';

import { handleOmvm, handleAtiScore } from './ati.js';
import { aplToolList, isAplTool, callAplTool } from './apl.js';

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

async function handleMcp(request, env, baseUrl) {
  if (!env.MCP_BEARER_TOKEN) {
    return json({ error: 'mcp_disabled' }, 503);
  }

  if (!['POST', 'GET', 'DELETE'].includes(request.method)) {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST, GET, DELETE' });
  }

  const presented = bearerFrom(request);
  if (!(await timingSafeEqual(presented, env.MCP_BEARER_TOKEN))) {
    return json({ error: 'unauthorized' }, 401, {
      'WWW-Authenticate': 'Bearer realm="abos-mcp"',
    });
  }

  const upstreamHeaders = new Headers();
  // Base44 rejects requests that don't advertise both JSON and SSE (406).
  upstreamHeaders.set('Accept', request.headers.get('Accept') || MCP_ACCEPT);
  upstreamHeaders.set('x-gateway-secret', env.GATEWAY_SECRET || '');

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

  const upstreamResponse = await fetch(`${baseUrl}/functions/widgetGateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-secret': env.GATEWAY_SECRET || '',
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

export default {
  async fetch(request, env) {
    if (!env.BASE44_APP_BASE_URL) {
      return json({ error: 'gateway_misconfigured' }, 500);
    }
    const baseUrl = env.BASE44_APP_BASE_URL.replace(/\/$/, '');
    const { pathname } = new URL(request.url);

    if (pathname === '/mcp' || pathname.startsWith('/mcp/')) {
      return handleMcp(request, env, baseUrl);
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
