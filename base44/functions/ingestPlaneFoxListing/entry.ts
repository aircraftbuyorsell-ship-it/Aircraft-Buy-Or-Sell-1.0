import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { resolveAircraftTwin, supabaseRest } from '../_shared/aircraftTwin.ts';
import { mapPlaneFoxListing, planIngest } from '../_shared/planeFoxAti.mjs';

// PlaneFox → ABOS ATI Passport ingestion.
//
// PlaneFox is an external customer/data provider: its listings are ingested
// and normalized only. This endpoint never fabricates an ICAO hex, never
// treats PlaneFox as an ATI/OMVM computation source, and never lets a
// PlaneFox value overwrite a higher-priority verified ABOS identity field.
// All decision logic (ID format, identity status, idempotent create/update
// plan) lives in ../_shared/planeFoxAti.mjs so it is independently unit-tested.
//
// Accepts a single already-fetched PlaneFox listing payload in the request
// body (either `{ listing: {...} }` or the listing object directly). No
// PlaneFox API client exists in this repo yet — wiring a fetch-by-listing-id
// PlaneFox connector is a follow-up; this endpoint is the stable ingestion
// contract it will call once that exists.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const rawListing = body.listing || body.raw_listing || body;
    const normalizedListing = mapPlaneFoxListing(rawListing);
    if (!normalizedListing.source_record_id) {
      return Response.json({ error: 'listing_id (PlaneFox listing ID) is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1) Aircraft identity (Supabase aircraft_passports — Digital Twin
    //    system-of-record). resolveAircraftTwin only creates a row when none
    //    exists; an existing row is returned untouched, so a PlaneFox value
    //    can never overwrite an identity ABOS already had on file.
    let preExistingTwin = null;
    if (normalizedListing.tailnumber) {
      const rows = await supabaseRest(
        `aircraft_passports?registration=eq.${encodeURIComponent(normalizedListing.tailnumber)}` +
        `&select=id,registration,icao24,serial_number,make,model,year_manufactured&limit=1`
      );
      preExistingTwin = rows?.[0] || null;

      await resolveAircraftTwin(normalizedListing.tailnumber, {
        source: 'planefox_listing',
        ...(normalizedListing.specific_icao_hex ? { icao24: normalizedListing.specific_icao_hex.toLowerCase() } : {}),
      });
    }

    // 2) Existing ATIPassport for the deterministic passport_id, if any —
    //    this is the idempotency/dedup key (provider + specific_icao_hex + tailnumber).
    let existingPassport = null;
    if (normalizedListing.specific_icao_hex && normalizedListing.tailnumber) {
      const passportId = `ID_ABOS_PLANEFOX_${normalizedListing.specific_icao_hex}_${normalizedListing.tailnumber}`;
      const matches = await base44.asServiceRole.entities.ATIPassport.filter(
        { passport_id: passportId }, '-created_date', 1
      );
      existingPassport = matches?.[0] || null;
    }

    const plan = planIngest({ normalizedListing, preExistingTwin, existingPassport, now });

    // 3) Idempotent listing/provenance upsert — Supabase is the source of
    //    truth for the raw ingested record and its source evidence (photos/
    //    documents), keyed by (provider, source_record_id).
    await supabaseRest('abos_planefox_listings?on_conflict=provider,source_record_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([plan.listing_patch]),
    });

    // 4) Idempotent ATIPassport create/update (extends the existing Base44
    //    ATIPassport entity — no parallel passport data model).
    let base44Id = existingPassport?.id || null;
    if (plan.passport_action === 'create') {
      const created = await base44.asServiceRole.entities.ATIPassport.create(plan.passport_patch);
      base44Id = created.id;
    } else if (plan.passport_action === 'update' && existingPassport) {
      await base44.asServiceRole.entities.ATIPassport.update(existingPassport.id, plan.passport_patch);
    }

    return Response.json({ ...plan.response, base44_id: base44Id });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
