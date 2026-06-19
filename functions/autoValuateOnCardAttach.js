import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Triggered by entity automation when an ATICard is created.
 * Automatically runs Expert Market Valuation on the linked AircraftListing
 * and persists omvm_value, deal_score, deal_label, discount_pct back to the listing.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Validate caller — must be an authenticated user or an entity automation event
    const user = await base44.auth.me();
    const { event, data } = payload;

    if (!user && !event) {
      return Response.json({ error: 'Forbidden: must be authenticated or triggered by entity automation' }, { status: 403 });
    }

    console.log(`📡 autoValuateOnCardAttach triggered: event=${event?.type}, card=${event?.entity_id}`);

    const card = data;
    if (!card) {
      console.warn('No card data in payload');
      return Response.json({ ok: false, reason: 'no_card_data' });
    }

    const listingId = card.listing;
    if (!listingId) {
      console.warn('ATICard has no linked listing, skipping valuation');
      return Response.json({ ok: false, reason: 'no_listing_attached' });
    }

    // Fetch the listing
    const listing = await base44.asServiceRole.entities.AircraftListing.get(listingId);
    if (!listing) {
      console.warn(`Listing ${listingId} not found`);
      return Response.json({ ok: false, reason: 'listing_not_found' });
    }

    console.log(`🔢 Running Expert Valuation for listing ${listingId}: ${listing.year} ${listing.make} ${listing.model}`);

    // Invoke marketExpertValuation as service role
    const response = await base44.asServiceRole.functions.invoke('marketExpertValuation', { listingId });
    const result = response?.data ?? response;

    if (!result?.market_estimate) {
      console.warn('marketExpertValuation returned no value', JSON.stringify({ status: response?.status, data: result }));
      return Response.json({ ok: false, reason: 'valuation_no_result' });
    }

    console.log(`✅ Valuation complete for ${listingId}: Estimate=$${result.market_estimate}, deal=${result.deal_label}, score=${result.deal_score}`);

    return Response.json({
      ok: true,
      listingId,
      omvm_value: result.market_estimate,
      deal_score: result.deal_score,
      deal_label: result.deal_label,
      discount_pct: result.discount_pct,
      confidence: result.confidence,
    });

  } catch (error) {
    console.error('autoValuateOnCardAttach error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});