import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { priceId, packName, tokens, priceUsd, tier, subTier, returnUrl, plan_type } = await req.json();

    if (plan_type === 'buyer_monthly' || plan_type === 'buyer_annual') {
      const annual = plan_type === 'buyer_annual';
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [{ price_data: { currency: 'usd', unit_amount: annual ? 99900 : 19900, recurring: { interval: annual ? 'year' : 'month' }, product_data: { name: annual ? 'ABOS BUY Annual' : 'ABOS BUY Monthly' } }, quantity: 1 }],
        success_url: `${returnUrl}&stripe_session={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}&canceled=true`,
        metadata: { product: 'buyer_subscription', buyer_plan: annual ? 'annual' : 'monthly', user_id: user.id, user_email: user.email },
        subscription_data: { metadata: { product: 'buyer_subscription', buyer_plan: annual ? 'annual' : 'monthly', user_id: user.id, user_email: user.email } },
      });
      return Response.json({ sessionId: session.id, sessionUrl: session.url });
    }

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
        user_id:    user.id,
        user_email: user.email,
        pack_name:  packName || '',
        tokens:     String(tokens  || 0),
        price_usd:  String(priceUsd || 0),
        tier:       tier     || '',
        sub_tier:   subTier  || '',
      },
    });

    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});