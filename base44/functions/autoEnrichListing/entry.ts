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

    const user = await base44.auth.me().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const { event, data } = body;

    // Unified privileged-role check: admin and super_admin are equivalent for
    // operational enrichment. Entity workflows may run under the listing owner
    // rather than an admin identity, so those calls are allowed only for the
    // exact listing owned by the authenticated user.
    const isPrivileged = user?.role === 'admin' || user?.role === 'super_admin';
    const listingIdForAuth = data?.id || event?.entity_id;
    let isOwnedWorkflow = false;

    if (!isPrivileged && user?.id && listingIdForAuth) {
      try {
        const owned = await base44.asServiceRole.entities.AircraftListing.filter(
          { id: listingIdForAuth },
          '-created_date',
          1
        );
        isOwnedWorkflow = owned.length > 0 && owned[0].created_by_id === user.id;
      } catch (_) {
        isOwnedWorkflow = false;
      }
    }

    if (!isPrivileged && !isOwnedWorkflow) {
      return Response.json({ error: 'Admin access required for non-owner listings' }, { status: 403 });
    }

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

    const maintenanceResponse = await base44.functions.invoke('calculateEngineMaintenance', {
      registration,
      engine_hours: data.engine_hours,
      listing_id: listingId,
    });
    const maintenance = maintenanceResponse.data?.results?.[0] || null;

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

    // ── Also fetch aircraft photo (adsbdb real photo or HF-generated) ──
    let photoResult = null;
    try {
      const photoRes = await base44.functions.invoke('aircraftPhoto', {
        registration,
        make: lookupData.aircraft.make || data.make,
        model: lookupData.aircraft.model || data.model,
      });
      photoResult = photoRes.data;
      if (photoResult?.photo_url) {
        await base44.asServiceRole.entities.AircraftListing.update(listingId, {
          photo_url: photoResult.photo_url,
          photo_source: photoResult.source || 'none',
        });
      }
    } catch (_) { /* non-critical — photo is optional */ }

    return Response.json({
      enriched: true,
      listing_id: listingId,
      source: lookupData.source,
      enrichedFields: lookupData.enrichedFields || [],
      photo: photoResult?.photo_url || null,
      photoSource: photoResult?.source || null,
      maintenance,
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