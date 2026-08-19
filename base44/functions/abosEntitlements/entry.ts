import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

/**
 * ABOS Entitlement Engine
 * ───────────────────────
 * Server-side authorization for all paid features. Never trusts the frontend.
 * The same check() is used by the web app, the Core API, and MCP/AI agents.
 *
 * Products (mirror of src/lib/products.js):
 *  - One-time (per-aircraft): ATI_SCORE, ATI_FULL_REPORT, VALUATION_STUDIO, VERIFICATION_PACK
 *  - Subscription (global):   PRO (€99/mo), BROKER (€299/mo)
 *
 * Flow: create_checkout → Stripe → webhook (stripeWebhook) grants Entitlement →
 *       check() returns entitled → frontend runs existing tool → save_report + record_usage.
 */

const PRODUCT_CATALOG = {
  ATI_SCORE:        { name: 'ATI Score',           type: 'one_time',     price_eur: 9.90,  currency: 'eur' },
  ATI_FULL_REPORT:  { name: 'ATI Full Report',     type: 'one_time',     price_eur: 49.00, currency: 'eur' },
  VALUATION_STUDIO: { name: 'Valuation Studio',     type: 'one_time',     price_eur: 29.00, currency: 'eur' },
  VERIFICATION_PACK:{ name: 'Verification Pack',    type: 'one_time',     price_eur: 19.90, currency: 'eur' },
  PRO:              { name: 'ABOS Professional',    type: 'subscription', price_eur: 99,    currency: 'eur', interval: 'month' },
  BROKER:           { name: 'ABOS Broker / Dealer', type: 'subscription', price_eur: 299,   currency: 'eur', interval: 'month' },
};

const SUB_INCLUDED = { PRO: ['ATI_SCORE', 'VERIFICATION_PACK'], BROKER: ['ATI_SCORE', 'VERIFICATION_PACK'] };
const SUB_DISCOUNT = { PRO: 0.30, BROKER: 0.40 };
const SUB_KEYS = new Set(['PRO', 'BROKER']);

// ── New-member welcome promo: 30% off the first one-time purchase within 14 days of signup ──
const WELCOME_DISCOUNT = 0.30;
const WELCOME_WINDOW_DAYS = 14;

async function welcomeDiscountEligible(svc, user) {
  const created = new Date(user.created_date || 0).getTime();
  if (!created || Date.now() - created > WELCOME_WINDOW_DAYS * 86400000) return false;
  const ents = await svc.entities.Entitlement.filter({ user_email: user.email }, '-created_date', 1);
  return ents.length === 0;
}
const ONE_TIME_KEYS = new Set(['ATI_SCORE', 'ATI_FULL_REPORT', 'VALUATION_STUDIO', 'VERIFICATION_PACK']);

function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

// Resolve the user's active subscription product (PRO/BROKER) or null.
async function activeSubProduct(svc, email) {
  const ents = await svc.entities.Entitlement.filter(
    { user_email: email, status: 'active', scope: 'global' }, '-created_date', 10
  );
  for (const e of ents) {
    if (SUB_KEYS.has(e.product_key)) return e.product_key;
  }
  return null;
}

