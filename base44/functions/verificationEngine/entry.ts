import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { ToolLoopAgent, tool, stepCountIs, hasToolCall } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';
import { normalizeRegistration, supabaseRest, evidenceConfidence } from '../_shared/aircraftTwin.ts';

// Evidence-gathering agent. Conversational work belongs to the in-app agent.
// OpenSky is deliberately isolated behind openSkyActivityEvidence: it is an
// activity/evidence signal, never an airworthiness, ownership or compliance source.

const MODULES = ['registry', 'identity', 'ownership', 'activity', 'document'];

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

    const invoke = async (name: string, payload: Record<string, unknown>) => {
      const res = await base44.functions.invoke(name, payload);
      return res?.data ?? null;
    };

    const claims: Array<Record<string, unknown>> = [];
    const recordClaim = (entry: Record<string, unknown>) => {
      claims.push({
        aircraft_id: registration,
        verification_session_id: session.id,
        timestamp: new Date().toISOString(),
        status: 'unverified',
        ...entry,
      });
    };

    const { baseURL, token } = base44.aiGateway.connection();
    const models = createOpenAICompatible({ name: 'base44', baseURL, apiKey: token });

    const agent = new ToolLoopAgent({
      model: models('automatic'),
      instructions: [
        `You are verifying aircraft ${registration} for a buyer.`,
        'Call lookupRegistry first - it establishes identity, ownership and the',
        'icao24 the activity check needs. Then check activity and filings.',
        'Judge each module only against returned source evidence:',
        'verified when a source confirms it, conflict when sources disagree,',
        'unverified when no source covers it. Never invent a finding.',
        'OpenSky activity is not proof of ownership, airworthiness, AD/SB/STC/AW',
        'compliance, or inactivity. No OpenSky observation means UNKNOWN, not inactive.',
        'When every module has an answer, call submitVerdict exactly once.',
      ].join(' '),
      tools: {
        lookupRegistry: tool({
          description: 'FAA/international registry record: owner, serial, model, status, icao24.',
          inputSchema: z.object({}),
          execute: async () => {
            const data = await invoke('registryLookup', { registration });
            recordClaim({
              module: 'registry',
              source: data?.source || 'registryLookup',
              claim: 'registry_record',
              observed_value: data?.found ? 'found' : 'not_found',
              evidence: data?.aircraft || {},
              confidence: evidenceConfidence(data?.found ? 90 : 0),
            });
            return data ?? { found: false };
          },
        }),
        checkLiveActivity: tool({
          description: 'Anonymous OpenSky activity observation for the registry-resolved icao24. This is evidence only.',
          inputSchema: z.object({ icao24: z.string().describe('Mode-S hex code, e.g. a1b2c3') }),
          execute: async ({ icao24 }) => {
            const data = await invoke('openSkyActivityEvidence', {
              icao24: String(icao24).toLowerCase(),
              registration,
            });
            const observed = data?.status === 'OBSERVED' && data?.found === true;
            recordClaim({
              module: 'activity',
              source: 'opensky_network',
              source_role: 'activity_evidence',
              claim: 'aircraft_activity_observation',
              observed_value: observed ? 'observed' : 'unknown',
              evidence: data || {},
              confidence: evidenceConfidence(observed ? 80 : 0),
            });
            return data ?? {
              found: false,
              status: 'UNKNOWN',
              source: 'opensky_network',
            };
          },
        }),
        checkFilings: tool({
          description: 'FAA document filing signals: bills of sale, security agreements, releases, latest filing date.',
          inputSchema: z.object({}),
          execute: async () => {
            const nNumber = registration.replace(/^N/i, '');
            const rows = await supabaseRest(
              `faa_ati_signals?select=*&n_number=eq.${encodeURIComponent(nNumber)}&limit=1`
            ).catch(() => null);
            const signal = rows?.[0] || null;
            recordClaim({
              module: 'document',
              source: 'faa_ati_signals',
              claim: 'filing_history',
              observed_value: signal ? String(signal.total_docs ?? '') : 'none',
              evidence: signal || {},
              confidence: evidenceConfidence(signal ? 70 : 0),
            });
            return signal ?? { found: false };
          },
        }),
        submitVerdict: tool({
          description: 'Record the final verification result. Call once, when every module has an answer.',
          inputSchema: z.object({
            verification_confidence: z.number().min(0).max(100),
            registry_status: z.string(),
            identity_status: z.string(),
            ownership_status: z.string(),
            activity_status: z.string(),
            document_status: z.string(),
          }),
          execute: async (verdict) => {
            await base44.entities.VerificationSession.update(session.id, {
              ...verdict,
              status: 'completed',
              completed_at: new Date().toISOString(),
            });
            return { recorded: true };
          },
        }),
      },
      stopWhen: [stepCountIs(10), hasToolCall('submitVerdict')],
    });

    await agent.generate({ prompt: `Verify ${registration}. Modules: ${MODULES.join(', ')}.` });

    for (const claim of claims) {
      await base44.entities.VerificationClaim.create(claim);
    }

    const finalSession = await base44.entities.VerificationSession.get(session.id);
    if (finalSession?.status !== 'completed') {
      await base44.entities.VerificationSession.update(session.id, {
        status: 'review_required',
        completed_at: new Date().toISOString(),
      });
    }

    return Response.json({
      session_id: session.id,
      registration,
      session: await base44.entities.VerificationSession.get(session.id),
      claims: claims.length,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});
