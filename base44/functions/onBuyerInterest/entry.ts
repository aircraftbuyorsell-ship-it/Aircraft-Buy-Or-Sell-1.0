import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Phase 1.5 · 1.5.3 — Closes the notification loop for buyer-interest leads.
 *
 * Triggered by an entity automation when a Lead with source="buyer_interest"
 * is created (i.e. a buyer clicked "I'm Interested" on a listing).
 *
 * What it does:
 *   1. Fetches the lead + linked listing.
 *   2. Emails every admin/super_admin user with the buyer's details and the
 *      aircraft info so a broker can follow up immediately.
 *   3. Logs a LeadEvent (lead_created) for the attribution/audit trail.
 *
 * Scoring is handled separately by the existing "Lead Auto-Score (CMR)"
 * automation (cmrLeadScore), so this function does not duplicate that work.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const leadId = body.event?.entity_id || body.leadId || body.data?.id;
    if (!leadId) return Response.json({ error: 'leadId required' }, { status: 400 });

    // Fetch the lead (service role — entity automation has no user context)
    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Only handle buyer-interest leads — admin manual leads don't need broker notification
    if ((lead.source || '') !== 'buyer_interest') {
      return Response.json({ skipped: 'not a buyer_interest lead' });
    }

    // Fetch linked listing for context
    let listing = null;
    if (lead.listing) {
      listing = await base44.asServiceRole.entities.AircraftListing.get(lead.listing).catch(() => null);
    }

    // Gather all admin / super_admin users to notify
    const users = await base44.asServiceRole.entities.User.list('-created_date', 50);
    const adminEmails = users
      .filter(u => u.role === 'admin' || u.role === 'super_admin')
      .map(u => u.email)
      .filter(Boolean);

    if (adminEmails.length === 0) {
      return Response.json({ skipped: 'no admins to notify' });
    }

    const aircraftLabel = listing
      ? `${listing.year || ''} ${listing.make || ''} ${listing.model || ''} · ${listing.registration || ''}`.trim()
      : (lead.listing_label || lead.aircraft_preference || 'Aircraft not specified');

    const priceLine = listing?.asking_price != null ? `Asking price: $${listing.asking_price.toLocaleString()}\n` : '';
    const atiLine = listing?.ati_score ? `ATI Score: ${listing.ati_score}/120\n` : '';
    const dealLine = listing?.deal_label ? `Deal label: ${listing.deal_label}\n` : '';

    const emailBody = `A new buyer has expressed interest in an aircraft on ABOS.

BUYER DETAILS:
  Name:   ${lead.name || '—'}
  Email:  ${lead.email || '—'}
  Phone:  ${lead.phone || '—'}
  Budget: ${lead.budget || 'Not specified'}

AIRCRAFT:
  ${aircraftLabel}
${priceLine}${atiLine}${dealLine}
BUYER MESSAGE:
${lead.notes || '—'}

---
This lead was submitted via the "I'm Interested" button on the listing.
View and manage this lead in the ABOS Leads inbox.

— ABOS MarketSpace`;

    let notifsSent = 0;
    for (const email of adminEmails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `[ABOS] New buyer interest — ${aircraftLabel}`,
          body: emailBody,
          from_name: 'ABOS Lead Notifications',
        });
        notifsSent++;
      } catch (_) { /* non-critical — continue to next admin */ }
    }

    // Log a LeadEvent for the attribution / audit trail
    try {
      await base44.asServiceRole.entities.LeadEvent.create({
        event_type: 'lead_created',
        actor_email: lead.email || null,
        metadata: {
          lead_id: leadId,
          listing_id: lead.listing || null,
          aircraft: aircraftLabel,
          source: lead.source,
          notifications_sent: notifsSent,
        },
      });
    } catch (_) { /* non-critical */ }

    return Response.json({ ok: true, lead_id: leadId, notifications_sent: notifsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});