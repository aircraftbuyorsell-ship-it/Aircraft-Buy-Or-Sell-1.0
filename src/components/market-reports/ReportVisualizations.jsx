import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

// ── colour helpers ───────────────────────────────────────────────
const SENTIMENT_COLOR = { positive: "#28C76F", neutral: "#E8A83A", negative: "#FF3B30" };
const IMPACT_COLOR    = { high: "#FF3B30", medium: "#E8A83A", low: "#28C76F" };
const DIRECTION_COLOR = { positive: "#28C76F", neutral: "#94A3B8", negative: "#FF3B30" };
const DEMAND_COLOR    = { growing: "#28C76F", stable: "#E8A83A", declining: "#FF3B30" };
const PRICE_COLOR     = { up: "#28C76F", flat: "#94A3B8", down: "#FF3B30" };

// ── Shared constants ─────────────────────────────────────────────
const SENTIMENT_NUM = { positive: 3, neutral: 2, negative: 1 };
const DEMAND_NUM    = { growing: 3, stable: 2, declining: 1 };
const PRICE_NUM     = { up: 3, flat: 2, down: 1 };

// ── Context helpers ──────────────────────────────────────────────
function SentimentContext({ report }) {
  const regions = report.regional_analysis || [];
  const pos = regions.filter(r => r.sentiment === "positive").length;
  const neg = regions.filter(r => r.sentiment === "negative").length;
  const dominant = pos > neg ? "optimistic" : neg > pos ? "cautious" : "balanced";
  const strongest = regions.length > 0
    ? regions.reduce((a, b) => (SENTIMENT_NUM[a.sentiment] || 0) >= (SENTIMENT_NUM[b.sentiment] || 0) ? a : b)
    : null;
  return (
    <p className="text-[11px] text-[#4A4845] leading-relaxed mt-2">
      {regions.length > 0
        ? `Overall regional outlook is <strong>${dominant}</strong> with ${pos} positive and ${neg} negative region${pos + neg !== 1 ? "s" : ""}.`
        : `The overall sentiment across the market is <strong>${report.overall_sentiment || "neutral"}</strong>.`}
      {strongest ? ` ${strongest.region} shows the strongest signal at "${strongest.sentiment}".` : ""}
    </p>
  );
}

function MacroContext({ report }) {
  const sigs = report.macro_economic_signals || [];
  const highImpact = sigs.filter(s => s.impact === "high");
  const negativeCount = sigs.filter(s => s.direction === "negative").length;
  const positiveCount = sigs.filter(s => s.direction === "positive").length;
  return (
    <p className="text-[11px] text-[#4A4845] leading-relaxed mt-2">
      {highImpact.length > 0
        ? `${highImpact.length} factor${highImpact.length > 1 ? "s" : ""} rated <strong>high impact</strong>${highImpact[0] ? `, led by ${highImpact[0].factor}` : ""}. `
        : "Macro signals are currently moderate. "}
      {negativeCount > positiveCount
        ? `Headwinds outweigh tailwinds (${negativeCount} vs ${positiveCount} signals leaning negative).`
        : positiveCount > negativeCount
          ? `Tailwinds exceed headwinds with ${positiveCount} positive signals driving optimism.`
          : `Signals are evenly split between positive and negative — a wait-and-see environment.`}
    </p>
  );
}

function RegionalContext({ report }) {
  const regions = report.regional_analysis || [];
  const growing = regions.filter(r => r.demand_trend === "growing").length;
  const declining = regions.filter(r => r.demand_trend === "declining").length;
  const upPrice = regions.filter(r => r.price_trend === "up").length;
  return (
    <p className="text-[11px] text-[#4A4845] leading-relaxed mt-2">
      Demand is <strong>{growing > declining ? "expanding" : declining > growing ? "contracting" : "stable"}</strong> across tracked regions
      ({growing} growing, {declining} declining).
      {upPrice > regions.length / 2
        ? " Prices are trending upward in most areas, suggesting seller-favorable conditions."
        : upPrice > 0
          ? " Price movement is mixed — select regions are firming while others remain flat."
          : " Prices remain broadly flat — limited upward pressure across the board."}
    </p>
  );
}

