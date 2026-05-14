import { Loader2, Search } from "lucide-react";

const FIELD_CLASS = "w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-[#1A1814] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20";

export default function ValuationForm({ formData, onChange, onSubmit, loading }) {
  const update = (field, value) => onChange({ ...formData, [field]: value });

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Aircraft valuation request</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-[#1A1814]">Enter aircraft fundamentals</h2>
        <p className="mt-1 text-sm leading-6 text-[#6B6560]">Provide the core specs and OMVM will benchmark the aircraft against market comparables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Make</span>
          <input className={FIELD_CLASS} value={formData.make} onChange={(e) => update("make", e.target.value)} placeholder="Cessna" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Model</span>
          <input className={FIELD_CLASS} value={formData.model} onChange={(e) => update("model", e.target.value)} placeholder="172S" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Year</span>
          <input className={FIELD_CLASS} type="number" value={formData.year} onChange={(e) => update("year", e.target.value)} placeholder="2006" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Airframe hours</span>
          <input className={FIELD_CLASS} type="number" value={formData.total_time} onChange={(e) => update("total_time", e.target.value)} placeholder="2450" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Engine hours SMOH</span>
          <input className={FIELD_CLASS} type="number" value={formData.engine_hours} onChange={(e) => update("engine_hours", e.target.value)} placeholder="620" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Engine TBO</span>
          <input className={FIELD_CLASS} type="number" value={formData.tbo} onChange={(e) => update("tbo", e.target.value)} placeholder="2000" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Avionics / upgrades</span>
          <input className={FIELD_CLASS} value={formData.avionics} onChange={(e) => update("avionics", e.target.value)} placeholder="Garmin G1000, ADS-B, WAAS" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Asking price, optional</span>
          <input className={FIELD_CLASS} type="number" value={formData.asking_price} onChange={(e) => update("asking_price", e.target.value)} placeholder="185000" />
        </label>
      </div>

      <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2D5B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#143C75] disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? "Building market report..." : "Generate valuation report"}
      </button>
    </form>
  );
}