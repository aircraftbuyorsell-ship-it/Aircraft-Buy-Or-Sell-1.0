import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { ToolLoopAgent, tool, stepCountIs, hasToolCall } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';
import { normalizeRegistration, supabaseRest, evidenceConfidence } from '../_shared/aircraftTwin.ts';

// Verification is evidence aggregation, not a blanket compliance clearance.
// Every module must distinguish VERIFIED evidence from UNKNOWN/MISSING evidence.
// OpenSky is activity evidence only; it is never an airworthiness/compliance source.
const MODULES = ['registry', 'identity', 'ownership', 'activity', 'damage', 'ad', 'sb', 'stc', 'airworthiness', 'document'];
const STATUS = { VERIFIED: 'verified', REVIEW: 'review_required', UNKNOWN: 'unverified', CONFLICT: 'conflict' };

function evidenceStatus({ found = false, conflict = false, review = false } = {}) {
  if (conflict) return STATUS.CONFLICT;
  if (review) return STATUS.REVIEW;
  if (found) return STATUS.VERIFIED;
  return STATUS.UNKNOWN;
}

function safeText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch (_) { return String(value); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const registration = normalizeRegistration(body.registration);
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    const session = await base44.entities.VerificationSession.create({
      aircraft_id: registration,
      verification_session_id: crypto.randomUUID(),
      status: 'running',
      started_at: new Date().toISOString(),
      initiated_by: user.id,
    });

    const invoke = async (name, payload) => {
      try {
        const res = await base44.functions.invoke(name, payload);
        return res?.data ?? null;
      } catch (_) {
        return null;
      }
    };

    const claims = [];
    const recordClaim = (entry) => claims.push({
      aircraft_id: registration,
      verification_session_id: session.id,
      timestamp: new Date().toISOString(),
      status: STATUS.UNKNOWN,
      ...entry,
    });

    const { baseURL, token } = base44.aiGateway.connection();
    const models = createOpenAICompatible({ name: 'base44', baseURL, apiKey: token });

    const agent = new ToolLoopAgent({
      model: models('automatic'),
      instructions: [
        `You are verifying aircraft ${registration}.`,
        'First resolve registry identity. Then run activity and evidence checks.',
        'Do not convert missing data into a negative finding. Use UNKNOWN when a source does not cover the aircraft.',
        'AD/STC catalog hits identify potentially applicable records, not compliance failure.',
        'Compliance can only be VERIFIED when the returned evidence supports compliance for this aircraft.',
        'OpenSky proves observation/activity only and never proves ownership, airworthiness, AD, SB or STC compliance.',
        'Damage findings require an actual accident/damage source or aircraft-specific disclosure evidence.',
        'Call submitVerdict exactly once after all checks have returned.',
      ].join(' '),
      tools: {
        lookupRegistry: tool({
          description: 'Resolve registry identity, owner, serial, model and ICAO24.',
          inputSchema: z.object({}),
          execute: async () => {
            const data = await invoke('registryLookup', { registration });
            const found = !!data?.found;
            const aircraft = data?.aircraft || {};
            recordClaim({ module: 'registry', source: data?.source || 'registryLookup', claim: 'registry_record', observed_value: found ? 'found' : 'not_found', evidence: aircraft, confidence: evidenceConfidence(found ? 90 : 0), status: evidenceStatus({ found }) });
            recordClaim({ module: 'identity', source: data?.source || 'registryLookup', claim: 'aircraft_identity', observed_value: found && (aircraft.serial_number || aircraft.model) ? 'resolved' : 'unknown', evidence: { serial_number: aircraft.serial_number, manufacturer: aircraft.manufacturer, model: aircraft.model, icao24: aircraft.mode_s_hex || aircraft.icao24 }, confidence: evidenceConfidence(found && (aircraft.serial_number || aircraft.model) ? 90 : 0), status: evidenceStatus({ found: found && !!(aircraft.serial_number || aircraft.model) }) });
            recordClaim({ module: 'ownership', source: data?.source || 'registryLookup', claim: 'registered_owner_record', observed_value: found && aircraft.registered_owner ? 'present' : 'unknown', evidence: { owner_present: !!aircraft.registered_owner }, confidence: evidenceConfidence(found && aircraft.registered_owner ? 85 : 0), status: evidenceStatus({ found: found && !!aircraft.registered_owner }) });
            return data ?? { found: false };
          },
        }),
        checkLiveActivity: tool({
          description: 'Check anonymous OpenSky activity for the registry-resolved ICAO24.',
          inputSchema: z.object({ icao24: z.string() }),
          execute: async ({ icao24 }) => {
            const data = await invoke('openSkyActivityEvidence', { icao24: String(icao24).toLowerCase(), registration });
            const observed = data?.status === 'OBSERVED' && data?.found === true;
            recordClaim({ module: 'activity', source: 'opensky_network', source_role: 'activity_evidence', claim: 'aircraft_activity_observation', observed_value: observed ? 'observed' : 'unknown', evidence: data || {}, confidence: evidenceConfidence(observed ? 80 : 0), status: evidenceStatus({ found: observed }) });
            return data ?? { found: false, status: 'UNKNOWN', source: 'opensky_network' };
          },
        }),
        checkTechnicalEvidence: tool({
          description: 'Inspect ABOS federated aircraft data for damage history, FAA AD/STC catalog evidence, SB documents and airworthiness evidence.',
          inputSchema: z.object({}),
          execute: async () => {
            const data = await invoke('aircraftDataHub', { registration });
            if (!data?.found) {
              for (const [module, claim] of [['damage','damage_history'], ['ad','applicable_ad_records'], ['sb','service_bulletin_evidence'], ['stc','stc_catalog_evidence'], ['airworthiness','airworthiness_evidence']]) {
                recordClaim({ module: module === 'ad' || module === 'sb' || module === 'stc' ? 'compliance' : module, source: 'aircraftDataHub', claim, observed_value: 'unknown', evidence: {}, confidence: evidenceConfidence(0), status: STATUS.UNKNOWN });
              }
              return { found: false };
            }

            const ci = data.compliance_intelligence || {};
            const cert = data.certificates || {};
            const damage = cert.damage_history_check || {};
            const sb = cert.sb || {};
            const ads = Array.isArray(ci.ads) ? ci.ads : [];
            const stcs = Array.isArray(ci.stcs) ? ci.stcs : [];

            // Catalog presence is never treated as non-compliance. It creates a review task.
            recordClaim({ module: 'compliance', source: 'faa_ad', claim: 'applicable_ad_catalog_records', observed_value: ads.length ? `${ads.length}_candidate_records` : 'unknown', evidence: { count: ads.length, items: ads }, confidence: evidenceConfidence(ads.length ? 75 : 0), status: ads.length ? STATUS.REVIEW : STATUS.UNKNOWN });
            recordClaim({ module: 'compliance', source: 'vault_or_datahub', claim: 'service_bulletin_evidence', observed_value: sb.available ? 'documents_available' : 'unknown', evidence: sb, confidence: evidenceConfidence(sb.available ? 55 : 0), status: sb.available ? STATUS.REVIEW : STATUS.UNKNOWN });
            recordClaim({ module: 'compliance', source: 'faa_stc', claim: 'stc_catalog_records', observed_value: stcs.length ? `${stcs.length}_candidate_records` : 'unknown', evidence: { count: stcs.length, items: stcs }, confidence: evidenceConfidence(stcs.length ? 65 : 0), status: stcs.length ? STATUS.REVIEW : STATUS.UNKNOWN });
            recordClaim({ module: 'damage', source: 'aircraftDataHub', claim: 'aircraft_damage_history_evidence', observed_value: damage.available ? 'aircraft_specific_evidence_present' : 'unknown', evidence: { available: !!damage.available }, confidence: evidenceConfidence(damage.available ? 60 : 0), status: damage.available ? STATUS.REVIEW : STATUS.UNKNOWN });
            recordClaim({ module: 'airworthiness', source: 'faa_registry', claim: 'airworthiness_certificate_evidence', observed_value: cert.airworthiness?.available ? 'certificate_date_present' : 'unknown', evidence: cert.airworthiness || {}, confidence: evidenceConfidence(cert.airworthiness?.available ? 70 : 0), status: cert.airworthiness?.available ? STATUS.REVIEW : STATUS.UNKNOWN });
            return data;
          },
        }),
        checkEasaEvidence: tool({
          description: 'For non-US registrations, retrieve EASA AD/PAD/SIB evidence already supported by ABOS. This is applicability evidence, not compliance proof.',
          inputSchema: z.object({}),
          execute: async () => {
            if (registration.startsWith('N')) return { skipped: true, reason: 'US registration' };
            const data = await invoke('easaAdLookup', { registration });
            const hasEvidence = !!data && !data.error;
            recordClaim({ module: 'compliance', source: 'easa_ad_database', claim: 'easa_ad_evidence', observed_value: hasEvidence ? 'returned' : 'unknown', evidence: data || {}, confidence: evidenceConfidence(hasEvidence ? 65 : 0), status: hasEvidence ? STATUS.REVIEW : STATUS.UNKNOWN });
            return data ?? { status: 'UNKNOWN' };
          },
        }),
        submitVerdict: tool({
          description: 'Record the final verification result after all modules have been checked.',
          inputSchema: z.object({
            verification_confidence: z.number().min(0).max(100),
            registry_status: z.string(), identity_status: z.string(), ownership_status: z.string(), activity_status: z.string(),
            damage_status: z.string(), ad_status: z.string(), sb_status: z.string(), stc_status: z.string(), airworthiness_status: z.string(),
            document_status: z.string(),
          }),
          execute: async (verdict) => {
            await base44.entities.VerificationSession.update(session.id, {
              ...verdict,
              status: ['review_required', 'unverified', 'conflict'].some((value) => Object.values(verdict).includes(value)) ? 'review_required' : 'completed',
              completed_at: new Date().toISOString(),
            });
            return { recorded: true };
          },
        }),
      },
      stopWhen: [stepCountIs(14), hasToolCall('submitVerdict')],
    });

    await agent.generate({ prompt: `Verify ${registration}. Required modules: ${MODULES.join(', ')}.` });

    for (const claim of claims) await base44.entities.VerificationClaim.create(claim);

    const finalSession = await base44.entities.VerificationSession.get(session.id);
    if (finalSession?.status !== 'completed' && finalSession?.status !== 'review_required') {
      await base44.entities.VerificationSession.update(session.id, { status: 'review_required', completed_at: new Date().toISOString() });
    }

    return Response.json({
      session_id: session.id,
      registration,
      verification: {
        status: finalSession?.status || 'review_required',
        confidence: finalSession?.verification_confidence ?? null,
        modules: {
          registry: finalSession?.registry_status || 'unverified', identity: finalSession?.identity_status || 'unverified', ownership: finalSession?.ownership_status || 'unverified',
          activity: finalSession?.activity_status || 'unverified', damage: finalSession?.damage_status || 'unverified', ad: finalSession?.ad_status || 'unverified',
          sb: finalSession?.sb_status || 'unverified', stc: finalSession?.stc_status || 'unverified', airworthiness: finalSession?.airworthiness_status || 'unverified',
        },
      },
      claims: claims.length,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
