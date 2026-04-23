import { X, ExternalLink, CheckCircle2, Cpu, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddLeadModal from "@/components/leads/AddLeadModal";

function Row({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-800 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-200 text-right">{value}</span>
    </div>
  );
}

function ATIBadge({ score }) {
  if (score == null) return null;
  const cls =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score >= 65
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${cls}`}>
      ATI {score}
    </span>
  );
}

export default function ListingDrawer({ listing: l, onClose }) {
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const avionics = l?.avionics
    ? l.avionics.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* Backdrop */}
      {l && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#0d1321] border-l border-slate-700 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${l ? "translate-x-0" : "translate-x-full"}`}
      >
        {l && (
          <>
            {/* Drawer header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {l.make} {l.model}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  {l.year} · <span className="font-mono">{l.registration || "—"}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ATIBadge score={l.ati_score} />
                <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Price block */}
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Asking Price</p>
                  <p className="text-3xl font-bold text-white">
                    {l.asking_price != null ? `$${l.asking_price.toLocaleString()}` : "—"}
                  </p>
                </div>
                {l.deal_label && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Deal</p>
                    <p className="text-sky-400 font-semibold capitalize">{l.deal_label}</p>
                    {l.deal_score != null && (
                      <p className="text-slate-400 text-sm">Score {l.deal_score}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Aircraft Details</p>
                <Row label="Registration" value={l.registration} />
                <Row label="Make" value={l.make} />
                <Row label="Model" value={l.model} />
                <Row label="Year" value={l.year} />
                <Row label="Total Time" value={l.total_time != null ? `${l.total_time.toLocaleString()} hrs` : null} />
                <Row label="Engine Hours" value={l.engine_hours != null ? `${l.engine_hours.toLocaleString()} hrs` : null} />
                <Row label="TBO" value={l.tbo != null ? `${l.tbo.toLocaleString()} hrs` : null} />
                <Row label="Engine Count" value={l.engine_count} />
                {l.fresh_annual && (
                  <div className="flex justify-between gap-4 py-2 border-b border-slate-800 text-sm">
                    <span className="text-slate-500">Fresh Annual</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Yes
                    </span>
                  </div>
                )}
                <Row label="Last Annual" value={l.last_annual} />
                <Row label="Source Platform" value={l.source_platform} />
              </div>

              {/* OMVM / ATI */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Valuation</p>
                <Row label="OMVM Value" value={l.omvm_value != null ? `$${l.omvm_value.toLocaleString()}` : null} />
                <Row label="Discount" value={l.discount_pct != null ? `${l.discount_pct > 0 ? "−" : "+"}${Math.abs(l.discount_pct)}%` : null} />
                <Row label="ATI Score" value={l.ati_score} />
              </div>

              {/* Avionics */}
              {avionics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Avionics</p>
                  <div className="flex flex-wrap gap-2">
                    {avionics.map((av) => (
                      <span key={av} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">
                        <Cpu className="w-3 h-3 text-sky-400" />
                        {av}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {l.ai_summary && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">AI Summary</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{l.ai_summary}</p>
                </div>
              )}

              {/* Source URL */}
              {l.source_url && (
                <a
                  href={l.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View original listing
                </a>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-6 border-t border-slate-800 space-y-2">
              <button
                onClick={() => { onClose(); navigate(`/ati-passport/${l.id}`); }}
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4" />
                Generate ATI Score
              </button>
              <button
                onClick={() => setAddLeadOpen(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <UserPlus className="w-4 h-4" />
                Capture Lead for this Aircraft
              </button>
            </div>
          </>
        )}
      </div>

      <AddLeadModal
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        listing={l}
        onSaved={() => { /* invalidation happens on Leads page */ }}
      />
    </>
  );
}