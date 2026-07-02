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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: 24,
              display: "flex", gap: 14, alignItems: "flex-start",
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(212,160,23,0.10)",
              border: "1px solid rgba(212,160,23,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={16} style={{ color: "#D4A017" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <Link to="/valuation"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(212,160,23,0.10)",
            border: "1px solid rgba(212,160,23,0.30)",
            color: "#D4A017",
            padding: "14px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
          <TrendingUp size={16} /> Estimate Aircraft Value <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}