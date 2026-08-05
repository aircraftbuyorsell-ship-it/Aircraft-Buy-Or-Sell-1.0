import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { value } = await req.json();
    if (!value) return Response.json({ error: 'Listing URL or N-number required' }, { status: 400 });
    const registration = String(value).match(/\bN\d{1,5}[A-Z]{0,2}\b/i)?.[0]?.toUpperCase() || '';
    const listings = registration ? await base44.asServiceRole.entities.AircraftListing.filter({ registration }, '-created_date', 1) : [];
    const listing = listings[0]; const token = crypto.randomUUID();
    const intent = await base44.entities.BuyerIntent.create({ buyer_email: user.email, listing: listing?.id, registration, external_url: value.startsWith('http') ? value : '', aircraft_label: listing ? `${listing.year || ''} ${listing.make} ${listing.model} ${listing.registration || ''}`.trim() : registration || 'External aircraft', seller_email: listing ? undefined : '', status: listing ? 'matched' : 'claim_pending', claim_token: token });
    if (listing) return Response.json({ ok: true, intent, message: 'Seller is on ABOS. Your offer connection is ready.' });
    const claimUrl = `${new URL(req.url).origin}/sell?claim=${intent.id}&utm_source=buyer_intent`;
    return Response.json({ ok: true, intent, claimUrl, message: 'Seller not found in ABOS. Share the claim link to bring them into this deal.' });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});