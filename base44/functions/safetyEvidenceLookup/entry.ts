import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { normalizeRegistration, supabaseRest } from '../_shared/aircraftTwin.ts';

const NTSB_SOURCE = 'https://www.ntsb.gov/Pages/AviationQueryV2.aspx';
const FAA_SDR_SOURCE = 'https://www.faa.gov/av-info/download_SDR';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const registration = normalizeRegistration(body.registration);
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    // FAA SDR stores US registrations without the leading N.
    const faaRegistration = registration.startsWith('N') ? registration.slice(1) : registration;

    let ntsb = [];
    let faa = [];
    let sourceErrors: string[] = [];

    try {
      ntsb = await supabaseRest(
        `abos_ntsb_aviation_cases?registration=eq.${encodeURIComponent(registration)}&select=case_number,event_date,event_type,damage,make,model,city,state,country,synopsis,source_url,source_updated_at&order=event_date.desc&limit=50`,
      ) || [];
    } catch (error) {
      sourceErrors.push(`NTSB store unavailable: ${error?.message || String(error)}`);
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
        source: NTSB_SOURCE,
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
