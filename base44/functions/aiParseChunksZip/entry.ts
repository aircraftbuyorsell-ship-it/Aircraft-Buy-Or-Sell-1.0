// Parse a ZIP of .txt chunks using AI (mirrors the n8n workflow):
// Read Files → Extract Text → AI Parse Aircraft → Store
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import JSZip from 'npm:jszip@3.10.1';

const AIRCRAFT_SCHEMA = {
  type: "object",
  properties: {
    manufacturer: { type: ["string", "null"] },
    model: { type: ["string", "null"] },
    year: { type: ["number", "null"] },
    registration: { type: ["string", "null"] },
    price: {
      type: "object",
      properties: {
        amount: { type: ["number", "null"] },
        currency: { type: ["string", "null"] },
      },
    },
    engines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: ["string", "null"] },
          type: { type: ["string", "null"] },
          model: { type: ["string", "null"] },
          smoh: { type: ["number", "null"] },
        },
      },
    },
    total_time: { type: ["number", "null"] },
    avionics: { type: "array", items: { type: "string" } },
    description: { type: ["string", "null"] },
  },
};

function toListing(ai, fileName) {
  const engines = Array.isArray(ai.engines) ? ai.engines : [];
  const smohValues = engines.map(e => e?.smoh).filter(v => typeof v === "number");
  const avgSmoh = smohValues.length ? Math.round(smohValues.reduce((a, b) => a + b, 0) / smohValues.length) : null;

  return {
    make: ai.manufacturer || "Unknown",
    model: ai.model || "Unknown",
    year: ai.year || undefined,
    registration: ai.registration || "",
    total_time: ai.total_time || undefined,
    engine_hours: avgSmoh ?? undefined,
    engine_count: engines.length || 1,
    asking_price: ai.price?.amount || undefined,
    currency: ai.price?.currency || "USD",
    avionics: Array.isArray(ai.avionics) ? ai.avionics.join(", ") : "",
    ai_summary: ai.description || "",
    source_platform: fileName || "Chunk AI Import",
    status: "active",
    visibility: "public",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, dryRun = false } = await req.json().catch(() => ({}));
    if (!file_url) return Response.json({ error: 'Missing file_url' }, { status: 400 });

    // Download + unzip
    const resp = await fetch(file_url);
    if (!resp.ok) return Response.json({ error: `Fetch failed: ${resp.status}` }, { status: 500 });
    const zip = await JSZip.loadAsync(await resp.arrayBuffer());

    const chunks = [];
    for (const [fileName, fileObj] of Object.entries(zip.files)) {
      if (fileObj.dir) continue;
      if (!fileName.toLowerCase().endsWith(".txt")) continue;
      const text = await fileObj.async("text");
      chunks.push({ fileName, text });
    }

    if (!chunks.length) {
      return Response.json({ error: "No .txt chunks found in ZIP" }, { status: 400 });
    }

    // AI parse each chunk
    const parsed = [];
    for (const { fileName, text } of chunks) {
      const ai = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured aircraft data from this text. Return ONLY explicitly stated fields — use null when unknown. Never fabricate.

TEXT:
"""
${text.slice(0, 15000)}
"""`,
        response_json_schema: AIRCRAFT_SCHEMA,
      });
      parsed.push({ ...toListing(ai, fileName), _source_file: fileName });
    }

    if (dryRun) {
      return Response.json({ total: parsed.length, parsed });
    }

    // Store
    const created = [];
    for (const listing of parsed) {
      const { _source_file, ...payload } = listing;
      if (payload.make === "Unknown" && payload.model === "Unknown") continue;
      const record = await base44.entities.AircraftListing.create(payload);
      created.push(record.id);
    }

    return Response.json({
      total_chunks: chunks.length,
      created: created.length,
      created_ids: created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});