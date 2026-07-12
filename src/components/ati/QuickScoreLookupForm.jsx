import { Loader2, Search } from "lucide-react";

export default function QuickScoreLookupForm({ value, onChange, onLookup, loading, error }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onLookup(); }} className="space-y-3">
      <div>
        <label htmlFor="quick-score-n-number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          1. Search by N-Number
        </label>
        <p className="mt-1 text-sm text-muted-foreground">We will retrieve all aircraft information already available.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="quick-score-n-number"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="N12345"
          maxLength={10}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-4 font-mono text-base tracking-wider text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button type="submit" disabled={loading || !value.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Searching…" : "Look Up Aircraft"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </form>
  );
}