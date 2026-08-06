// ABOS ATI + OMVM handlers.
//
// Replaces the n8n "ATI Score Pipeline" and consolidates valuation onto a
// single canonical engine.
//
// The split that makes this reproducible:
//
//   the NUMBER    -> omvmV5Score in Base44. Deterministic arithmetic. The model
//                    never sees a blank price field to fill in; it is handed the
//                    figure and told not to change it.
//   the JUDGEMENT -> Claude. Eight dimension scores and prose. Temperature 0.
//
// The old pipeline asked one prompt for both, which is why the same aircraft
// scored differently on consecutive runs.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5';

// Keys are the ATIPassport column names. The MEANINGS are the ones
// orchestrateATIScoring uses, which is the canonical mapping — the same three
// columns were being used for entirely different quantities by
// marketExpertValuation, so labels travel with the key from here on.
const DIMENSIONS = [
  { key: 'documentation',     label: 'Documentation Completeness' },
  { key: 'technical',         label: 'Maintenance Traceability' },
  { key: 'transparency',      label: 'Engine Health' },
  { key: 'transaction_ready', label: 'Avionics Quality' },
  { key: 'usage_mission',     label: 'Usage / Mission Risk' },
  { key: 'storage_exposure',  label: 'Storage & Exposure' },
  { key: 'config_clarity',    label: 'Configuration Clarity' },
  { key: 'market_readiness',  label: 'Market Readiness' },
];

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}

// ── Deterministic card ID ──────────────────────────────────────────────
// The n8n pipeline used Math.random(), so re-scoring one aircraft produced a
// new card every time and nothing could be reconciled. Hashing the normalised
// input means identical input yields an identical card ID, and any change to
// the input is visible as a different ID.
async function cardId(canonicalInput) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalInput)
  );
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `ABOS-${new Date().getUTCFullYear()}-${hex.slice(0, 10).toUpperCase()}`;
}

function canonicalise(aircraft = {}, listingText = '') {
  const keys = Object.keys(aircraft).sort();
  const parts = keys.map((k) => `${k}=${String(aircraft[k] ?? '').trim().toLowerCase()}`);
  parts.push(`listing=${listingText.trim().replace(/\s+/g, ' ').toLowerCase()}`);
  return parts.join('|');
}

// ── Base44 calls ───────────────────────────────────────────────────────

async function callBase44(env, baseUrl, fn, payload) {
  const res = await fetch(`${baseUrl}/functions/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-secret': env.GATEWAY_SECRET || '',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${fn} returned non-JSON (${res.status})`);
  }
  if (!res.ok) throw new Error(parsed?.error || `${fn} failed (${res.status})`);
  return parsed;
}

// ── Provenance ─────────────────────────────────────────────────────────
// Every figure carries where it came from and with what weight. This is what
// lets a caller decide whether a given answer is redistributable: an answer
// built purely from ABOS-owned data is, one leaning on a licensed third-party
// feed may not be. The disclosure label from piloterrTradeProxy is carried
// through here rather than dropped, which is what happens today.

function buildProvenance(omvm) {
  const sources = [];
  const compSample = omvm.comp_sample ?? 0;
  const live = omvm.market_intelligence || {};
  const liveN = live.live_listings_count ?? 0;

  const usedLiveOnly = omvm.fallback_reason === 'live_market_only';
  const modelWeight = usedLiveOnly ? 0 : live.live_market_avg ? 0.7 : 1.0;
  const liveWeight = usedLiveOnly ? 1.0 : live.live_market_avg ? 0.3 : 0;

  if (compSample > 0 || modelWeight > 0) {
    sources.push({
      source: 'abos_comparables',
      weight: Number(modelWeight.toFixed(2)),
      n: compSample,
      label: 'ABOS listing comparables',
      redistributable: true,
    });
  }
  if (liveWeight > 0) {
    sources.push({
      source: 'piloterr_market',
      weight: Number(liveWeight.toFixed(2)),
      n: liveN,
      label: live.source_label || 'Aggregated market data · Source: Trade-A-Plane (via Piloterr)',
      redistributable: false,
    });
  }

  return {
    sources,
    // True only when nothing in the figure depends on a third-party feed.
    fully_owned: sources.every((s) => s.redistributable),
    data_source: omvm.market_intelligence?.market_data_source || 'none',
  };
}

// ── /omvm ──────────────────────────────────────────────────────────────

