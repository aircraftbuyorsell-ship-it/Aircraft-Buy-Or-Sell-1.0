import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { m2ft, mps2kts } from "./liveTrafficConfig";
import { maskOwnerName } from "@/lib/privacy";

function scoreColor(s) {
  if (!s) return "#AAA49C";
  if (s >= 90) return "#0F7A56";
  if (s >= 72) return "#185FA5";
  if (s >= 54) return "#D4A017";
  return "#C0392B";
}
function scoreLabel(s) {
  if (!s) return null;
  if (s >= 108) return "EXCEPTIONAL";
  if (s >= 90) return "STRONG BUY";
  if (s >= 72) return "FAIR";
  if (s >= 54) return "CAUTION";
  return "AVOID";
}

const dealStyles = {
  "hot deal":   { bg: "rgba(212,160,23,0.12)", color: "#A67C00", border: "rgba(212,160,23,0.3)" },
  "good deal":  { bg: "rgba(15,122,86,0.10)",  color: "#0F7A56", border: "rgba(15,122,86,0.25)" },
  "fair":       { bg: "rgba(24,95,165,0.08)",  color: "#185FA5", border: "rgba(24,95,165,0.2)" },
  "overpriced": { bg: "rgba(192,57,43,0.08)",  color: "#C0392B", border: "rgba(192,57,43,0.2)" },
};

