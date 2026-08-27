// Canonical public shape of market intelligence in the ABOS API contract.
//
// The ABOS dashboard consumes computeMarketAnalytics' internal shape directly
// (camelCase keys, a `color` per category for its charts). That shape is an
// internal UI contract and is free to change with the dashboard. This mapper
// is the boundary: it turns those numbers into the stable, documented v1 shape
// a paying tenant integrates against, so redesigning the ABOS dashboard cannot
// silently break a customer's integration.
//
// Formatting only — the arithmetic all happens in marketAnalytics.mjs.

/** A market summary needs enough listings behind it to mean anything. */
const MIN_LISTINGS_FOR_SIGNAL = 5;

/**
 * Maps aggregate analytics into the v1 market-intelligence contract.
 *
 * @param {object} analytics Output of computeMarketAnalytics()
 * @returns {object} The v1 payload
 */
export function mapMarketIntelligence(analytics) {
  const summary = analytics?.summary || {};
  const total = summary.total ?? 0;

  // Below the threshold the aggregates are noise dressed up as insight. Say so
  // rather than shipping a "median price" derived from two listings — a tenant
  // rendering that to a buyer is presenting ABOS's noise as ABOS's judgement.
  const sufficient = total >= MIN_LISTINGS_FOR_SIGNAL;

  return {
    generated_at: analytics?.generated_at ?? null,
    sufficient_data: sufficient,
    note: sufficient
      ? null
      : `Fewer than ${MIN_LISTINGS_FOR_SIGNAL} listings in the sample — aggregates are omitted rather than reported as market signal.`,
    market: sufficient
      ? {
        listings_total: total,
        listings_active: summary.active ?? 0,
        listings_sold: summary.sold ?? 0,
        median_asking_price: summary.medianPrice ?? null,
        average_ati_score: summary.avgAti ?? null,
        currency: 'USD',
      }
      : null,
    price_trend: sufficient
      ? (analytics?.monthly || []).map((m) => ({
        month: m.month,
        average_asking_price: m.avgPrice ?? null,
        listings: m.listings ?? 0,
      }))
      : [],
    price_change: sufficient && analytics?.delta
      ? {
        from: analytics.delta.first ?? null,
        to: analytics.delta.last ?? null,
        percent: analytics.delta.pct ?? null,
      }
      : null,
    top_models: sufficient
      ? (analytics?.topModels || []).map((m) => ({
        model: m.model,
        listings: m.count ?? 0,
        average_asking_price: m.avgPrice ?? null,
        average_ati_score: m.avgAti ?? null,
      }))
      : [],
    days_on_market: sufficient
      ? (analytics?.daysOnMarket || []).map((d) => ({
        model: d.model,
        average_days: d.avgDays ?? null,
        listings: d.listings ?? 0,
        sold: d.sold ?? 0,
      }))
      : [],
    category_trends: sufficient
      ? (analytics?.categoryTrends || []).map((c) => ({
        // `color` is deliberately dropped: it is the ABOS dashboard's palette,
        // and a white-label tenant brands its own UI. Shipping it would invite
        // customers to render ABOS's colours inside their brand.
        category: c.category,
        data: (c.data || []).map((p) => ({
          month: p.month,
          average_asking_price: p.avgPrice ?? null,
          listings: p.listings ?? 0,
        })),
      }))
      : [],
    disclaimer:
      'Aggregate market data derived from listings known to ABOS. It describes '
      + 'that sample, not the whole market, and is not an appraisal or financial advice.',
    model_version: 'market-intelligence-v1',
  };
}
