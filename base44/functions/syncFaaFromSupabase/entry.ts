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

    // ── MODE: dealers_summary ──
    if (currentMode === 'dealers_summary') {
      const { count, error: countErr } = await supabase
        .from('faa_dealers')
        .select('*', { count: 'exact', head: true });
      if (countErr) return Response.json({ error: countErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabase
        .from('faa_dealers')
        .select('*')
        .limit(5);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      return Response.json({
        mode: 'dealers_summary',
        total: count,
        sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: engine_summary ──
    if (currentMode === 'engine_summary') {
      const { count, error: countErr } = await supabase
        .from('faa_engine')
        .select('*', { count: 'exact', head: true });
      if (countErr) return Response.json({ error: countErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabase
        .from('faa_engine')
        .select('*')
        .limit(5);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      return Response.json({
        mode: 'engine_summary',
        total: count,
        sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: acftref_summary ──
    if (currentMode === 'acftref_summary') {
      const { count, error: countErr } = await supabase
        .from('faa_acftref')
        .select('*', { count: 'exact', head: true });
      if (countErr) return Response.json({ error: countErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabase
        .from('faa_acftref')
        .select('*')
        .limit(20);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      return Response.json({
        mode: 'acftref_summary',
        total: count,
        sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: acftref_browse ──
    if (currentMode === 'acftref_browse') {
      const from = (currentPage - 1) * size;
      const to = from + size - 1;

      let q = supabase.from('faa_acftref').select('*', { count: 'exact' });
      if (search) q = q.or(`code.ilike.%${search}%,mfr.ilike.%${search}%,model.ilike.%${search}%`);
      const { data, count, error: browseErr } = await q.range(from, to).order('code');

      if (browseErr) return Response.json({ error: browseErr.message }, { status: 500 });

      return Response.json({
        mode: 'acftref_browse',
        page: currentPage,
        pageSize: size,
        total: count,
        data,
      });
    }

    // ── MODE: acftref_sync ──
    if (currentMode === 'acftref_sync') {
      const { data: rows, error: syncErr } = await supabase
        .from('faa_acftref')
        .select('*')
        .limit(50000);

      if (syncErr) return Response.json({ error: syncErr.message }, { status: 500 });

      // Build lookup: mfr_mdl_code → { make, model }
      const lookup = {};
      for (const r of (rows || [])) {
        const code = r.code?.trim();
        if (code) {
          lookup[code] = {
            make: r.mfr || '',
            model: r.model || '',
            type_aircraft: r.type_aircraft || '',
            type_engine: r.type_engine || '',
            category: r.category || '',
          };
        }
      }

      // Get all ABOS listings with mfr_mdl_code (from FAAAircraft) or with missing make/model
      const listings = await base44.asServiceRole.entities.AircraftListing.filter({}, '-created_date', 10000);
      let updated = 0;
      let skipped = 0;

      // Also check FAAAircraft entities for linking
      const faaAircraft = await base44.asServiceRole.entities.FAAAircraft.filter({}, '-created_date', 10000);
      const faaByNNumber = {};
      for (const f of faaAircraft) {
        if (f.n_number) faaByNNumber[f.n_number.trim().toUpperCase()] = f;
      }

      // Update listings that have an FAA match with mfr_mdl_code
      for (const l of listings) {
        const nNum = (l.registration || '').replace(/^N/i, '').trim().toUpperCase();
        const faa = faaByNNumber[nNum];
        if (!faa || !faa.mfr_mdl_code) { skipped++; continue; }

        const ref = lookup[faa.mfr_mdl_code.trim()];
        if (!ref) { skipped++; continue; }

        const updateData = {};
        if (!l.make || l.make === 'Unknown') updateData.make = ref.make;
        if (!l.model || l.model === 'Unknown') updateData.model = ref.model;

        if (Object.keys(updateData).length > 0) {
          await base44.asServiceRole.entities.AircraftListing.update(l.id, updateData);
          updated++;
        } else {
          skipped++;
        }
      }

      return Response.json({
        mode: 'acftref_sync',
        totalRefs: rows?.length || 0,
        totalListings: listings.length,
        totalFaaAircraft: faaAircraft.length,
        updated,
        skipped,
      });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});