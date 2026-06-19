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
    const { document_number, category, manufacturer, min_date } = body;

    // ── Single rule lookup ──
    if (document_number) {
      const url = `${BASE_URL}/aviation-rule/${encodeURIComponent(document_number)}.json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': 'application/json' }
      });
      if (!res.ok) {
        return Response.json({ error: 'Rule not found', document_number, status: res.status }, { status: 404 });
      }
      const data = await res.json();
      return Response.json({
        source: 'ai_analytics_faa_rules',
        data,
        fetched_at: new Date().toISOString(),
        status: 'success'
      });
    }

    // ── Recent rules list ──
    const listUrl = `${BASE_URL}/api/v1/faa/actions/recent`;
    const listRes = await fetch(listUrl, {
      headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': 'application/json' }
    });
    if (!listRes.ok) {
      return Response.json({ error: `AI Analytics API returned ${listRes.status}` }, { status: 502 });
    }

    const listData = await listRes.json();
    let items = listData.items || [];

    if (category) {
      const catLower = category.toLowerCase();
      items = items.filter(i => i.category?.toLowerCase() === catLower);
    }
    if (manufacturer) {
      const mfrLower = manufacturer.toLowerCase();
      items = items.filter(i => i.manufacturer?.toLowerCase().includes(mfrLower));
    }
    if (min_date) {
      items = items.filter(i => i.publication_date >= min_date);
    }

    return Response.json({
      source: 'ai_analytics_faa_rules',
      data: {
        total_available: listData.count || items.length,
        returned: items.length,
        filters_applied: { category: category || null, manufacturer: manufacturer || null, min_date: min_date || null },
        rules: items,
        _source: listData._source
      },
      fetched_at: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});