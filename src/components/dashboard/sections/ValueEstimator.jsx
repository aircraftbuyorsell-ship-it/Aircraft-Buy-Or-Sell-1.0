import { Link } from "react-router-dom";
import { TrendingUp, ArrowRight, BarChart3, Target, Database } from "lucide-react";
import SectionShell from "./SectionShell";

const FEATURES = [
  { icon: BarChart3, title: "OMVM Pricing", desc: "Open Market Value Model — algorithmic price baseline using live market comparables." },
  { icon: Target, title: "Deal Radar", desc: "Automatic detection of underpriced aircraft. First-mover advantage on every deal." },
  { icon: Database, title: "Market Comparables", desc: "Real-time listing data across top manufacturers with price trend analysis." },
];

export default function ValueEstimator() {
  return (
    <SectionShell
      eyebrow="Aircraft Value Estimator"
      title="Know What It's Worth"
      subtitle="Get an instant, data-driven valuation for any aircraft. Our OMVM model analyzes live market data, comparable sales, and depreciation curves."
    >
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card p-6 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border border-gold-official/25 bg-gold-bg">
              <Icon size={16} className="text-gold-official" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground mb-1.5">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link
          to="/valuation"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] text-sm font-bold border border-gold-official/30 bg-gold-bg text-gold-official hover:opacity-80 transition-opacity"
        >
          <TrendingUp size={16} /> Estimate Aircraft Value <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}