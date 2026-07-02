import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';

/**
 * Creates a Stripe Checkout session for a one-off Global Compliance Report purchase.
 * Uses inline price_data (no pre-existing Stripe Price ID needed).
 *
 * Input: { registration, returnUrl }
 * Returns: { sessionId, sessionUrl }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, returnUrl } = await req.json();
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Global Compliance Report',
            description: `Triple-check compliance report for aircraft ${registration}`,
          },
          unit_amount: 3900, // 39.00 EUR in cents
        },
        quantity: 1,
      }],
      success_url: `${returnUrl}&stripe_session={CHECKOUT_SESSION_ID}&success=true&gcr_unlocked=${encodeURIComponent(registration)}`,
      cancel_url: `${returnUrl}&canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        product: 'gcr_unlock',
        registration,
      },
    });

    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});