// Parse a ZIP of text chunks into AircraftListing records
// Mirrors the Node.js regex parser: extracts manufacturer, model, year, registration, price
// from each chunk file and saves listings into the database.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import JSZip from 'npm:jszip@3.10.1';

function parseAircraft(text, fileName) {
  const firstLine = (text.split("\n")[0] || "").trim();
  const manufacturer = text.match(/Cessna|Piper|Beechcraft|Cirrus|Diamond|Mooney|Bonanza|Bell|Robinson|Embraer|Boeing|Airbus/i)?.[0] || null;
  const model = text.match(/\b\d{3}[A-Z]?\b/)?.[0] || null;
  const year = Number(text.match(/Year\s*(\d{4})/i)?.[1]) || null;
  const registration = text.match(/Reg(?:istration)?\s*[:#]?\s*([A-Z0-9-]{3,10})/i)?.[1] || null;
  const priceMatch = text.match(/\$\s*([\d,]+)/);
  const priceAmount = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : null;

  return {
    title: firstLine,
    manufacturer,
    model,
    year,
    registration,
    price_amount: priceAmount,
    price_currency: "USD",
    description: text,
    source_file: fileName,
    chunk_id: fileName,
  };
}

// Map the parsed schema → AircraftListing entity
function toListing(parsed) {
  return {
    make: parsed.manufacturer || "Unknown",
    model: parsed.model || "Unknown",
    year: parsed.year || undefined,
    registration: parsed.registration || "",
    asking_price: parsed.price_amount || undefined,
    currency: parsed.price_currency || "USD",
    ai_summary: parsed.title || "",
    raw_text: parsed.description || "",
    source_platform: parsed.source_file || "Chunk Import",
    status: "active",
    visibility: "public",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'dealer'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: admin or dealer role required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { file_url, dryRun = false, saveToEntity = true } = body;

    if (!file_url) {
      return Response.json({ error: 'Missing file_url. Upload a ZIP via UploadFile first.' }, { status: 400 });
    }

    // Download the ZIP
    const resp = await fetch(file_url);
    if (!resp.ok) {
      return Response.json({ error: `Failed to download file: ${resp.status}` }, { status: 500 });
    }
    const buffer = await resp.arrayBuffer();

    // Unzip
    const zip = await JSZip.loadAsync(buffer);
    const output = [];

    for (const [fileName, fileObj] of Object.entries(zip.files)) {
      if (fileObj.dir) continue;
      if (!fileName.toLowerCase().endsWith(".txt")) continue;
      const content = await fileObj.async("text");
      const parsed = parseAircraft(content, fileName);
      output.push(parsed);
    }

    if (dryRun || !saveToEntity) {
      return Response.json({
        total_chunks: output.length,
        sample: output.slice(0, 3),
        parsed: output,
      });
    }

    // Save as AircraftListing records
    const listings = output.map(toListing).filter(l => l.make !== "Unknown" || l.raw_text);
    const created = [];
    for (const listing of listings) {
      const record = await base44.asServiceRole.entities.AircraftListing.create({ ...listing, owner: user.id });
      created.push(record.id);
    }

    return Response.json({
      total_chunks: output.length,
      created: created.length,
      created_ids: created,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});