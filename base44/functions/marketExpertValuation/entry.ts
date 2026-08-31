import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * ATI Expert Valuation & Scoring — unified skill-based appraisal replacing OMVM.
 * Scores 8 dimensions (0-15 each, total 0-120), calculates market value,
 * and generates professional narrative for ATI Score Card reports.
 * Body: { listingId }
 */
const ATI_DIMENSIONS = [
  { key: "documentation",     label: "Documentation & Records",  desc: "Logbooks, AD compliance, W&B currency" },
  { key: "technical",         label: "Technical Condition",      desc: "Engine life, airframe, annual status" },
  { key: "transparency",      label: "Seller Transparency",      desc: "Photo quality, pre-buy, disclosure" },
  { key: "transaction_ready", label: "Transaction Readiness",    desc: "Title clarity, liens, registration" },
  { key: "usage_mission",     label: "Usage & Mission History",  desc: "Owners, private vs training vs charter" },
  { key: "storage_exposure",  label: "Storage & Exposure",       desc: "Hangared vs tie-down, climate zone" },
  { key: "config_clarity",    label: "Configuration Clarity",    desc: "Avionics, ADS-B, STC documentation" },
  { key: "market_readiness",  label: "Market Readiness",         desc: "Price vs market, DOM, seller motivation" },
];

const SCORE_LABELS = [
  [100, 120, "EXCEPTIONAL"],
  [85,  99,  "STRONG BUY"],
  [65,  84,  "FAIR"],
  [45,  64,  "CAUTION"],
  [20,  44,  "RED FLAGS"],
  [0,   19,  "AVOID"],
];

function scoreLabel(total) {
  for (const [lo, hi, label] of SCORE_LABELS) {
    if (total >= lo && total <= hi) return label;
  }
  return "AVOID";
}

function generateATICode(reg, score) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const cleanReg = (reg || "UNREG").replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return `ATI-${cleanReg}-${score}-${rand}`;
}

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

    // Fetch comparables
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
        year: c.year, model: c.model, price: c.asking_price,
        tt: c.total_time, smoh: c.engine_hours, avionics: c.avionics, registration: c.registration,
      }));

    // Fetch market context
    const reports = await base44.asServiceRole.entities.MarketReport.filter({}, '-created_date', 5);
    const marketContext = reports.slice(0, 2).map(r => ({
      date: r.created_date, sentiment: r.overall_sentiment,
      summary: r.executive_summary?.slice(0, 600),
    }));

    // Build dimension rubric text
    const rubricText = ATI_DIMENSIONS.map(d =>
      `**${d.label}** (${d.key}): ${d.desc}. Score 0-15. 13-15=excellent, 9-12=good, 5-8=average, 0-4=poor.`
    ).join('\n');

    // Invoke LLM as expert appraiser with full ATI rubric
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior aviation appraiser with 25+ years valuing GA aircraft. Produce a complete ATI Score Card with both valuation and 8-dimension scoring.

═══ AIRCRAFT ═══
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

═══ COMPARABLES (${compSummary.length}) ═══
${compSummary.slice(0, 25).map(c => `- ${c.year || '?'} ${c.model}: $${c.price?.toLocaleString() || '?'}, TT:${c.tt || '?'}hrs, SMOH:${c.smoh || '?'}hrs, Avionics:${c.avionics || 'stock'}`).join('\n')}

═══ MARKET ═══
${marketContext.map(m => `[${m.date?.slice(0,10)}] ${m.sentiment}: ${m.summary || ''}`).join('\n')}

═══ 8-DIMENSION SCORING RUBRIC ═══
${rubricText}

═══ RULES ═══
1. Score EACH of the 8 dimensions 0-15 based on available evidence. If data missing for a dimension, score 7 (average) and note what's missing.
2. Base market estimate on comparables adjusted for TT, SMOH, avionics, condition.
3. Be conservative — penalize missing logs, past-TBO engines, damaged history.
4. NEVER output estimate >40% above highest comp or <50% of lowest comp.
5. Write narrative in professional appraiser voice — specific, not generic.

Return ONLY this JSON:
{
  "market_estimate": number (USD, nearest $500),
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "valuation_rationale": "2-4 sentence expert valuation logic",
  "key_comparables": ["2-3 most relevant comp notes"],
  "adjustments": ["adjustments from comps base (+/-)"],

  "ati_dimensions": {
    "documentation": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "technical": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "transparency": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "transaction_ready": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "usage_mission": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "storage_exposure": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "config_clarity": { "score": number(0-15), "notes": "1-2 sentence reasoning" },
    "market_readiness": { "score": number(0-15), "notes": "1-2 sentence reasoning" }
  },
  "ati_total": number (sum of all dimension scores, 0-120),

  "narrative": {
    "summary": "2-3 sentence overall assessment with verdict",
    "strengths": ["3-6 specific positive factors"],
    "risks": ["2-5 specific concerns or unknowns"],
    "recommendations": "2-4 sentences on pre-buy scope, negotiation posture"
  },

  "risk_factors": ["any risks affecting value"],
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
          ati_dimensions: {
            type: 'object',
            properties: Object.fromEntries(ATI_DIMENSIONS.map(d => [
              d.key, {
                type: 'object',
                properties: { score: { type: 'number' }, notes: { type: 'string' } },
              }
            ])),
          },
          ati_total: { type: 'number' },
          narrative: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'string' },
            },
          },
          risk_factors: { type: 'array', items: { type: 'string' } },
          price_band: {
            type: 'object',
            properties: { low: { type: 'number' }, high: { type: 'number' } },
          },
          deal_assessment: {
            type: 'object',
            properties: { verdict: { type: 'string' }, comment: { type: 'string' } },
          },
        },
      },
    });

    // ── Calculate ATI total ──
    const dims = result.ati_dimensions || {};
    const atiTotal = Object.values(dims).reduce((sum, d) => sum + (d.score || 0), 0);
    const atiLabel = scoreLabel(atiTotal);
    const atiCode = generateATICode(listing.registration, atiTotal);

    // ── Calculate deal metrics ──
    const asking = listing.asking_price;
    const estimate = result.market_estimate;
    const discountPct = asking && estimate > 0
      ? Math.round(((estimate - asking) / estimate) * 1000) / 10
      : null;

    const dealScore = discountPct == null ? null
      : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
      : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;

    const dealLabel = dealScore == null ? null
      : dealScore >= 8.5 ? 'hot deal' : dealScore >= 6.5 ? 'good deal'
      : dealScore >= 5 ? 'fair' : 'overpriced';

    const calculatedVerdict = discountPct == null ? 'UNCLEAR'
      : discountPct >= 8 ? 'BELOW_MARKET' : discountPct <= -8 ? 'ABOVE_MARKET' : 'AT_MARKET';

    // ── Persist all results to listing ──
    await base44.entities.AircraftListing.update(listingId, {
      ati_score: atiTotal,
      omvm_value: estimate,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
    });

    return Response.json({
      ok: true,
      ati_total: atiTotal,
      ati_label: atiLabel,
      ati_code: atiCode,
      ati_dimensions: dims,
      market_estimate: estimate,
      confidence: result.confidence,
      valuation_rationale: result.valuation_rationale,
      key_comparables: result.key_comparables,
      adjustments: result.adjustments,
      narrative: result.narrative,
      risk_factors: result.risk_factors,
      price_band: result.price_band,
      deal_assessment: { ...result.deal_assessment, verdict: calculatedVerdict },
      discount_pct: discountPct,
      deal_score: dealScore,
      deal_label: dealLabel,
      comp_count: compSummary.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});