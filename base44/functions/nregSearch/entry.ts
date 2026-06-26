import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { n_number } = await req.json().catch(() => ({}));
    if (!n_number) return Response.json({ error: 'n_number required' }, { status: 400 });

    const normalized = n_number.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Use multi-source registryLookup (FAAAircraft entity → adsbdb API → Supabase)
    const lookupRes = await base44.functions.invoke('registryLookup', { n_number: normalized });
    const lookup = lookupRes.data;

    if (!lookup?.found) {
      return Response.json({
        error: `No FAA registry record found for N${normalized}.`,
        found: false,
      });
    }

    const faa = {
      n_number: lookup.aircraft.n_number,
      serial_number: lookup.aircraft.serial_number || null,
      mfr_mdl_code: lookup.aircraft.mfr_mdl_code || null,
      year_mfr: lookup.aircraft.year_mfr || null,
      state: lookup.aircraft.state || null,
      country: lookup.aircraft.country || null,
      status_code: lookup.aircraft.status_code || null,
      type_aircraft: lookup.aircraft.type_aircraft || null,
      type_engine: lookup.aircraft.type_engine || null,
      mode_s_hex: lookup.aircraft.mode_s_hex || null,
      cert_issue_date: lookup.aircraft.cert_issue_date || null,
      expiration_date: lookup.aircraft.expiration_date || null,
      air_worth_date: lookup.aircraft.air_worth_date || null,
      last_action_date: lookup.aircraft.last_action_date || null,
      engine_mfr: lookup.aircraft.engine_mfr || null,
      engine_model: lookup.aircraft.engine_model || null,
      engine_type: lookup.aircraft.engine_type || null,
      horsepower: lookup.aircraft.horsepower || null,
      thrust: lookup.aircraft.thrust || null,
      make: lookup.aircraft.make || null,
      model: lookup.aircraft.model || null,
    };

    // 2. Strip owner privacy fields — NEVER expose name, city, or other PII
    const aircraft = {
      n_number: faa.n_number,
      serial_number: faa.serial_number || null,
      mfr_mdl_code: faa.mfr_mdl_code || null,
      year_mfr: faa.year_mfr || null,
      state: faa.state || null,
      country: faa.country || null,
      status_code: faa.status_code || null,
      type_aircraft: faa.type_aircraft || null,
      type_engine: faa.type_engine || null,
      mode_s_hex: faa.mode_s_hex || null,
      cert_issue_date: faa.cert_issue_date || null,
      expiration_date: faa.expiration_date || null,
      air_worth_date: faa.air_worth_date || null,
      last_action_date: faa.last_action_date || null,
      engine_mfr: faa.engine_mfr || null,
      engine_model: faa.engine_model || null,
      engine_type: faa.engine_type || null,
      horsepower: faa.horsepower || null,
      thrust: faa.thrust || null,
      // Make/model enriched from ACFTREF if available
      make: faa.make || null,
      model: faa.model || null,
    };

    // 3. Enrich with ACFTREF if mfr_mdl_code exists
    if (faa.mfr_mdl_code && (!faa.make || !faa.model)) {
      try {
        const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');
        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('npm:@supabase/supabase-js@2');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: refs } = await supabase
            .from('faa_acftref')
            .select('mfr, model, type_aircraft, type_engine, category')
            .eq('code', faa.mfr_mdl_code.trim())
            .limit(1);
          if (refs?.length) {
            aircraft.make = refs[0].mfr || aircraft.make;
            aircraft.model = refs[0].model || aircraft.model;
            aircraft.acftref_type_aircraft = refs[0].type_aircraft || null;
            aircraft.acftref_type_engine = refs[0].type_engine || null;
            aircraft.acftref_category = refs[0].category || null;
          }
        }
      } catch (_) { /* non-critical */ }
    }

    // 4. Check for ABOS listing match
    let listing = null;
    try {
      const listings = await base44.asServiceRole.entities.AircraftListing.filter(
        { registration: `N${normalized}`, status: 'active' },
        '-created_date',
        1
      );
      if (listings.length > 0) {
        const l = listings[0];
        listing = {
          id: l.id,
          make: l.make || null,
          model: l.model || null,
          year: l.year || null,
          asking_price: l.asking_price || null,
          currency: l.currency || 'USD',
          ati_score: l.ati_score || null,
          total_time: l.total_time || null,
          engine_hours: l.engine_hours || null,
          avionics: l.avionics || null,
          status: l.status || null,
          // NEVER expose owner info
        };
      }
    } catch (_) { /* non-critical */ }

    // 5. Area services from dealer registry
    let areaServices = null;
    if (faa.state) {
      try {
        const dealers = await base44.asServiceRole.entities.DealerLocation.filter(
          { state: faa.state, is_active: true },
          '-created_date',
          200
        );
        if (dealers.length > 0) {
          const byRole = {};
          for (const d of dealers) {
            const r = d.role || 'other';
            byRole[r] = (byRole[r] || 0) + 1;
          }
          areaServices = { state: faa.state, byRole };
        }
      } catch (_) { /* non-critical */ }
    }

    return Response.json({
      found: true,
      aircraft,
      listing,
      areaServices,
      searchedAt: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});