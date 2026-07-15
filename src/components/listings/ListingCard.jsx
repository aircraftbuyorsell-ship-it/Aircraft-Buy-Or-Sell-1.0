import { CheckCircle2 } from "lucide-react";
import ComplianceBadge from "@/components/gcr/ComplianceBadge";

function ATIBadge({ score }) {
  if (score == null) return null;
  const cls =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : score >= 65
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      ATI {score}
    </span>
  );
}

function DealPill({ score, label }) {
  if (!label) return null;
  const isHot = label === "hot deal";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${isHot ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" : "bg-muted text-muted-foreground border-border"}`}>
      {score != null && <span className="mr-1 font-bold">{score}</span>}
      {label}
    </span>
  );
}

export default function ListingCard({ listing: l, onClick }) {
  const enginePct = l.tbo ? Math.min(100, Math.round(((l.tbo - l.engine_hours) / l.tbo) * 100)) : null;

  return (
    <div
      onClick={onClick}
      className="group rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/50 transition-all cursor-pointer p-5 flex flex-col gap-4"
    >
      {l.photo_url && l.photo_source !== "hf_generated" && (
        <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <img src={l.photo_url} alt={`${l.make} ${l.model}`} className="w-full h-full object-cover" loading="lazy" />
          {l.photo_source && l.photo_source !== "none" && (
            <span className="absolute bottom-1.5 right-1.5 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "rgba(34,197,94,0.85)" }}>
              Real
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-foreground text-base leading-tight">
            {l.make} {l.model}
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {l.year && <span>{l.year} · </span>}
            <span className="font-mono">{l.registration || "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <ATIBadge score={l.ati_score} />
          <ComplianceBadge registration={l.registration} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {l.asking_price != null ? `$${l.asking_price.toLocaleString()}` : "—"}
          </p>
          {l.omvm_value && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">OMVM ${l.omvm_value.toLocaleString()}</p>
          )}
        </div>
        <DealPill score={l.deal_score} label={l.deal_label} />
      </div>

      {l.engine_hours != null && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Engine Hrs</span>
            <span className="font-mono">
              {l.engine_hours} / {l.tbo ?? "—"} hrs
            </span>
          </div>
          {enginePct != null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${enginePct > 50 ? "bg-emerald-500" : enginePct > 25 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${enginePct}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        {l.fresh_annual ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fresh annual
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">No fresh annual</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          ATI Passport →
        </button>
      </div>
    </div>
  );
}