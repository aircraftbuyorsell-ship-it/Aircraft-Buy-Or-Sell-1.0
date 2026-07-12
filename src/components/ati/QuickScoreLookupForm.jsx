import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";

export default function QuickScoreLookupForm({ value, onChange, onLookup, loading, error }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Search by N-Number</p>
        <p className="mt-1 text-sm text-muted-foreground">We will retrieve all aircraft information already available.</p>
      </div>
      <SmartAircraftSearch variant="hero" value={value} onChange={(next) => onChange(next.toUpperCase())} onSubmit={() => onLookup()} loading={loading} />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}