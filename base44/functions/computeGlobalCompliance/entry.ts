import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Global Compliance Report (GCR) — Triple-Check Validation Engine.
 *
 * Aggregates data from three independent sources in parallel:
 *   1. Registry lookup (FAA entity + adsbdb + LLM fallback for international)
 *   2. Visual evidence (PlaneSpotters + adsbdb photos)
 *   3. Historical flight traffic (TrafficAppearance entity — OpenSky/adsb.lol)
 *
 * Produces a Compliance Score (0–100) with integrity_flags and recommendations.
 * Caches result in GlobalRegistry.raw_data.gcr with 24h TTL.
 *
 * Input: { registration, hex, force }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, hex, force } = await req.json().catch(() => ({}));
    if (!registration && !hex) {
      return Response.json({ error: 'registration or hex required' }, { status: 400 });
    }

    const fullReg = (registration || '').trim().toUpperCase();
    const hexCode = (hex || '').trim().replace(/^0x/i, '').toUpperCase();

    // ── ACCESS CHECK ──
    const hasAccess = await checkGcrAccess(base44, user, fullReg);

    // ── CACHE CHECK (unless force=true) ──
    if (!force && fullReg) {
      try {
        const cached = await base44.asServiceRole.entities.GlobalRegistry.filter(
          { registration: fullReg }, '-updated_date', 1
        );
        if (cached.length > 0) {
          const gcr = cached[0].raw_data?.gcr;
          if (gcr && gcr.expires_at) {
            if (Date.now() < new Date(gcr.expires_at).getTime()) {
              if (!hasAccess) {
                return Response.json(gateGcrResponse(gcr, true));
              }
              return Response.json({ ...gcr, cached: true, is_premium: true });
            }
          }
        }
      } catch (_) { /* cache miss */ }
    }

    // ── International prefix detection ──
    const INTL_PREFIXES = ['G-', 'C-', 'D-', 'F-', 'I-', 'EC-', 'VH-', 'SP-', 'OK-', 'HA-', 'LV-', 'PP-', 'PT-', 'XA-', 'XB-', 'XC-', 'ZK-', 'ZL-', '9V-', 'A7-', 'B-', 'JA-', 'RP-', 'PH-', 'OO-', 'SE-', 'LN-', 'OY-', 'OH-', 'SX-', 'UR-', 'RA-', 'RF-'];
    const isIntl = INTL_PREFIXES.some(p => fullReg.startsWith(p));

    // ── PARALLEL DATA FETCHING ──
    const [registryData, photoData, trafficData] = await Promise.allSettled([
      fetchRegistry(base44, fullReg, isIntl),
      fetchPhoto(fullReg, hexCode),
      fetchTraffic(base44, fullReg, hexCode),
    ]);

    const registry = registryData.status === 'fulfilled' ? registryData.value : null;
    const photo = photoData.status === 'fulfilled' ? photoData.value : null;
    const traffic = trafficData.status === 'fulfilled' ? trafficData.value : null;

    // ── SCORING ENGINE ──
    const integrity_flags = [];

    // Registry validity: 40 pts
    let registryScore = 0;
    let registrySource = null;
    let registryAircraft = null;
    if (registry?.found && registry?.aircraft) {
      registryScore = 40;
      registrySource = registry.source;
      registryAircraft = registry.aircraft;
      if (registry.aircraft.expiration_date) {
        const expMs = new Date(registry.aircraft.expiration_date).getTime();
        if (!isNaN(expMs) && expMs < Date.now()) {
          registryScore -= 15;
          integrity_flags.push('expired_registration');
        }
      }
      if (registry.aircraft.status_code && registry.aircraft.status_code !== 'Valid' && registry.aircraft.status_code !== 'V') {
        registryScore -= 10;
        integrity_flags.push('non_valid_status');
      }
      if (registry.source === 'llm_fallback') {
        integrity_flags.push('foreign_registry_unverified');
      }
    } else {
      integrity_flags.push('no_registry_record');
    }
    registryScore = Math.max(0, Math.min(40, registryScore));

    // Visual evidence: 25 pts
    let visualScore = 0;
    let photoInfo = null;
    if (photo?.photo_url) {
      photoInfo = { url: photo.photo_url, source: photo.source, photographer: photo.photographer };
      if (photo.source === 'planespotters') visualScore = 25;
      else if (photo.source === 'adsbdb') visualScore = 20;
      else if (photo.source === 'hf_generated') visualScore = 10;
      else visualScore = 15;
    } else {
      integrity_flags.push('no_visual_record');
    }
    visualScore = Math.max(0, Math.min(25, visualScore));

    // Flight activity: 35 pts
    let trafficScore = 0;
    const flightCount = traffic?.flight_count_last_180_days || 0;
    if (flightCount > 12) trafficScore = 35;
    else if (flightCount >= 6) trafficScore = 20;
    else if (flightCount >= 1) trafficScore = 10;
    else integrity_flags.push('no_recent_flights');
    trafficScore = Math.max(0, Math.min(35, trafficScore));

    const totalScore = registryScore + visualScore + trafficScore;
    const score_label = totalScore >= 75 ? 'Compliant' : totalScore >= 40 ? 'Caution' : 'Non-Compliant';

    // Recommendations
    const recommendations = [];
    if (integrity_flags.includes('no_recent_flights'))
      recommendations.push('Aircraft has no recorded flights in the last 180 days — physical pre-buy inspection strongly recommended.');
    if (integrity_flags.includes('expired_registration'))
      recommendations.push('Registration appears expired — verify current status with the registering authority.');
    if (integrity_flags.includes('no_visual_record'))
      recommendations.push('No current aircraft photo found — request recent photographs from the seller.');
    if (integrity_flags.includes('foreign_registry_unverified'))
      recommendations.push('International registry data sourced via AI lookup — verify with the local aviation authority.');
    if (integrity_flags.includes('no_registry_record'))
      recommendations.push('No registry record found in any source — exercise extreme caution and request full ownership documentation.');
    if (recommendations.length === 0)
      recommendations.push('All triple-check validations passed — aircraft demonstrates good compliance integrity.');

    const result = {
      registration: fullReg,
      mode_s_hex: hexCode || registryAircraft?.mode_s_hex || null,
      score: totalScore,
      score_label,
      sub_scores: {
        registry: { score: registryScore, max: 40, label: 'Registry Validity' },
        visual: { score: visualScore, max: 25, label: 'Visual Evidence' },
        traffic: { score: trafficScore, max: 35, label: 'Flight Activity' },
      },
      registry_data: registryAircraft,
      registry_source: registrySource,
      photo_data: photoInfo,
      traffic_data: traffic,
      integrity_flags,
      recommendations,
      computed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // ── CACHE WRITE ──
    if (fullReg) {
      try {
        const existing = await base44.asServiceRole.entities.GlobalRegistry.filter(
          { registration: fullReg }, '-updated_date', 1
        );
        if (existing.length > 0) {
          await base44.asServiceRole.entities.GlobalRegistry.update(existing[0].id, {
            raw_data: { ...existing[0].raw_data, gcr: result },
            last_verified_at: new Date().toISOString(),
          });
        } else {
          await base44.asServiceRole.entities.GlobalRegistry.create({
            registration: fullReg,
            mode_s_hex: hexCode || registryAircraft?.mode_s_hex || null,
            source: 'cache',
            raw_data: { gcr: result },
            last_verified_at: new Date().toISOString(),
          });
        }
      } catch (_) { /* non-critical */ }
    }

    if (!hasAccess) {
      return Response.json(gateGcrResponse(result, false));
    }
    return Response.json({ ...result, cached: false, is_premium: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ════════════════════════════════════════════════════════════════
// HELPER: Check if user has paid access to full GCR data
// ════════════════════════════════════════════════════════════════
async function checkGcrAccess(base44, user, registration) {
  if (!user || !registration) return false;
  // Admins always have access
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  // Entitlement engine: VERIFICATION_PACK purchase or PRO/BROKER subscription (tokens are deprecated)
  try {
    const entRes = await base44.functions.invoke('abosEntitlements', {
      action: 'check', product_key: 'VERIFICATION_PACK', aircraft_registration: registration,
    });
    if (entRes?.data?.entitled) return true;
  } catch (_) { /* non-critical */ }
  // Check for GCR unlock TokenTransaction (30-day validity)
  try {
    const records = await base44.asServiceRole.entities.TokenTransaction.filter(
      { user_email: user.email, type: 'gcr_unlock' },
      '-created_date', 50
    );
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const unlocked = records.some(r =>
      r.metadata?.registration === registration &&
      new Date(r.created_date).getTime() > thirtyDaysAgo
    );
    if (unlocked) return true;
  } catch (_) { /* non-critical */ }
  // Check if user is an assigned expert for this registration
  try {
    const assignments = await base44.asServiceRole.entities.ExpertCrossCheck.filter(
      { registration, expert_id: user.id, status: 'in_progress' },
      '-created_date', 5
    );
    if (assignments.length > 0) return true;
  } catch (_) { /* non-critical */ }
  return false;
}

// ════════════════════════════════════════════════════════════════
// HELPER: Gate GCR response — return only basic preview for unpaid users
// ════════════════════════════════════════════════════════════════
function gateGcrResponse(data, cached) {
  return {
    registration: data.registration,
    mode_s_hex: data.mode_s_hex || null,
    score: data.score,
    score_label: data.score_label,
    basic_aircraft: {
      make: data.registry_data?.make || null,
      model: data.registry_data?.model || null,
      year_mfr: data.registry_data?.year_mfr || null,
    },
    is_premium: false,
    cached,
  };
}

// ════════════════════════════════════════════════════════════════
// HELPER: Registry lookup (inlined — no function-to-function call)
// ════════════════════════════════════════════════════════════════
async function fetchRegistry(base44, fullReg, isIntl) {
  // US: check FAAAircraft entity
  if (!isIntl) {
    const normalized = fullReg.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '');
    try {
      const faaResults = await base44.asServiceRole.entities.FAAAircraft.filter(
        { n_number: normalized }, '-created_date', 1
      );
      if (faaResults.length > 0) {
        const faa = faaResults[0];
        return {
          found: true,
          source: 'faa_entity',
          aircraft: {
            registration: fullReg,
            n_number: faa.n_number,
            serial_number: faa.serial_number || null,
            year_mfr: faa.year_mfr || null,
            state: faa.state || null,
            country: faa.country || 'US',
            status_code: faa.status_code || null,
            mode_s_hex: faa.mode_s_hex || null,
            cert_issue_date: faa.cert_issue_date || null,
            expiration_date: faa.expiration_date || null,
            air_worth_date: faa.air_worth_date || null,
            make: faa.make || null,
            model: faa.model || null,
          },
        };
      }
    } catch (_) { /* non-critical */ }
  }

  // adsbdb.com — works for both US and international
  try {
    const adsbRes = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(fullReg)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (adsbRes.ok) {
      const adsbData = await adsbRes.json();
      const ac = adsbData?.response?.aircraft;
      if (ac?.registration) {
        return {
          found: true,
          source: 'adsbdb',
          aircraft: {
            registration: ac.registration,
            mode_s_hex: ac.mode_s || null,
            make: ac.manufacturer || null,
            model: ac.type || null,
            icao_type: ac.icao_type || null,
            country: ac.registered_owner_country_name || null,
            registered_owner: ac.registered_owner || null,
          },
        };
      }
    }
  } catch (_) { /* non-critical */ }

  // LLM fallback for international registrations
  if (isIntl) {
    try {
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Find aircraft registry information for aircraft registration ${fullReg}. Look up the aircraft type, manufacturer, model, ICAO type designator, country of registration, and current registration status from official aviation registries. Return only factual, verified data.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            registration: { type: 'string' },
            make: { type: 'string' },
            model: { type: 'string' },
            icao_type: { type: 'string' },
            country: { type: 'string' },
            status: { type: 'string' },
            mode_s_hex: { type: 'string' },
            serial_number: { type: 'string' },
            year_mfr: { type: 'number' },
          },
        },
      });
      if (llmRes?.registration) {
        return {
          found: true,
          source: 'llm_fallback',
          aircraft: {
            registration: llmRes.registration,
            make: llmRes.make || null,
            model: llmRes.model || null,
            icao_type: llmRes.icao_type || null,
            country: llmRes.country || null,
            status_code: llmRes.status || null,
            mode_s_hex: llmRes.mode_s_hex || null,
            serial_number: llmRes.serial_number || null,
            year_mfr: llmRes.year_mfr || null,
          },
        };
      }
    } catch (_) { /* non-critical */ }
  }

  return { found: false, source: null, aircraft: null };
}

