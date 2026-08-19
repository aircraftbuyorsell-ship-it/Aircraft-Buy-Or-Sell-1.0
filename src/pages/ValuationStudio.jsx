import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, SlidersHorizontal, RotateCcw } from "lucide-react";
import ValuationForm from "@/components/valuation/ValuationForm";
import ValuationReport from "@/components/valuation/ValuationReport";
import ModelSelector, { modelLabel } from "@/components/valuation-studio/ModelSelector";
import HistoricalPriceCheck from "@/components/valuation-studio/HistoricalPriceCheck";
import { extractAircraftSpecs, mergeExtractedSpecs } from "@/lib/aircraftInput";
import { useEntitlementGate } from "@/hooks/useEntitlementGate";
import EntitlementGateModal from "@/components/monetization/EntitlementGateModal";
import { saveReport, recordUsage } from "@/lib/entitlements";

const readParam = (key) => new URLSearchParams(window.location.search).get(key) || "";

const INITIAL_FORM = {
  make: "",
  model: "",
  year: "",
  total_time: "",
  engine_hours: "",
  engine_model: "",
  tbo: "",
  avionics: "",
  asking_price: "",
  listing_text: "",
};

const toNumber = (value) => (value === "" ? undefined : Number(value));
const numOrUndef = (v) => (v == null ? undefined : Number(v));

