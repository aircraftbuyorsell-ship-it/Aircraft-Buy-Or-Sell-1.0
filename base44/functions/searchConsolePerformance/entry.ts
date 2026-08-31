import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { mode, siteUrl, days } = await req.json().catch(() => ({}));

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // ── MODE: list sites ──
    if (mode === 'sites') {
      const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json({ error: err.error?.message || 'Failed to list sites' }, { status: res.status });
      }
      const data = await res.json();
      return Response.json({
        sites: (data.siteEntry || []).map(s => ({
          url: s.siteUrl,
          permissionLevel: s.permissionLevel,
        })),
      });
    }

    // ── MODE: performance trends ──
    if (mode === 'performance') {
      if (!siteUrl) return Response.json({ error: 'siteUrl required' }, { status: 400 });

      const encodedSite = encodeURIComponent(siteUrl);
      const numDays = Math.min(days || 28, 90);
      const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;

      // Date ranges (Search Console data has ~2 day delay)
      const today = new Date();
      today.setDate(today.getDate() - 2); // account for data delay
      const curStart = new Date(today);
      curStart.setDate(today.getDate() - numDays);
      const prevStart = new Date(curStart);
      prevStart.setDate(curStart.getDate() - numDays);

      const fmt = (d) => d.toISOString().split('T')[0];
      const curEnd = fmt(today);
      const curStartStr = fmt(curStart);
      const prevEnd = fmt(curStart);
      const prevStartStr = fmt(prevStart);

      // Current period — daily breakdown
      const [dailyRes, prevRes, queriesRes, pagesRes, devicesRes] = await Promise.all([
        fetch(apiUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ startDate: curStartStr, endDate: curEnd, dimensions: ['date'], rowLimit: 1000 }),
        }),
        fetch(apiUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ startDate: prevStartStr, endDate: prevEnd, rowLimit: 1 }),
        }),
        fetch(apiUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ startDate: curStartStr, endDate: curEnd, dimensions: ['query'], rowLimit: 20 }),
        }),
        fetch(apiUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ startDate: curStartStr, endDate: curEnd, dimensions: ['page'], rowLimit: 20 }),
        }),
        fetch(apiUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ startDate: curStartStr, endDate: curEnd, dimensions: ['device'], rowLimit: 10 }),
        }),
      ]);

      const [dailyData, prevData, queriesData, pagesData, devicesData] = await Promise.all([
        dailyRes.json(), prevRes.json(), queriesRes.json(), pagesRes.json(), devicesRes.json(),
      ]);

      // Check for API errors
      if (dailyData.error) return Response.json({ error: dailyData.error.message }, { status: 500 });

      const daily = (dailyData.rows || []).map(r => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 1000) / 10,
        position: Math.round(r.position * 10) / 10,
      })).sort((a, b) => a.date.localeCompare(b.date));

      const prev = (prevData.rows || [])[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      // Aggregate current period totals
      const curTotals = daily.reduce((acc, d) => {
        acc.clicks += d.clicks;
        acc.impressions += d.impressions;
        acc.ctrSum += d.ctr;
        acc.posSum += d.position;
        acc.count++;
        return acc;
      }, { clicks: 0, impressions: 0, ctrSum: 0, posSum: 0, count: 0 });

      const current = {
        clicks: curTotals.clicks,
        impressions: curTotals.impressions,
        ctr: curTotals.count > 0 ? Math.round((curTotals.ctrSum / curTotals.count) * 10) / 10 : 0,
        position: curTotals.count > 0 ? Math.round((curTotals.posSum / curTotals.count) * 10) / 10 : 0,
      };

      const previous = {
        clicks: prev.clicks || 0,
        impressions: prev.impressions || 0,
        ctr: Math.round((prev.ctr || 0) * 1000) / 10,
        position: Math.round((prev.position || 0) * 10) / 10,
      };

      const pctChange = (cur, prev) => {
        if (prev === 0) return cur > 0 ? 100 : 0;
        return Math.round(((cur - prev) / prev) * 1000) / 10;
      };

      return Response.json({
        period: { start: curStartStr, end: curEnd, days: numDays },
        current,
        previous,
        changes: {
          clicks: pctChange(current.clicks, previous.clicks),
          impressions: pctChange(current.impressions, previous.impressions),
          ctr: Math.round((current.ctr - previous.ctr) * 10) / 10,
          position: Math.round((current.position - previous.position) * 10) / 10,
        },
        daily,
        topQueries: (queriesData.rows || []).map(r => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: Math.round(r.ctr * 1000) / 10,
          position: Math.round(r.position * 10) / 10,
        })),
        topPages: (pagesData.rows || []).map(r => ({
          page: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: Math.round(r.ctr * 1000) / 10,
          position: Math.round(r.position * 10) / 10,
        })),
        devices: (devicesData.rows || []).map(r => ({
          device: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
        })),
      });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});