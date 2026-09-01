import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ═══════════════════════════════════════════════════════════════
// ATI Scoring Engine — Native Claude call + Deterministic Clamps
// ═══════════════════════════════════════════════════════════════

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ATI_CONFIG = {
  MAX_MODULE: 15,
  MODULE_COUNT: 8,
  MAX_TOTAL: 120,
  ENGINE_NO_SMOH_CAP: 7,
  EXCELLENT_FLOOR: 96,
  EXCELLENT_CLAMP: 95,
  DEAL_RADAR_MIN_SCORE: 100,
  DEAL_RADAR_MAX_DEVIATION_PCT: -8,
  LABELS: [
    { min: 96, label: 'EXCELLENT' },
    { min: 76, label: 'GOOD' },
    { min: 56, label: 'FAIR' },
    { min: 36, label: 'BELOW_AVG' },
    { min: 0,  label: 'POOR' },
  ],
};

const MODULE_KEYS = [
  'documentation', 'maintenance', 'engine_health', 'avionics',
  'usage_mission', 'storage_exposure', 'config_clarity', 'market_readiness',
];

const SYSTEM_PROMPT = `You are the ATI (Aircraft Transparency Index) Scoring Agent for ABOS.
Return ONLY valid JSON. No markdown, no prose outside the JSON.

ATI FRAMEWORK — 120 points, 8 modules × 15:
1. documentation        logbooks, records completeness
2. maintenance          AD compliance, maintenance trail
3. engine_health        SMOH vs TBO, compressions, oil analysis
4. avionics             GPS/WAAS, autopilot, glass, ADS-B, IFR, weather
5. usage_mission        private high / training mid / commercial low
6. storage_exposure     hangared-dry high / outdoor-coastal low
7. config_clarity       spec consistency, STC documentation
8. market_readiness     annual freshness, photos, pre-buy ready

Score each module 0–15 on the evidence in the listing. Be conservative when
data is missing. Provide a short "notes" string per module explaining the score.

Also return:
- omvm: {range_low, range_mid, range_high, asking, confidence, market_position}
  (confidence is your honest read; you have no live comps, so default LOW/ESTIMATE)
- capex: {engine_overhaul, avionics_upgrade, maintenance_backlog, total,
          engine_smoh, engine_tbo, time_to_overhaul, overhaul_cost_est}
- red_flags[], strengths[], missing_data[], verdict, review_text

Do NOT compute ati_score, score_label, or deal_radar — the backend computes those.
Just score the 8 modules honestly.

JSON shape:
{ aircraft, registration, year, verdict,
  omvm:{...}, dimensions:{documentation:{score,max:15,notes}, ...all 8...},
  capex:{...}, red_flags:[], strengths:[], missing_data:[], review_text:"" }`;

// ─────────────── Helpers ───────────────

