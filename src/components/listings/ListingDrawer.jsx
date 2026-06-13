import { X, ExternalLink, CheckCircle2, ArrowUpRight, UserPlus, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddLeadModal from "@/components/leads/AddLeadModal";

function scoreColor(score) {
  if (!score) return "#AAA49C";
  if (score >= 90) return "#0F7A56";
  if (score >= 72) return "#185FA5";
  if (score >= 54) return "#D4A017";
  return "#C0392B";
}
function scoreLabel(score) {
  if (!score) return "Not Scored";
  if (score >= 108) return "Exceptional";
  if (score >= 90) return "Strong Buy";
  if (score >= 72) return "Fair";
  if (score >= 54) return "Caution";
  return "Avoid";
}
function dealStyle(label) {
  const map = {
    "hot deal": "bg-[rgba(212,160,23,0.12)] text-[#A67C00] border-[rgba(212,160,23,0.3)]",
    "good deal": "bg-[rgba(15,122,86,0.1)] text-[#0F7A56] border-[rgba(15,122,86,0.25)]",
    "fair": "bg-[rgba(24,95,165,0.08)] text-[#185FA5] border-[rgba(24,95,165,0.2)]",
    "overpriced": "bg-[rgba(192,57,43,0.08)] text-[#C0392B] border-[rgba(192,57,43,0.2)]",
  };
  return map[(label || "").toLowerCase()] || "bg-black/5 text-[#AAA49C] border-black/10";
}

function Row({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-black/[0.05] last:border-0">
      <span className="text-[11px] text-[#AAA49C] font-semibold shrink-0">{label}</span>
      <span className="text-[12px] text-[#1A1814] font-semibold text-right">{value}</span>
    </div>
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

  const avionics = l?.avionics ? l.avionics.split(",").map(s => s.trim()).filter(Boolean) : [];
  const enginePct = l?.tbo && l?.engine_hours != null
    ? Math.max(0, Math.min(100, ((l.tbo - l.engine_hours) / l.tbo) * 100))
    : null;
  const engineColor = enginePct > 60 ? "#0F7A56" : enginePct > 30 ? "#D4A017" : "#C0392B";
  const color = scoreColor(l?.ati_score);
  const isBelow = l?.discount_pct != null && l.discount_pct >= 0;

  return (
    <>
      {l && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${l ? "translate-x-0" : "translate-x-full"}`}>
        {l && (
          <>
            {/* ── Header (navy band) ── */}
            <div className="bg-[#0B2D5B] px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.2em] font-bold">ATI Score Card</p>
                  <h2 className="text-white font-black text-xl leading-tight mt-0.5 truncate">
                    {l.year} {l.make} {l.model}
                  </h2>
                  <p className="text-white/50 font-mono text-[11px] mt-0.5">{l.registration || "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
                    <X className="w-5 h-5" />
                  </button>
                  {/* Score circle */}
                  <div className="relative w-12 h-12">
                    <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke={color} strokeWidth="3.5"
                        strokeDasharray={`${((l.ati_score || 0) / 120) * 113.1} 113.1`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white font-black text-sm leading-none">{l.ati_score || "—"}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color }}>{scoreLabel(l.ati_score)}</span>
                </div>
              </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto">
              {/* Price + deal row */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                <div>
                  <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold">Asking Price</p>
                  <p className="text-2xl font-black text-[#1A1814]">
                    {l.asking_price != null ? `$${l.asking_price.toLocaleString()}` : "—"}
                  </p>
                  {l.omvm_value && (
                    <p className="text-[10px] text-[#AAA49C] mt-0.5">Market est. ${l.omvm_value.toLocaleString()}</p>
                  )}
                </div>
                <div className="text-right space-y-1.5">
                  {l.deal_label && (
                    <span className={`text-[8px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full border block ${dealStyle(l.deal_label)}`}>
                      {l.deal_label}
                    </span>
                  )}
                  {l.discount_pct != null && (
                    <div className={`flex items-center justify-end gap-0.5 text-[10px] font-black ${isBelow ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                      {isBelow ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(l.discount_pct)}% {isBelow ? "below" : "above"} market
                    </div>
                  )}
                </div>
              </div>

              {/* Specs */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">Aircraft Specs</p>
                <Row label="Registration" value={l.registration} />
                <Row label="Year" value={l.year} />
                <Row label="Total Time" value={l.total_time != null ? `${l.total_time.toLocaleString()} hrs` : null} />
                <Row label="Engine Hours" value={l.engine_hours != null ? `${l.engine_hours.toLocaleString()} hrs` : null} />
                <Row label="TBO" value={l.tbo != null ? `${l.tbo.toLocaleString()} hrs` : null} />
                <Row label="Engine Count" value={l.engine_count} />
                {l.fresh_annual && (
                  <div className="flex justify-between gap-4 py-2.5 border-b border-black/[0.05]">
                    <span className="text-[11px] text-[#AAA49C] font-semibold">Fresh Annual</span>
                    <span className="flex items-center gap-1 text-[12px] text-[#0F7A56] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                    </span>
                  </div>
                )}
                <Row label="Last Annual" value={l.last_annual} />
                <Row label="Source" value={l.source_platform} />
              </div>

              {/* Engine life bar */}
              {enginePct != null && (
                <div className="px-5 py-3 border-t border-black/[0.05]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-bold">Engine Life Remaining</span>
                    <span className="text-[9px] font-black" style={{ color: engineColor }}>{Math.round(enginePct)}%</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${enginePct}%`, backgroundColor: engineColor }} />
                  </div>
                </div>
              )}

              {/* Avionics */}
              {avionics.length > 0 && (
                <div className="px-5 py-3 border-t border-black/[0.05]">
                  <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">Avionics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {avionics.map(av => (
                      <span key={av} className="text-[10px] bg-[#F7F4EF] border border-black/[0.07] text-[#4A4845] font-semibold px-2.5 py-1 rounded-full">
                        {av}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {l.ai_summary && (
                <div className="px-5 py-3 border-t border-black/[0.05]">
                  <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">Deal Summary</p>
                  <p className="text-[12px] text-[#4A4845] leading-relaxed">{l.ai_summary}</p>
                </div>
              )}

              {l.source_url && (
                <div className="px-5 py-3 border-t border-black/[0.05]">
                  <a href={l.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-[#D4A017] hover:text-[#A67C00] font-semibold transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View original listing
                  </a>
                </div>
              )}
            </div>

            {/* ── Footer CTAs ── */}
            <div className="px-5 py-4 border-t border-black/[0.07] space-y-2 bg-white">
              <button
                onClick={() => { onClose(); navigate(`/ati-passport/${l.id}`); }}
                className="w-full bg-[#0B2D5B] hover:bg-[#143C75] text-white font-black text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#E8A83A]" />
                {l.ati_score ? "View Full ATI Score Card" : "Issue ATI Score Card"}
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAddLeadOpen(true)}
                className="w-full bg-[#F7F4EF] hover:bg-[#EDE9E2] text-[#1A1814] font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-black/[0.07]"
              >
                <UserPlus className="w-4 h-4 text-[#D4A017]" />
                Capture Buyer Lead
              </button>
            </div>
          </>
        )}
      </div>

      <AddLeadModal
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        listing={l}
        onSaved={() => {}}
      />
    </>
  );
}