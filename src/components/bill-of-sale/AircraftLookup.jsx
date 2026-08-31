import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

const MODES = [["registration", "N-number"], ["serial", "Serial number"], ["listing", "Listing ID / URL"], ["profile", "ATI Passport"], ["deal", "Deal ID"]];
export default function AircraftLookup({ onLookup, loading }) {
  const [mode, setMode] = useState("registration"), [query, setQuery] = useState("");
  const submit = (event) => { event.preventDefault(); onLookup(mode, query); };
  return <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
    <div className="mb-4"><h2 className="font-bold text-card-foreground">1. Aircraft lookup</h2><p className="text-sm text-muted-foreground">Start from FAA registration, serial number, listing, aircraft profile, or deal.</p></div>
    <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
      <select value={mode} onChange={(e) => setMode(e.target.value)} className="h-11 rounded-xl border px-3 text-sm">{MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={mode === "registration" ? "N1791V" : "Enter reference"} className="h-11 rounded-xl border px-3 text-sm" />
      <button disabled={loading || !query.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Autofill</button>
    </div>
  </form>;
}