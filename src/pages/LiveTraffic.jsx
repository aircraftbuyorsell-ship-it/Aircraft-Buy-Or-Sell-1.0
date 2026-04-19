import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Radio, Search, Plane, AlertCircle, Navigation, Gauge, Clock, MapPin } from "lucide-react";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-[#0B2D5B]" />
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#AAA49C]">{label}</p>
      </div>
      <p className="text-xl font-black text-[#1A1814]">{value}</p>
      {sub && <p className="text-[10px] text-[#6B6560] mt-0.5">{sub}</p>}
    </div>
  );
}

function formatTime(unix) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function LiveTraffic() {
  const [hex, setHex] = useState("");
  const [state, setState] = useState(null);
  const [flights, setFlights] = useState(null);
  const [error, setError] = useState(null);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const h = hex.trim().toLowerCase();
      if (!h) throw new Error("Enter a Mode-S hex code (e.g. 3c675a)");
      setError(null);
      setState(null);
      setFlights(null);
      const [stateRes, flightsRes] = await Promise.all([
        base44.functions.invoke("openSky", { action: "state", icao24: h }),
        base44.functions.invoke("openSky", { action: "flights", icao24: h, days: 7 }),
      ]);
      return {
        state: stateRes.data?.state || null,
        flights: flightsRes.data?.flights || [],
      };
    },
    onSuccess: (data) => {
      setState(data.state);
      setFlights(data.flights);
    },
    onError: (e) => setError(e.message),
  });

  const mps2kts = (mps) => mps != null ? Math.round(mps * 1.94384) : null;
  const m2ft = (m) => m != null ? Math.round(m * 3.28084) : null;

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <GoldLabel>Live · OpenSky Network · ADS-B</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1 uppercase">
          Live Traffic
        </h1>
        <p className="text-[#6B6560] text-sm mt-1">
          Real-time aircraft position, altitude & velocity via ADS-B. Search by Mode-S hex code.
        </p>

        {/* Search */}
        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupMutation.mutate()}
              placeholder="Mode-S hex (e.g. 3c675a, a12b3c)"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-md text-sm font-mono focus:outline-none focus:border-[#0B2D5B]"
            />
          </div>
          <button
            onClick={() => lookupMutation.mutate()}
            disabled={lookupMutation.isPending || !hex.trim()}
            className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white font-black uppercase tracking-wider text-sm px-5 rounded-md transition-colors"
          >
            <Radio className={`w-4 h-4 ${lookupMutation.isPending ? "animate-pulse" : ""}`} />
            {lookupMutation.isPending ? "Pinging…" : "Track"}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-md px-4 py-2.5">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Current State */}
        {state !== null && (
          <div className="mt-6">
            <GoldLabel>Current State</GoldLabel>
            {state ? (
              <div className="mt-3">
                <div className="bg-[#0B2D5B] text-white rounded-md p-4 mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8A83A] font-bold">Callsign</p>
                    <p className="text-xl font-black font-mono">{state.callsign || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8A83A] font-bold">Status</p>
                    <p className="text-sm font-black uppercase">
                      {state.on_ground ? "On Ground" : "Airborne"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatTile icon={Gauge} label="Altitude" value={m2ft(state.baro_altitude)?.toLocaleString() || "—"} sub="ft (baro)" />
                  <StatTile icon={Navigation} label="Ground Speed" value={mps2kts(state.velocity) || "—"} sub="knots" />
                  <StatTile icon={Navigation} label="Heading" value={state.true_track != null ? Math.round(state.true_track) + "°" : "—"} sub="true track" />
                  <StatTile icon={MapPin} label="Position" value={state.latitude != null ? `${state.latitude.toFixed(3)}, ${state.longitude.toFixed(3)}` : "—"} sub={state.origin_country} />
                </div>
                <p className="text-[10px] text-[#AAA49C] mt-2 uppercase tracking-wider">
                  Last contact: {formatTime(state.last_contact)} · {state.position_source === 0 ? "ADS-B" : "MLAT/FLARM"}
                </p>
              </div>
            ) : (
              <div className="mt-3 bg-white border border-black/[0.07] rounded-md p-6 text-center">
                <Plane className="w-10 h-10 text-[#AAA49C] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#6B6560]">No current transmission — aircraft not airborne or out of receiver range.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Flights */}
        {flights !== null && (
          <div className="mt-8">
            <GoldLabel>Recent Flights · Last 7 Days</GoldLabel>
            {flights.length === 0 ? (
              <div className="mt-3 bg-white border border-black/[0.07] rounded-md p-6 text-center">
                <Clock className="w-10 h-10 text-[#AAA49C] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#6B6560]">No flights recorded in the last 7 days.</p>
              </div>
            ) : (
              <div className="mt-3 bg-white border border-black/[0.07] rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_80px] gap-2 px-4 py-2 border-b border-black/[0.06] bg-[#F7F4EF] text-[9px] uppercase tracking-wider font-bold text-[#AAA49C]">
                  <div>Departure</div>
                  <div>Arrival</div>
                  <div>Callsign</div>
                  <div className="text-right">Duration</div>
                </div>
                {flights.map((f, i) => {
                  const dur = f.lastSeen && f.firstSeen
                    ? Math.round((f.lastSeen - f.firstSeen) / 60) + "m"
                    : "—";
                  return (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px] gap-2 px-4 py-3 border-b border-black/[0.05] last:border-0 text-[12px]">
                      <div>
                        <p className="font-bold text-[#1A1814] font-mono">{f.estDepartureAirport || "—"}</p>
                        <p className="text-[10px] text-[#AAA49C]">{formatTime(f.firstSeen)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1814] font-mono">{f.estArrivalAirport || "—"}</p>
                        <p className="text-[10px] text-[#AAA49C]">{formatTime(f.lastSeen)}</p>
                      </div>
                      <div className="font-mono text-[#6B6560]">{f.callsign?.trim() || "—"}</div>
                      <div className="text-right font-bold text-[#0B2D5B]">{dur}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-[#AAA49C] mt-2 uppercase tracking-wider">
              Data: OpenSky Network · Community ADS-B feed
            </p>
          </div>
        )}

        {/* Empty state */}
        {state === null && flights === null && !lookupMutation.isPending && (
          <div className="mt-8 bg-white border border-black/[0.07] rounded-md p-8 text-center">
            <Radio className="w-12 h-12 text-[#E8A83A] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-black text-[#1A1814] uppercase tracking-tight">Track any aircraft live</h3>
            <p className="text-sm text-[#6B6560] mt-2 max-w-md mx-auto">
              Enter the aircraft's Mode-S hex transponder code (ICAO24) to see its current position, altitude,
              velocity and recent flight history. Hex codes are available on FAA listings as <span className="font-mono">mode_s_hex</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}