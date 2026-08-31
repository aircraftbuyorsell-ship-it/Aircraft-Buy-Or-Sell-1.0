import { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { format } from "date-fns";

const PATH_DOT = L.divIcon({
  html: `<div style="width:6px;height:6px;border-radius:50%;background:#00d4ff;border:1px solid rgba(0,212,255,0.6);box-shadow:0 0 6px rgba(0,212,255,0.5)"></div>`,
  className: "",
  iconSize: [6, 6],
  iconAnchor: [3, 3],
});

const START_MARKER = L.divIcon({
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 0 8px rgba(34,197,94,0.6)"></div>`,
  className: "",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const END_MARKER = L.divIcon({
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#00d4ff;border:2px solid #fff;box-shadow:0 0 10px rgba(0,212,255,0.7)"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function FitBounds({ positions }) {
  const map = useMap();
  useMemo(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      if (positions.length === 1) {
        map.setView(positions[0], 10);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [map, positions]);
  return null;
}

export default function FlightPathMap({ appearances = [], isDark = false }) {
  const sorted = useMemo(() =>
    [...appearances].sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at)),
    [appearances]
  );

  const positions = useMemo(() =>
    sorted.filter(a => a.latitude != null && a.longitude != null)
      .map(a => [a.latitude, a.longitude]),
    [sorted]
  );

  if (!sorted.length) {
    return (
      <div className="rounded-xl flex items-center justify-center h-48"
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"
        }}>
        <span className="text-[11px] font-medium">No position data available</span>
      </div>
    );
  }

  const pathColor = isDark ? "#00d4ff" : "#2563eb";
  const subColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}` }}>
      <MapContainer
        center={positions[positions.length - 1]}
        zoom={9}
        style={{ height: 260, width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {/* Flight path polyline */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: pathColor,
              weight: 2.5,
              opacity: 0.7,
              dashArray: "6 4",
            }}
          />
        )}

        {/* Intermediate dots (every Nth point to avoid clutter) */}
        {sorted.filter(a => a.latitude != null).map((a, i) => {
          const step = Math.max(1, Math.floor(sorted.length / 15));
          if (i % step !== 0 && i !== 0 && i !== sorted.length - 1) return null;
          return (
            <Marker
              key={a.id || i}
              position={[a.latitude, a.longitude]}
              icon={i === 0 ? START_MARKER : i === sorted.length - 1 ? END_MARKER : PATH_DOT}
            >
              <Popup>
                <div style={{ minWidth: 160, fontSize: 11 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: subColor, margin: "0 0 4px" }}>
                    {a.captured_at ? format(new Date(a.captured_at), "MMM d, HH:mm") : "—"}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                    <span style={{ color: subColor }}>Alt:</span>
                    <strong>{a.altitude_ft != null ? `${a.altitude_ft.toLocaleString()} ft` : "—"}</strong>
                    <span style={{ color: subColor }}>Speed:</span>
                    <strong>{a.speed_kt != null ? `${a.speed_kt} kt` : "—"}</strong>
                    <span style={{ color: subColor }}>Hdg:</span>
                    <strong>{a.heading != null ? `${Math.round(a.heading)}°` : "—"}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          <span className="text-[9px] font-semibold" style={{ color: subColor }}>Earliest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" />
          <span className="text-[9px] font-semibold" style={{ color: subColor }}>Latest</span>
        </div>
        <div className="ml-auto text-[9px] font-semibold" style={{ color: subColor }}>
          {positions.length} points · {sorted.length} sightings
        </div>
      </div>
    </div>
  );
}