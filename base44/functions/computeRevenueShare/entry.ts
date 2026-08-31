import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Compute Revenue Share — triggered by entity automation when an
 * EscrowTransaction transitions to status='closed'.
 *
 * Calculates ABOS revenue share (partner.revenue_share_pct of sale_amount)
 * and records it in CommissionLedger. Also updates PartnerConfig stats.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { event, data } = body;

    if (!data || data.status !== 'closed') {
      return Response.json({ skipped: true, reason: 'not closed' });
    }
    if (!data.partner_id) {
      return Response.json({ skipped: true, reason: 'no partner — not a widget transaction' });
    }

    const partner = await base44.asServiceRole.entities.PartnerConfig.get(data.partner_id);
    if (!partner) {
      return Response.json({ skipped: true, reason: 'partner config not found' });
    }

    const saleAmount = Number(data.sale_amount) || 0;
    const sharePct = Number(partner.revenue_share_pct) || 1.5;
    const shareAmount = Math.round(saleAmount * sharePct / 100 * 100) / 100;

    // Create CommissionLedger entry for ABOS platform share
    await base44.asServiceRole.entities.CommissionLedger.create({
      escrow_transaction: data.id,
      gross_amount: saleAmount,
      commission_pool: shareAmount,
      level: 0,
      role: 'issuer',
      payee_email: 'abos@abos-marketspace.com',
      percentage: sharePct,
      amount: shareAmount,
      currency: data.currency || 'USD',
      status: 'allocated',
      partner_id: data.partner_id,
      partner_name: partner.partner_name,
      calculated_at: new Date().toISOString(),
      notes: `Widget revenue share: ${sharePct}% of ${data.currency || 'USD'} ${saleAmount}`,
    });

    // Update partner aggregate stats
    await base44.asServiceRole.entities.PartnerConfig.update(data.partner_id, {
      total_volume: (partner.total_volume || 0) + saleAmount,
      total_transactions: (partner.total_transactions || 0) + 1,
      revenue_share_owed: (partner.revenue_share_owed || 0) + shareAmount,
    });

    return Response.json({
      success: true,
      escrow_id: data.id,
      partner_id: data.partner_id,
      sale_amount: saleAmount,
      revenue_share_pct: sharePct,
      revenue_share_amount: shareAmount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});