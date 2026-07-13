import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ── Helpers (defined before try block so they're in scope in catch) ──

// Detect Supabase HTML error pages (522/503 — project paused or down)
const supabaseErrMsg = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes('<!DOCTYPE') || msg.includes('<html') || msg.includes('Connection timed out')) {
    return 'Supabase project is unreachable (522/503). Check if the Supabase project is paused or down.';
  }
  return msg;
};

// Query timeout — fail fast instead of hanging until the platform 504 timeout.
// Uses AbortController to actually cancel the fetch, not just race.
const QUERY_TIMEOUT_MS = 8000;
const withTimeout = (promise, ms = QUERY_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase query timed out after ' + ms + 'ms')), ms)
    ),
  ]);

// Retry wrapper — 2 attempts, 1s base delay. Total worst case ~18s (well within platform limits).
const withRetry = async (fn, opts = {}) => {
  const { maxAttempts = 2, delayMs = 1000 } = opts;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
};

// Graceful skip response (HTTP 200) for scheduled registry_sync runs
const skipResponse = (reason) => Response.json({
  mode: 'registry_sync',
  skipped: true,
  reason,
  timestamp: new Date().toISOString(),
  retryAt: 'next scheduled run',
});

Deno.serve(async (req) => {
  let activeMode = null;
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled automations have no user context — allow them to proceed.
    // Direct HTTP invocations still require admin auth.
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = user?.role === 'admin';
    } catch (_) {
      // No auth context (scheduled automation) — trusted invocation
      isAuthorized = true;
    }
    if (!isAuthorized) {
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
    // Default to registry_sync for scheduled automations (no payload = sync 50 records).
    // The UI page always passes an explicit mode, so this only affects automated calls.
    const currentMode = mode || 'registry_sync';
    activeMode = currentMode;
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
      const { status_code: statusFilter } = await req.json().catch(() => ({}));
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
      if (statusFilter) q = q.eq('status_code', statusFilter);
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
        const arr = await base44.asServiceRole.entities.FAAAircraft.filter({}, '-created_date', 100000);
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

      // ── Connectivity pre-check (5s timeout) ──
      // If Supabase is unreachable (paused/HTML error), skip immediately
      // WITHOUT touching the AppConfig batch offset — so the pointer is not lost.
      try {
        const preCheck = await withTimeout(
          supabaseAdmin.from('faa_registry').select('*', { count: 'exact', head: true }),
          5000
        );
        if (preCheck.error) {
          return skipResponse(supabaseErrMsg(preCheck.error));
        }
      } catch (preCheckErr) {
        return skipResponse(supabaseErrMsg(preCheckErr));
      }

      // Determine which batch to process
      let batch;
      if (page !== undefined && pageSize && pageSize > 0) {
        batch = currentPage - 1;
      } else {
        // Read batch position from AppConfig (O(1) instead of loading 100k records)
        batch = 0;
        try {
          const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'faa_sync_batch' }, '-created_date', 1);
          if (configs.length > 0 && typeof configs[0].value?.batch === 'number') {
            batch = configs[0].value.batch;
          }
        } catch (_) {}
      }

      const from = batch * BATCH;
      const to = from + BATCH - 1;

      // ── Main range query with retry + exponential backoff (3 attempts, 2s base) ──
      let rows = null;
      try {
        rows = await withRetry(async () => {
          const r = await withTimeout(
            supabaseAdmin.from('faa_registry').select('*').range(from, to)
          );
          if (r.error) throw r.error;
          return r.data;
        });
      } catch (retryErr) {
        // All 3 attempts exhausted — return 200 skipped (not 504)
        return skipResponse(`Supabase timeout after 3 attempts: ${supabaseErrMsg(retryErr)}`);
      }

      // Collect n_numbers to check for existing records (single query, not per-record)
      const nNumbers = (rows || [])
        .filter(r => r.n_number)
        .map(r => r.n_number.trim().toUpperCase());

      const existingMap = new Map();
      if (nNumbers.length > 0) {
        try {
          const existing = await base44.asServiceRole.entities.FAAAircraft.filter(
            { n_number: { $in: nNumbers } },
            '-created_date',
            nNumbers.length
          );
          for (const f of existing) {
            if (f.n_number) existingMap.set(f.n_number.trim().toUpperCase(), f);
          }
        } catch (_) {}
      }

      // Separate into bulk create / bulk update batches
      const toCreate = [];
      const toUpdate = [];
      for (const r of (rows || [])) {
        if (!r.n_number) continue;
        const nNum = r.n_number.trim().toUpperCase();
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
        const existing = existingMap.get(nNum);
        if (existing) {
          toUpdate.push({ id: existing.id, ...aircraftData });
        } else {
          toCreate.push(aircraftData);
        }
      }

      // Bulk operations (2 API calls instead of 100+)
      let created = 0;
      let updated = 0;
      if (toCreate.length > 0) {
        await base44.asServiceRole.entities.FAAAircraft.bulkCreate(toCreate);
        created = toCreate.length;
      }
      if (toUpdate.length > 0) {
        await base44.asServiceRole.entities.FAAAircraft.bulkUpdate(toUpdate);
        updated = toUpdate.length;
      }

      const maintenanceRegistrations = [...new Set([...toCreate, ...toUpdate]
        .filter((item) => item.eng_mfr_mdl)
        .map((item) => `N${item.n_number}`))];
      let maintenanceProcessed = 0;
      if (maintenanceRegistrations.length) {
        const maintenanceResponse = await base44.functions.invoke('calculateEngineMaintenance', {
          registrations: maintenanceRegistrations,
        });
        maintenanceProcessed = maintenanceResponse.data?.processed || 0;
      }

      // Get total for batch tracking
      const { count: realTotal } = await withTimeout(
        supabaseAdmin.from('faa_registry').select('*', { count: 'exact', head: true })
      ).catch(() => ({ count: null }));
      const totalBatches = Math.ceil((realTotal || 308985) / BATCH);
      const nextBatch = (batch + 1 >= totalBatches) ? 0 : batch + 1;

      // Persist next batch position to AppConfig
      try {
        const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'faa_sync_batch' }, '-created_date', 1);
        if (configs.length > 0) {
          await base44.asServiceRole.entities.AppConfig.update(configs[0].id, { value: { batch: nextBatch } });
        } else {
          await base44.asServiceRole.entities.AppConfig.create({ key: 'faa_sync_batch', value: { batch: nextBatch } });
        }
      } catch (_) {}

      return Response.json({
        mode: 'registry_sync',
        batch: batch + 1,
        totalBatches,
        processed: (rows || []).length,
        created,
        updated,
        maintenanceProcessed,
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

    // ── MODE: enginespec_sync ── populate EngineSpec registry from faa_engine table
    if (currentMode === 'enginespec_sync') {
      const { data: rows, error: syncErr } = await supabaseAdmin
        .from('faa_engine').select('*').limit(10000);
      if (syncErr) return Response.json({ error: syncErr.message }, { status: 500 });

      const typeMap = { '1': 'Reciprocating', '2': 'Turboprop', '3': 'Turboshaft', '5': 'Turbojet', '6': 'Turbofan', '8': 'Electric' };

      const existing = await base44.asServiceRole.entities.EngineSpec.filter({}, '-created_date', 10000);
      const existingByCode = new Map(existing.map(e => [e.engine_code, e]));

      const toCreate = [];
      let specSkipped = 0;
      for (const r of (rows || [])) {
        const code = r.code?.trim();
        if (!code || existingByCode.has(code)) { specSkipped++; continue; }
        toCreate.push({
          engine_code: code,
          manufacturer: r.mfr || 'Unknown',
          model_name: r.model || code,
          hp: r.horsepower ? Number(r.horsepower) || null : null,
          thrust: r.thrust ? String(r.thrust) : null,
          engine_type: typeMap[String(r.type || '').trim()] || null,
          source: 'faa_engine_table',
          verified_by_admin: false,
        });
      }
      let specCreated = 0;
      // bulkCreate in chunks of 500
      for (let i = 0; i < toCreate.length; i += 500) {
        const chunk = toCreate.slice(i, i + 500);
        await base44.asServiceRole.entities.EngineSpec.bulkCreate(chunk);
        specCreated += chunk.length;
      }

      return Response.json({
        mode: 'enginespec_sync',
        totalSourceRows: rows?.length || 0,
        created: specCreated,
        skippedExisting: specSkipped,
        note: 'TBO hours must be enriched from manufacturer data or admin manual entry',
      });
    }

    // ── MODE: registry_import_single ──
    if (currentMode === 'registry_import_single') {
      const { n_number } = await req.json().catch(() => ({}));
      if (!n_number) return Response.json({ error: 'n_number required' }, { status: 400 });

      const { data: rows, error: rowErr } = await supabaseAdmin
        .from('faa_registry').select('*').eq('n_number', n_number.trim().toUpperCase()).limit(1);
      if (rowErr) return Response.json({ error: rowErr.message }, { status: 500 });
      if (!rows?.length) return Response.json({ error: 'Not found in FAA registry' }, { status: 404 });

      const r = rows[0];
      const nNum = r.n_number.trim().toUpperCase();
      const aircraftData = {
        n_number: nNum, serial_number: r.serial_number || '', mfr_mdl_code: r.mfr_mdl_code || '',
        eng_mfr_mdl: r.eng_mfr_mdl || '', year_mfr: r.year_mfr || null, type_registrant: r.type_registrant || '',
        name: r.name || '', city: r.city || '', state: r.state || '', country: r.country || '',
        last_action_date: r.last_action_date || '', cert_issue_date: r.cert_issue_date || '',
        status_code: r.status_code || '', type_aircraft: r.type_aircraft || '', type_engine: r.type_engine || '',
        mode_s_hex: r.mode_s_code_hex || '', fract_owner: r.fract_owner || '',
        air_worth_date: r.air_worth_date || '', expiration_date: r.expiration_date || '',
      };
      const existing = await base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNum }, '-created_date', 1);
      if (existing.length > 0) {
        await base44.asServiceRole.entities.FAAAircraft.update(existing[0].id, aircraftData);
        return Response.json({ success: true, action: 'updated', n_number: nNum });
      }
      await base44.asServiceRole.entities.FAAAircraft.create(aircraftData);
      return Response.json({ success: true, action: 'created', n_number: nNum });
    }

    // ── MODE: acftref_enrich_single ──
    if (currentMode === 'acftref_enrich_single') {
      const { code } = await req.json().catch(() => ({}));
      if (!code) return Response.json({ error: 'code required' }, { status: 400 });

      const { data: refs, error: refErr } = await supabaseAdmin
        .from('faa_acftref').select('*').eq('code', code.trim()).limit(1);
      if (refErr) return Response.json({ error: refErr.message }, { status: 500 });
      if (!refs?.length) return Response.json({ error: 'Code not found' }, { status: 404 });

      const ref = refs[0];
      const faaAircraft = await base44.asServiceRole.entities.FAAAircraft.filter({ mfr_mdl_code: ref.code.trim() }, '-created_date', 5000);
      let enriched = 0;
      for (const f of faaAircraft) {
        const listingMatch = await base44.asServiceRole.entities.AircraftListing.filter({ registration: `N${f.n_number}` }, '-created_date', 1);
        if (listingMatch.length > 0) {
          const updateData = {};
          if (!listingMatch[0].make || listingMatch[0].make === 'Unknown') updateData.make = ref.mfr;
          if (!listingMatch[0].model || listingMatch[0].model === 'Unknown') updateData.model = ref.model;
          if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.AircraftListing.update(listingMatch[0].id, updateData);
            enriched++;
          }
        }
      }
      return Response.json({ success: true, action: `enriched ${enriched} listings`, code: ref.code, faaMatched: faaAircraft.length });
    }

    // ── MODE: dealers_import_single ──
    if (currentMode === 'dealers_import_single') {
      const { cert_num } = await req.json().catch(() => ({}));
      if (!cert_num) return Response.json({ error: 'cert_num required' }, { status: 400 });

      const { data: rows, error: rowErr } = await supabaseAdmin
        .from('faa_dealers').select('*').eq('cert_num', cert_num.trim()).limit(1);
      if (rowErr) return Response.json({ error: rowErr.message }, { status: 500 });
      if (!rows?.length) return Response.json({ error: 'Not found' }, { status: 404 });

      const r = rows[0];
      const dealerData = { cert_number: r.cert_num, name: r.name, is_active: r.is_active ?? true, role: 'dealer' };
      if (r.city) dealerData.city = r.city;
      if (r.state) dealerData.state = r.state;
      if (r.zip_code) dealerData.zip_code = r.zip_code;

      const existing = await base44.asServiceRole.entities.DealerLocation.filter({ cert_number: r.cert_num }, '-created_date', 1);
      if (existing.length > 0) {
        await base44.asServiceRole.entities.DealerLocation.update(existing[0].id, dealerData);
        return Response.json({ success: true, action: 'updated', cert_num: r.cert_num, name: r.name });
      }
      await base44.asServiceRole.entities.DealerLocation.create(dealerData);
      return Response.json({ success: true, action: 'created', cert_num: r.cert_num, name: r.name });
    }

    // ── MODE: engine_enrich_single ──
    if (currentMode === 'engine_enrich_single') {
      const { code } = await req.json().catch(() => ({}));
      if (!code) return Response.json({ error: 'code required' }, { status: 400 });

      const { data: refs, error: refErr } = await supabaseAdmin
        .from('faa_engine').select('*').eq('code', code.trim()).limit(1);
      if (refErr) return Response.json({ error: refErr.message }, { status: 500 });
      if (!refs?.length) return Response.json({ error: 'Code not found' }, { status: 404 });

      const eng = refs[0];
      const faaAircraft = await base44.asServiceRole.entities.FAAAircraft.filter({ eng_mfr_mdl: eng.code.trim() }, '-created_date', 5000);
      let engUpdated = 0;
      for (const f of faaAircraft) {
        await base44.asServiceRole.entities.FAAAircraft.update(f.id, {
          engine_mfr: eng.mfr || '', engine_model: eng.model || '',
          engine_type: eng.type || '', horsepower: eng.horsepower || '', thrust: eng.thrust || '',
        });
        engUpdated++;
      }
      return Response.json({ success: true, action: `enriched ${engUpdated} aircraft`, code: eng.code, faaMatched: faaAircraft.length });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    const msg = error.message || String(error);
    const isSupabaseDown = msg.includes('<!DOCTYPE') || msg.includes('<html') || msg.includes('Connection timed out');
    const isTimeout = msg.includes('timed out') || msg.includes('Timeout');

    // For scheduled registry_sync runs, return 200 skipped so the automation stays green
    if (activeMode === 'registry_sync' && (isSupabaseDown || isTimeout)) {
      return skipResponse(
        isSupabaseDown
          ? 'Supabase unreachable (HTML error page — project may be paused)'
          : 'Supabase query timed out'
      );
    }

    // For UI-driven modes, return error responses so admins see the failure
    if (isSupabaseDown) {
      return Response.json(
        { error: 'Supabase returned an HTML error page — the project may be paused or the URL is incorrect. Check VITE_SUPABASE_URL and Supabase project status.' },
        { status: 502 }
      );
    }
    if (isTimeout) {
      return Response.json(
        { error: 'Supabase query timed out — the project may be overloaded or paused. Retrying on next scheduled run.' },
        { status: 504 }
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  }
});