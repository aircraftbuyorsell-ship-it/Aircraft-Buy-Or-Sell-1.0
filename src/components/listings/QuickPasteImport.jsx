import { useState } from "react";
import { X, Sparkles, CheckCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function QuickPasteImport({ open, onClose, onPublish }) {
  const [text, setText] = useState("");
  const [manual, setManual] = useState({ make: "", model: "", registration: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [atiScore, setAtiScore] = useState(null);

  const handlePublish = async () => {
    if (!text.trim() && !(manual.make.trim() && manual.model.trim())) return;
    setLoading(true);
    setError(null);

    try {
      const extracted = manual.make.trim() && manual.model.trim()
        ? { make: manual.make.trim(), model: manual.model.trim(), registration: manual.registration.trim(), year: manual.year ? Number(manual.year) : undefined }
        : await base44.integrations.Core.InvokeLLM({
            prompt: `Extract aircraft listing details from this text. Return ONLY fields found in the text (omit missing fields entirely, do NOT invent or guess missing values):\n\n${text.slice(0, 12000)}`,
            response_json_schema: {
              type: "object",
              properties: {
                make: { type: ["string", "null"] }, model: { type: ["string", "null"] }, year: { type: ["number", "null"] }, registration: { type: ["string", "null"] }, total_time: { type: ["number", "null"] }, engine_hours: { type: ["number", "null"] }, tbo: { type: ["number", "null"] }, asking_price: { type: ["number", "null"] }, avionics: { type: ["string", "null"] }, last_annual: { type: ["string", "null"] }, description: { type: ["string", "null"] },
              },
            },
          });

      if (!extracted.make && !extracted.model) {
        setError("Could not identify aircraft make/model. Try pasting more complete listing text.");
        setLoading(false);
        return;
      }

      // Create the listing
      const me = await base44.auth.me();
      const listing = await base44.entities.AircraftListing.create({
        make: extracted.make || "",
        model: extracted.model || "",
        year: extracted.year || undefined,
        registration: extracted.registration || "",
        total_time: extracted.total_time || undefined,
        engine_hours: extracted.engine_hours || undefined,
        tbo: extracted.tbo || undefined,
        asking_price: extracted.asking_price || undefined,
        avionics: extracted.avionics || "",
        last_annual: extracted.last_annual || "",
        ai_summary: extracted.description || "",
        status: "active",
        visibility: "public",
        owner: me?.id,
      });

      setPreview(listing);

      // Auto-trigger ATI scoring in background
      setScoring(true);
      try {
        const scoreResult = await base44.functions.invoke('marketExpertValuation', { listingId: listing.id });
        if (scoreResult?.data?.ati_total) {
          setAtiScore(scoreResult.data);
        }
      } catch (scoreErr) {
        // Scoring is non-blocking — listing is still published
        console.warn("Auto-score failed, listing still published:", scoreErr?.message);
      } finally {
        setScoring(false);
      }
    } catch (e) {
      setError(e?.message || "Failed to process listing");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.07] flex items-center justify-between">
          <div>
            <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-black">Quick Import</p>
            <h2 className="text-lg font-black text-[#1A1814] mt-0.5">Paste Listing Text</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-[#4a4550] hover:text-[#1A1814]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!preview ? (
            <>
              <div className="bg-[rgba(11,45,91,0.05)] border border-[rgba(11,45,91,0.12)] rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold text-[#0B2D5B] mb-1">Add aircraft details</p>
                <p className="text-[11px] text-[#3a3530]">Enter the basics below, or paste a full listing for automatic extraction.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={manual.make} onChange={event => setManual(current => ({ ...current, make: event.target.value }))} placeholder="Make * (e.g. Cessna)" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
                <input value={manual.model} onChange={event => setManual(current => ({ ...current, model: event.target.value }))} placeholder="Model * (e.g. 172S)" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
                <input value={manual.registration} onChange={event => setManual(current => ({ ...current, registration: event.target.value.toUpperCase() }))} placeholder="Registration (e.g. N12345)" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
                <input type="number" value={manual.year} onChange={event => setManual(current => ({ ...current, year: event.target.value }))} placeholder="Year" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Paste full listing text here...

Example:
"2015 Cessna 172S Skyhawk, N12345, 
TT 3,847 hrs, SMOH 187 hrs, 
fresh annual March 2025. 
IFR equipped Garmin G1000 NXi, 
GTX 345 ADS-B. 
Leather interior, factory A/C. 
Fresh paint 2024. $285,000.
Based KAPA, Denver, CO.
Call John: 555-1234"`}
                rows={10}
                className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/[0.08] rounded-xl text-[13px] text-[#1A1814] placeholder-[#6B6560] focus:outline-none focus:border-[#D4A017] focus:bg-white transition-colors resize-none font-mono"
                autoFocus
              />

              {error && (
                <div className="flex items-center gap-2 bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] rounded-xl px-4 py-2.5 text-[12px] font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-[rgba(15,122,86,0.06)] border border-[rgba(15,122,86,0.18)] rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#0F7A56]" />
                <p className="text-[13px] text-[#0F7A56] font-bold">Published successfully!</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="bg-white border border-black/[0.07] rounded-xl p-3">
                  <p className="text-[10px] text-[#4a4550] uppercase tracking-wider font-semibold">Aircraft</p>
                  <p className="font-black text-[#1A1814] text-sm mt-0.5">
                    {preview.year && `${preview.year} `}{preview.make} {preview.model}
                  </p>
                </div>
                <div className="bg-white border border-black/[0.07] rounded-xl p-3">
                  <p className="text-[10px] text-[#4a4550] uppercase tracking-wider font-semibold">Registration</p>
                  <p className="font-mono font-black text-[#1A1814] text-sm mt-0.5">{preview.registration || "—"}</p>
                </div>
                <div className="bg-white border border-black/[0.07] rounded-xl p-3">
                  <p className="text-[10px] text-[#4a4550] uppercase tracking-wider font-semibold">Price</p>
                  <p className="font-black text-[#1A1814] text-sm mt-0.5">
                    {preview.asking_price ? `$${preview.asking_price.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="bg-white border border-black/[0.07] rounded-xl p-3">
                  <p className="text-[10px] text-[#4a4550] uppercase tracking-wider font-semibold">Total Time</p>
                  <p className="font-black text-[#1A1814] text-sm mt-0.5">
                    {preview.total_time ? `${preview.total_time.toLocaleString()} hrs` : "—"}
                  </p>
                </div>
              </div>

              {/* ATI Score block */}
              <div className="bg-[rgba(11,45,91,0.04)] border border-[rgba(11,45,91,0.1)] rounded-xl p-4">
                {scoring ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#D4A017] animate-spin" />
                    <div>
                      <p className="text-[12px] font-bold text-[#0B2D5B]">Scoring aircraft…</p>
                      <p className="text-[10px] text-[#4a4550]">Analyzing 8 dimensions, market value & comparables</p>
                    </div>
                  </div>
                ) : atiScore ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                      <p className="text-[10px] uppercase tracking-[0.12em] font-black text-[#D4A017]">ATI Score Card Ready</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#0B2D5B]">{atiScore.ati_total}</span>
                        <span className="text-sm text-[#4a4550] font-semibold">/ 120</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#185FA5] text-white">
                        {atiScore.ati_label}
                      </span>
                      {atiScore.deal_label && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          atiScore.deal_label === 'hot deal' ? 'bg-[rgba(212,160,23,0.15)] text-[#A67C00]' :
                          atiScore.deal_label === 'good deal' ? 'bg-[rgba(15,122,86,0.1)] text-[#0F7A56]' :
                          'bg-black/5 text-[#4a4550]'
                        }`}>
                          {atiScore.deal_label}
                        </span>
                      )}
                    </div>
                    {atiScore.market_estimate && (
                      <div className="mt-2 flex items-center gap-3 text-[11px]">
                        <span className="text-[#4a4550]">Expert Est. <strong className="text-[#1A1814]">${atiScore.market_estimate.toLocaleString()}</strong></span>
                        {atiScore.discount_pct != null && (
                          <span className={atiScore.discount_pct >= 0 ? "text-[#0F7A56] font-bold" : "text-[#C0392B] font-bold"}>
                            {Math.abs(atiScore.discount_pct)}% {atiScore.discount_pct >= 0 ? "below" : "above"} market
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-3 text-[10px] text-[#6B6560]">
                      ATI Code: <span className="font-mono font-bold text-[#0B2D5B]">{atiScore.ati_code}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.07] flex items-center justify-end gap-3">
          {!preview ? (
            <>
              <button onClick={onClose} disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-black/[0.08] text-[13px] font-bold text-[#3a3530] hover:bg-[#F7F4EF] transition-colors">
                Cancel
              </button>
              <button onClick={handlePublish} disabled={loading || (!text.trim() && !(manual.make.trim() && manual.model.trim()))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-30 disabled:cursor-not-allowed text-white text-[13px] font-bold transition-colors">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Processing…" : "Paste & Publish"}
              </button>
            </>
          ) : (
            <button onClick={() => { onPublish?.(preview); onClose(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2D5B] text-white text-[13px] font-bold transition-colors">
              <CheckCircle className="w-4 h-4" />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}