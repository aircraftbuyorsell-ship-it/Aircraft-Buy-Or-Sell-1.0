import { useState } from "react";
import { X, Upload, FileArchive, Sparkles, CheckCircle, AlertTriangle, Plane } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Map incoming JSON shape (as provided by user) → AircraftListing entity shape
function mapAircraftToListing(ac) {
  if (!ac) return null;

  // engines → avionics-like summary & averages
  const engines = Array.isArray(ac.engines) ? ac.engines : [];
  const smohValues = engines.map(e => e?.smoh).filter(v => typeof v === "number");
  const avgSmoh = smohValues.length ? Math.round(smohValues.reduce((a, b) => a + b, 0) / smohValues.length) : null;

  const avionicsStr = Array.isArray(ac.avionics) ? ac.avionics.join(", ") : (ac.avionics || "");
  const featuresStr = Array.isArray(ac.features) ? ac.features.join(", ") : "";

  const locationStr = ac.location
    ? [ac.location.city, ac.location.country].filter(Boolean).join(", ")
    : "";

  // Build a rich raw_text for downstream ATI analysis
  const rawParts = [
    ac.title,
    ac.description,
    locationStr && `Location: ${locationStr}`,
    featuresStr && `Features: ${featuresStr}`,
    engines.length && `Engines: ${engines.map(e => `${e.position || ""} ${e.model || e.type || ""} SMOH ${e.smoh ?? "—"} Compressions ${(e.compressions || []).join("/") || "—"}`).join(" | ")}`,
  ].filter(Boolean).join("\n\n");

  return {
    make: ac.manufacturer || "",
    model: ac.model || "",
    year: ac.year ? Number(ac.year) : undefined,
    registration: ac.registration || "",
    total_time: ac.airframe?.total_time ? Number(ac.airframe.total_time) : undefined,
    engine_hours: avgSmoh ?? undefined,
    engine_count: engines.length || 1,
    asking_price: ac.price?.amount ? Number(ac.price.amount) : undefined,
    currency: ac.price?.currency || "USD",
    avionics: avionicsStr,
    ai_summary: ac.description || "",
    raw_text: rawParts,
    status: "active",
    visibility: "public",
    source_platform: ac.source_file || "File Import",
  };
}

// Try parse JSON; if not JSON, we'll push raw text to AI extraction
function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

