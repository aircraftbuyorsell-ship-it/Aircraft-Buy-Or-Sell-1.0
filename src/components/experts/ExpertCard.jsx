import { Star, BadgeCheck, Users } from "lucide-react";

const CERT_COLORS = {
  "A&P": "#22c55e", "IA": "#4e8ef7", "EASA Part-66 B1": "#f5c242",
  "EASA Part-66 B2": "#f5c242", "EASA Part-66 C": "#f5c242",
  "FAA Part 145": "#8b5cf6", "Type Rated Inspector": "#06b6d4", "DAR": "#ec4899",
};

function initials(name) {
  return (name || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ExpertCard({ expert }) {
  const rating = expert.rating || 0;
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,194,66,0.10)", border: "1px solid rgba(245,194,66,0.30)" }}>
          <span className="text-[15px] font-black" style={{ color: "#f5c242" }}>{initials(expert.full_name)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-black text-[rgba(255,255,255,0.92)] truncate">{expert.full_name}</p>
          <div className="flex items-center gap-1 text-[11px] text-[rgba(255,255,255,0.45)]">
            <BadgeCheck size={12} className="text-[#22c55e]" /> ABOS Verified Expert
          </div>
        </div>
      </div>

      {expert.fb_community_verified && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg self-start"
          style={{ background: "rgba(78,142,247,0.08)", border: "0.5px solid rgba(78,142,247,0.30)" }}>
          <Users size={11} style={{ color: "#4e8ef7" }} />
          <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: "#4e8ef7" }}>
            {expert.fb_community_tag || "Aircraft Buy or Sell Community Verified"}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(expert.certifications || []).map((c) => {
          const color = CERT_COLORS[c] || "#f5c242";
          return (
            <span key={c} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${color}10`, color, border: `0.5px solid ${color}30` }}>{c}</span>
          );
        })}
      </div>

      {expert.bio && <p className="text-[11px] text-[rgba(255,255,255,0.50)] leading-relaxed line-clamp-3">{expert.bio}</p>}

      <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={12} fill={i <= Math.round(rating) ? "#f5c242" : "none"}
              style={{ color: i <= Math.round(rating) ? "#f5c242" : "rgba(255,255,255,0.15)" }} />
          ))}
          <span className="text-[10px] text-[rgba(255,255,255,0.40)] ml-1">{rating > 0 ? rating.toFixed(1) : "New"}</span>
        </div>
        <span className="text-[10px] font-bold text-[rgba(255,255,255,0.50)]">
          {expert.completed_count || 0} CrossChecks
        </span>
      </div>
    </div>
  );
}