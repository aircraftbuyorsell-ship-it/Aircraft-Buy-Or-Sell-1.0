import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { getSupabaseConfig, resolveAircraftTwin, supabaseRest } from '../_shared/aircraftTwin.ts';
import { mapPlaneFoxListing, planIngest, PLANEFOX_TWIN_SOURCE } from '../_shared/planeFoxAti.mjs';

// PlaneFox → ABOS ATI Passport ingestion.
//
// PlaneFox is an external customer/data provider: its listings are ingested
// and normalized only. This endpoint never fabricates an ICAO hex, never
// treats PlaneFox as an ATI/OMVM computation source, and never lets a
// PlaneFox value overwrite a higher-priority verified ABOS identity field.
//
// The endpoint supports BOTH:
//   1) an already-fetched `{ listing: {...} }` payload (backwards compatible),
//   2) a real PlaneFox API fetch using `listing_id + source` or `slug`.
//
// PlaneFox authentication is read only from server-side secrets. The token is
// never accepted from the request body and never returned in a response.

const PLANEFOX_API_BASE_URL = (Deno.env.get('PLANEFOX_API_BASE_URL') || 'https://planefox.com').replace(/\/$/, '');
const PLANEFOX_TOKEN =
  Deno.env.get('PLANEFOX_API_TOKEN') ||
  Deno.env.get('PLANEFOX_API_KEY') ||
  Deno.env.get('PLANEFOX_TOKEN') ||
  Deno.env.get('PF_API_TOKEN') ||
  null;

async function fetchPlaneFoxListing({ source, id, slug }) {
  if (!PLANEFOX_TOKEN) {
    throw new Error('PlaneFox API secret is not configured (expected PLANEFOX_API_TOKEN)');
  }

  const params = new URLSearchParams();
  if (source) params.set('source', source);
  if (id) params.set('id', id);
  if (slug) params.set('slug', slug);

  if ((!id || !source) && !slug) {
    throw new Error('PlaneFox fetch requires slug, or both source and listing_id');
  }

  const url = `${PLANEFOX_API_BASE_URL}/api/marketplace/listing-detail?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${PLANEFOX_TOKEN}`,
    },
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`PlaneFox API returned non-JSON (${response.status})`);
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.error || payload?.message || `HTTP ${response.status}`;
    throw new Error(`PlaneFox API request failed: ${detail}`);
  }

  // Accept the documented listing object as well as common envelope shapes.
  return payload?.listing || payload?.data || payload?.result || payload;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fail closed rather than silently "succeeding" with nothing persisted:
    // without Supabase, the source-of-truth listing/provenance write and the
    // conflict check against the Digital Twin both silently no-op.
    const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase is not configured — refusing to ingest without a provenance store' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));

    // Backwards-compatible mode: caller already supplied the listing payload.
    // New mode: caller supplies a PlaneFox listing identifier and this server
    // fetches the canonical listing using the secret Bearer token.
    let rawListing = body.listing || body.raw_listing || null;
    const hasFetchSelector = Boolean(body.slug || body.listing_id || body.id);
    if (!rawListing && hasFetchSelector) {
      rawListing = await fetchPlaneFoxListing({
        source: body.source || body.provider_source || null,
        id: body.listing_id || body.id || null,
        slug: body.slug || null,
      });
    }
    rawListing = rawListing || body;

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
        `&select=id,registration,icao24,serial_number,make,model,year_manufactured,source&limit=1`
      );
      preExistingTwin = rows?.[0] || null;

      await resolveAircraftTwin(normalizedListing.tailnumber, {
        source: PLANEFOX_TWIN_SOURCE,
        ...(normalizedListing.specific_icao_hex ? { icao24: normalizedListing.specific_icao_hex.toLowerCase() } : {}),
      });
    }

    // 2) Existing ATIPassport for this aircraft. ATIPassport is one-per-
    //    registration in this codebase, so the lookup key here is the same
    //    registration, not a provider-scoped shadow passport.
    let existingPassport = null;
    if (normalizedListing.tailnumber) {
      const matches = await base44.asServiceRole.entities.ATIPassport.filter(
        { registration: normalizedListing.tailnumber }, '-created_date', 1
      );
      existingPassport = matches?.[0] || null;
    }

    const plan = planIngest({ normalizedListing, preExistingTwin, existingPassport, now });

    // 3) Idempotent listing/provenance upsert — Supabase is the source of
    //    truth for the raw ingested record and its source evidence.
    await supabaseRest('abos_planefox_listings?on_conflict=provider,source_record_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([plan.listing_patch]),
    });

    // 4) Idempotent ATIPassport create/update. A P0 uniqueness guard on
    //    passport_id protects the rare concurrent-create case.
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
