import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { returnUrl } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Create a subscription checkout with inline price data
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'ABOS Weekly Aviation Briefing',
            description: 'Comprehensive weekly market intelligence across 8 aviation sectors — GA, business jets, financing, fuel, regulatory, stocks, sustainability, and real estate.',
          },
          unit_amount: 1200, // €12.00/month
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${returnUrl}&stripe_session={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}&canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        product: 'newsletter_subscription',
      },
    });

    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});