// Issues a short-lived, single-use authorization code after the logged-in
// user approves the consent screen (src/pages/OAuthAuthorize.jsx). Requires
// an authenticated Base44 session - this is the step that ties the eventual
// access token to a real ABOS user.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_SCOPES = ['listing:read', 'listing:write', 'search:read', 'intelligence:read'];
const CODE_TTL_MS = 2 * 60 * 1000; // authorization codes are meant to be exchanged immediately

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return Response.json({ error: 'invalid_request' }, { status: 405, headers: corsHeaders });
  }

  const base44 = createClientFromRequest(req);
  let user = null;
  try { user = await base44.auth.me(); } catch { /* not logged in */ }
  if (!user) return Response.json({ error: 'login_required' }, { status: 401, headers: corsHeaders });

  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const { client_id, redirect_uri, code_challenge, code_challenge_method } = body;
  const requestedScopes = Array.isArray(body.scope) ? body.scope : String(body.scope || '').split(/\s+/).filter(Boolean);

  if (!client_id || !redirect_uri || !code_challenge) {
    return Response.json({ error: 'invalid_request', error_description: 'client_id, redirect_uri and code_challenge are required' }, { status: 400, headers: corsHeaders });
  }
  if (code_challenge_method !== 'S256') {
    return Response.json({ error: 'invalid_request', error_description: 'Only S256 PKCE is supported' }, { status: 400, headers: corsHeaders });
  }

  const clients = await base44.asServiceRole.entities.OAuthClient.filter({ client_id }, undefined, 1);
  const client = clients[0];
  if (!client) return Response.json({ error: 'invalid_client' }, { status: 400, headers: corsHeaders });
  if (!client.redirect_uris.includes(redirect_uri)) {
    return Response.json({ error: 'invalid_redirect_uri' }, { status: 400, headers: corsHeaders });
  }

  const scopes = requestedScopes.filter((s) => VALID_SCOPES.includes(s));
  if (!scopes.length) {
    return Response.json({ error: 'invalid_scope', error_description: `Valid scopes: ${VALID_SCOPES.join(', ')}` }, { status: 400, headers: corsHeaders });
  }

  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const code = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const codeHash = await sha256(code);

  await base44.asServiceRole.entities.OAuthAuthorizationCode.create({
    code_hash: codeHash,
    user_email: user.email,
    client_id,
    redirect_uri,
    code_challenge,
    scopes,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    used: false,
  });

  return Response.json({ code, client_name: client.client_name }, { headers: corsHeaders });
});
