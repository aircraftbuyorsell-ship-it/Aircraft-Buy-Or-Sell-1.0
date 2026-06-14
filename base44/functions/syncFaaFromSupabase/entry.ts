import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mode, page, pageSize, search } = await req.json().catch(() => ({}));
    const currentMode = mode || 'summary';
    const currentPage = page || 1;
    const size = Math.min(pageSize || 100, 1000);

    // ── MODE: summary ──
    if (currentMode === 'summary') {
      const { count: faaTotal, error: faaErr } = await supabase
        .from('faa_registry')
        .select('*', { count: 'exact', head: true });

      if (faaErr) return Response.json({ error: faaErr.message }, { status: 500 });

      const abosListings = await base44.asServiceRole.entities.AircraftListing.filter({}, '-created_date', 10000);
      const abosRegs = new Set(
        abosListings
          .map(l => l.registration)
          .filter(r => r && /^N/i.test(r))
          .map(r => r.replace(/^N/i, '').trim().toUpperCase())
      );

      // Sample FAA registrations matching ABOS listings
      const { data: matchedSample, error: matchErr } = abosRegs.size > 0
        ? await supabase
            .from('faa_registry')
            .select('n_number, name, city, state, status_code, type_aircraft, year_mfr')
            .in('n_number', [...abosRegs].slice(0, 200))
            .limit(200)
        : { data: [], error: null };

      if (matchErr) return Response.json({ error: matchErr.message }, { status: 500 });

      const matchedSet = new Set((matchedSample || []).map(r => r.n_number?.trim().toUpperCase()));
      const matched = abosListings.filter(l => {
        const n = (l.registration || '').replace(/^N/i, '').trim().toUpperCase();
        return matchedSet.has(n);
      });

      // Count registrations in ABOS but NOT in FAA (potentially stale)
      const abosOnly = abosListings.filter(l => {
        const n = (l.registration || '').replace(/^N/i, '').trim().toUpperCase();
        return /^N/i.test(l.registration || '') && !matchedSet.has(n);
      });

      return Response.json({
        mode: 'summary',
        faaTotal,
        abosNRegCount: abosRegs.size,
        matched: matched.length,
        abosOnly: abosOnly.length,
        sampleMatches: (matchedSample || []).slice(0, 50),
        abosOnlySample: abosOnly.slice(0, 20).map(l => ({
          id: l.id,
          registration: l.registration,
          make: l.make,
          model: l.model,
          year: l.year,
          status: l.status,
        })),
      });
    }

    // ── MODE: browse ──
    if (currentMode === 'browse') {
      const from = (currentPage - 1) * size;
      const to = from + size - 1;
      const searchFilter = search
        ? `n_number.ilike.%${search}%,name.ilike.%${search}%`
        : undefined;

      let q = supabase.from('faa_registry').select(
        'n_number, name, city, state, country, status_code, type_aircraft, year_mfr, cert_issue_date, last_action_date, serial_number',
        { count: 'exact' }
      );

      if (search) q = q.or(searchFilter);
      const { data, count, error: browseErr } = await q.range(from, to).order('n_number');

      if (browseErr) return Response.json({ error: browseErr.message }, { status: 500 });

      // Enrich with ABOS match status
      const abosListings = await base44.asServiceRole.entities.AircraftListing.filter({}, '-created_date', 10000);
      const abosMap = new Map();
      abosListings.forEach(l => {
        const n = (l.registration || '').replace(/^N/i, '').trim().toUpperCase();
        if (n) abosMap.set(n, { id: l.id, status: l.status, ati_score: l.ati_score, asking_price: l.asking_price });
      });

      const enriched = (data || []).map(row => ({
        ...row,
        inAbos: abosMap.has(row.n_number?.trim().toUpperCase()),
        abosListing: abosMap.get(row.n_number?.trim().toUpperCase()) || null,
      }));

      return Response.json({
        mode: 'browse',
        page: currentPage,
        pageSize: size,
        total: count,
        data: enriched,
      });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});