import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const PRICE_CONFIG = {
  'price_1TaO0mAT7Be3WR6Jepz0eQQS': { pack: 'ABOS Starter' },
  'price_1TaO1rAT7Be3WR6JaWnMa7mx': { pack: 'ABOS Pro' },
  'price_1TaO2yAT7Be3WR6JjlhagUpB': { pack: 'ABOS Enterprise' },
};

function allowedReturnOrigins() {
  return (Deno.env.get('ABOS_CHECKOUT_RETURN_ORIGINS') || Deno.env.get('VITE_BASE44_APP_BASE_URL') || '')
    .split(',').map((value) => value.trim()).filter(Boolean);
}

function safeReturnUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  let parsed;
  try { parsed = new URL(value); } catch (_) { return null; }
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null;
  if (!allowedReturnOrigins().some((origin) => {
    try { return new URL(origin).origin === parsed.origin; } catch (_) { return false; }
  })) return null;
  return parsed;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { priceId, returnUrl } = await req.json();
    if (!priceId || !PRICE_CONFIG[priceId]) return Response.json({ error: 'Unsupported price' }, { status: 400 });

    const safeUrl = safeReturnUrl(returnUrl);
    if (!safeUrl) return Response.json({ error: 'Invalid return URL' }, { status: 400 });

    const successUrl = new URL(safeUrl);
    successUrl.searchParams.set('stripe_session', '{CHECKOUT_SESSION_ID}');
    successUrl.searchParams.set('success', 'true');
    const cancelUrl = new URL(safeUrl);
    cancelUrl.searchParams.set('canceled', 'true');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        user_id: user.id,
        price_id: priceId,
      },
    });

    return Response.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (_) {
    return Response.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
});