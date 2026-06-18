import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, FileText, TrendingUp, ShieldCheck, RotateCw } from "lucide-react";
import { orchestrateATIScoring } from "@/api/orchestrateATIScoring";
import TierBadge from "@/components/TierBadge";
import MiniGlobe from "@/components/MiniGlobe";
import { ScoreArc, DimensionBars, FlagsList, OMVMValue } from "@/components/ati/ATIQuickScoreGauge";

const TIERS = ["free_explorer", "starter", "pro", "enterprise"];

function extractNReg(text) {
  const match = text.match(/N\d{1,6}[A-Z]{0,2}/i);
  return match ? match[0].toUpperCase() : "";
}

const glass = {
  bg: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "16px",
};

const pageBg = "linear-gradient(135deg,#0a1628 0%,#1B2A4A 40%,#0d1f3c 100%)";

export default function ATIQuickScore() {
  const [input, setInput] = useState("");
  const [nReg, setNReg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleScore() {
    if (!input.trim() || input.trim().length < 20) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSubmitted(true);

    const detected = extractNReg(input);
    if (detected && !nReg) setNReg(detected);

    try {
      const res = await orchestrateATIScoring({ input, nReg: nReg || detected });
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Scoring failed. Please try again.");
    }
    setLoading(false);
  }

  function handleReset() {
    setSubmitted(false);
    setResult(null);
    setError("");
    setInput("");
    setNReg("");
  }

  const canSubmit = input.trim().length >= 20;

  return (
    <div style={{ minHeight: "100vh", background: pageBg, color: "#fff", padding: "40px 20px 80px" }}>
      {/* ── Header ── */}
      <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "56px", height: "56px", borderRadius: "16px", marginBottom: "16px",
          background: "linear-gradient(135deg, #D4A017, #A67C00)",
          boxShadow: "0 4px 24px rgba(212,160,23,0.25)",
        }}>
          <Zap size={26} strokeWidth={2.5} color="#fff" />
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 8px",
          letterSpacing: "-0.02em", lineHeight: 1.15,
        }}>ATI Quick Score</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginBottom: "16px" }}>
          Instant 8-dimension aircraft scorecard from any listing text or N-number
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", marginRight: "4px" }}>Available for:</span>
          {TIERS.map((t) => <TierBadge key={t} tier={t} size="sm" />)}
        </div>
      </div>

      {/* ── Form (hidden after submit) ── */}
      {!submitted && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ ...glass, padding: "28px" }}>
            {/* N-Number */}
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={nReg}
                onChange={(e) => setNReg(e.target.value.toUpperCase())}
                placeholder="e.g. N12345 — auto-fetches FAA data"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  borderRadius: "10px", color: "#fff", outline: "none",
                  padding: "12px 16px", fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(212,160,23,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.13)"; }}
              />
            </div>

            {/* Aircraft Details textarea */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              placeholder={`Paste listing text, N-number, or aircraft specs here…

Example:
2005 Mooney M20C — Reg: N12345
Airframe TT: 3,200 hrs — Engine SMOH: 850 hrs / TBO 1,800
Last Annual: March 2024
Avionics: Garmin G500, GFC 500 AP, ADS-B
Asking: $85,000 — Hangared, private owner, all logs`}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "10px", color: "rgba(255,255,255,0.85)", outline: "none",
                padding: "14px 16px", fontSize: "13px", lineHeight: 1.7,
                resize: "vertical", fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(212,160,23,0.35)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; }}
            />

            {error && (
              <div style={{
                marginTop: "12px", padding: "10px 14px", borderRadius: "8px",
                background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444", fontSize: "12px", fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleScore}
              disabled={!canSubmit || loading}
              style={{
                marginTop: "18px", width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "14px 0", borderRadius: "12px",
                background: canSubmit && !loading
                  ? "linear-gradient(135deg, #D4A017, #A67C00)"
                  : "rgba(255,255,255,0.06)",
                border: canSubmit && !loading ? "none" : "1px solid rgba(255,255,255,0.10)",
                color: canSubmit && !loading ? "#fff" : "rgba(255,255,255,0.3)",
                fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em", textTransform: "uppercase",
                cursor: canSubmit && !loading ? "pointer" : "default",
                transition: "opacity 0.2s, transform 0.15s",
                opacity: canSubmit || loading ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (canSubmit && !loading) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                if (canSubmit && !loading) e.currentTarget.style.opacity = "1";
              }}
            >
              <Zap size={16} />
              Run ATI Quick Score
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {submitted && loading && (
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", padding: "80px 0" }}>
          <MiniGlobe size={48} label="Running ATI analysis…" color="#D4A017" />
        </div>
      )}

      {/* ── Result ── */}
      {submitted && !loading && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {/* Score arc */}
          {result && (
            <div style={{ ...glass, padding: "32px 24px", marginBottom: "16px" }}>
              <ScoreArc score={
                (result.documentation || 0) + (result.technical || 0) +
                (result.transparency || 0) + (result.transaction_ready || 0) +
                (result.usage_mission || 0) + (result.storage_exposure || 0) +
                (result.config_clarity || 0) + (result.market_readiness || 0)
              } />
              <OMVMValue result={result} />
              {nReg && (
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <span style={{
                    color: "rgba(255,255,255,0.35)", fontSize: "10px", fontWeight: 600,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    {nReg}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dimension bars */}
          {result && (
            <div style={{ ...glass, padding: "24px", marginBottom: "16px" }}>
              <p style={{
                color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px",
              }}>
                8-Dimension Breakdown
              </p>
              <DimensionBars result={result} />
            </div>
          )}

          {/* Flags */}
          {result && (
            <div style={{ ...glass, padding: "24px", marginBottom: "16px" }}>
              <FlagsList result={result} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ ...glass, padding: "16px 20px", marginBottom: "16px" }}>
              <div style={{
                padding: "10px 14px", borderRadius: "8px",
                background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444", fontSize: "12px", fontWeight: 600,
              }}>
                {error}
              </div>
            </div>
          )}

          {/* Upsell strip */}
          <div style={{ ...glass, padding: "20px 24px", marginBottom: "20px" }}>
            <p style={{
              color: "rgba(255,255,255,0.45)", fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px",
            }}>
              Upgrade your analysis
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link to="/ati-full-report" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
                  borderRadius: "10px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                  transition: "border-color 0.2s",
                }}>
                  <FileText size={16} color="#D4A017" />
                  <div>
                    <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: 0 }}>Full ATI Report</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0" }}>
                      Downloadable .docx with executive summary and risk breakdown
                    </p>
                  </div>
                </div>
              </Link>
              <Link to="/valuation" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
                  borderRadius: "10px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                  transition: "border-color 0.2s",
                }}>
                  <TrendingUp size={16} color="#a855f7" />
                  <div>
                    <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: 0 }}>OMVM Price Check</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0" }}>
                      Market-calibrated value estimate with comparable sales
                    </p>
                  </div>
                </div>
              </Link>
              <Link to="/ati-verify" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
                  borderRadius: "10px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                  transition: "border-color 0.2s",
                }}>
                  <ShieldCheck size={16} color="#22c55e" />
                  <div>
                    <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: 0 }}>ATI PASS Verify</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0" }}>
                      Remote document verification with blockchain anchoring
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Reset button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleReset}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "10px 24px", borderRadius: "10px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: "13px",
                cursor: "pointer", transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <RotateCw size={14} />
              Score another aircraft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}