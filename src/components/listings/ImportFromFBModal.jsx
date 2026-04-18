import { useState } from "react";
import { X, Facebook, Clipboard, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EMPTY_FORM = {
  make: "", model: "", year: "", registration: "",
  total_time: "", engine_hours: "", tbo: "",
  asking_price: "", avionics: "", ai_summary: "",
  last_annual: "", fresh_annual: false,
  engine_count: 1, status: "active", visibility: "public",
};

export default function ImportFromFBModal({ onClose, onImported }) {
  const [text, setText] = useState("");
  const [step, setStep] = useState("input"); // input | extracting | review | saving
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setStep("extracting");
    setError(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Jsi expert na analýzu inzerátů letadel. Extrahuj strukturovaná data z tohoto inzerátu.
      
KRITICKÉ PRAVIDLO: Vrať POUZE informace, které jsou EXPLICITNĚ uvedeny v textu inzerátu.
Pokud informace NENÍ v textu, vrať null nebo prázdný string - NIKDY si nic nevymýšlej.

Text inzerátu:
"""
${text}
"""

Extrahuj tato data (vše co nenajdeš v textu nastav na null):
- make: výrobce (Cessna, Piper, Beechcraft, Cirrus, Diamond, atd.)
- model: model letadla (172, PA-28, Baron, SR22, atd.)
- year: rok výroby (číslo)
- registration: registrační značka (např. OK-ABC, N12345)
- total_time: celkové hodiny draku (číslo)
- engine_hours: hodiny motoru (číslo)
- tbo: TBO motoru v hodinách (číslo)
- asking_price: požadovaná cena v USD (číslo bez symbolů)
- avionics: seznam avioniky oddělený čárkami
- last_annual: datum posledního ročního přezkoušení (YYYY-MM-DD formát)
- fresh_annual: má čerstvý annual? (true/false)
- engine_count: počet motorů (číslo, default 1)
- ai_summary: krátké shrnutí inzerátu (2-3 věty v češtině)
- missing_fields: seznam polí která CHYBÍ nebo NELZE ověřit z textu

Vrať POUZE raw JSON bez markdown.`,
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
    const listing = await base44.entities.AircraftListing.create(payload);
    onImported(listing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
              <Facebook className="w-4 h-4 text-[#1877F2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1A1814]">Import z FB Marketplace</h2>
              <p className="text-[11px] text-[#AAA49C]">Vložte text inzerátu → AI extrahuje data → potvrďte</p>
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
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-2">
                  Text inzerátu z Facebook Marketplace
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Vložte celý text inzerátu z FB Marketplace nebo jiné platformy..."
                  rows={10}
                  className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#1877F2] transition-colors resize-none"
                />
                <p className="text-[11px] text-[#AAA49C] mt-1.5">
                  Čím více informací inzerát obsahuje, tím přesnější bude extrakce.
                </p>
              </div>

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
                      Chybějící / neověřitelná data
                    </p>
                  </div>
                  <p className="text-[11px] text-[#C0392B] mb-1">Tato pole nebyla v inzerátu nalezena — doplňte je ručně:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {missingFields.map((f, i) => (
                      <span key={i} className="text-[10px] bg-[rgba(192,57,43,0.1)] text-[#C0392B] px-2 py-0.5 rounded-full font-medium">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "make", label: "Výrobce" },
                  { key: "model", label: "Model" },
                  { key: "year", label: "Rok výroby" },
                  { key: "registration", label: "Registrace" },
                  { key: "total_time", label: "Celkové hodiny (TT)" },
                  { key: "engine_hours", label: "Hodiny motoru" },
                  { key: "tbo", label: "TBO" },
                  { key: "asking_price", label: "Cena (USD)" },
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
                  <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Avionika</label>
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
                    <p className="text-[10px] uppercase tracking-wider text-[#A67C00] font-semibold mb-1">AI Shrnutí</p>
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
                  <label htmlFor="fresh_annual" className="text-sm text-[#1A1814] font-medium">Čerstvý annual</label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-between gap-3">
          {step === "review" && (
            <button onClick={() => setStep("input")} className="text-sm text-[#AAA49C] hover:text-[#1A1814] transition-colors">
              ← Zpět
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#6B6560] hover:border-[#D4A017] transition-colors">
              Zrušit
            </button>

            {(step === "input" || step === "extracting") && (
              <button
                onClick={handleExtract}
                disabled={!text.trim() || step === "extracting"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <Sparkles className={`w-4 h-4 ${step === "extracting" ? "animate-pulse" : ""}`} />
                {step === "extracting" ? "Extrahuji data…" : "Extrahovat pomocí AI"}
              </button>
            )}

            {step === "review" && (
              <button
                onClick={handleSave}
                disabled={!extracted?.make || !extracted?.model}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Vytvořit Aircraft Listing
              </button>
            )}

            {step === "saving" && (
              <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] opacity-60 text-white text-sm font-bold">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Ukládám…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}