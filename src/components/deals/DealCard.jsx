import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function dealBadgeStyle(score) {
  if (score >= 8.5) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (score >= 6.5) return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  if (score >= 5) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-red-500/15 text-red-400 border-red-500/30";
}

function labelPillStyle(label) {
  if (!label) return "bg-slate-700 text-slate-400";
  const l = label.toLowerCase();
  if (l.includes("hot")) return "bg-emerald-500/20 text-emerald-300";
  if (l.includes("good")) return "bg-sky-500/20 text-sky-300";
  if (l.includes("fair")) return "bg-amber-500/20 text-amber-300";
  return "bg-red-500/20 text-red-300";
}

export default function DealCard({ deal }) {
  const disc = deal.discount_pct;
  const isPositive = disc != null && disc > 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 transition-colors flex flex-col p-5 gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-bold text-base leading-tight">
            {deal.make} {deal.model}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {deal.year || "—"} · <span className="font-mono">{deal.registration || "—"}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${dealBadgeStyle(deal.deal_score)}`}>
            ★ {deal.deal_score?.toFixed(1) ?? "—"}
          </span>
          {deal.deal_label && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${labelPillStyle(deal.deal_label)}`}>
              {deal.deal_label}
            </span>
          )}
        </div>
      </div>

      {/* Prices */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Asking Price</p>
          <p className="text-2xl font-black text-white">
            {deal.asking_price != null ? `$${deal.asking_price.toLocaleString()}` : "—"}
          </p>
          {deal.omvm_value != null && (
            <p className="text-xs text-slate-500 mt-0.5">
              OMVM: ${deal.omvm_value.toLocaleString()}
            </p>
          )}
        </div>

        {/* Discount */}
        {disc != null && (
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">Discount</p>
            <p className={`text-3xl font-black ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? "−" : "+"}{Math.abs(disc)}%
            </p>
          </div>
        )}
      </div>

      {/* ATI + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        {deal.ati_score != null ? (
          <span className="text-xs text-slate-400">
            ATI Score: <span className="text-white font-semibold">{deal.ati_score}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-600">ATI not scored</span>
        )}
        <Link
          to={`/ati-passport/${deal.id}`}
          className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
        >
          View Passport <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}