export default function ValuationStudio() {
  const { gate, requireAccess, closeGate, startCheckout } = useEntitlementGate();
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM,
    make: readParam("make"),
    model: readParam("model"),
    year: readParam("year"),
    total_time: readParam("total_time"),
    engine_hours: readParam("engine_hours"),
    tbo: readParam("tbo") || "",
    avionics: readParam("avionics"),
    asking_price: readParam("asking_price"),
  }));
  const [model, setModel] = useState("gemini_3_flash");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [result, setResult] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const listingText0 = (formData.listing_text || "").trim();
    const hasFormSpecs = (formData.make || "").trim() && (formData.model || "").trim();
    if (!hasFormSpecs && !listingText0 && files.length === 0) {
      setError("Fill in the form fields, paste a listing text, or attach a file — at least one is needed to value the aircraft.");
      return;
    }
    setError(null);
    if (!(await requireAccess("VALUATION_STUDIO", ""))) return;
    setLoading(true);

    try {
      let fileUrls = [];
      if (files.length > 0) {
        const uploaded = await Promise.all(
          files.map((f) => base44.integrations.Core.UploadFile({ file: f }))
        );
        fileUrls = uploaded.map((u) => (u?.data ?? u)?.file_url).filter(Boolean);
      }

      const listingText = (formData.listing_text || "").trim();

      let merged = { ...formData };
      if (listingText || fileUrls.length) {
        try {
          const extracted = await extractAircraftSpecs({ listingText, fileUrls });
          const { merged: mergedSpecs } = mergeExtractedSpecs(merged, extracted);
          merged = mergedSpecs;
          setFormData((prev) => ({ ...prev, ...merged }));
        } catch (extractErr) {
          console.warn("[ValuationStudio] spec extraction failed:", extractErr?.message);
        }
      }

      // Document-only valuations: extraction must yield make+model so the
      // backend has an anchor for comparables / live-market search.
      const mergedMake = String(merged.make || "").trim();
      const mergedModel = String(merged.model || "").trim();
      if (!mergedMake || !mergedModel) {
        setError("Couldn't read the make and model from your document. Please type them into the form fields, then run the valuation again.");
        setLoading(false);
        return;
      }

      const payload = {
        make: mergedMake,
        model: mergedModel,
        year: toNumber(merged.year),
        total_time: numOrUndef(merged.total_time),
        engine_hours: numOrUndef(merged.engine_hours),
        engine_model: String(merged.engine_model || "").trim() || undefined,
        tbo: toNumber(merged.tbo),
        avionics: String(merged.avionics || "").trim(),
        asking_price: numOrUndef(merged.asking_price),
        listing_text: listingText || undefined,
        file_urls: fileUrls.length ? fileUrls : undefined,
        llm_model: model,
      };

      const response = await base44.functions.invoke("omvmV5Score", payload);
      setResult(response?.data ?? response);
      setAircraft(payload);
      setError(null);
      // Persist the purchased report (re-access without re-charge) + usage record
      try {
        await saveReport({
          product_key: "VALUATION_STUDIO",
          aircraft_registration: "",
          aircraft_label: [merged.year, mergedMake, mergedModel].filter(Boolean).join(" "),
          report_type: "valuation",
          result_data: response?.data ?? response,
        });
        await recordUsage({ product_key: "VALUATION_STUDIO", aircraft_registration: "" });
      } catch (_) {}
    } catch (e) {
      if ([401, 403].includes(e?.response?.status || e?.status)) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setResult(null);
      setError(e?.response?.data?.error || e?.message || "Valuation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...INITIAL_FORM });
    setFiles([]);
    setResult(null);
    setAircraft(null);
    setError(null);
  };

  const handleAutoFill = async () => {
    const listingText = (formData.listing_text || "").trim();
    if (!listingText && files.length === 0) return;
    setAutoFilling(true);
    try {
      let fileUrls = [];
      if (files.length > 0) {
        const uploaded = await Promise.all(files.map((f) => base44.integrations.Core.UploadFile({ file: f })));
        fileUrls = uploaded.map((u) => (u?.data ?? u)?.file_url).filter(Boolean);
      }
      const extracted = await extractAircraftSpecs({ listingText, fileUrls });
      const { merged } = mergeExtractedSpecs(formData, extracted);
      setFormData(merged);
    } catch (e) {
      setError(e?.message || "Auto-fill failed.");
    } finally {
      setAutoFilling(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl p-6 md:p-8 bg-card border border-border">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}>
                <SlidersHorizontal className="h-6 w-6 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Valuation studio · multi-model</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
                Aircraft valuation with switchable AI engines
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                Same OMVM v5 core, but you pick the model. Try the default Gemini web-search engine first, then switch to
                a faster knowledge-based model for a second opinion or when the main one times out.
              </p>
            </div>
            <div className="flex flex-col gap-4 md:items-end">
              <div className="rounded-2xl p-4 text-sm leading-6 md:max-w-xs border border-[#D4A017]/30 bg-[#D4A017]/[0.06] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-black text-[#A67C00]"><ShieldCheck className="h-3.5 w-3.5" /> Independent lab</span>
                <p className="mt-1.5">This studio runs separately from the main Valuation desk — experiments here don't affect the production flow.</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-foreground border border-border bg-card hover:bg-muted/60 transition"
              >
                <RotateCcw className="h-4 w-4" /> New valuation
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl p-5 md:p-6 bg-card border border-border">
              <ModelSelector value={model} onChange={setModel} disabled={loading} />
            </div>
            <ValuationForm
              formData={formData}
              onChange={setFormData}
              onSubmit={handleSubmit}
              loading={loading}
              files={files}
              onFilesChange={setFiles}
              onAutoFill={handleAutoFill}
              autoFilling={autoFilling}
            />
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm border border-destructive/30 bg-destructive/10 text-destructive">
                {error}
              </div>
            )}
            {result?.model_used && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/[0.06] px-3 py-1 text-xs font-black text-[#A67C00]">
                <SlidersHorizontal className="h-3 w-3" />
                Engine used: {modelLabel(result.model_used)}
              </div>
            )}
            <ValuationReport result={result} aircraft={aircraft || formData} />
            <HistoricalPriceCheck
              make={(aircraft || formData).make}
              model={(aircraft || formData).model}
              year={(aircraft || formData).year}
            />
          </div>
        </div>
      </div>

      <EntitlementGateModal gate={gate} onClose={closeGate} onCheckout={startCheckout} />
    </div>
  );
}