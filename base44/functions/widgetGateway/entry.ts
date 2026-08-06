import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Widget Gateway — validates embed_token and routes intelligence actions
 * for the white-label partner widget. End-users don't need ABOS accounts;
 * authentication is via the partner's embed_token.
 *
 * Actions: enrich, gcr, omvm, nego
 */
Deno.serve(async (req) => {
  try {
    // Gateway secret check — blocks direct calls that bypass the Cloudflare Worker.
    // Enforced only when GATEWAY_SECRET is set in Base44 env, so deploying this
    // patch before the Worker is live does not break anything.
    const expectedSecret = Deno.env.get('GATEWAY_SECRET');
    if (expectedSecret) {
      const providedSecret = req.headers.get('x-gateway-secret') || '';
      if (!timingSafeEqual(providedSecret, expectedSecret)) {
        return Response.json({ error: 'unauthorized' }, { status: 401 });
      }
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { embed_token, action, payload } = body;

    if (!embed_token) return Response.json({ error: 'embed_token required' }, { status: 403 });

    const partners = await base44.asServiceRole.entities.PartnerConfig.filter(
      { embed_token, is_active: true }, '-created_date', 1
    );
    if (partners.length === 0) return Response.json({ error: 'Invalid embed token' }, { status: 403 });
    const partner = partners[0];

    // Per-partner origin lock — fail-open when partner has no domains configured.
    // Origin is forwarded by the Cloudflare Worker as x-widget-origin.
    const widgetOrigin = req.headers.get('x-widget-origin') || '';
    const allowedDomains = Array.isArray(partner.allowed_domains) ? partner.allowed_domains : [];
    if (allowedDomains.length > 0) {
      const originHost = widgetOrigin.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();
      const ok = originHost && allowedDomains.some((d) => {
        const dom = String(d).toLowerCase().trim();
        return originHost === dom || originHost.endsWith('.' + dom);
      });
      if (!ok) return Response.json({ error: 'origin_not_allowed' }, { status: 403 });
    }

    switch (action) {
      case 'enrich': return await handleEnrich(base44, payload, partner);
      case 'gcr': return await handleGcr(base44, payload, partner);
      case 'omvm': return await handleOmvm(base44, payload, partner);
      case 'nego': return await handleNego(base44, payload, partner);
      default: return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    console.error('widgetGateway error:', error);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
});

// Constant-time string comparison to avoid timing attacks on the secret.
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

// ═══════════════════════════════════════════
// ENRICH — Registry lookup for aircraft data
// ═══════════════════════════════════════════
async function handleEnrich(base44, payload, partner) {
  const registration = (payload?.registration || '').trim().toUpperCase();
  if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

  // adsbdb — works for US and international
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(registration)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const ac = data?.response?.aircraft;
      if (ac?.registration) {
        return Response.json({
          found: true, source: 'adsbdb',
          aircraft: {
            registration: ac.registration,
            make: ac.manufacturer || null,
            model: ac.type || null,
            icao_type: ac.icao_type || null,
            mode_s_hex: ac.mode_s || null,
            registered_owner: ac.registered_owner || null,
            country: ac.registered_owner_country_name || null,
          },
        });
      }
    }
  } catch (_) { /* non-critical */ }

  // FAA entity for US registrations
  if (/^N/i.test(registration)) {
    const nNum = registration.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '');
    try {
      const faaResults = await base44.asServiceRole.entities.FAAAircraft.filter(
        { n_number: nNum }, '-created_date', 1
      );
      if (faaResults.length > 0) {
        const faa = faaResults[0];
        return Response.json({
          found: true, source: 'faa_entity',
          aircraft: {
            registration,
            make: faa.make || null,
            model: faa.model || null,
            year_mfr: faa.year_mfr || null,
            serial_number: faa.serial_number || null,
            mode_s_hex: faa.mode_s_hex || null,
            state: faa.state || null,
            country: 'US',
            status_code: faa.status_code || null,
            expiration_date: faa.expiration_date || null,
          },
        });
      }
    } catch (_) { /* non-critical */ }
  }

  return Response.json({ found: false, source: null, aircraft: null });
}

