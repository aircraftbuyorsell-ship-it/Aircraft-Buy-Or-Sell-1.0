import { useEffect, useState } from "react";
import { Plane, Search, X } from "lucide-react";
import { normalizeReg } from "@/lib/aircraftLookup";

export default function AircraftContextBar({ registration, onChange }) {
  const [value, setValue] = useState(registration || "");
  useEffect(() => setValue(registration || ""), [registration]);

  const submit = (event) => {
    event.preventDefault();
    const next = normalizeReg(value);
    if (next) onChange(next);
  };

  return (
    <section className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3 sm:w-64">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <Plane className="h-4 w-4 text-primary" />
        </span>
        <div><p className="text-xs font-bold text-foreground">Active aircraft</p><p className="text-[10px] text-muted-foreground">Shared across intelligence tools</p></div>
      </div>
      <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-background p-1.5 shadow-sm">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <input aria-label="Aircraft registration" value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder="Enter aircraft ID" className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 font-mono text-sm font-medium uppercase text-foreground outline-none" />
        {registration && <button type="button" onClick={() => onChange("")} aria-label="Clear active aircraft" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>}
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-gold-deep disabled:opacity-60"><Search className="h-4 w-4" /><span className="hidden sm:inline">Pin aircraft</span></button>
      </form>
    </section>
  );
}