function RegulatoryContext({ report }) {
  const sigs = report.political_regulatory_signals || [];
  const neg = sigs.filter(s => s.direction === "negative").length;
  const pos = sigs.filter(s => s.direction === "positive").length;
  const sources = [...new Set(sigs.map(s => s.source))];
  return (
    <p className="text-[11px] text-[#4A4845] leading-relaxed mt-2">
      {sources.length > 0
        ? `Regulatory signals tracked across ${sources.length} source${sources.length > 1 ? "s" : ""} (${sources.slice(0, 3).join(", ")}${sources.length > 3 ? "…" : ""}). `
        : ""}
      {neg > pos
        ? `The current regulatory climate leans <strong>restrictive</strong> with ${neg} negative signals — compliance costs and policy uncertainty remain elevated.`
        : pos > neg
          ? `A <strong>supportive</strong> regulatory environment prevails with ${pos} pro-market signals — favorable for transaction activity.`
          : `Regulatory signals are <strong>neutral</strong> — no major shifts in either direction.`}
    </p>
  );
}

function PredictionContext({ report }) {
  const preds = report.predictions || [];
  const highConf = preds.filter(p => p.confidence === "high").length;
  const validated = preds.filter(p => p.validated_at != null);
  const correct = validated.filter(p => p.prediction_correct).length;
  return (
    <p className="text-[11px] text-[#4A4845] leading-relaxed mt-2">
      {preds.length} prediction{preds.length > 1 ? "s" : ""} generated
      ({highConf} high confidence).
      {validated.length > 0
        ? ` ${validated.length} have been validated — ${correct} correct, ${validated.length - correct} missed. Accuracy: ${Math.round((correct / validated.length) * 100)}%.`
        : " These are forward-looking and will be validated against actual market data over their respective horizons."}
    </p>
  );
}

