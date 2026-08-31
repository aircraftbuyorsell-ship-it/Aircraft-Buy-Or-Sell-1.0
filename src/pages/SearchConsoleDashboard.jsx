import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Search, MousePointerClick, Eye, Target, Globe,
  Loader2, TrendingUp, TrendingDown, ChevronDown,
} from "lucide-react";

const fmtNum = (n) => n?.toLocaleString() || "0";
const fmtPct = (n) => `${n > 0 ? "+" : ""}${n}%`;
const fmtDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0B1220", border: "0.5px solid rgba(212,160,23,0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
      <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: 0, color: p.color, fontWeight: 600 }}>
          {p.dataKey === "clicks" ? "Clicks" : "Impressions"}: {fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function SearchConsoleDashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(28);

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await base44.functions.invoke("searchConsolePerformance", { mode: "sites" });
        setSites(res.data.sites || []);
        if (res.data.sites?.length > 0) setSelectedSite(res.data.sites[0].url);
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch performance when site or days change
  const fetchPerformance = useCallback(async () => {
    if (!selectedSite) return;
    setLoadingPerf(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("searchConsolePerformance", {
        mode: "performance",
        siteUrl: selectedSite,
        days,
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setData(null);
    } finally {
      setLoadingPerf(false);
    }
  }, [selectedSite, days]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const kpiCards = data ? [
    {
      label: "Clicks",
      value: fmtNum(data.current.clicks),
      change: data.changes.clicks,
      icon: MousePointerClick,
      color: "#D4A017",
    },
    {
      label: "Impressions",
      value: fmtNum(data.current.impressions),
      change: data.changes.impressions,
      icon: Eye,
      color: "#2563EB",
    },
    {
      label: "Avg CTR",
      value: `${data.current.ctr}%`,
      change: data.changes.ctr,
      icon: Target,
      color: "#5dcaa5",
      suffix: "pp",
    },
    {
      label: "Avg Position",
      value: data.current.position,
      change: data.changes.position,
      icon: TrendingUp,
      color: "#a855f7",
      invertChange: true, // lower position is better
    },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ borderBottom: "0.5px solid rgba(212,160,23,0.1)", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D4A017", margin: 0, marginBottom: 4 }}>Google Search Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>Marketspace Performance Trends</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Site selector */}
          {loadingSites ? (
            <Loader2 size={16} className="animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          ) : (
            <div style={{ position: "relative" }}>
              <select
                value={selectedSite || ""}
                onChange={(e) => setSelectedSite(e.target.value)}
                style={{
                  appearance: "none",
                  background: "#111827",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "8px 32px 8px 12px",
                  color: "#fff",
                  fontSize: 12,
                  outline: "none",
                  cursor: "pointer",
                  maxWidth: 280,
                }}
              >
                {sites.map((s) => (
                  <option key={s.url} value={s.url} style={{ background: "#0B1220", color: "#fff" }}>
                    {s.url}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
            </div>
          )}
          {/* Days selector */}
          <div style={{ position: "relative" }}>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{
                appearance: "none",
                background: "#111827",
                border: "0.5px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "8px 32px 8px 12px",
                color: "#fff",
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value={7} style={{ background: "#0B1220" }}>Last 7 days</option>
              <option value={28} style={{ background: "#0B1220" }}>Last 28 days</option>
              <option value={90} style={{ background: "#0B1220" }}>Last 90 days</option>
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
          </div>
          <button
            onClick={fetchPerformance}
            disabled={loadingPerf}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(212,160,23,0.1)", border: "0.5px solid rgba(212,160,23,0.25)",
              color: "#D4A017", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {loadingPerf ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Refresh
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
        {error ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ color: "#e24b4a", fontSize: 14, marginBottom: 8 }}>Error loading data</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{error}</p>
          </div>
        ) : loadingPerf && !data ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "#D4A017", margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading performance data...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
              {kpiCards.map(({ label, value, change, icon: Icon, color, suffix, invertChange }) => {
                const isPositive = invertChange ? change < 0 : change > 0;
                const isNeutral = change === 0;
                return (
                  <div key={label} style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Icon size={14} style={{ color }} />
                      <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", color, lineHeight: 1, marginBottom: 8 }}>
                      {value}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      {!isNeutral && (isPositive ? <TrendingUp size={12} style={{ color: "#5dcaa5" }} /> : <TrendingDown size={12} style={{ color: "#e24b4a" }} />)}
                      <span style={{ color: isNeutral ? "rgba(255,255,255,0.3)" : isPositive ? "#5dcaa5" : "#e24b4a", fontWeight: 600 }}>
                        {isNeutral ? "no change" : `${change > 0 ? "+" : ""}${change}${suffix || "%"}`}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>vs prev period</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TREND CHART */}
            <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "24px", marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: 0, marginBottom: 4 }}>Search Performance</p>
                  <h2 style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>Clicks & Impressions Over Time</h2>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#D4A017" }} /> Clicks
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#2563EB" }} /> Impressions
                  </span>
                </div>
              </div>
              {data.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.daily} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A017" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#D4A017" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="imprGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="impressions" stroke="#2563EB" strokeWidth={1.5} fill="url(#imprGrad)" />
                    <Area type="monotone" dataKey="clicks" stroke="#D4A017" strokeWidth={2} fill="url(#clicksGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, paddingTop: 40 }}>No search data available for this period.</p>
              )}
            </div>

            {/* TOP QUERIES & PAGES */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Top Queries */}
              <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Top Search Queries
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                        {["Query", "Clicks", "Impr.", "CTR", "Pos"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topQueries.length > 0 ? data.topQueries.map((q, i) => (
                        <tr key={i} style={{ borderBottom: "0.5px solid #111827" }}>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.85)", fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.query}</td>
                          <td style={{ padding: "8px 16px", color: "#D4A017", fontWeight: 600 }}>{fmtNum(q.clicks)}</td>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.5)" }}>{fmtNum(q.impressions)}</td>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.6)" }}>{q.ctr}%</td>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.6)" }}>{q.position}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No query data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Pages */}
              <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Top Pages
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                        {["Page", "Clicks", "Impr.", "CTR", "Pos"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPages.length > 0 ? data.topPages.map((p, i) => (
                        <tr key={i} style={{ borderBottom: "0.5px solid #111827" }}>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.85)", fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.page}>
                            {p.page.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </td>
                          <td style={{ padding: "8px 16px", color: "#D4A017", fontWeight: 600 }}>{fmtNum(p.clicks)}</td>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.5)" }}>{fmtNum(p.impressions)}</td>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.6)" }}>{p.ctr}%</td>
                          <td style={{ padding: "8px 16px", color: "rgba(255,255,255,0.6)" }}>{p.position}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No page data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* DEVICE BREAKDOWN */}
            {data.devices.length > 0 && (
              <div style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px", marginTop: 16 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Device Breakdown</p>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {data.devices.map((d) => {
                    const totalClicks = data.devices.reduce((s, x) => s + x.clicks, 0) || 1;
                    const pct = Math.round((d.clicks / totalClicks) * 100);
                    return (
                      <div key={d.device} style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <Globe size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "capitalize" }}>{d.device}</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 500, color: "#D4A017", marginBottom: 4 }}>{fmtNum(d.clicks)} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>clicks</span></div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#D4A017", borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{pct}% of total</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}