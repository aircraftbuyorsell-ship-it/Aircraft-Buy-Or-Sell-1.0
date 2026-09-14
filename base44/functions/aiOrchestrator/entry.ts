import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const agentUrl = 'https://app.base44.com/api/agents/6a9444389e0d9e69afc07997';
const actionSpecs = {
  analyze_deal: { productKey: 'ai_orchestrator', cost: 1 },
  value_aircraft: { productKey: 'ai_orchestrator', cost: 1 },
  draft_bill_of_sale: { productKey: 'ai_orchestrator_pro', cost: 2 },
};
const tierLimits = { buyer_pro: 20, seller_pro: 60, dealer: 300 };
const promptLead = {
  analyze_deal: 'You are the ABOS AI Deal Analyst. Analyze the listing below for a prospective buyer. Use ABOS entities (ATIPassport, MarketComparable, OmvmValuation) for market context. Return: 1) deal score & verdict, 2) price vs live market, 3) top 3 risks, 4) 3 questions to ask the seller. LISTING CONTEXT: ',
  value_aircraft: 'You are the ABOS AI Valuation desk. Produce a valuation estimate for the aircraft below using OmvmValuation and MarketComparable data where available, and state your confidence. AIRCRAFT CONTEXT: ',
  draft_bill_of_sale: "You are the ABOS AI transaction desk. Prepare a BillOfSaleDraft (fields per the BillOfSaleDraft entity schema) from the deal context below. Flag low-confidence fields in 'warnings'. Never invent purchaser or seller data — mark it missing. DEAL CONTEXT: ",
};

const pick = (record, fields) => record ? Object.fromEntries(fields.filter((key) => record[key] !== undefined).map((key) => [key, record[key]])) : null;
const extractResult = (payload) => {
  const value = payload?.assistant_message ?? payload?.message?.content ?? payload?.result ?? payload;
  if (typeof value !== 'string') return value;
  const cleaned = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(cleaned); } catch (_) { return value; }
};

Deno.serve(async (req) => {
  try {
    if (Deno.env.get('AI_ORCH_ENABLED') !== 'true') return Response.json({ error: 'AI Orchestrator temporarily unavailable.' }, { status: 503 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const { action, listing_id: listingId } = await req.json().catch(() => ({}));
    const spec = actionSpecs[action];
    if (!spec) return Response.json({ error: 'Unknown AI action.' }, { status: 400 });
    if (!listingId) return Response.json({ error: 'A listing is required.' }, { status: 400 });

    const email = String(user.email).trim().toLowerCase();
    const entitlements = await base44.asServiceRole.entities.Entitlement.filter({ user_email: email, product_key: spec.productKey, status: 'active' }, '-created_date', 10);
    if (!entitlements.length) return Response.json({ error: 'This AI feature requires an active ABOS Pro plan.', upgrade_required: true }, { status: 402 });
    const tier = entitlements.find((item) => tierLimits[item.scope])?.scope;
    const limit = tierLimits[tier] || 0;
    if (!limit) return Response.json({ error: 'This entitlement has no AI action allowance.', upgrade_required: true }, { status: 402 });

    const monthStart = new Date();
    monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const usage = await base44.asServiceRole.entities.FeatureUsageMetric.filter({ user_segment: email, feature_name: 'ai_orchestrator', measured_at: { $gte: monthStart.toISOString() } }, '-measured_at', 500);
    const used = usage.reduce((sum, item) => sum + Number(item.metric_value || 0), 0);
    if (used + spec.cost > limit) return Response.json({ error: 'Monthly AI action limit reached for your plan.', limit_reached: true, remaining_this_month: Math.max(0, limit - used) }, { status: 429 });

    const listing = await base44.asServiceRole.entities.AircraftListing.get(String(listingId)).catch(() => null);
    if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });
    const registration = String(listing.registration || '').trim().toUpperCase();
    const [passports, valuations, comparables] = await Promise.all([
      registration ? base44.asServiceRole.entities.ATIPassport.filter({ registration }, '-updated_date', 1) : [],
      base44.asServiceRole.entities.OmvmValuation.filter({ aircraft_listing_id: listing.id }, '-created_at', 3),
      listing.make && listing.model ? base44.asServiceRole.entities.MarketComparable.filter({ make: listing.make, model: listing.model }, '-fetched_at', 3) : [],
    ]);
    const context = {
      listing: pick(listing, ['id','registration','make','model','year','total_time','engine_hours','tbo','last_annual','avionics','asking_price','currency','ati_score','omvm_value','deal_score','deal_label','discount_pct','description']),
      ati_passport: pick(passports[0], ['registration','serial_number','ati_total','score_label','data_confidence','strengths','risks','missing_data','omvm_value','deal_score','deal_label','discount_pct','engine_remaining_pct']),
      omvm_valuations: valuations.map((item) => pick(item, ['estimated_value_usd','posterior_sigma_usd','confidence_mode','market_value_usd','market_listings_used','valuation_mode','created_at'])),
      market_comparables: comparables.map((item) => pick(item, ['make','model','year_range','avg_price','min_price','max_price','listings_count','fetched_at','is_stale'])),
    };

    const apiKey = Deno.env.get('SUPERAGENT_API_KEY');
    if (!apiKey) return Response.json({ error: 'AI service is not configured.' }, { status: 503 });
    let maps = await base44.asServiceRole.entities.AiConversationMap.filter({ user_email: email }, '-created_date', 1);
    let conversationId = maps[0]?.conversation_id;
    if (!conversationId) {
      const createRes = await fetch(`${agentUrl}/conversations`, { method: 'POST', headers: { api_key: apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `ABOS customer: ${email}` }) });
      if (!createRes.ok) return Response.json({ error: 'AI service unavailable, try again shortly.' }, { status: 502 });
      const conversation = await createRes.json();
      conversationId = conversation.id || conversation.conversation_id;
      if (!conversationId) return Response.json({ error: 'AI service unavailable, try again shortly.' }, { status: 502 });
      await base44.asServiceRole.entities.AiConversationMap.create({ user_email: email, conversation_id: conversationId, description: 'Dedicated paid AI Orchestrator thread' });
    }

    const outputRule = action === 'analyze_deal' ? '\nReturn valid JSON only with keys: deal_score, verdict, price_vs_live_market, risks (array of 3 strings), seller_questions (array of 3 strings).' : '\nReturn valid JSON only.';
    const aiRes = await fetch(`${agentUrl}/conversations/${conversationId}/messages`, { method: 'POST', headers: { api_key: apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `${promptLead[action]}${JSON.stringify(context)}${outputRule}` }) });
    if (!aiRes.ok) return Response.json({ error: 'AI service unavailable, try again shortly.' }, { status: 502 });
    const result = extractResult(await aiRes.json());
    await base44.asServiceRole.entities.FeatureUsageMetric.create({ feature_name: 'ai_orchestrator', metric_type: 'ai_action', metric_value: spec.cost, user_segment: email, ab_variant: action, tier, measured_at: new Date().toISOString() });
    return Response.json({ result, credits_used: spec.cost, remaining_this_month: limit - used - spec.cost });
  } catch (error) {
    console.error('AI Orchestrator failed', error?.message || error);
    return Response.json({ error: 'AI Orchestrator could not complete this action.' }, { status: 500 });
  }
});