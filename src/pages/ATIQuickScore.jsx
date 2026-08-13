import { useState }  from "react";
import { Link }       from "react-router-dom";
import {
  Zap, FileText, TrendingUp, ShieldCheck, RotateCw, Database,
} from "lucide-react";
import { orchestrateATIScoring } from "@/api/orchestrateATIScoring";
import { base44 } from "@/api/base44Client";
import { lookupAircraft } from "@/lib/aircraftLookup";
import QuickScoreLookupForm from "@/components/ati/QuickScoreLookupForm";
import AircraftMinimumFields from "@/components/ati/AircraftMinimumFields";
import ListingTextPaste from "@/components/ati/ListingTextPaste";
import MiniGlobe   from "@/components/MiniGlobe";
import {
  ScoreArc, DimensionBars, FlagsList, OMVMValue,
} from "@/components/ati/ATIQuickScoreGauge";
import {
  T, atiCard, atiAccentLine, atiAccentLineDim, atiBand,
} from "@/theme/atiPremium";

// ─── Constants ────────────────────────────────────────────────────────────────

const readParam = (key) => new URLSearchParams(window.location.search).get(key) || "";

function emptyDetails() {
  return { year: "", make: "", model: "", total_time: "", engine_hours: "", tbo: "", asking_price: "" };
}

function buildInitialDetails() {
  return {
    year: readParam("year"), make: readParam("make"), model: readParam("model"),
    total_time: readParam("total_time"), engine_hours: readParam("engine_hours"),
    tbo: readParam("tbo"), asking_price: readParam("asking_price"),
  };
}

