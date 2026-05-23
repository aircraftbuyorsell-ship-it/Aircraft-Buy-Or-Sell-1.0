// Generate a paid market forecast report.
// Flow: auth -> check token balance -> gather data snapshot -> LLM synthesis ->
//       atomically deduct tokens (TokenTransaction ledger) -> persist MarketReport.
//
// Token cost per scope (raw tokens):
//   hourly  = 2   (cheapest, lighter pulse)
//   daily   = 5
//   weekly  = 10
//   monthly = 20  (deepest synthesis)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SCOPE_COSTS = { hourly: 2, daily: 5, weekly: 10, monthly: 20 };

const SCOPE_LABEL = {
  hourly: "Hourly Pulse",
  daily: "Daily Market Brief",
  weekly: "Weekly Market Report",
  monthly: "Monthly Market Outlook",
};

async function getBalance(base44, email) {
  const txs = await base44.asServiceRole.entities.TokenTransaction.filter(
    { user_email: email },
    "-created_date",
    1,
  );
  if (txs.length === 0) return 0;
  return Number(txs[0].balance_after) || 0;
}

async function gatherDataSnapshot(base44) {
  // Pull recent internal signals to feed the LLM.
  const [listings, deals, escrowsRecent] = await Promise.all([
    base44.asServiceRole.entities.AircraftListing.filter({ status: "active" }, "-created_date", 200),
    base44.asServiceRole.entities.DealRadar.list("-created_date", 50),
    base44.asServiceRole.entities.EscrowTransaction.list("-created_date", 30),
  ]);

  const prices = listings.map((l) => Number(l.asking_price)).filter((p) => p > 0);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const medianPrice = prices.length
    ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
    : 0;

  const atiScores = listings.map((l) => Number(l.ati_score)).filter((s) => s > 0);
  const avgAti = atiScores.length ? atiScores.reduce((a, b) => a + b, 0) / atiScores.length : 0;

  const makeCounts = {};
  listings.forEach((l) => {
    const k = (l.make || "Unknown").trim();
    makeCounts[k] = (makeCounts[k] || 0) + 1;
  });
  const topMakes = Object.entries(makeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([make, count]) => ({ make, count }));

  const dealLabelCounts = {};
  deals.forEach((d) => {
    const k = d.deal_label || "unlabeled";
    dealLabelCounts[k] = (dealLabelCounts[k] || 0) + 1;
  });

  return {
    active_listings: listings.length,
    avg_asking_price_usd: Math.round(avgPrice),
    median_asking_price_usd: Math.round(medianPrice),
    avg_ati_score: Math.round(avgAti * 10) / 10,
    top_makes: topMakes,
    deal_label_distribution: dealLabelCounts,
    recent_deal_count: deals.length,
    recent_escrow_count: escrowsRecent.length,
    generated_at: new Date().toISOString(),
  };
}

async function generateNarrative(base44, scope, snapshot) {
  const scopeLabel = SCOPE_LABEL[scope];
  const prompt = `You are a senior aviation market analyst. Generate a ${scopeLabel} for the pre-owned aircraft market.

Use BOTH the internal ABOS platform snapshot below AND real-time external context (global economy, fuel prices, regulatory news, geopolitical events) from web search to assess how global and local environmental changes are influencing the market RIGHT NOW.

Internal ABOS snapshot:
${JSON.stringify(snapshot, null, 2)}

Scope: ${scope.toUpperCase()} — calibrate depth, lookback window, and forward-looking horizon accordingly:
- hourly: sharp pulse, only the most recent 24h shifts
- daily: 1-3 day window, near-term moves
- weekly: 7-day window, emerging trends
- monthly: 30-day window, structural outlook

Return strict JSON.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
        global_signals: { type: "array", items: { type: "string" } },
        local_signals: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        category_breakdown: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              trend: { type: "string", enum: ["up", "flat", "down"] },
              commentary: { type: "string" },
            },
            required: ["category", "trend", "commentary"],
          },
        },
      },
      required: [
        "title",
        "overall_sentiment",
        "executive_summary",
        "key_findings",
        "global_signals",
        "local_signals",
        "opportunities",
        "risks",
        "category_breakdown",
      ],
    },
  });

  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { scope = "daily" } = await req.json();
    if (!SCOPE_COSTS[scope]) {
      return Response.json({ error: "Invalid scope. Use hourly|daily|weekly|monthly." }, { status: 400 });
    }

    const cost = SCOPE_COSTS[scope];
    const balance = await getBalance(base44, user.email);
    if (balance < cost) {
      return Response.json({
        error: "Insufficient tokens",
        required: cost,
        balance,
      }, { status: 402 });
    }

    // 1. Gather data
    const snapshot = await gatherDataSnapshot(base44);

    // 2. Generate narrative (LLM)
    const narrative = await generateNarrative(base44, scope, snapshot);

    // 3. Deduct tokens (ledger entry)
    const newBalance = balance - cost;
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: user.email,
      type: "consumption",
      amount: -cost,
      feature: `market_report_${scope}`,
      balance_after: newBalance,
    });

    // 4. Persist report
    const report = await base44.asServiceRole.entities.MarketReport.create({
      user_email: user.email,
      scope,
      title: narrative.title || SCOPE_LABEL[scope],
      overall_sentiment: narrative.overall_sentiment,
      executive_summary: narrative.executive_summary,
      key_findings: narrative.key_findings || [],
      global_signals: narrative.global_signals || [],
      local_signals: narrative.local_signals || [],
      opportunities: narrative.opportunities || [],
      risks: narrative.risks || [],
      category_breakdown: narrative.category_breakdown || [],
      data_snapshot: snapshot,
      token_cost: cost,
      model_version: "gemini_3_1_pro",
      generated_at: new Date().toISOString(),
    });

    return Response.json({ report, balance: newBalance, cost });
  } catch (error) {
    console.error("generateMarketReport error:", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});