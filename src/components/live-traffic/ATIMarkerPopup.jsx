import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

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

const mps2kts = (v) => v != null ? Math.round(v * 1.94384) : null;
const m2ft = (m) => m != null ? Math.round(m * 3.28084) : null;

export default function ATIMarkerPopup({ ac }) {
  const { faa, listing, callsign, baro_altitude, velocity, true_track, on_ground, origin_country } = ac;
  const ati = listing?.ati_score;
  const color = scoreColor(ati);
  const deal = listing?.deal_label ? dealStyles[listing.deal_label.toLowerCase()] : null;

  return (
    <div style={{ minWidth: 220, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0B2D5B", borderRadius: "8px 8px 0 0", padding: "10px 12px", margin: "-8px -12px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: "#E8A83A", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>
              {faa?.n_number || callsign || ac.icao24}
            </p>
            <p style={{ color: "white", fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
              {faa?.type_aircraft || listing ? `${listing?.year || ""} ${listing?.make || ""} ${listing?.model || ""}`.trim() : (callsign || ac.icao24)}
            </p>
            {faa?.name && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 }}>{faa.name}</p>}
          </div>
          {/* ATI Ring */}
          {ati && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${color}` }}>
                <span style={{ color, fontWeight: 900, fontSize: 11 }}>{ati}</span>
              </div>
              <p style={{ color, fontSize: 7, fontWeight: 800, textTransform: "uppercase", marginTop: 2, letterSpacing: "0.1em" }}>{scoreLabel(ati)}</p>
            </div>
          )}
          {!ati && (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 900, fontSize: 9 }}>—</span>
            </div>
          )}
        </div>
      </div>

      {/* Flight data */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        <div style={{ background: "#F7F4EF", borderRadius: 6, padding: "6px 8px" }}>
          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Altitude</p>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1A1814" }}>{m2ft(baro_altitude)?.toLocaleString() || "—"} <span style={{ fontSize: 9, fontWeight: 500 }}>ft</span></p>
        </div>
        <div style={{ background: "#F7F4EF", borderRadius: 6, padding: "6px 8px" }}>
          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Speed</p>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1A1814" }}>{mps2kts(velocity) || "—"} <span style={{ fontSize: 9, fontWeight: 500 }}>kts</span></p>
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

      {!listing && faa && (
        <div style={{ background: "rgba(11,45,91,0.05)", borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#6B6560" }}>
          No ATI Score Card — not yet in marketplace
        </div>
      )}

      <p style={{ fontSize: 8, color: "#AAA49C", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {origin_country} · icao24: {ac.icao24}
      </p>
    </div>
  );
}