export async function handleOmvm(request, env, baseUrl) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { listing_id, aircraft } = body || {};
  if (!listing_id && !aircraft) {
    return json({ error: 'listing_id_or_aircraft_required' }, 400);
  }

  let omvm;
  try {
    omvm = await callBase44(env, baseUrl, 'omvmV5Score', { listing_id, aircraft });
  } catch (err) {
    return json({ error: 'valuation_engine_unavailable', detail: err.message }, 502);
  }

  // The engine now refuses to invent a figure; pass that refusal through
  // rather than substituting one here.
  if (omvm.status !== 'ok') {
    return json({
      status: omvm.status,
      omvm_value: null,
      message: omvm.message,
      comp_sample: omvm.comp_sample ?? 0,
      provenance: buildProvenance(omvm),
    });
  }

  return json({
    status: 'ok',
    omvm_value: omvm.omvm_value,
    value_low: omvm.value_low ?? null,
    value_high: omvm.value_high ?? null,
    confidence: omvm.confidence,
    comp_sample: omvm.comp_sample ?? 0,
    engine_version: 'omvm-v5.1',
    provenance: buildProvenance(omvm),
  });
}

// ── /ati/score ─────────────────────────────────────────────────────────

function buildSystemPrompt() {
  return [
    'You are the ATI (Aircraft Transparency Index) scoring agent for ABOS.',
    'Return ONLY valid JSON. No markdown fences, no commentary outside the JSON.',
    '',
    'Score eight dimensions, 0-15 each, total 0-120. Use these exact JSON keys;',
    'the key names are historical and do not always describe what is scored, so',
    'go by the description, not the key:',
    '1. documentation      - logbook and records completeness',
    '2. technical          - MAINTENANCE TRACEABILITY: AD compliance, maintenance trail',
    '3. transparency       - ENGINE HEALTH: SMOH against TBO, compressions, oil analysis.',
    '                        Cap at 7 when SMOH is not stated.',
    '4. transaction_ready  - AVIONICS QUALITY: GPS/WAAS 3, autopilot 3, glass 2,',
    '                        ADS-B 3, IFR 2, weather 2',
    '5. usage_mission      - private 13-15, training 5-8, commercial 0-4',
    '6. storage_exposure   - hangared dry 13-15, outdoor coastal 0-4',
    '7. config_clarity     - spec consistency, STC documentation',
    '8. market_readiness   - annual freshness, photography, pre-buy readiness',
    '',
    'Labels: 96-120 EXCELLENT | 76-95 GOOD | 56-75 FAIR | 36-55 BELOW_AVG | 0-35 POOR',
    'Never award 96+ without a current annual, stated SMOH and clean history.',
    'Always flag absent ADS-B.',
    '',
    'CRITICAL: the market valuation is supplied to you as a fixed input. It was',
    'computed by a separate deterministic engine. Do not estimate, adjust,',
    'recompute or second-guess it. Reference it in your prose only.',
    '',
    'Score strictly on evidence present in the listing. Absent information is',
    'not neutral - it lowers the relevant dimension and belongs in missing_data.',
    'This score is a published statement of reasons, so every dimension note',
    'must point at the specific evidence, or its absence, that drove the number.',
    '',
    'JSON shape:',
    '{ "dimensions": { "documentation": {"score":0,"notes":""}, ... all eight ... },',
    '  "verdict": "", "review_text": "", "red_flags": [], "strengths": [],',
    '  "missing_data": [],',
    '  "capex": {"engine_overhaul":0,"avionics_upgrade":0,"maintenance_backlog":0,"total":0} }',
  ].join('\n');
}

function buildUserPrompt(aircraft = {}, listingText = '', omvm) {
  const spec = Object.entries(aircraft)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const valuation =
    omvm.status === 'ok'
      ? `Market valuation (fixed input, do not recompute): ${omvm.omvm_value} USD, confidence ${omvm.confidence}, based on ${omvm.comp_sample} comparables.`
      : 'Market valuation: UNAVAILABLE - not enough comparable data. Do not invent one. Say so plainly in review_text.';

  return `${valuation}\n\nStructured data:\n${spec || '(none supplied)'}\n\nListing text:\n${listingText || '(none supplied)'}\n\nReturn the ATI JSON now.`;
}

