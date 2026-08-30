import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

// ABOS V1 consumer product ladder.
// Advisor is free and never creates a Stripe Checkout session.
// All paid products are server-side allowlisted; the browser cannot choose
// an arbitrary Stripe price or change the entitlement granted by payment.
const PRICE_CONFIG = {
  // Replace these placeholders with the LIVE Stripe Price IDs from the ABOS
  // live catalog before production checkout is enabled for each product.
  'price_ABOS_ATI_39': { product_key: 'ATI_REPORT', entitlement: 'ATI_REPORT', price_usd: 39 },
  'price_ABOS_DEAL_99': { product_key: 'DEAL_ANALYSIS', entitlement: 'DEAL_ANALYSIS', price_usd: 99 },
  'price_ABOS_INVESTMENT_149': { product_key: 'INVESTMENT', entitlement: 'INVESTMENT', price_usd: 149 },
  'price_ABOS_PROFESSIONAL_499': { product_key: 'PROFESSIONAL_REVIEW', entitlement: 'PROFESSIONAL_REVIEW', price_usd: 499 },
};

const DEFAULT_RETURN_ORIGINS = [
  'https://aircraftbuyorsell.com',
  'https://www.aircraftbuyorsell.com',
  'https://abos-marketspace.com',
  'https://www.abos-marketspace.com',
];

const DEFAULT_RETURN_ORIGIN_SUFFIXES = ['.base44.app', '.aircraftbuyorsell.workers.dev'];

function allowedReturnOrigin(returnUrl: string): boolean {
  try {
    const url = new URL(returnUrl);
    if (url.protocol !== 'https:') return false;
    const configured = (Deno.env.get('ABOS_CHECKOUT_RETURN_ORIGINS') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (configured.length > 0) return configured.includes(url.origin);
    if (DEFAULT_RETURN_ORIGINS.includes(url.origin)) return true;
    if (url.hostname === 'base44.app') return true;
    return DEFAULT_RETURN_ORIGIN_SUFFIXES.some(suffix => url.hostname.endsWith(suffix));
  } catch (_) { return false; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { priceId, returnUrl } = await req.json();
    if (!returnUrl || !allowedReturnOrigin(returnUrl)) {
      return Response.json({ error: 'Invalid checkout return origin' }, { status: 400 });
    }

    if (!priceId) return Response.json({ error: 'Missing priceId' }, { status: 400 });
    const configuredPrice = PRICE_CONFIG[priceId];
    if (!configuredPrice) return Response.json({ error: 'Price is not allowed' }, { status: 403 });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        product_key: configuredPrice.product_key,
        entitlement: configuredPrice.entitlement,
        price_usd: String(configuredPrice.price_usd),
      },
    });

    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error('Checkout session creation failed:', error?.message || error);
    return Response.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
});
