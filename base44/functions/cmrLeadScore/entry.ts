import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Deterministic CMR Lead scoring (0–100) when LLM is unavailable.
 */
function deterministicScore(lead, listing) {
  let score = 30; // baseline

  // Source quality (0–20)
  const source = (lead.source || '').toLowerCase();
  if (source.includes('referral') || source.includes('direct') || source.includes('partner')) score += 18;
  else if (source.includes('group') || source.includes('event') || source.includes('web')) score += 10;
  else score += 3;

  // Budget (0–20)
  if (lead.budget && lead.budget.trim().length > 3) score += 18;
  else if (lead.budget) score += 8;

  // Specific aircraft preference (0–15)
  if (lead.aircraft_preference && lead.aircraft_preference.trim().length > 5) score += 13;

  // Rules agreed (0–10)
  if (lead.rules_agreed) score += 10;

  // Contact info completeness (0–10)
  let contactScore = 0;
  if (lead.name && lead.name.trim().length > 0) contactScore += 3;
  if (lead.email && lead.email.includes('@')) contactScore += 4;
  if (lead.phone && lead.phone.trim().length > 5) contactScore += 3;
  score += contactScore;

  // Notes with signals (0–15)
  if (lead.notes) {
    const notes = lead.notes.toLowerCase();
    if (notes.length > 30) score += 5;
    if (/urgent|asap|immediate|ready|buy|purchase/i.test(notes)) score += 10;
    else if (/interested|looking|exploring|research/i.test(notes)) score += 5;
  }

  // Status boost (0–20)
  const statusMap = { qualified: 20, negotiating: 18, contacted: 10, new: 5 };
  score += statusMap[lead.status] || 0;

  // Listing boost (0–10)
  if (listing) {
    if (listing.ati_score >= 80) score += 8;
    else if (listing.ati_score > 0) score += 4;
    if (listing.deal_label === 'hot deal' || listing.deal_label === 'good deal') score += 2;
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  const tier = score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD';

  // Build signals
  const signals = [];
  if (lead.rules_agreed) signals.push('Rules agreed');
  if (lead.budget) signals.push('Budget stated');
  if (lead.aircraft_preference) signals.push('Aircraft preference');
  if (lead.phone) signals.push('Phone provided');
  if (lead.status === 'qualified' || lead.status === 'negotiating') signals.push('Advanced pipeline stage');
  if (lead.source?.toLowerCase().includes('referral')) signals.push('Referral source');
  if (listing?.ati_score >= 80) signals.push('High-ATI aircraft');

  const rationale = score >= 70
    ? `High-intent lead with ${signals.length} positive signals. Priority engagement recommended.`
    : score >= 40
      ? `Moderate lead with ${signals.length} qualifying signals. Nurture with relevant listings.`
      : `Low-urgency lead with ${signals.length} signals. Add to drip campaign.`;

  const nextAction = score >= 70
    ? 'Call within 24h. Send ATI report and OMVM valuation for matched aircraft.'
    : score >= 40
      ? 'Send curated listing matches via email. Follow up in 3 days.'
      : 'Add to monthly newsletter. Check back in 2 weeks.';

  return { score, tier, rationale, next_action: nextAction, signals };
}

/**
 * CMR Lead Engine — scores a lead 0–100 (HOT/WARM/COLD) with next action.
 * Uses LLM when available, falls back to deterministic scoring.
 * Body: { leadId } — can also be called by entity automation with event payload.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth validation
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Support both direct call (leadId) and entity automation payload (event.entity_id)
    const leadId = body.leadId || body.event?.entity_id || body.data?.id;
    if (!leadId) return Response.json({ error: 'leadId required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Fetch linked listing
    let listing = null;
    let listingContext = '';
    if (lead.listing) {
      listing = await base44.asServiceRole.entities.AircraftListing.get(lead.listing).catch(() => null);
      if (listing) {
        listingContext = `\nLinked aircraft: ${listing.year || ''} ${listing.make || ''} ${listing.model || ''} | ATI: ${listing.ati_score || 'unscored'} | Price: $${listing.asking_price?.toLocaleString() || '?'} | Deal: ${listing.deal_label || '—'}`;
      }
    }

    let result;

    // Try LLM first, fall back to deterministic if unavailable
    try {
      const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
          required: ['score', 'tier', 'rationale', 'next_action'],
        },
      });
      result = llmResult;
    } catch (_llmError) {
      // Fallback to deterministic scoring
      result = deterministicScore(lead, listing);
    }

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