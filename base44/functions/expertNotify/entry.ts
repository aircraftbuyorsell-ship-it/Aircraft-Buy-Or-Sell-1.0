import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Expert CrossCheck email notifications.
 *
 * Input: { type, ...payload }
 *   type='new_crosscheck'   → notifies all approved experts about a new request
 *   type='bid_received'     → notifies requester that a bid was placed
 *   type='completed'        → notifies requester that the expert submitted a verdict
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { type, registration, aircraft_info, requester_email, expert_name, price_eur, verdict, expert_comment } = body;

    if (type === 'new_crosscheck') {
      const experts = await base44.asServiceRole.entities.ExpertProfile.filter(
        { verified_status: 'approved', is_blocked: false },
        '-created_date',
        100
      );

      let sent = 0;
      for (const expert of experts) {
        if (!expert.email) continue;
        try {
          await base44.integrations.Core.SendEmail({
            to: expert.email,
            subject: `New Expert CrossCheck Request: ${registration}`,
            body: `Hello ${expert.full_name},\n\nA new Expert CrossCheck request has been posted on ABOS MarketSpace.\n\nAircraft: ${aircraft_info || 'N/A'}\nRegistration: ${registration}\n\nVisit your Expert Dashboard to review the GCR report and submit a bid.\n\n— ABOS MarketSpace`,
          });
          sent++;
        } catch (_) { /* skip failed sends */ }
      }
      return Response.json({ notified: sent });
    }

    if (type === 'bid_received') {
      if (!requester_email) return Response.json({ error: 'requester_email required' }, { status: 400 });
      await base44.integrations.Core.SendEmail({
        to: requester_email,
        subject: `Expert Bid Received: ${registration}`,
        body: `Hello,\n\n${expert_name} has submitted a bid of €${price_eur} for your Expert CrossCheck request on aircraft ${registration}.\n\nVisit the GCR report to review and accept the bid.\n\n— ABOS MarketSpace`,
      });
      return Response.json({ sent: true });
    }

    if (type === 'completed') {
      if (!requester_email) return Response.json({ error: 'requester_email required' }, { status: 400 });
      const verdictText = verdict === 'confirmed' ? 'CONFIRMED — the expert verified the GCR report findings' : 'DISPUTED — the expert identified discrepancies';
      await base44.integrations.Core.SendEmail({
        to: requester_email,
        subject: `Expert CrossCheck Completed: ${registration}`,
        body: `Hello,\n\nYour Expert CrossCheck for aircraft ${registration} has been completed by ${expert_name}.\n\nVerdict: ${verdictText}\n\nExpert Comment: ${expert_comment || 'N/A'}\n\nVisit the GCR report to view the full result.\n\n— ABOS MarketSpace`,
      });
      return Response.json({ sent: true });
    }

    return Response.json({ error: 'Invalid notification type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});