import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Package, MapPin, Clock, Truck } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

const STATUS_COLORS = {
  IN_TRANSIT: "#f5c242",
  DELIVERED: "#5dcaa5",
  PICKED_UP: "#4e8ef7",
};

export default function DhlTrackDemo() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTrack = async () => {
    if (!trackingNumber.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("dhlShipmentTrack", { trackingNumber: trackingNumber.trim() });
      setResult(res);
    } catch (e) {
      setError(e.message || "Tracking request failed");
    }
    setLoading(false);
  };

  const shipment = result?.shipment;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[9px] uppercase tracking-wider font-bold mb-1 block" style={{ color: "rgba(255,255,255,0.40)" }}>
            Tracking Number
          </label>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            placeholder="e.g. 1234567890"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
          />
        </div>
        <button
          onClick={handleTrack}
          disabled={!trackingNumber.trim() || loading}
          className="px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-30"
          style={{ background: "#f5c242", color: "#04060a", minHeight: 42 }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Track
        </button>
      </div>

      {result?.demo && (
        <div className="px-3 py-2 rounded-lg text-[10px] font-semibold flex items-center gap-2"
          style={{ background: "rgba(245,194,66,0.06)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.18)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5c242]" />
          Demo mode — {result.message}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: "rgba(226,75,74,0.08)", color: "#e24b4a", border: "0.5px solid rgba(226,75,74,0.20)" }}>
          {error}
        </div>
      )}

      {/* Result */}
      {shipment && (
        <div className="space-y-3">
          {/* Shipment overview */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: "#f5c242" }} />
                <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>{shipment.trackingNumber}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: `${STATUS_COLORS[shipment.status] || "#888"}15`,
                  color: STATUS_COLORS[shipment.status] || "#888",
                }}>
                {shipment.status?.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.50)" }}>{shipment.service}</p>

            {/* Route */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>From</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                  {shipment.origin?.address?.city}, {shipment.origin?.address?.country}
                </p>
              </div>
              <Truck className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.30)" }} />
              <div className="flex-1 text-right">
                <p className="text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>To</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                  {shipment.destination?.address?.city}, {shipment.destination?.address?.country}
                </p>
              </div>
            </div>

            {/* ETA */}
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.40)" }} />
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.50)" }}>ETA: {formatDate(shipment.estimatedTimeOfDelivery)}</span>
            </div>
          </div>

          {/* Event timeline */}
          {result.events && result.events.length > 0 && (
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[9px] uppercase tracking-wider font-bold mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>Tracking History</p>
              <div className="space-y-3">
                {result.events.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1" style={{ background: i === 0 ? "#f5c242" : "rgba(255,255,255,0.30)" }} />
                      {i < result.events.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.08)" }} />}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.80)" }}>{ev.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.30)" }} />
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.40)" }}>{ev.location}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>· {formatDate(ev.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}