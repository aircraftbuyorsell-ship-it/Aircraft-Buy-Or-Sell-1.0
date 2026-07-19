import { ArrowUpRight, Lock, Loader2 } from "lucide-react";

export default function MaerskApiCard({ api, onSelect, isActive, loading }) {
  const { name, description, category, status, docsUrl, icon: Icon, features } = api;

  const statusConfig = {
    live: { label: "Live Now", variant: "default", style: { background: "rgba(93,202,165,0.15)", color: "#5dcaa5", border: "0.5px solid rgba(93,202,165,0.30)" } },
    coming_soon: { label: "Coming Soon", variant: "secondary", style: { background: "rgba(245,194,66,0.10)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.25)" } },
    request_access: { label: "Request Access", variant: "secondary", style: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)", border: "0.5px solid rgba(255,255,255,0.12)" } },
    premium: { label: "Premium", variant: "secondary", style: { background: "rgba(122,0,255,0.10)", color: "#a78bfa", border: "0.5px solid rgba(122,0,255,0.25)" } },
  };

  const cfg = statusConfig[status] || statusConfig.request_access;
  const isGated = status !== "live";

  return (
    <button
      onClick={() => !isGated && onSelect?.(api)}
      disabled={isGated}
      className="text-left w-full p-4 rounded-xl transition-all hover:scale-[1.01] disabled:hover:scale-100 disabled:cursor-not-allowed"
      style={{
        background: isActive ? "rgba(245,194,66,0.06)" : "rgba(255,255,255,0.03)",
        border: isActive ? "0.5px solid rgba(245,194,66,0.25)" : "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,194,66,0.08)" }}>
          {loading && isActive ? (
            <Loader2 size={16} className="animate-spin text-[#f5c242]" />
          ) : (
            <Icon size={16} className="text-[#f5c242]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white/90 truncate">{name}</h3>
            {isGated && <Lock size={11} className="text-white/30 shrink-0" />}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium">{category}</p>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={cfg.style}>
          {cfg.label}
        </span>
      </div>
      <p className="text-[11px] text-white/50 leading-snug mb-2">{description}</p>
      {features && (
        <ul className="space-y-0.5">
          {features.slice(0, 2).map((f, i) => (
            <li key={i} className="text-[10px] text-white/35 flex items-start gap-1">
              <span className="text-[#f5c242] mt-0.5">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {docsUrl && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-white/30">
          <ArrowUpRight size={10} />
          <span>Docs</span>
        </div>
      )}
    </button>
  );
}