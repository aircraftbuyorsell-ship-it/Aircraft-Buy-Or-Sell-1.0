import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Brain, TrendingUp, TrendingDown, Minus, Loader2, ArrowRight } from "lucide-react";

const SIGNAL_STYLES = {
  BUY: { color: "#22c55e", bg: "rgba(34,197,94,0.10)", icon: TrendingUp },
  HOLD: { color: "#D4A017", bg: "rgba(212,160,23,0.10)", icon: Minus },
  WATCH: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", icon: TrendingDown },
};

export default function HFMarketWidget() {
  const navigate = useNavigate();

  // Load cached HF forecasts from MarketForecast entity
  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["hf-market-forecasts"],
    queryFn: () =>
      base44.entities.MarketForecast.filter(
        { cache_key: { $exists: true } },
        "-created_date",
        20
      ),
    staleTime: 60000,
  });

  // Deduplicate by cache_key, keep latest
  const seen = new Set();
  const unique = [];
  for (const f of forecasts) {
    if (f.cache_key && !seen.has(f.cache_key)) {
      seen.add(f.cache_key);
      unique.push(f);
    }
  }
  const top3 = unique.slice(0, 3);

  const handleRowClick = (f) => {
    const params = new URLSearchParams();
    if (f.hf_make) params.set("hf_make", f.hf_make);
    if (f.hf_model) params.set("hf_model", f.hf_model);
    navigate(`/market-reports?${params.toString()}`);
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: "0.5px solid rgba(0,245,255,0.15)",
        background: "rgba(0,245,255,0.02)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(0,245,255,0.08)",
              border: "0.5px solid rgba(0,245,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Brain size={16} style={{ color: "#00f5ff" }} />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#fff" }}>
              AI Market Signals
            </h3>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: "1px 0 0", letterSpacing: "0.04em" }}>
              Chronos-Bolt + FinBERT · cached
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/market-reports")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00f5ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          Full report <ArrowRight size={11} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "8px 12px 12px" }}>
        {isLoading ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "#00f5ff", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Loading signals…</p>
          </div>
        ) : top3.length === 0 ? (
          <div style={{ padding: "24px 8px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 8px" }}>
              No AI forecasts yet
            </p>
            <button
              onClick={() => navigate("/market-reports")}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#00f5ff",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Run your first intelligence →
            </button>
          </div>
        ) : (
          top3.map((f) => {
            const sig = SIGNAL_STYLES[f.hf_signal] || SIGNAL_STYLES.HOLD;
            const SigIcon = sig.icon;
            const change = f.hf_forecast_change_pct || 0;
            const changeColor = change > 0 ? "#22c55e" : change < 0 ? "#ef4444" : "#D4A017";
            return (
              <button
                key={f.id}
                onClick={() => handleRowClick(f)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Aircraft name */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.hf_make} {f.hf_model}
                  </p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                    {f.hf_horizon_days || 30}d forecast
                  </p>
                </div>

                {/* Change % */}
                <div style={{ textAlign: "right", marginRight: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: changeColor, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {change > 0 ? "+" : ""}{change}%
                  </p>
                  <p style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", margin: "1px 0 0" }}>
                    {f.hf_current_price ? `$${Math.round(f.hf_current_price / 1000)}k` : "—"}
                  </p>
                </div>

                {/* Signal badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: sig.bg,
                  flexShrink: 0,
                }}>
                  <SigIcon size={12} style={{ color: sig.color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: sig.color, letterSpacing: "0.05em" }}>
                    {f.hf_signal}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}