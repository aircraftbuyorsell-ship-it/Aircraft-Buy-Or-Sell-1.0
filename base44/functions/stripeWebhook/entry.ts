import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
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

// Plan types that grant ABOS Pro / Marketplace access (see stripeCreateCheckout)
const ABOS_PLAN_TYPES = [
  'buyer_monthly', 'buyer_annual',
  'abos_pro_monthly', 'abos_pro_annual',
  'abos_seller_starter', 'abos_seller_pro',
  'abos_market_growth', 'abos_market_scale', 'abos_market_enterprise',
];
const isAbosPlan = (planType) => ABOS_PLAN_TYPES.includes(planType);

// ── Aircraft listing permissions per plan ──
// Free / lapsed: 1 active listing. Seller Starter (T1): 10. Pro / Marketplace: unlimited.
const LISTING_LIMITS = {
  abos_seller_starter: 10,
  abos_seller_pro: Infinity,
  abos_pro_monthly: Infinity,
  abos_pro_annual: Infinity,
  abos_market_growth: Infinity,
  abos_market_scale: Infinity,
  abos_market_enterprise: Infinity,
};
const FREE_LISTING_LIMIT = 1;

// Sync AircraftListing permissions with the user's subscription status.
// Over-limit active listings are unpublished (status=draft, visibility=private), oldest kept live.
async function syncListingPermissions(base44, userEmail, planType, active) {
  if (planType === 'buyer_monthly' || planType === 'buyer_annual') return; // buyer plans don't grant listing rights
  const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
  const owner = users[0];
  if (!owner) { console.warn(`No user account for ${userEmail}, skipping listing permission sync`); return; }

  const limit = active ? (LISTING_LIMITS[planType] ?? FREE_LISTING_LIMIT) : FREE_LISTING_LIMIT;
  const activeListings = await base44.asServiceRole.entities.AircraftListing.filter(
    { owner: owner.id, status: 'active' }, 'created_date', 500
  );
  if (activeListings.length <= limit) {
    console.log(`✓ Listing permissions OK for ${userEmail}: ${activeListings.length}/${limit === Infinity ? '∞' : limit} active`);
    return;
  }
  const excess = activeListings.slice(limit);
  await base44.asServiceRole.entities.AircraftListing.bulkUpdate(
    excess.map((l) => ({ id: l.id, status: 'draft', visibility: 'private' }))
  );
  console.log(`⬇️ Listing permissions enforced for ${userEmail}: ${excess.length} listing(s) unpublished (limit ${limit === Infinity ? '∞' : limit})`);
}

async function syncBuyerSubscription(base44, userEmail, planType, active) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail }, '-created_date', 1);
  const plan = ['buyer_annual', 'abos_pro_annual'].includes(planType) ? 'annual' : 'monthly';
  const isMarketplace = planType.startsWith('abos_market_');
  const SELLER_SUB_TIERS = { abos_seller_starter: 'starter', abos_seller_pro: 'premium' };
  const update = {
    buyer_pro_active: active,
    buyer_plan: active ? plan : 'none',
    status: 'active',
    tier: active ? (isMarketplace ? 'enterprise' : 'pro') : 'free_explorer',
    sub_tier: active ? (isMarketplace ? 'scale' : (SELLER_SUB_TIERS[planType] || 'premium')) : 'none',
  };
  if (profiles[0]) {
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, update);
  } else {
    await base44.asServiceRole.entities.UserProfile.create({ user_email: userEmail, role: 'viewer', tier: 'free_explorer', sub_tier: 'none', pipeline_role: 'buyer', ...update });
  }
  await syncListingPermissions(base44, userEmail, planType, active);
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

// Set newsletter subscription flag on UserProfile
async function setNewsletterFlag(base44, userEmail, subscribed) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
  if (profiles[0]) {
    const existingFlags = profiles[0].feature_flags || {};
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
      feature_flags: { ...existingFlags, newsletter_subscribed: subscribed },
    });
    console.log(`✓ Newsletter flag set to ${subscribed} for ${userEmail}`);
  } else {
    await base44.asServiceRole.entities.UserProfile.create({
      user_email: userEmail,
      tier: 'free_explorer',
      sub_tier: 'none',
      role: 'buyer',
      status: 'active',
      feature_flags: { newsletter_subscribed: subscribed },
    });
    console.log(`✓ UserProfile created with newsletter=${subscribed} for ${userEmail}`);
  }
}

