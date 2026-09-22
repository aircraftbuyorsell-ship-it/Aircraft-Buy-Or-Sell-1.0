import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';
import { resolveCheckoutAmount, discountedUnitAmount, checkoutBlocker } from '../_shared/productPricing.mjs';

/**
 * ABOS Entitlement Engine
 * Server-side authorization for all paid features. Never trusts the frontend.
 * The same check() is used by the web app, the Core API, and MCP/AI agents.
 */

const PRODUCT_CATALOG = {
  // ── ABOS V1 customer-facing products ──
  ATI_SCORE:        { name: 'ATI Score', type: 'one_time', price_usd: 0, currency: 'usd', free: true },
  ATI_REPORT:       { name: 'ATI Report', type: 'one_time', price_usd: 39, currency: 'usd' },
  DEAL_ANALYSIS:    { name: 'Deal Analysis', type: 'one_time', price_usd: 99, currency: 'usd' },
  INVESTMENT:       { name: 'Investment', type: 'one_time', price_usd: 149, currency: 'usd' },
  PROFESSIONAL:     { name: 'Professional Review', type: 'one_time', price_usd: 499, currency: 'usd' },

  // ── Legacy compatibility — not customer-facing V1 products ──
  ATI_BASIC_REPORT: { name: 'ATI Report (legacy)', type: 'one_time', price_usd: 39, currency: 'usd', legacy: true },
  ATI_PRO:          { name: 'ATI Pro (legacy)', type: 'one_time', price_usd: 149, currency: 'usd', legacy: true },
  ATI_PRO_TAX:      { name: 'ATI Pro Tax (legacy)', type: 'one_time', price_usd: 499, currency: 'usd', legacy: true },

  ATI_FULL_REPORT:  { name: 'ATI Full Report (legacy)', type: 'one_time', price_eur: 49.00, currency: 'eur', legacy: true },
  VALUATION_STUDIO: { name: 'Valuation Studio (legacy)', type: 'one_time', price_eur: 29.00, currency: 'eur', legacy: true },
  VERIFICATION_PACK:{ name: 'Verification Pack (legacy)', type: 'one_time', price_eur: 19.90, currency: 'eur', legacy: true },
  PRO:              { name: 'ABOS Professional', type: 'subscription', price_eur: 99, currency: 'eur', interval: 'month' },
  BROKER:           { name: 'ABOS Broker / Dealer (legacy)', type: 'subscription', price_eur: 299, currency: 'eur', interval: 'month', legacy: true },
  ATI_REPORT_PACK_5: { name: 'ATI Report — 5 Pack', type: 'report_pack', price_usd: 199, currency: 'usd', credits: 5 },
  ATI_REPORT_PACK_10:{ name: 'ATI Report — 10 Pack', type: 'report_pack', price_usd: 290, currency: 'usd', credits: 10 },
  ATI_REPORT_PACK_25:{ name: 'ATI Report — 25 Pack', type: 'report_pack', price_usd: 625, currency: 'usd', credits: 25 },
  API_STARTER: { name: 'ABOS API — Starter', type: 'subscription', price_eur: 690, currency: 'eur', interval: 'month' },
  API_PROFESSIONAL: { name: 'ABOS API — Professional', type: 'subscription', price_eur: 1890, currency: 'eur', interval: 'month' },
  API_ENTERPRISE: { name: 'ABOS API — Enterprise', type: 'contract', price_eur: 3900, currency: 'eur' },
  WHITE_LABEL_LICENSE: { name: 'ABOS White-Label Integration License', type: 'one_time', price_eur: 2500, currency: 'eur' },
};

const SUB_INCLUDED = {
  PRO: ['ATI_SCORE', 'ATI_REPORT', 'ATI_BASIC_REPORT', 'DEAL_ANALYSIS', 'INVESTMENT'],
  BROKER: ['ATI_SCORE', 'ATI_REPORT', 'ATI_BASIC_REPORT', 'DEAL_ANALYSIS', 'INVESTMENT'],
};
const SUB_DISCOUNT = { PRO: 0.30, BROKER: 0.40 };
const SUB_KEYS = new Set(['PRO', 'BROKER', 'API_STARTER', 'API_PROFESSIONAL']);
const REPORT_PACK_KEYS = new Set(['ATI_REPORT_PACK_5','ATI_REPORT_PACK_10','ATI_REPORT_PACK_25']);
const ONE_TIME_KEYS = new Set(['ATI_REPORT', 'DEAL_ANALYSIS', 'INVESTMENT', 'PROFESSIONAL', 'ATI_BASIC_REPORT', 'ATI_PRO', 'ATI_PRO_TAX', 'ATI_SCORE', 'ATI_FULL_REPORT', 'VALUATION_STUDIO', 'VERIFICATION_PACK', 'WHITE_LABEL_LICENSE']);

