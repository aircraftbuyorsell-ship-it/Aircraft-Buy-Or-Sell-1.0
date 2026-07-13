import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DIMENSION_KEYS = [
  'documentation', 'technical', 'transparency', 'transaction_ready',
  'usage_mission', 'storage_exposure', 'config_clarity', 'market_readiness',
];

function normalizeNNumber(nNumber) {
  const clean = String(nNumber || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

function scoreFromRecord(faaRecord) {
  const data = faaRecord.data || faaRecord;
  const fields = [
    data.n_number, data.serial_number, data.mfr_mdl_code, data.eng_mfr_mdl,
    data.year_mfr, data.name, data.expiration_date, data.air_worth_date, data.mode_s_hex,
  ];
  const completeness = fields.filter(Boolean).length;
  const base = Math.min(7, Math.floor(completeness / 2));
  const dimensions = {};
  for (let i = 0; i < DIMENSION_KEYS.length; i++) {
    dimensions[DIMENSION_KEYS[i]] = Math.max(3, Math.min(12, base + i));
  }
  const total = Object.values(dimensions).reduce((s, v) => s + v, 0);
  return { dimensions, total };
}

function labelFromTotal(total) {
  if (total >= 108) return 'EXCEPTIONAL';
  if (total >= 90) return 'STRONG BUY';
  if (total >= 72) return 'FAIR';
  if (total >= 54) return 'CAUTION';
  if (total >= 36) return 'RED FLAGS';
  return 'AVOID';
}

function cardCode(reg, sequence) {
  const regClean = (reg || '').replace(/[^A-Z0-9]/g, '');
  return `ATI-US-FAA-${regClean}-${String(sequence).padStart(6, '0')}-V1`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { n_number, icao24, registration, aircraft_type, callsign } = await req.json();
    const nNum = normalizeNNumber(n_number || registration || '');
    if (!nNum) {
      return Response.json({ error: 'n_number or registration required' }, { status: 400 });
    }

    const nLookup = nNum.replace(/^N/, '');

    // 1) Look up FAA record
    const faaRecs = await base44.asServiceRole.entities.FAAAircraft.filter(
      { n_number: nLookup }, '-created_date', 1
    );
    const faaRecord = faaRecs[0];
    if (!faaRecord) {
      return Response.json({ error: `FAA record not found for ${nNum}`, ok: false }, { status: 404 });
    }

    // 2) Check if listing already exists for this registration
    const existing = await base44.asServiceRole.entities.AircraftListing.filter(
      { registration: nNum }, '-created_date', 1
    );
    if (existing.length > 0) {
      const listing = existing[0];
      // Check if ATI card already exists
      const cards = await base44.asServiceRole.entities.ATICard.filter(
        { listing: listing.id }, '-created_date', 1
      );
      if (cards.length > 0) {
        return Response.json({
          ok: true,
          action: 'already_exists',
          listingId: listing.id,
          cardCode: cards[0].public_card_code,
          atiScore: listing.ati_score,
        });
      }
    }

    const data = faaRecord.data || faaRecord;
    const year = Number(data.year_mfr) || null;
    const reg = nNum;

    // Determine make/model from FAA data
    const make = data.name?.split(' ').slice(0, 2).join(' ') || 'Unknown';
    const model = data.mfr_mdl_code || aircraft_type || 'Unknown';

    const { dimensions, total } = scoreFromRecord(data);
    const scoreLabel = labelFromTotal(total);
    const aircraftLabel = `${year || ''} ${make} ${model} ${reg}`.trim();
    const age = year ? new Date().getFullYear() - year : 20;
    const omvmValue = Math.round(Math.max(8000, 80000 * Math.exp(-0.03 * age) / 1000) * 1000);

    // 3) Create AircraftListing
    const listingPayload = {
      registration: reg,
      make,
      model,
      year,
      ati_score: total,
      omvm_value: omvmValue,
      status: 'active',
      visibility: 'public',
      ai_summary: `FAA registry-matched live traffic aircraft. ICAO24: ${icao24 || data.mode_s_hex || '—'}. Type: ${data.type_aircraft || aircraft_type || '—'}.`,
      owner: user.id,
    };
    if (data.serial_number) listingPayload.serial_number = data.serial_number;

    let listing;
    if (existing.length > 0) {
      listing = existing[0];
      await base44.asServiceRole.entities.AircraftListing.update(listing.id, listingPayload);
    } else {
      listing = await base44.asServiceRole.entities.AircraftListing.create(listingPayload);
    }

    // 4) Create ATIPassport
    const passport = await base44.entities.ATIPassport.create({
      listing: listing.id,
      registration: reg,
      faa_aircraft_id: faaRecord.id,
      triggered_by: user.id,
      ati_total: total,
      ...dimensions,
      score_label: scoreLabel,
      ai_summary: `Live-traffic matched FAA registry ATI score for ${aircraftLabel}. Based solely on FAA registration data completeness. Full verification with logbooks recommended before transaction.`,
      strengths: [
        'FAA registration record matched',
        data.mode_s_hex ? `ADS-B capable (Mode-S: ${data.mode_s_hex})` : null,
        data.expiration_date ? 'Active registration' : null,
        data.air_worth_date ? 'Airworthiness certificate on record' : null,
      ].filter(Boolean).join('\n'),
      risks: [
        'No uploaded logbooks',
        'No verified maintenance history',
        'FAA-registry-only score — needs logbook verification',
      ].join('\n'),
      recommendations: [
        'Request full airframe and engine logbooks',
        'Verify annual inspection currency',
        'Confirm AD compliance',
        'Verify title and lien status',
      ].join('\n'),
      missing_data: [
        'Logbooks', 'Annual inspection records', 'Damage history', 'Avionics equipment list',
      ].join('\n'),
      deal_radar_eligible: false,
      co_ownership_viable: false,
      ati_version: 'traffic_faa_sync_v1',
    });

    // 5) Create ATICard
    const existingCards = await base44.asServiceRole.entities.ATICard.list('-sequence_number', 1);
    const sequence = (existingCards[0]?.sequence_number || 0) + 1;

    const card = await base44.asServiceRole.entities.ATICard.create({
      public_card_code: cardCode(reg, sequence),
      sequence_number: sequence,
      listing: listing.id,
      aircraft_registration: reg,
      aircraft_label: aircraftLabel,
      aircraft_region: 'US',
      aircraft_class: 'SEP',
      aircraft_model_token: model.substring(0, 4).toUpperCase(),
      card_version: 1,
      card_type: 'basic',
      status: 'issued',
      issuer_entity: 'ABOS',
      issuer_email: user.email,
      card_owner_email: user.email,
      attribution_model: 'first_verified_source',
      origin_source: 'live_traffic_sync',
      distribution_chain_depth: 0,
      payout_status: 'none',
      view_count: 0,
      share_count: 0,
      issued_at: new Date().toISOString(),
    });

    const maintenanceResponse = await base44.functions.invoke('calculateEngineMaintenance', {
      registration: reg,
      listing_id: listing.id,
      passport_id: passport.id,
    });
    const maintenance = maintenanceResponse.data?.results?.[0] || null;

    return Response.json({
      ok: true,
      action: 'created',
      listingId: listing.id,
      passportId: passport.id,
      cardCode: card.public_card_code,
      atiScore: total,
      scoreLabel,
      registration: reg,
      aircraftLabel,
      dimensions,
      maintenance,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});