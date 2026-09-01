import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Sparkles, ArrowUpRight, RefreshCw } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const BLUE = "#4e8ef7";

function scoreColor(s) {
  if (s >= 75) return TEAL;
  if (s >= 50) return AMBER;
  return "#e24b4a";
}

/**
 * Phase 1.5 · 1.5.2 — Connects a Lead to the CMR Match Engine.
 * Broker action: runs the match engine for a lead and shows the best
 * aircraft fits so the broker can curate options for the buyer.
 */
export default function LeadMatchModal({ open, onClose, lead }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && lead?.id) {
      runMatch();
    }
    if (!open) { setResult(null); setError(null); }
     
  }, [open, lead?.id]);

  const runMatch = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("cmrMatchEngine", { leadId: lead.id, maxResults: 5 });
      setResult(res.data);
    } catch (e) {
      setError(e?.message || "Failed to find matches");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl safe-bottom overflow-hidden max-h-[92dvh] flex flex-col animate-slide-up"
          style={{ background: "#0B0F1A", border: `0.5px solid ${BORDER}` }}>
          <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: W3 }} />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BLUE }}>
                <Sparkles className="w-4 h-4" style={{ color: "#04060a" }} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight" style={{ color: W1 }}>CMR Match Engine</h3>
                <p className="text-[10px]" style={{ color: W3 }}>
                  Best aircraft fits for {lead?.name || "this lead"}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: W3 }} className="hover:opacity-80 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading && (
              <div className="flex flex-col items-center py-16" style={{ color: W3 }}>
                <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: BLUE }} />
                <p className="text-sm">Matching lead against active listings…</p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ color: "#e24b4a", background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
                {error}
              </div>
            )}

            {!loading && !error && result && (
              <>
                {result.summary && (
                  <p className="text-[12px] leading-relaxed px-1" style={{ color: W2 }}>{result.summary}</p>
                )}
                {(result.matches || []).length === 0 ? (
                  <div className="text-center py-12" style={{ color: W3 }}>
                    <p className="text-sm">No matches found</p>
                  </div>
                ) : (
                  (result.matches || []).map((m, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black truncate" style={{ color: W1 }}>{m.aircraft}</span>
                            {m.listing?.registration && (
                              <span className="text-[10px] font-mono shrink-0" style={{ color: W3 }}>{m.listing.registration}</span>
                            )}
                          </div>
                          {m.listing?.asking_price != null && (
                            <p className="text-[12px] font-bold mt-0.5" style={{ color: TEAL }}>
                              ${m.listing.asking_price.toLocaleString()}
                              {m.budget_fit && <span className="ml-2 text-[10px] font-semibold" style={{ color: W3 }}>· {m.budget_fit}</span>}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black leading-none" style={{ color: scoreColor(m.match_score) }}>{m.match_score}</p>
                          <p className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: W3 }}>match</p>
                        </div>
                      </div>

                      {m.strengths?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {m.strengths.map((s, idx) => (
                            <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(93,202,165,0.10)", color: TEAL, border: "0.5px solid rgba(93,202,165,0.25)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.risks?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {m.risks.map((r, idx) => (
                            <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(226,75,74,0.08)", color: "#e24b4a", border: "0.5px solid rgba(226,75,74,0.2)" }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.recommended_action && (
                        <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: W2 }}>
                          <span style={{ color: AMBER }}>→ </span>{m.recommended_action}
                        </p>
                      )}
                      {m.listing?.id && (
                        <Link to={`/ati-passport/${m.listing.id}`} onClick={onClose}
                          className="inline-flex items-center gap-1 text-[11px] font-bold mt-3 min-h-[44px] px-3 rounded-lg hover:opacity-80" style={{ color: BLUE, background: "rgba(78,142,247,0.08)" }}>
                          View ATI Passport <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
                <p className="text-[10px] text-center pt-1" style={{ color: W3 }}>
                  {result.listings_evaluated || 0} listings evaluated
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t flex flex-col-reverse sm:flex-row gap-2 safe-bottom" style={{ borderColor: BORDER }}>
            <button onClick={onClose} className="flex-1 min-h-[48px] text-sm font-bold py-3 rounded-xl transition-colors"
              style={{ color: W2, background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}` }}>
              Close
            </button>
            <button onClick={runMatch} disabled={loading}
              className="flex-1 min-h-[48px] text-sm font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              style={{ background: BLUE, color: "#04060a" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-run Match
            </button>
          </div>
        </div>
      </div>
    </>
  );
}