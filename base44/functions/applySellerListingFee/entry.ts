import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function calculateFindersFee(askingPrice) {
  const price = Number(askingPrice);
  if (!Number.isFinite(price) || price < 0) throw new Error('asking_price must be a non-negative number');
  const pct = price < 100000 ? 2.5 : price < 500000 ? 1.5 : price < 1000000 ? 1.0 : 0.5;
  return Math.round(price * (pct / 100) * 100) / 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const listingId = body.data?.id || body.event?.entity_id;
    if (!body.data && !listingId) return Response.json({ skipped: true, reason: 'No listing in automation payload' });
    const listing = body.data || await base44.asServiceRole.entities.AircraftListing.get(listingId);
    if (!listing) return Response.json({ skipped: true, reason: 'Listing not found' });

    const ownerId = listing.owner || listing.created_by_id;
    if (!ownerId) return Response.json({ skipped: true, reason: 'Listing has no owner' });
    const owner = await base44.asServiceRole.entities.User.get(ownerId);
    if (!owner?.email) return Response.json({ skipped: true, reason: 'Owner account not found' });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: owner.email }, '-created_date', 1);
    const profile = profiles[0];
    if (!profile || !['seller', 'both'].includes(profile.pipeline_role)) return Response.json({ skipped: true, reason: 'Owner is not a seller' });

    const listings = await base44.asServiceRole.entities.AircraftListing.filter({ owner: ownerId }, '-created_date', 10000);
    const total = listings.length;
    const profileUpdate = { total_listings_count: total };
    if (!profile.seller_free_listing_used) profileUpdate.seller_free_listing_used = true;
    await base44.asServiceRole.entities.UserProfile.update(profile.id, profileUpdate);

    if (total <= 1) return Response.json({ free_listing: true, total_listings_count: total });
    const pendingFee = calculateFindersFee(listing.asking_price);
    await base44.asServiceRole.entities.AircraftListing.update(listing.id, { pending_fee_usd: pendingFee });
    return Response.json({ free_listing: false, total_listings_count: total, pending_fee_usd: pendingFee });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});