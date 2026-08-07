// OAuth 2.0 Dynamic Client Registration (RFC 7591) - public endpoint.
// Lets MCP clients (Claude.ai, ChatGPT) register themselves automatically
// instead of requiring a manually-issued client_id. Issues public clients
// only (PKCE, no client_secret) since these are browser/agent-driven flows
// that cannot keep a secret confidential.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return Response.json({ error: 'invalid_request', error_description: 'Use POST' }, { status: 405, headers: corsHeaders });
  }

  let body = {};
  try { body = await req.json(); } catch { /* empty body */ }

  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  if (!redirectUris.length || !redirectUris.every(isHttpUrl)) {
    return Response.json({
      error: 'invalid_redirect_uri',
      error_description: 'redirect_uris must be a non-empty array of https:// URLs',
    }, { status: 400, headers: corsHeaders });
  }

  const clientName = (body.client_name || 'Unnamed MCP client').toString().slice(0, 200);

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const clientId = 'oac_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

  const base44 = createClientFromRequest(req);
  await base44.asServiceRole.entities.OAuthClient.create({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    registered_via: 'dynamic',
  });

  return Response.json({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code'],
    response_types: ['code'],
  }, { status: 201, headers: corsHeaders });
});
