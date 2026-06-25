import { Shield, BarChart2, Globe, Zap } from "lucide-react";
import SectionShell from "./SectionShell";

const ITEMS = [
  {
    title: "ATI™ Score Standard",
    desc: "First objective 8-dimension scoring methodology for aircraft transactions. Not opinion — verified data.",
    icon: Shield,
  },
  {
    title: "OMVM Pricing",
    desc: "Open Market Value Model gives every aircraft an algorithmic price baseline. No more guessing.",
    icon: BarChart2,
  },
  {
    title: "ADS-B Surveillance",
    desc: "Real-time tracking for every N-registered aircraft. Know where it is, how much it flies.",
    icon: Globe,
  },
  {
    title: "Deal Radar",
    desc: "Automatic detection of underpriced aircraft in the market. First mover advantage.",
    icon: Zap,
  },
];

export default function WhyAbos() {
  return (
    <SectionShell eyebrow="Why ABOS" title="The Aviation Intelligence Standard">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
        }}
      >
        {ITEMS.map(({ title, desc, icon: Icon }) => (
          <div key={title} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(212,160,23,0.08)",
                border: "0.5px solid rgba(212,160,23,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Icon size={20} style={{ color: "#D4A017" }} />
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                marginBottom: 8,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.6,
              }}
            >
              {desc}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}