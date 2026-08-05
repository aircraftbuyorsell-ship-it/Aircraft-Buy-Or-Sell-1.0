import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function feeFor(price) { const value = Number(price) || 0; if (value < 100000) return { percent: 2.5, cap: 2475 }; if (value < 500000) return { percent: 1.5, cap: 7485 }; if (value < 1000000) return { percent: 1, cap: 9990 }; return { percent: 0.5, cap: null }; }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { registration, make, model, year, asking_price } = await req.json();
    if (!asking_price || (!registration && (!make || !model))) return Response.json({ error: 'Enter an N-number or make and model, plus price' }, { status: 400 });
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1); const profile = profiles[0];
    const count = profile?.total_listings_count || 0; const freeListing = !profile?.seller_free_listing_used || count === 0;
    const feeTier = feeFor(asking_price); const fee = Math.min(Number(asking_price) * feeTier.percent / 100, feeTier.cap || Infinity);
    const listing = await base44.entities.AircraftListing.create({ registration: registration || '', make: make || 'Pending registry lookup', model: model || 'Pending registry lookup', year: year ? Number(year) : undefined, asking_price: Number(asking_price), currency: 'USD', status: 'draft', visibility: 'private', owner: user.id });
    const role = profile?.pipeline_role === 'buyer' || profile?.pipeline_role === 'both' ? 'both' : 'seller';
    const profileData = { pipeline_role: role, seller_free_listing_used: true, total_listings_count: count + 1, metadata: { ...(profile?.metadata || {}), seller_fee_quotes: { ...(profile?.metadata?.seller_fee_quotes || {}), [listing.id]: { ...feeTier, fee } } } };
    if (profile) await base44.entities.UserProfile.update(profile.id, profileData); else await base44.entities.UserProfile.create({ user_email: user.email, role: 'seller', tier: 'free_explorer', status: 'active', ...profileData });
    await base44.functions.invoke('autoEnrichListing', { listingId: listing.id }).catch(() => null);
    return Response.json({ ok: true, listing, freeListing, findersFee: { ...feeTier, fee } });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});