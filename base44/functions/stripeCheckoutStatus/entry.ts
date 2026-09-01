import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

export default async (req: Request) => {
  const base44 = createClientFromRequest(req);

  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Extract metadata
    const meta = session.metadata || {};
    const productKey = meta.product_key || 'unknown';
    const currentPeriodEnd = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

    // Return normalized status
    return Response.json({
      status: session.payment_status === 'paid' ? 'complete' : session.status,
      session_id: session.id,
      payment_status: session.payment_status,
      product_key: productKey,
      customer_email: session.customer_email || session.customer_details?.email,
      subscription_id: session.subscription,
      payment_intent: session.payment_intent,
      total_amount: session.amount_total,
      currency: session.currency,
      current_period_end: currentPeriodEnd,
    });
  } catch (error) {
    console.error('Checkout status check error:', error.message);
    return Response.json(
      { error: error.message || 'Failed to check session status' },
      { status: 500 }
    );
  }
};
