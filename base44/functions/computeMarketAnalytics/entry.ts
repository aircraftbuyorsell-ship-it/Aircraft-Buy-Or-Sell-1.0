import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Compute Market Analytics — server-side aggregation of AircraftListing data.
 * Replaces client-side useMemo crunching over 1000+ records.
 *
 * Returns: summary, monthly price trends, top models, days-on-market, price delta.
 * Cached in-memory for 5 minutes (global — aggregate market data is user-agnostic).
 */
const CACHE = new Map(); // key: 'global', value: { at: ms, data }
const TTL_MS = 5 * 60 * 1000;

const MODEL_KEY = (l) => `${(l.make || '').trim()} ${(l.model || '').trim()}`.trim() || 'Unknown';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const cached = CACHE.get('global');
    if (cached && Date.now() - cached.at < TTL_MS) {
      return Response.json({ ...cached.data, cached: true });
    }

    const listings = await base44.asServiceRole.entities.AircraftListing.list('-created_date', 1000);
    const now = new Date();

    // ── Summary ──
    const active = listings.filter(l => l.status === 'active');
    const sold = listings.filter(l => l.status === 'sold');
    const atiScores = listings.filter(l => l.ati_score).map(l => l.ati_score);
    const prices = listings.filter(l => l.asking_price).map(l => l.asking_price).sort((a, b) => a - b);
    const medianPrice = prices.length > 0
      ? (prices.length % 2 ? prices[Math.floor(prices.length / 2)] : Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2))
      : null;
    const avgAti = atiScores.length > 0 ? Math.round(atiScores.reduce((s, v) => s + v, 0) / atiScores.length) : null;

    // ── Monthly avg price (last 12 months) ──
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      buckets.push({ key, label, sum: 0, count: 0 });
    }
    const byKey = Object.fromEntries(buckets.map(b => [b.key, b]));
    listings.forEach(l => {
      if (!l.asking_price || !l.created_date) return;
      const d = new Date(l.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const b = byKey[key];
      if (!b) return;
      b.sum += l.asking_price;
      b.count += 1;
    });
    const monthly = buckets.map(b => ({
      month: b.label,
      avgPrice: b.count > 0 ? Math.round(b.sum / b.count) : null,
      listings: b.count,
    }));

    // ── Price delta (first vs last valid month) ──
    const validMonths = monthly.filter(m => m.avgPrice != null);
    let delta = null;
    if (validMonths.length >= 2) {
      const first = validMonths[0].avgPrice;
      const last = validMonths[validMonths.length - 1].avgPrice;
      delta = { first, last, pct: Math.round(((last - first) / first) * 1000) / 10 };
    }

    // ── Top models ──
    const modelMap = new Map();
    listings.forEach(l => {
      const k = MODEL_KEY(l);
      if (!modelMap.has(k)) modelMap.set(k, { model: k, count: 0, priceSum: 0, priceN: 0, atiSum: 0, atiN: 0 });
      const rec = modelMap.get(k);
      rec.count += 1;
      if (l.asking_price) { rec.priceSum += l.asking_price; rec.priceN += 1; }
      if (l.ati_score) { rec.atiSum += l.ati_score; rec.atiN += 1; }
    });
    const topModelsList = [...modelMap.values()]
      .map(r => ({
        model: r.model,
        count: r.count,
        avgPrice: r.priceN > 0 ? Math.round(r.priceSum / r.priceN) : null,
        avgAti: r.atiN > 0 ? Math.round(r.atiSum / r.atiN) : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Days on market by model ──
    const domMap = new Map();
    listings.forEach(l => {
      if (!l.created_date) return;
      const end = l.status === 'sold' && l.updated_date ? new Date(l.updated_date) : now;
      const days = Math.floor((end - new Date(l.created_date)) / (1000 * 60 * 60 * 24));
      if (days < 0) return;
      const k = MODEL_KEY(l);
      if (!domMap.has(k)) domMap.set(k, { model: k, sum: 0, count: 0, soldCount: 0 });
      const rec = domMap.get(k);
      rec.sum += days;
      rec.count += 1;
      if (l.status === 'sold') rec.soldCount += 1;
    });
    const dom = [...domMap.values()]
      .filter(r => r.count >= 1)
      .map(r => ({
        model: r.model,
        avgDays: Math.round(r.sum / r.count),
        listings: r.count,
        sold: r.soldCount,
      }))
      .sort((a, b) => b.listings - a.listings)
      .slice(0, 8);

    const data = {
      generated_at: new Date().toISOString(),
      summary: {
        total: listings.length,
        active: active.length,
        sold: sold.length,
        avgAti,
        medianPrice,
      },
      monthly,
      delta,
      topModels: topModelsList,
      daysOnMarket: dom,
    };

    CACHE.set('global', { at: Date.now(), data });
    return Response.json({ ...data, cached: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});