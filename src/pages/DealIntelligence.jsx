import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Brain, Loader2, ChevronDown, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Target, ArrowRight, Lightbulb, DollarSign,
} from "lucide-react";

const fmtPrice = (n) => n ? `$${Number(n).toLocaleString()}` : "—";

const VERDICT_STYLES = {
  "STRONG BUY": { bg: "rgba(93,202,165,0.12)", border: "rgba(93,202,165,0.3)", color: "#5dcaa5", icon: CheckCircle },
  "GOOD DEAL": { bg: "rgba(93,202,165,0.08)", border: "rgba(93,202,165,0.2)", color: "#7dd3a8", icon: TrendingUp },
  "FAIR": { bg: "rgba(245,194,66,0.1)", border: "rgba(245,194,66,0.25)", color: "#D4A017", icon: Target },
  "OVERPRICED": { bg: "rgba(232,168,58,0.1)", border: "rgba(232,168,58,0.25)", color: "#e8a83a", icon: AlertTriangle },
  "AVOID": { bg: "rgba(226,75,74,0.1)", border: "rgba(226,75,74,0.25)", color: "#e24b4a", icon: XCircle },
};

const RISK_STYLES = {
  LOW: { color: "#5dcaa5", bg: "rgba(93,202,165,0.1)" },
  MEDIUM: { color: "#D4A017", bg: "rgba(245,194,66,0.1)" },
  HIGH: { color: "#e24b4a", bg: "rgba(226,75,74,0.1)" },
};

