import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = "meta/llama-3.2-11b-vision-instruct";

const SYSTEM_INSTRUCTION = `You are Max, an expert aviation pre-buy inspection assistant for ABOS.

You are analyzing a camera frame from an aircraft pre-buy inspection. Report only what is visible, focusing on:
- Corrosion, oxidation, rust on airframe, engine, control surfaces
- Damage, dents, cracks, or repairs
- Engine condition: oil leaks, staining, hose condition, exhaust deposits
- Avionics, logbooks, landing gear, interior condition

RESPONSE STYLE:
- 1-2 sentences max, like a seasoned inspector talking through findings
- Flag RED FLAGS immediately and clearly
- If nothing concerning is visible, say so briefly in a few words`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!apiKey) return Response.json({ error: 'NVIDIA_API_KEY not configured' }, { status: 500 });

    const { frame } = await req.json();
    if (!frame) return Response.json({ error: 'Missing frame (base64 JPEG)' }, { status: 400 });

    const response = await fetch(NIM_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NIM_MODEL,
        max_tokens: 120,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: [
            { type: 'text', text: 'Analyze this inspection frame.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frame}` } }
          ] }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return Response.json({ error: `NVIDIA API error (${response.status}): ${detail.slice(0, 300)}` }, { status: 502 });
    }

    const data = await response.json();
    const finding = data?.choices?.[0]?.message?.content || '';
    return Response.json({ finding });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});