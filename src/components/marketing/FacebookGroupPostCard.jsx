import { forwardRef } from "react";

const ABOS_MARK = (
  <svg width="34" height="34" viewBox="0 0 44 44" style={{ display: "block", flexShrink: 0 }}>
    <rect width="44" height="44" rx="12" fill="rgba(212,160,23,0.16)" stroke="rgba(212,160,23,0.45)" strokeWidth="1" />
    <polyline points="7,33 15,14 19,33" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="19,33 24,20 28,26 36,9" fill="none" stroke="#f5c242" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="35,8 39,11 35,14" fill="#f5c242" />
  </svg>
);

/**
 * Square (1:1) branded card for the ABOS Facebook Group Assistant.
 * Rendered at a fixed 540px on-screen size; exported at higher resolution
 * via html2canvas's `scale` option so it stays crisp when downloaded.
 */
const FacebookGroupPostCard = forwardRef(function FacebookGroupPostCard({ headline, subline, confidence }, ref) {
  const confidencePct = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        height: 540,
        background: "radial-gradient(circle at 78% 15%, rgba(212,160,23,0.22), transparent 55%), linear-gradient(160deg, #0b1220 0%, #14213a 65%, #0b1220 100%)",
        backgroundColor: "#0b1220",
        backgroundImage:
          "radial-gradient(circle at 78% 15%, rgba(212,160,23,0.22), transparent 55%), linear-gradient(160deg, #0b1220 0%, #14213a 65%, #0b1220 100%), radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 22px 22px",
        color: "#fff",
        fontFamily: "'Work Sans', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 36,
        boxSizing: "border-box",
        borderRadius: 16,
        border: "1px solid rgba(212,160,23,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {ABOS_MARK}
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>ABOS</span>
        </div>
        <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(212,160,23,0.75)", fontWeight: 700 }}>
          Aircraft Intelligence
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: headline && headline.length > 12 ? 34 : 54, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, wordBreak: "break-word" }}>
          {headline}
        </div>
        <div style={{ marginTop: 14, fontSize: 15, color: "rgba(255,255,255,0.72)", lineHeight: 1.4, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          {subline}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          {confidencePct != null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>
              Match confidence {confidencePct}%
            </span>
          )}
        </div>
        <div
          style={{
            background: "#D4A017",
            color: "#0b1220",
            fontWeight: 800,
            fontSize: 15,
            textAlign: "center",
            padding: "12px 20px",
            borderRadius: 999,
          }}
        >
          Open Aircraft Advisor →
        </div>
      </div>
    </div>
  );
});

export default FacebookGroupPostCard;