// Resolve email from a Stripe customer ID
async function resolveEmailFromCustomer(stripe, customerId) {
  if (!customerId || typeof customerId !== 'string') return null;
  const customer = await stripe.customers.retrieve(customerId);
  return customer?.email || null;
}

async function hasProcessedPayment(base44, paymentId, eventId) {
  if (!paymentId) return false;
  const existing = await base44.asServiceRole.entities.TokenTransaction.filter(
    { type: 'purchase', stripe_payment_id: paymentId }, '-created_date', 1
  );
  if (existing.length > 0) return true;
  if (!eventId) return false;
  const eventRecords = await base44.asServiceRole.entities.TokenTransaction.filter(
    { type: 'purchase', stripe_event_id: eventId }, '-created_date', 1
  );
  return eventRecords.length > 0;
}

async function handleReportCredits(session, base44) {
  const meta = session.metadata || {};
  const apiKeyId = meta.api_key_id;
  const credits  = parseInt(meta.credits || '0', 10);
  const paymentId = session.payment_intent || session.id;
  if (!apiKeyId || !credits) { console.warn('report_credits checkout missing api_key_id/credits, skipping'); return; }

  if (await hasProcessedPayment(base44, paymentId)) {
    console.log(`Duplicate report_credits payment ignored: ${paymentId}`);
    return;
  }

  const key = await base44.asServiceRole.entities.ApiKey.get(apiKeyId).catch(() => null);
  if (!key) { console.warn(`ApiKey ${apiKeyId} not found, cannot grant report credits`); return; }

  const newBalance = (key.report_credits || 0) + credits;
  await base44.asServiceRole.entities.ApiKey.update(apiKeyId, { report_credits: newBalance });

  // Reuse TokenTransaction as the audit trail for this purchase too — same
  // hasProcessedPayment() idempotency check reads from it above.
  await base44.asServiceRole.entities.TokenTransaction.create({
    user_email:        meta.owner_email || key.owner_email || '',
    type:              'purchase',
    amount:            credits,
    pack:              'ati_report_credits',
    price_usd:         credits * 29,
    stripe_payment_id: paymentId,
    balance_after:     newBalance,
  });

  console.log(`✓ Granted ${credits} report credit(s) to ApiKey ${apiKeyId}, balance: ${newBalance}`);
}

async function handleCheckoutCompleted(session, base44, stripe, eventId) {
  console.log('✅ checkout.session.completed:', session.id);

  const meta        = session.metadata || {};
  const userEmail   = meta.user_email || session.customer_email || session.customer_details?.email;
  const packName    = meta.pack_name  || '';
  const paymentId   = session.payment_intent || session.id;

  // ABOS product entitlements (ATI Score, Full Report, Valuation, Verification, PRO, BROKER)
  if (meta.product_key && PRODUCT_KEYS.has(meta.product_key)) {
    await handleProductCheckout(session, base44, eventId, stripe);
    return;
  }

  if (meta.type === 'report_credits') {
    await handleReportCredits(session, base44);
    return;
  }

  if (isAbosPlan(meta.plan_type)) {
    if (!userEmail) { console.warn('No email found in buyer checkout session'); return; }
    await syncBuyerSubscription(base44, userEmail, meta.plan_type, true);
    return;
  }

  // Newsletter subscription — set flag, no tokens
  if (meta.product === 'newsletter_subscription') {
    if (userEmail) await setNewsletterFlag(base44, userEmail, true);
    return;
  }

  if (await hasProcessedPayment(base44, paymentId)) {
    console.log(`Duplicate checkout payment ignored: ${paymentId}`);
    return;
  }

  if (!userEmail) {
    console.warn('No verified customer email found; entitlement skipped');
    return;
  }

  // Legacy raw token purchase — checkout.session.completed doesn't embed price
  // info by default, so resolve it from the session's line items.
  let priceId;
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    priceId = lineItems?.data?.[0]?.price?.id;
  } catch (err) {
    console.error(`Failed to fetch line items for session ${session.id}:`, err.message);
    return;
  }
  const mapped = PRICE_TOKEN_MAP[priceId];
  if (!mapped) {
    console.warn(`No token map for price ${priceId}, skipping legacy token grant`);
    return;
  }
  const { tokens, tier, sub_tier: subTier, price_usd: priceUsd, pack } = mapped;
  const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
  const behavior = behaviors[0];
  if (!behavior) {
    console.warn('UserBehavior not found; entitlement skipped');
    return;
  }

  const newBalance = (behavior.tokens_remaining || 0) + tokens;
  await base44.asServiceRole.entities.UserBehavior.update(behavior.id, {
    tier,
    tokens_remaining: newBalance,
    tokens_purchased_total: (behavior.tokens_purchased_total || 0) + tokens,
    active_offer: null,
  });
  await base44.asServiceRole.entities.TokenTransaction.create({
    user_email: userEmail,
    type: 'purchase',
    amount: tokens,
    pack,
    price_usd: priceUsd,
    stripe_payment_id: paymentId,
    stripe_event_id: eventId,
    balance_after: newBalance,
  });
  await syncUserProfileTier(base44, userEmail, tier, subTier);
  console.log(`Granted ${tokens} tokens to ${userEmail} (tier: ${tier}, sub_tier: ${subTier})`);
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

  const subMeta = subscription.metadata || {};
  if (subMeta.product_key && SUB_PRODUCT_KEYS.has(subMeta.product_key)) {
    await handleProductSubscription(subscription, stripe, base44);
    return;
  }
  if (isAbosPlan(subMeta.plan_type)) {
    await syncBuyerSubscription(base44, userEmail, subMeta.plan_type, ['active', 'trialing'].includes(subscription.status));
    return;
  }

  // Newsletter subscription — manage flag, skip token logic
  if (subMeta.product === 'newsletter_subscription') {
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      await setNewsletterFlag(base44, userEmail, true);
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      await setNewsletterFlag(base44, userEmail, false);
    }
    return;
  }

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

