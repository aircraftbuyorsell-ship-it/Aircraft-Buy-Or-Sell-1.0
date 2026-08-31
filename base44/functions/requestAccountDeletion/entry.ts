import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin' || user.role === 'super_admin') {
      return Response.json({ error: 'Admins cannot request account deletion' }, { status: 403 });
    }

    const { reason } = await req.json().catch(() => ({}));
    const requestedAt = new Date();
    const scheduledFor = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [listings, leads, orders, cards, escrows] = await Promise.all([
      base44.asServiceRole.entities.AircraftListing.filter({ owner: user.id }, '-created_date', 500),
      base44.asServiceRole.entities.Lead.filter({ created_by: user.email }, '-created_date', 500),
      base44.asServiceRole.entities.Order.filter({ user: user.id }, '-created_date', 500),
      base44.asServiceRole.entities.ATICard.filter({ card_owner_email: user.email }, '-created_date', 500),
      base44.asServiceRole.entities.EscrowTransaction.filter({ broker_email: user.email }, '-created_date', 500),
    ]);

    const dataExport = {
      exported_at: requestedAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      listings,
      leads,
      orders,
      ati_cards: cards,
      escrow_transactions: escrows,
    };

    await base44.entities.AccountDeletion.create({
      user_email: user.email,
      user_name: user.full_name || user.email,
      reason: reason || '',
      status: 'scheduled',
      requested_at: requestedAt.toISOString(),
      scheduled_for: scheduledFor.toISOString(),
      data_export_json: JSON.stringify(dataExport),
    });

    await base44.auth.updateMe({
      deletion_requested_at: requestedAt.toISOString(),
      deletion_scheduled_for: scheduledFor.toISOString(),
      deletion_reason: reason || '',
    });

    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Your ABOS account deletion request',
        body: `Hi ${user.full_name || ''},\n\nWe received your account deletion request. It is scheduled for ${scheduledFor.toLocaleDateString('en-US')} after a 30-day grace period.\n\nIf this was a mistake, contact support before that date.\n\n— The ABOS Team`,
      });
    } catch (emailError) {
      console.warn('Deletion confirmation email skipped:', emailError.message);
    }

    return Response.json({
      success: true,
      message: 'Account deletion scheduled for 30 days from now',
      deletionDate: scheduledFor.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});