const WELCOME_DISCOUNT = 0.30;
const WELCOME_WINDOW_DAYS = 14;
const LAUNCH_OFFER_MS = 5 * 60 * 1000;

async function getLaunchOffer(svc, user, registration, createIfMissing = true) {
  if (!registration) return null;
  const records = await svc.entities.LimitedOffer.filter({ user_email: user.email, aircraft_registration: registration }, '-created_date', 1);
  let offer = records[0] || null;
  if (!offer && createIfMissing) offer = await svc.entities.LimitedOffer.create({ user_email: user.email, aircraft_registration: registration, discount_pct: 0.30, expires_at: new Date(Date.now() + LAUNCH_OFFER_MS).toISOString() });
  return offer && !offer.redeemed_at && Date.parse(offer.expires_at) > Date.now() ? offer : null;
}

async function welcomeDiscountEligible(svc, user) {
  const created = new Date(user.created_date || 0).getTime();
  if (!created || Date.now() - created > WELCOME_WINDOW_DAYS * 86400000) return false;
  const ents = await svc.entities.Entitlement.filter({ user_email: user.email }, '-created_date', 1);
  return ents.length === 0;
}

function generateDealCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getOrCreateDealCode(svc, registration) {
  const reg = (registration || '').toUpperCase().trim();
  if (reg) {
    const listings = await svc.entities.AircraftListing.filter({ registration: reg }, '-created_date', 1);
    if (listings.length) {
      const listing = listings[0];
      if (listing.deal_code) return listing.deal_code;
      const code = generateDealCode();
      await svc.entities.AircraftListing.update(listing.id, { deal_code: code });
      return code;
    }
  }
  return generateDealCode();
}

function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

async function activeSubProduct(svc, email) {
  const ents = await svc.entities.Entitlement.filter(
    { user_email: email, status: 'active', scope: 'global' }, '-created_date', 10
  );
  for (const e of ents) {
    if (SUB_KEYS.has(e.product_key)) return e.product_key;
  }
  return null;
}

// ── Tiered upgrade pricing (Report → Pro → Full) ──
// A buyer who already owns a lower-tier report for this aircraft upgrades by
// paying (higher price − already-paid credit) minus a loyalty discount:
//   ATI_REPORT → DEAL_ANALYSIS : 10% off the difference
//   ATI_REPORT → INVESTMENT    : 15% off the difference
//   DEAL_ANALYSIS → INVESTMENT : 15% off the difference
const TIERS = [
  { key: 'ATI_REPORT', price: 39, name: 'ATI Report' },
  { key: 'DEAL_ANALYSIS', price: 99, name: 'Deal Analysis' },
  { key: 'INVESTMENT', price: 149, name: 'Investment' },
];
const UPGRADE_DISCOUNT = {
  'ATI_REPORT->DEAL_ANALYSIS': 0.10,
  'ATI_REPORT->INVESTMENT': 0.15,
  'DEAL_ANALYSIS->INVESTMENT': 0.15,
};

async function ownedLowerTier(svc, email, productKey, reg) {
  const idx = TIERS.findIndex((t) => t.key === productKey);
  if (idx <= 0 || !reg) return null;
  const [ents, reports] = await Promise.all([
    svc.entities.Entitlement.filter({ user_email: email, aircraft_registration: reg, status: 'active' }, '-created_date', 20),
    svc.entities.PurchasedReport.filter({ user_email: email, aircraft_registration: reg, status: 'ready' }, '-created_date', 20),
  ]);
  for (let i = idx - 1; i >= 0; i--) {
    const lower = TIERS[i];
    if (ents.some((e) => e.product_key === lower.key) || reports.some((r) => r.product_key === lower.key)) return lower;
  }
  return null;
}

function upgradePrice(targetKey, targetPrice, owned) {
  const pct = UPGRADE_DISCOUNT[`${owned.key}->${targetKey}`] ?? 0.15;
  const upgrade = +((targetPrice - owned.price) * (1 - pct)).toFixed(2);
  return { from_key: owned.key, from_name: owned.name, credit_usd: owned.price, discount_pct: pct, upgrade_price_usd: Math.max(0, upgrade) };
}

