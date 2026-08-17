import { Search, Wrench } from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";
import { FIELD_CLASS, resolveTboFromForm } from "@/lib/aircraftInput";
import AircraftExtraInput from "@/components/aircraft-input/AircraftExtraInput";

export default function ValuationForm({ formData, onChange, onSubmit, loading, files, onFilesChange, onAutoFill, autoFilling }) {
  const update = (field, value) => onChange({ ...formData, [field]: value });
  const tboInfo = resolveTboFromForm(formData);

  return (
    <form onSubmit={onSubmit} className="rounded-2xl p-5 md:p-6 bg-card border border-border">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Aircraft valuation request</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-foreground" style={{ letterSpacing: "-0.01em" }}>Enter aircraft fundamentals</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Provide the core specs and OMVM will benchmark the aircraft against market comparables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Make</span>
          <input className={FIELD_CLASS} value={formData.make} onChange={(e) => update("make", e.target.value)} placeholder="Cessna" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Model</span>
          <input className={FIELD_CLASS} value={formData.model} onChange={(e) => update("model", e.target.value)} placeholder="172S" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Year</span>
          <input className={FIELD_CLASS} type="number" value={formData.year} onChange={(e) => update("year", e.target.value)} placeholder="2006" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Airframe hours</span>
          <input className={FIELD_CLASS} type="number" value={formData.total_time} onChange={(e) => update("total_time", e.target.value)} placeholder="2450" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Engine model</span>
          <input className={FIELD_CLASS} value={formData.engine_model || ""} onChange={(e) => update("engine_model", e.target.value)} placeholder="IO-360-L2A" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Engine hours SMOH</span>
          <input className={FIELD_CLASS} type="number" value={formData.engine_hours} onChange={(e) => update("engine_hours", e.target.value)} placeholder="620" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Engine TBO</span>
          <input className={FIELD_CLASS} type="number" value={formData.tbo} onChange={(e) => update("tbo", e.target.value)} placeholder="2000" />
          {tboInfo.matched && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 px-2 py-0.5 text-[10px] font-black text-[#A67C00]">
              {tboInfo.matched_prefix} · TBO {tboInfo.tbo}h · {tboInfo.fuel}
            </span>
          )}
          {!tboInfo.matched && tboInfo.engineModel && (
            <span className="text-[10px] text-muted-foreground">Engine “{tboInfo.engineModel}” not in TBO table — enter manually.</span>
          )}
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Avionics / upgrades</span>
          <input className={FIELD_CLASS} value={formData.avionics} onChange={(e) => update("avionics", e.target.value)} placeholder="Garmin G1000, ADS-B, WAAS" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Asking price, optional</span>
          <input className={FIELD_CLASS} type="number" value={formData.asking_price} onChange={(e) => update("asking_price", e.target.value)} placeholder="185000" />
        </label>
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <AircraftExtraInput
          listingText={formData.listing_text}
          onListingTextChange={(v) => update("listing_text", v)}
          files={files}
          onFilesChange={onFilesChange}
          onAutoFill={onAutoFill}
          autoFilling={autoFilling}
        />
      </div>

      <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition disabled:opacity-60" style={{ background: "linear-gradient(135deg, #D4A017, #f48120)" }}>
        {loading ? <MiniGlobe size={18} color="#D4A017" inline={true} /> : <Search className="h-4 w-4" />}
        {loading ? "Building market report..." : "Generate valuation report"}
      </button>
    </form>
  );
}