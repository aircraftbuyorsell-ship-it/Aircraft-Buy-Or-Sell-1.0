import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { session_id } = await req.json();
    if (!session_id) return Response.json({ error: 'Session ID required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    const sessionEmail = String(session.metadata?.user_email || session.customer_email || session.customer_details?.email || '').toLowerCase();
    if (sessionEmail !== String(user.email || '').toLowerCase()) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const meta = session.metadata || {};
    return Response.json({
      status: session.status === 'complete' ? 'complete' : session.status,
      session_id: session.id,
      payment_status: session.payment_status,
      product_key: meta.product_key || 'unknown',
      custom_offer: meta.custom_offer || '',
      customer_email: sessionEmail,
      subscription_id: session.subscription,
      payment_intent: session.payment_intent,
      total_amount: session.amount_total,
      currency: session.currency,
      current_period_end: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Checkout status check error:', error.message);
    return Response.json({ error: 'Failed to check session status' }, { status: 500 });
  }
});