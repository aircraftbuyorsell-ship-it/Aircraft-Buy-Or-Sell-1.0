// Generate a paid market report with macro/political/regional depth + personalization + prediction tracking.
// Token cost: hourly=2, daily=5, weekly=10, monthly=20

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SCOPE_COSTS = { hourly: 2, daily: 5, weekly: 10, monthly: 20 };
const SCOPE_LABEL = {
  hourly:  "Hourly Pulse",
  daily:   "Daily Market Brief",
  weekly:  "Weekly Market Report",
  monthly: "Monthly Market Outlook",
};
const SCOPE_FRESHNESS_MS = {
  hourly:  60 * 60 * 1000,
  daily:   24 * 60 * 60 * 1000,
  weekly:  7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const ALL_REGIONS = [
  "USA", "Canada", "South America", "UK", "EU - Western Europe",
  "EU - Eastern Europe", "Middle East", "Africa", "India",
  "China", "Russia & CIS", "Asia-Pacific", "Australia & Oceania"
];

async function getAppConfig(base44) {
  const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: "global" }, "-created_date", 1);
  if (configs.length) return configs[0];
  return { freezeAbosDataInfluence: true, abosDataFreezeMessage: "" };
}

async function findFreshCachedReport(base44, scope, filters) {
  if (filters && (filters.aircraft_category || filters.regions?.length || filters.focus_areas?.length)) {
    return null;
  }
  const recent = await base44.asServiceRole.entities.MarketReport.filter({ scope }, "-created_date", 1);
  if (!recent.length) return null;
  const r = recent[0];
  const age = Date.now() - new Date(r.generated_at || r.created_date).getTime();
  return age <= SCOPE_FRESHNESS_MS[scope] ? r : null;
}

async function getBalance(base44, email) {
  const txs = await base44.asServiceRole.entities.TokenTransaction.filter({ user_email: email }, "-created_date", 1);
  return txs.length ? Number(txs[0].balance_after) || 0 : 0;
}

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
      return_url: Deno.env.get('BASE44_APP_URL') || 'https://aircraftbuyorsell.com/checkout-success',
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

