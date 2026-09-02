import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ToolLoopAgent, tool, stepCountIs, hasToolCall } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';
import { normalizeRegistration, supabaseRest, evidenceConfidence } from '../_shared/aircraftTwin.ts';

// Evidence-gathering agent. Its own code owns the loop (see Base44's ai-gateway
// guidance): it queries each source, then calls submitVerdict exactly once.
// Conversational work belongs to the st_elmo in-app agent, not here.

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

    // Sources are called through these closures so the model can only reach the
    // three it is given, with the registration fixed from the request rather
    // than chosen by the model.
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
        'Judge each module against what the sources actually returned:',
        '"verified" when a source confirms it, "conflict" when two sources',
        'disagree, "unverified" when no source covers it. Never invent a',
        'finding, and never mark something verified because it seems plausible.',
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
          description: 'Live ADS-B state for this aircraft by icao24 (hex). Needs icao24 from lookupRegistry.',
          inputSchema: z.object({ icao24: z.string().describe('Mode-S hex code, e.g. a1b2c3') }),
          execute: async ({ icao24 }) => {
            const data = await invoke('openSky', { action: 'state', icao24: String(icao24).toLowerCase() });
            recordClaim({
              module: 'activity',
              // OpenSky Network data is provided as-is and unlicensed; the
              // source is recorded on every claim so downstream reports can
              // attribute it (Schafer et al., IPSN 2014).
              source: 'opensky_network',
              claim: 'live_activity',
              observed_value: data?.state ? 'contact' : 'no_contact',
              evidence: data || {},
              confidence: evidenceConfidence(data?.state ? 80 : 20),
            });
            return data ?? { state: null };
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