// Invoice paid — handles recurring subscription renewals (re-grants tokens + keeps tier active)
async function handleInvoicePaid(invoice, stripe, base44) {
  console.log(`🧾 invoice.payment_succeeded: ${invoice.id}`);
  // Only process subscription invoices (not one-off)
  if (!invoice.subscription) return;

  const userEmail = invoice.customer_email || await resolveEmailFromCustomer(stripe, invoice.customer);
  if (!userEmail) { console.warn('No email on invoice, skipping'); return; }

  const priceId = invoice.lines?.data?.[0]?.price?.id;
  const mapped  = PRICE_TOKEN_MAP[priceId];
  if (!mapped) { console.log(`No token map for price ${priceId}, skipping token grant`); return; }

  const paymentId = invoice.payment_intent || invoice.id;
  if (await hasProcessedPayment(base44, paymentId)) {
    console.log(`Duplicate invoice payment ignored: ${paymentId}`);
    return;
  }

  const { tokens, tier, sub_tier: subTier, price_usd: priceUsd, pack } = mapped;

  // Grant tokens
  const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
  if (behaviors[0]) {
    const newBalance = (behaviors[0].tokens_remaining || 0) + tokens;
    await base44.asServiceRole.entities.UserBehavior.update(behaviors[0].id, {
      tier,
      tokens_remaining:       newBalance,
      tokens_purchased_total: (behaviors[0].tokens_purchased_total || 0) + tokens,
    });
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email:        userEmail,
      type:              'purchase',
      amount:            tokens,
      pack:              pack,
      price_usd:         priceUsd,
      stripe_payment_id: paymentId,
      balance_after:     newBalance,
    });
    console.log(`✓ Renewal: granted ${tokens} tokens to ${userEmail}`);
  }

  // Keep profile tier active
  await syncUserProfileTier(base44, userEmail, tier, subTier);
}

// Invoice payment failed — flag the user but don't downgrade immediately (Stripe retries)
async function handleInvoicePaymentFailed(invoice, stripe, base44) {
  console.warn(`⚠️ invoice.payment_failed: ${invoice.id}`);
  const userEmail = invoice.customer_email || await resolveEmailFromCustomer(stripe, invoice.customer);
  if (!userEmail) return;

  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
  if (profiles[0]) {
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, { status: 'suspended' });
    console.warn(`⚠️ UserProfile status set to suspended for ${userEmail} due to payment failure`);
  }
}

