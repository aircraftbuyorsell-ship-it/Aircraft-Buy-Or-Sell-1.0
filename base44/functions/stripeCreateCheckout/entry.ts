import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

// Server-side allowlist. Never trust a priceId (or any price/token amount) supplied by the browser.
const PRICE_CONFIG = {
  'price_1TaO0mAT7Be3WR6Jepz0eQQS': { tokens: 100, tier: 'pro', sub_tier: 'starter', product_key: 'ATI_SCORE', price_usd: 29 },
  'price_1TaO1rAT7Be3WR6JaWnMa7mx': { tokens: 500, tier: 'pro', sub_tier: 'plus', product_key: 'ATI_FULL_REPORT', price_usd: 99 },
  'price_1TaO2yAT7Be3WR6JjlhagUpB': { tokens: 2000, tier: 'enterprise', sub_tier: 'elite', product_key: 'PRO', price_usd: 299 },
};

// White-Label self-serve subscription plans (Starter/Professional). Server-side
// allowlist mapping our internal plan_type to the real Stripe Price — see
// docs/white-label/agreements/2026-08-26.md and _shared/tenantLicense.mjs's
// PLAN_CAPABILITIES for what each plan grants. Enterprise is deliberately
// absent: it is Contact Sales only, never self-serve checkout.
const TENANT_PLAN_PRICES = {
  wl_starter: { priceId: 'price_1U8skdAT7Be3WR6JKReGd5ym', plan: 'starter', label: 'ABOS White-Label — Starter' },
  wl_professional: { priceId: 'price_1U8skqAT7Be3WR6J1ErACqAC', plan: 'professional', label: 'ABOS White-Label — Professional' },
};

const BUYER_PLANS = {
  buyer_monthly: { amount: 19900, interval: 'month', plan: 'monthly', label: 'ABOS Buyer Pro Monthly', currency: 'usd' },
  buyer_annual: { amount: 99900, interval: 'year', plan: 'annual', label: 'ABOS Buyer Pro Annual', currency: 'usd' },
  abos_pro_monthly: { amount: 19900, interval: 'month', plan: 'monthly', label: 'ABOS Pro — Monthly', currency: 'eur' },
  abos_pro_annual: { amount: 199000, interval: 'year', plan: 'annual', label: 'ABOS Pro — Annual', currency: 'eur' },
  abos_seller_starter: { amount: 2900, interval: 'month', plan: 'monthly', label: 'ABOS Seller — Starter (T1)', currency: 'eur' },
  abos_seller_pro: { amount: 9900, interval: 'month', plan: 'monthly', label: 'ABOS Seller — Pro (T2)', currency: 'eur' },
  abos_market_growth: { amount: 49900, interval: 'month', plan: 'monthly', label: 'ABOS Marketplace — Growth', currency: 'eur' },
  abos_market_scale: { amount: 99900, interval: 'month', plan: 'monthly', label: 'ABOS Marketplace — Scale', currency: 'eur' },
  abos_market_enterprise: { amount: 199900, interval: 'month', plan: 'monthly', label: 'ABOS Marketplace — Enterprise', currency: 'eur' },
};

function allowedReturnOrigin(returnUrl: string): boolean {
  try {
    const url = new URL(returnUrl);
    const configured = (Deno.env.get('ABOS_CHECKOUT_RETURN_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
    return configured.includes(url.origin);
  } catch (_) { return false; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { priceId, returnUrl, plan_type } = await req.json();
    if (!returnUrl || !allowedReturnOrigin(returnUrl)) return Response.json({ error: 'Invalid checkout return origin' }, { status: 400 });

    const buyerPlan = BUYER_PLANS[plan_type];
    if (buyerPlan) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription', payment_method_types: ['card'], customer_email: user.email,
        client_reference_id: user.id,
        line_items: [{ price_data: { currency: buyerPlan.currency, product_data: { name: buyerPlan.label }, unit_amount: buyerPlan.amount, recurring: { interval: buyerPlan.interval } }, quantity: 1 }],
        success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
        metadata: { user_id: user.id, user_email: user.email, plan_type },
        subscription_data: { metadata: { user_id: user.id, user_email: user.email, plan_type } },
      });
      return Response.json({ sessionId: session.id, sessionUrl: session.url });
    }

    const tenantPlan = TENANT_PLAN_PRICES[plan_type];
    if (tenantPlan) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription', payment_method_types: ['card'], customer_email: user.email,
        client_reference_id: user.id,
        line_items: [{ price: tenantPlan.priceId, quantity: 1 }],
        // Card required at signup (Stripe Checkout's default) — never set
        // payment_method_collection: 'if_required' here. A real Price (not
        // price_data) paired with subscription_data.trial_period_days makes
        // Stripe Checkout itself render the exact trial-end charge date and
        // amount to the buyer, satisfying the card-network trial-disclosure
        // requirement without this function having to compute a date.
        subscription_data: {
          trial_period_days: 14,
          metadata: { type: 'tenant_subscription', plan: tenantPlan.plan, user_id: user.id, user_email: user.email },
        },
        custom_fields: [{
          key: 'company_name',
          label: { type: 'custom', custom: 'Company / organization name' },
          type: 'text',
          optional: false,
        }],
        success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
        metadata: { type: 'tenant_subscription', plan: tenantPlan.plan, user_id: user.id, user_email: user.email },
      });
      return Response.json({ sessionId: session.id, sessionUrl: session.url });
    }

    if (!priceId) return Response.json({ error: 'Missing priceId' }, { status: 400 });
    const configuredPrice = PRICE_CONFIG[priceId];
    if (!configuredPrice) return Response.json({ error: 'Price is not allowed' }, { status: 403 });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: ['card'], customer_email: user.email,
      client_reference_id: user.id, line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
      // Only fields actually read downstream (stripeWebhook's handleProductCheckout /
      // legacy token-purchase path) belong here — tokens/tier/sub_tier/price_usd used
      // to be written from this endpoint but were never consumed by anything; the
      // webhook always re-derives grant amounts itself from priceId (PRICE_TOKEN_MAP)
      // or product_key (PRODUCT_KEYS), never from this metadata, so there is nothing
      // left here for a caller to influence.
      metadata: { user_id: user.id, user_email: user.email, product_key: configuredPrice.product_key },
    });
    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (_) {
    return Response.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
});