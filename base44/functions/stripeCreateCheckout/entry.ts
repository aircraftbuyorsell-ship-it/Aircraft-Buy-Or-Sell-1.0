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

const SKYDEALS_EMAIL = 'skydealseurope@gmail.com';
const SKYDEALS_PLAN_TYPE = 'skydeals_custom_quarterly';

// Origins checkout may hand the buyer back to. ABOS_CHECKOUT_RETURN_ORIGINS
// (comma-separated) stays authoritative when set. When it is NOT set we fall
// back to these known-good ABOS origins rather than an empty allowlist —
// an empty allowlist rejects *every* checkout with a 400, which is exactly how
// this shipped: the variable was never configured, so "Start 14-day trial"
// (and every other plan) died on 'Invalid checkout return origin'.
const DEFAULT_RETURN_ORIGINS = [
  'https://aircraftbuyorsell.com',
  'https://www.aircraftbuyorsell.com',
  'https://abos-marketspace.com',
  'https://www.abos-marketspace.com',
];

// Hosting namespaces only ABOS can publish into: Base44-hosted builds of this
// app, and this Cloudflare account's own workers.dev subdomain (production and
// per-branch/per-commit previews both land there). The leading dot matters —
// without it 'notbase44.app' and 'evilaircraftbuyorsell.workers.dev' would match.
const DEFAULT_RETURN_ORIGIN_SUFFIXES = [
  '.base44.app',
  '.aircraftbuyorsell.workers.dev',
];

function allowedReturnOrigin(returnUrl: string): boolean {
  try {
    const url = new URL(returnUrl);
    if (url.protocol !== 'https:') return false;

    const configured = (Deno.env.get('ABOS_CHECKOUT_RETURN_ORIGINS') || '')
      .split(',')
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean);

    // When configured, the explicit allowlist is authoritative. Do not silently
    // fall back to defaults or hosting suffixes once an operator has configured it.
    if (configured.length > 0) return configured.includes(url.origin);

    if (DEFAULT_RETURN_ORIGINS.includes(url.origin)) return true;
    if (url.hostname === 'base44.app') return true;
    return DEFAULT_RETURN_ORIGIN_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
  } catch (_) { return false; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { priceId, returnUrl, plan_type, inquiry_id } = await req.json();
    if (!returnUrl || !allowedReturnOrigin(returnUrl)) {
      let rejected = 'unparseable';
      try { rejected = new URL(returnUrl).origin; } catch (_) { /* keep placeholder */ }
      console.error('Checkout rejected: return origin not allowed', { rejected, plan_type });
      return Response.json({ error: 'Invalid checkout return origin' }, { status: 400 });
    }

    if (plan_type === SKYDEALS_PLAN_TYPE) {
      if (String(user.email || '').toLowerCase() !== SKYDEALS_EMAIL || !inquiry_id) {
        return Response.json({ error: 'This trial offer is restricted to the confirmed SkyDeals Europe account.' }, { status: 403 });
      }
      const inquiry = await base44.asServiceRole.entities.ApiInstallerInquiry.get(inquiry_id).catch(() => null);
      let companyHost = '';
      try { companyHost = new URL(inquiry?.company_url || '').hostname.toLowerCase().replace(/^www\./, ''); } catch (_) {}
      if (!inquiry || String(inquiry.email || '').toLowerCase() !== SKYDEALS_EMAIL || companyHost !== 'skydealseurope.com') {
        return Response.json({ error: 'A completed SkyDeals Europe installer request is required.' }, { status: 403 });
      }
      const metadata = { type: 'tenant_subscription', plan: 'professional', custom_offer: SKYDEALS_PLAN_TYPE, user_id: user.id, user_email: SKYDEALS_EMAIL, inquiry_id };
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription', payment_method_types: ['card'], customer_email: SKYDEALS_EMAIL,
        client_reference_id: user.id,
        line_items: [{ price_data: { currency: 'eur', product_data: { name: 'SkyDeals Europe White-Label Custom' }, unit_amount: 150000, recurring: { interval: 'month', interval_count: 3 } }, quantity: 1 }],
        subscription_data: { trial_period_days: 30, metadata },
        success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
        metadata,
      });
      return Response.json({ sessionId: session.id, sessionUrl: session.url });
    }

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
      metadata: { user_id: user.id, user_email: user.email, product_key: configuredPrice.product_key },
    });
    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error('Checkout session creation failed:', error?.message || error);
    return Response.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
});