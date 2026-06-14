import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Skill-Based Expert Valuation — replaces mathematical OMVM with LLM-driven market appraisal.
 * Uses Claude/GPT as an aviation appraiser, factoring in:
 *   - Comparable market data from ABOS listings
 *   - Current aviation market conditions
 *   - Aircraft-specific condition, avionics, and maintenance history
 * Body: { listingId }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { listingId } = body;
    if (!listingId) return Response.json({ error: 'listingId required' }, { status: 400 });

    const listing = await base44.entities.AircraftListing.get(listingId);
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

    // Fetch comparable listings — same make, recent years
    const comps = await base44.asServiceRole.entities.AircraftListing.filter(
      { make: listing.make, status: 'active' },
      '-created_date',
      200
    );

    const modelPrefix = (listing.model || '').replace(/[A-Z]+$/, '').trim();
    const compSummary = comps
      .filter(c => {
        const cp = (c.model || '').replace(/[A-Z]+$/, '').trim();
        return cp === modelPrefix && c.id !== listingId && c.asking_price > 5000;
      })
      .slice(0, 40)
      .map(c => ({
        year: c.year,
        model: c.model,
        price: c.asking_price,
        tt: c.total_time,
        smoh: c.engine_hours,
        avionics: c.avionics,
        registration: c.registration,
      }));

    // Fetch recent market reports for context
    const reports = await base44.asServiceRole.entities.MarketReport.filter(
      {},
      '-created_date',
      10
    );
    const marketContext = reports.slice(0, 3).map(r => ({
      date: r.created_date,
      sentiment: r.overall_sentiment,
      summary: r.executive_summary?.slice(0, 800),
    }));

    // Invoke LLM as expert aviation appraiser
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior aviation appraiser with 25+ years experience valuing general aviation aircraft for banks, insurance companies, and private buyers.

═════ TASK ═════
Produce a professional market valuation for this specific aircraft based on:
1. The aircraft's specs, condition, maintenance history, and equipment
2. Comparable market data from active ABOS listings for this make/model
3. Current market sentiment and macroeconomic signals

═════ AIRCRAFT TO VALUE ═════
Make/Model: ${listing.make} ${listing.model}
Year: ${listing.year || 'Unknown'}
Registration: ${listing.registration || 'Unknown'}
Total Time: ${listing.total_time ? listing.total_time + ' hrs' : 'Unknown'}
Engine SMOH: ${listing.engine_hours ? listing.engine_hours + ' hrs' : 'Unknown'}
TBO: ${listing.tbo ? listing.tbo + ' hrs' : 'Unknown'}
Avionics: ${listing.avionics || 'Standard'}
Asking Price: ${listing.asking_price ? '$' + listing.asking_price.toLocaleString() : 'Not disclosed'}
Last Annual: ${listing.last_annual || 'Unknown'}
${listing.ai_summary ? 'Notes: ' + listing.ai_summary : ''}

═════ COMPARABLE LISTINGS (${compSummary.length} active) ═════
${compSummary.slice(0, 20).map(c => `- ${c.year || '?'} ${c.model}: $${c.price?.toLocaleString() || 'N/A'}, TT: ${c.tt || '?'}hrs, SMOH: ${c.smoh || '?'}hrs`).join('\n')}

═════ MARKET CONTEXT ═════
${marketContext.map(m => `[${m.date?.slice(0, 10)}] Sentiment: ${m.sentiment}. ${m.summary || ''}`).join('\n')}

═════ VALUATION RULES ═════
- Base your estimate primarily on comparable listings adjusted for TT, SMOH, avionics, and condition differences
- For aircraft with <3 comps: use make-wide median + age depreciation curve as fallback
- Vintage/classic aircraft (pre-1975): factor in collector premium if condition is good
- Be conservative — buyers pay for verified maintenance, penalize missing logs
- NEVER output an estimate >40% above the highest comparable or <50% of the lowest comparable
- If data is insufficient, state low confidence and explain why

Return ONLY this JSON:
{
  "market_estimate": number (USD, round to nearest $500),
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "valuation_rationale": "2-4 sentence expert assessment explaining the valuation logic",
  "key_comparables": ["brief notes on 2-3 most relevant comps"],
  "adjustments": ["list of adjustments made (+/-) from comps base"],
  "risk_factors": ["any risks that could affect value"],
  "price_band": { "low": number, "high": number },
  "deal_assessment": {
    "verdict": "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET" | "UNCLEAR",
    "comment": "1 sentence deal quality summary"
  }
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          market_estimate: { type: 'number' },
          confidence: { type: 'string' },
          valuation_rationale: { type: 'string' },
          key_comparables: { type: 'array', items: { type: 'string' } },
          adjustments: { type: 'array', items: { type: 'string' } },
          risk_factors: { type: 'array', items: { type: 'string' } },
          price_band: {
            type: 'object',
            properties: {
              low: { type: 'number' },
              high: { type: 'number' },
            },
          },
          deal_assessment: {
            type: 'object',
            properties: {
              verdict: { type: 'string' },
              comment: { type: 'string' },
            },
          },
        },
      },
    });

    // Calculate discount/overpayment vs asking price
    const askingPrice = listing.asking_price;
    const marketEstimate = result.market_estimate;
    const discountPct = askingPrice && marketEstimate > 0
      ? Math.round(((marketEstimate - askingPrice) / marketEstimate) * 1000) / 10
      : null;

    const dealScore = discountPct == null ? null
      : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
      : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;

    const dealLabel = dealScore == null ? null
      : dealScore >= 8.5 ? 'hot deal' : dealScore >= 6.5 ? 'good deal'
      : dealScore >= 5 ? 'fair' : 'overpriced';

    // Override LLM verdict with calculated assessment for consistency
    const calculatedVerdict = discountPct == null ? 'UNCLEAR'
      : discountPct >= 8 ? 'BELOW_MARKET' : discountPct <= -8 ? 'ABOVE_MARKET' : 'AT_MARKET';

    result.deal_assessment = {
      ...(result.deal_assessment || {}),
      verdict: calculatedVerdict,
    };

    // Persist to listing
    await base44.entities.AircraftListing.update(listingId, {
      omvm_value: marketEstimate,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
    });

    return Response.json({
      ok: true,
      market_estimate: marketEstimate,
      confidence: result.confidence,
      valuation_rationale: result.valuation_rationale,
      key_comparables: result.key_comparables,
      adjustments: result.adjustments,
      risk_factors: result.risk_factors,
      price_band: result.price_band,
      deal_assessment: result.deal_assessment,
      discount_pct: discountPct,
      deal_score: dealScore,
      deal_label: dealLabel,
      comp_count: compSummary.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});