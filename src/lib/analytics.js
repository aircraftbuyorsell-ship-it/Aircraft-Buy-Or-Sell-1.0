// Pure analytics helpers over AircraftListing records.
// No side-effects, no API calls — easy to unit-test and memoize.

import { format, differenceInDays, startOfMonth, subMonths } from "date-fns";

const MODEL_KEY = (l) => `${(l.make || "").trim()} ${(l.model || "").trim()}`.trim() || "Unknown";

/** Average asking price per calendar month for the last `months` months. */
export function avgPriceByMonth(listings, months = 12) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i));
    buckets.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM yy"), sum: 0, count: 0 });
  }
  const byKey = Object.fromEntries(buckets.map(b => [b.key, b]));

  listings.forEach(l => {
    if (!l.asking_price || !l.created_date) return;
    const key = format(new Date(l.created_date), "yyyy-MM");
    const b = byKey[key];
    if (!b) return;
    b.sum += l.asking_price;
    b.count += 1;
  });

  const result = buckets.map(b => ({
    month: b.label,
    avgPrice: b.count ? Math.round(b.sum / b.count) : null,
    listings: b.count,
  }));

  // Add month-over-month % change
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1].avgPrice;
    const curr = result[i].avgPrice;
    result[i].momPct = prev && curr ? Math.round(((curr - prev) / prev) * 1000) / 10 : null;
  }

  return result;
}

/** Top `n` most-listed models with avg price, avg ATI, listing count. */
export function topModels(listings, n = 10) {
  const map = new Map();
  listings.forEach(l => {
    const k = MODEL_KEY(l);
    if (!map.has(k)) map.set(k, { model: k, count: 0, priceSum: 0, priceN: 0, atiSum: 0, atiN: 0 });
    const rec = map.get(k);
    rec.count += 1;
    if (l.asking_price) { rec.priceSum += l.asking_price; rec.priceN += 1; }
    if (l.ati_score) { rec.atiSum += l.ati_score; rec.atiN += 1; }
  });
  return [...map.values()]
    .map(r => ({
      model: r.model,
      count: r.count,
      avgPrice: r.priceN ? Math.round(r.priceSum / r.priceN) : null,
      avgAti: r.atiN ? Math.round(r.atiSum / r.atiN) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Average days-on-market by model. Uses closed_date if available, else now for active listings. */
export function daysOnMarketByModel(listings, n = 10) {
  const now = new Date();
  const map = new Map();
  listings.forEach(l => {
    if (!l.created_date) return;
    const end = l.status === "sold" && l.updated_date
      ? new Date(l.updated_date)
      : now;
    const days = differenceInDays(end, new Date(l.created_date));
    if (days < 0) return;
    const k = MODEL_KEY(l);
    if (!map.has(k)) map.set(k, { model: k, sum: 0, count: 0, soldCount: 0 });
    const rec = map.get(k);
    rec.sum += days;
    rec.count += 1;
    if (l.status === "sold") rec.soldCount += 1;
  });
  return [...map.values()]
    .filter(r => r.count >= 1)
    .map(r => ({
      model: r.model,
      avgDays: Math.round(r.sum / r.count),
      listings: r.count,
      sold: r.soldCount,
    }))
    .sort((a, b) => b.listings - a.listings)
    .slice(0, n);
}

/** Price change % vs previous period. */
export function priceDelta(monthly) {
  const valid = monthly.filter(m => m.avgPrice != null);
  if (valid.length < 2) return null;
  const first = valid[0].avgPrice;
  const last = valid[valid.length - 1].avgPrice;
  return { first, last, pct: Math.round(((last - first) / first) * 1000) / 10 };
}

/** Aggregate summary. */
export function summary(listings) {
  const active = listings.filter(l => l.status === "active");
  const sold = listings.filter(l => l.status === "sold");
  const avgAti = (() => {
    const xs = listings.filter(l => l.ati_score).map(l => l.ati_score);
    return xs.length ? Math.round(xs.reduce((s, v) => s + v, 0) / xs.length) : null;
  })();
  const medianPrice = (() => {
    const xs = listings.filter(l => l.asking_price).map(l => l.asking_price).sort((a, b) => a - b);
    if (!xs.length) return null;
    const mid = Math.floor(xs.length / 2);
    return xs.length % 2 ? xs[mid] : Math.round((xs[mid - 1] + xs[mid]) / 2);
  })();
  return { total: listings.length, active: active.length, sold: sold.length, avgAti, medianPrice };
}