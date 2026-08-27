import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

const ESCROW_API_BASE = 'https://api.escrow.com/2017-09-01';

function basicAuthHeader() {
  return 'Basic ' + btoa(`${Deno.env.get('ESCROW_API_USER')}:${Deno.env.get('ESCROW_API_KEY')}`);
}

async function createEscrowComTransaction(tx) {
  const body = {
    currency: (tx.currency || 'USD').toLowerCase(),
    description: `Aircraft: ${tx.aircraft_label || 'Aviation transaction'}`,
    items: [{ title: tx.aircraft_label || 'Aircraft', description: `Sale of ${tx.aircraft_label || 'aircraft'}`, type: 'general_merchandise', inspection_period: (tx.inspection_period_days || 3) * 86400, quantity: 1, schedule: [{ amount: String(tx.sale_amount), payer_customer: tx.buyer_email, beneficiary_customer: tx.seller_email }] }],
    parties: [{ role: 'buyer', customer: tx.buyer_email }, { role: 'seller', customer: tx.seller_email }],
  };
  const res = await fetch(`${ESCROW_API_BASE}/transaction`, { method: 'POST', headers: { Authorization: basicAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || `Escrow.com error ${res.status}`);
  return data;
}

async function fetchEscrowComTransaction(id) {
  const res = await fetch(`${ESCROW_API_BASE}/transaction/${id}`, { headers: { Authorization: basicAuthHeader() } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || `Escrow.com error ${res.status}`);
  return data;
}

async function getListingFee(base44, tx) {
  if (!tx.listing) return { listing: null, fee: 0 };
  const listing = await base44.asServiceRole.entities.AircraftListing.get(tx.listing);
  return { listing, fee: Number(listing?.pending_fee_usd || tx.finders_fee_amount || 0) };
}

async function createStripeEscrow(base44, stripe, tx) {
  const sellerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: tx.seller_email }, '-created_date', 1);
  const destination = sellerProfiles[0]?.stripe_connect_account_id;
  if (!destination) throw new Error('Seller Stripe Connect account is required for Stripe escrow');
  const { fee } = await getListingFee(base44, tx);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', customer_email: tx.buyer_email,
    line_items: [{ price_data: { currency: (tx.currency || 'USD').toLowerCase(), product_data: { name: tx.aircraft_label || 'Aircraft escrow' }, unit_amount: Math.round(Number(tx.sale_amount) * 100) }, quantity: 1 }],
    payment_intent_data: { capture_method: 'manual', transfer_data: { destination }, application_fee_amount: Math.round(fee * 100), metadata: { escrow_transaction_id: tx.id, listing_id: tx.listing || '' } },
    success_url: `${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}?escrow=authorized`,
    cancel_url: `${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}?escrow=cancelled`,
  });
  return { id: session.id, url: session.url, fee };
}

async function closeStripeEscrow(base44, stripe, tx) {
  const session = await stripe.checkout.sessions.retrieve(tx.escrow_external_id, { expand: ['payment_intent'] });
  const intent = session.payment_intent;
  if (!intent || typeof intent === 'string') throw new Error('Stripe payment intent not available');
  if (intent.status === 'requires_capture') await stripe.paymentIntents.capture(intent.id);
  const { listing, fee } = await getListingFee(base44, tx);
  const existing = await base44.asServiceRole.entities.CommissionLedger.filter({ escrow_transaction: tx.id, type: 'finders_fee' }, '-created_date', 1);
  if (fee > 0 && !existing[0]) {
    await base44.asServiceRole.entities.CommissionLedger.create({ escrow_transaction: tx.id, listing_id: listing?.id, seller_email: tx.seller_email, type: 'finders_fee', gross_amount: tx.sale_amount, commission_pool: fee, currency: tx.currency || 'USD', level: 0, role: 'issuer', payee_email: 'platform', percentage: 100, amount: fee, status: 'allocated', calculated_at: new Date().toISOString(), notes: 'Collected as Stripe Connect application fee at escrow close.' });
  }
  await base44.asServiceRole.entities.EscrowTransaction.update(tx.id, { status: 'closed', closed_at: new Date().toISOString(), finders_fee_amount: fee, seller_net: Number(tx.sale_amount) - fee });
  return { fee };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { action, transaction_id } = await req.json();
    const tx = await base44.entities.EscrowTransaction.get(transaction_id);
    if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    if (action === 'create') {
      if (tx.escrow_provider === 'stripe') {
        const result = await createStripeEscrow(base44, stripe, tx);
        await base44.entities.EscrowTransaction.update(tx.id, { escrow_external_id: result.id, stripe_session_id: result.id, finders_fee_amount: result.fee, seller_net: Number(tx.sale_amount) - result.fee, status: 'contract_sent' });
        return Response.json({ success: true, checkout_url: result.url, finders_fee_amount: result.fee });
      }
      const result = await createEscrowComTransaction(tx);
      await base44.entities.EscrowTransaction.update(tx.id, { escrow_provider: 'escrow_com', escrow_external_id: String(result.id), escrow_landing_url: result.landing_page || null, status: 'contract_sent' });
      return Response.json({ success: true, escrow_id: result.id, landing_url: result.landing_page });
    }

    if (action === 'close' && tx.escrow_provider === 'stripe') {
      const result = await closeStripeEscrow(base44, stripe, tx);
      return Response.json({ success: true, local_status: 'closed', finders_fee_amount: result.fee });
    }

    if (action === 'sync') {
      if (tx.escrow_provider === 'stripe') return Response.json({ success: true, local_status: tx.status, reason: 'Stripe escrow is finalized with the close action.' });
      if (!tx.escrow_external_id) return Response.json({ error: 'No external escrow ID' }, { status: 400 });
      const remote = await fetchEscrowComTransaction(tx.escrow_external_id);
      const statusMap = { created: 'contract_sent', agreed: 'contract_signed', funds_held: 'funds_secured', in_progress: 'inspection', closed: 'closed', cancelled: 'cancelled' };
      const mapped = statusMap[remote.status?.in_progress ? 'in_progress' : remote.status] || tx.status;
      await base44.entities.EscrowTransaction.update(tx.id, { status: mapped, closed_at: mapped === 'closed' ? new Date().toISOString() : tx.closed_at });
      return Response.json({ success: true, remote_status: remote.status, local_status: mapped });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});