/**
 * Canonical server-side authorization helper.
 * Paid write paths MUST call this instead of trusting the caller.
 */
async function requireEntitlement(svc, user, productKey, registration) {
  if (!productKey || !ONE_TIME_KEYS.has(productKey)) {
    return { ok: false, status: 400, error: 'Invalid paid product_key' };
  }
  if (isAdmin(user)) {
    return { ok: true, reason: 'admin_bypass', entitlement_id: null };
  }
  if (PRODUCT_CATALOG[productKey]?.free) {
    return { ok: true, reason: 'free_product', entitlement_id: null };
  }

  const reg = (registration || '').toUpperCase().trim();
  if (!reg) {
    return { ok: false, status: 400, error: 'aircraft_registration is required for paid aircraft features' };
  }

  const subProduct = await activeSubProduct(svc, user.email);

  // A ready purchased report is a durable entitlement for the same aircraft/product.
  const existingReports = await svc.entities.PurchasedReport.filter(
    { user_email: user.email, product_key: productKey, aircraft_registration: reg, status: 'ready' },
    '-created_date', 1
  );
  if (existingReports.length) {
    return { ok: true, reason: 'report_already_purchased', entitlement_id: null, report_id: existingReports[0].id };
  }

  // Report-pack credits can be redeemed for ATI Report on any aircraft.
  if (productKey === 'ATI_BASIC_REPORT') {
    const balances = await svc.entities.ReportCreditBalance.filter({ user_email: user.email }, '-created_date', 1);
    if (balances[0]?.balance > 0) return { ok: true, reason: 'report_credit', entitlement_id: null, report_credit_balance_id: balances[0].id };
  }

  // Subscription-included products are entitled without a one-time purchase.
  if (subProduct && SUB_INCLUDED[subProduct]?.includes(productKey)) {
    return { ok: true, reason: 'subscription_included', entitlement_id: null };
  }

  // Explicit per-aircraft entitlement granted by Stripe webhook/payment processing.
  const ents = await svc.entities.Entitlement.filter(
    { user_email: user.email, product_key: productKey, aircraft_registration: reg, status: 'active' },
    '-created_date', 1
  );
  if (ents.length) {
    return { ok: true, reason: 'one_time_entitlement', entitlement_id: ents[0].id };
  }

  return {
    ok: false,
    status: 402,
    error: 'payment_required',
    product_key: productKey,
    aircraft_registration: reg,
  };
}

