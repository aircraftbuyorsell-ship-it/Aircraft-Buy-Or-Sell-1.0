import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, ImageOff } from "lucide-react";

const C = {
  amber: "#f5c242",
  amberDim: "rgba(245,194,66,0.10)",
  amberBdr: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5",
  red: "#e24b4a",
  w1: "rgba(255,255,255,0.90)",
  w2: "rgba(255,255,255,0.50)",
  w3: "rgba(255,255,255,0.35)",
  border: "rgba(255,255,255,0.08)",
};

function Stat({ label, value, color = C.w1 }) {
  return (
    <div>
      <p style={{ fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.w3, margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: "13px", fontWeight: 600, color, margin: 0 }}>{value}</p>
    </div>
  );
}

function AircraftPhoto({ ac }) {
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPhoto(null);

    const reg = ac.faa?.n_number || ac.registration;
    const icao = ac.icao24;
    const url = reg
      ? `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`
      : `https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(icao)}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const p = data.photos?.[0];
        if (p) { setPhoto(p); setStatus("ok"); }
        else { setStatus("none"); }
      })
      .catch(() => { if (!cancelled) setStatus("none"); });

    return () => { cancelled = true; };
  }, [ac.icao24, ac.registration, ac.faa?.n_number]);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", gap: "8px" }}>
        <Loader2 size={16} className="animate-spin" color={C.amber} />
        <span style={{ fontSize: "11px", color: C.w3 }}>Loading photo…</span>
      </div>
    );
  }

  if (status === "none" || !photo) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "120px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", gap: "6px" }}>
        <ImageOff size={18} color={C.w3} />
        <span style={{ fontSize: "11px", color: C.w3 }}>No photo available</span>
      </div>
    );
  }

  return (
    <div>
      <img
        src={photo.thumbnail_large?.src || photo.thumbnail?.src}
        alt="Aircraft"
        style={{ width: "100%", borderRadius: "8px", objectFit: "cover", maxHeight: "160px", display: "block" }}
      />
      <a href={photo.link} target="_blank" rel="noopener noreferrer"
        style={{ display: "block", fontSize: "10px", color: C.w3, marginTop: "5px", textDecoration: "none" }}>
        © {photo.photographer || "Unknown"} · planespotters.net
      </a>
    </div>
  );
}

export default function AircraftInfoPanel({ ac, onClose, onScore, scoreState }) {
  if (!ac) return null;

  const altFt = ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.28084) : null;
  const speedKt = ac.velocity != null ? Math.round(ac.velocity * 1.94384) : null;
  const nReg = ac.faa?.n_number || ac.registration || null;
  const vrate = ac.vertical_rate;
  const vrateStr = vrate != null
    ? (vrate > 0.5 ? `▲ ${Math.round(vrate * 196.85)} fpm` : vrate < -0.5 ? `▼ ${Math.round(Math.abs(vrate) * 196.85)} fpm` : "Level")
    : "—";

  const dealColor = ac.listing?.deal_label === "hot deal" ? C.teal : C.w2;

  return (
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: "280px", zIndex: 20,
      background: "rgba(255,255,255,0.04)", borderLeft: `0.5px solid ${C.border}`,
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      overflowY: "auto", padding: "18px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber, margin: "0 0 4px" }}>Selected Aircraft</p>
          <p style={{ fontSize: "18px", fontWeight: 600, color: C.w1, margin: 0, letterSpacing: "-0.02em", fontFamily: "'Courier New', monospace" }}>
            {nReg || ac.callsign?.trim() || ac.icao24}
          </p>
          <p style={{ fontSize: "10px", color: C.w3, margin: "3px 0 0", fontFamily: "'Courier New', monospace" }}>
            ICAO {ac.icao24}{ac.callsign?.trim() ? ` · ${ac.callsign.trim()}` : ""}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close"
          style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: `0.5px solid ${C.border}`, color: C.w2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={14} />
        </button>
      </div>

      <span style={{
        display: "inline-block", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        padding: "3px 10px", borderRadius: "99px", marginBottom: "14px",
        background: ac.on_ground ? "rgba(226,75,74,0.10)" : "rgba(93,202,165,0.09)",
        border: `0.5px solid ${ac.on_ground ? "rgba(226,75,74,0.22)" : "rgba(93,202,165,0.20)"}`,
        color: ac.on_ground ? C.red : C.teal,
      }}>
        {ac.on_ground ? "On Ground" : "Airborne"}
      </span>

      {/* Photo */}
      <div style={{ marginBottom: "16px" }}>
        <AircraftPhoto ac={ac} />
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 12px", marginBottom: "16px" }}>
        <Stat label="Altitude" value={altFt != null ? `${altFt.toLocaleString()} ft` : "—"} />
        <Stat label="Speed" value={speedKt != null ? `${speedKt} kt` : "—"} />
        <Stat label="Heading" value={ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—"} />
        <Stat label="Vertical" value={vrateStr} />
        {(ac.aircraft_type || ac.faa?.type_aircraft) && (
          <div style={{ gridColumn: "1 / -1" }}>
            <Stat label="Type" value={ac.aircraft_type || ac.faa?.type_aircraft} color={C.teal} />
          </div>
        )}
      </div>

      {/* ABOS listing badge */}
      {ac.listing && (
        <div style={{ borderRadius: "8px", background: C.amberDim, border: `0.5px solid ${C.amberBdr}`, padding: "12px 14px", marginBottom: "12px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.amber, margin: "0 0 6px" }}>ABOS Listing</p>
          <p style={{ fontWeight: 600, color: C.w1, fontSize: "13px", margin: 0 }}>
            {(ac.listing.year || ac.listing.make) ? `${ac.listing.year || ""} ${ac.listing.make || ""} ${ac.listing.model || ""}` : nReg}
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "11px", flexWrap: "wrap" }}>
            {ac.listing.ati_score && <span style={{ color: C.w2 }}>ATI <strong style={{ color: C.w1 }}>{ac.listing.ati_score}</strong></span>}
            {ac.listing.asking_price && <span style={{ color: C.w2 }}>${ac.listing.asking_price?.toLocaleString()}</span>}
            {ac.listing.deal_label && <span style={{ color: dealColor }}><strong>{ac.listing.deal_label}</strong></span>}
          </div>
          {ac.listing.card_code && <p style={{ fontSize: "10px", fontFamily: "'Courier New', monospace", color: C.w3, margin: "6px 0 0" }}>{ac.listing.card_code}</p>}
        </div>
      )}

      {/* Score CTA */}
      {!ac.listing && nReg && /^N/i.test(nReg || "") && !scoreState && (
        <button onClick={() => onScore(ac)}
          style={{ width: "100%", border: "none", borderRadius: "8px", background: C.amber, cursor: "pointer", padding: "10px", fontSize: "12px", fontWeight: 600, color: "#04060a", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Sparkles size={14} /> Look up FAA &amp; Create ATI Card
        </button>
      )}
      {scoreState === "loading" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.w2 }}>
          <Loader2 size={14} className="animate-spin" color={C.amber} /> Looking up FAA &amp; scoring…
        </div>
      )}
      {scoreState === "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.teal, fontWeight: 600 }}>
          <CheckCircle2 size={14} /> ATI Card created!
        </div>
      )}
      {scoreState && scoreState !== "loading" && scoreState !== "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.red, fontWeight: 600 }}>
          <AlertCircle size={14} /> {scoreState}
        </div>
      )}
    </div>
  );
}