import { m2ft, mps2kts, PALETTE } from "./liveTrafficConfig";

function StatBox({ label, value, status }) {
  const valueColor = status === "ground" ? PALETTE.rust : status === "air" ? PALETTE.sage : PALETTE.cream;
  return (
    <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.muted}55`, borderRadius: 8, padding: "7px 8px" }}>
      <p style={{ fontSize: 8, color: PALETTE.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 900, color: valueColor, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function AircraftPopup({ aircraft }) {
  const listing = aircraft.listing;
  const title = listing
    ? `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim()
    : aircraft.callsign?.trim() || aircraft.icao24;

  return (
    <div style={{ fontFamily: "Space Grotesk, Inter, sans-serif", minWidth: 235, background: PALETTE.void, color: PALETTE.cream }}>
      <div style={{ background: PALETTE.panel, margin: "-8px -12px 10px", padding: "11px 12px", borderRadius: "6px 6px 0 0", borderBottom: `1px solid ${PALETTE.muted}55` }}>
        <p style={{ color: PALETTE.cognac, fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
          {aircraft.faa?.n_number || aircraft.callsign || aircraft.icao24}
        </p>
        <p style={{ color: PALETTE.cream, fontWeight: 900, fontSize: 14, margin: "4px 0 0" }}>{title}</p>
        {aircraft.origin_country && <p style={{ color: PALETTE.muted, fontSize: 10, margin: "3px 0 0" }}>{aircraft.origin_country}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
        <StatBox label="Altitude" value={m2ft(aircraft.baro_altitude) != null ? `${m2ft(aircraft.baro_altitude).toLocaleString()} ft` : "—"} />
        <StatBox label="Speed" value={mps2kts(aircraft.velocity) != null ? `${mps2kts(aircraft.velocity)} kts` : "—"} />
        <StatBox label="Heading" value={aircraft.true_track != null ? `${Math.round(aircraft.true_track)}°` : "—"} />
        <StatBox label="Status" value={aircraft.on_ground ? "On Ground" : "Airborne"} status={aircraft.on_ground ? "ground" : "air"} />
      </div>

      {listing ? (
        <div style={{ background: `${PALETTE.cognac}20`, border: `1px solid ${PALETTE.cognac}80`, borderRadius: 10, padding: "9px 10px", marginBottom: 10 }}>
          <p style={{ color: PALETTE.cognac, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px" }}>
            Real-time ABOS Market Signal
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ color: PALETTE.muted, fontSize: 8, textTransform: "uppercase", fontWeight: 800, margin: 0 }}>ATI Score</p>
              <p style={{ color: PALETTE.gold, fontSize: 16, fontWeight: 950, margin: 0 }}>{listing.ati_score ?? "—"}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: PALETTE.muted, fontSize: 8, textTransform: "uppercase", fontWeight: 800, margin: 0 }}>Asking Price</p>
              <p style={{ color: PALETTE.gold, fontSize: 16, fontWeight: 950, margin: 0 }}>
                {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: `${PALETTE.muted}18`, border: `1px solid ${PALETTE.muted}45`, borderRadius: 10, padding: "8px 10px", marginBottom: 10 }}>
          <p style={{ color: PALETTE.muted, fontSize: 10, fontWeight: 800, margin: 0 }}>No active ABOS listing matched in this snapshot.</p>
        </div>
      )}

      <p style={{ fontSize: 8, color: PALETTE.muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        ICAO24: {aircraft.icao24}
      </p>
    </div>
  );
}