import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

// EU consumer-protection: right of withdrawal — full refund within 14 days of purchase, no reason required.
const WITHDRAWAL_WINDOW_DAYS = 14;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const cutoff = Math.floor(Date.now() / 1000) - WITHDRAWAL_WINDOW_DAYS * 24 * 3600;

    // Find Stripe customers matching this user's email
    const customers = await stripe.customers.list({ email: user.email, limit: 5 });
    if (!customers.data.length) {
      return Response.json({ error: 'No payments found for your account.' }, { status: 404 });
    }

    const refunded = [];
    const cancelledSubs = [];

    for (const customer of customers.data) {
      // Refund all eligible charges within the 14-day window
      const charges = await stripe.charges.list({ customer: customer.id, limit: 25 });
      for (const charge of charges.data) {
        if (charge.created < cutoff) continue;
        if (!charge.paid || charge.refunded) continue;
        if (charge.amount_refunded >= charge.amount) continue;

        const refund = await stripe.refunds.create({
          charge: charge.id,
          reason: 'requested_by_customer',
          metadata: { withdrawal: 'eu_14_day', user_email: user.email },
        });
        refunded.push({
          charge_id: charge.id,
          refund_id: refund.id,
          amount: charge.amount - charge.amount_refunded,
          currency: charge.currency,
        });

        // Claw back tokens granted for this payment (one-off token packs)
        if (charge.payment_intent) {
          const txs = await base44.asServiceRole.entities.TokenTransaction.filter(
            { type: 'purchase', stripe_payment_id: charge.payment_intent }, '-created_date', 1
          );
          const tx = txs[0];
          if (tx && tx.amount > 0) {
            const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: user.email });
            if (behaviors[0]) {
              const newBalance = Math.max(0, (behaviors[0].tokens_remaining || 0) - tx.amount);
              await base44.asServiceRole.entities.UserBehavior.update(behaviors[0].id, { tokens_remaining: newBalance });
              await base44.asServiceRole.entities.TokenTransaction.create({
                user_email: user.email,
                type: 'refund',
                amount: -tx.amount,
                pack: tx.pack || '',
                stripe_payment_id: charge.payment_intent,
                balance_after: newBalance,
                description: 'EU 14-day right of withdrawal — refund',
              });
            }
          }
        }
      }

      // Cancel active subscriptions started within the window (webhook downgrades the profile)
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 10 });
      for (const sub of subs.data) {
        if (sub.created < cutoff) continue;
        await stripe.subscriptions.cancel(sub.id);
        cancelledSubs.push(sub.id);
      }
    }

    if (!refunded.length) {
      return Response.json({
        error: `No eligible payments found within the last ${WITHDRAWAL_WINDOW_DAYS} days. The withdrawal right applies to purchases made in the past 14 days.`,
      }, { status: 404 });
    }

    const totalByCurrency = {};
    for (const r of refunded) {
      totalByCurrency[r.currency] = (totalByCurrency[r.currency] || 0) + r.amount;
    }

    console.log(`✓ EU withdrawal: refunded ${refunded.length} payment(s), cancelled ${cancelledSubs.length} subscription(s) for ${user.email}`);
    return Response.json({
      success: true,
      refunded_count: refunded.length,
      cancelled_subscriptions: cancelledSubs.length,
      totals: Object.entries(totalByCurrency).map(([currency, amount]) => ({
        currency: currency.toUpperCase(),
        amount: amount / 100,
      })),
    });
  } catch (error) {
    console.error('Withdrawal refund error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});