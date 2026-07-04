import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';

// Email-first report purchase funnel (public, no account required):
// 1) User submits email + registration → ReportRequest created
// 2) Stripe Checkout session created (€29, inline price)
// 3) Returns checkout URL; after payment reportFulfill generates + emails the PDF

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeReg(input) {
  const clean = String(input || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const reg = normalizeReg(body.registration);
    const email = String(body.email || '').trim().toLowerCase();
    const returnUrl = String(body.returnUrl || '').split('?')[0];

    if (!reg) return Response.json({ error: 'registration required' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return Response.json({ error: 'valid email required' }, { status: 400 });

    const svc = base44.asServiceRole.entities;

    // Ensure a Digital Twin exists (init if needed)
    let passports = await svc.ATIPassport.filter({ registration: reg }, '-created_date', 1);
    if (passports.length === 0) {
      try {
        await base44.asServiceRole.functions.invoke('initDigitalTwin', { registration: reg });
        passports = await svc.ATIPassport.filter({ registration: reg }, '-created_date', 1);
      } catch (_) { /* twin init failed — proceed, fulfill will retry */ }
    }
    const passport = passports[0] || null;

    // Create the funnel record
    const request = await svc.ReportRequest.create({
      registration: reg,
      email,
      status: 'email_captured',
      price_eur: 29,
      passport_id: passport?.id || null,
    });

    // Create Stripe checkout with inline price (no pre-created priceId needed)
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: 2900,
          product_data: {
            name: `ATI Aircraft Report — ${reg}`,
            description: 'Full Aircraft Transparency Index report delivered as PDF to your email',
          },
        },
        quantity: 1,
      }],
      success_url: `${returnUrl}?report_session={CHECKOUT_SESSION_ID}&report_reg=${encodeURIComponent(reg)}&success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        type: 'ati_report',
        report_request_id: request.id,
        registration: reg,
        email,
      },
    });

    await svc.ReportRequest.update(request.id, {
      status: 'pending_payment',
      stripe_session_id: session.id,
    });

    return Response.json({
      ok: true,
      requestId: request.id,
      checkoutUrl: session.url,
      registration: reg,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});