import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns an OpenSky Network access token using platform secrets.
 * Called from the frontend SkyBoss page instead of hardcoding client credentials.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — any logged-in user can get a token
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('OPENSKY_CLIENT_ID');
    const clientSecret = Deno.env.get('OPENSKY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'OpenSky credentials not configured' }, { status: 500 });
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `OpenSky auth failed: ${res.status}`, detail: text }, { status: 502 });
    }

    const data = await res.json();
    return Response.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});