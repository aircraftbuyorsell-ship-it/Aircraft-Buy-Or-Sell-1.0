import { Search, RefreshCw, Sparkles } from "lucide-react";

const GOLD = "#f5c242";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "mechanic", label: "Mechanics / MRO" },
  { id: "ap_mechanic", label: "A&P Mechanics" },
  { id: "flight_school", label: "Flight Schools" },
  { id: "refueling_fbo", label: "FBOs / Fuel" },
  { id: "dealer", label: "Dealers" },
  { id: "broker", label: "Brokers" },
  { id: "paint_shop", label: "Paint Shops" },
];

export default function ServiceFilterBar({
  activeCat,
  setActiveCat,
  region,
  setRegion,
  onEnrich,
  enriching,
  isAdmin,
  counts = {},
}) {
  return (
    <div
      className="sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: "rgba(4,6,10,0.92)",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        padding: "12px 0",
      }}
    >
      {/* Row 1: Region search + Enrich button */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={14}
            style={{ color: "rgba(255,255,255,0.30)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onEnrich?.()}
            placeholder="Search worldwide — city, region, or country (e.g. London, Dubai, São Paulo, Japan)…"
            className="w-full"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: WHITE,
              fontSize: 13,
              padding: "10px 14px 10px 34px",
              minHeight: 42,
            }}
          />
        </div>

        {isAdmin && (
          <button
            onClick={onEnrich}
            disabled={enriching}
            className="flex items-center gap-2 rounded-lg transition-all whitespace-nowrap shrink-0"
            style={{
              background: enriching ? "rgba(245,194,66,0.05)" : "rgba(245,194,66,0.09)",
              border: "0.5px solid rgba(245,194,66,0.22)",
              color: GOLD,
              fontSize: 12,
              fontWeight: 600,
              padding: "0 16px",
              minHeight: 42,
              opacity: enriching ? 0.6 : 1,
            }}
          >
            {enriching ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span className="hidden sm:inline">{enriching ? "Enriching…" : "Enrich via Google"}</span>
            <span className="sm:hidden">{enriching ? "…" : "Enrich"}</span>
          </button>
        )}
      </div>

      {/* Row 2: Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => {
          const active = activeCat === cat.id;
          const count = counts[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap shrink-0"
              style={{
                background: active ? "rgba(245,194,66,0.09)" : "rgba(255,255,255,0.04)",
                border: active ? "0.5px solid rgba(245,194,66,0.22)" : "0.5px solid rgba(255,255,255,0.08)",
                color: active ? GOLD : MUTED,
                fontSize: 11,
                fontWeight: 600,
                minHeight: 32,
              }}
            >
              {cat.label}
              {count > 0 && (
                <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 700 }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}