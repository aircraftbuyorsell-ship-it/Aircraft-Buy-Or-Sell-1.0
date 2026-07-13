import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Global Aircraft Registry Lookup — unified router for international registries.
 *
 * Detects the registering country from the registration prefix and delegates to
 * the appropriate source, normalizing every result to a single schema so the
 * frontend never has to care which authority the aircraft belongs to.
 *
 * Sources:
 *   N*****   (US)  → existing registryLookup (FAAAircraft entity / adsbdb / Supabase)
 *   OK-****  (CZ)  → adsbdb.com (Mode-S global) — ÚCL portal is a JS SPA, no stable API
 *   D-****   (DE)  → adsbdb.com — LBA has no public search API
 *   G-****   (GB)  → adsbdb.com — UK CAA G-INFO is a POST form (best-effort)
 *   <other>        → adsbdb.com (universal Mode-S fallback)
 *
 * All non-FAA lookups are cached in the GlobalRegistry entity (24h TTL) so repeat
 * searches are instant and we can manually enrich records over time.
 *
 * Returns a unified object:
 *   { found, source, origin_country, aircraft, listing, areaServices, searchedAt }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, enrich_listing_id } = await req.json().catch(() => ({}));
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    // Normalize: uppercase, strip spaces, ensure dash for international prefixes
    const fullReg = normalizeRegistration(registration);
    const country = detectCountry(fullReg);

    const result = {
      found: false,
      source: null,
      origin_country: country.code,
      origin_label: country.label,
      aircraft: null,
      listing: null,
      areaServices: null,
      searchedAt: new Date().toISOString(),
    };

    // ── 1. Check GlobalRegistry cache (all countries — instant for recently checked) ──
    try {
      const cached = await base44.asServiceRole.entities.GlobalRegistry.filter(
        { registration: fullReg },
        '-created_date',
        1
      );
      if (cached.length > 0) {
        const c = cached[0];
        const ageMs = Date.now() - new Date(c.last_verified_at || c.updated_date || c.created_date).getTime();
        const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — "recently checked" instant cache
        if (ageMs < CACHE_TTL_MS && c.raw_data?.full_result) {
          // Full cache hit — return everything instantly, zero external API calls
          const fr = c.raw_data.full_result;
          return Response.json({
            found: true,
            source: 'cache',
            origin_country: c.country_code || fr.origin_country,
            origin_label: fr.origin_label,
            aircraft: { ...fr.aircraft, registered_owner: fr.aircraft?.registered_owner ? '****' : null },
            listing: fr.listing || null,
            areaServices: fr.areaServices || null,
            searchedAt: new Date().toISOString(),
            cached: true,
          });
        }
        // Stale cache — use cached aircraft data but refresh listing/areaServices live
        if (c.raw_data?.full_result?.aircraft) {
          result.found = true;
          result.source = 'cache';
          result.aircraft = {
            ...c.raw_data.full_result.aircraft,
            registered_owner: c.raw_data.full_result.aircraft.registered_owner ? '****' : null,
          };
        }
      }
    } catch (_) { /* cache miss is fine */ }

    // ── 2. US (N-) → inline FAA lookup (FAAAircraft entity → adsbdb → Supabase) ──
    // Inlined (not delegated) because function-to-function invocation does not
    // propagate the user auth context, which would make registryLookup reject.
    if (!result.found && country.code === 'US') {
      const nNumber = fullReg.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '');

      // 2a. FAAAircraft entity (already synced — works even when Supabase is down)
      try {
        const faaResults = await base44.asServiceRole.entities.FAAAircraft.filter(
          { n_number: nNumber },
          '-created_date',
          1
        );
        if (faaResults.length > 0) {
          result.found = true;
          result.source = 'faa_entity';
          result.aircraft = mapFAA(faaResults[0], `N${nNumber}`);
        }
      } catch (_) { /* non-critical */ }

      // 2b. adsbdb.com live backup
      if (!result.found) {
        const adsbData = await fetchAdsbdb(fullReg);
        if (adsbData) {
          result.found = true;
          result.source = 'adsbdb';
          result.aircraft = mapAdsbdb(adsbData, fullReg, country);
        }
      }

      // 2c. Supabase single-import (last resort) then re-read entity
      if (!result.found) {
        try {
          const supabaseRes = await base44.functions.invoke('syncFaaFromSupabase', {
            mode: 'registry_import_single',
            n_number: nNumber,
          });
          if (supabaseRes.data?.success) {
            const retry = await base44.asServiceRole.entities.FAAAircraft.filter(
              { n_number: nNumber },
              '-created_date',
              1
            );
            if (retry.length > 0) {
              result.found = true;
              result.source = 'supabase';
              result.aircraft = mapFAA(retry[0], `N${nNumber}`);
            }
          }
        } catch (_) { /* Supabase down — OK */ }
      }

      // 2d. Enrich make/model from ACFTREF if mfr_mdl_code present
      if (result.found && result.aircraft?.mfr_mdl_code && (!result.aircraft.make || !result.aircraft.model)) {
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
            }
          }
        } catch (_) { /* non-critical */ }
      }

      // 2e. Optional: auto-enrich a specific listing
      if (enrich_listing_id && result.found && result.aircraft) {
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
            if (!l.year && result.aircraft.year) updateData.year = result.aircraft.year;
            if (Object.keys(updateData).length > 0) {
              await base44.asServiceRole.entities.AircraftListing.update(l.id, updateData);
              result.enriched = true;
              result.enrichedFields = Object.keys(updateData);
            }
          }
        } catch (_) { /* non-critical */ }
      }
    }

    // ── 3. International → adsbdb.com (global Mode-S database) ──
    if (!result.found && country.code !== 'US') {
      try {
        const adsbData = await fetchAdsbdb(fullReg);
        if (adsbData) {
          result.found = true;
          result.source = 'adsbdb';
          result.aircraft = mapAdsbdb(adsbData, fullReg, country);
          // Persist to cache for fast repeat lookups
          await cacheGlobalRegistry(base44, result.aircraft, 'adsbdb');
        }
      } catch (_) { /* non-critical */ }
    }

    // ── 4. ABOS listing match (all countries) ──
    if (!result.listing && result.found) {
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
    }

    // ── 5. Area services (US only — dealer registry is US-scoped) ──
    if (!result.areaServices && result.aircraft?.state) {
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

    if (!result.found) {
      return Response.json({
        ...result,
        error: `No registry record found for ${fullReg} (${country.label}).`,
      }, { status: 404 });
    }

    // ── 6. Write to cache for instant repeat lookups ──
    if (result.aircraft && result.source !== 'cache') {
      try {
        await cacheGlobalRegistry(base44, result.aircraft, result.source, {
          listing: result.listing,
          areaServices: result.areaServices,
          origin_label: country.label,
        });
      } catch (_) { /* cache write is non-critical */ }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Helpers ──────────────────────────────────────────────

// Prefixes that use a dash separator in their canonical form.
// Used to auto-insert the dash when the user omits it (e.g. "OK2001" → "OK-2001").
const DASH_PREFIXES = ['OK', 'D', 'G', 'F', 'I', 'EC', 'EA', 'SE', 'OO', 'PH', 'HB', 'OE', 'LN', 'OY', 'ZK', 'VH', 'CS', 'B', '9M'];

function normalizeRegistration(raw) {
  if (!raw) return '';
  // Uppercase, strip all whitespace
  let r = String(raw).toUpperCase().replace(/\s+/g, '');
  // Auto-insert dash for international prefixes that use one
  for (const p of DASH_PREFIXES) {
    if (r.startsWith(p) && !r.startsWith(p + '-')) {
      r = p + '-' + r.slice(p.length);
      break;
    }
  }
  return r;
}

function detectCountry(reg) {
  const r = reg.toUpperCase();
  if (/^N[A-Z0-9]{1,5}$/.test(r) || /^N\d/.test(r)) {
    return { code: 'US', label: 'United States (FAA)' };
  }
  if (r.startsWith('OK-')) return { code: 'CZ', label: 'Czech Republic (ÚCL)' };
  if (r.startsWith('D-')) return { code: 'DE', label: 'Germany (LBA)' };
  if (r.startsWith('G-')) return { code: 'GB', label: 'United Kingdom (CAA)' };
  if (r.startsWith('F-')) return { code: 'FR', label: 'France (DGAC)' };
  if (r.startsWith('I-')) return { code: 'IT', label: 'Italy (ENAC)' };
  if (r.startsWith('EC-') || r.startsWith('EA-')) return { code: 'ES', label: 'Spain (AESA)' };
  if (r.startsWith('SE-')) return { code: 'SE', label: 'Sweden' };
  if (r.startsWith('OO-')) return { code: 'BE', label: 'Belgium' };
  if (r.startsWith('PH-')) return { code: 'NL', label: 'Netherlands' };
  if (r.startsWith('HB-')) return { code: 'CH', label: 'Switzerland' };
  if (r.startsWith('OE-')) return { code: 'AT', label: 'Austria' };
  if (r.startsWith('LN-')) return { code: 'NO', label: 'Norway' };
  if (r.startsWith('OY-')) return { code: 'DK', label: 'Denmark' };
  if (r.startsWith('CS-')) return { code: 'PT', label: 'Portugal' };
  if (r.startsWith('C-F') || r.startsWith('C-G')) return { code: 'CA', label: 'Canada' };
  if (r.startsWith('VH-')) return { code: 'AU', label: 'Australia' };
  if (r.startsWith('ZK-')) return { code: 'NZ', label: 'New Zealand' };
  if (r.startsWith('JA')) return { code: 'JP', label: 'Japan' };
  if (r.startsWith('B-')) return { code: 'CN', label: 'China' };
  if (r.startsWith('A7')) return { code: 'QA', label: 'Qatar' };
  if (r.startsWith('9M')) return { code: 'MY', label: 'Malaysia' };
  return { code: 'XX', label: 'International' };
}

async function fetchAdsbdb(fullReg) {
  // Try the canonical form first, then a dashless variant as fallback
  const variants = [fullReg];
  if (fullReg.includes('-')) variants.push(fullReg.replace(/-/g, ''));
  for (const v of variants) {
    try {
      const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(v)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const ac = data?.response?.aircraft;
      if (ac && ac.registration) return ac;
    } catch (_) { /* try next variant */ }
  }
  return null;
}

function mapAdsbdb(ac, fullReg, country) {
  return {
    registration: ac.registration || fullReg,
    make: ac.manufacturer || null,
    model: ac.type || null,
    icao_type: ac.icao_type || null,
    mode_s_hex: ac.mode_s || null,
    year: null,
    serial_number: null,
    type_aircraft: null,
    engine_type: null,
    status: 'active',
    country: ac.registered_owner_country_name || country.label,
    country_iso: ac.registered_owner_country_iso_name || country.code,
    registered_owner: ac.registered_owner ? '****' : null,
    url_photo: ac.url_photo || null,
    url_photo_thumbnail: ac.url_photo_thumbnail || null,
    origin_country: country.code,
  };
}

function mapFAA(faa, fullReg) {
  return {
    registration: fullReg,
    make: faa.make || null,
    model: faa.model || null,
    year: faa.year_mfr || null,
    serial_number: faa.serial_number || null,
    mode_s_hex: faa.mode_s_hex || null,
    icao_type: null,
    type_aircraft: faa.type_aircraft || null,
    engine_type: faa.type_engine || null,
    status: faa.status_code || null,
    state: faa.state || null,
    country: faa.country || 'United States',
    country_iso: 'US',
    cert_issue_date: faa.cert_issue_date || null,
    expiration_date: faa.expiration_date || null,
    air_worth_date: faa.air_worth_date || null,
    last_action_date: faa.last_action_date || null,
    engine_mfr: faa.engine_mfr || null,
    engine_model: faa.engine_model || null,
    horsepower: faa.horsepower || null,
    thrust: faa.thrust || null,
    mfr_mdl_code: faa.mfr_mdl_code || null,
    origin_country: 'US',
  };
}

function mapCached(c) {
  return {
    registration: c.registration,
    make: c.make || null,
    model: c.model || null,
    year: c.year || null,
    serial_number: c.serial_number || null,
    mode_s_hex: c.mode_s_hex || null,
    icao_type: c.icao_type || null,
    type_aircraft: c.type_aircraft || null,
    engine_type: c.engine_type || null,
    status: c.status || null,
    country: null,
    country_iso: c.country_code || null,
    origin_country: c.country_code || null,
    url_photo: c.raw_data?.url_photo || null,
    url_photo_thumbnail: c.raw_data?.url_photo_thumbnail || null,
  };
}

async function cacheGlobalRegistry(base44, aircraft, source, extras = {}) {
  try {
    const record = {
      registration: aircraft.registration,
      country_code: aircraft.origin_country || null,
      make: aircraft.make || null,
      model: aircraft.model || null,
      year: aircraft.year || null,
      serial_number: aircraft.serial_number || null,
      mode_s_hex: aircraft.mode_s_hex || null,
      icao_type: aircraft.icao_type || null,
      type_aircraft: aircraft.type_aircraft || null,
      engine_type: aircraft.engine_type || null,
      status: aircraft.status || null,
      source,
      raw_data: {
        url_photo: aircraft.url_photo || null,
        url_photo_thumbnail: aircraft.url_photo_thumbnail || null,
        registered_owner: aircraft.registered_owner ? '****' : null,
        country: aircraft.country || null,
        full_result: {
          aircraft,
          listing: extras.listing || null,
          areaServices: extras.areaServices || null,
          origin_label: extras.origin_label || null,
        },
      },
      last_verified_at: new Date().toISOString(),
    };
    // Upsert: update existing or create new
    const existing = await base44.asServiceRole.entities.GlobalRegistry.filter(
      { registration: aircraft.registration },
      '-created_date',
      1
    );
    if (existing.length > 0) {
      await base44.asServiceRole.entities.GlobalRegistry.update(existing[0].id, record);
    } else {
      await base44.asServiceRole.entities.GlobalRegistry.create(record);
    }
  } catch (_) { /* cache write is non-critical */ }
}