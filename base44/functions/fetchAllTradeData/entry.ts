import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * fetchAllTradeData — Batch ingestion of all available Trade-A-Plane market data.
 *
 * Iterates through a comprehensive list of aircraft makes, calls the Piloterr
 * Trade-A-Plane search API for each, and upserts the results into the
 * MarketComparable entity. Stores both aggregated stats and raw listing objects.
 *
 * Admin-only. Returns a summary of fetched data.
 */

const API_BASE = 'https://api.piloterr.com/v2/trade/a-plane-search';

const MAKES = [
  'Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', 'Bonanza',
  'Robinson', 'Bell', 'Airbus', 'Boeing', 'Bombardier', 'Embraer',
  'Gulfstream', 'Hawker', 'Learjet', 'Pilatus', 'Socata', 'Grumman',
  'Maule', 'Cub', 'Diamond', 'Robin', 'Aeronca', 'Bellanca',
  'Commander', 'Conquest', 'Dassault', 'Dornier', 'Extra',
  'Grob', 'Lake', 'Lancair', 'Mitsubishi', 'Navion', 'Partenair',
  'Pilatus PC', 'Raytheon', 'Rutan', 'Saab', 'Scottish Aviation',
  'Socata Trinidad', 'Stearman', 'Stinson', 'Stratos', 'Supermarine',
  'Taylorcraft', 'Vans RV', 'Waco', 'Yakovlev', 'Zenith',
];

function parsePriceString(str) {
  if (str == null) return null;
  if (typeof str === 'number') return Number.isFinite(str) && str > 1000 ? str : null;
  const cleaned = String(str).replace(/[$,\s]/g, '').replace(/USD/i, '');
  const num = Number(cleaned);
  if (Number.isFinite(num) && num > 1000) return Math.round(num);
  return null;
}

function extractListingsArray(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.aircraftList)) return body.aircraftList;
  if (Array.isArray(body.results)) return body.results;
  if (Array.isArray(body.listings)) return body.listings;
  if (Array.isArray(body.data)) return body.data;
  return [];
}

function extractPrices(rawListings) {
  const prices = [];
  for (const item of rawListings) {
    const price = item.price ?? item.asking_price ?? item.Price;
    const num = parsePriceString(price);
    if (num != null) prices.push(num);
  }
  return prices;
}

function extractRawListings(rawListings) {
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

async function fetchMake(apiKey, make) {
  const url = `${API_BASE}?query=${encodeURIComponent(make)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { make, error: `HTTP ${res.status}`, listings: [], prices: [] };
    const json = await res.json();
    const rawListings = extractListingsArray(json);
    const prices = extractPrices(rawListings);
    const listings = extractRawListings(rawListings);
    const sorted = [...prices].sort((a, b) => a - b);
    const count = sorted.length;
    return {
      make,
      avg_price: count > 0 ? Math.round(sorted.reduce((s, p) => s + p, 0) / count) : null,
      min_price: count > 0 ? sorted[0] : null,
      max_price: count > 0 ? sorted[count - 1] : null,
      listings_count: count,
      price_samples: sorted.slice(0, 20),
      raw_listings: listings,
      total_results: json.totalResults || count,
    };
  } catch (err) {
    return { make, error: err.message, listings: [], prices: [] };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const apiKey = Deno.env.get('Default_API_Key');
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const fetchedAt = new Date().toISOString();
    const results = [];
    let totalListings = 0;
    let successCount = 0;
    let errorCount = 0;

    // Fetch sequentially with small delay to respect rate limits
    for (const make of MAKES) {
      const result = await fetchMake(apiKey, make);

      if (result.avg_price != null) {
        totalListings += result.listings_count;
        successCount++;

        // Upsert to MarketComparable
        try {
          const existing = await base44.asServiceRole.entities.MarketComparable.filter(
            { make: result.make, model: '', year_range: 'all' },
            '-fetched_at',
            1
          );
          if (existing.length > 0) {
            await base44.asServiceRole.entities.MarketComparable.update(existing[0].id, {
              avg_price: result.avg_price,
              min_price: result.min_price,
              max_price: result.max_price,
              listings_count: result.listings_count,
              price_samples: result.price_samples,
              raw_listings: result.raw_listings,
              fetched_at: fetchedAt,
              is_stale: false,
            });
          } else {
            await base44.asServiceRole.entities.MarketComparable.create({
              make: result.make,
              model: '',
              year_range: 'all',
              avg_price: result.avg_price,
              min_price: result.min_price,
              max_price: result.max_price,
              listings_count: result.listings_count,
              price_samples: result.price_samples,
              raw_listings: result.raw_listings,
              source_label: 'ABOS Market Intelligence',
              fetched_at: fetchedAt,
              is_stale: false,
            });
          }
        } catch (upsertErr) {
          console.warn(`[fetchAllTradeData] upsert failed for ${make}:`, upsertErr.message);
        }

        results.push({
          make: result.make,
          avg_price: result.avg_price,
          min_price: result.min_price,
          max_price: result.max_price,
          listings_count: result.listings_count,
          total_results: result.total_results,
        });
      } else {
        errorCount++;
        results.push({ make: result.make, error: result.error || 'no data' });
      }

      // Small delay between calls
      await new Promise((r) => setTimeout(r, 500));
    }

    return Response.json({
      ok: true,
      fetched_at: fetchedAt,
      makes_queried: MAKES.length,
      makes_with_data: successCount,
      makes_failed: errorCount,
      total_listings: totalListings,
      results,
    });
  } catch (error) {
    console.error('[fetchAllTradeData] fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});