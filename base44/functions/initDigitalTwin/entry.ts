import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Federated Digital Twin initializer.
// Creates/refreshes an ATIPassport anchored to a registration (N-Number),
// aggregating optional data providers via Promise.allSettled.
// Every missing provider becomes a data_gaps note — never a hard failure.

function normalizeReg(input) {
  const clean = String(input || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

function registryBaselineScore(faa) {
  const fields = [
    faa.n_number, faa.serial_number, faa.mfr_mdl_code, faa.eng_mfr_mdl,
    faa.year_mfr, faa.name, faa.expiration_date, faa.air_worth_date, faa.mode_s_hex,
  ];
  const completeness = fields.filter(Boolean).length;
  const base = Math.min(7, Math.floor(completeness / 2));
  const keys = ['documentation', 'technical', 'transparency', 'transaction_ready',
    'usage_mission', 'storage_exposure', 'config_clarity', 'market_readiness'];
  const dims = {};
  keys.forEach((k, i) => { dims[k] = Math.max(3, Math.min(12, base + (i % 4))); });
  const total = Object.values(dims).reduce((s, v) => s + v, 0);
  return { dims, total };
}

function labelFromTotal(total) {
  if (total >= 108) return 'EXCEPTIONAL';
  if (total >= 90) return 'STRONG BUY';
  if (total >= 72) return 'FAIR';
  if (total >= 54) return 'CAUTION';
  if (total >= 36) return 'RED FLAGS';
  return 'AVOID';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const reg = normalizeReg(body.registration || body.n_number);
    if (!reg) return Response.json({ error: 'registration required' }, { status: 400 });

    const nLookup = reg.replace(/^N/, '');
    const svc = base44.asServiceRole.entities;

    // ── CORE provider: FAA registry ──
    const faaRecs = await svc.FAAAircraft.filter({ n_number: nLookup }, '-created_date', 1);
    const faa = faaRecs[0];
    if (!faa) {
      return Response.json({ ok: false, error: `Aircraft ${reg} not found in FAA registry`, found: false }, { status: 404 });
    }

    const dataGaps = [];

    // ── OPTIONAL providers — federated, skip-if-missing ──
    const [engineRes, trafficRes, docRes, listingRes, escrowRes, maintenanceRes] = await Promise.allSettled([
      faa.eng_mfr_mdl
        ? svc.EngineSpec.filter({ engine_code: faa.eng_mfr_mdl.trim() }, '-created_date', 1)
        : Promise.resolve([]),
      svc.TrafficAppearance.filter({ registration: reg }, '-captured_at', 100),
      svc.FAADocIndex.filter({ n_number: nLookup }, '-created_date', 1),
      svc.AircraftListing.filter({ registration: reg }, '-created_date', 1),
      svc.EscrowTransaction.filter({ aircraft_label: { $regex: reg } }, '-created_date', 10),
      base44.functions.invoke('calculateEngineMaintenance', { registration: reg }),
    ]);

    // Engine spec
    const engineSpec = engineRes.status === 'fulfilled' ? engineRes.value[0] : null;
    if (!engineSpec) {
      dataGaps.push(faa.eng_mfr_mdl
        ? `Engine spec not mapped for code: ${faa.eng_mfr_mdl}`
        : 'No engine code on FAA registration');
    }

    // ADS-B traffic
    const traffic = trafficRes.status === 'fulfilled' ? trafficRes.value : [];
    if (traffic.length === 0) dataGaps.push('No ADS-B traffic records observed');

    // FAA document filings
    const docIndex = docRes.status === 'fulfilled' ? docRes.value[0] : null;
    if (!docIndex) dataGaps.push('No transactional documents indexed (Bill of Sale, Security Agreements)');

    // Marketplace listing (optional layer)
    const listing = listingRes.status === 'fulfilled' ? listingRes.value[0] : null;

    // Escrow history
    const escrows = escrowRes.status === 'fulfilled' ? escrowRes.value : [];
    if (escrows.length === 0) dataGaps.push('No ABOS escrow transaction history');

    if (!faa.air_worth_date) dataGaps.push('Airworthiness date not on record');
    if (!listing) dataGaps.push('Market forecast unavailable — no active market data for this aircraft');

    // ── Find or create the passport (keyed by registration, NOT listing) ──
    const existing = await svc.ATIPassport.filter({ registration: reg }, '-created_date', 1);
    const now = new Date().toISOString();

    const maintenance = maintenanceRes.status === 'fulfilled' ? maintenanceRes.value?.data?.results?.[0] : null;
    const engineHours = maintenance?.current_engine_hours ?? listing?.engine_hours ?? null;
    const tboHours = maintenance?.tbo_hours ?? engineSpec?.tbo_hours ?? null;
    const remainingPct = maintenance?.remaining_pct ?? ((engineHours != null && tboHours)
      ? Math.max(0, Math.round(((tboHours - engineHours) / tboHours) * 100))
      : null);

    const twinData = {
      registration: reg,
      faa_aircraft_id: faa.id,
      icao_hex: faa.mode_s_hex || '',
      serial_number: faa.serial_number || '',
      data_gaps: dataGaps,
      is_for_sale: !!(listing && listing.status === 'active'),
      engine_spec_id: engineSpec?.id || null,
      engine_tbo_hours: tboHours,
      engine_remaining_pct: remainingPct,
      twin_last_synced_at: now,
    };
    if (listing) twinData.listing = listing.id;

    let passport;
    if (existing.length > 0) {
      passport = existing[0];
      await svc.ATIPassport.update(passport.id, twinData);
    } else {
      const { dims, total } = registryBaselineScore(faa);
      passport = await svc.ATIPassport.create({
        ...twinData,
        ...dims,
        ati_total: total,
        score_label: labelFromTotal(total),
        ai_summary: `Digital Twin initialized from FAA registry for ${reg}. Baseline score reflects registry data completeness only — full verification requires logbooks and documentation.`,
        ati_version: 'digital_twin_v1',
        twin_initialized_at: now,
        broker_agreement_status: 'none',
      });
    }

    return Response.json({
      ok: true,
      passportId: passport.id,
      registration: reg,
      providers: {
        faa_registry: { status: 'ok', owner: faa.name, year: faa.year_mfr, status_code: faa.status_code },
        engine_spec: engineSpec
          ? { status: 'ok', manufacturer: engineSpec.manufacturer, model: engineSpec.model_name, tbo_hours: engineSpec.tbo_hours }
          : { status: 'skipped' },
        adsb_traffic: traffic.length > 0
          ? { status: 'ok', sightings: traffic.length, last_seen: traffic[0]?.captured_at }
          : { status: 'skipped' },
        faa_documents: docIndex
          ? { status: 'ok', total_docs: docIndex.total_docs, bos_count: docIndex.bos_count }
          : { status: 'skipped' },
        marketplace: listing ? { status: 'ok', listingId: listing.id, for_sale: listing.status === 'active' } : { status: 'skipped' },
        escrow_history: escrows.length > 0 ? { status: 'ok', count: escrows.length } : { status: 'skipped' },
      },
      data_gaps: dataGaps,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});