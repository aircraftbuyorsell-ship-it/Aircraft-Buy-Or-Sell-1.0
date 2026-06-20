import { useState }  from "react";
import { Link }       from "react-router-dom";
import {
  Zap, FileText, TrendingUp, ShieldCheck, RotateCw,
} from "lucide-react";
import { orchestrateATIScoring } from "@/api/orchestrateATIScoring";
import TierBadge   from "@/components/TierBadge";
import MiniGlobe   from "@/components/MiniGlobe";
import {
  ScoreArc, DimensionBars, FlagsList, OMVMValue,
} from "@/components/ati/ATIQuickScoreGauge";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIERS = ["free_explorer", "starter", "pro", "enterprise"];

// v2 design tokens
const T = {
  ink:      "#04060a",
  ink1:     "#0d1117",
  ink2:     "#111620",
  ink3:     "#1a2235",
  amber:    "#f5c242",
  amberDim: "rgba(245,194,66,0.10)",
  amberBdr: "rgba(245,194,66,0.22)",
  teal:     "#5dcaa5",
  tealDim:  "rgba(93,202,165,0.09)",
  tealBdr:  "rgba(93,202,165,0.20)",
  red:      "#e24b4a",
  redDim:   "rgba(226,75,74,0.10)",
  redBdr:   "rgba(226,75,74,0.22)",
  w1:       "rgba(255,255,255,0.90)",
  w2:       "rgba(255,255,255,0.50)",
  w3:       "rgba(255,255,255,0.25)",
  w4:       "rgba(255,255,255,0.09)",
  border:   "rgba(255,255,255,0.08)",
  borderMd: "rgba(255,255,255,0.12)",
};

// ─── Card styles ─────────────────────────────────────────────────────────────

const card = {
  background:   T.ink1,
  border:       `0.5px solid ${T.border}`,
  borderRadius: "12px",
  overflow:     "hidden",
};

const cardElevated = {
  ...card,
  background: T.ink2,
};

const accentLine = {
  height:     "2px",
  background: T.amber,
  flexShrink: 0,
};