// Subscription deleted/cancelled
async function handleSubscriptionDeleted(subscription, stripe, base44) {
  console.log(`🗑️ subscription.deleted: ${subscription.id}`);
  const userEmail = await resolveEmailFromCustomer(stripe, subscription.customer);
  if (!userEmail) return;

  const subMeta = subscription.metadata || {};
  if (subMeta.product_key && SUB_PRODUCT_KEYS.has(subMeta.product_key)) {
    await handleProductSubscription(subscription, stripe, base44);
    return;
  }
  if (isAbosPlan(subMeta.plan_type)) {
    await syncBuyerSubscription(base44, userEmail, subMeta.plan_type, false);
    return;
  }

  // Newsletter subscription — clear flag only, don't touch tier
  if (subMeta.product === 'newsletter_subscription') {
    await setNewsletterFlag(base44, userEmail, false);
    return;
  }

  await downgradeUserProfile(base44, userEmail);
  const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ user_email: userEmail });
  if (behaviors[0]) {
    await base44.asServiceRole.entities.UserBehavior.update(behaviors[0].id, { tier: 'free_explorer' });
  }
}

// ── ABOS Product Entitlements (ATI Score, Full Report, Valuation, Verification, PRO, BROKER) ──
// Canonical Stripe-backed ATI products. Legacy keys remain accepted for existing purchases.
const STRIPE_ATI_PRODUCT_MAP = {
  level_2_basic: 'ATI_BASIC_REPORT',
  ati_pro: 'ATI_PRO',
  ati_pro_tax: 'ATI_PRO_TAX',
};
const LEGACY_PRODUCT_ALIASES = {
  ATI_FULL_REPORT: 'ATI_FULL_REPORT',
  ATI_SCORE: 'ATI_SCORE',
  VALUATION_STUDIO: 'VALUATION_STUDIO',
  VERIFICATION_PACK: 'VERIFICATION_PACK',
  PRO: 'PRO',
  BROKER: 'BROKER',
};
const PRODUCT_KEYS = new Set([
  ...Object.values(STRIPE_ATI_PRODUCT_MAP),
  ...Object.keys(LEGACY_PRODUCT_ALIASES),
]);
const SUB_PRODUCT_KEYS = new Set(['PRO', 'BROKER']);

async function markPaymentEvent(base44, eventId, type, email, productKey, paymentId, subId, amountEur, status) {
  if (!eventId) return true;
  const existing = await base44.asServiceRole.entities.PaymentEvent.filter({ stripe_event_id: eventId }, '-created_date', 1);
  if (existing.length > 0 && existing[0].status === 'processed') return false;
  if (existing.length > 0) {
    await base44.asServiceRole.entities.PaymentEvent.update(existing[0].id, {
      event_type: type, user_email: email || '', product_key: productKey || '',
      stripe_payment_id: paymentId || '', stripe_subscription_id: subId || '',
      amount_eur: amountEur || 0, status: status || 'processing',
    });
    return true;
  }
  await base44.asServiceRole.entities.PaymentEvent.create({
    stripe_event_id: eventId, event_type: type, user_email: email || '', product_key: productKey || '',
    stripe_payment_id: paymentId || '', stripe_subscription_id: subId || '', amount_eur: amountEur || 0,
    status: status || 'processing',
  });
  return true;
}

async function finalizePaymentEvent(base44, eventId, status) {
  if (!eventId) return;
  const existing = await base44.asServiceRole.entities.PaymentEvent.filter({ stripe_event_id: eventId }, '-created_date', 1);
  if (existing[0]) await base44.asServiceRole.entities.PaymentEvent.update(existing[0].id, { status });
}

