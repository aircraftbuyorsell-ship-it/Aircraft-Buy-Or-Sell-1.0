import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';

/**
 * Verifies a Stripe Checkout session after payment and creates a
 * TokenTransaction unlock record (type='gcr_unlock') with 30-day de-dup.
 *
 * Input: { stripe_session_id, registration }
 * Returns: { success, unlocked, already_unlocked }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { stripe_session_id, registration } = await req.json();
    if (!stripe_session_id || !registration) {
      return Response.json({ error: 'stripe_session_id and registration required' }, { status: 400 });
    }

    // ── De-duplication: check if already unlocked within 30 days ──
    const existing = await base44.asServiceRole.entities.TokenTransaction.filter(
      { user_email: user.email, type: 'gcr_unlock' },
      '-created_date',
      50
    );
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const alreadyUnlocked = existing.some(t =>
      t.metadata?.registration === registration &&
      new Date(t.created_date).getTime() > thirtyDaysAgo
    );
    if (alreadyUnlocked) {
      return Response.json({ success: true, already_unlocked: true });
    }

    // ── Verify Stripe session ──
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const session = await stripe.checkout.sessions.retrieve(stripe_session_id);

    if (session.payment_status !== 'paid') {
      return Response.json(
        { error: 'Payment not completed', payment_status: session.payment_status },
        { status: 402 }
      );
    }

    // ── Create unlock record ──
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: user.email,
      type: 'gcr_unlock',
      amount: 0,
      feature: 'gcr_unlock',
      price_usd: 39,
      stripe_payment_id: stripe_session_id,
      metadata: { registration, stripe_session_id },
    });

    return Response.json({ success: true, unlocked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});