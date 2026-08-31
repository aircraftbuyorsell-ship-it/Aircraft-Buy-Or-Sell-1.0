import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Globe, BarChart2, ShieldAlert, Target, MapPin, CheckCircle2, HelpCircle } from "lucide-react";
import { format } from "date-fns";

const SENTIMENT_STYLES = {
  positive: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  label: "Positive" },
  neutral:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  label: "Neutral"  },
  negative: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    label: "Negative" },
};
const IMPACT_DOT = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-green-400" };
const DIRECTION_COLOR = { positive: "text-green-700", neutral: "text-[#6B6560]", negative: "text-red-600" };
const TREND_ICON = { up: TrendingUp, flat: Minus, down: TrendingDown };
const TREND_COLOR = { up: "text-green-600 bg-green-50", flat: "text-[#6B6560] bg-[#F7F4EF]", down: "text-red-600 bg-red-50" };
const DEMAND_COLOR = { growing: "text-green-700", stable: "text-[#6B6560]", declining: "text-red-600" };
const CONF_COLOR = { high: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", low: "bg-gray-100 text-gray-600" };

function SectionHeader({ icon: Icon, title, accent, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-[#1A1814] font-black text-sm uppercase tracking-wide">{title}</h3>
      {count > 0 && <span className="ml-auto text-[10px] font-black text-[#AAA49C]">{count} items</span>}
    </div>
  );
}

function BulletList({ items, accent }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-[#4A4845] leading-relaxed flex gap-2">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent || "bg-[#AAA49C]"}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportView({ report }) {
  if (!report) return null;
  const sent = SENTIMENT_STYLES[report.overall_sentiment] || SENTIMENT_STYLES.neutral;
  const generatedAt = report.generated_at || report.created_date;
  const filters = report.personalization_filters;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="rounded-2xl border border-black/8 bg-gradient-to-br from-white to-[#F7F4EF] p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-[#E8A83A] text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{report.scope} report</p>
            <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">{report.title}</h1>
            <p className="text-xs text-[#6B6560] mt-1.5">
              {generatedAt && format(new Date(generatedAt), "PPp")}
              {report.token_cost ? ` · ${report.token_cost} tokens` : ""}
              {filters?.aircraft_category ? ` · ${filters.aircraft_category}` : ""}
              {filters?.regions?.length ? ` · ${filters.regions.join(", ")}` : ""}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${sent.bg} ${sent.text} ${sent.border} border`}>
            {sent.label}
          </span>
        </div>
        {report.executive_summary && (
          <p className="text-[#4A4845] leading-relaxed text-sm">{report.executive_summary}</p>
        )}
      </div>

      {/* Key Findings */}
      {report.key_findings?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <SectionHeader icon={BarChart2} title="Key Findings" accent="bg-[#0B2D5B]/10 text-[#0B2D5B]" />
          <ul className="space-y-2">
            {report.key_findings.map((f, i) => (
              <li key={i} className="flex gap-3 text-sm text-[#1A1814]">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0B2D5B] text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Macro-economic Signals */}
      {report.macro_economic_signals?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <SectionHeader icon={Globe} title="Macroeconomic Signals" accent="bg-blue-50 text-blue-700" count={report.macro_economic_signals.length} />
          <div className="divide-y divide-black/5">
            {report.macro_economic_signals.map((sig, i) => (
              <div key={i} className="py-3 flex items-start gap-3">
                <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${IMPACT_DOT[sig.impact] || "bg-gray-300"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-[#1A1814]">{sig.factor}</p>
                    <span className={`text-[10px] font-black uppercase ${DIRECTION_COLOR[sig.direction] || ""}`}>{sig.direction}</span>
                    <span className="text-[10px] font-black uppercase text-[#AAA49C]">{sig.impact} impact</span>
                  </div>
                  <p className="text-xs text-[#6B6560] mt-0.5 leading-relaxed">{sig.commentary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Political & Regulatory Signals */}
      {report.political_regulatory_signals?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <SectionHeader icon={ShieldAlert} title="Political & Regulatory Signals" accent="bg-purple-50 text-purple-700" count={report.political_regulatory_signals.length} />
          <div className="space-y-2">
            {report.political_regulatory_signals.map((sig, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F4EF]">
                <span className={`mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                  sig.direction === "positive" ? "border-green-300 bg-green-50 text-green-700" :
                  sig.direction === "negative" ? "border-red-300 bg-red-50 text-red-700" :
                  "border-gray-200 bg-white text-[#6B6560]"
                }`}>{sig.source}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1814] leading-relaxed">{sig.signal}</p>
                  <p className="text-[10px] text-[#AAA49C] mt-0.5 uppercase tracking-wide">{sig.impact} impact</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional Analysis */}
      {report.regional_analysis?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <SectionHeader icon={MapPin} title="Regional Analysis" accent="bg-[#E8A83A]/15 text-[#A67C00]" count={report.regional_analysis.length} />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {report.regional_analysis.map((r, i) => {
              const TrendIcon = TREND_ICON[r.price_trend] || Minus;
              const regionSent = SENTIMENT_STYLES[r.sentiment] || SENTIMENT_STYLES.neutral;
              return (
                <div key={i} className={`rounded-xl border p-4 ${regionSent.border} ${regionSent.bg}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className={`font-black text-sm ${regionSent.text}`}>{r.region}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${TREND_COLOR[r.price_trend]}`}>
                        <TrendIcon className="w-2.5 h-2.5 inline mr-0.5" />{r.price_trend}
                      </span>
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold uppercase mb-2 ${DEMAND_COLOR[r.demand_trend]}`}>
                    Demand: {r.demand_trend}
                  </p>
                  {r.key_drivers?.length > 0 && (
                    <ul className="space-y-1">
                      {r.key_drivers.slice(0, 2).map((d, j) => (
                        <li key={j} className="text-[11px] text-[#4A4845] flex gap-1.5">
                          <span className="text-[#AAA49C] mt-0.5">↗</span>{d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opportunities / Risks */}
      <div className="grid md:grid-cols-2 gap-4">
        {report.opportunities?.length > 0 && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <SectionHeader icon={Lightbulb} title="Opportunities" accent="bg-green-100 text-green-700" />
            <BulletList items={report.opportunities} accent="bg-green-500" />
          </div>
        )}
        {report.risks?.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <SectionHeader icon={AlertTriangle} title="Risks" accent="bg-red-100 text-red-700" />
            <BulletList items={report.risks} accent="bg-red-500" />
          </div>
        )}
      </div>

      {/* Predictions */}
      {report.predictions?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <SectionHeader icon={Target} title="Predictions & Validation Targets" accent="bg-indigo-50 text-indigo-700" count={report.predictions.length} />
          <div className="space-y-3">
            {report.predictions.map((p, i) => {
              const isValidated = p.validated_at != null;
              const isCorrect = p.prediction_correct;
              return (
                <div key={i} className={`rounded-xl border p-4 ${isValidated ? (isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50") : "border-black/8 bg-[#F7F4EF]"}`}>
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    {isValidated ? (
                      isCorrect
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-[#AAA49C] flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-bold text-[#1A1814] flex-1 leading-relaxed">{p.statement}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                    <span className={`px-2 py-0.5 rounded-full ${CONF_COLOR[p.confidence]}`}>{p.confidence} confidence</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#0B2D5B]/10 text-[#0B2D5B]">{p.horizon_days}d horizon</span>
                    <span className={`px-2 py-0.5 rounded-full ${TREND_COLOR[p.expected_direction]}`}>
                      expected: {p.expected_direction}{p.expected_change_pct != null ? ` (${p.expected_change_pct > 0 ? "+" : ""}${p.expected_change_pct}%)` : ""}
                    </span>
                    {isValidated && p.actual_direction && (
                      <span className={`px-2 py-0.5 rounded-full ${TREND_COLOR[p.actual_direction]}`}>
                        actual: {p.actual_direction}{p.actual_change_pct != null ? ` (${p.actual_change_pct > 0 ? "+" : ""}${p.actual_change_pct}%)` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#AAA49C] mt-1.5">Metric: {p.metric}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}