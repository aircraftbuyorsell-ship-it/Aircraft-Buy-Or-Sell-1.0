function DealBadge({ score, label }) {
  const color =
    score >= 8.5
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score >= 6.5
      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
      : score >= 5
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${color}`}>
      <span className="text-lg">{score}</span>
      <span className="font-medium capitalize">{label}</span>
    </span>
  );
}

export default function ATIValuation({ passport, listing }) {
  const asking = listing?.asking_price;
  const omvm = passport.omvm_value;
  const disc = passport.discount_pct;
  const isBargain = disc > 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">Valuation & Deal Score</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Asking price */}
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Asking Price</p>
          <p className="text-3xl font-black text-white">
            {asking != null ? `$${asking.toLocaleString()}` : "—"}
          </p>
        </div>

        {/* Diff indicator */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 mb-1">vs OMVM</p>
          {disc != null ? (
            <p className={`text-2xl font-bold ${isBargain ? "text-emerald-400" : "text-red-400"}`}>
              {isBargain ? "−" : "+"}{Math.abs(disc)}%
            </p>
          ) : (
            <p className="text-slate-600 text-lg">—</p>
          )}
          <p className="text-xs text-slate-500 mt-1">{isBargain ? "below market" : "above market"}</p>
        </div>

        {/* OMVM */}
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">OMVM Est. Value</p>
          <p className="text-3xl font-black text-slate-300">
            {omvm != null ? `$${omvm.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {/* Deal score */}
      <div className="flex justify-center mt-6 pt-5 border-t border-slate-800">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500">Deal Score</p>
          <DealBadge score={passport.deal_score} label={passport.deal_label || ""} />
        </div>
      </div>
    </div>
  );
}