// checkout.session.completed for a product purchase → grant entitlement (idempotent).
async function handleProductCheckout(session, base44, eventId, stripe) {
  const meta = session.metadata || {};
  let productKey = meta.product_key;

  // Prefer canonical Stripe product metadata over client-supplied product_key.
  // This makes Stripe's active catalog authoritative while retaining legacy compatibility.
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1, expand: ['data.price.product'] });
    const price = lineItems?.data?.[0]?.price;
    const productMeta = price?.product && typeof price.product === 'object' ? price.product.metadata : null;
    const stripeTier = productMeta?.abos_tier_id;
    if (stripeTier && STRIPE_ATI_PRODUCT_MAP[stripeTier]) productKey = STRIPE_ATI_PRODUCT_MAP[stripeTier];
  } catch (err) {
    console.warn(`Unable to resolve Stripe product metadata for ${session.id}: ${err.message}`);
  }

  if (!productKey || !PRODUCT_KEYS.has(productKey)) return false;
  const email = meta.user_email || session.customer_email || session.customer_details?.email;
  const aircraftRegistration = (meta.aircraft_registration || '').toUpperCase().trim();
  const aircraftScopedProduct = !SUB_PRODUCT_KEYS.has(productKey);
  if (aircraftScopedProduct && !aircraftRegistration) {
    console.warn(`product checkout rejected: ${productKey} requires aircraft_registration`);
    await markPaymentEvent(base44, eventId, 'checkout.session.completed', email, productKey, session.payment_intent || session.id, session.subscription || '', (session.amount_total || 0) / 100, 'ignored');
    return true;
  }
  if (!(await markPaymentEvent(base44, eventId, 'checkout.session.completed', email, productKey, session.payment_intent || session.id, session.subscription || '', (session.amount_total || 0) / 100, 'processed'))) {
    console.log(`Duplicate product checkout ignored: ${eventId}`);
    return true;
  }
  if (!email) { console.warn('product checkout: no email'); return true; }

  try {
    if (SUB_PRODUCT_KEYS.has(productKey)) {
      await base44.asServiceRole.entities.Entitlement.create({
        user_email: email, product_key: productKey, scope: 'global', source: 'stripe',
        stripe_subscription_id: session.subscription || '', stripe_event_id: eventId, status: 'active',
        current_period_end: session.expires_at || null,
      });
      console.log(`✓ Subscription entitlement granted: ${email} → ${productKey}`);
    } else {
      await base44.asServiceRole.entities.Entitlement.create({
        user_email: email, product_key: productKey, scope: 'aircraft',
        aircraft_registration: aircraftRegistration, source: 'stripe',
        stripe_payment_id: session.payment_intent || session.id, stripe_event_id: eventId, status: 'active',
      });
      console.log(`✓ One-time entitlement granted: ${email} → ${productKey} (${aircraftRegistration})`);
    }
    await finalizePaymentEvent(base44, eventId, 'processed');
    return true;
  } catch (err) {
    await finalizePaymentEvent(base44, eventId, 'failed');
    console.error(`Product entitlement grant failed for ${eventId}: ${err.message}`);
    throw err;
  }
}

// subscription.updated/deleted for PRO/BROKER → sync entitlement status (idempotent).
async function handleProductSubscription(subscription, stripe, base44) {
  const meta = subscription.metadata || {};
  const productKey = meta.product_key;
  if (!productKey || !SUB_PRODUCT_KEYS.has(productKey)) return false;
  const email = await resolveEmailFromCustomer(stripe, subscription.customer);
  if (!email) return true;
  const active = ['active', 'trialing'].includes(subscription.status);
  const eventId = `sub_${subscription.id}_${subscription.status}`;
  const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

  const existing = await base44.asServiceRole.entities.Entitlement.filter(
    { user_email: email, product_key: productKey, stripe_subscription_id: subscription.id }, '-created_date', 1
  );
  if (existing[0]) {
    await base44.asServiceRole.entities.Entitlement.update(existing[0].id, {
      status: active ? 'active' : 'expired',
      current_period_end: periodEnd,
      stripe_event_id: eventId,
    });
  } else {
    await base44.asServiceRole.entities.Entitlement.create({
      user_email: email, product_key: productKey, scope: 'global', source: 'stripe',
      stripe_subscription_id: subscription.id, stripe_event_id: eventId,
      status: active ? 'active' : 'expired', current_period_end: periodEnd,
    });
  }
  await markPaymentEvent(base44, eventId, 'customer.subscription.' + (active ? 'active' : subscription.status), email, productKey, '', subscription.id, 0, active ? 'processed' : 'ignored');
  console.log(`✓ Subscription entitlement synced: ${email} → ${productKey} (${active ? 'active' : 'expired'})`);
  return true;
}

Deno.serve(async (req) => {
  try {
    // Establish platform context FIRST — before any signature verification or business logic.
    const base44 = createClientFromRequest(req);

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

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, base44, stripe, event.id);
        break;
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;
      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, stripe, base44);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, stripe, base44);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object, stripe, base44);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, stripe, base44);
        break;
      default:
        console.log(`⏭️ Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});