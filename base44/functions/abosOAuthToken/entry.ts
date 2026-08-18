// OAuth 2.1 token endpoint - authorization_code + PKCE only (no client
// secret: these are public clients). On success this auto-provisions a
// scoped ApiKey for the approving user and hands it back AS the access
// token, so it plugs straight into abosCoreApi's existing `x-abos-key`
// auth path with zero new validation logic there. The key has no
// expiry - "logging out" is just revoking it from the Core API panel,
// same as any manually-created key.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Base64Url(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  let binary = '';
  for (const byte of new Uint8Array(hash)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function tokenError(status, error, description) {
  return Response.json({ error, error_description: description }, {
    status,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return tokenError(405, 'invalid_request', 'Use POST');

  let params;
  const contentType = req.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    params = await req.json().catch(() => ({}));
  } else {
    const form = await req.formData().catch(() => null);
    params = form ? Object.fromEntries(form.entries()) : {};
  }

  if (params.grant_type !== 'authorization_code') {
    return tokenError(400, 'unsupported_grant_type', "Only 'authorization_code' is supported");
  }
  const { code, redirect_uri, client_id, code_verifier } = params;
  if (!code || !redirect_uri || !client_id || !code_verifier) {
    return tokenError(400, 'invalid_request', 'code, redirect_uri, client_id and code_verifier are required');
  }

  const base44 = createClientFromRequest(req);

  const clients = await base44.asServiceRole.entities.OAuthClient.filter({ client_id }, undefined, 1);
  const client = clients[0];
  if (!client) return tokenError(400, 'invalid_client', 'Unknown client_id');

  const codeHash = await sha256(code);
  const codes = await base44.asServiceRole.entities.OAuthAuthorizationCode.filter({ code_hash: codeHash }, undefined, 1);
  const authCode = codes[0];
  if (!authCode) return tokenError(400, 'invalid_grant', 'Unknown or already-exchanged code');
  if (authCode.used) return tokenError(400, 'invalid_grant', 'This code has already been used');
  if (new Date(authCode.expires_at) < new Date()) return tokenError(400, 'invalid_grant', 'Code has expired');
  if (authCode.client_id !== client_id) return tokenError(400, 'invalid_grant', 'client_id mismatch');
  if (authCode.redirect_uri !== redirect_uri) return tokenError(400, 'invalid_grant', 'redirect_uri mismatch');

  const expectedChallenge = await sha256Base64Url(code_verifier);
  if (expectedChallenge !== authCode.code_challenge) {
    return tokenError(400, 'invalid_grant', 'PKCE verification failed');
  }

  // Single-use: mark it burned before minting anything, so a retry (or a
  // stolen code replayed by an attacker) can never mint a second key.
  await base44.asServiceRole.entities.OAuthAuthorizationCode.update(authCode.id, { used: true });

  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const plaintext = `abos_live_${secret}`;
  const keyHash = await sha256(plaintext);

  // ApiKey.name caps at 100 chars but OAuthClient.client_name allows up to
  // 200 - truncate so a long client name can't blow the limit after the
  // code has already been burned, which would strand the exchange.
  const connectedSuffix = ` (Connected ${new Date().toISOString().slice(0, 10)})`;
  const maxClientNameLen = 100 - connectedSuffix.length;
  const truncatedClientName = client.client_name.length > maxClientNameLen
    ? `${client.client_name.slice(0, maxClientNameLen - 1)}…`
    : client.client_name;

  await base44.asServiceRole.entities.ApiKey.create({
    owner_email: authCode.user_email,
    name: `${truncatedClientName}${connectedSuffix}`,
    key_prefix: plaintext.slice(0, 16) + '…',
    key_hash: keyHash,
    scopes: authCode.scopes,
    plan: 'free',
    status: 'active',
    request_count: 0,
    oauth_client_name: client.client_name,
  });

  return Response.json({
    access_token: plaintext,
    token_type: 'bearer',
    scope: authCode.scopes.join(' '),
  }, { headers: corsHeaders });
});
