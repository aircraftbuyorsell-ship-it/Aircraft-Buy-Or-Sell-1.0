import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { normalizeRegistration, supabaseRest } from '../_shared/aircraftTwin.ts';

const NTSB_API_BASE = 'https://api.ntsb.gov/public';
const NTSB_SOURCE = 'https://www.ntsb.gov/Pages/AviationQueryV2.aspx';
const FAA_SDR_SOURCE = 'https://www.faa.gov/av-info/download_SDR';

function firstValue(item: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    if (item[name] !== undefined && item[name] !== null && String(item[name]).trim() !== '') return item[name];
  }
  return null;
}

function normalizeNtsbRecords(payload: unknown, registration: string) {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).data ||
        (payload as Record<string, unknown>).results ||
        (payload as Record<string, unknown>).items ||
        (payload as Record<string, unknown>).value ||
        [])
      : [];

  if (!Array.isArray(candidates)) return [];

  return candidates.map((raw) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      case_number: firstValue(item, ['NTSBNumber', 'NTSB_Number', 'ntsbNumber', 'CaseNumber', 'caseNumber']),
      registration: normalizeRegistration(
        String(firstValue(item, ['AircraftRegistrationNumber', 'aircraftRegistrationNumber', 'Registration', 'registration']) || registration),
      ),
      event_date: firstValue(item, ['EventDate', 'eventDate', 'AccidentDate', 'accidentDate']),
      event_type: firstValue(item, ['EventType', 'eventType', 'AccidentType', 'accidentType']),
      damage: firstValue(item, ['AircraftDamage', 'aircraftDamage', 'Damage', 'damage']),
      make: firstValue(item, ['Make', 'make', 'AircraftMake', 'aircraftMake']),
      model: firstValue(item, ['Model', 'model', 'AircraftModel', 'aircraftModel']),
      city: firstValue(item, ['City', 'city']),
      state: firstValue(item, ['State', 'state']),
      country: firstValue(item, ['Country', 'country']),
      synopsis: firstValue(item, ['Synopsis', 'synopsis', 'EventNarrative', 'eventNarrative']),
      source_url: NTSB_SOURCE,
      raw: item,
    };
  }).filter((record) => record.registration === registration || !record.registration);
}

async function fetchNtsbDirect(registration: string) {
  const key = Deno.env.get('NTSB_API_KEY') || Deno.env.get('NTSB_SUBSCRIPTION_KEY');
  if (!key) return { configured: false, records: [], error: 'NTSB_API_KEY not configured' };

  const variants = [registration, registration.startsWith('N') ? registration.slice(1) : registration];
  let lastStatus = 0;
  for (const value of [...new Set(variants)]) {
    const url = `${NTSB_API_BASE}/api/Aviation/v1/GetAviationCasesFiltered/?aircraftRegistrationNumber=${encodeURIComponent(value)}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Ocp-Apim-Subscription-Key': key,
      },
    });
    lastStatus = response.status;
    if (response.status === 204) continue;
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`NTSB API ${response.status}${body ? `: ${body.slice(0, 300)}` : ''}`);
    }
    const payload = await response.json();
    const records = normalizeNtsbRecords(payload, registration);
    if (records.length) return { configured: true, records, status: response.status };
  }
  return { configured: true, records: [], status: lastStatus };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const registration = normalizeRegistration(body.registration);
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    const faaRegistration = registration.startsWith('N') ? registration.slice(1) : registration;

    let ntsb = [];
    let faa = [];
    let sourceErrors: string[] = [];
    let ntsbDirect = false;

    // Prefer the official NTSB Aviation API when its subscription key is configured.
    try {
      const direct = await fetchNtsbDirect(registration);
      if (direct.configured) {
        ntsb = direct.records;
        ntsbDirect = true;
      }
    } catch (error) {
      sourceErrors.push(`NTSB API unavailable: ${error?.message || String(error)}`);
    }

    // Supabase remains a durable evidence cache/fallback for NTSB data.
    if (!ntsbDirect) {
      try {
        ntsb = await supabaseRest(
          `abos_ntsb_aviation_cases?registration=eq.${encodeURIComponent(registration)}&select=case_number,event_date,event_type,damage,make,model,city,state,country,synopsis,source_url,source_updated_at&order=event_date.desc&limit=50`,
        ) || [];
      } catch (error) {
        sourceErrors.push(`NTSB store unavailable: ${error?.message || String(error)}`);
      }
    }

    try {
      const variants = [registration, faaRegistration].filter(Boolean);
      const filters = variants.map((v) => `registration.eq.${encodeURIComponent(v)}`).join(',');
      faa = await supabaseRest(
        `abos_faa_sdr?or=(${filters})&select=control_number,difficulty_date,submitter_type,make,model,component,description,source_year,source_url&order=difficulty_date.desc&limit=100`,
      ) || [];
    } catch (error) {
      sourceErrors.push(`FAA SDR store unavailable: ${error?.message || String(error)}`);
    }

    return Response.json({
      registration,
      status: ntsb.length || faa.length ? 'REVIEW_REQUIRED' : 'UNKNOWN',
      verified_damage_event_found: Boolean(ntsb.length),
      ntsb: {
        found: Boolean(ntsb.length),
        count: ntsb.length,
        records: ntsb,
        source: ntsbDirect ? NTSB_API_BASE : NTSB_SOURCE,
        source_mode: ntsbDirect ? 'official_api' : 'supabase_cache',
      },
      faa_sdr: {
        found: Boolean(faa.length),
        count: faa.length,
        records: faa,
        source: FAA_SDR_SOURCE,
      },
      source_errors: sourceErrors,
      semantics: {
        no_record: 'UNKNOWN',
        record_found: 'REVIEW_REQUIRED',
        never_damaged_claim_allowed: false,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
