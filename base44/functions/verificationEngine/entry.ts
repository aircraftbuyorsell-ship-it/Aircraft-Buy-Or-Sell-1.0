import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizeRegistration, resolveAircraftTwin, supabaseRest, evidenceConfidence, buildAircraftTwinPatch } from '../_shared/aircraftTwin.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('ABOS_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('ABOS_SUPABASE_SERVICE_ROLE_KEY');
const DAY_MS = 86400000;
const MODULES = ['registry', 'identity', 'ownership', 'activity', 'service', 'documents'];

async function sb(path: string, init: RequestInit = {}) { return supabaseRest(path, init); }

async function createSession(userId: string | null, twin: any, registration: string, inputType: string, context: unknown) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const rows = await sb('verification_sessions', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ aircraft_id: twin?.id || registration, passport_id: twin?.id || null, registration, input_type: inputType, status: 'running', user_id: userId, started_at: new Date().toISOString(), context }) });
  return rows?.[0] || null;
}

async function writeEvidence(sessionId: string | null, aircraft: string, passportId: string | null, items: any[]) {
  if (!sessionId || !items.length || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  await sb('verification_evidence', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(items.map((x) => ({ session_id: sessionId, passport_id: passportId, aircraft_id: aircraft, source_type: x.source_type || 'system', source_name: x.source_name || 'ABOS Verification Engine', claim_key: x.claim_key, observed_value: x.observed_value ?? null, normalized_value: x.normalized_value ?? null, status: x.status || 'observed', confidence: evidenceConfidence(x.confidence), evidence: x.evidence || {}, module: x.module || null, observed_at: new Date().toISOString(), timestamp: new Date().toISOString() }))) });
}

