import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CMR Matching Engine — pairs a buyer lead with best matching aircraft.
 * Match Score = Type 30% + Budget 25% + ATI Risk 20% + Avionics 15% + Geo 10%
 * Body: { leadId, maxResults? (default 5) }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId, maxResults = 5 } = await req.json().catch(() => ({}));
    if (!leadId) return Response.json({ error: 'leadId required' }, { status: 400 });

    const lead = await base44.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Pull active listings
    const listings = await base44.asServiceRole.entities.AircraftListing.filter(
      { status: 'active' }, '-ati_score', 200
    );

    if (listings.length === 0) return Response.json({ ok: true, matches: [], message: 'No active listings to match' });

    // Parse budget from lead (e.g. "$100k-$200k", "150000", "under 200k")
    const budgetText = (lead.budget || '').replace(/[,$]/g, '').toLowerCase();
    const budgetNums = budgetText.match(/\d+k?/g)?.map(n => n.endsWith('k') ? parseFloat(n) * 1000 : parseFloat(n)) || [];
    const budgetLow = budgetNums[0] || 0;
    const budgetHigh = budgetNums[1] || budgetNums[0] * 1.3 || 500000;

    // Compress listings to a token-efficient format
    const compressedListings = listings.slice(0, 80).map(l => ({
      id: l.id,
      label: `${l.year || '?'} ${l.make || ''} ${l.model || ''}`.trim(),
      reg: l.registration || '—',
      price: l.asking_price || 0,
      ati: l.ati_score || 0,
      deal: l.deal_label || '—',
      avionics: (l.avionics || '').slice(0, 60),
      discount_pct: l.discount_pct || 0,
    }));

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the ABOS CMR Matching Engine. Find the best aircraft matches for this buyer.

BUYER PROFILE:
- Name: ${lead.name || '—'}
- Aircraft interest: ${lead.aircraft_preference || 'not specified'}
- Budget: ${lead.budget || 'not specified'} (parsed: $${budgetLow.toLocaleString()}–$${budgetHigh.toLocaleString()})
- Notes: ${lead.notes?.slice(0, 200) || '—'}

AVAILABLE AIRCRAFT (${compressedListings.length} listings):
${JSON.stringify(compressedListings, null, 2)}

MATCH SCORE FORMULA (0–100):
- Type match (0/50/100) × 0.30 — does it match buyer's stated preference?
- Budget fit × 0.25 — 100 if under budget, 60 if ≤10% over, 20 if >20% over
- ATI risk score × 0.20 — ATI 80+ = 100pts, 60-79 = 70pts, <60 = 30pts
- Avionics match × 0.15 — does avionics list match typical buyer needs?
- Deal value × 0.10 — hot deal = 100, good deal = 75, fair = 50, overpriced = 20

Return the top ${maxResults} matches as JSON:
{
  "matches": [
    {
      "listing_id": "...",
      "aircraft": "year make model reg",
      "match_score": 0-100,
      "budget_fit": "Under Budget" | "At Budget" | "Stretch" | "Over Budget",
      "strengths": ["strength1", "strength2"],
      "risks": ["risk1"],
      "recommended_action": "specific next step"
    }
  ],
  "summary": "1-2 sentence overview of best opportunities"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                listing_id: { type: 'string' },
                aircraft: { type: 'string' },
                match_score: { type: 'number' },
                budget_fit: { type: 'string' },
                strengths: { type: 'array', items: { type: 'string' } },
                risks: { type: 'array', items: { type: 'string' } },
                recommended_action: { type: 'string' },
              },
            },
          },
          summary: { type: 'string' },
        },
      },
    });

    // Enrich matches with full listing data
    const enriched = (result.matches || []).map(m => {
      const listing = listings.find(l => l.id === m.listing_id);
      return {
        ...m,
        listing: listing ? {
          id: listing.id,
          year: listing.year,
          make: listing.make,
          model: listing.model,
          registration: listing.registration,
          asking_price: listing.asking_price,
          ati_score: listing.ati_score,
          deal_label: listing.deal_label,
          discount_pct: listing.discount_pct,
          omvm_value: listing.omvm_value,
        } : null,
      };
    });

    return Response.json({
      ok: true,
      lead_id: leadId,
      buyer: lead.name,
      matches: enriched,
      summary: result.summary,
      listings_evaluated: compressedListings.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});