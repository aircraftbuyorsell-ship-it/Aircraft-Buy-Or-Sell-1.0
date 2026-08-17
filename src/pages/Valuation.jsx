import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck } from "lucide-react";
import ValuationForm from "@/components/valuation/ValuationForm";
import ValuationReport from "@/components/valuation/ValuationReport";

const readParam = (key) => new URLSearchParams(window.location.search).get(key) || "";

const INITIAL_FORM = {
  make: "",
  model: "",
  year: "",
  total_time: "",
  engine_hours: "",
  tbo: "2000",
  avionics: "",
  asking_price: "",
  listing_text: "",
};

const toNumber = (value) => value === "" ? undefined : Number(value);
const numOrUndef = (v) => (v == null ? undefined : Number(v));

async function extractAircraftSpecs({ listingText, fileUrls }) {
  const prompt = `Extract aircraft specification fields from the following listing text and any attached documents. Return strict JSON only.
Fields: make (string), model (string), year (number), total_time (airframe hours number), engine_hours (SMOH number), tbo (number), avionics (comma-separated string), asking_price (number USD). Use null for anything not found.

LISTING TEXT:
${listingText || "(none)"}`;
  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        make: { type: ["string", "null"] },
        model: { type: ["string", "null"] },
        year: { type: ["number", "null"] },
        total_time: { type: ["number", "null"] },
        engine_hours: { type: ["number", "null"] },
        tbo: { type: ["number", "null"] },
        avionics: { type: ["string", "null"] },
        asking_price: { type: ["number", "null"] },
      },
    },
    ...(fileUrls.length ? { file_urls: fileUrls } : {}),
  });
  return res?.data ?? res;
}

export default function Valuation() {
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM,
    make: readParam("make"),
    model: readParam("model"),
    year: readParam("year"),
    total_time: readParam("total_time"),
    engine_hours: readParam("engine_hours"),
    tbo: readParam("tbo") || "2000",
    avionics: readParam("avionics"),
    asking_price: readParam("asking_price"),
  }));
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    try {
      // 1) Upload any attached files
      let fileUrls = [];
      if (files.length > 0) {
        const uploaded = await Promise.all(
          files.map((f) => base44.integrations.Core.UploadFile({ file: f }))
        );
        fileUrls = uploaded.map((u) => (u?.data ?? u)?.file_url).filter(Boolean);
      }

      const listingText = (formData.listing_text || "").trim();

      // 2) If the user pasted text or attached files, extract specs and fill blanks
      let merged = { ...formData };
      if (listingText || fileUrls.length) {
        try {
          const extracted = await extractAircraftSpecs({ listingText, fileUrls });
          for (const key of ["make", "model", "year", "total_time", "engine_hours", "tbo", "avionics", "asking_price"]) {
            const val = extracted?.[key];
            if (val != null && String(val).trim() !== "" && String(merged[key] || "").trim() === "") {
              merged[key] = key === "avionics" ? String(val) : val;
            }
          }
          setFormData((prev) => ({ ...prev, ...merged }));
        } catch (extractErr) {
          console.warn("[Valuation] spec extraction failed:", extractErr?.message);
        }
      }

      const payload = {
        make: String(merged.make || "").trim(),
        model: String(merged.model || "").trim(),
        year: toNumber(merged.year),
        total_time: numOrUndef(merged.total_time),
        engine_hours: numOrUndef(merged.engine_hours),
        tbo: toNumber(merged.tbo),
        avionics: String(merged.avionics || "").trim(),
        asking_price: numOrUndef(merged.asking_price),
        listing_text: listingText || undefined,
        file_urls: fileUrls.length ? fileUrls : undefined,
      };

      const response = await base44.functions.invoke("omvmV5Score", payload);
      setResult(response?.data ?? response);
      setAircraft(payload);
      setError(null);
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

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl p-6 md:p-8 bg-card border border-border">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}>
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">OMVM v5 valuation desk</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-5xl" style={{ letterSpacing: "-0.02em" }}>AI-driven aircraft price estimation and market report</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                Generate a professional sales-ready valuation using comparable inventory, aircraft age, engine position, avionics quality, and market calibration signals.
              </p>
            </div>
            <div className="rounded-2xl p-4 text-sm leading-6 md:max-w-xs border border-[#D4A017]/30 bg-[#D4A017]/[0.06] text-muted-foreground">
              Built for brokers, owners, and acquisition teams that need fast pricing intelligence before a listing, offer, or buyer conversation.
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ValuationForm formData={formData} onChange={setFormData} onSubmit={handleSubmit} loading={loading} files={files} onFilesChange={setFiles} />
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm border border-destructive/30 bg-destructive/10 text-destructive">
              {error}
            </div>
          )}
          <ValuationReport result={result} aircraft={aircraft || formData} />
        </div>
      </div>
    </div>
  );
}