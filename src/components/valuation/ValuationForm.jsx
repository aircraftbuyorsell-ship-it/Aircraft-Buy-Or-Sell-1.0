import { Search } from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

const FIELD_CLASS = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition";
const FIELD_STYLE = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" };

export default function ValuationForm({ formData, onChange, onSubmit, loading }) {
  const update = (field, value) => onChange({ ...formData, [field]: value });

  return (
    <form onSubmit={onSubmit} className="rounded-2xl p-5 md:p-6" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.11)" }}>
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Aircraft valuation request</p>
        <h2 className="mt-2 text-xl font-black tracking-tight" style={{ color: "#fff", letterSpacing: "-0.01em" }}>Enter aircraft fundamentals</h2>
        <p className="mt-1 text-sm leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>Provide the core specs and OMVM will benchmark the aircraft against market comparables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Make</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} value={formData.make} onChange={(e) => update("make", e.target.value)} placeholder="Cessna" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Model</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} value={formData.model} onChange={(e) => update("model", e.target.value)} placeholder="172S" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Year</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} type="number" value={formData.year} onChange={(e) => update("year", e.target.value)} placeholder="2006" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Airframe hours</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} type="number" value={formData.total_time} onChange={(e) => update("total_time", e.target.value)} placeholder="2450" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Engine hours SMOH</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} type="number" value={formData.engine_hours} onChange={(e) => update("engine_hours", e.target.value)} placeholder="620" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Engine TBO</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} type="number" value={formData.tbo} onChange={(e) => update("tbo", e.target.value)} placeholder="2000" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Avionics / upgrades</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} value={formData.avionics} onChange={(e) => update("avionics", e.target.value)} placeholder="Garmin G1000, ADS-B, WAAS" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Asking price, optional</span>
          <input className={FIELD_CLASS} style={FIELD_STYLE} type="number" value={formData.asking_price} onChange={(e) => update("asking_price", e.target.value)} placeholder="185000" />
        </label>
      </div>

      <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition disabled:opacity-60" style={{ background: "linear-gradient(135deg, #D4A017, #f48120)" }}>
        {loading ? <MiniGlobe size={18} color="#D4A017" inline={true} /> : <Search className="h-4 w-4" />}
        {loading ? "Building market report..." : "Generate valuation report"}
      </button>
    </form>
  );
}