// Idempotency: check a PaymentEvent was already recorded for this event id.
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
      // ── Catalog ──
      case 'list_products': {
        return Response.json({ products: Object.entries(PRODUCT_CATALOG).map(([k, v]) => ({ key: k, ...v })) });
      }

      // ── Entitlement check (the gate) ──
      case 'check': {
        const { product_key, aircraft_registration } = body;
        if (!product_key) return Response.json({ error: 'Missing product_key' }, { status: 400 });

        const reg = (aircraft_registration || '').toUpperCase().trim();
        const subProduct = await activeSubProduct(svc, user.email);

        // Subscription product check
        if (SUB_KEYS.has(product_key)) {
          const entitled = subProduct === product_key;
          return Response.json({ entitled, reason: entitled ? 'active_subscription' : 'no_active_subscription', active_sub_product: subProduct });
        }

        // One-time product check
        // 1. Already purchased a ready report? → re-access (no charge)
        const existingReports = reg
          ? await svc.entities.PurchasedReport.filter({ user_email: user.email, product_key, aircraft_registration: reg, status: 'ready' }, '-created_date', 1)
          : [];
        if (existingReports.length > 0) {
          return Response.json({ entitled: true, reason: 'report_already_purchased', existing_report_id: existingReports[0].id, active_sub_product: subProduct });
        }

        // 2. Included in active subscription?
        if (subProduct && SUB_INCLUDED[subProduct]?.includes(product_key)) {
          return Response.json({ entitled: true, reason: 'subscription_included', active_sub_product: subProduct });
        }

        // 3. Per-aircraft entitlement exists? (also matches registration-less purchases)
        {
          const ents = await svc.entities.Entitlement.filter(
            { user_email: user.email, product_key, aircraft_registration: reg, status: 'active' }, '-created_date', 1
          );
          if (ents.length > 0) {
            return Response.json({ entitled: true, reason: 'one_time_entitlement', entitlement_id: ents[0].id, active_sub_product: subProduct });
          }
        }

        // 4. Not entitled → payment required
        const product = PRODUCT_CATALOG[product_key];
        let priceEur = product?.price_eur || 0;
        let discountPct = 0;
        let welcomePromo = false;
        if (subProduct && SUB_DISCOUNT[subProduct]) {
          priceEur = +(priceEur * (1 - SUB_DISCOUNT[subProduct])).toFixed(2);
          discountPct = SUB_DISCOUNT[subProduct];
        } else if (product?.type === 'one_time' && await welcomeDiscountEligible(svc, user)) {
          priceEur = +(priceEur * (1 - WELCOME_DISCOUNT)).toFixed(2);
          discountPct = WELCOME_DISCOUNT;
          welcomePromo = true;
        }
        return Response.json({
          entitled: false,
          reason: 'payment_required',
          checkout_price_eur: priceEur,
          original_price_eur: product?.price_eur || 0,
          discount_pct: discountPct,
          welcome_promo: welcomePromo,
          active_sub_product: subProduct,
        });
      }

      // ── Create Stripe Checkout ──
      case 'create_checkout': {
        const { product_key, aircraft_registration, return_url } = body;
        const product = PRODUCT_CATALOG[product_key];
        if (!product) return Response.json({ error: 'Unknown product' }, { status: 400 });
        if (!return_url) return Response.json({ error: 'Missing return_url' }, { status: 400 });

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        const reg = (aircraft_registration || '').toUpperCase().trim();
        const subProduct = await activeSubProduct(svc, user.email);

        // If the product is included in the user's subscription, no checkout needed.
        if (subProduct && SUB_INCLUDED[subProduct]?.includes(product_key)) {
          return Response.json({ included_in_subscription: true, product_key });
        }

        let unitAmount = Math.round(product.price_eur * 100);
        if (subProduct && SUB_DISCOUNT[subProduct] && product.type === 'one_time') {
          unitAmount = Math.round(product.price_eur * (1 - SUB_DISCOUNT[subProduct]) * 100);
        } else if (!subProduct && product.type === 'one_time' && await welcomeDiscountEligible(svc, user)) {
          unitAmount = Math.round(product.price_eur * (1 - WELCOME_DISCOUNT) * 100);
        }

        const sessionParams = {
          payment_method_types: ['card'],
          customer_email: user.email,
          client_reference_id: user.id,
          metadata: { user_id: user.id, user_email: user.email, product_key, aircraft_registration: reg },
          success_url: `${return_url}${return_url.includes('?') ? '&' : '?'}paid=1&product=${product_key}${reg ? `&registration=${encodeURIComponent(reg)}` : ''}`,
          cancel_url: `${return_url}${return_url.includes('?') ? '&' : '?'}canceled=1`,
          line_items: [{
            price_data: {
              currency: product.currency,
              product_data: { name: product.name },
              unit_amount: unitAmount,
              ...(product.type === 'subscription' ? { recurring: { interval: product.interval } } : {}),
            },
            quantity: 1,
          }],
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

      // ── List my entitlements + active subscription ──
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

      // ── List my purchased reports ──
      case 'list_reports': {
        const reports = await svc.entities.PurchasedReport.filter({ user_email: user.email }, '-created_date', 100);
        return Response.json({ reports });
      }

      // ── Save report result (after a paid tool runs) ──
      case 'save_report': {
        const { product_key, aircraft_registration, aircraft_label, report_type, result_data, data_sources, provider, confidence, verification_status, inputs, methodology_version } = body;
        if (!product_key || !aircraft_registration) return Response.json({ error: 'Missing product_key/aircraft_registration' }, { status: 400 });
        const reg = aircraft_registration.toUpperCase().trim();

        // Idempotent per (user, product, aircraft): update existing ready report, else create.
        const existing = await svc.entities.PurchasedReport.filter(
          { user_email: user.email, product_key, aircraft_registration: reg }, '-created_date', 1
        );
        const payload = {
          product_key,
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
          return Response.json({ report_id: existing[0].id, updated: true });
        }
        const created = await svc.entities.PurchasedReport.create({ user_email: user.email, ...payload });
        return Response.json({ report_id: created.id, updated: false });
      }

      // ── Record usage ──
      case 'record_usage': {
        const { product_key, aircraft_registration, provider, cost_eur } = body;
        if (!product_key) return Response.json({ error: 'Missing product_key' }, { status: 400 });
        const reg = (aircraft_registration || '').toUpperCase().trim();
        const subProduct = await activeSubProduct(svc, user.email);
        await svc.entities.UsageRecord.create({
          user_email: user.email,
          product_key,
          aircraft_registration: reg,
          request_id: crypto.randomUUID(),
          provider: provider || 'abos_omvm',
          cost_eur: cost_eur || 0,
          ...(subProduct ? { entitlement_id: null } : {}),
        });
        return Response.json({ recorded: true });
      }

      // ── Customer portal (manage subscription) ──
      case 'customer_portal': {
        const { return_url } = body;
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (!customers.data.length) return Response.json({ error: 'No Stripe customer found' }, { status: 404 });
        const session = await stripe.billingPortal.sessions.create({
          customer: customers.data[0].id,
          return_url: return_url || Deno.env.get('BASE44_APP_URL') || '/',
        });
        return Response.json({ url: session.url });
      }

      // ── Usage summary ──
      case 'usage_summary': {
        const records = await svc.entities.UsageRecord.filter({ user_email: user.email }, '-created_date', 500);
        const subProduct = await activeSubProduct(svc, user.email);
        const byProduct = {};
        for (const r of records) {
          byProduct[r.product_key] = (byProduct[r.product_key] || 0) + 1;
        }
        return Response.json({ total: records.length, by_product: byProduct, active_sub_product: subProduct });
      }

      // ── Admin monetization stats ──
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
        for (const p of payments) {
          if (p.product_key) revenueByProduct[p.product_key] = (revenueByProduct[p.product_key] || 0) + (p.amount_eur || 0);
        }
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