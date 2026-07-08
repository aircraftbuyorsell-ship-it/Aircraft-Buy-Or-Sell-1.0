/** ABOS Intelligence — compact stat card. accent: tailwind text class. */
export default function SummaryCard({ icon: Icon, label, value, sub, accent = "text-foreground" }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && <Icon className={`w-4 h-4 ${accent}`} />}
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      </div>
      <p className={`text-2xl font-black tabular-nums leading-none ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{sub}</p>}
    </div>
  );
}