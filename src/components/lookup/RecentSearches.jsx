export default function RecentSearches({ registrations, onSelect, loading }) {
  if (!registrations.length) return null;
  return (
    <section aria-label="Recent aircraft searches" className="mb-8">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">Recent searches</p>
      <div className="flex flex-wrap gap-2">
        {registrations.map((registration) => (
          <button key={registration} type="button" disabled={loading}
            onClick={() => onSelect(registration)}
            aria-label={`Search ${registration} again`}
            className="box-border inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs font-bold text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            style={{ borderRadius: "17.6px" }}>
            {registration}
          </button>
        ))}
      </div>
    </section>
  );
}