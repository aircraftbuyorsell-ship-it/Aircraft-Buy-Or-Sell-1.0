import CoreCard from "@/components/core/CoreCard";
import SectionShell from "./SectionShell";

const STATS = [
  { value: "11.5M+", label: "FB Group Views", sub: "Monthly impressions" },
  { value: "280K+", label: "FB Members", sub: "Community members" },
  { value: "4,200+", label: "Posts per Year", sub: "Community engagement" },
  { value: "1.2M+", label: "Web Visits", sub: "Monthly unique visitors" },
  { value: "303,000", label: "N-Reg Records", sub: "FAA registry indexed" },
  { value: "12,000", label: "Dealers", sub: "Verified professionals" },
  { value: "8,500", label: "Engine Refs", sub: "Engine models tracked" },
  { value: "15,000", label: "Airframe Refs", sub: "Type references" },
  { value: "2.4M+", label: "Traffic Records", sub: "Historical live traffic" },
];

export default function PlatformStats() {
  return (
    <SectionShell eyebrow="Platform Scale" title="The Numbers Behind the Network" padding="60px 0">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {STATS.map((s) => (
          <CoreCard key={s.label} className="p-5">
            <div
              style={{
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "#D4A017",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                marginTop: 8,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              {s.sub}
            </div>
          </CoreCard>
        ))}
      </div>
    </SectionShell>
  );
}