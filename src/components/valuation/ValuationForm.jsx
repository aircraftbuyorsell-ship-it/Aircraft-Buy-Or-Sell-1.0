import { Search, FileText, Paperclip } from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

const FIELD_CLASS =
  "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition bg-muted text-foreground border border-border placeholder:text-muted-foreground/60";

export default function ValuationForm({ formData, onChange, onSubmit, loading, files, onFilesChange }) {
  const update = (field, value) => onChange({ ...formData, [field]: value });

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
          <input className={FIELD_CLASS} type="number" value={formData.year} onChange={(e) => update("year", e.target.value)} placeholder="2006" required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Airframe hours</span>
          <input className={FIELD_CLASS} type="number" value={formData.total_time} onChange={(e) => update("total_time", e.target.value)} placeholder="2450" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Engine hours SMOH</span>
          <input className={FIELD_CLASS} type="number" value={formData.engine_hours} onChange={(e) => update("engine_hours", e.target.value)} placeholder="620" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Engine TBO</span>
          <input className={FIELD_CLASS} type="number" value={formData.tbo} onChange={(e) => update("tbo", e.target.value)} placeholder="2000" />
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

      <div className="mt-5 pt-5 border-t border-border space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Prefer to paste a listing?</p>
          <h3 className="mt-1 text-sm font-black tracking-tight text-foreground">Paste listing text or upload spec sheet</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Valuation runs from the form fields, the pasted text, attached files, or any combination — fill in whatever you have and we'll merge the rest.</p>
        </div>

        <label className="space-y-1.5 block">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Listing text</span>
          <textarea
            className={`${FIELD_CLASS} min-h-[120px] resize-y`}
            value={formData.listing_text || ""}
            onChange={(e) => update("listing_text", e.target.value)}
            placeholder="Paste the full aircraft listing text here — make, model, year, hours, avionics, asking price…"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Attach PDF / doc / image</span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={(e) => onFilesChange?.(Array.from(e.target.files || []))}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-[#D4A017]/10 file:px-3 file:py-2 file:text-xs file:font-black file:text-[#A67C00] hover:file:bg-[#D4A017]/20 cursor-pointer"
          />
          {files && files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground truncate">• {f.name} <span className="text-muted-foreground/60">({(f.size / 1024).toFixed(0)} KB)</span></li>
              ))}
            </ul>
          )}
        </label>
      </div>

      <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition disabled:opacity-60" style={{ background: "linear-gradient(135deg, #D4A017, #f48120)" }}>
        {loading ? <MiniGlobe size={18} color="#D4A017" inline={true} /> : <Search className="h-4 w-4" />}
        {loading ? "Building market report..." : "Generate valuation report"}
      </button>
    </form>
  );
}