import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Zap, TrendingUp, DollarSign, BarChart2, Plane } from "lucide-react";

const fmtMoney = (n) => {
  if (!n || n === 0) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
};

const atiColor = (score) => {
  if (score >= 100) return "#5dcaa5";
  if (score >= 80) return "#f5c242";
  if (score >= 60) return "#f97316";
  return "#e24b4a";
};

const dealColor = (label) => {
  if (label === "hot deal") return "#5dcaa5";
  if (label === "good deal") return "#f5c242";
  if (label === "fair") return "#4e8ef7";
  if (label === "overpriced") return "#e24b4a";
  return "rgba(255,255,255,0.4)";
};

export default function ATIOverviewCards() {
  const [selectedMake, setSelectedMake] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings-ati-overview"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-created_date",
        200
      ),
    staleTime: 30000,
  });

  // Group by make
  const byMake = useMemo(() => {
    const map = {};
    for (const l of listings) {
      const make = l.make || "Unknown";
      if (!map[make]) map[make] = [];
      map[make].push(l);
    }
    return map;
  }, [listings]);

  const makes = Object.keys(byMake).sort();
  const activeMake = selectedMake || makes[0] || null;
  const activeListings = activeMake ? byMake[activeMake] || [] : [];

  // Aggregated market data — recalculates when activeMake changes
  const stats = useMemo(() => {
    if (activeListings.length === 0) return null;

    const avg = (arr, field) =>
      arr.length > 0 ? arr.reduce((s, l) => s + (l[field] || 0), 0) / arr.length : 0;

    const withAti = activeListings.filter((l) => l.ati_score != null);
    const withOmvm = activeListings.filter((l) => l.omvm_value != null);
    const withPrice = activeListings.filter((l) => l.asking_price != null);
    const withDiscount = activeListings.filter((l) => l.discount_pct != null);

    // Per-model breakdown
    const modelMap = {};
    for (const l of activeListings) {
      const model = l.model || "Unknown";
      if (!modelMap[model]) modelMap[model] = [];
      modelMap[model].push(l);
    }
    const models = Object.entries(modelMap)
      .map(([model, items]) => {
        const mAti = items.filter((l) => l.ati_score != null);
        const mOmvm = items.filter((l) => l.omvm_value != null);
        const mPrice = items.filter((l) => l.asking_price != null);
        return {
          model,
          count: items.length,
          avgAti: Math.round(avg(mAti, "ati_score")),
          avgOmvm: Math.round(avg(mOmvm, "omvm_value")),
          avgPrice: Math.round(avg(mPrice, "asking_price")),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      count: activeListings.length,
      avgAti: Math.round(avg(withAti, "ati_score")),
      avgOmvm: Math.round(avg(withOmvm, "omvm_value")),
      avgPrice: Math.round(avg(withPrice, "asking_price")),
      avgDiscount: Math.round(avg(withDiscount, "discount_pct") * 10) / 10,
      models,
    };
  }, [activeListings]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 40, fontSize: 13 }}>
        Loading ATI overview...
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: 40 }}>
        <Plane size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px", display: "block" }} />
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No active listings to analyze.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Make selector ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {makes.map((make) => {
          const isActive = make === activeMake;
          const count = byMake[make].length;
          return (
            <button
              key={make}
              onClick={() => setSelectedMake(make)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: isActive ? "rgba(245,194,66,0.12)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${isActive ? "rgba(245,194,66,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 99,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#f5c242" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {make}
              <span style={{ fontSize: 10, opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {stats && (
        <>
          {/* ── Overview KPI cards ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {/* ATI Score */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Zap size={14} style={{ color: atiColor(stats.avgAti) }} />
                <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Avg ATI Score
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em", color: atiColor(stats.avgAti), lineHeight: 1 }}>
                {stats.avgAti || "—"}
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>/ 120</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                {stats.count} active {stats.count === 1 ? "listing" : "listings"}
              </div>
            </div>

            {/* OMVM Value */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <DollarSign size={14} style={{ color: "#f5c242" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Avg OMVM Value
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em", color: "#f5c242", lineHeight: 1 }}>
                {fmtMoney(stats.avgOmvm)}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                Off-Market Value Model
              </div>
            </div>

            {/* Asking Price */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <TrendingUp size={14} style={{ color: "#4e8ef7" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Avg Asking Price
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em", color: "#4e8ef7", lineHeight: 1 }}>
                {fmtMoney(stats.avgPrice)}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                Current market asking
              </div>
            </div>

            {/* Discount vs OMVM */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <BarChart2 size={14} style={{ color: stats.avgDiscount > 0 ? "#5dcaa5" : "#e24b4a" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Avg Discount
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em", color: stats.avgDiscount > 0 ? "#5dcaa5" : "#e24b4a", lineHeight: 1 }}>
                {stats.avgDiscount > 0 ? "-" : "+"}{Math.abs(stats.avgDiscount)}%
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                vs OMVM estimate
              </div>
            </div>
          </div>

          {/* ── Per-model breakdown ── */}
          {stats.models.length > 0 && (
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {activeMake} — Model Breakdown
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                      {["Model", "Listings", "Avg ATI", "Avg OMVM", "Avg Price", "Deal"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 20px",
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.3)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.models.map((m) => {
                      const dealLabel =
                        m.avgOmvm > 0 && m.avgPrice > 0
                          ? m.avgPrice < m.avgOmvm * 0.92
                            ? "hot deal"
                            : m.avgPrice < m.avgOmvm
                            ? "good deal"
                            : m.avgPrice > m.avgOmvm * 1.08
                            ? "overpriced"
                            : "fair"
                          : "—";
                      return (
                        <tr
                          key={m.model}
                          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}
                        >
                          <td style={{ padding: "10px 20px", color: "rgba(255,255,255,0.85)", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {m.model}
                          </td>
                          <td style={{ padding: "10px 20px", color: "rgba(255,255,255,0.5)" }}>{m.count}</td>
                          <td style={{ padding: "10px 20px" }}>
                            <span style={{ color: atiColor(m.avgAti), fontWeight: 600 }}>{m.avgAti || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 20px", color: "#f5c242", fontWeight: 600 }}>{fmtMoney(m.avgOmvm)}</td>
                          <td style={{ padding: "10px 20px", color: "rgba(255,255,255,0.7)" }}>{fmtMoney(m.avgPrice)}</td>
                          <td style={{ padding: "10px 20px" }}>
                            <span
                              style={{
                                fontSize: 9,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: `${dealColor(dealLabel)}14`,
                                color: dealColor(dealLabel),
                                border: `0.5px solid ${dealColor(dealLabel)}33`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {dealLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}