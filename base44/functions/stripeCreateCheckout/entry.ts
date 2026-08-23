import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

const BUYER_PLANS = {
  buyer_monthly: { amount: 19900, interval: 'month', plan: 'monthly', label: 'ABOS Buyer Pro Monthly', currency: 'usd' },
  buyer_annual: { amount: 99900, interval: 'year', plan: 'annual', label: 'ABOS Buyer Pro Annual', currency: 'usd' },
  // ── Simple plan for Buyers & Sellers ──
  abos_pro_monthly: { amount: 19900, interval: 'month', plan: 'monthly', label: 'ABOS Pro — Monthly', currency: 'eur' },
  abos_pro_annual: { amount: 199000, interval: 'year', plan: 'annual', label: 'ABOS Pro — Annual', currency: 'eur' },
  // ── Tiered membership for individual sellers ──
  abos_seller_starter: { amount: 2900, interval: 'month', plan: 'monthly', label: 'ABOS Seller — Starter (T1)', currency: 'eur' },
  abos_seller_pro: { amount: 9900, interval: 'month', plan: 'monthly', label: 'ABOS Seller — Pro (T2)', currency: 'eur' },
  // ── Volume plans for Marketplaces ──
  abos_market_growth: { amount: 49900, interval: 'month', plan: 'monthly', label: 'ABOS Marketplace — Growth', currency: 'eur' },
  abos_market_scale: { amount: 99900, interval: 'month', plan: 'monthly', label: 'ABOS Marketplace — Scale', currency: 'eur' },
  abos_market_enterprise: { amount: 199900, interval: 'month', plan: 'monthly', label: 'ABOS Marketplace — Enterprise', currency: 'eur' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { priceId, packName, tokens, priceUsd, tier, subTier, returnUrl, plan_type } = await req.json();
    if (!returnUrl) return Response.json({ error: 'Missing returnUrl' }, { status: 400 });

    const buyerPlan = BUYER_PLANS[plan_type];
    if (buyerPlan) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [{
          price_data: {
            currency: buyerPlan.currency,
            product_data: { name: buyerPlan.label },
            unit_amount: buyerPlan.amount,
            recurring: { interval: buyerPlan.interval },
          },
          quantity: 1,
        }],
        success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
        metadata: { user_id: user.id, user_email: user.email, plan_type },
        subscription_data: { metadata: { user_id: user.id, user_email: user.email, plan_type } },
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
      success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
      metadata: { user_id: user.id, user_email: user.email, pack_name: packName || '', tokens: String(tokens || 0), price_usd: String(priceUsd || 0), tier: tier || '', sub_tier: subTier || '' },
    });
    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (_) {
    return Response.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
});