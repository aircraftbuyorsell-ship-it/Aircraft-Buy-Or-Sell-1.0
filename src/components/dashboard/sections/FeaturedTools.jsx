import { Link } from "react-router-dom";
import { Zap, Globe, Database, Plane, TrendingUp, CheckCircle, GitCompare, Sparkles } from "lucide-react";
import CoreCard from "@/components/core/CoreCard";
import SectionShell from "./SectionShell";

const TOOLS = [
  {
    label: "ATI Score Engine",
    desc: "8-dimension aircraft intelligence score. Objective, deterministic, verifiable.",
    to: "/ati-center",
    color: "#D4A017",
    Icon: Zap,
  },
  {
    label: "Aircraft Marketplace",
    desc: "Browse ATI-scored listings from verified sellers. Real data, no guesswork.",
    to: "/listings",
    color: "#5dcaa5",
    Icon: Globe,
  },
  {
    label: "N-Number Lookup",
    desc: "FAA registry deep-dive. Owner history, registration status, aircraft specs.",
    to: "/listings",
    color: "#2563EB",
    Icon: Database,
  },
  {
    label: "Traffic Map",
    desc: "Live ADS-B traffic. Track any aircraft in real time on a 3D globe.",
    to: "/traffic",
    color: "#5dcaa5",
    Icon: Plane,
  },
  {
    label: "Market Analytics",
    desc: "Price trends, demand signals, and market comparables by aircraft type.",
    to: "/analytics",
    color: "#D4A017",
    Icon: TrendingUp,
  },
  {
    label: "Pre-Buy Inspection",
    desc: "AI-assisted inspection coordination with verified mechanics.",
    to: "/pre-buy-inspection",
    color: "#2563EB",
    Icon: CheckCircle,
  },
  {
    label: "Upgrade Cost Comparison",
    desc: "Compare avionics, exterior, and interior refurbishment costs side by side for project planning.",
    to: "/upgrade-comparison",
    color: "#4e8ef7",
    Icon: GitCompare,
  },
  {
    label: "Aircraft Detailing",
    desc: "Exterior wash, wax, ceramic coating, and interior detailing costs by aircraft model.",
    to: "/aircraft-detailing-calculator",
    color: "#4ec8ff",
    Icon: Sparkles,
  },
];

export default function FeaturedTools() {
  return (
    <SectionShell eyebrow="Platform Tools" title="Built for Aviation Professionals">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {TOOLS.map(({ label, desc, to, color, Icon }) => (
          <Link
            key={label}
            to={to}
            style={{ textDecoration: "none", display: "block", height: "100%" }}
          >
            <CoreCard className="p-5 h-full">
              <Icon size={18} style={{ color, marginBottom: 12 }} />
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
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}