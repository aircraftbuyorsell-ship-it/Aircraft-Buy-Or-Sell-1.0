import { useState } from "react";
import { X, Facebook, Link2, Sparkles, AlertTriangle, CheckCircle, Globe, MoreHorizontal } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUPPORTED_SOURCES = [
  { id: "fb", label: "Facebook Marketplace", icon: Facebook, color: "#1877F2" },
  { id: "controller", label: "Controller.com", icon: Globe, color: "#1F4E8C" },
  { id: "trade", label: "Trade-A-Plane", icon: Globe, color: "#C0392B" },
  { id: "planecheck", label: "Planecheck.com", icon: Globe, color: "#0F7A56" },
  { id: "other", label: "Other", icon: MoreHorizontal, color: "#D4A017" },
];

const EMPTY_FORM = {
  make: "", model: "", year: "", registration: "",
  total_time: "", engine_hours: "", tbo: "",
  asking_price: "", avionics: "", ai_summary: "",
  last_annual: "", fresh_annual: false,
  engine_count: 1, status: "active", visibility: "public",
  source_url: "", source_platform: "",
};

export default function ImportFromFBModal({ onClose, onImported }) {
  const [source, setSource] = useState("fb");
  const [mode, setMode] = useState("text"); // text | url
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [step, setStep] = useState("input"); // input | extracting | review | saving
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  const sourceMeta = SUPPORTED_SOURCES.find(s => s.id === source) || SUPPORTED_SOURCES[0];

  const handleExtract = async () => {
    const input = mode === "url" ? url.trim() : text.trim();
    if (!input) return;
    setStep("extracting");
    setError(null);

    const sourceContext = mode === "url"
      ? `Fetch and analyze the listing at this URL (${sourceMeta.label}): ${input}`
      : `Listing text from ${sourceMeta.label}:\n"""\n${input}\n"""`;

    const result = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: mode === "url",
      model: mode === "url" ? "gemini_3_flash" : undefined,
      prompt: `You are an expert at analyzing aircraft listings. Extract structured data from this listing.
      
CRITICAL RULE: Return ONLY information that is EXPLICITLY stated in the listing.
If information is NOT in the text/page, return null or an empty string — NEVER fabricate anything.

${sourceContext}

Extract the following (set anything not found to null):
- make: manufacturer (Cessna, Piper, Beechcraft, Cirrus, Diamond, etc.)
- model: aircraft model (172, PA-28, Baron, SR22, etc.)
- year: year of manufacture (number)
- registration: registration (e.g. N12345, OK-ABC)
- total_time: airframe total time in hours (number)
- engine_hours: engine hours (number)
- tbo: engine TBO in hours (number)
- asking_price: asking price in USD (number without symbols)
- avionics: comma-separated list of avionics
- last_annual: date of last annual inspection (YYYY-MM-DD)
- fresh_annual: has a fresh annual? (true/false)
- engine_count: number of engines (number, default 1)
- ai_summary: short summary of the listing (2-3 sentences in English)
- missing_fields: list of fields that are MISSING or CANNOT be verified from the text

Return ONLY raw JSON without markdown.`,
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
          last_annual: { type: ["string", "null"] },
          fresh_annual: { type: ["boolean", "null"] },
          engine_count: { type: ["number", "null"] },
          ai_summary: { type: ["string", "null"] },
          missing_fields: { type: "array", items: { type: "string" } },
        },
      },
    });

    const formData = { ...EMPTY_FORM };
    const missing = result.missing_fields || [];

    Object.keys(EMPTY_FORM).forEach((key) => {
      if (result[key] != null && result[key] !== "") {
        formData[key] = result[key];
      }
    });

    // attach source metadata
    if (mode === "url") {
      formData.source_url = url.trim();
    }
    formData.source_platform = sourceMeta.label;

    setExtracted(formData);
    setMissingFields(missing);
    setStep("review");
  };

  const handleSave = async () => {
    setStep("saving");
    const payload = { ...extracted };
    // clean up empty strings to avoid bad data
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") delete payload[k];
    });
    // Create via backend (bypasses RLS, enforces role check server-side)
    const res = await base44.functions.invoke("createListingsBulk", { listings: [payload] });
    const listing = res?.data?.created?.[0];
    onImported(listing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sourceMeta.color}1A` }}>
              <sourceMeta.icon className="w-4 h-4" style={{ color: sourceMeta.color }} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1A1814]">Import aircraft listing</h2>
              <p className="text-[11px] text-[#AAA49C]">Select source → paste text or URL → AI extracts the data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Step 1: Input */}
          {(step === "input" || step === "extracting") && (
            <>
              {/* Source selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-2">
                  Listing source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUPPORTED_SOURCES.map((s) => {
                    const active = source === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setSource(s.id); if (s.id !== "fb") setMode("url"); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${active ? "border-[#D4A017] bg-[rgba(212,160,23,0.08)] text-[#1A1814]" : "border-black/10 bg-white text-[#6B6560] hover:border-black/20"}`}
                      >
                        <s.icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? s.color : "#AAA49C" }} />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 bg-[#F7F4EF] rounded-lg p-1 w-fit">
                <button
                  onClick={() => setMode("url")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === "url" ? "bg-white text-[#1A1814] shadow-sm" : "text-[#AAA49C] hover:text-[#6B6560]"}`}
                >
                  <Link2 className="w-3 h-3 inline mr-1" /> URL link
                </button>
                <button
                  onClick={() => setMode("text")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === "text" ? "bg-white text-[#1A1814] shadow-sm" : "text-[#AAA49C] hover:text-[#6B6560]"}`}
                >
                  Text
                </button>
              </div>

              {mode === "url" ? (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-2">
                    Listing URL from {sourceMeta.label}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.controller.com/listing/..."
                    className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors"
                  />
                  <p className="text-[11px] text-[#AAA49C] mt-1.5">
                    AI will fetch and analyze the page content directly from the web.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-2">
                    Listing text from {sourceMeta.label}
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the full listing text..."
                    rows={8}
                    className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors resize-none"
                  />
                  <p className="text-[11px] text-[#AAA49C] mt-1.5">
                    The more information the listing contains, the more accurate the extraction.
                  </p>
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

          {/* Step 2: Review */}
          {(step === "review" || step === "saving") && extracted && (
            <>
              {/* Missing data warning */}
              {missingFields.length > 0 && (
                <div className="bg-[rgba(192,57,43,0.05)] border border-[rgba(192,57,43,0.18)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-[#C0392B]" />
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#C0392B]">
                      Missing / unverifiable data
                    </p>
                  </div>
                  <p className="text-[11px] text-[#C0392B] mb-1">These fields were not found in the listing — please fill them in manually:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {missingFields.map((f, i) => (
                      <span key={i} className="text-[10px] bg-[rgba(192,57,43,0.1)] text-[#C0392B] px-2 py-0.5 rounded-full font-medium">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "make", label: "Make" },
                  { key: "model", label: "Model" },
                  { key: "year", label: "Year" },
                  { key: "registration", label: "Registration" },
                  { key: "total_time", label: "Total time (TT)" },
                  { key: "engine_hours", label: "Engine hours" },
                  { key: "tbo", label: "TBO" },
                  { key: "asking_price", label: "Price (USD)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">{label}</label>
                    <input
                      type={["year", "total_time", "engine_hours", "tbo", "asking_price", "engine_count"].includes(key) ? "number" : "text"}
                      value={extracted[key] || ""}
                      onChange={(e) => setExtracted(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="—"
                      className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors"
                    />
                  </div>
                ))}

                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Avionics</label>
                  <input
                    type="text"
                    value={extracted.avionics || ""}
                    onChange={(e) => setExtracted(prev => ({ ...prev, avionics: e.target.value }))}
                    placeholder="GPS, ADS-B, autopilot..."
                    className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors"
                  />
                </div>

                {extracted.ai_summary && (
                  <div className="col-span-2 bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.2)] rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#A67C00] font-semibold mb-1">AI Summary</p>
                    <p className="text-[12px] text-[#6B6560]">{extracted.ai_summary}</p>
                  </div>
                )}

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fresh_annual"
                    checked={extracted.fresh_annual || false}
                    onChange={(e) => setExtracted(prev => ({ ...prev, fresh_annual: e.target.checked }))}
                    className="accent-[#D4A017]"
                  />
                  <label htmlFor="fresh_annual" className="text-sm text-[#1A1814] font-medium">Fresh annual</label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-between gap-3">
          {step === "review" && (
            <button onClick={() => setStep("input")} className="text-sm text-[#AAA49C] hover:text-[#1A1814] transition-colors">
              ← Back
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#6B6560] hover:border-[#D4A017] transition-colors">
              Cancel
            </button>

            {(step === "input" || step === "extracting") && (
              <button
                onClick={handleExtract}
                disabled={(mode === "url" ? !url.trim() : !text.trim()) || step === "extracting"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <Sparkles className={`w-4 h-4 ${step === "extracting" ? "animate-pulse" : ""}`} />
                {step === "extracting" ? (mode === "url" ? "Fetching and analyzing…" : "Extracting data…") : "Extract with AI"}
              </button>
            )}

            {step === "review" && (
              <button
                onClick={handleSave}
                disabled={!extracted?.make || !extracted?.model}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Create Aircraft Listing
              </button>
            )}

            {step === "saving" && (
              <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] opacity-60 text-white text-sm font-bold">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Saving…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}