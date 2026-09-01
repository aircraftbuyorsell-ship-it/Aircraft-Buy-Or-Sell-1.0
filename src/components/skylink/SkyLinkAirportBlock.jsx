import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plane, Radio, ArrowUpRight, ArrowDownRight, Loader2, ChevronDown, Radar } from "lucide-react";

const AMBER = "#E8A83A";

function FlightRow({ f, direction }) {
  const dest = f.Destination || f.Origin || f.IATA || "—";
  const Icon = direction === "departures" ? ArrowUpRight : ArrowDownRight;
  return (
    <tr className="border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
      <td className="py-1.5 pl-3 pr-2 text-[11px] font-mono tabular-nums" style={{ color: "#1e293b" }}>{f.Time || "—"}</td>
      <td className="py-1.5 px-2 text-[11px] font-semibold" style={{ color: "#1e293b" }}>{f.Flight || "—"}</td>
      <td className="py-1.5 px-2 text-[11px]" style={{ color: "#6B6560" }}>{f.Airline || "—"}</td>
      <td className="py-1.5 px-2 text-[11px]" style={{ color: "#6B6560" }}>
        <Icon className="inline w-3 h-3 mr-1" style={{ color: AMBER }} />{dest}
      </td>
      <td className="py-1.5 pr-3 pl-2 text-[11px] font-semibold text-right" style={{ color: AMBER }}>{f.Status || "—"}</td>
    </tr>
  );
}

export default function SkyLinkAirportBlock({ code }) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setData(null);
    base44.functions.invoke("skylinkAirports", { airport: code })
      .then((res) => {
        const d = res.data || res;
        if (d.configured === false) { setData({ not_configured: true, message: d.message }); }
        else if (d.error) { setError(d.error); }
        else setData(d);
      })
      .catch((e) => setError(e?.response?.data?.error || e.message || "Failed to load SkyLink data"))
      .finally(() => setLoading(false));
  }, [code]);

  const airport = data?.airport;
  const schedules = data?.schedules;

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-black/[0.015]">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.25)" }}>
          <Radar className="w-4 h-4" style={{ color: AMBER }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: AMBER }}>SkyLink · Airport Intelligence</p>
          <p className="text-sm font-black truncate" style={{ color: "#1e293b" }}>
            {code}{airport ? ` — ${airport.name || airport.ident}` : ""}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "#6B6560" }} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
              <span className="text-xs" style={{ color: "#6B6560" }}>Fetching SkyLink data…</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {data?.not_configured && (
            <div className="rounded-xl px-4 py-4 flex items-start gap-3" style={{ background: "rgba(212,160,23,0.05)", border: "1px dashed rgba(212,160,23,0.3)" }}>
              <Plane className="w-4 h-4 shrink-0 mt-0.5" style={{ color: AMBER }} />
              <div>
                <p className="text-xs font-bold" style={{ color: "#6B6560" }}>SkyLink not connected</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#6B6560" }}>{data.message}</p>
              </div>
            </div>
          )}

          {airport && (
            <>
              {/* Airport profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Type", value: (airport.type || "").replace(/_/g, " ") || "—" },
                  { label: "City", value: airport.municipality || "—" },
                  { label: "Country", value: airport.country?.name || airport.iso_country || "—" },
                  { label: "Elevation", value: airport.elevation_ft != null ? `${Math.round(airport.elevation_ft)} ft` : "—" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#AAA49C" }}>{s.label}</p>
                    <p className="text-[11px] font-semibold mt-0.5 capitalize" style={{ color: "#1e293b" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Runways + frequencies */}
              <div className="grid sm:grid-cols-2 gap-3">
                {airport.runways?.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#AAA49C" }}>
                      <Plane className="w-3 h-3" /> Runways ({airport.runways.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {airport.runways.slice(0, 8).map((r, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.2)" }}>
                          {r.le_ident}/{r.he_ident}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {airport.frequencies?.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#AAA49C" }}>
                      <Radio className="w-3 h-3" /> Frequencies
                    </p>
                    <div className="space-y-0.5">
                      {airport.frequencies.slice(0, 5).map((f, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                          <span style={{ color: "#6B6560" }}>{f.type}</span>
                          <span className="font-mono font-semibold" style={{ color: "#1e293b" }}>{f.frequency_mhz} MHz</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Schedules */}
          {schedules && (schedules.departures.length > 0 || schedules.arrivals.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-3">
              {schedules.departures.length > 0 && (
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ background: "rgba(212,160,23,0.06)" }}>
                    <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: AMBER }}>
                      <ArrowUpRight className="w-3 h-3" /> Departures
                    </span>
                    <span className="text-[9px] font-semibold" style={{ color: "#6B6560" }}>{schedules.total_departures} total</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {schedules.departures.slice(0, 8).map((f, i) => <FlightRow key={i} f={f} direction="departures" />)}
                    </tbody>
                  </table>
                </div>
              )}
              {schedules.arrivals.length > 0 && (
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ background: "rgba(34,197,94,0.06)" }}>
                    <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: "#22c55e" }}>
                      <ArrowDownRight className="w-3 h-3" /> Arrivals
                    </span>
                    <span className="text-[9px] font-semibold" style={{ color: "#6B6560" }}>{schedules.total_arrivals} total</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {schedules.arrivals.slice(0, 8).map((f, i) => <FlightRow key={i} f={f} direction="arrivals" />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {data && !airport && !data.not_configured && !error && (
            <p className="text-xs text-center py-4" style={{ color: "#6B6560" }}>No airport data found for {code}.</p>
          )}
        </div>
      )}
    </div>
  );
}