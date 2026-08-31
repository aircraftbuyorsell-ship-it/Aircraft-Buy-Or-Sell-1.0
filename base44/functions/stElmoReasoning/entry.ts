import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DEFAULT_NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const MAX_REASONING_TOKENS = 4096;

const SYSTEM_PROMPT = `You are ABOS St. Elmo M_1.0, the reasoning and planning layer of Aircraft Buy Or Sell.

You are NOT the authority for aircraft facts, ATI, OMVM, verification, ownership, registry, service history, pricing, or transaction state.
Your job is only to reason, plan, select ABOS capabilities, interpret returned evidence, and synthesize.
Never invent an aircraft fact. Never fabricate a score or valuation.

Return strict JSON with this shape:
{
  "plan": ["CAPABILITY_NAME", ...],
  "reasoning_summary": "short explanation",
  "requires_evidence": true,
  "confidence": "low|medium|high"
}

Allowed capabilities include:
IDENTIFY_AIRCRAFT, VERIFY_AIRCRAFT, VERIFY_REGISTRY, VERIFY_OWNERSHIP, VERIFY_ACTIVITY,
VERIFY_SERVICE, VERIFY_DOCUMENTS, CALCULATE_ATI, CALCULATE_OMVM, ANALYSE_DEAL,
FIND_BUYERS, COMPARE_AIRCRAFT, CREATE_TRANSACTION, ADVANCE_PIPELINE, OPEN_DEAL_ROOM,
REQUEST_PREBUY, PREPARE_CLOSING.

Prefer the smallest useful plan. For purchase/deal questions involving a specific aircraft, prefer:
IDENTIFY_AIRCRAFT -> VERIFY_AIRCRAFT -> CALCULATE_ATI -> CALCULATE_OMVM -> ANALYSE_DEAL.
The ABOS execution layer decides whether each capability is authorized and actually runs it.`;

function extractJson(text) {
  const raw = String(text || '').trim();
  try { return JSON.parse(raw); } catch (_) {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  if (fenced) {
    try { return JSON.parse(fenced); } catch (_) {}
  }
  const object = raw.match(/\{[\s\S]*\}/)?.[0];
  if (object) {
    try { return JSON.parse(object); } catch (_) {}
  }
  return null;
}

function sanitizePlan(plan) {
  const allowed = new Set([
    'IDENTIFY_AIRCRAFT','VERIFY_AIRCRAFT','VERIFY_REGISTRY','VERIFY_OWNERSHIP','VERIFY_ACTIVITY',
    'VERIFY_SERVICE','VERIFY_DOCUMENTS','CALCULATE_ATI','CALCULATE_OMVM','ANALYSE_DEAL',
    'FIND_BUYERS','COMPARE_AIRCRAFT','CREATE_TRANSACTION','ADVANCE_PIPELINE','OPEN_DEAL_ROOM',
    'REQUEST_PREBUY','PREPARE_CLOSING'
  ]);
  return Array.isArray(plan) ? [...new Set(plan.filter((x) => allowed.has(x)))].slice(0, 8) : [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('NVIDIA_API_KEY');
    if (!apiKey) return Response.json({ error: 'NVIDIA_API_KEY not configured' }, { status: 503 });

    const body = await req.json();
    const request = String(body?.request || '').trim();
    const context = body?.context || {};
    if (!request) return Response.json({ error: 'request is required' }, { status: 400 });

    const baseUrl = Deno.env.get('NVIDIA_NIM_BASE_URL') || DEFAULT_NIM_URL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let response;
    try {
      response = await fetch(baseUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          temperature: 1.0,
          top_p: 0.95,
          max_tokens: MAX_REASONING_TOKENS,
          reasoning_effort: 'low',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify({ request, context }) },
          ],
        }),
      });
    } catch (error) {
      const detail = error?.name === 'AbortError' ? 'NVIDIA request timed out after 45 seconds' : (error?.message || String(error));
      return Response.json({ error: `NVIDIA connection failed: ${detail}`, diagnostic: 'nvidia_fetch_failed' }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      return Response.json({ error: `NVIDIA API error (${response.status}): ${detail}` }, { status: 502 });
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      return Response.json({ error: 'NVIDIA returned a non-JSON response', diagnostic: 'nvidia_invalid_json' }, { status: 502 });
    }
    const message = data?.choices?.[0]?.message || {};
    const content = message?.content || '';
    const parsed = extractJson(content);
    if (!parsed) {
      return Response.json({
        error: 'St. Elmo returned an invalid reasoning plan',
        diagnostic: 'invalid_reasoning_plan',
        has_reasoning_content: Boolean(message?.reasoning_content),
        finish_reason: data?.choices?.[0]?.finish_reason || null,
      }, { status: 502 });
    }

    return Response.json({
      identity: 'ABOS St. Elmo',
      version: 'M_1.0',
      backend: 'nvidia',
      model: MODEL,
      reasoning_parser: 'super_v3',
      plan: sanitizePlan(parsed.plan),
      reasoning_summary: String(parsed.reasoning_summary || '').slice(0, 1200),
      requires_evidence: parsed.requires_evidence !== false,
      confidence: ['low','medium','high'].includes(parsed.confidence) ? parsed.confidence : 'low',
      usage: data?.usage || null,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