async function finishSession(sessionId: string | null, summary: any) {
  if (!sessionId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  await sb(`verification_sessions?id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed', verification_confidence: summary.verification_confidence, ati_score: summary.ati_score, summary, completed_at: new Date().toISOString() }) });
}

async function entityRows(base44: any, entity: string, filter: any, limit = 20) {
  try { const api = base44.asServiceRole?.entities?.[entity] || base44.entities?.[entity]; if (!api?.filter) return []; return await api.filter(filter, '-created_date', limit); } catch (_) { return []; }
}

async function resolveInput(base44: any, raw: string, inputType: string) {
  const value = normalizeRegistration(raw);
  if (inputType !== 'serial') return { registration: value, serial: null, original: value };
  const rows = await entityRows(base44, 'FAAAircraft', { serial_number: raw.trim() }, 5);
  if (rows[0]?.n_number) return { registration: `N${String(rows[0].n_number).replace(/^N/i, '')}`, serial: rows[0].serial_number || raw.trim(), original: value };
  const global = await entityRows(base44, 'GlobalRegistry', { serial_number: raw.trim() }, 5);
  if (global[0]?.registration) return { registration: normalizeRegistration(global[0].registration), serial: global[0].serial_number || raw.trim(), original: value };
  return { registration: value, serial: raw.trim(), original: value };
}

async function registry(base44: any, reg: string) {
  const n = reg.replace(/^N/i, '').replace(/[^A-Z0-9]/gi, '');
  if (reg.startsWith('N') && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const rows = await sb(`faa_registry?n_number=eq.${encodeURIComponent(n)}&select=id,n_number,serial_number,mfr_mdl_code,year_mfr,name,status_code,mode_s_code_hex,state,country,air_worth_date,expiration_date&limit=1`);
      const row = rows?.[0];
      if (row) return { found: true, source: 'supabase_faa_registry', registration: `N${row.n_number}`, serial_number: row.serial_number || null, manufacturer: row.mfr_mdl_code || null, model: row.mfr_mdl_code || null, year: row.year_mfr || null, status: row.status_code || null, registration_status: row.status_code || null, mode_s_hex: row.mode_s_code_hex || null, registered_owner: row.name || null, state: row.state || null, country: row.country || 'US', faa_registry_id: row.id };
    } catch (_) {}
  }
  let faa = [];
  if (reg.startsWith('N')) faa = await entityRows(base44, 'FAAAircraft', { n_number: n }, 1);
  let row = faa[0] || null;
  if (!row) { const cached = await entityRows(base44, 'GlobalRegistry', { registration: reg }, 1); row = cached[0] || null; }
  if (row) return { found: true, source: row.n_number ? 'faa_registry_cache' : 'global_registry_cache', registration: reg, serial_number: row.serial_number || null, manufacturer: row.make || row.manufacturer || null, model: row.model || null, year: row.year_mfr || row.year || null, status: row.status_code || row.status || null, registration_status: row.status_code || row.status || null, mode_s_hex: row.mode_s_hex || null, registered_owner: row.name || row.registered_owner || null, state: row.state || null, country: row.country || 'United States' };
  try {
    const r = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(reg)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    const j = r.ok ? await r.json() : null; const a = j?.response?.aircraft;
    if (a) return { found: true, source: 'adsbdb', registration: a.registration || reg, serial_number: null, manufacturer: a.manufacturer || null, model: a.type || null, year: null, status: null, registration_status: 'unknown', mode_s_hex: a.mode_s || null, registered_owner: a.registered_owner || null, state: null, country: a.registered_owner_country_name || null };
  } catch (_) {}
  return { found: false, source: null, registration: reg, serial_number: null, manufacturer: null, model: null, year: null, status: null, registration_status: 'unknown', mode_s_hex: null, registered_owner: null, state: null, country: null };
}

async function activity(base44: any, reg: string) {
  let appearances: any[] = [];
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try { appearances = await sb(`live_traffic?registration=eq.${encodeURIComponent(reg)}&select=recorded_at,latitude,longitude,altitude_ft,ground_speed_kt,heading,on_ground&order=recorded_at.desc&limit=50`) || []; } catch (_) {}
  }
  if (!appearances.length) appearances = await entityRows(base44, 'TrafficAppearance', { registration: reg }, 50);
  let live: any = null;
  try { const r = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(reg)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }); const j = r.ok ? await r.json() : null; live = j?.response?.aircraft || null; } catch (_) {}
  const last = appearances[0]; const days = last?.captured_at ? Math.floor((Date.now() - new Date(last.captured_at).getTime()) / DAY_MS) : null;
  return { appearances_count: appearances.length, last_seen: last?.captured_at || null, days_since_last_seen: days, live, status: days == null ? (live ? 'LIVE_UNKNOWN_HISTORY' : 'NO_TRACKING') : days < 30 ? 'ACTIVE' : days < 90 ? 'INACTIVE' : days < 120 ? 'GROUNDED_90D' : 'LONG_GROUNDED' };
}

async function moduleProbe(base44: any, reg: string, names: string[]) {
  for (const name of names) { const rows = await entityRows(base44, name, { registration: reg }, 50); if (rows.length) return { found: true, entity: name, count: rows.length, records: rows.slice(0, 10) }; }
  return { found: false, entity: null, count: 0, records: [] };
}

function confidence(modules: any) {
  const weights: Record<string, number> = { registry: 0.25, identity: 0.20, ownership: 0.15, activity: 0.10, service: 0.15, documents: 0.15 };
  let score = 0; for (const key of MODULES) { const m = modules[key]; const c = Number(m?.confidence ?? (m?.verified ? 90 : m?.found ? 70 : 20)); score += c * weights[key]; }
  return Math.round(score * 100) / 100;
}
function atiFromVerification(v: number, conflicts: number) { return Math.max(0, Math.min(120, Math.round((v / 100) * 120 - conflicts * 8))); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({})); const raw = body.registration || body.serial || body.query;
    if (!raw) return Response.json({ error: 'registration, serial or query required' }, { status: 400 });
    const inputType = body.serial ? 'serial' : body.registration ? 'registration' : 'query';
    const resolved = await resolveInput(base44, raw, inputType); const reg = normalizeRegistration(resolved.registration);
    let twin = await resolveAircraftTwin(reg, { serial_number: resolved.serial || null });
    if (!twin?.id) throw new Error('Unable to resolve canonical aircraft Digital Twin');
    const session = await createSession(user.id || null, twin, reg, inputType, { entry: body.entry || 'verify', original_input: raw, requested_modules: MODULES });
    const aircraft = twin.id; const evidence: any[] = [];

    const r = await registry(base44, reg); const registryVerified = r.found && !!r.registration;
    const identityConflict = r.found && reg !== normalizeRegistration(r.registration || reg);
    const identity = { verified: !!r.found && !!r.serial_number, confidence: r.found ? (r.serial_number ? 95 : 70) : 10, registration_match: !identityConflict, serial_number: r.serial_number || resolved.serial, manufacturer: r.manufacturer, model: r.model, year: r.year };
    let ownershipHistory: any[] = [];
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try { ownershipHistory = await sb(`ownership_history?passport_id=eq.${encodeURIComponent(twin.id)}&select=owner_name,owner_type,owner_country,from_date,to_date,is_current,source&order=sequence.asc&limit=50`) || []; } catch (_) {}
    }
    const ownership = { verified: !!r.registered_owner || ownershipHistory.length > 0, confidence: ownershipHistory.length ? 90 : (r.registered_owner ? 75 : 15), registered_owner: r.registered_owner || ownershipHistory.find(x => x.is_current)?.owner_name || null, history_count: ownershipHistory.length, seller_consistency: body.seller ? (!!r.registered_owner || ownershipHistory.length > 0) && ownershipHistory.some(x => String(x.owner_name || '').toUpperCase().includes(String(body.seller).toUpperCase())) : null };
    const act = await activity(base44, reg);
    const service = await moduleProbe(base44, reg, ['ServiceRecord', 'MaintenanceRecord', 'FAAServiceRecord', 'ADRecord', 'ServiceEvent']);
    let documents: any = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try { const docs = await sb(`documents?passport_id=eq.${encodeURIComponent(twin.id)}&select=id,document_type,file_name,is_verified,verified_at,created_at&order=created_at.desc&limit=50`) || []; documents = { found: docs.length > 0, entity: 'supabase_documents', count: docs.length, records: docs.slice(0, 10) }; } catch (_) {}
    }
    if (!documents?.found) documents = await moduleProbe(base44, reg, ['AircraftDocument', 'AircraftDocumentRecord', 'VerificationDocument', 'DocumentRecord', 'UploadedDocument']);
    const conflicts = Number(identityConflict) + (ownership.seller_consistency === false ? 1 : 0);
    const modules = { registry: { verified: registryVerified, confidence: registryVerified ? 95 : 5, ...r }, identity, ownership, activity: { verified: act.status !== 'NO_TRACKING', confidence: act.live || act.appearances_count ? 75 : 20, ...act }, service: { verified: service.found, confidence: service.found ? 70 : 20, ...service }, documents: { verified: documents.found, confidence: documents.found ? 70 : 20, ...documents } };

    for (const [module, data] of Object.entries(modules)) evidence.push({ module, source_type: 'verification', source_name: data.source || 'ABOS Verification Engine', claim_key: `${module}.verified`, observed_value: data, normalized_value: { verified: data.verified, confidence: data.confidence }, confidence: data.confidence, status: data.verified ? 'verified' : 'unverified', evidence: { session_id: session?.id || null } });
    if (r.serial_number || resolved.serial) evidence.push({ module: 'identity', source_type: 'registry', source_name: r.source || 'input', claim_key: 'aircraft.serial_number', observed_value: r.serial_number || resolved.serial, normalized_value: r.serial_number || resolved.serial, confidence: 95 });
    if (identityConflict) evidence.push({ module: 'identity', source_type: 'consistency', source_name: 'ABOS Verification Engine', claim_key: 'registration.identity_conflict', observed_value: { input: reg, registry: r.registration }, normalized_value: { conflict: true }, confidence: 99, status: 'conflict' });

    const verificationConfidence = confidence(modules); const atiScore = atiFromVerification(verificationConfidence, conflicts);
    const twinPatch = buildAircraftTwinPatch({ registration: reg, registry: r, activity: act });
    await sb(`aircraft_passports?id=eq.${encodeURIComponent(twin.id)}`, { method: 'PATCH', body: JSON.stringify(twinPatch) });
    const result = { verification_session_id: session?.id || null, aircraft_id: aircraft, registration: reg, original_input: raw, status: conflicts ? 'verified_with_conflicts' : 'verified', verification_confidence: verificationConfidence, ati_score: atiScore, conflicts, modules, evidence_trail: evidence, handoff: { target: 'ABOS Assistant', available: true, prompt: conflicts ? `Investigate ${conflicts} verification discrepancy(ies) for ${reg}.` : `Continue intelligence analysis for ${reg}.` } };
    await writeEvidence(session?.id || null, aircraft, twin.id, evidence); await finishSession(session?.id || null, result);
    return Response.json(result);
  } catch (error) { return Response.json({ error: error?.message || 'Verification engine failed' }, { status: 500 }); }
});
