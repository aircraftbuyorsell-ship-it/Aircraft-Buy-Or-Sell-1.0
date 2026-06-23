import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId } = await req.json().catch(() => ({}));
    if (!listingId) return Response.json({ error: 'listingId required' }, { status: 400 });

    // Fetch listing
    const listing = await base44.entities.AircraftListing.get(listingId);
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

    // Fetch ATI passport if exists
    let atiPassport = null;
    try {
      const passports = await base44.entities.ATIPassport.filter({ listing: listingId }, '-created_date', 1);
      atiPassport = passports[0] || null;
    } catch (_) {}

    // Fetch comparable listings (same make/model)
    let comparables = [];
    try {
      comparables = await base44.entities.AircraftListing.filter(
        { make: listing.make, model: listing.model, status: 'active', visibility: 'public' },
        '-created_date',
        10
      );
    } catch (_) {}

    const context = {
      aircraft: {
        registration: listing.registration,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        total_time: listing.total_time,
        engine_hours: listing.engine_hours,
        tbo: listing.tbo,
        last_annual: listing.last_annual,
        avionics: listing.avionics,
        asking_price: listing.asking_price,
        currency: listing.currency,
        ati_score: listing.ati_score,
        omvm_value: listing.omvm_value,
        deal_score: listing.deal_score,
        deal_label: listing.deal_label,
        discount_pct: listing.discount_pct,
      },
      ati_passport: atiPassport ? {
        ati_total: atiPassport.ati_total,
        score_label: atiPassport.score_label,
        ai_summary: atiPassport.ai_summary,
        strengths: atiPassport.strengths,
        risks: atiPassport.risks,
        recommendations: atiPassport.recommendations,
        deal_radar_eligible: atiPassport.deal_radar_eligible,
        co_ownership_viable: atiPassport.co_ownership_viable,
        omvm_value: atiPassport.omvm_value,
        deal_score: atiPassport.deal_score,
        deal_label: atiPassport.deal_label,
        discount_pct: atiPassport.discount_pct,
      } : null,
      comparables: comparables.filter(c => c.id !== listingId).slice(0, 5).map(c => ({
        year: c.year,
        total_time: c.total_time,
        engine_hours: c.engine_hours,
        asking_price: c.asking_price,
        ati_score: c.ati_score,
      })),
    };

    const apiKey = Deno.env.get('12byteflow_key') || Deno.env.get('SAKANA_12byteflow_API_KEY');
    if (!apiKey) return Response.json({ error: 'Sakana API key not configured' }, { status: 500 });

    const prompt = `You are an expert aviation deal analyst. Analyze the following aircraft listing data and produce a comprehensive deal intelligence brief.

Aircraft & Market Data:
${JSON.stringify(context, null, 2)}

Produce a JSON response with EXACTLY this structure:
{
  "executive_summary": "2-3 sentence overview of the deal opportunity",
  "deal_verdict": "one of: STRONG BUY, GOOD DEAL, FAIR, OVERPRICED, AVOID",
  "price_analysis": {
    "assessment": "Is the asking price fair, below, or above market? Be specific.",
    "omvm_comparison": "Comparison vs OMVM value if available, otherwise null",
    "comparable_context": "How it compares to similar listings"
  },
  "strengths": ["3-5 key strengths"],
  "red_flags": ["0-5 concerns or risks"],
  "negotiation_strategy": {
    "recommended_approach": "How to approach the seller",
    "talking_points": ["3-5 specific negotiation points"],
    "target_price": "Suggested target price (number) or null"
  },
  "next_steps": ["3-5 recommended actions in priority order"],
  "risk_assessment": {
    "level": "LOW, MEDIUM, or HIGH",
    "explanation": "Brief explanation of risk level"
  }
}

Be specific, data-driven, and professional. Use the ATI score, OMVM value, and comparable data to support your analysis. If data is missing, note it.`;

    const fuguRes = await fetch('https://api.sakana.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'fugu',
        messages: [
          { role: 'system', content: 'You are an expert aviation deal analyst. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!fuguRes.ok) {
      const errText = await fuguRes.text();
      return Response.json({ error: `Fugu API error (${fuguRes.status}): ${errText}` }, { status: 502 });
    }

    const fuguData = await fuguRes.json();
    const content = fuguData.choices?.[0]?.message?.content;

    let brief;
    try {
      brief = JSON.parse(content);
    } catch (_) {
      return Response.json({ error: 'Failed to parse Fugu response', raw: content }, { status: 500 });
    }

    return Response.json({
      listing: { id: listing.id, registration: listing.registration, make: listing.make, model: listing.model, year: listing.year },
      brief,
      model: fuguData.model || 'fugu',
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});