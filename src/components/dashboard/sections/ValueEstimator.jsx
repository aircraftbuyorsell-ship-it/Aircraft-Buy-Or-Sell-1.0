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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl p-6 bg-card border border-border flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.22)" }}>
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
        <Link to="/valuation-studio"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] text-sm font-bold no-underline hover:opacity-90"
          style={{ background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.30)", color: "#D4A017" }}>
          <TrendingUp size={16} /> Estimate Aircraft Value <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}