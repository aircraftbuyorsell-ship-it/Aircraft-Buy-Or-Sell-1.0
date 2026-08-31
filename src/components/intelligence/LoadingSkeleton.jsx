/**
 * ABOS Intelligence — loading skeleton.
 * variant: "cards" (grid of tiles) | "rows" (list) | "block" (single area)
 */
export default function LoadingSkeleton({ variant = "rows", count = 3, height = "h-16" }) {
  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" aria-busy="true">
        {[...Array(count)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-pulse bg-muted" />)}
      </div>
    );
  }
  if (variant === "block") {
    return <div className={`rounded-xl animate-pulse bg-muted ${height}`} aria-busy="true" />;
  }
  return (
    <div className="space-y-2" aria-busy="true">
      {[...Array(count)].map((_, i) => <div key={i} className={`rounded-xl animate-pulse bg-muted ${height}`} />)}
    </div>
  );
}