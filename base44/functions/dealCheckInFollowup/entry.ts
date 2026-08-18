// Deal Wizard follow-up after a listing view with no contract initiated.
// stage 'first'  → personalized check-in email (48h after the view)
// stage 'second' → follow-up with similar MarketComparables (3 days after the first, if no reply)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ENGAGED_EVENTS = ['seller_contacted', 'offer_submitted', 'buyer_unlocked', 'lead_created', 'deal_closed'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const stage = body?.stage === 'second' ? 'second' : 'first';
    const leadEventId = body?.lead_event_id;

    const user = await base44.auth.me().catch(() => null);
    const isAutomation = !!leadEventId && !user;
    if (!isAutomation && user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!leadEventId) return Response.json({ skipped: 'no lead_event_id' });

    const sr = base44.asServiceRole;
    const events = await sr.entities.LeadEvent.filter({ id: leadEventId }, '', 1);
    const viewEvent = events[0];
    if (!viewEvent) return Response.json({ skipped: 'lead event not found' });

    const email = viewEvent.actor_email;
    if (!email) return Response.json({ skipped: 'no actor_email on view event' });

    // Resolve the viewed aircraft via the ATI card → listing
    let listing = null;
    let registration = '';
    if (viewEvent.ati_card) {
      const cards = await sr.entities.ATICard.filter({ id: viewEvent.ati_card }, '', 1);
      const card = cards[0];
      if (card) {
        registration = card.aircraft_registration || '';
        if (card.listing) {
          const listings = await sr.entities.AircraftListing.filter({ id: card.listing }, '', 1);
          listing = listings[0] || null;
        }
      }
    }
    if (!listing) return Response.json({ skipped: 'no listing linked to view event' });
    registration = registration || listing.registration || '';

    // Contract initiated? (sales pipeline for this buyer / registration)
    const pipelines = await sr.entities.SalesPipeline.filter({ buyer_email: email }, '-created_date', 50);
    if (pipelines.some((p) => !registration || p.registration === registration)) {
      return Response.json({ skipped: 'contract already initiated' });
    }

    // Replied / engaged since the view?
    const since = new Date(viewEvent.created_date).getTime();
    const actorEvents = await sr.entities.LeadEvent.filter({ actor_email: email }, '-created_date', 100);
    const engaged = actorEvents.some(
      (e) => ENGAGED_EVENTS.includes(e.event_type) && new Date(e.created_date).getTime() > since
    );
    if (engaged) return Response.json({ skipped: 'buyer already engaged' });

    const meta = viewEvent.metadata || {};
    if (stage === 'first' && meta.checkin_first_sent_at) return Response.json({ skipped: 'first check-in already sent' });
    if (stage === 'second' && meta.checkin_second_sent_at) return Response.json({ skipped: 'second check-in already sent' });

    const appUrl = body?.app_url || 'https://app.base44.com';
    const label = `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim();
    const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()} ${listing.currency || 'USD'}` : 'price on request';

    // Similar market comparables (second stage only)
    let comparables = [];
    if (stage === 'second') {
      comparables = await sr.entities.MarketComparable.filter({ make: listing.make }, '-fetched_at', 5);
      if (listing.model) {
        const exact = comparables.filter((c) => (c.model || '').toLowerCase().includes(String(listing.model).toLowerCase()));
        if (exact.length) comparables = exact;
      }
    }

    const compareLink = `${appUrl}/compare?make=${encodeURIComponent(listing.make || '')}&model=${encodeURIComponent(listing.model || '')}`;
    const listingLink = `${appUrl}/listings`;

    const facts =
      `Aircraft: ${label || registration}\n` +
      `Registration: ${registration || '—'}\n` +
      `Asking price: ${price}\n` +
      (listing.ati_score != null ? `ATI score: ${listing.ati_score}/120\n` : '') +
      (listing.omvm_value ? `OMVM estimate: $${Number(listing.omvm_value).toLocaleString()}\n` : '') +
      (listing.deal_label ? `Deal classification: ${listing.deal_label}\n` : '');

    const comparablesBlock = comparables.length
      ? comparables
          .map(
            (c) =>
              `• ${c.make} ${c.model} ${c.year_range || ''} — avg $${Number(c.avg_price || 0).toLocaleString()}` +
              (c.listings_count ? ` (${c.listings_count} live listings)` : '')
          )
          .join('\n')
      : 'No fresh comparables on file for this model yet.';

    const prompt =
      stage === 'first'
        ? `You are the ABOS Deal Wizard, a professional aviation deal intelligence assistant. Write a short, personalized check-in email (max 130 words) to a buyer who viewed this aircraft 48 hours ago but has not started a contract. Reference only the facts below — never invent prices, history or scores. Be direct and helpful, offer a valuation walkthrough or a negotiation brief, and close with a single clear next step. Plain text, no subject line, no markdown.\n\nFACTS:\n${facts}\nListing page: ${listingLink}`
        : `You are the ABOS Deal Wizard, a professional aviation deal intelligence assistant. Write a short second follow-up email (max 140 words) to a buyer who viewed this aircraft, received a check-in 3 days ago and did not reply. Do not repeat the first message's pitch — instead position comparable market data as the value, list the comparables verbatim as given, and invite them to compare. Reference only the facts below — never invent numbers. Plain text, no subject line, no markdown.\n\nFACTS:\n${facts}\nSIMILAR MARKET COMPARABLES:\n${comparablesBlock}\nComparables page: ${compareLink}`;

    const generated = await sr.integrations.Core.InvokeLLM({ prompt });
    const emailBody = `${String(generated).trim()}\n\n— ABOS Deal Wizard`;
    const subject =
      stage === 'first'
        ? `Still considering the ${label || registration}?`
        : `Market comparables for the ${label || registration}`;

    await sr.integrations.Core.SendEmail({ to: email, subject, body: emailBody, from_name: 'ABOS Deal Wizard' });

    const stamp = new Date().toISOString();
    await sr.entities.LeadEvent.update(viewEvent.id, {
      metadata: {
        ...meta,
        ...(stage === 'first' ? { checkin_first_sent_at: stamp } : { checkin_second_sent_at: stamp }),
      },
    });

    return Response.json({ ok: true, stage, sent_to: email, registration, comparables: comparables.length });
  } catch (error) {
    console.error('dealCheckInFollowup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});