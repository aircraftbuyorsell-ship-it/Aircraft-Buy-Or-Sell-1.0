import { Shield, TrendingUp, DollarSign, Award, AlertCircle } from "lucide-react";

export default function ScoreCardPreview({ passport }) {
  if (!passport) return null;

  const metrics = [
    { icon: Shield, label: "ATI Score", value: `${passport.ati_total || 0}/120`, color: "#f5c242" },
    { icon: Award, label: "Rating", value: passport.score_label || "—", color: "#5dcaa5" },
    passport.deal_label
      ? { icon: TrendingUp, label: "Deal", value: passport.deal_label, color: "#4e8ef7" }
      : null,
    passport.omvm_value
      ? { icon: DollarSign, label: "Market Value", value: `$${Number(passport.omvm_value).toLocaleString()}`, color: "#f5c242" }
      : null,
  ].filter(Boolean);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,194,66,0.10)" }}
        >
          <Shield className="w-4 h-4 text-[#f5c242]" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Selected Score Card</p>
          <h3 className="text-sm font-bold text-white/90">{passport.registration}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-2.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[9px] uppercase tracking-wider text-white/30 flex items-center gap-1">
              <m.icon className="w-2.5 h-2.5" /> {m.label}
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {passport.ai_summary && (
        <p className="text-[11px] text-white/50 leading-snug mt-3 line-clamp-3">{passport.ai_summary}</p>
      )}
    </div>
  );
}