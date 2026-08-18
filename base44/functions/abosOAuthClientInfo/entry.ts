// Public, read-only lookup so the consent screen can show a human name
// ("Claude wants to connect...") instead of a raw client_id. No secrets.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  if (!clientId) return Response.json({ error: 'missing_client_id' }, { status: 400, headers: corsHeaders });

  const base44 = createClientFromRequest(req);
  const clients = await base44.asServiceRole.entities.OAuthClient.filter({ client_id: clientId }, undefined, 1);
  const client = clients[0];
  if (!client) return Response.json({ error: 'invalid_client' }, { status: 404, headers: corsHeaders });

  return Response.json({
    client_id: client.client_id,
    client_name: client.client_name,
    redirect_uris: client.redirect_uris,
  }, { headers: corsHeaders });
});
