import { useState } from "react";
import { X, Upload, Sparkles, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Image as ImageIcon, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  { id: "source", label: "Source", desc: "File, URL or paste text" },
  { id: "extract", label: "Extract", desc: "AI analyzes specs" },
  { id: "enrich", label: "Enrich", desc: "Add photos & details" },
  { id: "review", label: "Review", desc: "Final check & publish" },
];

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex-1 h-1 bg-black/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#D4A017] transition-all"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-[#AAA49C]">
        {current + 1} / {total}
      </span>
    </div>
  );
}

export default function ImportAndEditFlow({ open, onClose, onPublish }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("file"); // file | url | text

  const [extracted, setExtracted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Enrichment state
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({});

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleExtract = async () => {
    setLoading(true);
    setError(null);

    const input = mode === "url" ? url : mode === "file" && file ? file : text;
    if (!input) {
      setError("Please provide input data");
      setLoading(false);
      return;
    }

    try {
      let content = "";
      if (mode === "file" && file) {
        content = await file.text();
      } else if (mode === "text") {
        content = text;
      } else {
        content = url;
      }

      // Use AI to extract tech specs
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract aircraft specifications from this content:
\`\`\`
${content.slice(0, 10000)}
\`\`\`

Return JSON with explicit fields only (use null if not found):
{
  "make": "string|null",
  "model": "string|null",
  "year": "number|null",
  "registration": "string|null",
  "total_time": "number|null",
  "engine_hours": "number|null",
  "tbo": "number|null",
  "asking_price": "number|null",
  "avionics": "string|null",
  "engine_count": "number|null",
  "fuel_type": "string|null",
  "interior_condition": "string|null",
  "paint_condition": "string|null",
  "last_annual": "string|null",
  "description": "string|null"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            make: { type: ["string", "null"] },
            model: { type: ["string", "null"] },
            year: { type: ["number", "null"] },
            registration: { type: ["string", "null"] },
            total_time: { type: ["number", "null"] },
            engine_hours: { type: ["number", "null"] },
            tbo: { type: ["number", "null"] },
            asking_price: { type: ["number", "null"] },
            avionics: { type: ["string", "null"] },
            engine_count: { type: ["number", "null"] },
            fuel_type: { type: ["string", "null"] },
            interior_condition: { type: ["string", "null"] },
            paint_condition: { type: ["string", "null"] },
            last_annual: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
          },
        },
      });

      setExtracted(result);
      setForm(result);
      goNext();
    } catch (e) {
      setError(e?.message || "Failed to extract specs");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        setPhotos(prev => [...prev, { url: file_url, name: f.name }]);
      } catch (err) {
        setError(`Failed to upload ${f.name}`);
      }
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      const listing = await base44.entities.AircraftListing.create({
        make: form.make || "",
        model: form.model || "",
        year: form.year || undefined,
        registration: form.registration || "",
        total_time: form.total_time || undefined,
        engine_hours: form.engine_hours || undefined,
        tbo: form.tbo || undefined,
        asking_price: form.asking_price || undefined,
        avionics: form.avionics || "",
        engine_count: form.engine_count || 1,
        ai_summary: form.description || "",
        status: "active",
        visibility: "public",
        owner: me?.id,
      });

      // Store photo attachments if any
      if (photos.length > 0) {
        const photoUrls = photos.map(p => p.url);
        await base44.entities.AircraftListing.update(listing.id, {
          image_attachments: photoUrls,
        });
      }

      onPublish?.(listing);
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#E8A83A]">
              {STEPS[step].label}
            </p>
            <h2 className="text-lg font-black text-[#1A1814] mt-0.5">
              {STEPS[step].desc}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <StepIndicator current={step} total={STEPS.length} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Step 0: Source */}
          {step === 0 && (
            <>
              <div className="bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] rounded-lg px-4 py-2.5 mb-4">
                <p className="text-[11px] font-bold text-[#A67C00] mb-1">💡 Fastest way:</p>
                <p className="text-[12px] text-[#6B6560]">Copy the full listing text from any website (Facebook, Controller, Trade-A-Plane, etc.) and paste it below. AI will extract all specs automatically.</p>
              </div>

              <div className="flex gap-2 bg-[#F7F4EF] rounded-lg p-1 w-fit">
                {[
                  { id: "text", label: "📋 Paste Text", desc: "Fastest" },
                  { id: "url", label: "🔗 URL" },
                  { id: "file", label: "📁 File (ZIP/JSON)" },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      mode === m.id
                        ? "bg-white text-[#1A1814] shadow-sm"
                        : "text-[#AAA49C] hover:text-[#6B6560]"
                    }`}
                    title={m.desc}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {mode === "text" && (
                <>
                  <div className="bg-white border border-black/[0.07] rounded-lg p-4 space-y-2 text-[11px] text-[#6B6560] mb-4">
                    <p className="font-bold text-[#0B2D5B]">✓ What you can paste:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Full Facebook Marketplace listing</li>
                      <li>• Controller.com or Trade-A-Plane advertisement</li>
                      <li>• Email describing the aircraft</li>
                      <li>• Logbook notes or maintenance records</li>
                      <li>• Any unstructured aircraft text</li>
                    </ul>
                  </div>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={`Example: "2015 Cessna 172S, N12345, TT 3,847 hrs, SMOH 187 hrs, fresh annual 3/2025. IFR equipped with Garmin G1000 NXi. Fresh paint 2024, interior excellent. $285,000. Call John: 555-1234..."`}
                    rows={8}
                    className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm placeholder-[#999] placeholder-opacity-50 focus:outline-none focus:border-[#D4A017] resize-none font-mono"
                  />
                  <p className="text-[10px] text-[#AAA49C] italic">Don't worry about formatting — AI will find and extract all relevant specs automatically.</p>
                </>
              )}

              {mode === "url" && (
                <>
                  <div className="bg-white border border-black/[0.07] rounded-lg p-3 text-[11px] text-[#6B6560] mb-3">
                    <p className="font-bold text-[#0B2D5B] mb-1">✓ Paste any listing URL:</p>
                    <p>Controller.com • Trade-A-Plane • Facebook Marketplace • eBay Motors • Craigslist • etc.</p>
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://www.controller.com/listing/..."
                    className="w-full px-4 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017]"
                  />
                  <p className="text-[10px] text-[#AAA49C] mt-2">AI will fetch and analyze the page content directly.</p>
                </>
              )}

              {mode === "file" && (
                <>
                  <div className="bg-white border border-black/[0.07] rounded-lg p-3 text-[11px] text-[#6B6560] mb-3">
                    <p className="font-bold text-[#0B2D5B] mb-1">✓ Upload file with specs:</p>
                    <p>.zip • .json • .csv • .pdf • .txt • .xlsx</p>
                  </div>
                  <label className="block border-2 border-dashed border-black/10 hover:border-[#D4A017] rounded-lg p-6 text-center cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-[#AAA49C] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#1A1814]">
                      {file ? file.name : "Click to select file"}
                    </p>
                    <p className="text-[10px] text-[#AAA49C] mt-1">Or drag & drop</p>
                    <input
                      type="file"
                      accept=".zip,.json,.csv,.pdf,.txt,.xlsx"
                      onChange={e => setFile(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-lg px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {/* Step 1: Extract */}
          {step === 1 && extracted && (
            <>
              <p className="text-[11px] text-[#6B6560]">AI extracted these specs — review and adjust before publishing:</p>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {[
                  { key: "make", label: "Make" },
                  { key: "model", label: "Model" },
                  { key: "year", label: "Year" },
                  { key: "registration", label: "Registration" },
                  { key: "total_time", label: "Total Time (hrs)" },
                  { key: "engine_hours", label: "Engine Hours" },
                  { key: "tbo", label: "TBO (hrs)" },
                  { key: "asking_price", label: "Asking Price (USD)" },
                  { key: "engine_count", label: "Engine Count" },
                  { key: "fuel_type", label: "Fuel Type" },
                  { key: "avionics", label: "Avionics" },
                  { key: "last_annual", label: "Last Annual" },
                  { key: "interior_condition", label: "Interior Condition" },
                  { key: "paint_condition", label: "Paint Condition" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">
                      {label}
                    </label>
                    <input
                      type={["year", "total_time", "engine_hours", "tbo", "asking_price", "engine_count"].includes(key) ? "number" : "text"}
                      value={form[key] || ""}
                      onChange={e =>
                        setForm(prev => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder="—"
                      className="w-full px-2.5 py-1.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-[11px] text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017]"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Enrich (Photos + Details) */}
          {step === 2 && (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">
                  Aircraft Photos
                </p>
                <label className="block border-2 border-dashed border-black/10 hover:border-[#D4A017] rounded-lg p-6 text-center cursor-pointer transition-colors">
                  <ImageIcon className="w-8 h-8 text-[#AAA49C] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1A1814]">Click to add photos</p>
                  <p className="text-[10px] text-[#AAA49C] mt-1">Panel, engine, cabin, exterior (high impact for buyers)</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photos.map((p, i) => (
                      <div
                        key={i}
                        className="relative group flex items-center gap-1.5 bg-[#F7F4EF] border border-black/10 rounded-lg px-2.5 py-1.5"
                      >
                        <ImageIcon className="w-3 h-3 text-[#D4A017]" />
                        <span className="text-[11px] text-[#6B6560] truncate max-w-[120px]">
                          {p.name}
                        </span>
                        <button
                          onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C0392B]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">
                  Additional Details
                </p>
                <textarea
                  value={form.description || ""}
                  onChange={e =>
                    setForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Any notes, maintenance history, condition details..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-[12px] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] resize-none"
                />
              </div>
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-[rgba(15,122,86,0.06)] border border-[rgba(15,122,86,0.18)] rounded-lg px-4 py-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0F7A56]" />
                <p className="text-[12px] text-[#0F7A56] font-bold">
                  Ready to publish {form.make} {form.model} {form.registration ? `(${form.registration})` : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="bg-white border border-black/[0.07] rounded-lg p-3">
                  <p className="text-[#AAA49C] font-semibold mb-1">Aircraft</p>
                  <p className="font-black text-[#1A1814]">
                    {form.year} {form.make} {form.model}
                  </p>
                </div>
                <div className="bg-white border border-black/[0.07] rounded-lg p-3">
                  <p className="text-[#AAA49C] font-semibold mb-1">Registration</p>
                  <p className="font-mono font-black text-[#1A1814]">{form.registration || "—"}</p>
                </div>
                <div className="bg-white border border-black/[0.07] rounded-lg p-3">
                  <p className="text-[#AAA49C] font-semibold mb-1">Price</p>
                  <p className="font-black text-[#1A1814]">
                    {form.asking_price ? `$${form.asking_price.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="bg-white border border-black/[0.07] rounded-lg p-3">
                  <p className="text-[#AAA49C] font-semibold mb-1">Photos</p>
                  <p className="font-black text-[#1A1814]">{photos.length} uploaded</p>
                </div>
              </div>

              {form.description && (
                <div className="bg-white border border-black/[0.07] rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-bold mb-1">Notes</p>
                  <p className="text-[12px] text-[#6B6560]">{form.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-black/10 text-[#6B6560] hover:border-[#D4A017] disabled:opacity-40 text-sm font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-black/10 text-sm font-bold text-[#6B6560] hover:border-[#D4A017] transition-colors"
            >
              Cancel
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => (step === 0 ? handleExtract() : goNext())}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Processing…" : "Next"}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Publishing…" : "Publish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}