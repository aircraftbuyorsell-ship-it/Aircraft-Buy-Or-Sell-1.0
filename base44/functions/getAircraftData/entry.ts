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
    const { n_number, manufacturer, state, type_aircraft, status } = body;

    // ── Single aircraft lookup via canonical URL ──
    if (n_number) {
      const cleanN = n_number.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
      const url = `${BASE_URL}/aircraft/N${cleanN.startsWith('N') ? cleanN.slice(1) : cleanN}.json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': 'application/json' }
      });
      if (!res.ok) {
        return Response.json({ error: 'Aircraft not found', n_number: cleanN, status: res.status }, { status: 404 });
      }
      const data = await res.json();
      return Response.json({
        source: 'ai_analytics_aircraft',
        data,
        fetched_at: new Date().toISOString(),
        status: 'success'
      });
    }

    // ── Recent aircraft list with filters ──
    const listUrl = `${BASE_URL}/api/v1/faa/aircraft/recent`;
    const listRes = await fetch(listUrl, {
      headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': 'application/json' }
    });
    if (!listRes.ok) {
      return Response.json({ error: `AI Analytics API returned ${listRes.status}` }, { status: 502 });
    }

    const listData = await listRes.json();
    let items = listData.items || [];

    if (manufacturer) {
      const mfrLower = manufacturer.toLowerCase();
      items = items.filter(i => i.mfr_name?.toLowerCase().includes(mfrLower));
    }
    if (state) {
      items = items.filter(i => i.owner_state?.toUpperCase() === state.toUpperCase());
    }
    if (type_aircraft) {
      items = items.filter(i => i.type_aircraft_label?.toLowerCase().includes(type_aircraft.toLowerCase()));
    }
    if (status) {
      items = items.filter(i => i.status_label?.toLowerCase() === status.toLowerCase());
    }

    return Response.json({
      source: 'ai_analytics_aircraft',
      data: {
        total_available: listData.count || items.length,
        returned: items.length,
        filters_applied: { manufacturer: manufacturer || null, state: state || null, type_aircraft: type_aircraft || null, status: status || null },
        aircraft: items,
        _source: listData._source
      },
      fetched_at: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});