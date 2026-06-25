import { Link } from "react-router-dom";
import { Calculator, BarChart2, FileText, Shield, ArrowRight } from "lucide-react";
import CoreCard from "@/components/core/CoreCard";
import SectionShell from "./SectionShell";

const ITEMS = [
  {
    label: "OPEX Analysis",
    desc: "Operating cost breakdown per flight hour. Fuel, maintenance, insurance, hangar.",
    icon: Calculator,
  },
  {
    label: "CAPEX Planning",
    desc: "Capital expenditure model for acquisition, upgrades, and major overhauls.",
    icon: BarChart2,
  },
  {
    label: "Leasing Options",
    desc: "Residual value curves and lease rate factors by aircraft type.",
    icon: FileText,
  },
  {
    label: "Insurance Quotes",
    desc: "Risk-adjusted premium estimates based on ATI score and usage profile.",
    icon: Shield,
  },
];

export default function AircraftFinance() {
  return (
    <SectionShell eyebrow="Aircraft Finance" title="Full Financial Intelligence">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {ITEMS.map(({ label, desc, icon: Icon }) => (
          <CoreCard key={label} className="p-5">
            <Icon size={18} style={{ color: "#D4A017", marginBottom: 12 }} />
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                marginBottom: 6,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.5,
              }}
            >
              {desc}
            </div>
          </CoreCard>
        ))}
      </div>
      <Link
        to="/opex-calculator"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#D4A017",
          color: "#0B1220",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Open OPEX Calculator <ArrowRight size={16} />
      </Link>
    </SectionShell>
  );
}