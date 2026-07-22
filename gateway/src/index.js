// Cloudflare Worker gateway in front of the Base44 widgetGateway function.
// Locks down CORS to CORS_ALLOWED_ORIGINS and injects GATEWAY_SECRET /
// x-widget-origin so Base44 can trust the caller and enforce per-partner
// domain checks.
export default {
  async fetch(request, env) {
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
          'Vary': 'Origin',
        }
      : {};

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: originAllowed ? 204 : 403, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!originAllowed) {
      return new Response(JSON.stringify({ error: 'origin_not_allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.BASE44_APP_BASE_URL) {
      return new Response(JSON.stringify({ error: 'gateway_misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const upstreamUrl = `${env.BASE44_APP_BASE_URL.replace(/\/$/, '')}/functions/widgetGateway`;
    const body = await request.text();

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gateway-secret': env.GATEWAY_SECRET || '',
        'x-widget-origin': origin,
      },
      body,
    });

    const responseBody = await upstreamResponse.text();
    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json',
        ...corsHeaders,
      },
    });
  },
};