function clamp(n, lo, hi) {
  if (typeof n !== 'number' || Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function labelFor(score) {
  for (const band of ATI_CONFIG.LABELS) {
    if (score >= band.min) return band.label;
  }
  return 'POOR';
}

function hasSmoh(aircraft, listingText) {
  const t = (listingText || '').toLowerCase();
  const structured = aircraft.engineTime != null && String(aircraft.engineTime).trim() !== '' && String(aircraft.engineTime) !== '?';
  const textual = /\bsmoh\b|since (major )?overhaul|tsmoh|since oh|fresh (engine )?overhaul/.test(t);
  return structured || textual;
}

function hasFreshAnnual(aircraft, listingText) {
  const a = (aircraft.annualStatus || '').toLowerCase();
  const t = (listingText || '').toLowerCase();
  if (/not stated|expired|unknown|n\/a/.test(a)) return false;
  return /fresh annual|annual \d{4}|fresh 100|annual current|annual inspection (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(a + ' ' + t);
}

function hasCleanHistory(aircraft, listingText) {
  const d = (aircraft.damageHistory || '').toLowerCase();
  const t = (listingText || '').toLowerCase();
  if (/damage|incident|accident|substantial repair/.test(d) && !/no damage|none/.test(d)) return false;
  return /no damage|zero damage|clean title|no incidents|none reported/.test(d + ' ' + t);
}

function isMissingOnlyFinding(value) {
  return /missing|not (provided|available|found)|unavailable|unknown|no data|no record|not covered|cannot verify/i.test(String(value || ''));
}

function shouldUseInsufficientDataState(ati, aircraft, listingText) {
  const registration = String(aircraft.registration || ati.registration || '').trim().toUpperCase();
  const nonUsRegistration = registration && !registration.startsWith('N');
  const missing = Array.isArray(ati.missing_data) ? ati.missing_data : [];
  const risks = Array.isArray(ati.red_flags) ? ati.red_flags : [];

  // Missing FAA coverage for an international registration is a coverage gap,
  // not evidence that the aircraft is unsafe or should be avoided.
  const faaGap = nonUsRegistration && /FAA|US registry|FAA data/i.test(`${missing.join(' ')} ${risks.join(' ')} ${listingText || ''}`)
    && !/accident|damage|overdue|unairworthy|violation|fraud|lien/i.test(risks.join(' '));

  // A completely unscored aircraft with only missing-data findings must not be
  // converted into a factual AVOID verdict.
  const zeroWithMissingOnly = ati.ati_score === 0 && missing.length > 0
    && risks.length > 0 && risks.every(isMissingOnlyFinding);

  return faaGap || zeroWithMissingOnly;
}

function cardCode(reg, sequence) {
  const clean = (reg || 'XX').replace(/[^A-Z0-9]/g, '');
  return `ATI-US-NTV-${clean}-${String(sequence).padStart(6, '0')}-V1`;
}

// ─────────────── Claude Call ───────────────

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
  return text;
}

function parseClaudeJson(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try { return JSON.parse(cleaned); } catch (_) { /* try regex */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in Claude response');
  return JSON.parse(match[0]);
}

// ─────────────── Deterministic Clamp Engine ───────────────

function applyDeterministicClamps(ati, ctx = {}) {
  const audit = [];
  const aircraft = ctx.aircraft || {};
  const listingText = ctx.listingText || '';
  ati.dimensions = ati.dimensions || {};

  // 1) Clamp every module to 0..15
  for (const key of MODULE_KEYS) {
    const dim = ati.dimensions[key] || { score: 0, max: ATI_CONFIG.MAX_MODULE };
    const before = dim.score;
    dim.score = clamp(Math.round(before), 0, ATI_CONFIG.MAX_MODULE);
    dim.max = ATI_CONFIG.MAX_MODULE;
    if (dim.score !== before) audit.push(`CLAMP_RANGE:${key} ${before}->${dim.score}`);
    ati.dimensions[key] = dim;
  }

  // 2) ENGINE SMOH CAP
  if (!hasSmoh(aircraft, listingText)) {
    const eng = ati.dimensions.engine_health;
    if (eng.score > ATI_CONFIG.ENGINE_NO_SMOH_CAP) {
      audit.push(`CAP_ENGINE_NO_SMOH ${eng.score}->${ATI_CONFIG.ENGINE_NO_SMOH_CAP}`);
      eng.score = ATI_CONFIG.ENGINE_NO_SMOH_CAP;
      eng.notes = (eng.notes ? eng.notes + ' ' : '') + '[capped: SMOH not provided]';
    }
  }

  // 3) Recompute total from clamped sub-scores
  const sum = MODULE_KEYS.reduce((acc, k) => acc + (ati.dimensions[k].score || 0), 0);
  if (ati.ati_score !== sum) {
    audit.push(`SCORE_RECOMPUTED reported=${ati.ati_score} actual=${sum}`);
    ati.ati_score = sum;
  }

  // 4) EXCELLENT (96+) gate
  if (ati.ati_score >= ATI_CONFIG.EXCELLENT_FLOOR) {
    const gates = {
      annual: hasFreshAnnual(aircraft, listingText),
      smoh: hasSmoh(aircraft, listingText),
      clean: hasCleanHistory(aircraft, listingText),
    };
    if (!gates.annual || !gates.smoh || !gates.clean) {
      const failed = Object.entries(gates).filter(([, v]) => !v).map(([k]) => k);
      audit.push(`EXCELLENT_GATE_FAILED missing=[${failed.join(',')}] clamp ${ati.ati_score}->${ATI_CONFIG.EXCELLENT_CLAMP}`);
      const target = ATI_CONFIG.EXCELLENT_CLAMP;
      const factor = target / ati.ati_score;
      let running = 0;
      MODULE_KEYS.forEach((k, i) => {
        if (i === MODULE_KEYS.length - 1) {
          ati.dimensions[k].score = target - running;
        } else {
          const v = clamp(Math.round(ati.dimensions[k].score * factor), 0, ATI_CONFIG.MAX_MODULE);
          ati.dimensions[k].score = v;
          running += v;
        }
      });
      ati.ati_score = MODULE_KEYS.reduce((a, k) => a + ati.dimensions[k].score, 0);
    }
  }

  // 5) Data sufficiency gate before deriving an adverse label. Missing source
  // coverage is not negative evidence. In particular, an international
  // registration without FAA coverage must not become AVOID solely because
  // the FAA dataset has no record.
  const insufficientData = shouldUseInsufficientDataState(ati, aircraft, listingText);
  if (insufficientData) {
    audit.push('INSUFFICIENT_DATA:missing source coverage is not negative evidence');
    ati.score_label = 'INSUFFICIENT_DATA';
    ati.verdict = 'INSUFFICIENT_DATA';
    ati.deal_radar_eligible = false;
    ati.data_sufficiency = 'insufficient';
  }

  // 6) Label derived from score
  const derivedLabel = insufficientData ? 'INSUFFICIENT_DATA' : labelFor(ati.ati_score);
  if (ati.score_label !== derivedLabel) {
    audit.push(`LABEL_CORRECTED ${ati.score_label}->${derivedLabel}`);
    ati.score_label = derivedLabel;
  }

  // 6) OMVM hygiene
  ati.omvm = ati.omvm || {};
  const o = ati.omvm;
  const askingNum = Number(o.asking);
  const midNum = Number(o.range_mid);
  if (!askingNum || !midNum) {
    o.deviation_pct = null;
    o.market_position = 'NO_PRICE';
    audit.push('OMVM_NO_PRICE deviation=null');
  } else {
    o.deviation_pct = Math.round(((askingNum - midNum) / midNum) * 1000) / 10;
  }
  if (!o.confidence || o.confidence === 'HIGH') {
    o.confidence = 'ESTIMATE';
    audit.push('OMVM_CONFIDENCE_FORCED_ESTIMATE');
  }

  // 7) DEAL RADAR
  const eligible = ati.ati_score >= ATI_CONFIG.DEAL_RADAR_MIN_SCORE
    && typeof o.deviation_pct === 'number'
    && o.deviation_pct <= ATI_CONFIG.DEAL_RADAR_MAX_DEVIATION_PCT;
  if (ati.deal_radar_eligible !== eligible) {
    audit.push(`DEAL_RADAR_RESET ${ati.deal_radar_eligible}->${eligible}`);
  }
  ati.deal_radar_eligible = eligible;

  // 8) Attach audit trail
  ati._clamp_audit = audit;
  ati._clamp_version = 'clamp-1.0';

  return { ati, audit };
}

// ═══════════════════════ MAIN HANDLER ═══════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { listingId, listing_text, aircraft_data } = body;

    // ── Resolve input: from listing or raw text ──
    let listing, aircraft, listingText;
    if (listingId) {
      listing = await base44.entities.AircraftListing.get(listingId);
      if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
      aircraft = {
        year: listing.year, make: listing.make, model: listing.model,
        registration: listing.registration, totalTime: listing.total_time,
        engineTime: listing.engine_hours, tbo: listing.tbo,
        annualStatus: listing.last_annual, avionics: listing.avionics,
        price: listing.asking_price,
      };
      listingText = listing_text || [
        `Aircraft: ${listing.year || ''} ${listing.make || ''} ${listing.model || ''} ${listing.registration || ''}`,
        `Total Time: ${listing.total_time || 'N/A'} hrs`,
        `Engine SMOH: ${listing.engine_hours || 'N/A'} hrs, TBO: ${listing.tbo || 'N/A'} hrs`,
        `Last Annual: ${listing.last_annual || 'N/A'}`,
        `Avionics: ${listing.avionics || 'N/A'}`,
        `Asking Price: ${listing.asking_price ? '$' + listing.asking_price.toLocaleString() : 'N/A'}`,
        listing.ai_summary || '',
      ].filter(Boolean).join('\n');
    } else if (listing_text) {
      aircraft = aircraft_data || {};
      listingText = listing_text;
    } else {
      return Response.json({ error: 'listingId or listing_text required' }, { status: 400 });
    }

    // ── Build user prompt ──
    const userPrompt = `Score this aircraft listing using the ATI framework:

${listingText}

Provide ONLY JSON with all 8 dimension scores plus omvm, capex, red_flags, strengths, missing_data, verdict, and review_text.`;

    // ── 1) Call Claude ──
    const raw = await callClaude(SYSTEM_PROMPT, userPrompt);
    const parsed = parseClaudeJson(raw);

    // ── 2) Apply deterministic clamps ──
    const { ati, audit } = applyDeterministicClamps(parsed, { aircraft, listingText });

    // ── 3) OMVM value (compute if listing has price) ──
    const omvmMid = ati.omvm?.range_mid || null;
    const discountPct = ati.omvm?.deviation_pct || null;
    const dealScore = discountPct == null ? null
      : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
      : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;
    const dealLabel = dealScore == null ? null
      : dealScore >= 8.5 ? 'hot deal' : dealScore >= 6.5 ? 'good deal'
      : dealScore >= 5 ? 'fair' : 'overpriced';

    // ── 4) Persist to AircraftListing ──
    let persistListingId = listingId;
    if (!persistListingId && aircraft.make) {
      const newListing = await base44.entities.AircraftListing.create({
        registration: aircraft.registration || ati.registration || null,
        make: aircraft.make || ati.aircraft || 'Unknown',
        model: aircraft.model || '',
        year: aircraft.year || ati.year || null,
        ati_score: ati.ati_score,
        visibility: 'public',
        status: 'active',
        owner: user.id,
      });
      persistListingId = newListing.id;
      listing = newListing;
    }

    if (persistListingId) {
      await base44.entities.AircraftListing.update(persistListingId, {
        ati_score: ati.ati_score,
        omvm_value: omvmMid,
        deal_score: dealScore,
        deal_label: dealLabel,
        discount_pct: discountPct,
        ai_summary: ati.review_text?.slice(0, 500) || listing?.ai_summary || '',
      });
    }

    // ── 5) Persist ATIPassport ──
    const dimensionScores = {};
    for (const k of MODULE_KEYS) {
      dimensionScores[k] = ati.dimensions[k]?.score || 0;
    }

    const passportPayload = {
      listing: persistListingId || 'standalone',
      triggered_by: user.id,
      ati_total: ati.ati_score,
      ...dimensionScores,
      score_label: ati.score_label,
      ai_summary: ati.review_text?.slice(0, 500) || ati.verdict || '',
      strengths: (ati.strengths || []).join('\n'),
      risks: (ati.red_flags || []).join('\n'),
      recommendations: 'Review full ATI report for detailed recommendations.',
      missing_data: (ati.missing_data || []).join('\n'),
      deal_radar_eligible: ati.deal_radar_eligible,
      co_ownership_viable: (aircraft.price || listing?.asking_price || 0) >= 150000,
      omvm_value: omvmMid,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
      ati_version: 'native_v2_clamp-1.0',
    };

    let passport;
    if (persistListingId) {
      passport = await base44.entities.ATIPassport.create(passportPayload);
    }

    // ── 6) Create ATICard ──
    const reg = aircraft.registration || ati.registration || listing?.registration || 'XX';
    const existingCards = await base44.asServiceRole.entities.ATICard.list('-sequence_number', 1);
    const sequence = (existingCards[0]?.sequence_number || 0) + 1;

    const aircraftLabel = [aircraft.year || ati.year || listing?.year || '',
      aircraft.make || ati.aircraft || listing?.make || '',
      aircraft.model || listing?.model || '', reg].filter(Boolean).join(' ').trim();

    const cardPayload = {
      public_card_code: cardCode(reg, sequence),
      sequence_number: sequence,
      listing: persistListingId || 'standalone',
      aircraft_registration: reg,
      aircraft_label: aircraftLabel,
      aircraft_region: 'US',
      aircraft_class: 'SEP',
      aircraft_model_token: (aircraft.model || listing?.model || 'UNK').substring(0, 4).toUpperCase(),
      card_version: 1,
      card_type: 'basic',
      status: 'issued',
      issuer_entity: 'ABOS',
      issuer_email: user.email,
      card_owner_email: user.email,
      attribution_model: 'first_verified_source',
      origin_source: 'native_api',
      distribution_chain_depth: 0,
      payout_status: 'none',
      view_count: 0,
      share_count: 0,
      issued_at: new Date().toISOString(),
    };

    const card = await base44.asServiceRole.entities.ATICard.create(cardPayload);

    return Response.json({
      ok: true,
      listingId: persistListingId,
      passportId: passport?.id || null,
      cardId: card.id,
      cardCode: card.public_card_code,
      atiScore: ati.ati_score,
      scoreLabel: ati.score_label,
      verdict: ati.verdict,
      dealRadarEligible: ati.deal_radar_eligible,
      clampAudit: audit,
      dimensions: dimensionScores,
      // Full report fields (locked behind paywall concept)
      locked: ['omvm', 'capex', 'review_text', 'dimensions_detail'],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});