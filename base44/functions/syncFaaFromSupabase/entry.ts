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

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;

    const { mode, page, pageSize, search } = await req.json().catch(() => ({}));
    const currentMode = mode || 'summary';
    const currentPage = page || 1;
    const size = Math.min(pageSize || 100, 1000);

    // ── MODE: summary ──
    if (currentMode === 'summary') {
      const { count: faaTotal, error: faaErr } = await supabaseAdmin
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

      const { data: matchedSample, error: matchErr } = abosRegs.size > 0
        ? await supabaseAdmin
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
          id: l.id, registration: l.registration, make: l.make, model: l.model, year: l.year, status: l.status,
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

      let q = supabaseAdmin.from('faa_registry').select(
        'n_number, name, city, state, country, status_code, type_aircraft, year_mfr, cert_issue_date, last_action_date, serial_number',
        { count: 'exact' }
      );

      if (search) q = q.or(searchFilter);
      const { data, count, error: browseErr } = await q.range(from, to).order('n_number');

      if (browseErr) return Response.json({ error: browseErr.message }, { status: 500 });

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
        mode: 'browse', page: currentPage, pageSize: size, total: count, data: enriched,
      });
    }

    // ── MODE: registry_summary ──
    if (currentMode === 'registry_summary') {
      // Fetch counts for all FAA tables in parallel
      const [
        { count: regCount, error: regErr },
        { count: acftrefCount, error: acftrefErr },
        { count: adCount, error: adErr },
        { count: dealersCount, error: dealersErr },
        { count: engineCount, error: engineErr },
      ] = await Promise.all([
        supabaseAdmin.from('faa_registry').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('faa_acftref').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('faa_ad').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('faa_dealers').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('faa_engine').select('*', { count: 'exact', head: true }),
      ]);

      if (regErr) return Response.json({ error: regErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabaseAdmin
        .from('faa_registry').select('*').limit(3);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      let abosCount = 0;
      try {
        const arr = await base44.asServiceRole.entities.FAAAircraft.filter({}, '-created_date', 1);
        abosCount = arr.length;
      } catch (_) {}

      return Response.json({
        mode: 'registry_summary',
        faaRegistryTotal: regCount,
        faaAcftrefTotal: acftrefCount || 0,
        faaAdTotal: adCount || 0,
        faaDealersTotal: dealersCount || 0,
        faaEngineTotal: engineCount || 0,
        abosFaaAircraftCount: abosCount,
        sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: registry_sync ──
    if (currentMode === 'registry_sync') {
      const BATCH = 50;

      // Auto-advance: when no explicit page, derive batch from existing FAAAircraft count
      let batch;
      if (page !== undefined && pageSize && pageSize > 0) {
        batch = currentPage - 1;
      } else {
        let existingCount = 0;
        try {
          // Use a small limit to avoid rate limits; after that many batches, use offset tracking
          const arr = await base44.asServiceRole.entities.FAAAircraft.filter({}, '-created_date', 500);
          existingCount = arr.length === 500 ? 500 : arr.length;
        } catch (_) {}
        batch = Math.floor(existingCount / BATCH);
      }

      const from = batch * BATCH;
      const to = from + BATCH - 1;

      const { data: rows, error: syncErr } = await supabaseAdmin
        .from('faa_registry').select('*').range(from, to);
      if (syncErr) return Response.json({ error: syncErr.message }, { status: 500 });

      let created = 0;
      let updated = 0;

      for (const r of (rows || [])) {
        if (!r.n_number) continue;
        const nNum = r.n_number.trim().toUpperCase();

        const existing = await base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNum }, '-created_date', 1);

        const aircraftData = {
          n_number: nNum,
          serial_number: r.serial_number || '',
          mfr_mdl_code: r.mfr_mdl_code || '',
          eng_mfr_mdl: r.eng_mfr_mdl || '',
          year_mfr: r.year_mfr || null,
          type_registrant: r.type_registrant || '',
          name: r.name || '',
          city: r.city || '',
          state: r.state || '',
          country: r.country || '',
          last_action_date: r.last_action_date || '',
          cert_issue_date: r.cert_issue_date || '',
          status_code: r.status_code || '',
          type_aircraft: r.type_aircraft || '',
          type_engine: r.type_engine || '',
          mode_s_hex: r.mode_s_code_hex || '',
          fract_owner: r.fract_owner || '',
          air_worth_date: r.air_worth_date || '',
          expiration_date: r.expiration_date || '',
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.FAAAircraft.update(existing[0].id, aircraftData);
          updated++;
        } else {
          await base44.asServiceRole.entities.FAAAircraft.create(aircraftData);
          created++;
        }
      }

      // Get actual registry count for accurate batch tracking
      const { count: realTotal, error: countErr } = await supabaseAdmin
        .from('faa_registry').select('*', { count: 'exact', head: true });
      const totalBatches = Math.ceil((realTotal || 308985) / BATCH);
      return Response.json({
        mode: 'registry_sync',
        batch: batch + 1,
        totalBatches,
        processed: (rows || []).length,
        created,
        updated,
      });
    }

    // ── MODE: dealers_summary ──
    if (currentMode === 'dealers_summary') {
      const { count, error: countErr } = await supabaseAdmin
        .from('faa_dealers').select('*', { count: 'exact', head: true });
      if (countErr) return Response.json({ error: countErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabaseAdmin
        .from('faa_dealers').select('*').limit(5);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      return Response.json({
        mode: 'dealers_summary', total: count, sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: engine_summary ──
    if (currentMode === 'engine_summary') {
      const { count, error: countErr } = await supabaseAdmin
        .from('faa_engine').select('*', { count: 'exact', head: true });
      if (countErr) return Response.json({ error: countErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabaseAdmin
        .from('faa_engine').select('*').limit(5);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      return Response.json({
        mode: 'engine_summary', total: count, sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: acftref_summary ──
    if (currentMode === 'acftref_summary') {
      const { count, error: countErr } = await supabaseAdmin
        .from('faa_acftref').select('*', { count: 'exact', head: true });
      if (countErr) return Response.json({ error: countErr.message }, { status: 500 });

      const { data: sample, error: sampleErr } = await supabaseAdmin
        .from('faa_acftref').select('*').limit(20);
      if (sampleErr) return Response.json({ error: sampleErr.message }, { status: 500 });

      return Response.json({
        mode: 'acftref_summary', total: count, sample,
        columns: sample?.length ? Object.keys(sample[0]) : [],
      });
    }

    // ── MODE: acftref_browse ──
    if (currentMode === 'acftref_browse') {
      const from = (currentPage - 1) * size;
      const to = from + size - 1;

      let q = supabaseAdmin.from('faa_acftref').select('*', { count: 'exact' });
      if (search) q = q.or(`code.ilike.%${search}%,mfr.ilike.%${search}%,model.ilike.%${search}%`);
      const { data, count, error: browseErr } = await q.range(from, to).order('code');
      if (browseErr) return Response.json({ error: browseErr.message }, { status: 500 });

      return Response.json({
        mode: 'acftref_browse', page: currentPage, pageSize: size, total: count, data,
      });
    }

    // ── MODE: acftref_sync ──
    if (currentMode === 'acftref_sync') {
      const { data: rows, error: syncErr } = await supabaseAdmin
        .from('faa_acftref').select('*').limit(50000);
      if (syncErr) return Response.json({ error: syncErr.message }, { status: 500 });

      const lookup = {};
      for (const r of (rows || [])) {
        const code = r.code?.trim();
        if (code) {
          lookup[code] = {
            make: r.mfr || '', model: r.model || '',
            type_aircraft: r.type_aircraft || '', type_engine: r.type_engine || '',
            category: r.category || '',
          };
        }
      }

      const listings = await base44.asServiceRole.entities.AircraftListing.filter({}, '-created_date', 10000);
      let updated = 0;
      let skipped = 0;

      const faaAircraft = await base44.asServiceRole.entities.FAAAircraft.filter({}, '-created_date', 10000);
      const faaByNNumber = {};
      for (const f of faaAircraft) {
        if (f.n_number) faaByNNumber[f.n_number.trim().toUpperCase()] = f;
      }

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
        mode: 'acftref_sync', totalRefs: rows?.length || 0,
        totalListings: listings.length, totalFaaAircraft: faaAircraft.length,
        updated, skipped,
      });
    }

    // ── MODE: dealers_browse ──
    if (currentMode === 'dealers_browse') {
      const from = (currentPage - 1) * size;
      const to = from + size - 1;

      let q = supabaseAdmin.from('faa_dealers').select('*', { count: 'exact' });
      if (search) q = q.or(`name.ilike.%${search}%,cert_num.ilike.%${search}%`);
      const { data, count, error: browseErr } = await q.range(from, to).order('name');
      if (browseErr) return Response.json({ error: browseErr.message }, { status: 500 });

      return Response.json({
        mode: 'dealers_browse', page: currentPage, pageSize: size, total: count, data,
      });
    }

    // ── MODE: dealers_sync ──
    if (currentMode === 'dealers_sync') {
      const batch = (pageSize && pageSize > 0) ? (currentPage - 1) : 0;
      const batchSize = 50;
      const from = batch * batchSize;
      const to = from + batchSize - 1;

      const { data: rows, error: syncErr } = await supabaseAdmin
        .from('faa_dealers').select('*').range(from, to);
      if (syncErr) return Response.json({ error: syncErr.message }, { status: 500 });

      let created = 0;
      let updated = 0;

      for (const r of (rows || [])) {
        if (!r.cert_num || !r.name) continue;
        const existing = await base44.asServiceRole.entities.DealerLocation.filter({ cert_number: r.cert_num }, '-created_date', 1);
        const dealerData = { cert_number: r.cert_num, name: r.name, is_active: r.is_active ?? true, role: 'dealer' };
        if (r.city) dealerData.city = r.city;
        if (r.state) dealerData.state = r.state;
        if (r.zip_code) dealerData.zip_code = r.zip_code;

        if (existing.length > 0) {
          await base44.asServiceRole.entities.DealerLocation.update(existing[0].id, dealerData);
          updated++;
        } else {
          await base44.asServiceRole.entities.DealerLocation.create(dealerData);
          created++;
        }
      }

      const totalBatches = Math.ceil(12507 / batchSize);
      return Response.json({
        mode: 'dealers_sync', batch: batch + 1, totalBatches,
        processed: (rows || []).length, created, updated,
      });
    }

    // ── MODE: engine_browse ──
    if (currentMode === 'engine_browse') {
      const from = (currentPage - 1) * size;
      const to = from + size - 1;

      let q = supabaseAdmin.from('faa_engine').select('*', { count: 'exact' });
      if (search) q = q.or(`code.ilike.%${search}%,mfr.ilike.%${search}%,model.ilike.%${search}%`);
      const { data, count, error: browseErr } = await q.range(from, to).order('code');
      if (browseErr) return Response.json({ error: browseErr.message }, { status: 500 });

      return Response.json({
        mode: 'engine_browse', page: currentPage, pageSize: size, total: count, data,
      });
    }

    // ── MODE: engine_sync ──
    if (currentMode === 'engine_sync') {
      const { data: rows, error: syncErr } = await supabaseAdmin
        .from('faa_engine').select('*').limit(10000);
      if (syncErr) return Response.json({ error: syncErr.message }, { status: 500 });

      const engineLookup = {};
      for (const r of (rows || [])) {
        const code = r.code?.trim();
        if (code) {
          engineLookup[code] = {
            engine_mfr: r.mfr || '', engine_model: r.model || '',
            engine_type: r.type || '', horsepower: r.horsepower || '',
            thrust: r.thrust || '',
          };
        }
      }

      const faaAircraft = await base44.asServiceRole.entities.FAAAircraft.filter({}, '-created_date', 5000);
      let engUpdated = 0;

      for (const f of faaAircraft) {
        const engCode = f.eng_mfr_mdl?.trim();
        if (!engCode) continue;
        const eng = engineLookup[engCode];
        if (!eng) continue;

        await base44.asServiceRole.entities.FAAAircraft.update(f.id, {
          engine_mfr: eng.engine_mfr, engine_model: eng.engine_model,
          engine_type: eng.engine_type, horsepower: eng.horsepower, thrust: eng.thrust,
        });
        engUpdated++;
      }

      return Response.json({
        mode: 'engine_sync', totalRefs: rows?.length || 0,
        faaAircraftChecked: faaAircraft.length, engineUpdated: engUpdated,
      });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});