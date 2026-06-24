import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * piloterrTradeProxy — ABOS Market Intelligence proxy.
 *
 * Accepts { make, model, year } and fetches live aviation market listings
 * from the external Trade-A-Plane search endpoint via Piloterr API.
 * Normalizes the response into a market comparable object, upserts it
 * into the MarketComparable entity, and returns it.
 *
 * On any error or empty result, silently falls back to the most recent
 * cached MarketComparable record matching make+model. If no cache exists
 * either, returns null — all callers handle null gracefully.
 *
 * The external source name is NEVER exposed; all data is branded
 * "ABOS Market Intelligence".
 */

const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
const API_BASE = 'https://api.piloterr.com/v2/trade/a-plane-search';

function normalizeMakeModel(str) {
  return (str || '').trim();
}

function parsePriceString(str) {
  if (str == null) return null;
  if (typeof str === 'number') return Number.isFinite(str) && str > 1000 ? str : null;
  const cleaned = String(str).replace(/[$,\s]/g, '').replace(/USD/i, '');
  const num = Number(cleaned);
  if (Number.isFinite(num) && num > 1000) return Math.round(num);
  return null;
}

function extractPrices(rawListings) {
  if (!Array.isArray(rawListings)) return [];
  const prices = [];
  for (const item of rawListings) {
    if (!item || typeof item !== 'object') continue;
    const price = item.price ?? item.asking_price ?? item.Price ?? item.listing_price ?? item.cost ?? item.value;
    const num = parsePriceString(price);
    if (num != null) prices.push(num);
  }
  return prices;
}

function extractRawListings(rawListings) {
  if (!Array.isArray(rawListings)) return [];
  return rawListings.map((item) => ({
    title: item.title || null,
    price: parsePriceString(item.price),
    price_raw: item.price || null,
    link: item.link || null,
    location: item.location || null,
    year: item.specifications?.year || null,
    total_time: item.specifications?.totalTime || null,
    registration: item.specifications?.registration || null,
    serial_number: item.specifications?.serialNumber || null,
    images: item.images || [],
  })).filter((l) => l.title || l.registration);
}

function extractListingsArray(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.aircraftList)) return body.aircraftList;
  if (Array.isArray(body.results)) return body.results;
  if (Array.isArray(body.listings)) return body.listings;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.items)) return body.items;
  if (body.response && Array.isArray(body.response.results)) return body.response.results;
  return [];
}

function buildComparable(make, model, year, prices, rawListings, fetchedAt) {
  const sorted = [...prices].sort((a, b) => a - b);
  const count = sorted.length;
  const avg = count > 0 ? Math.round(sorted.reduce((s, p) => s + p, 0) / count) : null;
  const min = count > 0 ? sorted[0] : null;
  const max = count > 0 ? sorted[count - 1] : null;
  const samples = sorted.slice(0, 20);
  const listings = extractRawListings(rawListings);

  return {
    make: normalizeMakeModel(make),
    model: normalizeMakeModel(model),
    year_range: year ? String(year) : 'all',
    avg_price: avg,
    min_price: min,
    max_price: max,
    listings_count: count,
    price_samples: samples,
    raw_listings: listings,
    source_label: 'ABOS Market Intelligence',
    fetched_at: fetchedAt,
    is_stale: false,
  };
}

async function fetchFromCache(base44, make, model) {
  try {
    const records = await base44.asServiceRole.entities.MarketComparable.filter(
      { make: normalizeMakeModel(make) },
      '-fetched_at',
      20
    );
    // Find best match: model match preferred, else any make match
    const modelMatch = records.find(r =>
      r.model && r.model.toLowerCase().includes((model || '').toLowerCase())
    );
    const match = modelMatch || records[0] || null;
    if (!match) return null;

    // Compute staleness
    const ageMs = Date.now() - new Date(match.fetched_at).getTime();
    const isStale = ageMs > STALE_THRESHOLD_MS;
    return { ...match, is_stale: isStale, _source: 'cached' };
  } catch (err) {
    console.error('[piloterrTradeProxy] cache fallback error:', err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { make, model, year } = body;

    if (!make) {
      return Response.json({ error: 'make is required' }, { status: 400 });
    }

    const query = [make, model, year].filter(Boolean).join(' ');
    const apiKey = Deno.env.get('Default_API_Key');
    const fetchedAt = new Date().toISOString();
    console.log('[piloterrTradeProxy] query:', query, 'apiKey exists:', !!apiKey);

    let liveData = null;
    let apiError = null;

    // ── Attempt live API call ──────────────────────────────────────
    if (apiKey) {
      try {
        const url = `${API_BASE}?query=${encodeURIComponent(query)}`;
        console.log('[piloterrTradeProxy] fetching:', url);
        const apiRes = await fetch(url, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json',
          },
        });
        console.log('[piloterrTradeProxy] API status:', apiRes.status);

        if (apiRes.ok) {
          const json = await apiRes.json();
          const listings = extractListingsArray(json);
          const prices = extractPrices(listings);
          console.log(`[piloterrTradeProxy] API OK: ${listings.length} listings, ${prices.length} prices for "${query}"`);

          if (prices.length > 0) {
            liveData = buildComparable(make, model, year, prices, listings, fetchedAt);
            liveData._source = 'live';
          } else {
            apiError = 'no valid prices in response';
          }
        } else {
          const errBody = await apiRes.text().catch(() => '');
          apiError = `API returned ${apiRes.status}: ${errBody.substring(0, 200)}`;
          console.warn('[piloterrTradeProxy] API error:', apiError);
        }
      } catch (err) {
        apiError = err.message;
        console.warn('[piloterrTradeProxy] live API error:', err.message);
      }
    } else {
      apiError = 'API key not configured';
    }

    // ── Upsert live data to cache ─────────────────────────────────
    if (liveData) {
      try {
        // Check for existing record (same make + model + year_range)
        const existing = await base44.asServiceRole.entities.MarketComparable.filter(
          { make: liveData.make, model: liveData.model, year_range: liveData.year_range },
          '-fetched_at',
          1
        );
        if (existing.length > 0) {
          await base44.asServiceRole.entities.MarketComparable.update(existing[0].id, {
            avg_price: liveData.avg_price,
            min_price: liveData.min_price,
            max_price: liveData.max_price,
            listings_count: liveData.listings_count,
            price_samples: liveData.price_samples,
            raw_listings: liveData.raw_listings,
            fetched_at: fetchedAt,
            is_stale: false,
          });
        } else {
          await base44.asServiceRole.entities.MarketComparable.create({
            make: liveData.make,
            model: liveData.model,
            year_range: liveData.year_range,
            avg_price: liveData.avg_price,
            min_price: liveData.min_price,
            max_price: liveData.max_price,
            listings_count: liveData.listings_count,
            price_samples: liveData.price_samples,
            raw_listings: liveData.raw_listings,
            source_label: 'ABOS Market Intelligence',
            fetched_at: fetchedAt,
            is_stale: false,
          });
        }
      } catch (upsertErr) {
        console.warn('[piloterrTradeProxy] cache upsert failed:', upsertErr.message);
      }
      return Response.json(liveData);
    }

    // ── Fallback to cache ─────────────────────────────────────────
    const cached = await fetchFromCache(base44, make, model);
    if (cached) {
      return Response.json(cached);
    }

    // ── No data available ──────────────────────────────────────────
    return Response.json(null);
  } catch (error) {
    console.error('[piloterrTradeProxy] fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});