// ═══════════════════════════════════════════
// GCR — Global Compliance Report (Triple-Check)
// ═══════════════════════════════════════════
async function handleGcr(base44, payload, partner) {
  const fullReg = (payload?.registration || '').trim().toUpperCase();
  const hexCode = (payload?.hex || '').trim().replace(/^0x/i, '').toUpperCase();
  if (!fullReg && !hexCode) return Response.json({ error: 'registration or hex required' }, { status: 400 });

  const [registryResult, photoResult, trafficResult] = await Promise.allSettled([
    gcrRegistry(base44, fullReg),
    gcrPhoto(fullReg, hexCode),
    gcrTraffic(base44, fullReg, hexCode),
  ]);

  const registry = registryResult.status === 'fulfilled' ? registryResult.value : null;
  const photo = photoResult.status === 'fulfilled' ? photoResult.value : null;
  const traffic = trafficResult.status === 'fulfilled' ? trafficResult.value : null;

  const flags = [];

  // Registry: 40 pts
  let regScore = 0, regAircraft = null, regSource = null;
  if (registry?.found && registry?.aircraft) {
    regScore = 40; regAircraft = registry.aircraft; regSource = registry.source;
    if (registry.aircraft.expiration_date) {
      const expMs = new Date(registry.aircraft.expiration_date).getTime();
      if (!isNaN(expMs) && expMs < Date.now()) { regScore -= 15; flags.push('expired_registration'); }
    }
    if (registry.aircraft.status_code && registry.aircraft.status_code !== 'Valid' && registry.aircraft.status_code !== 'V') {
      regScore -= 10; flags.push('non_valid_status');
    }
  } else { flags.push('no_registry_record'); }
  regScore = Math.max(0, Math.min(40, regScore));

  // Visual: 25 pts
  let visScore = 0, photoInfo = null;
  if (photo?.photo_url) {
    photoInfo = { url: photo.photo_url, source: photo.source, photographer: photo.photographer };
    visScore = photo.source === 'planespotters' ? 25 : photo.source === 'adsbdb' ? 20 : 15;
  } else { flags.push('no_visual_record'); }
  visScore = Math.max(0, Math.min(25, visScore));

  // Traffic: 35 pts
  let trfScore = 0;
  const flightCount = traffic?.flight_count_last_180_days || 0;
  if (flightCount > 12) trfScore = 35;
  else if (flightCount >= 6) trfScore = 20;
  else if (flightCount >= 1) trfScore = 10;
  else flags.push('no_recent_flights');
  trfScore = Math.max(0, Math.min(35, trfScore));

  const total = regScore + visScore + trfScore;
  const label = total >= 75 ? 'Compliant' : total >= 40 ? 'Caution' : 'Non-Compliant';

  const recommendations = [];
  if (flags.includes('no_recent_flights')) recommendations.push('No recorded flights in the last 180 days — physical pre-buy inspection strongly recommended.');
  if (flags.includes('expired_registration')) recommendations.push('Registration appears expired — verify current status with the registering authority.');
  if (flags.includes('no_visual_record')) recommendations.push('No current aircraft photo found — request recent photographs from the seller.');
  if (flags.includes('no_registry_record')) recommendations.push('No registry record found — exercise extreme caution and request full ownership documentation.');
  if (recommendations.length === 0) recommendations.push('All triple-check validations passed — aircraft demonstrates good compliance integrity.');

  return Response.json({
    registration: fullReg,
    mode_s_hex: hexCode || regAircraft?.mode_s_hex || null,
    score: total,
    score_label: label,
    sub_scores: {
      registry: { score: regScore, max: 40, label: 'Registry Validity' },
      visual: { score: visScore, max: 25, label: 'Visual Evidence' },
      traffic: { score: trfScore, max: 35, label: 'Flight Activity' },
    },
    registry_data: regAircraft,
    registry_source: regSource,
    photo_data: photoInfo,
    traffic_data: traffic,
    integrity_flags: flags,
    recommendations,
    computed_at: new Date().toISOString(),
    is_premium: true,
    partner_id: partner.id,
  });
}

