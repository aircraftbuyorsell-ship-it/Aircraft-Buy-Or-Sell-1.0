import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Auto-enriches an AircraftListing with registry data when it's created or updated.
 * Triggered by an entity automation on AircraftListing create/update.
 *
 * Only fills fields that are missing — never overwrites user-provided data.
 * Stops immediately if make & model are already set (no infinite loop).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Entity automations have no user context — trusted invocation
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = user?.role === 'admin';
    } catch (_) {
      isAuthorized = true; // scheduled/entity automation
    }
    if (!isAuthorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { event, data } = body;

    if (!data) {
      return Response.json({ skipped: true, reason: 'no data in payload' });
    }

    const listingId = data.id || event?.entity_id;
    if (!listingId) {
      return Response.json({ skipped: true, reason: 'no listing id' });
    }

    const registration = data.registration;
    if (!registration || !/^N/i.test(registration)) {
      return Response.json({ skipped: true, reason: 'no N-registration' });
    }

    // Skip if make and model are already filled — nothing to enrich, prevents loops
    if (data.make && data.model && data.make !== 'Unknown' && data.model !== 'Unknown') {
      return Response.json({ skipped: true, reason: 'make and model already set' });
    }

    // Call registryLookup to get aircraft data from multiple sources
    const lookupRes = await base44.functions.invoke('registryLookup', {
      registration,
      enrich_listing_id: listingId,
    });

    const lookupData = lookupRes.data;
    if (!lookupData?.found || !lookupData?.aircraft) {
      return Response.json({ skipped: true, reason: 'registry lookup found nothing' });
    }

    return Response.json({
      enriched: true,
      listing_id: listingId,
      source: lookupData.source,
      enrichedFields: lookupData.enrichedFields || [],
      aircraft: {
        make: lookupData.aircraft.make,
        model: lookupData.aircraft.model,
        year: lookupData.aircraft.year_mfr,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});