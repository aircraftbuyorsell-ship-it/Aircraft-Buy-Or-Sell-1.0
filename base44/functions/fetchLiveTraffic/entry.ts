import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabaseAdmin = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : createClient(supabaseUrl, supabaseKey);

    const { limit } = await req.json().catch(() => ({}));
    const maxRows = Math.min(limit || 2000, 5000);

    // Try to fetch from live_traffic table
    const { data: rows, error } = await supabaseAdmin
      .from('live_traffic')
      .select('*')
      .limit(maxRows)
      .order('id', { ascending: false });

    if (error) {
      return Response.json({ error: error.message, hint: 'Table live_traffic may not exist' }, { status: 500 });
    }

    // Also try to enrich with FAA n-numbers from our FAAAircraft records
    // Map icao24 -> n_number from our synced records
    const icaos = (rows || []).map(r => r.icao24).filter(Boolean);
    const faaMap = {};
    if (icaos.length > 0) {
      try {
        // Batch lookup — query FAAAircraft by icao24 (mode_s_hex)
        const faaRecords = await base44.asServiceRole.entities.FAAAircraft.filter(
          {}, '-created_date', 20000
        );
        for (const f of faaRecords) {
          if (f.mode_s_hex) {
            faaMap[f.mode_s_hex.trim().toLowerCase()] = f.n_number;
          }
        }
      } catch (_) {
        // Ignore enrichment errors — it's optional
      }
    }

    const aircraft = (rows || []).map(r => ({
      ...r,
      n_number: faaMap[(r.icao24 || '').trim().toLowerCase()] || r.registration || null,
    }));

    return Response.json({ aircraft, count: aircraft.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});