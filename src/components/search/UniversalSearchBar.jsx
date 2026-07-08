import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Plane, X, Loader2, ArrowUpRight, ScanSearch } from "lucide-react";
import { flattenNavPages } from "@/components/layout/navConfig";

// N-numbers (N123AB) + international registrations (OK-ABC, D-EABC, G-ABCD…)
const REG_RE = /^(N[0-9]{1,5}[A-Z]{0,2}|[A-Z]{1,2}-[A-Z0-9]{1,5})$/i;

const GOLD = "#D4A017";
const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";

function GroupLabel({ children }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(212,160,23,0.65)", padding: "10px 14px 4px", margin: 0 }}>
      {children}
    </p>
  );
}

function ResultRow({ icon: Icon, title, sub, badge, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 w-full px-3.5 py-2.5 text-left transition-colors hover:bg-white/5 touch-target-compact"
      style={{ background: "transparent", border: "none", cursor: "pointer" }}>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(212,160,23,0.09)", border: "0.5px solid rgba(212,160,23,0.22)" }}>
        <Icon size={13} color={GOLD} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[12px] font-semibold truncate" style={{ color: W1 }}>{title}</span>
        {sub && <span className="block text-[10px] truncate" style={{ color: W3 }}>{sub}</span>}
      </span>
      {badge && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "rgba(212,160,23,0.12)", color: GOLD }}>{badge}</span>
      )}
      <ArrowUpRight size={12} color={W3} className="shrink-0" />
    </button>
  );
}

/**
 * Universal persistent search — Design Sprint 1, step 1.
 * Searches marketplace listings, registry lookups (N-number / intl reg) and platform pages.
 * Trigger: pill (desktop) / icon (compact). Opens a ⌘K command palette.
 */
export default function UniversalSearchBar({ compact = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["universal-search-listings"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
    staleTime: 60_000,
    enabled: open,
  });

  const pages = useMemo(() => flattenNavPages(), []);
  const q = query.trim().toLowerCase();
  const regCandidate = query.trim().replace(/\s/g, "").toUpperCase();
  const isRegLike = REG_RE.test(regCandidate);

  const aircraftResults = q.length >= 2
    ? listings.filter((l) => {
        return (l.registration || "").toLowerCase().includes(q) ||
          (l.make || "").toLowerCase().includes(q) ||
          (l.model || "").toLowerCase().includes(q) ||
          String(l.year || "").includes(q);
      }).slice(0, 6)
    : [];

  const pageResults = q.length >= 2
    ? pages.filter((p) => p.label.toLowerCase().includes(q) || p.section.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);
  const go = useCallback((path) => { close(); navigate(path); }, [close, navigate]);

  // ⌘K / Ctrl+K opens, Escape closes
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const onEnter = () => {
    if (isRegLike) return go(`/twin/${regCandidate}`);
    if (aircraftResults.length > 0) return go(`/ati-passport/${aircraftResults[0].id}`);
    if (pageResults.length > 0) return go(pageResults[0].path);
  };

  return (
    <>
      {/* ── Trigger ── */}
      {compact ? (
        <button onClick={() => setOpen(true)} aria-label="Search ABOS (⌘K)"
          className="flex items-center justify-center transition-colors shrink-0 touch-target-compact"
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", color: W2, cursor: "pointer" }}>
          <Search size={16} />
        </button>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-9 px-3.5 rounded-xl text-[11px] font-medium transition-colors shrink-0"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: W3, cursor: "pointer", minWidth: 180 }}>
          <Search size={13} />
          <span className="flex-1 text-left truncate">Search ABOS…</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", color: W3 }}>⌘K</kbd>
        </button>
      )}

      {/* ── Palette ── */}
      {open && (
        <div className="fixed inset-0 z-[120] flex justify-center px-4 pt-[12vh] safe-top"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="w-full max-w-lg h-fit rounded-2xl overflow-hidden"
            style={{ background: "rgba(13,17,23,0.98)", border: "1px solid rgba(212,160,23,0.22)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
            {/* Input row */}
            <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
              <Search size={15} color={GOLD} className="shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onEnter(); }}
                placeholder="Registration, make, model, report, page…"
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ background: "transparent", border: "none", color: W1 }}
                aria-label="Search ABOS"
              />
              {query && (
                <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search"
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }} className="touch-target-compact">
                  <X size={14} color={W3} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[52vh] overflow-y-auto pb-2">
              {q.length < 2 ? (
                <p className="py-8 text-center text-[11px]" style={{ color: W3 }}>
                  Search aircraft, registrations and platform tools — or press <kbd style={{ color: W2 }}>Enter</kbd> on a registration for an instant registry lookup.
                </p>
              ) : (
                <>
                  {isRegLike && (
                    <>
                      <GroupLabel>Registry Lookup</GroupLabel>
                      <ResultRow icon={ScanSearch} title={`Look up ${regCandidate} in the registry`}
                        sub="Digital Twin · FAA / international registry" badge="VERIFY"
                        onClick={() => go(`/twin/${regCandidate}`)} />
                    </>
                  )}

                  <GroupLabel>Aircraft</GroupLabel>
                  {isLoading ? (
                    <div className="flex justify-center py-5"><Loader2 size={15} color={W3} className="animate-spin" /></div>
                  ) : aircraftResults.length > 0 ? (
                    aircraftResults.map((l) => (
                      <ResultRow key={l.id} icon={Plane}
                        title={[l.year, l.make, l.model].filter(Boolean).join(" ") || "Aircraft"}
                        sub={`${l.registration || "No registration"}${l.asking_price ? ` · $${l.asking_price.toLocaleString()}` : " · On request"}`}
                        badge={l.ati_score ? `ATI ${l.ati_score}` : null}
                        onClick={() => go(`/ati-passport/${l.id}`)} />
                    ))
                  ) : (
                    <p className="px-4 py-2 text-[11px]" style={{ color: W3 }}>No matching listings.</p>
                  )}

                  {pageResults.length > 0 && (
                    <>
                      <GroupLabel>Platform</GroupLabel>
                      {pageResults.map((p) => (
                        <ResultRow key={p.path} icon={p.icon || Search} title={p.label} sub={p.section}
                          onClick={() => go(p.path)} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}