import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }

    // Use service role for webhook operations (no user session)
    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      const tokens = parseInt(meta.tokens || '0', 10);
      const priceUsd = parseFloat(meta.price_usd || '0');
      const userEmail = meta.user_email || session.customer_email;

      if (!userEmail || !tokens) {
        console.log('Missing metadata, skipping token grant', meta);
        return Response.json({ received: true });
      }

      // Find the user's behavior record
      const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
      const behavior = behaviors[0];

      if (behavior) {
        const newBalance = (behavior.tokens_remaining || 0) + tokens;
        await base44.asServiceRole.entities.UserBehavior.update(behavior.id, {
          tier: 'pro',
          tokens_remaining: newBalance,
          tokens_purchased_total: (behavior.tokens_purchased_total || 0) + tokens,
          active_offer: null,
        });

        await base44.asServiceRole.entities.TokenTransaction.create({
          user_email: userEmail,
          type: 'purchase',
          amount: tokens,
          pack: meta.pack_name || 'Stripe purchase',
          price_usd: priceUsd,
          stripe_payment_id: session.payment_intent || session.id,
          balance_after: newBalance,
        });

        console.log(`✓ Granted ${tokens} tokens to ${userEmail}, new balance: ${newBalance}`);
      } else {
        console.warn(`UserBehavior not found for ${userEmail}`);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      console.warn(`Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});