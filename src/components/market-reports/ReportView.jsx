import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Globe, MapPin } from "lucide-react";
import { format } from "date-fns";

const SENTIMENT_STYLES = {
  positive: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Positive" },
  neutral:  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Neutral" },
  negative: { bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200",   label: "Negative" },
};

const TREND_ICON = { up: TrendingUp, flat: Minus, down: TrendingDown };
const TREND_COLOR = { up: "text-green-600", flat: "text-[#6B6560]", down: "text-red-600" };

function Section({ icon: Icon, title, items, accent }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[#1A1814] font-black text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[#4A4845] leading-relaxed flex gap-2">
            <span className="text-[#AAA49C] mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportView({ report }) {
  if (!report) return null;
  const sent = SENTIMENT_STYLES[report.overall_sentiment] || SENTIMENT_STYLES.neutral;
  const generatedAt = report.generated_at || report.created_date;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-black/8 bg-gradient-to-br from-white to-[#F7F4EF] p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-[#E8A83A] text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
              {report.scope} report
            </p>
            <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">{report.title}</h1>
            {generatedAt && (
              <p className="text-xs text-[#6B6560] mt-2">
                Generated {format(new Date(generatedAt), "PPp")}
                {report.token_cost ? ` · ${report.token_cost} tokens` : ""}
              </p>
            )}
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${sent.bg} ${sent.text} ${sent.border} border`}>
            {sent.label}
          </span>
        </div>
        {report.executive_summary && (
          <p className="text-[#4A4845] leading-relaxed text-sm mt-2">{report.executive_summary}</p>
        )}
      </div>

      {/* Key findings */}
      {report.key_findings?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <h3 className="text-[#1A1814] font-black text-sm uppercase tracking-wide mb-3">Key Findings</h3>
          <ul className="space-y-2">
            {report.key_findings.map((f, i) => (
              <li key={i} className="flex gap-3 text-sm text-[#1A1814]">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0B2D5B] text-white text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-col: global / local signals */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section icon={Globe} title="Global Signals" items={report.global_signals} accent="bg-[#0B2D5B]/10 text-[#0B2D5B]" />
        <Section icon={MapPin} title="Local Signals" items={report.local_signals} accent="bg-[#E8A83A]/15 text-[#A67C00]" />
      </div>

      {/* Opportunities / risks */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section icon={Lightbulb} title="Opportunities" items={report.opportunities} accent="bg-green-50 text-green-700" />
        <Section icon={AlertTriangle} title="Risks" items={report.risks} accent="bg-red-50 text-red-700" />
      </div>

      {/* Category breakdown */}
      {report.category_breakdown?.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <h3 className="text-[#1A1814] font-black text-sm uppercase tracking-wide mb-3">Category Breakdown</h3>
          <div className="divide-y divide-black/5">
            {report.category_breakdown.map((row, i) => {
              const Icon = TREND_ICON[row.trend] || Minus;
              const color = TREND_COLOR[row.trend] || "text-[#6B6560]";
              return (
                <div key={i} className="py-3 flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#1A1814]">{row.category}</p>
                    <p className="text-xs text-[#6B6560] mt-0.5 leading-relaxed">{row.commentary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}