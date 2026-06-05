import { useState } from "react";
import { X, Search, ShieldCheck, Plane } from "lucide-react";

function atiColor(score) {
  if (score == null) return "#ffffff30";
  if (score >= 90) return "#00f5ff";
  if (score >= 72) return "#7a00ff";
  if (score >= 54) return "#E8A83A";
  return "#ff4d6d";
}

export default function AircraftPickerModal({ open, onClose, listings, isLoading, selectedIds, onSelect }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = listings.filter(l => {
    const q = search.toLowerCase();
    return !q || `${l.make} ${l.model} ${l.registration} ${l.year}`.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ background: "rgba(13,20,50,0.97)", backdropFilter: "blur(48px)", border: "1px solid rgba(0,245,255,0.16)", boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(0,245,255,0.15)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(0,245,255,0.10)" }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#00f5ff] font-black">Select Aircraft</p>
            <p className="text-[13px] font-black text-white mt-0.5">Add to Comparison</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Make, model, tail number…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-white placeholder-white/25 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,245,255,0.14)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#00f5ff]/30 border-t-[#00f5ff] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/25">
              <Plane className="w-8 h-8 mb-2" />
              <p className="text-sm">No aircraft found</p>
            </div>
          ) : (
            filtered.map(l => {
              const isAdded = selectedIds.includes(l.id);
              const color = atiColor(l.ati_score);
              return (
                <button
                  key={l.id}
                  onClick={() => !isAdded && onSelect(l)}
                  disabled={isAdded}
                  className="w-full flex items-center gap-3 px-5 py-3.5 border-b text-left transition-all"
                  style={{
                    borderColor: "rgba(255,255,255,0.04)",
                    background: isAdded ? "rgba(0,245,255,0.04)" : "transparent",
                    opacity: isAdded ? 0.5 : 1,
                    cursor: isAdded ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={e => { if (!isAdded) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isAdded) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Mini ATI ring */}
                  <div className="relative w-9 h-9 shrink-0">
                    <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                      <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}25`} strokeWidth="3" />
                      {l.ati_score && (
                        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
                          strokeDasharray={`${(l.ati_score / 120) * 113.1} 113.1`} strokeLinecap="round" />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-black" style={{ color }}>{l.ati_score ?? "—"}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">
                      {l.year} {l.make} {l.model}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {l.registration && (
                        <span className="text-[9px] text-white/30 font-mono">{l.registration}</span>
                      )}
                      {l.total_time && (
                        <span className="text-[9px] text-white/25">TT {l.total_time.toLocaleString()} h</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {l.asking_price ? (
                      <p className="text-[12px] font-black text-white">${l.asking_price.toLocaleString()}</p>
                    ) : (
                      <p className="text-[11px] text-white/25">On request</p>
                    )}
                    {isAdded && (
                      <p className="text-[9px] text-[#00f5ff] font-bold mt-0.5">Added</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}