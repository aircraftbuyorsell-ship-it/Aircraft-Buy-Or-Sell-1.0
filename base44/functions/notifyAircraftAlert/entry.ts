// Triggered by entity automation on AircraftListing create
// Finds active AircraftAlerts matching the new listing and sends email notifications.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function ciIncludes(haystack: string | undefined, needle: string | undefined): boolean {
  if (!needle) return true;
  return (haystack || '').toLowerCase().includes(needle.toLowerCase());
}

function isGoodDeal(listing: any): boolean {
  if (listing.deal_label === 'hot deal' || listing.deal_label === 'good deal') return true;
  if (typeof listing.discount_pct === 'number' && listing.discount_pct > 0) return true;
  if (typeof listing.deal_score === 'number' && listing.deal_score >= 6.5) return true;
  return false;
}

function alertMatches(alert: any, listing: any): boolean {
  if (!ciIncludes(listing.make, alert.make)) return false;
  if (!ciIncludes(listing.model, alert.model)) return false;
  if (alert.year_min != null && (listing.year == null || listing.year < alert.year_min)) return false;
  if (alert.year_max != null && (listing.year == null || listing.year > alert.year_max)) return false;
  if (alert.max_price != null && (listing.asking_price == null || listing.asking_price > alert.max_price)) return false;
  if (alert.min_ati != null && (listing.ati_score == null || listing.ati_score < alert.min_ati)) return false;
  if (alert.deal_only && !isGoodDeal(listing)) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Allow platform-triggered automations (event present) or admin manual calls.
    const user = await base44.auth.me().catch(() => null);
    const isAutomation = !!body?.event;
    if (!isAutomation && (!user || user.role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole;
    let listing = body?.data || null;
    const listingId = body?.event?.entity_id || listing?.id;
    if (!listing && listingId) {
      const found = await sr.entities.AircraftListing.filter({ id: listingId }, '', 1);
      if (found[0]) listing = found[0];
    }
    if (!listing) return Response.json({ skipped: 'no listing data' });

    // Only notify for active public listings
    if (listing.status && listing.status !== 'active') return Response.json({ skipped: 'listing not active' });
    if (listing.visibility && listing.visibility !== 'public') return Response.json({ skipped: 'listing not public' });

    const alerts = await sr.entities.AircraftAlert.filter({ active: true }, '', 200);
    if (!alerts.length) return Response.json({ skipped: 'no active alerts' });

    const now = new Date().toISOString();
    let notifsSent = 0;
    const matched: any[] = [];

    for (const alert of alerts) {
      if (!alertMatches(alert, listing)) continue;
      // Throttle per alert: don't notify more than once per 10 minutes
      if (alert.last_matched_at) {
        const ago = Date.now() - new Date(alert.last_matched_at).getTime();
        if (ago < 10 * 60 * 1000) continue;
      }

      const channel = alert.channel || 'email';
      if (channel === 'email' || channel === 'in_app') {
        const subject = `[ABOS Alert] "${alert.name}" — New match: ${listing.year || ''} ${listing.make} ${listing.model}`.trim();
        const price = listing.asking_price
          ? `$${listing.asking_price.toLocaleString()} ${listing.currency || 'USD'}`
          : '—';
        const deal = isGoodDeal(listing)
          ? `Good deal (${listing.deal_label || `${Math.round(listing.discount_pct)}% vs OMVM`})`
          : '';
        const body_text =
          `Your ABOS Aircraft Alert "${alert.name}" matched a new listing.\n\n` +
          `Aircraft: ${listing.year || ''} ${listing.make || ''} ${listing.model || ''}\n`.trim() + '\n' +
          `Registration: ${listing.registration || '—'}\n` +
          `Asking price: ${price}\n` +
          (deal ? `Deal: ${deal}\n` : '') +
          (listing.ati_score != null ? `ATI score: ${listing.ati_score}\n` : '') +
          `\nView listing: ${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/listings\n\n— ABOS Platform`;

        try {
          await sr.integrations.Core.SendEmail({
            to: alert.user_email,
            subject,
            body: body_text,
            from_name: 'ABOS Aircraft Alerts',
          });
        } catch (e) {
          console.warn('AircraftAlert email failed:', e.message);
        }
      }

      matched.push(alert);
      notifsSent++;
    }

    // Update matched alert stats
    for (const alert of matched) {
      await sr.entities.AircraftAlert.update(alert.id, {
        last_matched_at: now,
        matches_count: (alert.matches_count || 0) + 1,
      });
    }

    return Response.json({
      ok: true,
      alerts_checked: alerts.length,
      notifications_sent: notifsSent,
      listing_id: listingId,
    });
  } catch (error) {
    console.error('notifyAircraftAlert error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});