async function paymentProcessed(svc, eventId) {
  if (!eventId) return false;
  const existing = await svc.entities.PaymentEvent.filter({ stripe_event_id: eventId }, '-created_date', 1);
  return existing.length > 0;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const svc = base44.asServiceRole;
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  try {
    switch (action) {
      case 'list_products': {
        return Response.json({ products: Object.entries(PRODUCT_CATALOG).filter(([_, v]) => !v.legacy).map(([k, v]) => ({ key: k, ...v })) });
      }

      case 'check': {
        const { product_key, aircraft_registration } = body;
        if (!product_key) return Response.json({ error: 'Missing product_key' }, { status: 400 });
        if (isAdmin(user)) return Response.json({ entitled: true, reason: 'admin_bypass', active_sub_product: 'BROKER' });

        const reg = (aircraft_registration || '').toUpperCase().trim();
        const subProduct = await activeSubProduct(svc, user.email);
        const product = PRODUCT_CATALOG[product_key];
        if (!product) return Response.json({ entitled: false, reason: 'unknown_product' }, { status: 400 });
        if (product.type === 'contract') return Response.json({ contact_sales: true, product_key });
        if (SUB_KEYS.has(product_key)) {
          const entitled = subProduct === product_key;
          return Response.json({ entitled, reason: entitled ? 'active_subscription' : 'no_active_subscription', active_sub_product: subProduct });
        }

        if (!ONE_TIME_KEYS.has(product_key)) {
          return Response.json({ entitled: false, reason: 'unknown_product' }, { status: 400 });
        }

        if (PRODUCT_CATALOG[product_key]?.free) {
          return Response.json({ entitled: true, reason: 'free_product', active_sub_product: subProduct });
        }

        const existingReports = reg
          ? await svc.entities.PurchasedReport.filter({ user_email: user.email, product_key, aircraft_registration: reg, status: 'ready' }, '-created_date', 1)
          : [];
        if (existingReports.length > 0) {
          return Response.json({ entitled: true, reason: 'report_already_purchased', existing_report_id: existingReports[0].id, active_sub_product: subProduct });
        }

        if (subProduct && SUB_INCLUDED[subProduct]?.includes(product_key)) {
          return Response.json({ entitled: true, reason: 'subscription_included', active_sub_product: subProduct });
        }

        const ents = await svc.entities.Entitlement.filter(
          { user_email: user.email, product_key, aircraft_registration: reg, status: 'active' }, '-created_date', 1
        );
        if (ents.length > 0) {
          return Response.json({ entitled: true, reason: 'one_time_entitlement', entitlement_id: ents[0].id, active_sub_product: subProduct });
        }

        let priceUsd = product?.price_usd || 0;
        let discountPct = 0;
        let welcomePromo = false;
        const launchOffer = product?.type === 'one_time' ? await getLaunchOffer(svc, user, reg) : null;
        if (subProduct && SUB_DISCOUNT[subProduct]) {
          priceUsd = +(priceUsd * (1 - SUB_DISCOUNT[subProduct])).toFixed(2);
          discountPct = SUB_DISCOUNT[subProduct];
        } else if (launchOffer) {
          priceUsd = +(priceUsd * (1 - launchOffer.discount_pct)).toFixed(2);
          discountPct = launchOffer.discount_pct;
          welcomePromo = true;
        } else if (product?.type === 'one_time' && await welcomeDiscountEligible(svc, user)) {
          priceUsd = +(priceUsd * (1 - WELCOME_DISCOUNT)).toFixed(2);
          discountPct = WELCOME_DISCOUNT;
          welcomePromo = true;
        }
        // Upgrade discount takes precedence: a buyer who already owns a lower
        // tier for this aircraft pays only the difference minus a loyalty %.
        const owned = await ownedLowerTier(svc, user.email, product_key, reg);
        let upgrade = null;
        if (owned) {
          upgrade = upgradePrice(product_key, product?.price_usd || 0, owned);
          priceUsd = upgrade.upgrade_price_usd;
          discountPct = upgrade.discount_pct;
          welcomePromo = false;
        }
        return Response.json({ entitled: false, reason: 'payment_required', checkout_price_usd: priceUsd, original_price_usd: product?.price_usd || 0, discount_pct: discountPct, welcome_promo: welcomePromo, offer_expires_at: launchOffer?.expires_at || null, upgrade, owned_lower_tier: owned?.key || null, active_sub_product: subProduct });
      }

      case 'create_checkout': {
        const { product_key, aircraft_registration, return_url, report_input_id } = body;
        const product = PRODUCT_CATALOG[product_key];
        if (!product) return Response.json({ error: 'Unknown product' }, { status: 400 });
        if (REPORT_PACK_KEYS.has(product_key)) {
          const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
          if (!return_url) return Response.json({ error: 'Missing return_url' }, { status: 400 });
          const packPrice = resolveCheckoutAmount(product);
          const packBlocked = checkoutBlocker(product, packPrice);
          if (packBlocked) return Response.json({ error: packBlocked }, { status: 400 });
          const session = await stripe.checkout.sessions.create({
            mode: 'payment', payment_method_types: ['card'], customer_email: user.email, client_reference_id: user.id,
            metadata: { user_id: user.id, user_email: user.email, product_key, report_credits: String(product.credits) },
            success_url: `${return_url}${return_url.includes('?') ? '&' : '?'}paid=1&product=${product_key}`,
            cancel_url: `${return_url}${return_url.includes('?') ? '&' : '?'}canceled=1`,
            line_items: [{ price_data: { currency: packPrice.currency, product_data: { name: product.name }, unit_amount: packPrice.unitAmount }, quantity: 1 }],
          });
          return Response.json({ url: session.url, session_id: session.id, product_key });
        }
        if (product.free) {
          return Response.json({ free: true, granted: true, product_key });
        }
        if (!return_url) return Response.json({ error: 'Missing return_url' }, { status: 400 });

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        const reg = (aircraft_registration || '').toUpperCase().trim();
        const subProduct = await activeSubProduct(svc, user.email);
        const inputRows = report_input_id ? await svc.entities.ReportInputDraft.filter({ id: report_input_id, user_email: user.email }, '-created_date', 1) : [];
        const validInputId = inputRows[0]?.id || '';
        if (subProduct && SUB_INCLUDED[subProduct]?.includes(product_key)) {
          return Response.json({ included_in_subscription: true, product_key });
        }

        // All prices and discounts are resolved from this server catalog.
        // Currency-aware on purpose: a EUR-priced product read through
        // `price_usd` resolves to 0 and Stripe accepts a zero-amount line,
        // which creates a free subscription instead of failing loudly.
        const basePrice = resolveCheckoutAmount(product);
        const blocked = checkoutBlocker(product, basePrice);
        if (blocked) return Response.json({ error: blocked }, { status: 400 });
        const baseAmount = basePrice.amount;

        let unitAmount = basePrice.unitAmount;
        const launchOffer = product.type === 'one_time' ? await getLaunchOffer(svc, user, reg, false) : null;
        if (subProduct && SUB_DISCOUNT[subProduct] && product.type === 'one_time') {
          unitAmount = discountedUnitAmount(baseAmount, SUB_DISCOUNT[subProduct]);
        } else if (launchOffer) {
          unitAmount = discountedUnitAmount(baseAmount, launchOffer.discount_pct);
        } else if (!subProduct && product.type === 'one_time' && await welcomeDiscountEligible(svc, user)) {
          unitAmount = discountedUnitAmount(baseAmount, WELCOME_DISCOUNT);
        }
        // Upgrade discount: pay (higher − already-paid credit) minus loyalty %.
        const owned = await ownedLowerTier(svc, user.email, product_key, reg);
        if (owned && product.type === 'one_time') {
          unitAmount = Math.round(upgradePrice(product_key, baseAmount, owned).upgrade_price_usd * 100);
        }

        const sessionParams = {
          payment_method_types: ['card'],
          customer_email: user.email,
          client_reference_id: user.id,
          metadata: { user_id: user.id, user_email: user.email, product_key, aircraft_registration: reg, report_input_id: validInputId, offer_id: launchOffer?.id || '' },
          success_url: `${return_url}${return_url.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&paid=1&product=${product_key}${reg ? `&registration=${encodeURIComponent(reg)}` : ''}`,
          cancel_url: `${return_url}${return_url.includes('?') ? '&' : '?'}canceled=1`,
          line_items: [{ price_data: { currency: basePrice.currency, product_data: { name: product.name }, unit_amount: unitAmount, ...(product.type === 'subscription' ? { recurring: { interval: product.interval } } : {}) }, quantity: 1 }],
        };
        if (product.type === 'subscription') {
          sessionParams.mode = 'subscription';
          sessionParams.subscription_data = { metadata: { user_id: user.id, user_email: user.email, product_key } };
        } else {
          sessionParams.mode = 'payment';
        }
        const session = await stripe.checkout.sessions.create(sessionParams);
        return Response.json({ url: session.url, session_id: session.id });
      }

      case 'list_mine': {
        const [ents, reports] = await Promise.all([
          svc.entities.Entitlement.filter({ user_email: user.email }, '-created_date', 100),
          svc.entities.PurchasedReport.filter({ user_email: user.email }, '-created_date', 100),
        ]);
        const subProduct = await activeSubProduct(svc, user.email);
        const subscriptions = ents.filter((e) => SUB_KEYS.has(e.product_key));
        const oneTime = ents.filter((e) => ONE_TIME_KEYS.has(e.product_key));
        return Response.json({ entitlements: oneTime, subscriptions, active_sub_product: subProduct, reports });
      }

      case 'list_reports': {
        const reports = await svc.entities.PurchasedReport.filter({ user_email: user.email }, '-created_date', 100);
        return Response.json({ reports });
      }

      case 'save_report': {
        const { product_key, aircraft_registration, aircraft_label, report_type, result_data, data_sources, provider, confidence, verification_status, inputs, methodology_version } = body;
        if (!product_key || !aircraft_registration) return Response.json({ error: 'Missing product_key/aircraft_registration' }, { status: 400 });
        const reg = aircraft_registration.toUpperCase().trim();
        const authz = await requireEntitlement(svc, user, product_key, reg);
        if (!authz.ok) return Response.json(authz, { status: authz.status });

        const existing = await svc.entities.PurchasedReport.filter(
          { user_email: user.email, product_key, aircraft_registration: reg }, '-created_date', 1
        );
        const deal_code = existing[0]?.deal_code || await getOrCreateDealCode(svc, reg);
        const payload = {
          product_key,
          deal_code,
          aircraft_registration: reg,
          aircraft_label: aircraft_label || '',
          report_type: report_type || product_key.toLowerCase(),
          result_data: result_data || {},
          data_sources: data_sources || [],
          provider: provider || 'abos_omvm',
          methodology_version: methodology_version || 'v1',
          confidence: confidence || 'unverified',
          verification_status: verification_status || '',
          inputs: inputs || {},
          source_timestamp: new Date().toISOString(),
          status: 'ready',
        };
        if (existing[0]) {
          await svc.entities.PurchasedReport.update(existing[0].id, payload);
  
        if (product_key === 'ATI_BASIC_REPORT' && authz.reason === 'report_credit') {
          const balances = await svc.entities.ReportCreditBalance.filter({ user_email: user.email }, '-created_date', 1);
          if (balances[0] && balances[0].balance > 0) {
            await svc.entities.ReportCreditBalance.update(balances[0].id, { balance: balances[0].balance - 1, lifetime_used: (balances[0].lifetime_used || 0) + 1, updated_at: new Date().toISOString() });
          }
        }
        return Response.json({ report_id: existing[0].id, deal_code, updated: true });
        }
        const created = await svc.entities.PurchasedReport.create({ user_email: user.email, ...payload });
        return Response.json({ report_id: created.id, deal_code, updated: false });
      }

      case 'record_usage': {
        const { product_key, aircraft_registration, provider, cost_eur } = body;
        if (!product_key) return Response.json({ error: 'Missing product_key' }, { status: 400 });
        const reg = (aircraft_registration || '').toUpperCase().trim();
        const authz = await requireEntitlement(svc, user, product_key, reg);
        if (!authz.ok) return Response.json(authz, { status: authz.status });

        const usage = await svc.entities.UsageRecord.create({
          user_email: user.email,
          product_key,
          aircraft_registration: reg,
          request_id: crypto.randomUUID(),
          provider: provider || 'abos_omvm',
          cost_eur: Number.isFinite(Number(cost_eur)) ? Number(cost_eur) : 0,
          entitlement_id: authz.entitlement_id || null,
        });
        return Response.json({ recorded: true, usage_id: usage.id, authorization_reason: authz.reason });
      }

      case 'customer_portal': {
        const { return_url } = body;
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (!customers.data.length) return Response.json({ error: 'No Stripe customer found' }, { status: 404 });
        const session = await stripe.billingPortal.sessions.create({ customer: customers.data[0].id, return_url: return_url || Deno.env.get('BASE44_APP_URL') || '/' });
        return Response.json({ url: session.url });
      }

      case 'usage_summary': {
        const records = await svc.entities.UsageRecord.filter({ user_email: user.email }, '-created_date', 500);
        const subProduct = await activeSubProduct(svc, user.email);
        const byProduct = {};
        for (const r of records) byProduct[r.product_key] = (byProduct[r.product_key] || 0) + 1;
        return Response.json({ total: records.length, by_product: byProduct, active_sub_product: subProduct });
      }

      case 'admin_stats': {
        if (!isAdmin(user)) return Response.json({ error: 'Admin only' }, { status: 403 });
        const [ents, reports, usage, payments] = await Promise.all([
          svc.entities.Entitlement.list('-created_date', 500),
          svc.entities.PurchasedReport.list('-created_date', 500),
          svc.entities.UsageRecord.list('-created_date', 500),
          svc.entities.PaymentEvent.list('-created_date', 500),
        ]);
        const subscriptions = ents.filter((e) => SUB_KEYS.has(e.product_key) && e.status === 'active');
        const oneTimeEnts = ents.filter((e) => ONE_TIME_KEYS.has(e.product_key) && e.status === 'active');
        const revenueByProduct = {};
        for (const p of payments) if (p.product_key) revenueByProduct[p.product_key] = (revenueByProduct[p.product_key] || 0) + (p.amount_eur || 0);
        const failedPayments = payments.filter((p) => p.status === 'failed').length;
        return Response.json({
          total_revenue_eur: payments.reduce((s, p) => s + (p.amount_eur || 0), 0),
          active_subscriptions: subscriptions.length,
          one_time_purchases: oneTimeEnts.length,
          reports_sold: reports.length,
          usage_events: usage.length,
          failed_payments: failedPayments,
          refunds: ents.filter((e) => e.status === 'refunded').length,
          revenue_by_product: revenueByProduct,
          subscriptions,
          one_time_entitlements: oneTimeEnts,
          recent_payments: payments.slice(0, 50),
          recent_usage: usage.slice(0, 50),
        });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('abosEntitlements error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});