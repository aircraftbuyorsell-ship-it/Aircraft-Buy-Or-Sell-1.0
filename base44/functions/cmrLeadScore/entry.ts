import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CMR Lead Engine — scores a lead 0–100 (HOT/WARM/COLD) with next action.
 * Body: { leadId } — can also be called by entity automation with event payload.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));

    // Support both direct call (leadId) and entity automation payload (event.entity_id)
    const leadId = body.leadId || body.event?.entity_id || body.data?.id;
    if (!leadId) return Response.json({ error: 'leadId required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Fetch linked listing + its ATI passport if any
    let listingContext = '';
    if (lead.listing) {
      const listing = await base44.asServiceRole.entities.AircraftListing.get(lead.listing).catch(() => null);
      if (listing) {
        listingContext = `\nLinked aircraft: ${listing.year || ''} ${listing.make || ''} ${listing.model || ''} | ATI: ${listing.ati_score || 'unscored'} | Price: $${listing.asking_price?.toLocaleString() || '?'} | Deal: ${listing.deal_label || '—'}`;
      }
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the ABOS CMR Lead Scoring Engine. Score this aviation lead 0–100.

Lead data:
- Name: ${lead.name || '—'}
- Source: ${lead.source || 'unknown'}
- Aircraft interest: ${lead.aircraft_preference || '—'}
- Budget: ${lead.budget || '—'}
- Status: ${lead.status || 'new'}
- Notes: ${lead.notes || '—'}
- Rules agreed: ${lead.rules_agreed ? 'yes' : 'no'}
${listingContext}

Scoring factors:
- Source quality: direct/referral=high, group=medium, cold=low
- Budget stated and realistic: +20
- Specific aircraft preference: +15
- Rules agreed: +10
- Complete contact info: +10
- Notes with timeline/urgency signals: +15
- Status=qualified/negotiating: +20

Return ONLY JSON:
{
  "score": 0-100 integer,
  "tier": "HOT" | "WARM" | "COLD",
  "rationale": "2 sentence explanation",
  "next_action": "specific next step for this lead",
  "signals": ["signal1", "signal2"]
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          tier: { type: 'string' },
          rationale: { type: 'string' },
          next_action: { type: 'string' },
          signals: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Persist score signals back to lead notes (append)
    const scoreNote = `[CMR Score: ${result.score}/100 · ${result.tier}] ${result.rationale} → ${result.next_action}`;
    const updatedNotes = lead.notes
      ? `${lead.notes}\n\n${scoreNote}`
      : scoreNote;

    await base44.asServiceRole.entities.Lead.update(leadId, {
      notes: updatedNotes.slice(0, 2000),
    });

    return Response.json({
      ok: true,
      lead_id: leadId,
      score: result.score,
      tier: result.tier,
      rationale: result.rationale,
      next_action: result.next_action,
      signals: result.signals || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});