async function scoreWithClaude(env, aircraft, listingText, omvm) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ATI_MODEL || DEFAULT_MODEL,
      max_tokens: 3000,
      temperature: 0, // 0, not 0.2 — the same listing must score the same twice
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(aircraft, listingText, omvm) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`anthropic ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .replace(/```json\s*|```/g, '')
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('model returned unparseable output');
    return JSON.parse(match[0]);
  }
}

export async function handleAtiScore(request, env, baseUrl) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'scoring_unavailable', detail: 'ANTHROPIC_API_KEY not set' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const aircraft = body.aircraft_data || body.aircraft || {};
  const listingText = body.listing_text || '';
  if (!listingText && Object.keys(aircraft).length === 0) {
    return json({ error: 'listing_text_or_aircraft_data_required' }, 400);
  }

  // 1. Number first, from the canonical engine.
  let omvm;
  try {
    omvm = await callBase44(env, baseUrl, 'omvmV5Score', {
      listing_id: body.listing_id,
      aircraft,
    });
  } catch (err) {
    omvm = { status: 'engine_unavailable', message: err.message, comp_sample: 0 };
  }

  // 2. Judgement second, with the number pinned.
  let scored;
  try {
    scored = await scoreWithClaude(env, aircraft, listingText, omvm);
  } catch (err) {
    return json({ error: 'scoring_failed', detail: err.message }, 502);
  }

  // 3. Trust the arithmetic over the model's own total.
  const dims = scored.dimensions || {};
  let total = 0;
  const dimensions = {};
  for (const { key, label } of DIMENSIONS) {
    const raw = Number(dims[key]?.score);
    const score = Number.isFinite(raw) ? Math.max(0, Math.min(15, Math.round(raw))) : 0;
    dimensions[key] = { score, max: 15, label, notes: dims[key]?.notes || '' };
    total += score;
  }

  const label =
    total >= 96 ? 'EXCELLENT'
    : total >= 76 ? 'GOOD'
    : total >= 56 ? 'FAIR'
    : total >= 36 ? 'BELOW_AVG'
    : 'POOR';

  const askingPrice = Number(aircraft.askingPrice || aircraft.asking_price || 0) || null;
  const deviationPct =
    omvm.status === 'ok' && askingPrice
      ? Number((((askingPrice - omvm.omvm_value) / omvm.omvm_value) * 100).toFixed(1))
      : null;

  const id = await cardId(canonicalise(aircraft, listingText));

  const card = {
    status: 'ok',
    card_id: id,
    score_version: 'ati-v2.1',
    ati_score: total,
    score_label: label,
    dimensions,
    verdict: scored.verdict || '',
    review_text: scored.review_text || '',
    red_flags: scored.red_flags || [],
    strengths: scored.strengths || [],
    missing_data: scored.missing_data || [],
    capex: scored.capex || null,
    omvm: {
      status: omvm.status,
      value: omvm.status === 'ok' ? omvm.omvm_value : null,
      confidence: omvm.status === 'ok' ? omvm.confidence : null,
      comp_sample: omvm.comp_sample ?? 0,
      asking_price: askingPrice,
      deviation_pct: deviationPct,
      engine_version: 'omvm-v5.1',
      provenance: buildProvenance(omvm),
    },
    // Article 50(1) AI Act: the prose and dimension notes are machine-generated
    // and must say so wherever they are displayed. DSA statement of reasons:
    // the dimension notes are the reasoning, published alongside the score.
    disclosure: {
      ai_generated: ['dimensions.*.notes', 'verdict', 'review_text', 'red_flags', 'strengths'],
      deterministic: ['ati_score', 'omvm.value'],
      model: env.ATI_MODEL || DEFAULT_MODEL,
      notice: 'Dimension notes and narrative are AI-generated. The ATI total and the market valuation are computed, not generated.',
    },
    generated_at: new Date().toISOString(),
  };

  // Persist. A scoring run that is not recorded is a card that evaporates,
  // which is exactly what happens the moment the n8n Sheets writer is turned
  // off. Registration is the passport key, so without one there is nothing to
  // upsert against and the card is returned unsaved rather than silently lost.
  const registration = String(aircraft.registration || aircraft.reg || '').trim().toUpperCase();
  if (registration) {
    try {
      const saved = await callBase44(env, baseUrl, 'persistAtiPassport', {
        ...card,
        registration,
        listing_id: body.listing_id,
        omvm: { ...card.omvm, market_intelligence: omvm.market_intelligence },
      });
      card.passport_id = saved.passport_id || null;
      card.persisted = saved.action || null;
    } catch (err) {
      // The score is still worth returning; the caller just needs to know it
      // did not land.
      card.passport_id = null;
      card.persisted = 'failed';
      card.persist_error = err.message;
    }
  } else {
    card.persisted = 'skipped_no_registration';
  }

  return json(card);
}