export default function ATIMarkerPopup({ ac }) {
  const { faa, listing, callsign, baro_altitude, velocity, true_track, on_ground, origin_country, icao24, registration, aircraft_type } = ac;
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState(null);
  const [scoreError, setScoreError] = useState(null);

  const nReg = faa?.n_number || registration || null;
  // Show score button for N-numbered aircraft with no existing listing
  const isNReg = nReg && /^N\d/i.test(nReg);
  const hasFaaNoListing = (faa || isNReg) && !listing;

  const handleScore = async () => {
    setScoring(true);
    setScoreError(null);
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", {
        n_number: nReg,
        icao24,
        registration: nReg,
        aircraft_type: faa?.type_aircraft || aircraft_type,
        callsign,
      });
      setScored(res.data);
      if (res.data?.ok) {
        // Refresh the page after short delay so the new listing shows up on next load
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e) {
      setScoreError(e.response?.data?.error || e.message || "Scoring failed");
    } finally {
      setScoring(false);
    }
  };

  const ati = listing?.ati_score;
  const color = scoreColor(ati);
  const deal = listing?.deal_label ? dealStyles[listing.deal_label.toLowerCase()] : null;
  const altFt = m2ft(baro_altitude);
  const speedKt = mps2kts(velocity);

  return (
    <div style={{ minWidth: 240, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0B2D5B", borderRadius: "8px 8px 0 0", padding: "10px 12px", margin: "-8px -12px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {/* N-Reg first */}
            <p style={{ color: "#E8A83A", fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 1 }}>
              {nReg || callsign || icao24}
            </p>
            {/* ICAO second */}
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 8, fontWeight: 700, fontFamily: "monospace", marginBottom: 3 }}>
              ICAO: {icao24 || "—"}
            </p>
            {/* Aircraft type third */}
            <p style={{ color: "white", fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
              {faa?.type_aircraft || aircraft_type || listing
                ? `${listing?.year || faa?.year_mfr || ""} ${listing?.make || ""} ${listing?.model || faa?.mfr_mdl_code || ""}`.trim().replace(/\s+/g, ' ') || (callsign || "—")
                : (callsign || "—")}
            </p>
            {/* Owner name masked for privacy — never render faa.name raw, see src/lib/privacy.js */}
            {faa?.name && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 }}>{maskOwnerName(faa.name)}</p>}
          </div>
          {/* ATI Ring */}
          {ati && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid ${color}` }}>
                <span style={{ color, fontWeight: 900, fontSize: 12 }}>{ati}</span>
              </div>
              <p style={{ color, fontSize: 7, fontWeight: 800, textTransform: "uppercase", marginTop: 2, letterSpacing: "0.1em" }}>{scoreLabel(ati)}</p>
            </div>
          )}
          {!ati && (
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 900, fontSize: 9 }}>—</span>
            </div>
          )}
        </div>
      </div>

      {/* Flight data */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        <div style={{ background: "#F7F4EF", borderRadius: 6, padding: "6px 8px" }}>
          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Altitude</p>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1A1814" }}>{altFt?.toLocaleString() || "—"} <span style={{ fontSize: 9, fontWeight: 500 }}>ft</span></p>
        </div>
        <div style={{ background: "#F7F4EF", borderRadius: 6, padding: "6px 8px" }}>
          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Speed</p>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1A1814" }}>{speedKt || "—"} <span style={{ fontSize: 9, fontWeight: 500 }}>kts</span></p>
        </div>
        <div style={{ background: "#F7F4EF", borderRadius: 6, padding: "6px 8px" }}>
          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Heading</p>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1A1814" }}>{true_track != null ? Math.round(true_track) + "°" : "—"}</p>
        </div>
        <div style={{ background: "#F7F4EF", borderRadius: 6, padding: "6px 8px" }}>
          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</p>
          <p style={{ fontSize: 11, fontWeight: 900, color: on_ground ? "#C0392B" : "#0F7A56" }}>{on_ground ? "On Ground" : "Airborne"}</p>
        </div>
      </div>

      {/* Listing info */}
      {listing && (
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 8, marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {listing.asking_price && (
                <p style={{ fontSize: 14, fontWeight: 900, color: "#1A1814" }}>${listing.asking_price.toLocaleString()}</p>
              )}
              {deal && (
                <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: deal.bg, color: deal.color, border: `1px solid ${deal.border}`, letterSpacing: "0.1em" }}>
                  {listing.deal_label}
                </span>
              )}
            </div>
            <Link
              to={`/ati-passport/${listing.id}`}
              style={{ fontSize: 10, color: "#D4A017", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}
            >
              Full Report ↗
            </Link>
          </div>
        </div>
      )}

      {/* FAA found but no listing — offer to score */}
      {hasFaaNoListing && !scored && !scoring && (
        <div style={{ marginTop: 6, background: "rgba(232,168,58,0.08)", border: "1px solid rgba(232,168,58,0.25)", borderRadius: 8, padding: "8px 10px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#A67C00", marginBottom: 6 }}>
            FAA record found — no ATI card yet
          </p>
          <button
            onClick={handleScore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #E8A83A, #D4911A)", color: "#0B2D5B", border: "none" }}
          >
            <Sparkles className="w-3 h-3" /> Create ATI Card
          </button>
        </div>
      )}

      {/* Scoring in progress */}
      {scoring && (
        <div style={{ marginTop: 6, background: "rgba(232,168,58,0.12)", border: "1px solid rgba(232,168,58,0.30)", borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#E8A83A" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#A67C00" }}>Scoring aircraft…</span>
        </div>
      )}

      {/* Score result */}
      {scored?.ok && (
        <div style={{ marginTop: 6, background: "rgba(15,122,86,0.10)", border: "1px solid rgba(15,122,86,0.25)", borderRadius: 8, padding: "8px 10px" }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#0F7A56" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#0F7A56" }}>ATI Card created!</span>
          </div>
          <p style={{ fontSize: 9, color: "#185FA5", fontWeight: 700 }}>
            Score: {scored.atiScore}/120 · {scored.scoreLabel}
          </p>
          <p style={{ fontSize: 8, color: "#AAA49C", marginTop: 2 }}>Reloading map…</p>
        </div>
      )}

      {scoreError && (
        <div style={{ marginTop: 6, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 8, padding: "6px 10px", fontSize: 9, color: "#C0392B" }}>
          {scoreError}
        </div>
      )}

      {!listing && !faa && !isNReg && (
        <div style={{ background: "rgba(11,45,91,0.05)", borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#6B6560" }}>
          No registration data — not scorable from live traffic
        </div>
      )}

      <p style={{ fontSize: 8, color: "#AAA49C", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {origin_country} · icao24: {icao24}
      </p>
    </div>
  );
}