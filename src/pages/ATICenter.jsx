import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ATIQuickScore from "@/pages/ATIQuickScore";
import ATIStandard from "@/pages/ATIStandard";
import ATIFullReport from "@/pages/ATIFullReport";
import ATIVerify from "@/pages/ATIVerify";
import { Shield, ArrowRight } from "lucide-react";

/**
 * ATICenter — consolidated ATI Premium hub.
 * Phase 1: tab shell rendering legacy ATI page components (non-breaking).
 * Legacy routes /ati-quick-score, /ati-standard, /ati-full-report,
 * /ati-verify, /ati-passport/:listingId, /ati-card/:cardCode remain functional.
 * Phase 2 will refactor each tab into a dedicated tab-friendly sub-view.
 */
const TABS = [
  { key: "quick", label: "Quick", Component: ATIQuickScore },
  { key: "standard", label: "Standard", Component: ATIStandard },
  { key: "full", label: "Full Report", Component: ATIFullReport },
  { key: "verify", label: "Verify", Component: ATIVerify },
  { key: "passport", label: "Passport", Component: null },
];

export default function ATICenter() {
  const [active, setActive] = useState("quick");
  const current = TABS.find((t) => t.key === active);

  const { data: listings = [] } = useQuery({
    queryKey: ["ati-center-listings"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-created_date",
        24
      ),
    enabled: active === "passport",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1220",
        color: "#fff",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          borderBottom: "0.5px solid rgba(212,160,23,0.18)",
          background: "rgba(17,24,39,0.6)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: 2,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                style={{
                  padding: "18px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: on ? "2px solid #D4A017" : "2px solid transparent",
                  color: on ? "#D4A017" : "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 150ms ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {active === "passport" ? (
        <PassportLauncher listings={listings} />
      ) : current?.Component ? (
        <current.Component />
      ) : null}
    </div>
  );
}

function PassportLauncher({ listings }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Shield size={18} style={{ color: "#D4A017" }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: 0 }}>
          ATI Passport
        </h1>
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 13,
          marginBottom: 24,
          maxWidth: 560,
          lineHeight: 1.6,
        }}
      >
        Select an aircraft to view or generate its ATI Passport — the 8-dimension
        transparency report with OMVM valuation.
      </p>
      {listings.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading listings…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {listings.map((l) => (
            <Link
              key={l.id}
              to={`/ati-passport/${l.id}`}
              style={{
                display: "block",
                background: "#111827",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "16px 18px",
                textDecoration: "none",
                color: "#fff",
                transition: "border-color 150ms ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(212,160,23,0.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
              }
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {l.year} {l.make} {l.model}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {l.registration || "—"}
                  {l.asking_price
                    ? ` · $${Number(l.asking_price).toLocaleString()}`
                    : ""}
                </span>
                <ArrowRight size={14} style={{ color: "#D4A017" }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}