import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only manual KYC verification for USDC escrow transactions held above
// the ARCH-004 compliance threshold. No automated KYC provider (e.g. Sumsub)
// is integrated yet — this is the interim enforcement gate: funds that
// arrived on-chain stay in 'funds_pending' (not 'funds_secured') until an
// admin explicitly verifies or rejects here. See usdcEscrowMonitor for the
// hold logic and base44/entities/EscrowTransaction.jsonc for kyc_status.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { escrow_id, decision } = await req.json();
    if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });
    if (!['verified', 'rejected'].includes(decision)) {
      return Response.json({ error: "decision must be 'verified' or 'rejected'" }, { status: 400 });
    }

    const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
    if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });

    const update = {
      kyc_status: decision,
      kyc_verified_at: new Date().toISOString(),
      kyc_verified_by: user.email,
    };

    // If funds already arrived on-chain and were being held for KYC, release
    // them into funds_secured now that verification passed.
    const fundsAlreadyReceived = (tx.usdc_amount_received || 0) >= (tx.usdc_amount_required || 0)
      && (tx.usdc_amount_required || 0) > 0;
    if (decision === 'verified' && fundsAlreadyReceived && tx.status === 'funds_pending') {
      update.status = 'funds_secured';
    }

    await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, update);

    return Response.json({ ok: true, escrow_id, kyc_status: decision, released: update.status === 'funds_secured' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
