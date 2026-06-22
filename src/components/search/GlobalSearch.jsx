import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Plane, X, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { detectRegType, getRegTypeColor } from "@/lib/regUtils";

export default function GlobalSearch() {
  const isDark = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["global-search"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
    staleTime: 60_000,
    enabled: true
  });

  const filtered = query.trim().length >= 2 ?
  listings.filter((l) => {
    const q = query.toLowerCase();
    const reg = (l.registration || "").toLowerCase();
    const make = (l.make || "").toLowerCase();
    const model = (l.model || "").toLowerCase();
    const year = String(l.year || "").toLowerCase();
    return reg.includes(q) || make.includes(q) || model.includes(q) || year.includes(q);
  }).slice(0, 8) :
  [];

  // ⌘K / Ctrl+K to open
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectAircraft = (listing) => {
    setOpen(false);
    setQuery("");
    navigate(`/ati-passport/${listing.id}`);
  };

  const bgColor = isDark ? "#1e1f3a" : "#fff";
  const borderColor = isDark ? "rgba(0,245,255,0.18)" : "rgba(0,0,0,0.10)";
  const textColor = isDark ? "#fff" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)";

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[320px] mx-2">
      <button
        onClick={() => {setOpen(true);setTimeout(() => inputRef.current?.focus(), 50);}}
        className="flex items-center gap-2 w-full h-9 px-3.5 rounded-xl text-[11px] font-medium transition-all hidden"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${borderColor}`,
          color: mutedColor
        }}>
        
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Search aircraft...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
        style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", color: mutedColor }}>
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {open &&
      <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: mutedColor }} />
              <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="N-number, EASA reg, make, model..."
              className="flex-1 bg-transparent text-[12px] outline-none"
              style={{ color: textColor }}
              autoFocus />
            
              {query &&
            <button onClick={() => {setQuery("");inputRef.current?.focus();}}>
                  <X className="w-3.5 h-3.5" style={{ color: mutedColor }} />
                </button>
            }
            </div>

            <div className="max-h-[280px] overflow-y-auto">
              {isLoading ?
            <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: mutedColor }} />
                </div> :
            filtered.length > 0 ?
            filtered.map((l) => {
              const regType = detectRegType(l.registration);
              const regColor = getRegTypeColor(regType, isDark);
              return (
                <button
                  key={l.id}
                  onClick={() => selectAircraft(l)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-white/5">
                  
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isDark ? "rgba(0,245,255,0.1)" : "rgba(37,99,235,0.1)" }}>
                      <Plane className="w-3.5 h-3.5" style={{ color: isDark ? "#00f5ff" : "#2563eb" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate" style={{ color: textColor }}>
                        {[l.year, l.make, l.model].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-[10px] truncate flex items-center gap-1.5" style={{ color: mutedColor }}>
                        {l.registration || "No registration"}
                        {regType &&
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: regColor, background: `${regColor}15`, border: `1px solid ${regColor}30` }}>
                            {regType === "faa" ? "N-Reg" : regType === "easa" ? "EASA" : ""}
                          </span>
                      }
                        {l.asking_price && <span>• ${l.asking_price.toLocaleString()}</span>}
                        {!l.asking_price && <span>• On request</span>}
                      </p>
                    </div>
                    {l.ati_score &&
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{
                    background: l.ati_score >= 90 ? "rgba(37,99,235,0.15)" : l.ati_score >= 72 ? "rgba(124,58,237,0.15)" : l.ati_score >= 54 ? "rgba(212,160,23,0.15)" : "rgba(220,38,38,0.1)",
                    color: l.ati_score >= 90 ? "#2563eb" : l.ati_score >= 72 ? "#7c3aed" : l.ati_score >= 54 ? "#D4A017" : "#dc2626"
                  }}>
                        {l.ati_score}
                      </span>
                  }
                  </button>);
            }) :
            query.trim().length >= 2 ?
            <div className="py-8 text-center text-[11px]" style={{ color: mutedColor }}>
                  No aircraft found for "{query}"
                </div> :

            <div className="py-8 text-center text-[11px]" style={{ color: mutedColor }}>
                  Type at least 2 characters to search
                </div>
            }
            </div>
          </div>
        </>
      }
    </div>);

}