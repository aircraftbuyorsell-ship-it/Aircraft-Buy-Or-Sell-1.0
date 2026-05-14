import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CACHE_TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      region_key = 'europe',
      region_label = 'Europe',
      force_refresh = false,
      lamin = 35,
      lomin = -12,
      lamax = 60,
      lomax = 35,
      limit = 200,
      allow_heavy = true,
    } = body;

    const existing = await base44.asServiceRole.entities.TrafficSnapshot.filter({ region_key }, '-refreshed_at', 1);
    const cached = existing[0] || null;

    const cacheAgeMs = cached?.refreshed_at ? Date.now() - new Date(cached.refreshed_at).getTime() : Infinity;
    const cacheIsFresh = cacheAgeMs < CACHE_TTL_MS;

    if (cached && !force_refresh && cacheIsFresh) {
      return Response.json({
        source: 'cache',
        aircraft: JSON.parse(cached.aircraft_json || '[]').slice(0, limit),
        time: cached.opensky_time || null,
        total_raw: cached.total_raw || 0,
        refreshed_at: cached.refreshed_at,
        refreshed_by: cached.refreshed_by,
        next_refresh_at: new Date(new Date(cached.refreshed_at).getTime() + CACHE_TTL_MS).toISOString(),
        region_key,
        region_label: cached.region_label || region_label,
      });
    }

    try {
      const live = await base44.functions.invoke('openSky', {
        action: 'map_states',
        lamin,
        lomin,
        lamax,
        lomax,
        limit,
        allow_heavy,
      });

      const refreshedAt = new Date().toISOString();
      const payload = {
        region_key,
        region_label,
        bounds: { lamin, lomin, lamax, lomax },
        aircraft_json: JSON.stringify(live.data.aircraft || []),
        opensky_time: live.data.time || null,
        total_raw: live.data.total_raw || 0,
        refreshed_by: user.email,
        refreshed_at: refreshedAt,
      };

      if (cached) {
        await base44.asServiceRole.entities.TrafficSnapshot.update(cached.id, payload);
      } else {
        await base44.asServiceRole.entities.TrafficSnapshot.create(payload);
      }

      return Response.json({ source: 'live', ...live.data, refreshed_at: refreshedAt, refreshed_by: user.email, region_key, region_label });
    } catch (liveError) {
      if (cached) {
        return Response.json({
          source: 'cache_fallback',
          warning: liveError.message,
          aircraft: JSON.parse(cached.aircraft_json || '[]'),
          time: cached.opensky_time || null,
          total_raw: cached.total_raw || 0,
          refreshed_at: cached.refreshed_at,
          refreshed_by: cached.refreshed_by,
          region_key,
          region_label: cached.region_label || region_label,
        });
      }
      throw liveError;
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});