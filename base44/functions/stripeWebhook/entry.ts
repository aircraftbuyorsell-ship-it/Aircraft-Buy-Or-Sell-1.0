import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

// Map Stripe price IDs → token grants + tier
const PRICE_TOKEN_MAP = {
  'price_1TaO0mAT7Be3WR6Jepz0eQQS': { tokens: 100, tier: 'pro', sub_tier: 'starter', pack: 'ABOS Starter', price_usd: 29 },
  'price_1TaO1rAT7Be3WR6JaWnMa7mx': { tokens: 500, tier: 'pro', sub_tier: 'plus',    pack: 'ABOS Pro',     price_usd: 99 },
  'price_1TaO2yAT7Be3WR6JjlhagUpB': { tokens: 2000, tier: 'enterprise', sub_tier: 'elite', pack: 'ABOS Enterprise', price_usd: 299 },
};

// Sync UserProfile tier + sub_tier based on a resolved tier/sub_tier
async function syncUserProfileTier(base44, userEmail, tier, subTier) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
  const profileTierMap = { 'starter': 'pro', 'plus': 'pro', 'premium': 'pro', 'scale': 'pro', 'elite': 'enterprise' };
  const resolvedTier = profileTierMap[subTier] || tier || 'pro';
  const resolvedSubTier = subTier || 'starter';

  if (profiles[0]) {
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
      tier: resolvedTier,
      sub_tier: resolvedSubTier,
      status: 'active',
    });
    console.log(`✓ UserProfile synced for ${userEmail} → tier: ${resolvedTier}, sub_tier: ${resolvedSubTier}`);
  } else {
    // Create profile if missing
    await base44.asServiceRole.entities.UserProfile.create({
      user_email: userEmail,
      tier: resolvedTier,
      sub_tier: resolvedSubTier,
      role: 'buyer',
      status: 'active',
    });
    console.log(`✓ UserProfile created for ${userEmail} → tier: ${resolvedTier}`);
  }
}

// Downgrade UserProfile to free_explorer on subscription end
async function downgradeUserProfile(base44, userEmail) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
  if (profiles[0]) {
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
      tier: 'free_explorer',
      sub_tier: 'none',
    });
    console.log(`⬇️ UserProfile downgraded to free_explorer for ${userEmail}`);
  }
}

// Resolve email from a Stripe customer ID
async function resolveEmailFromCustomer(stripe, customerId) {
  if (!customerId || typeof customerId !== 'string') return null;
  const customer = await stripe.customers.retrieve(customerId);
  return customer?.email || null;
}

async function handleCheckoutCompleted(session, base44) {
  console.log('✅ checkout.session.completed:', session.id);

  const meta        = session.metadata || {};
  const userEmail   = meta.user_email || session.customer_email || session.customer_details?.email;
  const packName    = meta.pack_name  || '';
  const paymentId   = session.payment_intent || session.id;

  // Resolve tokens from metadata (set by stripeCreateCheckout) or fall back to price map
  let tokens  = parseInt(meta.tokens   || '0', 10);
  let priceUsd = parseFloat(meta.price_usd || '0');
  let tier    = meta.tier || 'pro';

  // If metadata is sparse, look up via line items price
  let subTier = meta.sub_tier || '';
  if (!tokens) {
    const priceId = session.line_items?.data?.[0]?.price?.id;
    const mapped  = PRICE_TOKEN_MAP[priceId];
    if (mapped) { tokens = mapped.tokens; tier = mapped.tier; subTier = mapped.sub_tier; priceUsd = mapped.price_usd; }
  }

  if (!userEmail) { console.warn('No email found in session, skipping grant'); return; }
  if (!tokens)    { console.warn('No tokens resolved, skipping grant'); return; }

  const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
  const behavior  = behaviors[0];
  if (!behavior)  { console.warn(`UserBehavior not found for ${userEmail}`); return; }

  const newBalance = (behavior.tokens_remaining || 0) + tokens;
  await base44.asServiceRole.entities.UserBehavior.update(behavior.id, {
    tier,
    tokens_remaining:       newBalance,
    tokens_purchased_total: (behavior.tokens_purchased_total || 0) + tokens,
    active_offer:           null,
  });

  await base44.asServiceRole.entities.TokenTransaction.create({
    user_email:        userEmail,
    type:              'purchase',
    amount:            tokens,
    pack:              packName || tier,
    price_usd:         priceUsd,
    stripe_payment_id: paymentId,
    balance_after:     newBalance,
  });

  // Sync UserProfile tier
  await syncUserProfileTier(base44, userEmail, tier, subTier);

  console.log(`✓ Granted ${tokens} tokens to ${userEmail} (tier: ${tier}, sub_tier: ${subTier}), balance: ${newBalance}`);
}

async function handleChargeSucceeded(charge) {
  console.log(`💳 charge.succeeded: ${charge.id} — ${charge.receipt_email} — ${charge.amount / 100} ${charge.currency.toUpperCase()}`);
  // Audit log — extend here to write to a Payments entity if needed
}

async function handleChargeFailed(charge) {
  console.error(`❌ charge.failed: ${charge.id} — ${charge.receipt_email} — ${charge.failure_code}: ${charge.failure_message}`);
  // Notify user or update status — extend here as needed
}

// Subscription activated or renewed
async function handleSubscriptionUpdated(subscription, stripe, base44) {
  console.log(`🔄 subscription updated: ${subscription.id} status=${subscription.status}`);
  const userEmail = await resolveEmailFromCustomer(stripe, subscription.customer);
  if (!userEmail) { console.warn('No email for subscription customer, skipping'); return; }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const mapped  = PRICE_TOKEN_MAP[priceId];

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const tier    = mapped?.tier    || 'pro';
    const subTier = mapped?.sub_tier || 'starter';
    await syncUserProfileTier(base44, userEmail, tier, subTier);

    // Also sync UserBehavior tier
    const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
    if (behaviors[0]) {
      await base44.asServiceRole.entities.UserBehavior.update(behaviors[0].id, { tier });
    }
  } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
    await downgradeUserProfile(base44, userEmail);
    const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
    if (behaviors[0]) {
      await base44.asServiceRole.entities.UserBehavior.update(behaviors[0].id, { tier: 'free_explorer' });
    }
    console.log(`⚠️ Subscription ${subscription.status} for ${userEmail}`);
  }
}

// Subscription deleted/cancelled
async function handleSubscriptionDeleted(subscription, stripe, base44) {
  console.log(`🗑️ subscription.deleted: ${subscription.id}`);
  const userEmail = await resolveEmailFromCustomer(stripe, subscription.customer);
  if (!userEmail) return;
  await downgradeUserProfile(base44, userEmail);
  const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
  if (behaviors[0]) {
    await base44.asServiceRole.entities.UserBehavior.update(behaviors[0].id, { tier: 'free_explorer' });
  }
}

Deno.serve(async (req) => {
  try {
    const stripe        = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const body      = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📡 Webhook received: ${event.type} (${event.id})`);

    const base44 = createClientFromRequest(req);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, base44);
        break;
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;
      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, stripe, base44);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, stripe, base44);
        break;
      default:
        console.log(`⏭️ Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});