async function gatherDataSnapshot(base44) {
  const [listings, deals, escrows] = await Promise.all([
    base44.asServiceRole.entities.AircraftListing.filter({ status: "active" }, "-created_date", 200),
    base44.asServiceRole.entities.DealRadar.list("-created_date", 50),
    base44.asServiceRole.entities.EscrowTransaction.list("-created_date", 30),
  ]);

  // Fetch live market intelligence for top makes
  const topMakeNames = Object.entries(
    listings.reduce((acc, l) => { const k = (l.make || "Unknown").trim(); acc[k] = (acc[k] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([make]) => make);

  let marketComparables = [];
  try {
    const marketResults = await Promise.all(
      topMakeNames.map((make) =>
        base44.functions.invoke('piloterrTradeProxy', { make }).then(
          (res) => res?.data || res || null,
          () => null
        )
      )
    );
    marketComparables = topMakeNames
      .map((make, i) => ({ make, ...marketResults[i] }))
      .filter((m) => m && m.avg_price != null);
  } catch (_) {}
  const prices = listings.map(l => Number(l.asking_price)).filter(p => p > 0);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const medianPrice = prices.length ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0;
  const atiScores = listings.map(l => Number(l.ati_score)).filter(s => s > 0);
  const avgAti = atiScores.length ? atiScores.reduce((a, b) => a + b, 0) / atiScores.length : 0;
  const makeCounts = {};
  listings.forEach(l => { const k = (l.make || "Unknown").trim(); makeCounts[k] = (makeCounts[k] || 0) + 1; });
  const topMakes = Object.entries(makeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([make, count]) => ({ make, count }));
  const dealLabelCounts = {};
  deals.forEach(d => { const k = d.deal_label || "unlabeled"; dealLabelCounts[k] = (dealLabelCounts[k] || 0) + 1; });
  return {
    active_listings: listings.length,
    avg_asking_price_usd: Math.round(avgPrice),
    median_asking_price_usd: Math.round(medianPrice),
    avg_ati_score: Math.round(avgAti * 10) / 10,
    top_makes: topMakes,
    deal_label_distribution: dealLabelCounts,
    recent_deal_count: deals.length,
    recent_escrow_count: escrows.length,
    market_comparables: marketComparables.map((m) => ({
      make: m.make,
      avg_price: m.avg_price,
      min_price: m.min_price,
      max_price: m.max_price,
      listings_count: m.listings_count,
      data_source: m._source === 'cached' ? 'cached' : 'live',
    })),
    generated_at: new Date().toISOString(),
  };
}

async function generateNarrative(base44, scope, snapshot, filters, freezeAbosData) {
  const scopeLabel = SCOPE_LABEL[scope];
  const regionList = filters?.regions?.length ? filters.regions : ALL_REGIONS;
  const categoryFocus = filters?.aircraft_category ? `Focus specifically on: ${filters.aircraft_category}` : "Cover all aircraft categories (SEP, MEP, Turboprop, Light Jet, Midsize Jet, Heavy Jet, Helicopter).";
  const priceFocus = (filters?.price_range_min || filters?.price_range_max)
    ? `Price range focus: ${filters.price_range_min || 0}–${filters.price_range_max || "unlimited"} USD.`
    : "";
  const customFocus = filters?.focus_areas?.length ? `User-specific focus areas: ${filters.focus_areas.join(", ")}.` : "";
  const horizonDays = scope === "hourly" ? 2 : scope === "daily" ? 7 : scope === "weekly" ? 30 : 90;

  const internalDataSection = freezeAbosData
    ? `INTERNAL PLATFORM DATA: Not available / excluded from this analysis. Do NOT reference or infer from any internal listing database. Base all conclusions exclusively on external macro-economic indicators, geopolitical events, regulatory changes, and publicly available aviation industry data.`
    : `INTERNAL PLATFORM DATA (ABOS snapshot):\n${JSON.stringify(snapshot, null, 2)}`;

  const prompt = `You are a senior aviation market intelligence analyst. Generate a structured ${scopeLabel} for the pre-owned aircraft market.

ANALYSIS PRIORITIES (in order):
1. MACROECONOMIC SIGNALS: Interest rates, inflation, USD/EUR/GBP exchange rates, fuel prices (Jet-A, AvGas), credit availability, global GDP outlook, supply chain disruptions.
2. POLITICAL & REGULATORY SIGNALS: Analyze EACH regulator/body separately — EASA (Europe), FAA (USA), ICAO (global standards), IATA (airline industry impact on used aircraft supply), CAA (UK), DGCA (India), CAAC (China), Rosaviatsia (Russia), ANAC (Brazil), CAAS (Singapore/Pacific). Also cover: trade sanctions, tariffs on aircraft parts, airspace restrictions, tax treaty changes.
3. REGIONAL ANALYSIS: For each of these regions provide a specific analysis: ${regionList.join(", ")}.
4. OPPORTUNITIES & RISKS: Synthesized cross-regional findings.
5. PREDICTIONS: Make ${scope === "hourly" ? 3 : scope === "daily" ? 4 : scope === "weekly" ? 5 : 6} specific, falsifiable predictions with measurable targets for the next ${horizonDays} days.

PERSONALIZATION:
${categoryFocus}
${priceFocus}
${customFocus}

${internalDataSection}

SCOPE: ${scope.toUpperCase()} — calibrate depth and horizon accordingly.
Use real-time web context for ALL macro, political, and regional signals.

Return strict JSON only.`;

  return base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
    response_json_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        overall_sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
        executive_summary: { type: "string" },
        key_findings: { type: "array", items: { type: "string" } },
        macro_economic_signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              factor: { type: "string" },
              impact: { type: "string", enum: ["high", "medium", "low"] },
              direction: { type: "string", enum: ["positive", "neutral", "negative"] },
              commentary: { type: "string" }
            },
            required: ["factor", "impact", "direction", "commentary"]
          }
        },
        political_regulatory_signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source: { type: "string" },
              signal: { type: "string" },
              impact: { type: "string", enum: ["high", "medium", "low"] },
              direction: { type: "string", enum: ["positive", "neutral", "negative"] }
            },
            required: ["source", "signal", "impact", "direction"]
          }
        },
        regional_analysis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              region: { type: "string" },
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              demand_trend: { type: "string", enum: ["growing", "stable", "declining"] },
              price_trend: { type: "string", enum: ["up", "flat", "down"] },
              key_drivers: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } }
            },
            required: ["region", "sentiment", "demand_trend", "price_trend", "key_drivers", "risks"]
          }
        },
        predictions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              statement: { type: "string" },
              metric: { type: "string" },
              expected_direction: { type: "string", enum: ["up", "flat", "down"] },
              expected_change_pct: { type: "number" },
              horizon_days: { type: "number" },
              confidence: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["statement", "metric", "expected_direction", "horizon_days", "confidence"]
          }
        },
        opportunities: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } }
      },
      required: ["title", "overall_sentiment", "executive_summary", "key_findings",
        "macro_economic_signals", "political_regulatory_signals", "regional_analysis",
        "predictions", "opportunities", "risks"]
    }
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled automation must prove possession of a server-side secret.
    // Never treat an auth exception as evidence of an internal scheduler.
    const user = await base44.auth.me().catch(() => null);
    const automationSecret = Deno.env.get('ABOS_AUTOMATION_SECRET');
    const suppliedAutomationSecret = req.headers.get('x-abos-automation-secret');
    const isScheduled = Boolean(
      automationSecret &&
      suppliedAutomationSecret &&
      suppliedAutomationSecret === automationSecret
    );

    if (!user && !isScheduled) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const { scope = "daily", filters = {} } = body;

    if (!SCOPE_COSTS[scope]) {
      return Response.json({ error: "Invalid scope. Use hourly|daily|weekly|monthly." }, { status: 400 });
    }

    const cost = SCOPE_COSTS[scope];
    const userEmail = user?.email || "system@abos-marketspace.com";

    // Cache check (skipped for personalized reports)
    const cached = await findFreshCachedReport(base44, scope, filters);
    if (cached) {
      const balanceNow = isScheduled ? 0 : await getBalance(base44, userEmail);
      return Response.json({ report: cached, balance: balanceNow, cost: 0, cached: true });
    }

    // Subscription gate — only for user-driven requests (not scheduled system runs)
    if (!isScheduled) {
      const gate = await gateProSubscription(base44, user);
      if (gate) return gate;
    }

    const [appConfig, snapshot] = await Promise.all([
      getAppConfig(base44),
      gatherDataSnapshot(base44),
    ]);

    const freezeAbosData = appConfig.freezeAbosDataInfluence === true;
    const narrative = await generateNarrative(base44, scope, snapshot, filters, freezeAbosData);

    // Tokens are deprecated — access is gated by subscription above; nothing to deduct.
    const newBalance = 0;

    const report = await base44.asServiceRole.entities.MarketReport.create({
      user_email: userEmail,
      scope,
      title: narrative.title || SCOPE_LABEL[scope],
      overall_sentiment: narrative.overall_sentiment,
      executive_summary: narrative.executive_summary,
      key_findings: narrative.key_findings || [],
      macro_economic_signals: narrative.macro_economic_signals || [],
      political_regulatory_signals: narrative.political_regulatory_signals || [],
      regional_analysis: narrative.regional_analysis || [],
      predictions: narrative.predictions || [],
      opportunities: narrative.opportunities || [],
      risks: narrative.risks || [],
      personalization_filters: Object.keys(filters).length > 0 ? filters : null,
      data_snapshot: freezeAbosData ? { abos_data_frozen: true } : snapshot,
      token_cost: cost,
      model_version: "gemini_3_1_pro",
      generated_at: new Date().toISOString(),
    });

    return Response.json({
      report,
      balance: newBalance,
      cost: isScheduled ? 0 : cost,
      cached: false,
      scheduled: isScheduled,
      abos_data_frozen: freezeAbosData,
      freeze_message: freezeAbosData ? appConfig.abosDataFreezeMessage : null,
    });
  } catch (error) {
    console.error("generateMarketReport error:", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});