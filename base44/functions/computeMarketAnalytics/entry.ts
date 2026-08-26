import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { computeMarketAnalytics } from '../_shared/marketAnalytics.mjs';

/**
 * Compute Market Analytics — server-side aggregation of AircraftListing data.
 * Replaces client-side useMemo crunching over 1000+ records.
 *
 * Returns: summary, monthly price trends, top models, days-on-market, price delta.
 * Cached in-memory for 5 minutes (global — aggregate market data is user-agnostic).
 *
 * The aggregation itself lives in _shared/marketAnalytics.mjs so the White-Label
 * tenant surface (tenantCoreApi's intelligence.market) computes the same numbers
 * from the same code. This function keeps what is specific to it: user auth, the
 * entity read, and its own cache. The response shape is unchanged.
 */
const CACHE = new Map(); // key: 'global', value: { at: ms, data }
const TTL_MS = 5 * 60 * 1000;

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
    const data = computeMarketAnalytics(listings, new Date());

    CACHE.set('global', { at: Date.now(), data });
    return Response.json({ ...data, cached: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
