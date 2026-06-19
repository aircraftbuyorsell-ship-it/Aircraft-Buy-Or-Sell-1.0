import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URL = 'https://api.ai-analytics.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { airman_id, airman_type, state, city, name } = body;

    // ── Single airman lookup ──
    if (airman_id) {
      const url = `${BASE_URL}/airman/${encodeURIComponent(airman_id)}.json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': 'application/json' }
      });
      if (!res.ok) {
        return Response.json({
          error: 'Airman not found',
          airman_id,
          status: res.status
        }, { status: 404 });
      }
      const data = await res.json();
      return Response.json({
        source: 'ai_analytics_airmen',
        data,
        fetched_at: new Date().toISOString(),
        status: 'success'
      });
    }

    // ── Recent airmen list ──
    const listUrl = `${BASE_URL}/api/v1/faa/airmen/recent`;
    const listRes = await fetch(listUrl, {
      headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': 'application/json' }
    });
    if (!listRes.ok) {
      return Response.json({ error: `AI Analytics API returned ${listRes.status}` }, { status: 502 });
    }

    const listData = await listRes.json();
    let items = listData.items || [];

    // ── Optional filtering (client-side since API has no search params) ──
    if (airman_type) {
      items = items.filter(i => i.airman_type?.toLowerCase() === airman_type.toLowerCase());
    }
    if (state) {
      items = items.filter(i => i.state?.toUpperCase() === state.toUpperCase());
    }
    if (city) {
      const cityLower = city.toLowerCase();
      items = items.filter(i => i.city?.toLowerCase().includes(cityLower));
    }
    if (name) {
      const nameLower = name.toLowerCase();
      items = items.filter(i => i.full_name?.toLowerCase().includes(nameLower));
    }

    return Response.json({
      source: 'ai_analytics_airmen',
      data: {
        total_available: listData.count || items.length,
        returned: items.length,
        filters_applied: { airman_type: airman_type || null, state: state || null, city: city || null, name: name || null },
        airmen: items,
        _source: listData._source
      },
      fetched_at: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});