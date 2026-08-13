import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Multi-source aircraft registry lookup with Supabase backup.
 *
 * Sources (in order):
 *   1. FAAAircraft entity  — already-synced FAA data (works even when Supabase is down)
 *   2. adsbdb.com API      — free, no-key public API (live backup)
 *   3. Supabase            — existing syncFaaFromSupabase (last resort for full FAA fields)
 *
 * Returns: { found, source, aircraft, listing, areaServices }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, enrich_listing_id } = await req.json().catch(() => ({}));
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    // ── International prefix detection ──
    const INTL_PREFIXES = ['G-', 'C-', 'D-', 'F-', 'I-', 'EC-', 'VH-', 'SP-', 'OK-', 'HA-', 'LV-', 'PP-', 'PT-', 'XA-', 'XB-', 'XC-', 'ZK-', 'ZL-', '9V-', 'A7-', 'B-', 'JA-', 'RP-', 'PH-', 'OO-', 'SE-', 'LN-', 'OY-', 'OH-', 'SX-', 'UR-', 'RA-', 'RF-'];
    const cleanedReg = registration.trim().toUpperCase();
    const isIntl = INTL_PREFIXES.some(p => cleanedReg.startsWith(p));

    let normalized, fullReg;
    if (isIntl) {
      // International registration — keep full mark with dashes
      fullReg = cleanedReg;
      normalized = cleanedReg;
    } else {
      // US N-number — strip N prefix, keep alphanumeric
      normalized = cleanedReg.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '');
      fullReg = `N${normalized}`;
    }

    // ── FAA LADD (Limiting Aircraft Data Displayed) check ──
    // LADD only governs FAA-sourced data for US N-numbers. Per FAA policy, no
    // data (including historical) may be displayed for a registration while
    // it is on the current LADD list — so this short-circuits before any of
    // the source lookups below run, rather than fetching then redacting.
    if (!isIntl) {
      try {
        const blocked = await base44.asServiceRole.entities.LaddBlockList.filter(
          { n_number: normalized, active: true }, '-created_date', 1
        );
        if (blocked.length > 0) {
          return Response.json({
            found: false,
            source: 'ladd_blocked',
            aircraft: null,
            listing: null,
            areaServices: null,
            ladd_blocked: true,
            message: 'This aircraft registration is enrolled in the FAA Limiting Aircraft Data Displayed (LADD) program. Display of its registry data is withheld per FAA policy.',
            searchedAt: new Date().toISOString(),
          });
        }
      } catch (_) { /* LaddBlockList unreachable — fail open rather than block all lookups */ }
    }

    const result = {
      found: false,
      source: null,
      aircraft: null,
      listing: null,
      areaServices: null,
      searchedAt: new Date().toISOString(),
    };

    // ── SOURCE 1: FAAAircraft entity (US only — already synced) ──
    if (!isIntl) try {
      const faaResults = await base44.asServiceRole.entities.FAAAircraft.filter(
        { n_number: normalized },
        '-created_date',
        1
      );
      if (faaResults.length > 0) {
        const faa = faaResults[0];
        result.found = true;
        result.source = 'faa_entity';
        result.aircraft = {
          n_number: faa.n_number,
          registration: fullReg,
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
          make: faa.make || null,
          model: faa.model || null,
          registered_owner: faa.name || null,
        };
      }
    } catch (_) { /* non-critical */ }

    // ── SOURCE 2: adsbdb.com API (free, no key — live backup) ──
    if (!result.found) {
      try {
        const adsbRes = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(fullReg)}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (adsbRes.ok) {
          const adsbData = await adsbRes.json();
          const ac = adsbData?.response?.aircraft;
          if (ac && ac.registration) {
            result.found = true;
            result.source = 'adsbdb';
            result.aircraft = {
              n_number: normalized,
              registration: ac.registration,
              mode_s_hex: ac.mode_s || null,
              make: ac.manufacturer || null,
              model: ac.type || null,
              icao_type: ac.icao_type || null,
              country: ac.registered_owner_country_name || null,
              country_iso: ac.registered_owner_country_iso_name || null,
              registered_owner: ac.registered_owner || null,
              url_photo: ac.url_photo || null,
              url_photo_thumbnail: ac.url_photo_thumbnail || null,
            };
          }
        }
      } catch (_) { /* non-critical — network/timeout */ }
    }

    // ── SOURCE 2b: LLM web lookup (international registrations without adsbdb) ──
    if (!result.found && isIntl) {
      try {
        const llmRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Find aircraft registry information for aircraft registration ${fullReg}. Look up the aircraft type, manufacturer, model, ICAO type designator, country of registration, and current registration status from official aviation registries. Return only factual, verified data.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              registration: { type: 'string' },
              make: { type: 'string' },
              model: { type: 'string' },
              icao_type: { type: 'string' },
              country: { type: 'string' },
              status: { type: 'string' },
              mode_s_hex: { type: 'string' },
              serial_number: { type: 'string' },
              year_mfr: { type: 'number' },
            },
          },
        });
        if (llmRes?.registration) {
          result.found = true;
          result.source = 'llm_fallback';
          result.aircraft = {
            registration: llmRes.registration,
            make: llmRes.make || null,
            model: llmRes.model || null,
            icao_type: llmRes.icao_type || null,
            country: llmRes.country || null,
            status_code: llmRes.status || null,
            mode_s_hex: llmRes.mode_s_hex || null,
            serial_number: llmRes.serial_number || null,
            year_mfr: llmRes.year_mfr || null,
          };
        }
      } catch (_) { /* non-critical — LLM unavailable */ }
    }

    // ── SOURCE 3: Supabase via syncFaaFromSupabase (last resort — US only) ──
    if (!result.found && !isIntl) {
      try {
        const supabaseRes = await base44.functions.invoke('syncFaaFromSupabase', {
          mode: 'registry_import_single',
          n_number: normalized,
        });
        if (supabaseRes.data?.success) {
          const retry = await base44.asServiceRole.entities.FAAAircraft.filter(
            { n_number: normalized },
            '-created_date',
            1
          );
          if (retry.length > 0) {
            const faa = retry[0];
            result.found = true;
            result.source = 'supabase';
            result.aircraft = {
              n_number: faa.n_number,
              registration: fullReg,
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
              make: faa.make || null,
              model: faa.model || null,
            };
          }
        }
      } catch (_) { /* Supabase down — that's OK, we have other sources */ }
    }

    if (!result.found) {
      return Response.json({
        ...result,
        error: `No registry record found for ${fullReg} in any source.`,
      }, { status: 404 });
    }

    // ── Enrich with ACFTREF if mfr_mdl_code exists and make/model missing ──
    if (result.aircraft?.mfr_mdl_code && (!result.aircraft.make || !result.aircraft.model)) {
      try {
        const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');
        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('npm:@supabase/supabase-js@2');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: refs } = await supabase
            .from('faa_acftref')
            .select('mfr, model, type_aircraft, type_engine, category')
            .eq('code', result.aircraft.mfr_mdl_code.trim())
            .limit(1);
          if (refs?.length) {
            result.aircraft.make = refs[0].mfr || result.aircraft.make;
            result.aircraft.model = refs[0].model || result.aircraft.model;
            result.aircraft.acftref_type_aircraft = refs[0].type_aircraft || null;
            result.aircraft.acftref_type_engine = refs[0].type_engine || null;
            result.aircraft.acftref_category = refs[0].category || null;
          }
        }
      } catch (_) { /* non-critical */ }
    }

    // ── Check for ABOS listing match ──
    try {
      const listings = await base44.asServiceRole.entities.AircraftListing.filter(
        { registration: fullReg, status: 'active' },
        '-created_date',
        1
      );
      if (listings.length > 0) {
        const l = listings[0];
        result.listing = {
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
        };
      }
    } catch (_) { /* non-critical */ }

    // ── Area services from dealer registry ──
    if (result.aircraft?.state) {
      try {
        const dealers = await base44.asServiceRole.entities.DealerLocation.filter(
          { state: result.aircraft.state, is_active: true },
          '-created_date',
          200
        );
        if (dealers.length > 0) {
          const byRole = {};
          for (const d of dealers) {
            const r = d.role || 'other';
            byRole[r] = (byRole[r] || 0) + 1;
          }
          result.areaServices = { state: result.aircraft.state, byRole };
        }
      } catch (_) { /* non-critical */ }
    }

    // ── Optional: auto-enrich a specific listing ──
    if (enrich_listing_id && result.aircraft) {
      try {
        const listing = await base44.asServiceRole.entities.AircraftListing.filter(
          { id: enrich_listing_id },
          '-created_date',
          1
        );
        if (listing.length > 0) {
          const l = listing[0];
          const updateData = {};
          if (!l.make && result.aircraft.make) updateData.make = result.aircraft.make;
          if (!l.model && result.aircraft.model) updateData.model = result.aircraft.model;
          if (!l.year && result.aircraft.year_mfr) updateData.year = result.aircraft.year_mfr;
          if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.AircraftListing.update(l.id, updateData);
            result.enriched = true;
            result.enrichedFields = Object.keys(updateData);
          }
        }
      } catch (_) { /* non-critical */ }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});