async function gcrRegistry(base44, fullReg) {
  if (!fullReg) return { found: false };
  if (/^N/i.test(fullReg)) {
    const nNum = fullReg.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '');
    try {
      const faaResults = await base44.asServiceRole.entities.FAAAircraft.filter(
        { n_number: nNum }, '-created_date', 1
      );
      if (faaResults.length > 0) {
        const faa = faaResults[0];
        return {
          found: true, source: 'faa_entity',
          aircraft: {
            registration: fullReg, make: faa.make || null, model: faa.model || null,
            year_mfr: faa.year_mfr || null, mode_s_hex: faa.mode_s_hex || null,
            state: faa.state || null, country: 'US', status_code: faa.status_code || null,
            expiration_date: faa.expiration_date || null, serial_number: faa.serial_number || null,
          },
        };
      }
    } catch (_) { /* non-critical */ }
  }
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(fullReg)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const ac = data?.response?.aircraft;
      if (ac?.registration) {
        return {
          found: true, source: 'adsbdb',
          aircraft: {
            registration: ac.registration, make: ac.manufacturer || null,
            model: ac.type || null, icao_type: ac.icao_type || null,
            mode_s_hex: ac.mode_s || null, country: ac.registered_owner_country_name || null,
            registered_owner: ac.registered_owner || null,
          },
        };
      }
    }
  } catch (_) { /* non-critical */ }
  return { found: false };
}

