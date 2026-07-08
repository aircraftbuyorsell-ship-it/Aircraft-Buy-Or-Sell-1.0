/** ABOS Intelligence — card wrapper for charts/visualizations with consistent header. */
export default function ChartCard({ title, sub, right, children, className = "" }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight">{title}</h3>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}