import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Lists all Supabase projects in the user's organization via the Supabase Management API,
 * plus a health check on each project's REST endpoint to detect paused/unreachable projects.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const accessToken = Deno.env.get('SUPABASE_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'SUPABASE_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    // 1. List all projects via Supabase Management API
    const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!projectsRes.ok) {
      const errText = await projectsRes.text();
      return Response.json(
        { error: `Supabase Management API error (${projectsRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const projects = await projectsRes.json();

    // 2. Health-check each project's REST endpoint in parallel (5s timeout each)
    const healthCheck = async (project) => {
      const restUrl = `${project.endpoint_rest || `https://${project.id}.supabase.co`}/rest/v1/`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(restUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeout);
        const contentType = res.headers.get('content-type') || '';
        // Active projects return JSON (even without auth, they return a JSON error about missing API key)
        // Paused projects return HTML
        if (contentType.includes('text/html')) {
          return { health: 'paused', httpStatus: res.status, contentType };
        }
        return { health: 'active', httpStatus: res.status, contentType };
      } catch (err) {
        const msg = err?.message || String(err);
        if (msg.includes('aborted') || msg.includes('AbortError')) {
          return { health: 'timeout', httpStatus: null, contentType: null };
        }
        return { health: 'unreachable', httpStatus: null, contentType: null, error: msg };
      }
    };

    const enriched = await Promise.all(
      projects.map(async (p) => {
        const health = await healthCheck(p);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          region: p.region,
          created_at: p.created_at,
          organization_id: p.organization_id,
          database: p.database || null,
          endpoint_rest: p.endpoint_rest || `https://${p.id}.supabase.co`,
          health,
        };
      })
    );

    // Sort: active first, then by name
    enriched.sort((a, b) => {
      if (a.health.health === 'active' && b.health.health !== 'active') return -1;
      if (a.health.health !== 'active' && b.health.health === 'active') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    const summary = {
      total: enriched.length,
      active: enriched.filter(p => p.health.health === 'active').length,
      paused: enriched.filter(p => p.health.health === 'paused').length,
      timeout: enriched.filter(p => p.health.health === 'timeout').length,
      unreachable: enriched.filter(p => p.health.health === 'unreachable').length,
    };

    return Response.json({ projects: enriched, summary, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});