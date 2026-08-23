import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CMR Negotiation Brief Generator
 * Generates a data-backed negotiation strategy using ATI subscores + OMVM.
 * Body: { listingId, side: "BUYER" | "SELLER", leadId? }
 */

// ── ABOS monetization gate — active PRO/BROKER subscription required (server-enforced for web, API and MCP) ──
async function gateProSubscription(base44, user) {
  if (user?.role === 'admin' || user?.role === 'super_admin') return null;
  const check = await base44.functions.invoke('abosEntitlements', { action: 'check', product_key: 'PRO' });
  const d = check?.data || {};
  if (d.entitled || d.active_sub_product) return null;
  let checkoutUrl = null;
  try {
    const co = await base44.functions.invoke('abosEntitlements', {
      action: 'create_checkout', product_key: 'PRO',
      return_url: Deno.env.get('BASE44_APP_URL') || 'https://base44.app',
    });
    checkoutUrl = co?.data?.url || null;
  } catch (_) { /* checkout link is optional */ }
  return Response.json({
    error: 'payment_required',
    message: 'This is a paid ABOS PRO tool. An active ABOS Professional (\u20ac99/mo) or Broker subscription is required. Open checkout_url to subscribe, then retry this request.',
    product_key: 'PRO',
    checkout_url: checkoutUrl,
  }, { status: 402 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Paid feature: negotiation brief requires PRO ──
    const gate = await gateProSubscription(base44, user);
    if (gate) return gate;

    const { listingId, side, leadId } = await req.json().catch(() => ({}));
    if (!listingId || !side) return Response.json({ error: 'listingId and side required' }, { status: 400 });

    const listing = await base44.entities.AircraftListing.get(listingId);
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

    // Pull latest ATI passport
    const passports = await base44.asServiceRole.entities.ATIPassport.filter(
      { listing: listingId }, '-created_date', 1
    );
    const passport = passports[0] || null;

    // Pull lead context if provided
    let leadContext = '';
    if (leadId) {
      const lead = await base44.entities.Lead.get(leadId).catch(() => null);
      if (lead) {
        leadContext = `\nBuyer profile: ${lead.name} | Budget: ${lead.budget || '?'} | Notes: ${(lead.notes || '').slice(0, 150)}`;
      }
    }

    // Pull comparable sales for price arguments
    const comps = await base44.asServiceRole.entities.AircraftListing.filter(
      { make: listing.make, model: listing.model }, '-created_date', 20
    );
    const compPrices = comps
      .filter(l => l.asking_price > 0 && l.id !== listingId)
      .map(l => l.asking_price);
    const medianComp = compPrices.length > 0
      ? compPrices.sort((a, b) => a - b)[Math.floor(compPrices.length / 2)]
      : null;

    const atiData = passport ? {
      total: passport.ati_total,
      label: passport.score_label,
      documentation: passport.documentation,
      technical: passport.technical,
      transparency: passport.transparency,
      transaction_ready: passport.transaction_ready,
      usage_mission: passport.usage_mission,
      market_readiness: passport.market_readiness,
      risks: passport.risks?.slice(0, 300),
      strengths: passport.strengths?.slice(0, 300),
    } : null;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the ABOS CMR Negotiation Engine. Generate a negotiation brief for the ${side} side.

AIRCRAFT: ${listing.year || ''} ${listing.make || ''} ${listing.model || ''} (${listing.registration || '—'})
ASKING PRICE: $${listing.asking_price?.toLocaleString() || '?'}
OMVM VALUE: $${listing.omvm_value?.toLocaleString() || 'not calculated'}
DISCOUNT vs OMVM: ${listing.discount_pct != null ? listing.discount_pct + '%' : '—'}
DEAL LABEL: ${listing.deal_label || '—'}
${medianComp ? `MEDIAN COMPARABLE: $${medianComp.toLocaleString()} (from ${compPrices.length} comps)` : 'NO COMPARABLE DATA'}
${leadContext}

ATI SCORE DATA:
${atiData ? JSON.stringify(atiData, null, 2) : 'No ATI passport available — use listing data only.'}

Generate a ${side} negotiation brief:
- If BUYER: find price reduction arguments from ATI risks, comp data, market position
- If SELLER: find value justification arguments from ATI strengths, avionics, engine status

Return JSON:
{
  "side": "${side}",
  "opening_price": number,
  "target_price": number,
  "walkaway_price": number,
  "arguments": [
    { "type": "ATI" | "MARKET" | "RISK" | "TIMELINE", "argument": "specific argument with data" }
  ],
  "concession_strategy": "how to handle concessions",
  "key_leverage": "the single strongest point",
  "red_flags": ["flag1"],
  "summary": "2 sentence brief"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          side: { type: 'string' },
          opening_price: { type: 'number' },
          target_price: { type: 'number' },
          walkaway_price: { type: 'number' },
          arguments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                argument: { type: 'string' },
              },
            },
          },
          concession_strategy: { type: 'string' },
          key_leverage: { type: 'string' },
          red_flags: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    });

    // Log the decision
    await base44.entities.DecisionLog.create({
      decision_type: 'other',
      subject_type: 'listing',
      subject_id: listingId,
      subject_label: `${listing.registration || '—'} · ${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim(),
      inputs: { side, leadId, asking_price: listing.asking_price, omvm_value: listing.omvm_value },
      outputs: { target_price: result.target_price, key_leverage: result.key_leverage },
      rule_version: 'nego_v1',
      rule_source: 'functions/cmrNegoBrief',
      actor: user.email,
      reasoning: result.summary,
    });

    return Response.json({
      ok: true,
      brief: result,
      listing: {
        id: listing.id,
        label: `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim(),
        registration: listing.registration,
        asking_price: listing.asking_price,
        omvm_value: listing.omvm_value,
        ati_score: listing.ati_score,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});