// ── Main export ──────────────────────────────────────────────────
export default function ReportVisualizations({ report }) {
  if (!report) return null;

  const hasRegions  = (report.regional_analysis || []).length >= 3;
  const hasMacro    = (report.macro_economic_signals || []).length > 0;
  const hasRegulat  = (report.political_regulatory_signals || []).length > 0;
  const hasPreds    = (report.predictions || []).length > 0;

  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#0B2D5B] mb-3">Visual Dashboard</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <CardWrapInner title="Regional Sentiment Mix">
            <SentimentDonutInner report={report} />
          </CardWrapInner>
          <SentimentContext report={report} />
        </div>
        {hasMacro && (
          <div className="rounded-2xl border border-black/8 bg-white p-5 lg:col-span-2">
            <CardWrapInner title="Macro Signal Impact">
              <MacroImpactBarInner report={report} />
            </CardWrapInner>
            <MacroContext report={report} />
          </div>
        )}
        {hasRegions && (
          <div className="rounded-2xl border border-black/8 bg-white p-5">
            <CardWrapInner title="Regional Indicators (Radar)">
              <RegionalRadarInner report={report} />
            </CardWrapInner>
            <RegionalContext report={report} />
          </div>
        )}
        {hasRegions && (
          <div className="rounded-2xl border border-black/8 bg-white p-5 lg:col-span-2">
            <CardWrapInner title="Demand & Price Trend by Region">
              <RegionalDemandBarInner report={report} />
            </CardWrapInner>
            <RegionalContext report={report} />
          </div>
        )}
        {hasRegulat && (
          <div className="rounded-2xl border border-black/8 bg-white p-5">
            <CardWrapInner title="Regulatory Signal Direction">
              <RegulatorySentimentPieInner report={report} />
            </CardWrapInner>
            <RegulatoryContext report={report} />
          </div>
        )}
        {hasPreds && (
          <div className="rounded-2xl border border-black/8 bg-white p-5 lg:col-span-2">
            <CardWrapInner title="Prediction Confidence Scores">
              <PredictionConfidenceBarInner report={report} />
            </CardWrapInner>
            <PredictionContext report={report} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inner chart wrappers (extracted from CardWrap) ────────────
function CardWrapInner({ title, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#E8A83A] mb-4">{title}</p>
      {children}
    </div>
  );
}

function SentimentDonutInner({ report }) {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  (report.regional_analysis || []).forEach(r => {
    if (counts[r.sentiment] !== undefined) counts[r.sentiment]++;
  });
  if (!counts.positive && !counts.neutral && !counts.negative) {
    counts[report.overall_sentiment || "neutral"] = 1;
  }
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: SENTIMENT_COLOR[name] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
        <Tooltip formatter={(v) => [`${v} regions`, ""]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function MacroImpactBarInner({ report }) {
  const raw = (report.macro_economic_signals || []).slice(0, 8);
  const data = raw.map(s => ({
    name: s.factor?.length > 18 ? s.factor.slice(0, 18) + "…" : s.factor,
    impact: s.impact === "high" ? 3 : s.impact === "medium" ? 2 : 1,
    fill: IMPACT_COLOR[s.impact] || "#94A3B8",
    direction: s.direction,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
        <XAxis type="number" domain={[0, 3]} hide />
        <YAxis type="category" dataKey="name" width={148} tick={{ fontSize: 11, fill: "#6B6560" }} />
        <Tooltip
          formatter={(v, _n, p) => [`${p.payload.direction} · ${v === 3 ? "high" : v === 2 ? "medium" : "low"}`, "impact"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="impact" radius={[0, 6, 6, 0]} maxBarSize={18}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RegionalRadarInner({ report }) {
  const regions = (report.regional_analysis || []).slice(0, 8);
  const data = regions.map(r => ({
    region: r.region?.length > 14 ? r.region.slice(0, 14) + "…" : r.region,
    Sentiment: SENTIMENT_NUM[r.sentiment] || 2,
    Demand: DEMAND_NUM[r.demand_trend] || 2,
    Price: PRICE_NUM[r.price_trend] || 2,
  }));
  if (data.length < 3) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="region" tick={{ fontSize: 10, fill: "#6B6560" }} />
        <PolarRadiusAxis domain={[0, 3]} tick={false} axisLine={false} />
        <Radar name="Sentiment" dataKey="Sentiment" stroke="#28C76F" fill="#28C76F" fillOpacity={0.18} />
        <Radar name="Demand"    dataKey="Demand"    stroke="#E8A83A" fill="#E8A83A" fillOpacity={0.18} />
        <Radar name="Price"     dataKey="Price"     stroke="#0B2D5B" fill="#0B2D5B" fillOpacity={0.12} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [v === 3 ? "High/Positive/Up" : v === 2 ? "Neutral/Stable/Flat" : "Low/Negative/Down", ""]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function RegionalDemandBarInner({ report }) {
  const regions = (report.regional_analysis || []).slice(0, 10);
  const data = regions.map(r => ({
    name: r.region?.split(" ")[0] || r.region,
    demand: DEMAND_NUM[r.demand_trend] || 2,
    price:  PRICE_NUM[r.price_trend]  || 2,
    demandFill: DEMAND_COLOR[r.demand_trend] || "#94A3B8",
    priceFill:  PRICE_COLOR[r.price_trend]  || "#94A3B8",
  }));
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 0, right: 10, bottom: 40, left: 0 }} barCategoryGap="30%">
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B6560" }} angle={-35} textAnchor="end" interval={0} />
        <YAxis domain={[0, 3]} hide />
        <Tooltip
          formatter={(v, name) => [v === 3 ? "Growing/Up" : v === 2 ? "Stable/Flat" : "Declining/Down", name]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="demand" name="Demand" radius={[4, 4, 0, 0]} maxBarSize={14}>
          {data.map((d, i) => <Cell key={i} fill={d.demandFill} />)}
        </Bar>
        <Bar dataKey="price"  name="Price"  radius={[4, 4, 0, 0]} maxBarSize={14}>
          {data.map((d, i) => <Cell key={i} fill={d.priceFill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RegulatorySentimentPieInner({ report }) {
  const sigs = report.political_regulatory_signals || [];
  const counts = { positive: 0, neutral: 0, negative: 0 };
  sigs.forEach(s => { if (counts[s.direction] !== undefined) counts[s.direction]++; });
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: DIRECTION_COLOR[name] }));
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={72} paddingAngle={4}
          label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PredictionConfidenceBarInner({ report }) {
  const preds = (report.predictions || []).slice(0, 8);
  if (!preds.length) return null;
  const CONF_NUM = { high: 3, medium: 2, low: 1 };
  const CONF_COLOR_MAP = { high: "#28C76F", medium: "#E8A83A", low: "#94A3B8" };
  const data = preds.map((p, i) => ({
    name: `P${i + 1}`,
    confidence: CONF_NUM[p.confidence] || 1,
    fill: CONF_COLOR_MAP[p.confidence] || "#94A3B8",
    label: p.statement?.slice(0, 60),
  }));
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6560" }} />
          <YAxis domain={[0, 3]} hide />
          <Tooltip
            formatter={(v, _n, p) => [p.payload.label, v === 3 ? "High" : v === 2 ? "Medium" : "Low"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, maxWidth: 300 }}
          />
          <Bar dataKey="confidence" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        {[["High", "#28C76F"], ["Medium", "#E8A83A"], ["Low", "#94A3B8"]].map(([l, c]) => (
          <div key={l} className="flex items-center gap-1.5 text-[10px] text-[#6B6560] font-bold uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
          </div>
        ))}
      </div>
    </>
  );
}