async function extractFromRawText(rawText) {
  // Fallback: use AI to convert any arbitrary text to the listing schema
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Extract structured aircraft listing data from the following content. Return ONLY fields explicitly stated — use null if unknown. Never fabricate.

CONTENT:
"""
${rawText.slice(0, 20000)}
"""

Return JSON with this schema:
{
  "manufacturer": string|null,
  "model": string|null,
  "year": number|null,
  "registration": string|null,
  "price": { "amount": number|null, "currency": string|null },
  "location": { "country": string|null, "city": string|null },
  "airframe": { "total_time": number|null },
  "engines": [{ "position": "LH"|"RH"|null, "type": string|null, "model": string|null, "smoh": number|null, "compressions": [number] }],
  "avionics": [string],
  "features": [string],
  "description": string|null
}`,
    response_json_schema: {
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
        location: {
          type: "object",
          properties: {
            country: { type: ["string", "null"] },
            city: { type: ["string", "null"] },
          },
        },
        airframe: {
          type: "object",
          properties: { total_time: { type: ["number", "null"] } },
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
              compressions: { type: "array", items: { type: "number" } },
            },
          },
        },
        avionics: { type: "array", items: { type: "string" } },
        features: { type: "array", items: { type: "string" } },
        description: { type: ["string", "null"] },
      },
    },
  });
  return result;
}

export default function ImportFromFileModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("input"); // input | processing | review | saving
  const [aircraftList, setAircraftList] = useState([]); // parsed items
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [parseMode, setParseMode] = useState("ai-file"); // ai-file | regex-chunks | ai-chunks

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStep("processing");
    setError(null);

    const name = file.name.toLowerCase();
    const isZip = name.endsWith(".zip");

    try {
      // Upload the file to get it parsed by the AI (works for zip, json, pdf, txt, csv, etc.)
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Fast path: regex-based chunk parser (ZIP of .txt files)
      if (parseMode === "regex-chunks" && isZip) {
        const res = await base44.functions.invoke("parseChunksZip", { file_url, dryRun: true });
        const parsed = res.data?.parsed || [];
        if (!parsed.length) {
          setError("V ZIP archivu nebyly nalezeny žádné .txt chunky.");
          setStep("input");
          return;
        }
        const mapped = parsed.map(p => ({
          make: p.manufacturer || "",
          model: p.model || "",
          year: p.year || undefined,
          registration: p.registration || "",
          asking_price: p.price_amount || undefined,
          currency: "USD",
          ai_summary: p.title || "",
          raw_text: p.description || "",
          source_platform: p.source_file || "Chunk Import",
          status: "active",
          visibility: "public",
        }));
        setAircraftList(mapped);
        setStep("review");
        return;
      }

      // AI per-chunk parser (mirrors n8n workflow: Read → Extract → AI → Store)
      if (parseMode === "ai-chunks" && isZip) {
        const res = await base44.functions.invoke("aiParseChunksZip", { file_url, dryRun: true });
        const parsed = res.data?.parsed || [];
        if (!parsed.length) {
          setError("V ZIP archivu nebyly nalezeny žádné .txt chunky.");
          setStep("input");
          return;
        }
        setAircraftList(parsed);
        setStep("review");
        return;
      }

      // Use ExtractDataFromUploadedFile for structured extraction on the uploaded file
      // (supports csv, xlsx, json, html, pdf, images — but NOT zip)
      let aircrafts = [];

      if (isZip) {
        // For ZIP: fallback — ask the LLM with file_urls attached (vision/file support)
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `The attached ZIP file contains aircraft listing(s). Extract ALL aircraft as a JSON array matching this schema:
{
  "aircrafts": [{
    "manufacturer": string|null, "model": string|null, "year": number|null,
    "registration": string|null,
    "price": { "amount": number|null, "currency": string|null },
    "location": { "country": string|null, "city": string|null },
    "airframe": { "total_time": number|null },
    "engines": [{ "position": string|null, "type": string|null, "model": string|null, "smoh": number|null, "compressions": [number] }],
    "avionics": [string], "features": [string], "description": string|null,
    "source_file": string|null
  }]
}
Return ONLY fields explicitly present — use null when unknown. Never fabricate.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              aircrafts: { type: "array", items: { type: "object" } },
            },
          },
        });
        aircrafts = res?.aircrafts || [];
      } else {
        // JSON / text / csv / pdf path
        const text = await file.text().catch(() => "");
        const parsed = tryParseJSON(text);
        if (parsed) {
          // Accept either { aircraft: {...} }, { aircrafts: [...] }, or bare array / object
          if (Array.isArray(parsed)) aircrafts = parsed;
          else if (Array.isArray(parsed.aircrafts)) aircrafts = parsed.aircrafts;
          else if (parsed.aircraft) aircrafts = [parsed.aircraft];
          else aircrafts = [parsed];
        } else if (text) {
          const single = await extractFromRawText(text);
          aircrafts = [single];
        } else {
          // binary / unreadable → attach and ask AI
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: "Extract aircraft listing(s) as JSON array { aircrafts: [...] } matching the provided schema. Only explicit fields.",
            file_urls: [file_url],
            response_json_schema: {
              type: "object",
              properties: { aircrafts: { type: "array", items: { type: "object" } } },
            },
          });
          aircrafts = res?.aircrafts || [];
        }
      }

      if (!aircrafts.length) {
        setError("V souboru nebyly nalezeny žádné inzeráty letadel.");
        setStep("input");
        return;
      }

      const mapped = aircrafts.map(mapAircraftToListing).filter(Boolean);
      setAircraftList(mapped);
      setStep("review");
    } catch (e) {
      setError(e?.message || "Nepodařilo se zpracovat soubor.");
      setStep("input");
    }
  };

  const handleSaveAll = async () => {
    setStep("saving");
    setProgress({ current: 0, total: aircraftList.length });
    const created = [];
    for (let i = 0; i < aircraftList.length; i++) {
      const payload = { ...aircraftList[i] };
      Object.keys(payload).forEach(k => {
        if (payload[k] === "" || payload[k] == null) delete payload[k];
      });
      if (!payload.make || !payload.model) continue;
      const listing = await base44.entities.AircraftListing.create(payload);
      created.push(listing);
      setProgress({ current: i + 1, total: aircraftList.length });
    }
    onImported?.(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(212,160,23,0.12)]">
              <FileArchive className="w-4 h-4 text-[#D4A017]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1A1814]">Import ze souboru (ZIP / JSON)</h2>
              <p className="text-[11px] text-[#AAA49C]">Nahraj ZIP, JSON, CSV, PDF nebo text — AI rozpozná jeden či více inzerátů</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Input */}
          {(step === "input" || step === "processing") && (
            <>
              <label className="block">
                <div className="border-2 border-dashed border-black/10 hover:border-[#D4A017] rounded-2xl p-8 text-center cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-[#AAA49C] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#1A1814]">
                    {file ? file.name : "Klikni pro výběr souboru"}
                  </p>
                  <p className="text-[11px] text-[#AAA49C] mt-1">
                    Podporováno: .zip, .json, .csv, .pdf, .txt, .xlsx, obrázky
                  </p>
                  <input type="file" accept=".zip,.json,.csv,.pdf,.txt,.xlsx,.png,.jpg,.jpeg,.webp" onChange={handleFile} className="hidden" />
                </div>
              </label>

              {/* Parse mode selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-2">Režim parsování</label>
                <div className="space-y-2">
                  {[
                    { id: "ai-file", title: "AI na celý soubor", desc: "Standardně — pro JSON, CSV, PDF, obrázky i malé ZIPy" },
                    { id: "regex-chunks", title: "Regex parser (rychlý, bez AI)", desc: "ZIP s .txt chunky — přímá extrakce bez LLM" },
                    { id: "ai-chunks", title: "AI per chunk (n8n workflow)", desc: "ZIP s .txt chunky — AI analyzuje každý chunk zvlášť" },
                  ].map(m => (
                    <label key={m.id} className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${parseMode === m.id ? "border-[#D4A017] bg-[rgba(212,160,23,0.06)]" : "border-black/10 bg-white hover:border-black/20"}`}>
                      <input
                        type="radio"
                        name="parseMode"
                        value={m.id}
                        checked={parseMode === m.id}
                        onChange={(e) => setParseMode(e.target.value)}
                        className="accent-[#D4A017] mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-[#1A1814]">{m.title}</p>
                        <p className="text-[10px] text-[#6B6560]">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {file && (
                <div className="bg-[#F7F4EF] border border-black/[0.07] rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileArchive className="w-4 h-4 text-[#D4A017] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#1A1814] truncate">{file.name}</p>
                      <p className="text-[10px] text-[#AAA49C]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-[11px] text-[#C0392B] hover:underline shrink-0">
                    Odstranit
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-xl px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {/* Review */}
          {step === "review" && aircraftList.length > 0 && (
            <>
              <div className="bg-[rgba(15,122,86,0.06)] border border-[rgba(15,122,86,0.18)] rounded-xl px-4 py-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0F7A56]" />
                <p className="text-[12px] text-[#0F7A56] font-bold">
                  Nalezeno {aircraftList.length} {aircraftList.length === 1 ? "letadlo" : "letadel"} — zkontroluj a ulož
                </p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {aircraftList.map((ac, idx) => (
                  <div key={idx} className="bg-white border border-black/[0.07] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="w-4 h-4 text-[#D4A017]" />
                      <p className="text-sm font-black text-[#1A1814]">
                        {ac.year ? `${ac.year} ` : ""}{ac.make || "—"} {ac.model || "—"}
                      </p>
                      {ac.registration && <span className="text-[11px] text-[#AAA49C] font-mono">{ac.registration}</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      <div><span className="text-[#AAA49C]">TT:</span> <span className="text-[#1A1814] font-semibold">{ac.total_time?.toLocaleString() || "—"}</span></div>
                      <div><span className="text-[#AAA49C]">ENG hrs:</span> <span className="text-[#1A1814] font-semibold">{ac.engine_hours?.toLocaleString() || "—"}</span></div>
                      <div><span className="text-[#AAA49C]">Motorů:</span> <span className="text-[#1A1814] font-semibold">{ac.engine_count}</span></div>
                      <div><span className="text-[#AAA49C]">Cena:</span> <span className="text-[#1A1814] font-semibold">{ac.asking_price ? `$${ac.asking_price.toLocaleString()}` : "—"}</span></div>
                    </div>
                    {ac.avionics && (
                      <p className="text-[11px] text-[#6B6560] mt-2 truncate"><span className="text-[#AAA49C]">Avionika:</span> {ac.avionics}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "saving" && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Sparkles className="w-8 h-8 text-[#D4A017] animate-pulse" />
              <p className="text-sm font-bold text-[#1A1814]">Ukládám inzeráty…</p>
              <p className="text-[11px] text-[#AAA49C]">{progress.current} / {progress.total}</p>
              <div className="w-48 h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4A017] transition-all" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-end gap-3">
          {step === "review" && (
            <button onClick={() => { setStep("input"); setAircraftList([]); }} className="text-sm text-[#AAA49C] hover:text-[#1A1814] transition-colors mr-auto">
              ← Zpět
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#6B6560] hover:border-[#D4A017] transition-colors">
            Zrušit
          </button>

          {(step === "input" || step === "processing") && (
            <button
              onClick={handleProcess}
              disabled={!file || step === "processing"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-40 text-white text-sm font-bold transition-colors"
            >
              <Sparkles className={`w-4 h-4 ${step === "processing" ? "animate-pulse" : ""}`} />
              {step === "processing" ? "Analyzuji…" : "Analyzovat soubor"}
            </button>
          )}

          {step === "review" && (
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#A67C00] text-white text-sm font-bold transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Uložit vše ({aircraftList.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}