export default function DealIntelligence() {
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await base44.entities.AircraftListing.filter(
          { status: "active", visibility: "public" },
          "-created_date",
          50
        );
        setListings(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchListings();
  }, []);

  const generateBrief = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setBrief(null);
    try {
      const res = await base44.functions.invoke("sakanaDealBrief", { listingId: selectedId });
      setBrief(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedListing = listings.find((l) => l.id === selectedId);
  const verdict = brief?.brief?.deal_verdict;
  const verdictStyle = verdict ? VERDICT_STYLES[verdict] || VERDICT_STYLES["FAIR"] : null;
  const VerdictIcon = verdictStyle?.icon;
  const riskLevel = brief?.brief?.risk_assessment?.level;
  const riskStyle = riskLevel ? RISK_STYLES[riskLevel] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0B1220", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ borderBottom: "0.5px solid rgba(245,194,66,0.1)", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D4A017", margin: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Brain size={12} /> Sakana Fugu · Multi-Agent AI
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>Deal Intelligence Brief</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {loadingListings ? (
            <Loader2 size={16} className="animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          ) : (
            <div style={{ position: "relative" }}>
              <select
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  appearance: "none", background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8,
                  padding: "8px 32px 8px 12px", color: "#fff", fontSize: 12, outline: "none", cursor: "pointer", maxWidth: 320,
                }}
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id} style={{ background: "#0a0f1a", color: "#fff" }}>
                    {l.year} {l.make} {l.model} {l.registration ? `· ${l.registration}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
            </div>
          )}
          <button
            onClick={generateBrief}
            disabled={loading || !selectedId}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#D4A017", color: "#0B1220", border: "none", borderRadius: 8,
              padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !selectedId ? 0.5 : 1,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />} Generate Brief
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px" }}>
        {/* SELECTED AIRCRAFT SUMMARY */}
        {selectedListing && (
          <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px", marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: 4 }}>Aircraft</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{selectedListing.year} {selectedListing.make} {selectedListing.model}</p>
            </div>
            {selectedListing.registration && (
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: 4 }}>Registration</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#D4A017" }}>{selectedListing.registration}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: 4 }}>Asking Price</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{fmtPrice(selectedListing.asking_price)}</p>
            </div>
            {selectedListing.ati_score != null && (
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: 4 }}>ATI Score</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#5dcaa5" }}>{selectedListing.ati_score}/120</p>
              </div>
            )}
            {selectedListing.omvm_value != null && (
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: 4 }}>OMVM Value</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#4e8ef7" }}>{fmtPrice(selectedListing.omvm_value)}</p>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.2)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <p style={{ color: "#e24b4a", fontSize: 13, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} /> {error}
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "#D4A017", margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Fugu is orchestrating multi-agent analysis...</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 4 }}>This may take 15-30 seconds for complex reasoning</p>
          </div>
        )}

        {/* BRIEF */}
        {brief && !loading && (
          <>
            {/* VERDICT + SUMMARY */}
            {verdictStyle && (
              <div style={{ background: verdictStyle.bg, border: `0.5px solid ${verdictStyle.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <VerdictIcon size={20} style={{ color: verdictStyle.color }} />
                  <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: verdictStyle.color }}>{verdict}</span>
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>{brief.brief.executive_summary}</p>
              </div>
            )}

            {/* PRICE ANALYSIS + RISK */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Price Analysis */}
              <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <DollarSign size={14} style={{ color: "#D4A017" }} />
                  <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Price Analysis</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: "0 0 10px" }}>{brief.brief.price_analysis?.assessment}</p>
                {brief.brief.price_analysis?.omvm_comparison && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: "0 0 8px" }}>
                    <span style={{ color: "#4e8ef7", fontWeight: 600 }}>OMVM:</span> {brief.brief.price_analysis.omvm_comparison}
                  </p>
                )}
                {brief.brief.price_analysis?.comparable_context && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>
                    <span style={{ color: "#5dcaa5", fontWeight: 600 }}>Comparables:</span> {brief.brief.price_analysis.comparable_context}
                  </p>
                )}
              </div>
              {/* Risk Assessment */}
              {riskStyle && (
                <div style={{ background: riskStyle.bg, border: `0.5px solid ${riskStyle.color}33`, borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={14} style={{ color: riskStyle.color }} />
                    <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Risk Level</span>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: riskStyle.color, margin: "0 0 8px", letterSpacing: "0.02em" }}>{riskLevel}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>{brief.brief.risk_assessment?.explanation}</p>
                </div>
              )}
            </div>

            {/* STRENGTHS & RED FLAGS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Strengths */}
              <div style={{ background: "rgba(93,202,165,0.04)", border: "0.5px solid rgba(93,202,165,0.12)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <CheckCircle size={14} style={{ color: "#5dcaa5" }} />
                  <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5dcaa5" }}>Strengths</span>
                </div>
                {(brief.brief.strengths || []).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    <span style={{ color: "#5dcaa5", flexShrink: 0 }}>▸</span> {s}
                  </div>
                ))}
                {(!brief.brief.strengths || brief.brief.strengths.length === 0) && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>No notable strengths identified.</p>
                )}
              </div>
              {/* Red Flags */}
              <div style={{ background: "rgba(226,75,74,0.04)", border: "0.5px solid rgba(226,75,74,0.12)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <AlertTriangle size={14} style={{ color: "#e24b4a" }} />
                  <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e24b4a" }}>Red Flags</span>
                </div>
                {(brief.brief.red_flags || []).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    <span style={{ color: "#e24b4a", flexShrink: 0 }}>▸</span> {r}
                  </div>
                ))}
                {(!brief.brief.red_flags || brief.brief.red_flags.length === 0) && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>No red flags identified.</p>
                )}
              </div>
            </div>

            {/* NEGOTIATION STRATEGY */}
            <div style={{ background: "#111827", border: "0.5px solid rgba(245,194,66,0.12)", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Target size={14} style={{ color: "#D4A017" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D4A017" }}>Negotiation Strategy</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: "0 0 16px" }}>{brief.brief.negotiation_strategy?.recommended_approach}</p>
              {brief.brief.negotiation_strategy?.target_price != null && (
                <div style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "inline-block" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Target Price: </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#D4A017" }}>{fmtPrice(brief.brief.negotiation_strategy.target_price)}</span>
                </div>
              )}
              <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "0 0 8px" }}>Talking Points</p>
              {(brief.brief.negotiation_strategy?.talking_points || []).map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  <span style={{ color: "#D4A017", flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span> {t}
                </div>
              ))}
            </div>

            {/* NEXT STEPS */}
            <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Lightbulb size={14} style={{ color: "#4e8ef7" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Recommended Next Steps</span>
              </div>
              {(brief.brief.next_steps || []).map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(78,142,247,0.1)", border: "0.5px solid rgba(78,142,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#4e8ef7" }}>
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>
              Generated by Sakana Fugu ({brief.model}) · {new Date(brief.generated_at).toLocaleString()}
            </p>
          </>
        )}

        {/* EMPTY STATE */}
        {!brief && !loading && !error && !loadingListings && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Brain size={40} style={{ color: "rgba(245,194,66,0.3)", margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 4px" }}>Select an aircraft and generate a deal brief</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Fugu will analyze ATI scores, OMVM valuation, comparables, and market data</p>
          </div>
        )}
      </div>
    </div>
  );
}