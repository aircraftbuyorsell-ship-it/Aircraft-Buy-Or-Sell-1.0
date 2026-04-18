const DIMS = [
  { key: "technical", label: "Technical", weight: "30%" },
  { key: "documentation", label: "Documentation", weight: "25%" },
  { key: "transparency", label: "Transparency", weight: "25%" },
  { key: "transaction_ready", label: "Transaction Ready", weight: "20%" },
];

function barColor(v) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 65) return "bg-amber-500";
  return "bg-red-500";
}

export default function ATIDimensions({ passport }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6 flex flex-col justify-center gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Score Dimensions</p>
      {DIMS.map(({ key, label, weight }) => {
        const val = passport[key] ?? 0;
        return (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300 font-medium">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">{weight}</span>
                <span className="text-white font-bold w-8 text-right">{val}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(val)}`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}