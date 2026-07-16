import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';

/**
 * Expert CrossCheck Stripe Checkout — create + confirm modes.
 *
 * mode='create': { crosscheck_id, expert_bid_id, return_url } → { sessionUrl }
 *   Creates a Stripe Checkout session for the expert's bid price.
 *
 * mode='confirm': { stripe_session_id } → { confirmed: true, crosscheck_id }
 *   Verifies payment, assigns expert to crosscheck, accepts/rejects bids.
 */
const ALLOWED_RETURN_HOSTS = ['aircraftbuyorsell.com', 'abos.app', 'abos-marketspace.com', 'base44.app', 'base44.com', 'localhost'];

function getSafeReturnUrl(rawReturnUrl, requestUrl) {
  const fallback = new URL('/experts', requestUrl).toString();
  if (!rawReturnUrl) return fallback;
  if (rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')) {
    return new URL(rawReturnUrl, requestUrl).toString();
  }
  const parsed = new URL(rawReturnUrl);
  const isAllowed = ALLOWED_RETURN_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  if (!isAllowed) throw new Error('return_url must use an approved app domain');
  return parsed.toString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'create';

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // ── CREATE MODE ──
    if (mode === 'create') {
      const { crosscheck_id, expert_bid_id, return_url } = body;
      let safeReturnUrl;
      try {
        safeReturnUrl = getSafeReturnUrl(String(return_url || '').trim(), req.url);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      if (!crosscheck_id || !expert_bid_id) {
        return Response.json({ error: 'crosscheck_id and expert_bid_id required' }, { status: 400 });
      }

      // Fetch the bid to get price and expert info
      const bid = await base44.entities.ExpertBid.get(expert_bid_id);
      if (!bid || bid.status !== 'pending') {
        return Response.json({ error: 'Bid not available' }, { status: 400 });
      }

      // Verify the requester owns this crosscheck
      const crosscheck = await base44.entities.ExpertCrossCheck.get(crosscheck_id);
      if (!crosscheck || crosscheck.requester_email !== user.email) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Expert CrossCheck — ${crosscheck.registration}`,
              description: `Independent validation by ${bid.expert_name} (${(bid.expert_certifications || []).join(', ')})`,
            },
            unit_amount: Math.round(bid.price_eur * 100),
          },
          quantity: 1,
        }],
        success_url: `${safeReturnUrl}${safeReturnUrl.includes('?') ? '&' : '?'}expert_paid=${encodeURIComponent(crosscheck_id)}&stripe_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${safeReturnUrl}${safeReturnUrl.includes('?') ? '&' : '?'}expert_canceled=true`,
        metadata: {
          product: 'expert_crosscheck',
          crosscheck_id,
          expert_bid_id,
          expert_id: bid.expert_id,
          requester_email: user.email,
        },
      });

      return Response.json({ sessionId: session.id, sessionUrl: session.url });
    }

    // ── CONFIRM MODE ──
    if (mode === 'confirm') {
      const { stripe_session_id } = body;
      if (!stripe_session_id) {
        return Response.json({ error: 'stripe_session_id required' }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.retrieve(stripe_session_id);
      if (session.payment_status !== 'paid') {
        return Response.json({ error: 'Payment not completed' }, { status: 400 });
      }

      const { crosscheck_id, expert_bid_id, expert_id } = session.metadata || {};
      if (!crosscheck_id || !expert_bid_id) {
        return Response.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Fetch the accepted bid
      const bid = await base44.asServiceRole.entities.ExpertBid.get(expert_bid_id);

      // Update crosscheck to in_progress with expert assigned
      await base44.asServiceRole.entities.ExpertCrossCheck.update(crosscheck_id, {
        status: 'in_progress',
        expert_id: bid.expert_id,
        expert_name: bid.expert_name,
        expert_certifications: bid.expert_certifications || [],
        stripe_payment_id: stripe_session_id,
        price_paid_eur: bid.price_eur,
      });

      // Accept the winning bid
      await base44.asServiceRole.entities.ExpertBid.update(expert_bid_id, { status: 'accepted' });

      // Reject all other pending bids for this crosscheck
      await base44.asServiceRole.entities.ExpertBid.updateMany(
        { crosscheck_id, status: 'pending' },
        { $set: { status: 'rejected' } }
      );

      return Response.json({ confirmed: true, crosscheck_id });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});