async function gcrPhoto(fullReg, hexCode) {
  const UA = 'ABOS-MarketSpace/1.0 (+https://abos-marketspace.com/contact)';
  if (hexCode) {
    try {
      const res = await fetch(`https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(hexCode)}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': UA },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const photo = data?.photos?.[0];
        if (photo?.thumbnail_large?.src) return { photo_url: photo.thumbnail_large.src, source: 'planespotters', photographer: photo.photographer || null };
      }
    } catch (_) { /* non-critical */ }
  }
  if (fullReg) {
    try {
      const res = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(fullReg)}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': UA },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const photo = data?.photos?.[0];
        if (photo?.thumbnail_large?.src) return { photo_url: photo.thumbnail_large.src, source: 'planespotters', photographer: photo.photographer || null };
      }
    } catch (_) { /* non-critical */ }
  }
  return null;
}

async function gcrTraffic(base44, fullReg, hexCode) {
  const filter = {};
  if (fullReg) filter.registration = fullReg;
  else if (hexCode) filter.icao24 = hexCode.toLowerCase();
  if (Object.keys(filter).length === 0) return null;
  try {
    const appearances = await base44.asServiceRole.entities.TrafficAppearance.filter(filter, '-captured_at', 500);
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const recent = appearances.filter(a => a.captured_at && new Date(a.captured_at).getTime() > cutoff);
    return {
      flight_count_last_180_days: recent.length,
      avg_altitude: recent.length > 0 ? Math.round(recent.reduce((s, a) => s + (a.altitude_ft || 0), 0) / recent.length) : null,
      last_seen_at: recent[0]?.captured_at || null,
    };
  } catch (_) { return null; }
}

// ═══════════════════════════════════════════
// OMVM — Off-Market Valuation Model
// ═══════════════════════════════════════════
async function handleOmvm(base44, payload, partner) {
  const listing = payload || {};
  const make = (listing.make || '').trim();
  const model = (listing.model || '').trim();
  const year = Number(listing.year) || null;
  const askingPrice = Number(listing.asking_price) || null;

  if (!make) return Response.json({ error: 'make required' }, { status: 400 });

  const modelPrefix = model.replace(/[A-Z]+$/, '').trim();
  const comps = await base44.asServiceRole.entities.AircraftListing.filter({ make }, '-created_date', 500);
  const valid = comps.filter(l => {
    const compPrefix = (l.model || '').replace(/[A-Z]+$/, '').trim();
    return l.asking_price > 5000 && l.year > 1950 && compPrefix === modelPrefix;
  });

  // No synthetic floor. When the comparable pool is too thin the model has no
  // opinion, and saying so is more useful to a partner than a constant dressed
  // up as a valuation. Callers branch on `status`, so the contract is stable
  // whether or not comps exist.
  const MIN_COMPS = 3;
  let baseValue, confidence;
  if (valid.length >= MIN_COMPS) {
    const prices = valid.map(l => l.asking_price).sort((a, b) => a - b);
    baseValue = prices[Math.floor(prices.length / 2)];
    confidence = valid.length >= 10 ? 'HIGH' : 'MEDIUM';
  } else {
    const allMake = comps.filter(l => l.asking_price > 5000);
    if (allMake.length >= MIN_COMPS) {
      const prices = allMake.map(l => l.asking_price).sort((a, b) => a - b);
      baseValue = prices[Math.floor(prices.length / 2)];
      confidence = 'LOW';
    } else {
      // Deliberately no asking_price fallback: anchoring on the number we were
      // asked to check is circular and always yields a 0% discount.
      return Response.json({
        ok: true,
        status: 'insufficient_comparables',
        omvm_value: null,
        value_low: null,
        value_high: null,
        deal_score: null,
        deal_label: null,
        discount_pct: null,
        confidence: null,
        comp_sample: valid.length,
        make_sample: allMake.length,
        required_comps: MIN_COMPS,
        message: 'Not enough comparable listings to produce a defensible valuation.',
        asking_price: askingPrice,
        partner_id: partner.id,
      });
    }
  }

  // Engine adjustment
  const tbo = Number(listing.tbo) || 2000;
  const engineHours = Number(listing.engine_hours) || 0;
  const engineRemainingFrac = Math.max(0, Math.min(1, (tbo - engineHours) / tbo));
  const engineAdj = 25000 * (engineRemainingFrac - 0.5);

  // Avionics premium
  const avionicsList = (listing.avionics || '').split(',').map(a => a.trim()).filter(Boolean);
  const avionicsPremium = Math.min(avionicsList.length * 2500, 15000);

  let omvmValue = Math.max(10000, Math.round((baseValue + engineAdj + avionicsPremium) / 1000) * 1000);

  const discountPct = askingPrice ? Math.round(((omvmValue - askingPrice) / omvmValue) * 1000) / 10 : null;
  const dealScore = discountPct == null ? null
    : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
    : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;
  const dealLabel = dealScore == null ? null
    : dealScore >= 8.5 ? 'hot deal' : dealScore >= 6.5 ? 'good deal'
    : dealScore >= 5 ? 'fair' : 'overpriced';

  const lowBand = Math.round(omvmValue * 0.85 / 1000) * 1000;
  const highBand = Math.round(omvmValue * 1.15 / 1000) * 1000;

  return Response.json({
    ok: true,
    omvm_value: omvmValue,
    value_low: lowBand,
    value_high: highBand,
    deal_score: dealScore,
    deal_label: dealLabel,
    discount_pct: discountPct,
    confidence,
    comp_sample: valid.length,
    engine_remaining_pct: Math.round(engineRemainingFrac * 100),
    asking_price: askingPrice,
    partner_id: partner.id,
  });
}

// ═══════════════════════════════════════════
// NEGO — AI Negotiation Brief
// ═══════════════════════════════════════════
async function handleNego(base44, payload, partner) {
  const { registration, make, model, year, asking_price, omvm_value, offer_amount, side } = payload || {};
  if (!make || !asking_price) return Response.json({ error: 'make and asking_price required' }, { status: 400 });

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the ABOS Negotiation Engine. Generate a concise negotiation brief for the ${side || 'BUYER'} side.

AIRCRAFT: ${year || ''} ${make} ${model || ''} (${registration || '—'})
ASKING PRICE: $${Number(asking_price).toLocaleString()}
OMVM VALUE: ${omvm_value ? '$' + Number(omvm_value).toLocaleString() : 'not calculated'}
OFFER: ${offer_amount ? '$' + Number(offer_amount).toLocaleString() : '—'}

Return JSON with:
{
  "opening_price": number,
  "target_price": number,
  "walkaway_price": number,
  "arguments": [{ "type": "MARKET|RISK|VALUE|TIMELINE", "argument": "specific data-backed argument" }],
  "key_leverage": "single strongest point",
  "summary": "2 sentence brief"
}`,
    response_json_schema: {
      type: 'object',
      properties: {
        opening_price: { type: 'number' },
        target_price: { type: 'number' },
        walkaway_price: { type: 'number' },
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: { type: { type: 'string' }, argument: { type: 'string' } },
          },
        },
        key_leverage: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  });

  return Response.json({
    ok: true,
    brief: result,
    partner_id: partner.id,
  });
}