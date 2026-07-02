import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import { Fuel, Search, RefreshCw, TrendingDown, TrendingUp, DollarSign, Plane } from "lucide-react";

const GOLD = "#f5c242";
const GREEN = "#5dcaa5";
const BLUE = "#4e8ef7";
const RED = "#e24b4a";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

function PriceTile({ label, value, nationalAvg, icon: Icon }) {
  const diff = value && nationalAvg ? value - nationalAvg : 0;
  const isHigher = diff > 0;
  return (
    <div className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${GOLD}15`, border: `0.5px solid ${GOLD}30` }}>
          <Icon size={14} style={{ color: GOLD }} />
        </div>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
          {label}
        </p>
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: WHITE, letterSpacing: "-0.03em" }}>
        {value != null ? `$${value.toFixed(2)}` : "—"}
      </p>
      {nationalAvg != null && value != null && (
        <div className="flex items-center gap-1 mt-1">
          {isHigher ? <TrendingUp size={11} style={{ color: RED }} /> : <TrendingDown size={11} style={{ color: GREEN }} />}
          <span style={{ fontSize: 10, color: isHigher ? RED : GREEN, fontWeight: 600 }}>
            {isHigher ? "+" : ""}{diff.toFixed(2)} vs national avg
          </span>
        </div>
      )}
      {nationalAvg != null && value == null && (
        <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>National avg: ${nationalAvg.toFixed(2)}</p>
      )}
    </div>
  );
}

export default function FuelPriceTracker() {
  const [icao, setIcao] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const searchFuel = async () => {
    if (!icao.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await base44.functions.invoke("aviationServiceIntel", {
        action: "fuel_prices",
        icao: icao.trim().toUpperCase(),
      });
      setData(res.data);
    } catch (e) {
      setError(e.message || "Failed to fetch fuel prices");
    } finally {
      setLoading(false);
    }
  };

  const chartData = data?.fbos
    ?.filter(f => f.price_100ll != null || f.price_jeta != null)
    .map(f => ({
      name: f.name?.length > 18 ? f.name.substring(0, 16) + "…" : f.name,
      "100LL": f.price_100ll,
      "Jet-A": f.price_jeta,
    })) || [];

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 10 }}>
          Live Fuel Price Intelligence
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={icao}
            onChange={(e) => setIcao(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchFuel()}
            placeholder="Enter airport ICAO code (e.g. KJFK, KLAX, EGLL, LEMD)…"
            className="flex-1 min-w-[200px]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: WHITE,
              fontSize: 13,
              padding: "10px 14px",
              minHeight: 40,
            }}
          />
          <button
            onClick={searchFuel}
            disabled={loading || !icao.trim()}
            className="flex items-center gap-2 rounded-lg transition-all shrink-0"
            style={{
              background: loading || !icao.trim() ? "rgba(255,255,255,0.04)" : "rgba(245,194,66,0.09)",
              border: loading || !icao.trim() ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(245,194,66,0.22)",
              color: loading || !icao.trim() ? "rgba(255,255,255,0.25)" : GOLD,
              fontSize: 12,
              fontWeight: 600,
              padding: "0 16px",
              minHeight: 40,
            }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Fetching…" : "Get Prices"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: "rgba(245,194,66,0.20)", borderTopColor: "#f5c242" }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.15)" }}>
          <p style={{ fontSize: 12, color: RED, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Airport header */}
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
                <Plane size={18} style={{ color: GOLD }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: WHITE, letterSpacing: "-0.03em" }}>
                  {data.airport || icao.toUpperCase()}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {data.location || ""} {data.last_updated ? `· Updated ${data.last_updated}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Price tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <PriceTile label="Avg 100LL" value={data.avg_100ll} nationalAvg={data.national_avg_100ll} icon={Fuel} />
            <PriceTile label="Avg Jet-A" value={data.avg_jeta} nationalAvg={data.national_avg_jeta} icon={Fuel} />
            <PriceTile label="National 100LL" value={data.national_avg_100ll} icon={DollarSign} />
            <PriceTile label="National Jet-A" value={data.national_avg_jeta} icon={DollarSign} />
          </div>

          {/* FBO comparison chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 16 }}>
                FBO Fuel Price Comparison
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "#0d1117", border: "1px solid rgba(255,255,255,0.10)", color: WHITE }} />
                  <Bar dataKey="100LL" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Jet-A" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center mt-2">
                <span className="flex items-center gap-1" style={{ fontSize: 10, color: MUTED }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: GOLD }} /> 100LL
                </span>
                <span className="flex items-center gap-1" style={{ fontSize: 10, color: MUTED }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: BLUE }} /> Jet-A
                </span>
              </div>
            </div>
          )}

          {/* FBO list */}
          {data.fbos?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
                FBOs at {icao.toUpperCase()}
              </p>
              <div className="space-y-2">
                {data.fbos.map((fbo, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 12, fontWeight: 600, color: WHITE }}>{fbo.name}</p>
                      {fbo.services?.length > 0 && (
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                          {fbo.services.join(", ")}
                        </p>
                      )}
                      {fbo.phone && (
                        <p style={{ fontSize: 9, color: BLUE, marginTop: 2 }}>{fbo.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {fbo.price_100ll != null && (
                        <div className="text-center rounded-lg px-2 py-1" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
                          <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>100LL</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>${fbo.price_100ll.toFixed(2)}</p>
                        </div>
                      )}
                      {fbo.price_jeta != null && (
                        <div className="text-center rounded-lg px-2 py-1" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.15)" }}>
                          <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Jet-A</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>${fbo.price_jeta.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-16">
          <Fuel size={32} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>Live Fuel Price Intelligence</p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 4, maxWidth: 400, margin: "4px auto 0" }}>
            Enter an airport ICAO code above to fetch real-time fuel prices from FBOs.
            Data is sourced live from fuel price reporting services.
          </p>
        </div>
      )}
    </div>
  );
}