import { ArrowUpRight, Lock, Loader2 } from "lucide-react";

const STATUS_STYLES = {
  live: { bg: "rgba(93,202,165,0.08)", color: "#5dcaa5", border: "rgba(93,202,165,0.22)", label: "Live" },
  premium: { bg: "rgba(245,194,66,0.08)", color: "#f5c242", border: "rgba(245,194,66,0.22)", label: "Premium" },
  coming_soon: { bg: "rgba(120,130,145,0.08)", color: "rgba(120,130,145,0.80)", border: "rgba(120,130,145,0.20)", label: "Coming Soon" },
  request_access: { bg: "rgba(122,0,255,0.06)", color: "#a06bff", border: "rgba(122,0,255,0.20)", label: "Request Access" },
};

export default function DhlApiCard({ api, isSelected, onClick }) {
  const status = STATUS_STYLES[api.status] || STATUS_STYLES.coming_soon;
  const isLive = api.status === "live";

  return (
    <button
      onClick={onClick}
      disabled={!isLive && !isSelected}
      className="text-left p-4 rounded-xl transition-all w-full"
      style={{
        background: isSelected ? "rgba(245,194,66,0.06)" : "rgba(255,255,255,0.03)",
        border: isSelected
          ? "0.5px solid rgba(245,194,66,0.25)"
          : isLive
          ? "0.5px solid rgba(93,202,165,0.18)"
          : "0.5px solid rgba(255,255,255,0.06)",
        opacity: isLive || isSelected ? 1 : 0.65,
        cursor: isLive || isSelected ? "pointer" : "default",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isLive && <Lock className="w-3 h-3 shrink-0" style={{ color: "rgba(120,130,145,0.50)" }} />}
          <h3 className="text-xs font-bold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>{api.name}</h3>
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
          style={{ background: status.bg, color: status.color, border: `0.5px solid ${status.border}` }}
        >
          {status.label}
        </span>
      </div>
      <p className="text-[11px] leading-snug mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>{api.description}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {api.features.map((f, i) => (
          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.40)" }}>
            {f}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.30)" }}>
          {api.region} · {api.category}
        </span>
        {api.docsUrl && (
          <a href={api.docsUrl} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: isLive ? "#5dcaa5" : "rgba(120,130,145,0.60)" }}>
            Docs <ArrowUpRight className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </button>
  );
}