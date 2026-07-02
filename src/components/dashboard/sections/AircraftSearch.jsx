import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";
import DashboardNRegSearch from "@/components/dashboard/DashboardNRegSearch";

export default function AircraftSearch() {
  return (
    <SectionShell
      eyebrow="Registry Lookup"
      title="Search Any Aircraft by Registration"
      subtitle="Instantly access FAA registry data, ownership records, and verification status for any aircraft worldwide. Free, no login required."
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <DashboardNRegSearch />
      </div>
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link to="/listings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#D4A017",
            textDecoration: "none",
            fontWeight: 600,
          }}>
          Or browse all listings <ArrowRight size={14} />
        </Link>
      </div>
    </SectionShell>
  );
}