const accentLineDim = {
  height:     "2px",
  background: T.border,
  flexShrink: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractNReg(text) {
  const match = text.match(/N\d{1,6}[A-Z]{0,2}/i);
  return match ? match[0].toUpperCase() : "";
}

/** Shared ATI total helper */
export function calcATITotal(result) {
  if (!result) return 0;
  return [
    result.documentation, result.technical,      result.transparency,
    result.transaction_ready, result.usage_mission, result.storage_exposure,
    result.config_clarity,    result.market_readiness,
  ].reduce((s, v) => s + (v || 0), 0);
}

/** ATI score → band label + colors */
function atiBand(total) {
  if (total >= 96) return { label: "Strong Buy",             color: T.teal,  bg: T.tealDim,  bdr: T.tealBdr  };
  if (total >= 80) return { label: "Buy",                    color: T.teal,  bg: T.tealDim,  bdr: T.tealBdr  };
  if (total >= 60) return { label: "Review — Due Diligence", color: T.amber, bg: T.amberDim, bdr: T.amberBdr };
  return               { label: "Caution — Investigate",     color: T.red,   bg: T.redDim,   bdr: T.redBdr   };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({ value, onChange, placeholder, as = "input", rows, ...rest }) {
  const [focused, setFocused] = useState(false);
  const baseStyle = {
    width:          "100%",
    boxSizing:      "border-box",
    background:     focused ? "rgba(245,194,66,0.03)" : "rgba(255,255,255,0.04)",
    border:         `0.5px solid ${focused ? T.amberBdr : T.border}`,
    borderRadius:   "8px",
    color:          T.w1,
    outline:        "none",
    padding:        "11px 14px",
    fontSize:       "13px",
    lineHeight:     1.65,
    fontFamily:     "inherit",
    resize:         as === "textarea" ? "vertical" : undefined,
    transition:     "border-color 0.15s, background 0.15s",
  };

  return as === "textarea"
    ? <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        style={baseStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
    : <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={baseStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />;
}

function UpgradeRow({ to, icon: Icon, iconColor = T.amber, title, desc }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div
        style={{
          display:       "flex",
          alignItems:    "center",
          gap:           "12px",
          padding:       "12px 14px",
          borderRadius:  "8px",
          background:    hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
          border:        `0.5px solid ${hovered ? T.borderMd : T.border}`,
          cursor:        "pointer",
          transition:    "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            width:        "30px",
            height:       "30px",
            borderRadius: "7px",
            flexShrink:   0,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            background:   `${iconColor}18`,
            border:       `0.5px solid ${iconColor}38`,
          }}
        >
          <Icon size={14} color={iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: T.w1, fontSize: "13px", fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>
            {title}
          </p>
          <p style={{ color: T.w3, fontSize: "11px", margin: "2px 0 0", lineHeight: 1.5 }}>
            {desc}
          </p>
        </div>
        <span style={{ color: T.amber, fontSize: "14px", flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ATIQuickScore() {
  const [input,     setInput]     = useState("");
  const [nReg,      setNReg]      = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");

  async function handleScore() {
    if (!canSubmit) return;
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

  const canSubmit = input.trim().length >= 20 && !loading;
  const total     = calcATITotal(result);
  const band      = atiBand(total);

  return (
    <div
      style={{
        minHeight:       "100vh",
        background:      T.ink,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
        backgroundSize:  "40px 40px",
        color:           T.w1,
        padding:         "40px 20px 80px",
        position:        "relative",
      }}
    >
      {/* Ambient amber glow at top */}
      <div
        aria-hidden
        style={{
          position:   "fixed",
          top:        "-200px",
          left:       "50%",
          transform:  "translateX(-50%)",
          width:      "700px",
          height:     "400px",
          background: "radial-gradient(ellipse, rgba(245,194,66,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex:     0,
        }}
      />

      <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          "48px",
              height:         "48px",
              borderRadius:   "12px",
              marginBottom:   "18px",
              background:     T.amber,
            }}
          >
            <Zap size={22} strokeWidth={2} color={T.ink} />
          </div>

          <h1
            style={{
              fontSize:      "clamp(28px, 5vw, 40px)",
              fontWeight:    500,
              margin:        "0 0 8px",
              letterSpacing: "-0.04em",
              lineHeight:    1.06,
              color:         T.w1,
            }}
          >
            ATI <span style={{ color: T.amber }}>Quick Score</span>
          </h1>

          <p style={{ color: T.w3, fontSize: "13px", margin: "0 0 18px", lineHeight: 1.6 }}>
            Instant 8-dimension aircraft scorecard from any listing text or N-number
          </p>

          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "6px",
              flexWrap:       "wrap",
            }}
          >
            <span
              style={{
                fontSize:      "9px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color:         T.w3,
                marginRight:   "4px",
              }}
            >
              Available for:
            </span>
            {TIERS.map((t) => <TierBadge key={t} tier={t} size="sm" />)}
          </div>
        </div>

        {/* ── Input form ─────────────────────────────────────────────────── */}
        {!submitted && (
          <div style={{ ...card, marginBottom: "0" }}>
            <div style={accentLineDim} aria-hidden />
            <div style={{ padding: "24px" }}>

              <p
                style={{
                  fontSize:      "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color:         T.w3,
                  margin:        "0 0 12px",
                }}
              >
                N-Number (optional — auto-fetches FAA data)
              </p>

              <div style={{ marginBottom: "14px" }}>
                <InputField
                  value={nReg}
                  onChange={(e) => setNReg(e.target.value.toUpperCase())}
                  placeholder="e.g. N12345"
                  maxLength={10}
                  style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.06em" }}
                />
              </div>

              <p
                style={{
                  fontSize:      "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color:         T.w3,
                  margin:        "0 0 10px",
                }}
              >
                Aircraft Details <span style={{ color: T.amber }}>*</span>
              </p>

              <InputField
                as="textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={7}
                placeholder={`Paste listing text, N-number, or aircraft specs here…\n\nExample:\n2005 Mooney M20C — Reg: N12345\nAirframe TT: 3,200 hrs — Engine SMOH: 850 hrs / TBO 1,800\nLast Annual: March 2024\nAvionics: Garmin G500, GFC 500 AP, ADS-B\nAsking: $85,000 — Hangared, private owner, all logs`}
              />

              <div
                style={{
                  display:        "flex",
                  justifyContent: "flex-end",
                  marginTop:      "6px",
                  fontSize:       "10px",
                  color:          input.length >= 20 ? T.teal : T.w3,
                  letterSpacing:  "0.04em",
                  transition:     "color 0.2s",
                }}
              >
                {input.length} chars {input.length >= 20 ? "✓" : `(${20 - input.length} more to score)`}
              </div>

              {error && (
                <div
                  style={{
                    marginTop:   "12px",
                    padding:     "10px 14px",
                    borderRadius: "7px",
                    background:  T.redDim,
                    border:      `0.5px solid ${T.redBdr}`,
                    color:       T.red,
                    fontSize:    "12px",
                    fontWeight:  500,
                    lineHeight:  1.5,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleScore}
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                style={{
                  marginTop:      "18px",
                  width:          "100%",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            "8px",
                  padding:        "13px 0",
                  borderRadius:   "8px",
                  background:     canSubmit ? T.amber : "rgba(255,255,255,0.05)",
                  border:         canSubmit ? "none" : `0.5px solid ${T.border}`,
                  color:          canSubmit ? T.ink : T.w3,
                  fontWeight:     600,
                  fontSize:       "13px",
                  letterSpacing:  "-0.01em",
                  cursor:         canSubmit ? "pointer" : "default",
                  transition:     "background 0.15s, color 0.15s, opacity 0.15s",
                  opacity:        canSubmit ? 1 : 0.6,
                }}
                onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = "#fdd05a"; }}
                onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = T.amber; }}
              >
                <Zap size={14} />
                Run ATI Quick Score
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {submitted && loading && (
          <div style={card}>
            <div style={accentLineDim} aria-hidden />
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <MiniGlobe size={44} label="Running ATI analysis…" color={T.amber} />
              <p
                style={{
                  marginTop:     "16px",
                  fontSize:      "12px",
                  color:         T.w3,
                  letterSpacing: "0.06em",
                }}
              >
                Evaluating 8 dimensions…
              </p>
            </div>
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        {submitted && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Score arc card */}
            {result && (
              <div style={card}>
                <div style={accentLine} aria-hidden />
                <div style={{ padding: "28px 24px" }}>
                  <ScoreArc score={total} />
                  <div style={{ textAlign: "center", marginTop: "12px" }}>
                    <OMVMValue result={result} />
                  </div>

                  {nReg && (
                    <div style={{ marginTop: "10px", textAlign: "center" }}>
                      <span
                        style={{
                          fontFamily:    "'Courier New', monospace",
                          fontSize:      "10px",
                          letterSpacing: "0.08em",
                          color:         T.w3,
                          textTransform: "uppercase",
                        }}
                      >
                        {nReg}
                      </span>
                    </div>
                  )}

                  <div style={{ textAlign: "center", marginTop: "12px" }}>
                    <span
                      style={{
                        display:       "inline-block",
                        padding:       "4px 14px",
                        borderRadius:  "20px",
                        fontSize:      "10px",
                        fontWeight:    700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        background:    band.bg,
                        border:        `0.5px solid ${band.bdr}`,
                        color:         band.color,
                      }}
                    >
                      {band.label}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 8-dimension breakdown card */}
            {result && (
              <div style={cardElevated}>
                <div style={accentLineDim} aria-hidden />
                <div style={{ padding: "20px 24px" }}>
                  <p
                    style={{
                      fontSize:      "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color:         T.w3,
                      margin:        "0 0 16px",
                    }}
                  >
                    8-Dimension Breakdown · 15 pts each
                  </p>
                  <DimensionBars result={result} />
                </div>
              </div>
            )}

            {/* Flags card */}
            {result && (
              <div style={cardElevated}>
                <div style={accentLineDim} aria-hidden />
                <div style={{ padding: "20px 24px" }}>
                  <FlagsList result={result} />
                </div>
              </div>
            )}

            {/* Error card */}
            {error && (
              <div style={card}>
                <div style={{ height: "2px", background: T.red }} aria-hidden />
                <div style={{ padding: "16px 20px" }}>
                  <div
                    style={{
                      padding:     "10px 14px",
                      borderRadius: "7px",
                      background:  T.redDim,
                      border:      `0.5px solid ${T.redBdr}`,
                      color:       T.red,
                      fontSize:    "12px",
                      fontWeight:  500,
                    }}
                  >
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade strip */}
            <div style={card}>
              <div style={{ height: "2px", background: T.amberBdr }} aria-hidden />
              <div style={{ padding: "18px 20px" }}>
                <p
                  style={{
                    fontSize:      "9px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color:         T.w3,
                    margin:        "0 0 12px",
                  }}
                >
                  Upgrade your analysis
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <UpgradeRow
                    to="/ati-full-report"
                    icon={FileText}
                    iconColor={T.amber}
                    title="Full ATI Report"
                    desc="Downloadable .docx with executive summary and risk breakdown"
                  />
                  <UpgradeRow
                    to="/valuation"
                    icon={TrendingUp}
                    iconColor={T.teal}
                    title="OMVM Price Check"
                    desc="Market-calibrated value estimate with comparable sales"
                  />
                  <UpgradeRow
                    to="/ati-verify"
                    icon={ShieldCheck}
                    iconColor={T.teal}
                    title="ATI PASS Verify"
                    desc="Remote document verification with blockchain anchoring"
                  />
                </div>
              </div>
            </div>

            {/* Reset */}
            <div style={{ textAlign: "center", paddingTop: "8px" }}>
              <button
                onClick={handleReset}
                style={{
                  display:     "inline-flex",
                  alignItems:  "center",
                  gap:         "6px",
                  padding:     "9px 20px",
                  borderRadius: "8px",
                  background:  "transparent",
                  border:      `0.5px solid ${T.border}`,
                  color:       T.w3,
                  fontWeight:  500,
                  fontSize:    "12px",
                  cursor:      "pointer",
                  transition:  "background 0.15s, color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background    = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color         = T.w1;
                  e.currentTarget.style.borderColor   = T.borderMd;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background    = "transparent";
                  e.currentTarget.style.color         = T.w3;
                  e.currentTarget.style.borderColor   = T.border;
                }}
              >
                <RotateCw size={13} />
                Score another aircraft
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}