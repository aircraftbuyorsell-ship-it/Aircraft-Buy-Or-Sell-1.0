import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';

/**
 * Widget Escrow Action — handles escrow lifecycle for partner widget transactions.
 * Validates embed_token before every action. All operations run as service role.
 *
 * Actions: create_escrow, stripe_checkout, usdc_init, usdc_check,
 *          schedule_inspection, close
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { embed_token, action, payload } = body;

    if (!embed_token) return Response.json({ error: 'embed_token required' }, { status: 403 });
    const partners = await base44.asServiceRole.entities.PartnerConfig.filter(
      { embed_token, is_active: true }, '-created_date', 1
    );
    if (partners.length === 0) return Response.json({ error: 'Invalid embed token' }, { status: 403 });
    const partner = partners[0];

    switch (action) {
      case 'create_escrow': return await createEscrow(base44, payload, partner);
      case 'stripe_checkout': return await stripeCheckout(base44, payload, partner);
      case 'usdc_init': return await usdcInit(base44, payload, partner);
      case 'usdc_check': return await usdcCheck(base44, payload, partner);
      case 'schedule_inspection': return await scheduleInspection(base44, payload, partner);
      case 'close': return await closeEscrow(base44, payload, partner);
      default: return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ═══════════════════════════════════════════
// CREATE ESCROW
// ═══════════════════════════════════════════
async function createEscrow(base44, payload, partner) {
  const { aircraft_label, buyer_name, buyer_email, seller_name, seller_email, sale_amount, currency, inspection_date, return_url } = payload || {};
  if (!buyer_name || !seller_name || !sale_amount) {
    return Response.json({ error: 'buyer_name, seller_name, sale_amount required' }, { status: 400 });
  }

  const tx = await base44.asServiceRole.entities.EscrowTransaction.create({
    aircraft_label: aircraft_label || 'Aircraft transaction',
    buyer_name, buyer_email: buyer_email || null,
    seller_name, seller_email: seller_email || null,
    sale_amount: Number(sale_amount),
    currency: currency || 'USD',
    status: 'draft',
    escrow_provider: 'internal',
    payment_method: 'internal',
    partner_id: partner.id,
    partner_email: partner.partner_email,
    partner_revenue_share_pct: partner.revenue_share_pct,
    widget_origin: true,
    inspection_date: inspection_date || null,
    return_url: returnUrl || null,
  });

  return Response.json({ escrow_id: tx.id, status: tx.status, sale_amount: tx.sale_amount });
}

// ═══════════════════════════════════════════
// STRIPE CHECKOUT — create session for escrow deposit
// ═══════════════════════════════════════════
async function stripeCheckout(base44, payload, partner) {
  const { escrow_id, return_url } = payload || {};
  if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });

  const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
  if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
  if (tx.partner_id !== partner.id) return Response.json({ error: 'Transaction does not belong to this partner' }, { status: 403 });

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: tx.buyer_email || undefined,
    line_items: [{
      price_data: {
        currency: (tx.currency || 'USD').toLowerCase(),
        product_data: { name: `Escrow deposit: ${tx.aircraft_label || 'Aircraft'}` },
        unit_amount: Math.round(tx.sale_amount * 100),
      },
      quantity: 1,
    }],
    success_url: `${return_url || tx.return_url}&escrow_id=${escrow_id}&stripe_success=true`,
    cancel_url: `${return_url || tx.return_url}&escrow_id=${escrow_id}&stripe_canceled=true`,
    metadata: {
      escrow_id, partner_id: partner.id,
      buyer_email: tx.buyer_email || '', seller_email: tx.seller_email || '',
    },
  });

  await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
    stripe_session_id: session.id,
    payment_method: 'stripe',
    escrow_provider: 'stripe',
    escrow_external_id: session.id,
    status: 'funds_pending',
  });

  return Response.json({ session_url: session.url, session_id: session.id, escrow_id });
}

// ═══════════════════════════════════════════
// USDC INIT — generate wallet address for deposit
// ═══════════════════════════════════════════
async function usdcInit(base44, payload, partner) {
  const { escrow_id } = payload || {};
  if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });

  const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
  if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
  if (tx.partner_id !== partner.id) return Response.json({ error: 'Transaction does not belong to this partner' }, { status: 403 });

  const walletRes = await base44.asServiceRole.functions.invoke('usdcEscrowMonitor', {
    action: 'generate_wallet',
    embed_token: partner.embed_token,
  });
  const walletData = walletRes.data || walletRes;

  await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
    escrow_wallet_address: walletData.address,
    escrow_wallet_encrypted_key: walletData.encrypted_key,
    usdc_amount_required: tx.sale_amount,
    payment_method: 'usdc',
    escrow_provider: 'usdc',
    status: 'funds_pending',
  });

  return Response.json({
    escrow_id,
    wallet_address: walletData.address,
    required_usdc: tx.sale_amount,
    status: 'funds_pending',
  });
}

// ═══════════════════════════════════════════
// USDC CHECK — poll on-chain balance
// ═══════════════════════════════════════════
async function usdcCheck(base44, payload, partner) {
  const { escrow_id } = payload || {};
  if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });

  const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
  if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
  if (tx.partner_id !== partner.id) return Response.json({ error: 'Transaction does not belong to this partner' }, { status: 403 });

  const checkRes = await base44.asServiceRole.functions.invoke('usdcEscrowMonitor', {
    action: 'check_balance',
    escrow_id,
  });
  return Response.json(checkRes.data || checkRes);
}

// ═══════════════════════════════════════════
// SCHEDULE INSPECTION — send email notification to both parties
// ═══════════════════════════════════════════
async function scheduleInspection(base44, payload, partner) {
  const { escrow_id, inspection_date, location } = payload || {};
  if (!escrow_id || !inspection_date) return Response.json({ error: 'escrow_id and inspection_date required' }, { status: 400 });

  const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
  if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });

  await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
    inspection_date,
    status: 'inspection',
  });

  // Email both parties
  const emailBody = `Pre-buy inspection scheduled for ${tx.aircraft_label || 'your aircraft'}.

Date: ${inspection_date}
${location ? 'Location: ' + location : 'Location: TBD (seller to confirm)'}

Transaction reference: ${escrow_id}
Sale amount: ${tx.currency || 'USD'} ${Number(tx.sale_amount).toLocaleString()}

Please coordinate directly to confirm the exact time and location.`;

  if (tx.buyer_email) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tx.buyer_email,
      subject: `Pre-Buy Inspection Scheduled — ${tx.aircraft_label || 'Aircraft'}`,
      body: emailBody,
      from_name: partner.brand_name || 'ABOS',
    });
  }
  if (tx.seller_email) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tx.seller_email,
      subject: `Pre-Buy Inspection Scheduled — ${tx.aircraft_label || 'Aircraft'}`,
      body: emailBody,
      from_name: partner.brand_name || 'ABOS',
    });
  }

  return Response.json({ escrow_id, inspection_date, status: 'inspection' });
}

// ═══════════════════════════════════════════
// CLOSE ESCROW — release funds, notify parties
// Revenue share is computed by the entity automation on status=closed
// ═══════════════════════════════════════════
async function closeEscrow(base44, payload, partner) {
  const { escrow_id } = payload || {};
  if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });

  let tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
  if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
  if (tx.partner_id !== partner.id) return Response.json({ error: 'Transaction does not belong to this partner' }, { status: 403 });

  // USDC-funded escrows must actually move the funds on-chain before we can
  // truthfully tell either party that money was released. Escrow.com deals
  // are confirmed via escrowSync against the live Escrow.com API. Stripe-
  // funded escrow deposits are NOT gated here — stripeWebhook only handles
  // subscription/credit purchases, not EscrowTransaction records, so a
  // Stripe-funded close is still effectively a self-reported status today.
  // That gap is real and unresolved; flagged in EscrowDrawer's UI too.
  if (tx.payment_method === 'usdc' && tx.status !== 'released') {
    const releaseRes = await base44.asServiceRole.functions.invoke('usdcEscrowMonitor', {
      action: 'release',
      escrow_id,
      embed_token: partner.embed_token,
    });
    const releaseData = releaseRes.data || releaseRes;
    if (releaseData.error) {
      return Response.json({
        error: `Cannot close: USDC release failed — ${releaseData.error}`,
      }, { status: 409 });
    }
    tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
  }

  await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
    status: 'closed',
    closed_at: new Date().toISOString(),
  });

  // Email both parties
  const closeBody = `Transaction completed for ${tx.aircraft_label || 'aircraft'}.

Sale amount: ${tx.currency || 'USD'} ${Number(tx.sale_amount).toLocaleString()}
${tx.payment_method === 'usdc'
    ? `USDC funds have been released on-chain to the seller (tx: ${tx.blockchain_tx_hash}).`
    : 'Escrow funds have been released to the seller.'}

Transaction reference: ${escrow_id}
Thank you for using ${partner.brand_name || 'ABOS'}.`;

  if (tx.buyer_email) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tx.buyer_email,
      subject: `Transaction Completed — ${tx.aircraft_label || 'Aircraft'}`,
      body: closeBody,
      from_name: partner.brand_name || 'ABOS',
    });
  }
  if (tx.seller_email) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tx.seller_email,
      subject: `Funds Released — ${tx.aircraft_label || 'Aircraft'}`,
      body: closeBody,
      from_name: partner.brand_name || 'ABOS',
    });
  }

  return Response.json({ escrow_id, status: 'closed', closed_at: new Date().toISOString() });
}