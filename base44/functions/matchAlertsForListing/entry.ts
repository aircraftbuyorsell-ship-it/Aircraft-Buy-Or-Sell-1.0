// Entity automation handler: runs when a new AircraftListing is created.
// Finds matching active alerts and emails each owner.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function strMatch(field, needle) {
  if (!needle) return true;
  if (!field) return false;
  return String(field).toLowerCase().includes(String(needle).toLowerCase());
}

function matches(listing, alert) {
  if (listing.visibility && listing.visibility !== "public") return false;
  if (listing.status && listing.status !== "active") return false;
  if (!strMatch(listing.make, alert.make)) return false;
  if (!strMatch(listing.model, alert.model)) return false;
  if (alert.year_min != null && (listing.year == null || listing.year < alert.year_min)) return false;
  if (alert.year_max != null && (listing.year == null || listing.year > alert.year_max)) return false;
  if (alert.max_price != null && (listing.asking_price == null || listing.asking_price > alert.max_price)) return false;
  if (alert.min_ati != null && (listing.ati_score == null || listing.ati_score < alert.min_ati)) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const event = payload?.event;
    if (event?.type !== "create" || event?.entity_name !== "AircraftListing") {
      return Response.json({ skipped: true });
    }

    let listing = payload?.data;
    if (!listing && event?.entity_id) {
      listing = await base44.asServiceRole.entities.AircraftListing.get(event.entity_id);
    }
    if (!listing) return Response.json({ skipped: true, reason: "no listing data" });

    // Fetch all active alerts (service role — bypasses RLS)
    const alerts = await base44.asServiceRole.entities.AircraftAlert.filter({ active: true }, "-created_date", 500);

    const matched = alerts.filter(a => matches(listing, a));
    const nowISO = new Date().toISOString();
    const label = `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim();
    const price = listing.asking_price ? `$${Number(listing.asking_price).toLocaleString()}` : "—";
    const ati = listing.ati_score ?? "—";
    const reg = listing.registration || "—";

    const subject = `✈ New ABOS match: ${label}`;

    for (const alert of matched) {
      const body = `
Hi,

A new listing matches your alert "${alert.name}":

  • Aircraft: ${label}
  • Registration: ${reg}
  • Asking price: ${price}
  • ATI score: ${ati}

View the listing: ${Deno.env.get("APP_URL") || "https://app.base44.com"}/ati-passport/${listing.id}

You can manage or pause this alert at any time in ABOS → Alerts.

— The ABOS Team
      `.trim();

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: alert.user_email,
          subject,
          body,
        });
      } catch (e) {
        console.error("SendEmail failed for", alert.user_email, e.message);
      }

      // Update counters (non-blocking)
      try {
        await base44.asServiceRole.entities.AircraftAlert.update(alert.id, {
          matches_count: (alert.matches_count || 0) + 1,
          last_matched_at: nowISO,
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({
      success: true,
      matched: matched.length,
      total_alerts: alerts.length,
    });
  } catch (error) {
    console.error("matchAlertsForListing error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});