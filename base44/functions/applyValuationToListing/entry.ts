import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Finalizes an accepted ExpertValuation:
 *  - persists the ATI score + OMVM value + summary onto the linked AircraftListing
 *  - emails the listing owner a summary of the valuation
 *
 * Invoked by the "Expert Valuation Submitted — Score & Notify Owner" workflow
 * after atiFullReportScore has produced an 8-dimension report.
 *
 * Input: { valuation_id, ati_total?, score_label?, summary?, omvm_high? }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { valuation_id, ati_total, score_label, summary, omvm_high } = await req.json().catch(() => ({}));
    if (!valuation_id) return Response.json({ error: 'valuation_id required' }, { status: 400 });

    const valuation = await base44.asServiceRole.entities.ExpertValuation.get(valuation_id);
    if (!valuation) return Response.json({ error: 'Valuation not found' }, { status: 404 });
    if (valuation.status !== 'accepted') {
      return Response.json({ ok: true, skipped: true, reason: `valuation status is ${valuation.status}` });
    }

    const listingId = valuation.listing;
    if (!listingId) return Response.json({ ok: true, skipped: true, reason: 'no linked listing' });

    const listing = await base44.asServiceRole.entities.AircraftListing.get(listingId);
    if (!listing) return Response.json({ ok: true, skipped: true, reason: 'listing not found' });

    // ── Update the listing's score fields from the expert valuation + ATI report ──
    const update = {};
    if (Number.isFinite(Number(ati_total))) update.ati_score = Math.round(Number(ati_total));

    const expertOmvm = Number.isFinite(Number(valuation.expert_omvm)) ? Number(valuation.expert_omvm) : null;
    const reportHigh = Number.isFinite(Number(omvm_high)) ? Number(omvm_high) : null;
    const omvmValue = expertOmvm ?? reportHigh;
    if (omvmValue != null) update.omvm_value = omvmValue;

    if (typeof summary === 'string' && summary.trim()) update.ai_summary = summary.slice(0, 1000);

    if (score_label) {
      // Map the ATI report label onto the listing's deal_label vocabulary.
      const labelMap = {
        EXCEPTIONAL: 'hot deal',
        'STRONG BUY': 'good deal',
        FAIR: 'fair',
        CAUTION: 'fair',
        'RED FLAGS': 'overpriced',
        AVOID: 'overpriced',
      };
      if (labelMap[score_label]) update.deal_label = labelMap[score_label];
    }

    await base44.asServiceRole.entities.AircraftListing.update(listingId, update);

    // ── Email the owner a summary ──
    let ownerEmail = null;
    const ownerId = listing.owner || listing.created_by_id;
    if (ownerId) {
      try {
        const owner = await base44.asServiceRole.entities.User.get(ownerId);
        ownerEmail = owner?.email || null;
      } catch (_) { /* fall through */ }
    }

    let emailSent = false;
    if (ownerEmail) {
      const aircraftLabel = valuation.aircraft_label
        || `${listing.year || ''} ${listing.make || ''} ${listing.model || ''} ${listing.registration || ''}`.trim()
        || 'your aircraft';

      const omvmStr = expertOmvm != null ? `$${expertOmvm.toLocaleString()}` : 'N/A';
      const deltaStr = valuation.delta_pct != null ? `${valuation.delta_pct}%` : 'N/A';
      const atiStr = Number.isFinite(Number(ati_total)) ? `${Math.round(Number(ati_total))}/120${score_label ? ` (${score_label})` : ''}` : 'N/A';

      const body = [
        'Hello,',
        '',
        'An expert valuation has been submitted for your aircraft listing on ABOS MarketSpace.',
        '',
        `Aircraft: ${aircraftLabel}`,
        `Expert-adjusted value: ${omvmStr}`,
        `Delta vs model: ${deltaStr}`,
        `ATI Score: ${atiStr}`,
        '',
        'Expert rationale:',
        valuation.rationale || 'N/A',
        '',
        summary ? `Summary: ${summary}` : '',
        '',
        'Visit ABOS MarketSpace to view the full report.',
        '',
        '— ABOS MarketSpace',
      ].filter(Boolean).join('\n');

      try {
        await base44.integrations.Core.SendEmail({
          to: ownerEmail,
          subject: `Expert Valuation Submitted: ${aircraftLabel}`,
          body,
        });
        emailSent = true;
      } catch (e) {
        return Response.json({ ok: true, listing_updated: true, email_sent: false, email_error: e.message });
      }
    }

    return Response.json({ ok: true, listing_updated: true, email_sent: emailSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});