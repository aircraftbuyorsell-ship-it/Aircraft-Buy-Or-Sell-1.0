import { Link } from "react-router-dom";
import { Cpu, Users, ArrowRight } from "lucide-react";
import CoreCard from "@/components/core/CoreCard";
import SectionShell from "./SectionShell";

export default function EngineDealer() {
  return (
    <SectionShell>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 32,
        }}
      >
        <CoreCard className="p-8">
          <Cpu size={24} style={{ color: "#D4A017", marginBottom: 16 }} />
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#D4A017",
              marginBottom: 8,
            }}
          >
            Engine Database
          </p>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 12,
            }}
          >
            Engine Intelligence
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            SMOH tracking, TBO benchmarks, overhaul history and engine-specific
            depreciation curves. Correlated with ATI scores across thousands of
            aircraft.
          </p>
          <div
            style={{
              fontSize: 12,
              color: "#D4A017",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Coming Soon <ArrowRight size={13} />
          </div>
        </CoreCard>
        <CoreCard className="p-8">
          <Users size={24} style={{ color: "#5dcaa5", marginBottom: 16 }} />
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5dcaa5",
              marginBottom: 8,
            }}
          >
            Dealer Network
          </p>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 12,
            }}
          >
            Verified Professionals
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Connect with verified aviation dealers, brokers, and mechanics.
            Trusted network, real credentials, zero cold calls.
          </p>
          <Link
            to="/listings"
            style={{
              fontSize: 12,
              color: "#5dcaa5",
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
          >
            Explore Network <ArrowRight size={13} />
          </Link>
        </CoreCard>
      </div>
    </SectionShell>
  );
}