// ════════════════════════════════════════════════════════════════
// HELPER: Photo lookup (PlaneSpotters + adsbdb)
// ════════════════════════════════════════════════════════════════
async function fetchPhoto(fullReg, hexCode) {
  const UA = 'ABOS-MarketSpace/1.0 (+https://abos-marketspace.com/contact)';

  // PlaneSpotters by hex
  if (hexCode) {
    try {
      const res = await fetch(`https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(hexCode)}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': UA },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const photo = data?.photos?.[0];
        if (photo?.thumbnail_large?.src) {
          return {
            photo_url: photo.thumbnail_large.src,
            source: 'planespotters',
            photographer: photo.photographer || null,
          };
        }
      }
    } catch (_) { /* non-critical */ }
  }

  // PlaneSpotters by registration
  if (fullReg) {
    try {
      const res = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(fullReg)}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': UA },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const photo = data?.photos?.[0];
        if (photo?.thumbnail_large?.src) {
          return {
            photo_url: photo.thumbnail_large.src,
            source: 'planespotters',
            photographer: photo.photographer || null,
          };
        }
      }
    } catch (_) { /* non-critical */ }
  }

  // adsbdb photo
  if (fullReg) {
    try {
      const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(fullReg)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        const ac = data?.response?.aircraft;
        if (ac?.url_photo) {
          return { photo_url: ac.url_photo, source: 'adsbdb', photographer: null };
        }
      }
    } catch (_) { /* non-critical */ }
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
// HELPER: Traffic appearance query (last 180 days)
// ════════════════════════════════════════════════════════════════
async function fetchTraffic(base44, fullReg, hexCode) {
  const filter = {};
  if (fullReg) filter.registration = fullReg;
  else if (hexCode) filter.icao24 = hexCode.toLowerCase();
  if (Object.keys(filter).length === 0) return null;

  const appearances = await base44.asServiceRole.entities.TrafficAppearance.filter(
    filter, '-captured_at', 500
  );
  const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const recent = appearances.filter(a =>
    a.captured_at && new Date(a.captured_at).getTime() > cutoff
  );
  return {
    flight_count_last_180_days: recent.length,
    avg_altitude: recent.length > 0
      ? Math.round(recent.reduce((s, a) => s + (a.altitude_ft || 0), 0) / recent.length)
      : null,
    last_seen_at: recent[0]?.captured_at || null,
    ground_ratio: recent.length > 0
      ? Math.round((recent.filter(a => a.on_ground).length / recent.length) * 100) / 100
      : 0,
  };
}