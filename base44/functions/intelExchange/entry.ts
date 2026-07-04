import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Intelligence Exchange — "data for intelligence" endpoint for partner marketplaces.
 * Partner POSTs listing data (authenticated by embed_token), ABOS stores the data
 * and returns intelligence per listing: registry match + OMVM value + deal label.
 *
 * POST { embed_token, listings: [{ registration, make, model, year, asking_price, engine_hours, tbo, source_url }] }
 * Max 25 listings per call.
 */

function normalizeReg(input) {
  return String(input || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

async function registryMatch(base44, registration) {
  if (!/^N/.test(registration)) return null;
  const nNum = registration.replace(/^N/, '');
  const recs = await base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNum }, '-created_date', 1);
  const faa = recs[0];
  if (!faa) return null;
  return {
    matched: true,
    serial_number: faa.serial_number || null,
    year_mfr: faa.year_mfr || null,
    owner_state: faa.state || null,
    status_code: faa.status_code || null,
    mode_s_hex: faa.mode_s_hex || null,
    expiration_date: faa.expiration_date || null,
  };
}

async function omvmEstimate(base44, { make, model, year, asking_price, engine_hours, tbo }) {
  if (!make) return null;
  const modelPrefix = String(model || '').replace(/[A-Z]+$/, '').trim();
  const comps = await base44.asServiceRole.entities.AircraftListing.filter({ make }, '-created_date', 500);
  const valid = comps.filter((l) => {
    const compPrefix = (l.model || '').replace(/[A-Z]+$/, '').trim();
    return l.asking_price > 5000 && l.year > 1950 && (!modelPrefix || compPrefix === modelPrefix);
  });
  if (valid.length === 0) return null;

  const prices = valid.map((l) => l.asking_price).sort((a, b) => a - b);
  const baseValue = prices[Math.floor(prices.length / 2)];
  const confidence = valid.length >= 10 ? 'HIGH' : valid.length >= 3 ? 'MEDIUM' : 'LOW';

  const tboN = Number(tbo) || 2000;
  const hoursN = Number(engine_hours) || 0;
  const engineFrac = Math.max(0, Math.min(1, (tboN - hoursN) / tboN));
  const omvmValue = Math.max(10000, Math.round((baseValue + 25000 * (engineFrac - 0.5)) / 1000) * 1000);

  const askingN = Number(asking_price) || null;
  const discountPct = askingN ? Math.round(((omvmValue - askingN) / omvmValue) * 1000) / 10 : null;
  const dealLabel = discountPct == null ? null
    : discountPct > 15 ? 'hot deal' : discountPct > 5 ? 'good deal'
    : discountPct > -5 ? 'fair' : 'overpriced';

  return {
    omvm_value: omvmValue,
    value_low: Math.round(omvmValue * 0.85 / 1000) * 1000,
    value_high: Math.round(omvmValue * 1.15 / 1000) * 1000,
    discount_pct: discountPct,
    deal_label: dealLabel,
    confidence,
    comp_sample: valid.length,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { embed_token, listings } = body;

    if (!embed_token) return Response.json({ error: 'embed_token required' }, { status: 403 });
    if (!Array.isArray(listings) || listings.length === 0) {
      return Response.json({ error: 'listings array required' }, { status: 400 });
    }
    if (listings.length > 25) {
      return Response.json({ error: 'Max 25 listings per call' }, { status: 400 });
    }

    const partners = await base44.asServiceRole.entities.PartnerConfig.filter(
      { embed_token, is_active: true }, '-created_date', 1
    );
    if (partners.length === 0) return Response.json({ error: 'Invalid embed token' }, { status: 403 });
    const partner = partners[0];

    const results = [];
    for (const raw of listings) {
      const registration = normalizeReg(raw.registration);
      if (!registration) {
        results.push({ registration: null, error: 'registration required' });
        continue;
      }

      const [registry, omvm] = await Promise.all([
        registryMatch(base44, registration).catch(() => null),
        omvmEstimate(base44, raw).catch(() => null),
      ]);

      const intelligence = {
        registry: registry || { matched: false },
        valuation: omvm,
        computed_at: new Date().toISOString(),
      };

      await base44.asServiceRole.entities.PartnerListingFeed.create({
        partner_id: partner.id,
        partner_name: partner.partner_name,
        partner_email: partner.partner_email,
        registration,
        make: raw.make || null,
        model: raw.model || null,
        year: Number(raw.year) || null,
        asking_price: Number(raw.asking_price) || null,
        engine_hours: Number(raw.engine_hours) || null,
        source_url: raw.source_url || null,
        raw_payload: raw,
        intelligence,
        registry_matched: !!registry,
      });

      results.push({ registration, intelligence });
    }

    return Response.json({
      ok: true,
      partner: partner.partner_name,
      received: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});