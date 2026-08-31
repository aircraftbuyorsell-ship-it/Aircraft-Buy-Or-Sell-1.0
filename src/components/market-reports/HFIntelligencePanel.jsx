import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart
} from "recharts";
import { Brain, TrendingUp, TrendingDown, Minus, Loader2, Zap, Activity } from "lucide-react";

const HORIZONS = [30, 60, 90];

const SIGNAL_STYLES = {
  BUY: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", icon: TrendingUp },
  HOLD: { color: "#D4A017", bg: "rgba(212,160,23,0.12)", border: "rgba(212,160,23,0.3)", icon: Minus },
  WATCH: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", icon: TrendingDown },
};

const SENTIMENT_STYLES = {
  positive: { label: "Bullish", color: "#22c55e", emoji: "🟢" },
  neutral: { label: "Neutral", color: "#D4A017", emoji: "🟡" },
  negative: { label: "Bearish", color: "#ef4444", emoji: "🔴" },
};

function fmtPrice(v) {
  if (v == null) return "—";
  return "$" + Math.round(v).toLocaleString();
}

export default function HFIntelligencePanel() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await base44.functions.invoke("hfMarketIntelligence", {
        make, model, horizon_days: horizon
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err) => {
      const resp = err?.response?.data;
      setError(resp?.error || err.message || "Failed to run intelligence");
    },
  });

  const handleRun = () => {
    if (!make.trim()) {
      setError("Please enter an aircraft make (e.g. Cessna)");
      return;
    }
    runMutation.mutate();
  };

  // Build chart data: history + forecast
  const chartData = [];
  if (result?.history) {
    result.history.forEach((h, i) => {
      chartData.push({
        label: h.date,
        idx: i,
        actual: h.price,
        forecast: null,
        low: null,
        high: null,
      });
    });
  }
  if (result?.forecast) {
    const lastHistIdx = chartData.length;
    result.forecast.forEach((f, i) => {
      chartData.push({
        label: `+${f.day}d`,
        idx: lastHistIdx + i,
        actual: null,
        forecast: f.price_mid,
        low: f.price_low,
        high: f.price_high,
      });
    });
  }

  const sigStyle = result ? SIGNAL_STYLES[result.signal] || SIGNAL_STYLES.HOLD : null;
  const sentStyle = result ? SENTIMENT_STYLES[result.sentiment?.label] || SENTIMENT_STYLES.neutral : null;
  const SigIcon = sigStyle?.icon;

  return (
    <div
      style={{
        borderRadius: 16,
        border: "0.5px solid rgba(212,160,23,0.18)",
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(0,245,255,0.08)",
            border: "0.5px solid rgba(0,245,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Brain size={20} style={{ color: "#00f5ff" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#fff" }}>
            AI Forecast Engine
          </h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
            Hugging Face Chronos-Bolt time-series + FinBERT sentiment analysis
          </p>
        </div>
      </div>

      {/* Input controls */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: "1 1 180px" }}>
            <label style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Make
            </label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Cessna"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "0.5px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Model (optional)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. 172 Skyhawk"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "0.5px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <label style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Horizon
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: horizon === h
                      ? "0.5px solid rgba(0,245,255,0.4)"
                      : "0.5px solid rgba(255,255,255,0.10)",
                    background: horizon === h
                      ? "rgba(0,245,255,0.08)"
                      : "rgba(255,255,255,0.03)",
                    color: horizon === h ? "#00f5ff" : "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {h}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={runMutation.isPending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            borderRadius: 10,
            border: "none",
            background: runMutation.isPending
              ? "rgba(0,245,255,0.15)"
              : "linear-gradient(135deg, #00f5ff, #00b8d4)",
            color: "#04060a",
            fontSize: 13,
            fontWeight: 700,
            cursor: runMutation.isPending ? "wait" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {runMutation.isPending ? (
            <><Loader2 size={15} className="animate-spin" /> Running Intelligence…</>
          ) : (
            <><Zap size={15} /> Run Intelligence</>
          )}
        </button>

        {result?.cached && (
          <span style={{ marginLeft: 12, fontSize: 11, color: "#5dcaa5" }}>
            ✓ Cached result (6h TTL)
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: "0 24px 16px", padding: "12px 16px", borderRadius: 10, border: "0.5px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
          <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {runMutation.isPending && !result && (
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ height: 280, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={28} className="animate-spin" style={{ color: "#00f5ff", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Calling Hugging Face models…</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !runMutation.isPending && (
        <div style={{ padding: "0 24px 24px" }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {/* Signal badge */}
            {sigStyle && SigIcon && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 999,
                background: sigStyle.bg, border: `0.5px solid ${sigStyle.border}`,
              }}>
                <SigIcon size={16} style={{ color: sigStyle.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: sigStyle.color, letterSpacing: "0.05em" }}>
                  {result.signal}
                </span>
              </div>
            )}
            {/* Sentiment badge */}
            {sentStyle && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 999,
                background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)",
              }}>
                <span style={{ fontSize: 14 }}>{sentStyle.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: sentStyle.color }}>
                  {sentStyle.label}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {Math.round((result.sentiment?.score || 0) * 100)}% conf
                </span>
              </div>
            )}
            {/* Forecast change */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 999,
              background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)",
            }}>
              <Activity size={14} style={{ color: "#D4A017" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: result.forecast_change_pct > 0 ? "#22c55e" : result.forecast_change_pct < 0 ? "#ef4444" : "#D4A017" }}>
                {result.forecast_change_pct > 0 ? "+" : ""}{result.forecast_change_pct}%
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>in {result.horizon_days}d</span>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{
              height: 300,
              borderRadius: 12,
              border: "0.5px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
              padding: "16px 8px 8px",
              marginBottom: 20,
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A017" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#D4A017" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickFormatter={(v) => fmtPrice(v)} width={70} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(4,6,10,0.95)",
                      border: "0.5px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#fff",
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                    formatter={(v, name) => {
                      if (v == null) return ["—", name];
                      const labels = { actual: "Historical", forecast: "Forecast", low: "Low", high: "High" };
                      return [fmtPrice(v), labels[name] || name];
                    }}
                  />
                  {/* Confidence band */}
                  <Area type="monotone" dataKey="high" stroke="none" fill="url(#fcGrad)" fillOpacity={1} />
                  <Area type="monotone" dataKey="low" stroke="none" fill="rgba(4,6,10,0.95)" fillOpacity={1} />
                  {/* Historical line */}
                  <Line type="monotone" dataKey="actual" stroke="#00f5ff" strokeWidth={2} dot={false} connectNulls={false} />
                  {/* Forecast line */}
                  <Line type="monotone" dataKey="forecast" stroke="#D4A017" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={true} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Commentary */}
          {result.ai_commentary && (
            <div style={{
              borderRadius: 12,
              border: "0.5px solid rgba(0,245,255,0.15)",
              background: "rgba(0,245,255,0.03)",
              padding: "16px 20px",
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Brain size={14} style={{ color: "#00f5ff" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#00f5ff", fontWeight: 700 }}>
                  AI Commentary
                </span>
              </div>
              <p style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
                fontFamily: "'Courier Prime', monospace",
                whiteSpace: "pre-wrap",
              }}>
                {result.ai_commentary}
              </p>
            </div>
          )}

          {/* Price summary */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px", padding: "12px 16px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>Current Avg</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#00f5ff", margin: 0 }}>{fmtPrice(result.current_price)}</p>
            </div>
            <div style={{ flex: "1 1 140px", padding: "12px 16px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>{result.horizon_days}d Forecast</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#D4A017", margin: 0 }}>{fmtPrice(result.forecast?.[result.forecast.length - 1]?.price_mid)}</p>
            </div>
            <div style={{ flex: "1 1 140px", padding: "12px 16px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>Confidence Band</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                {fmtPrice(result.forecast?.[result.forecast.length - 1]?.price_low)} – {fmtPrice(result.forecast?.[result.forecast.length - 1]?.price_high)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}