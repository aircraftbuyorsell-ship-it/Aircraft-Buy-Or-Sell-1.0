import { useState, useEffect } from "react";
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
};

const toNumber = (value) => value === "" ? undefined : Number(value);

export default function Valuation() {
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM,
    make: readParam("make"),
    model: readParam("model"),
    year: readParam("year"),
    engine_hours: readParam("engine_hours"),
    asking_price: readParam("asking_price"),
  }));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aircraft, setAircraft] = useState(null);

  const hasPrefill = !!(readParam("make") || readParam("model"));

  useEffect(() => {
    if (hasPrefill && formData.make && formData.model) {
      // Auto-trigger if URL params are present
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: toNumber(formData.year),
      total_time: toNumber(formData.total_time),
      engine_hours: toNumber(formData.engine_hours),
      tbo: toNumber(formData.tbo),
      avionics: formData.avionics.trim(),
      asking_price: toNumber(formData.asking_price),
    };

    const response = await base44.functions.invoke("omvmV5Score", payload);
    setResult(response.data);
    setAircraft(payload);
    setLoading(false);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: "#0B1220", color: "#fff" }}>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl p-6 md:p-8" style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}>
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">OMVM v5 valuation desk</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl" style={{ color: "#fff", letterSpacing: "-0.02em" }}>AI-driven aircraft price estimation and market report</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
                Generate a professional sales-ready valuation using comparable inventory, aircraft age, engine position, avionics quality, and market calibration signals.
              </p>
            </div>
            <div className="rounded-2xl p-4 text-sm leading-6 md:max-w-xs" style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", color: "rgba(255,255,255,0.55)" }}>
              Built for brokers, owners, and acquisition teams that need fast pricing intelligence before a listing, offer, or buyer conversation.
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ValuationForm formData={formData} onChange={setFormData} onSubmit={handleSubmit} loading={loading} />
          <ValuationReport result={result} aircraft={aircraft || formData} />
        </div>
      </div>
    </div>
  );
}