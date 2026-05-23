import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { priceId, packName, tokens, priceUsd, returnUrl } = await req.json();

    if (!priceId) return Response.json({ error: 'Missing priceId' }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}&stripe_session={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}&canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        pack_name: packName || '',
        tokens: String(tokens || 0),
        price_usd: String(priceUsd || 0),
      },
    });

    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});