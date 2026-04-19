// Entity automation handler — fires on AircraftListing create.
// Matches the new listing against every active Lead's aircraft_preference + budget,
// then emails each matching lead a notification.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Parse "100K-300K" / "<500K" / ">1M" / "100000-300000" into { min, max } in USD
function parseBudgetRange(raw) {
  if (!raw) return { min: 0, max: Infinity };
  const s = String(raw).toUpperCase().replace(/[\s,$]/g, "");
  const toNum = (t) => {
    if (!t) return null;
    let n = parseFloat(t);
    if (isNaN(n)) return null;
    if (/M$/.test(t)) n *= 1_000_000;
    else if (/K$/.test(t)) n *= 1_000;
    return n;
  };
  if (s.startsWith("<")) return { min: 0, max: toNum(s.slice(1)) ?? Infinity };
  if (s.startsWith(">")) return { min: toNum(s.slice(1)) ?? 0, max: Infinity };
  const parts = s.split("-");
  if (parts.length === 2) {
    return { min: toNum(parts[0]) ?? 0, max: toNum(parts[1]) ?? Infinity };
  }
  const single = toNum(s);
  return single ? { min: 0, max: single } : { min: 0, max: Infinity };
}

// "Cessna 152/172/182/206" → ["cessna 152","cessna 172","cessna 182","cessna 206","cessna","152","172","182","206"]
function prefTokens(pref) {
  if (!pref) return [];
  const lower = String(pref).toLowerCase();
  const tokens = new Set();
  // slash-separated models sharing a make prefix (e.g. Cessna 152/172/182)
  const slashMatch = lower.match(/^([a-z\s]+?)\s+([\d\w]+(?:\/[\d\w]+)+)/);
  if (slashMatch) {
    const make = slashMatch[1].trim();
    tokens.add(make);
    slashMatch[2].split("/").forEach(m => {
      tokens.add(m.trim());
      tokens.add(`${make} ${m.trim()}`);
    });
  }
  // Also tokenize each word & the whole string
  lower.split(/[\s,/]+/).filter(Boolean).forEach(w => tokens.add(w));
  tokens.add(lower.trim());
  return [...tokens].filter(t => t && t.length >= 2);
}

function matchesPreference(listing, lead) {
  const tokens = prefTokens(lead.aircraft_preference);
  if (!tokens.length) return true; // no preference → match anything
  const hay = `${listing.make || ""} ${listing.model || ""} ${listing.year || ""}`.toLowerCase();
  return tokens.some(tok => hay.includes(tok));
}

function matchesBudget(listing, lead) {
  if (!lead.budget) return true;
  if (listing.asking_price == null) return true; // don't exclude if price unknown
  const { min, max } = parseBudgetRange(lead.budget);
  return listing.asking_price >= min && listing.asking_price <= max;
}

function emailBody(listing, lead) {
  const title = `${listing.year ? listing.year + " " : ""}${listing.make || ""} ${listing.model || ""}`.trim();
  const price = listing.asking_price ? `$${Number(listing.asking_price).toLocaleString()}` : "Price on request";
  const dealLabel = listing.deal_label ? ` · ${listing.deal_label.toUpperCase()}` : "";
  const ati = listing.ati_score ? ` · ATI ${listing.ati_score}/120` : "";
  return `Hi ${lead.name || "there"},

A new aircraft just hit the ABOS marketplace and it matches your search:

  ${title}${listing.registration ? " · " + listing.registration : ""}
  ${price}${dealLabel}${ati}
  ${listing.total_time ? listing.total_time.toLocaleString() + " TT" : ""}${listing.engine_hours ? " · " + listing.engine_hours.toLocaleString() + " SMOH" : ""}
  ${listing.avionics ? "Avionics: " + listing.avionics : ""}

Review the full ATI Passport and valuation inside ABOS before this one moves.

— ABOS IntraZone
Aviation Transparency Platform`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Only act on create events
    if (payload?.event?.type !== "create") {
      return Response.json({ skipped: "not a create event" });
    }

    let listing = payload.data;
    if (!listing && payload?.event?.entity_id) {
      listing = await base44.asServiceRole.entities.AircraftListing.get(payload.event.entity_id);
    }
    if (!listing) return Response.json({ error: "no listing data" }, { status: 400 });

    // Only notify on public active listings
    if (listing.status && listing.status !== "active") {
      return Response.json({ skipped: "listing not active" });
    }
    if (listing.visibility && listing.visibility !== "public") {
      return Response.json({ skipped: "listing not public" });
    }

    // Fetch active leads (not closed/lost)
    const allLeads = await base44.asServiceRole.entities.Lead.list("-created_date", 500);
    const activeLeads = allLeads.filter(l => !["closed", "lost"].includes(l.status));

    const matched = activeLeads.filter(l => matchesPreference(listing, l) && matchesBudget(listing, l));

    const title = `${listing.year ? listing.year + " " : ""}${listing.make || ""} ${listing.model || ""}`.trim();
    const subject = `New match: ${title}${listing.asking_price ? " · $" + Number(listing.asking_price).toLocaleString() : ""}`;

    const results = [];
    for (const lead of matched) {
      if (!lead.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: "ABOS IntraZone",
          to: lead.email,
          subject,
          body: emailBody(listing, lead),
        });
        results.push({ lead_id: lead.id, email: lead.email, sent: true });
      } catch (err) {
        results.push({ lead_id: lead.id, email: lead.email, sent: false, error: err.message });
      }
    }

    return Response.json({
      listing_id: listing.id,
      leads_scanned: activeLeads.length,
      leads_matched: matched.length,
      emails_sent: results.filter(r => r.sent).length,
      results,
    });
  } catch (error) {
    console.error("notifyLeadsOnNewListing error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});