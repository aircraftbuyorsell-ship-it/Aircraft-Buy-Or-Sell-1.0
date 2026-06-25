import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";

export default function EnterpriseCTA() {
  return (
    <SectionShell>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#D4A017",
            marginBottom: 16,
          }}
        >
          Enterprise
        </p>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: "#fff",
            maxWidth: 600,
            margin: "0 auto 16px",
          }}
        >
          Built for Serious Aviation Professionals
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Dealers, brokers, and fleet operators trust ABOS for objective
          intelligence. API access, white-label, and custom integrations
          available.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#D4A017",
              color: "#0B1220",
              padding: "14px 28px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Plans <ArrowRight size={16} />
          </Link>
          <Link
            to="/listings"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              padding: "14px 28px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              border: "0.5px solid rgba(255,255,255,0.12)",
            }}
          >
            Explore Platform
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}