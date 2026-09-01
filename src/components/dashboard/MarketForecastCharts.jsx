import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

const TREND_COLORS = {
  growing: "#0F7A56",
  stable: "#185FA5",
  declining: "#C0392B",
};

const TREND_ICONS = {
  shortening: TrendingDown,
  stable: Minus,
  lengthening: TrendingUp,
};

const SENTIMENT_CONFIG = {
  positive: { label: "Pozitivní", color: "#0F7A56", bg: "rgba(15,122,86,0.08)", border: "rgba(15,122,86,0.2)" },
  neutral:  { label: "Neutrální", color: "#185FA5", bg: "rgba(24,95,165,0.08)", border: "rgba(24,95,165,0.2)" },
  negative: { label: "Negativní", color: "#C0392B", bg: "rgba(192,57,43,0.08)", border: "rgba(192,57,43,0.2)" },
};

function CustomPriceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-black/[0.1] rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-black text-[#1A1814] mb-0.5">{label}</p>
      <p className={`font-bold ${val >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
        {val >= 0 ? "+" : ""}{val}% za 6–12 měs.
      </p>
    </div>
  );
}

function CustomTOMTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const days = payload[0].value;
  const trend = payload[0].payload.trend;
  const trendColor = trend === "shortening" ? "#0F7A56" : trend === "lengthening" ? "#C0392B" : "#185FA5";
  return (
    <div className="bg-white border border-black/[0.1] rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-black text-[#1A1814] mb-0.5">{label}</p>
      <p className="text-[#6B6560]">Průměr: <span className="font-bold text-[#1A1814]">{days} dní</span></p>
      <p style={{ color: trendColor }} className="font-semibold capitalize">{trend}</p>
    </div>
  );
}

export default function MarketForecastCharts() {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["market-forecasts"],
    queryFn: () => base44.entities.MarketForecast.list("-created_date", 10),
  });

  const latest = forecasts[0] || null;

  if (isLoading) {
    return (
      <div className="bg-white border border-black/[0.07] rounded-2xl p-6 space-y-4">
        <div className="h-5 w-48 bg-black/5 rounded animate-pulse" />
        <div className="h-48 bg-black/5 rounded-xl animate-pulse" />
        <div className="h-48 bg-black/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="bg-white border border-black/[0.07] rounded-2xl p-8 text-center">
        <RefreshCw className="w-8 h-8 text-[#AAA49C] mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold text-[#6B6560]">Žádný Market Forecast</p>
        <p className="text-[11px] text-[#AAA49C] mt-1">Forecast se generuje každé pondělí automaticky.</p>
      </div>
    );
  }

  const sentiment = SENTIMENT_CONFIG[latest.overall_sentiment] || SENTIMENT_CONFIG.neutral;

  // Build price chart data
  const priceData = (latest.price_changes_forecast || []).map(p => ({
    category: p.category,
    change: p.percentage_change,
    timeframe: p.timeframe,
  }));

  // Build TOM chart data
  const tomData = (latest.time_on_market_forecast || []).map(t => ({
    category: t.category,
    days: t.average_days,
    trend: t.trend,
  }));

  // All available categories (union)
  const allCategories = [...new Set([
    ...priceData.map(d => d.category),
    ...tomData.map(d => d.category),
  ])];

  const activeCategories = selectedCategories.length > 0 ? selectedCategories : allCategories;

  const filteredPrice = priceData.filter(d => activeCategories.includes(d.category));
  const filteredTOM = tomData.filter(d => activeCategories.includes(d.category));

  const toggleCat = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/[0.06] flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] font-black text-[#D4A017] mb-0.5">Market Forecast</p>
          <h3 className="text-base font-black text-[#1A1814]">Tržní předpověď letadel</h3>
          <p className="text-[11px] text-[#AAA49C] mt-0.5">
            Generováno: {latest.forecast_date || new Date(latest.created_date).toLocaleDateString("cs-CZ")}
          </p>
        </div>

        {/* Sentiment badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black shrink-0"
          style={{ backgroundColor: sentiment.bg, borderColor: sentiment.border, color: sentiment.color }}
        >
          {latest.overall_sentiment === "positive" ? <TrendingUp className="w-4 h-4" /> :
           latest.overall_sentiment === "negative" ? <TrendingDown className="w-4 h-4" /> :
           <Minus className="w-4 h-4" />}
          {sentiment.label} sentiment
        </div>
      </div>

      {/* Category filters */}
      {allCategories.length > 0 && (
        <div className="px-6 py-3 border-b border-black/[0.05] flex flex-wrap gap-2">
          {allCategories.map(cat => {
            const active = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full border transition-all ${
                  active
                    ? "bg-[#0B2D5B] text-white border-[#0B2D5B]"
                    : "bg-white text-[#AAA49C] border-black/10 hover:border-[#D4A017]"
                }`}
              >
                {cat}
              </button>
            );
          })}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="text-[10px] text-[#C0392B] font-bold hover:underline px-2"
            >
              Zrušit filtr
            </button>
          )}
        </div>
      )}

      <div className="p-6 space-y-8">

        {/* ── Price Change Chart ── */}
        {filteredPrice.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#6B6560] mb-4">
              Očekávaná změna ceny (6–12 měsíců)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredPrice} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#6B6560" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 10, fill: "#AAA49C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.12)" strokeWidth={1.5} />
                <Tooltip content={<CustomPriceTooltip />} />
                <Bar dataKey="change" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {filteredPrice.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.change >= 0 ? "#0F7A56" : "#C0392B"}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Time on Market Chart ── */}
        {filteredTOM.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#6B6560] mb-4">
              Predikovaný čas prodeje (dny)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredTOM} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#6B6560" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={v => `${v}d`}
                  tick={{ fontSize: 10, fill: "#AAA49C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTOMTooltip />} />
                <Bar dataKey="days" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {filteredTOM.map((entry, i) => {
                    const col = entry.trend === "shortening" ? "#0F7A56"
                      : entry.trend === "lengthening" ? "#C0392B" : "#185FA5";
                    return <Cell key={i} fill={col} fillOpacity={0.8} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 justify-center">
              {[
                { trend: "shortening", label: "Zkracuje se", color: "#0F7A56" },
                { trend: "stable",     label: "Stabilní",    color: "#185FA5" },
                { trend: "lengthening",label: "Prodlužuje se", color: "#C0392B" },
              ].map(({ trend, label, color }) => {
                const Icon = TREND_ICONS[trend];
                return (
                  <div key={trend} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    <Icon className="w-3 h-3" style={{ color }} />
                    <span className="text-[10px] text-[#6B6560] font-semibold">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Key Factors ── */}
        {latest.key_factors?.length > 0 && (
          <div className="border-t border-black/[0.05] pt-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#6B6560] mb-3">Klíčové faktory</p>
            <div className="flex flex-wrap gap-2">
              {latest.key_factors.map((f, i) => (
                <span key={i} className="text-[10px] bg-[#F7F4EF] border border-black/[0.07] text-[#4A4845] font-semibold px-2.5 py-1 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Opportunities & Risks ── */}
        {(latest.opportunities?.length > 0 || latest.risks?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-black/[0.05] pt-5">
            {latest.opportunities?.length > 0 && (
              <div className="bg-[rgba(15,122,86,0.05)] border border-[rgba(15,122,86,0.15)] rounded-xl p-4">
                <p className="text-[9px] uppercase tracking-wider font-black text-[#0F7A56] mb-2">Příležitosti</p>
                <ul className="space-y-1.5">
                  {latest.opportunities.map((o, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-[#4A4845]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A56] mt-1.5 shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {latest.risks?.length > 0 && (
              <div className="bg-[rgba(192,57,43,0.05)] border border-[rgba(192,57,43,0.15)] rounded-xl p-4">
                <p className="text-[9px] uppercase tracking-wider font-black text-[#C0392B] mb-2">Rizika</p>
                <ul className="space-y-1.5">
                  {latest.risks.map((r, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-[#4A4845]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] mt-1.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}