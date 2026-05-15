import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DIMENSION_KEYS = [
  'documentation',
  'technical',
  'transparency',
  'transaction_ready',
  'usage_mission',
  'storage_exposure',
  'config_clarity',
  'market_readiness',
];

function normalizeNNumber(nNumber) {
  const clean = String(nNumber || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

function matchesModel(record, model) {
  const data = record.data || record;
  const haystack = [data.mfr_mdl_code, data.type_aircraft, data.eng_mfr_mdl]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  if (model === 'C172') return /C172|172/.test(haystack) && !/152/.test(haystack);
  if (model === 'C152') return /C152|152/.test(haystack);
  if (model === 'PA28') return /PA-?28|P28[A-Z]?/.test(haystack);
  return false;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function scoreFromRecord(data, model) {
  const fields = [
    data.n_number,
    data.serial_number,
    data.mfr_mdl_code,
    data.eng_mfr_mdl,
    data.year_mfr,
    data.name,
    data.expiration_date,
    data.air_worth_date,
    data.mode_s_hex,
  ];
  const completeness = fields.filter(Boolean).length;
  const base = model === 'C172' ? 7 : 6;
  const perDimension = DIMENSION_KEYS.map((_, index) => Math.max(3, Math.min(12, base + Math.floor(completeness / 3) - (index % 3))));
  const dimensions = Object.fromEntries(DIMENSION_KEYS.map((key, index) => [key, perDimension[index]]));
  const total = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
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

function cardCode(model, sequence) {
  return `ATI-US-SEP-${model}-${String(sequence).padStart(6, '0')}-V1`;
}

async function loadCandidates(base44) {
  const all = [];
  for (let skip = 0; skip < 5000; skip += 500) {
    const batch = await base44.asServiceRole.entities.FAAAircraft.list('-created_date', 500, skip);
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 500) break;
  }
  return all;
}

async function createForRecord(base44, user, record, model, sequence) {
  const data = record.data || record;
  const registration = normalizeNNumber(data.n_number);
  const year = Number(data.year_mfr) || null;
  const make = model === 'PA28' ? 'Piper' : 'Cessna';
  const modelLabel = model === 'C172' ? '172' : model === 'C152' ? '152' : 'PA-28';
  const { dimensions, total } = scoreFromRecord(data, model);
  const scoreLabel = labelFromTotal(total);
  const aircraftLabel = `${year || ''} ${make} ${modelLabel} ${registration}`.trim();

  const listing = await base44.asServiceRole.entities.AircraftListing.create({
    registration,
    make,
    model: modelLabel,
    year,
    serial_number: data.serial_number,
    avionics: data.mode_s_hex ? `Mode-S ${data.mode_s_hex}` : 'FAA registry record',
    status: 'active',
    visibility: 'public',
    ati_score: total,
    ai_summary: `FAA registry based ATI card generated for ${aircraftLabel}.`,
    owner: user.id,
  });

  const passport = await base44.entities.ATIPassport.create({
    listing: listing.id,
    triggered_by: user.id,
    ati_total: total,
    ...dimensions,
    score_label: scoreLabel,
    ai_summary: `Registry-derived ATI score for ${aircraftLabel}. Scoring reflects FAA data completeness only and should be verified with logbooks before transaction use.`,
    strengths: ['FAA registration record found', data.mode_s_hex ? 'Mode-S hex available' : null, data.expiration_date ? 'Registration expiration date available' : null].filter(Boolean).join('\n'),
    risks: ['No uploaded maintenance records', 'No verified logbook evidence', 'Registry-only score is preliminary'].join('\n'),
    recommendations: ['Request full airframe and engine logs', 'Verify annual inspection status', 'Confirm AD compliance and title status'].join('\n'),
    missing_data: ['Logbooks', 'Annual inspection records', 'Damage history disclosure', 'Avionics equipment list'].join('\n'),
    deal_radar_eligible: false,
    co_ownership_viable: false,
    ati_version: 'faa_registry_batch_v1',
  });

  const card = await base44.asServiceRole.entities.ATICard.create({
    public_card_code: cardCode(model, sequence),
    sequence_number: sequence,
    listing: listing.id,
    aircraft_registration: registration,
    aircraft_label: aircraftLabel,
    aircraft_region: 'US',
    aircraft_class: 'SEP',
    aircraft_model_token: model,
    card_version: 1,
    card_type: 'basic',
    status: 'issued',
    issuer_entity: 'ABOS',
    issuer_email: user.email,
    card_owner_email: user.email,
    attribution_model: 'first_verified_source',
    origin_source: 'faa_registry_batch',
    distribution_chain_depth: 0,
    payout_status: 'none',
    view_count: 0,
    share_count: 0,
    issued_at: new Date().toISOString(),
  });

  return { registration, model, listingId: listing.id, passportId: passport.id, cardCode: card.public_card_code, atiTotal: total, scoreLabel };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let payload = {};
    if (req.method === 'POST') {
      payload = await req.json().catch(() => ({}));
    }

    const requestedModels = Array.isArray(payload.models) && payload.models.length ? payload.models : ['C172', 'C152'];
    const count = Number(payload.count) || 10;

    const existingCards = await base44.asServiceRole.entities.ATICard.list('-sequence_number', 1);
    let sequence = (existingCards[0]?.sequence_number || 0) + 1;

    const candidates = await loadCandidates(base44);
    const selectedByModel = Object.fromEntries(
      requestedModels.map(model => [model, shuffle(candidates.filter(record => matchesModel(record, model))).slice(0, count)])
    );

    const insufficient = Object.entries(selectedByModel).filter(([, records]) => records.length < count);
    if (insufficient.length) {
      return Response.json({
        error: 'Not enough FAAAircraft records found',
        found: Object.fromEntries(Object.entries(selectedByModel).map(([model, records]) => [model, records.length])),
      }, { status: 400 });
    }

    const created = [];
    for (const model of requestedModels) {
      for (const record of selectedByModel[model]) {
        created.push(await createForRecord(base44, user, record, model, sequence));
        sequence += 1;
      }
    }

    return Response.json({ ok: true, created_count: created.length, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});