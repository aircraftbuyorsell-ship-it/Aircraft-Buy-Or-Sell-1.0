// Public OAuth 2.1 Authorization Server Metadata (RFC 8414) + Protected
// Resource Metadata (RFC 9728). MCP clients (Claude.ai, ChatGPT) fetch this
// to discover how to connect without any manual configuration.
//
// All URLs point at the public gateway (abos-widget-gateway), not at this
// Base44 function directly - the gateway is what external clients actually
// talk to, and proxies these paths through to the abosOAuth* functions.
const GATEWAY_BASE = 'https://abos-widget-gateway.aircraftbuyorsell.workers.dev';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (url.searchParams.get('resource') === 'protected') {
    return Response.json({
      resource: `${GATEWAY_BASE}/mcp`,
      authorization_servers: [GATEWAY_BASE],
      scopes_supported: ['search:read', 'intelligence:read', 'listing:read', 'listing:write'],
      bearer_methods_supported: ['header'],
    }, { headers: corsHeaders });
  }

  return Response.json({
    issuer: GATEWAY_BASE,
    authorization_endpoint: `${GATEWAY_BASE}/oauth/authorize`,
    token_endpoint: `${GATEWAY_BASE}/oauth/token`,
    registration_endpoint: `${GATEWAY_BASE}/oauth/register`,
    scopes_supported: ['search:read', 'intelligence:read', 'listing:read', 'listing:write'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  }, { headers: corsHeaders });
});