// ATI Premium shared styles (isolated in theme/atiPremium.js)
const card = atiCard;
const cardElevated = atiCard;
const accentLine = atiAccentLine;
const accentLineDim = atiAccentLineDim;

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const [input,     setInput]     = useState(() => readParam("aircraft_data"));
  const [nReg,      setNReg]      = useState(() => readParam("registration"));
  const [details,   setDetails]   = useState(buildInitialDetails);
  const [lookupStatus, setLookupStatus] = useState(() => readParam("registration") && readParam("year") && readParam("make") && readParam("model") ? "found" : "idle");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [scorePayload, setScorePayload] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");

  const buildScoreInput = () => [
    [details.year, details.make, details.model].filter(Boolean).join(" "),
    nReg && `Registration: ${nReg}`,
    details.total_time && `Airframe Total Time: ${details.total_time} hrs`,
    details.engine_hours && `Engine SMOH: ${details.engine_hours} hrs`,
    details.tbo && `TBO: ${details.tbo} hrs`,
    details.asking_price && `Asking Price: $${details.asking_price}`,
    input.trim() && `Listing text:\n${input.trim()}`,
  ].filter(Boolean).join("\n");

  async function handleLookup() {
    const normalized = nReg.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^N[0-9A-Z]{1,6}$/.test(normalized)) { setLookupError("Enter a valid N-Number, for example N12345."); return; }
    setNReg(normalized); setLookupLoading(true); setLookupError("");
    try {
      const data = await lookupAircraft(normalized);
      if (!data?.found) { setDetails(emptyDetails()); setLookupStatus("not_found"); }
      else {
        const aircraft = data.aircraft || {}; const listing = data.listing || {};
        setDetails((current) => ({
          year: aircraft.year || aircraft.year_mfr || current.year, make: aircraft.make || current.make,
          model: aircraft.model || current.model, total_time: listing.total_time || aircraft.total_time || current.total_time,
          engine_hours: listing.engine_hours || aircraft.engine_hours || current.engine_hours,
          tbo: listing.tbo || aircraft.tbo || current.tbo, asking_price: listing.asking_price || current.asking_price,
        }));
        setLookupStatus("found");
      }
    } catch (lookupFailure) { setLookupError(lookupFailure?.response?.data?.error || "Lookup failed. Check the N-Number and try again."); setLookupStatus("error"); }
    setLookupLoading(false);
  }

  async function handleScore() {
    if (!canSubmit) return;
    const scoringInput = buildScoreInput();
    setScorePayload(scoringInput);
    setLoading(true);
    setError("");
    setResult(null);
    setSubmitted(true);

    const detected = extractNReg(scoringInput);
    if (detected && !nReg) setNReg(detected);

    try {
      const res = await orchestrateATIScoring({ input: scoringInput, nReg: nReg || detected });
      setResult(res);
    } catch (e) {
      if ([401, 403].includes(e?.response?.status || e?.status)) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
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
    setDetails(emptyDetails());
    setLookupStatus("idle");
    setLookupError("");
    setScorePayload("");
  }

  const updateDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }));
  const hasMinimumDetails = String(details.year || "").trim() && String(details.make || "").trim() && String(details.model || "").trim();
  const canSubmit = !["idle", "loading"].includes(lookupStatus) && hasMinimumDetails && !loading;
  const total     = calcATITotal(result);
  const band      = atiBand(total);
  const fullReportParams = new URLSearchParams(window.location.search);
  fullReportParams.set("registration", nReg);
  fullReportParams.set("aircraft_data", scorePayload || buildScoreInput());

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
            FAA Check & <span style={{ color: T.amber }}>Free Valuation</span>
          </h1>

          <p style={{ color: T.w3, fontSize: "13px", margin: "0 0 18px", lineHeight: 1.6 }}>
            Verify a U.S. N-Number against FAA registry data and get a free market-value estimate for the aircraft.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "7px 10px",
              borderRadius: "999px",
              background: "rgba(93,202,165,0.08)",
              border: "0.5px solid rgba(93,202,165,0.22)",
              color: T.teal,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Database size={13} /> FAA registry check · Free estimate
          </div>
        </div>

        {/* ── Guided intake ──────────────────────────────────────────────── */}
        {!submitted && (
          <div style={{ ...card, marginBottom: "0" }}>
            <div style={accentLineDim} aria-hidden />
            <div className="space-y-7 p-5 sm:p-6">
              <QuickScoreLookupForm value={nReg} onChange={(value) => { setNReg(value); setDetails(emptyDetails()); setLookupStatus("idle"); setLookupError(""); }} onLookup={handleLookup} loading={lookupLoading} error={lookupError} />
              {["found", "not_found"].includes(lookupStatus) && (
                <>
                  <AircraftMinimumFields details={details} onChange={updateDetail} status={lookupStatus} />
                  <ListingTextPaste value={input} onChange={setInput} />
                  {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
                  <button onClick={handleScore} disabled={!canSubmit} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                    <Zap size={16} /> Get Free Aircraft Valuation
                  </button>
                  {!hasMinimumDetails && <p className="text-center text-sm text-muted-foreground">Add year, make and model to create the score.</p>}
                </>
              )}
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

                {/* AI Transparency Notice — EU AI Act Art. 50 */}
                <div style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "rgba(245,194,66,0.04)",
                  border: "0.5px solid rgba(245,194,66,0.18)",
                  borderRadius: "8px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "13px", lineHeight: 1, flexShrink: 0, marginTop: "1px" }}>⚠️</span>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.65, margin: 0 }}>
                    <strong style={{ color: "rgba(245,194,66,0.75)", fontWeight: 700 }}>AI notice:</strong>{" "}
                    The ATI Score and OMVM valuation estimate are generated using artificial intelligence tools based on available data (FAA registry, NTSB database, market comparables). These outputs are for informational purposes only and do not replace a professional technical inspection or formal appraisal. Any final purchase or sale decision should include an independent pre-buy inspection.{" "}
                    <Link to="/legal/ai-transparency" style={{ color: "rgba(245,194,66,0.55)", textDecoration: "none" }}>
                      Full AI disclosure (EU AI Act Art. 50) →
                    </Link>
                  </p>
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
                    to={`/ati-full-report?${fullReportParams.toString()}`}
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