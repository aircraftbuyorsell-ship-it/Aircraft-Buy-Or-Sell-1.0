import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import NRegLookup from "@/components/dashboard/NRegLookup";
import QuickAccessStrip from "@/components/dashboard/QuickAccessStrip";
import ATIOverviewCards from "@/components/dashboard/ATIOverviewCards";
import LiveMarketIntelligence from "@/components/dashboard/LiveMarketIntelligence";
import SiteFooter from "@/components/SiteFooter";
import ListingCard from "@/components/listings/ListingCard";
import NotificationStack from "@/components/notifications/NotificationStack";
import {
  Plane, BarChart2, Shield, Zap, Globe, Cpu, Database, Users, ArrowRight,
  TrendingUp, CheckCircle, Briefcase, FileText, Calculator,
} from "lucide-react";

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function Dashboard() {
  const { data: listings = [] } = useQuery({
    queryKey: ["listings-hub"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-created_date",
        10
      ),
    staleTime: 30000,
  });

  const { data: atiCards = [] } = useQuery({
    queryKey: ["ati-cards-hub"],
    queryFn: () => base44.entities.ATICard.list(),
    staleTime: 30000,
  });

  const { data: activeAti = [] } = useQuery({
    queryKey: ["ati-active-hub"],
    queryFn: () => base44.entities.ATICard.filter({ status: "active" }),
    staleTime: 30000,
  });

  return (
    <div
      style={{
        background: "#04060a",
        color: "#fff",
        overflowY: "auto",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      <NotificationStack />

      {/* ── 1. HERO ── 100vh section */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Globe fills hero — bigger */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <SkyBossGlobe className="w-full h-full" listings={listings} />
        </div>

        {/* Dark gradient overlay — left-weighted for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(to right, rgba(4,6,10,0.85) 0%, rgba(4,6,10,0.45) 38%, rgba(4,6,10,0.12) 65%, rgba(4,6,10,0.55) 100%)",
          }}
        />

        {/* Hero content — two column: H1 left, N-reg search right */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "48px 32px 0",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            flex: 1,
          }}
        >
          {/* Left: eyebrow + H1 + subtext */}
          <div style={{ maxWidth: 520 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f5c242",
                marginBottom: 16,
              }}
            >
              Global Aircraft Identity & Intelligence
            </p>
            <h1
              style={{
                fontSize: "clamp(32px, 4.5vw, 56px)",
                fontWeight: 500,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                color: "#fff",
                marginBottom: 20,
              }}
            >
              Aircraft Intelligence,
              <br />
              Verified by Data.
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
                maxWidth: 440,
              }}
            >
              The operating system for aircraft transactions. Identity,
              valuation, and market intelligence — trusted by dealers, brokers,
              and owners worldwide.
            </p>
          </div>

          {/* Right: N-reg search — centered, smaller */}
          <div style={{ width: "100%", maxWidth: 360, flexShrink: 0 }}>
            <NRegLookup />
          </div>
        </div>

        {/* Bottom live counters */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px 40px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { value: listings.length, label: "Active Listings" },
              { value: atiCards.length, label: "ATI Passports" },
              { value: activeAti.length, label: "Active ATI" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: "-0.04em",
                    color: "#f5c242",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 4,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1b. PLATFORM SCALE STATS ── */}
      <section
        style={{
          background: "#04060a",
          padding: "60px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            Platform Scale
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 32,
            }}
          >
            The Numbers Behind the Network
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { value: "11.5M+", label: "FB Group Views", sub: "Monthly impressions" },
              { value: "280K+", label: "FB Members", sub: "Community members" },
              { value: "4,200+", label: "Posts per Year", sub: "Community engagement" },
              { value: "1.2M+", label: "Web Visits", sub: "Monthly unique visitors" },
              { value: "303,000", label: "N-Reg Records", sub: "FAA registry indexed" },
              { value: "12,000", label: "Dealers", sub: "Verified professionals" },
              { value: "8,500", label: "Engine Refs", sub: "Engine models tracked" },
              { value: "15,000", label: "Airframe Refs", sub: "Type references" },
              { value: "2.4M+", label: "Traffic Records", sub: "Historical live traffic" },
            ].map(({ value, label, sub }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(245,194,66,0.12)",
                  borderRadius: 12,
                  padding: "20px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    color: "#f5c242",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 2,
                  }}
                >
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1c. LIVE MARKET INTELLIGENCE ── */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            ABOS Market Intelligence · Live
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Live Market Data Feed
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 32,
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            Real-time market pricing and availability across top manufacturers.
            Data automatically recalibrates OMVM valuations and ATI scoring.
          </p>
          <LiveMarketIntelligence />
        </div>
      </section>

      {/* ── 2. QUICK ACCESS ── */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            Quick Access
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 32,
            }}
          >
            Everything you need, one click away
          </h2>
          <QuickAccessStrip />
        </div>
      </section>

      {/* ── 3. LIVE MARKET ── horizontal scroll */}
      <section
        style={{
          background: "#0a0f1a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#f5c242",
                  marginBottom: 8,
                }}
              >
                Live Market
              </p>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: "#fff",
                }}
              >
                Latest Aircraft Listings
              </h2>
            </div>
            <Link
              to="/listings"
              style={{
                fontSize: 12,
                color: "#f5c242",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {listings.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 16,
                scrollbarWidth: "none",
              }}
            >
              {listings.map((l) => (
                <div
                  key={l.id}
                  style={{ minWidth: 280, flexShrink: 0 }}
                >
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 40,
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: 13,
              }}
            >
              Loading live listings...
            </div>
          )}
        </div>
      </section>

      {/* ── 3b. ATI OVERVIEW CARDS ── market data by aircraft type */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            ATI Overview · Market Intelligence
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Value Estimates by Aircraft Type
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 32,
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            ATI scores, OMVM value estimates, and market pricing automatically
            recalculated per aircraft type. Select a manufacturer to see live
            aggregated data.
          </p>
          <ATIOverviewCards />
        </div>
      </section>

      {/* ── 4. MARKET INTELLIGENCE ── terminal-style counters */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            Market Intelligence
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 32,
            }}
          >
            Real-Time Aviation Data Feed
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                label: "Active Listings",
                value: listings.length,
                color: "#5dcaa5",
                icon: "✔",
              },
              {
                label: "ATI Passports Issued",
                value: atiCards.length,
                color: "#f5c242",
                icon: "✔",
              },
              {
                label: "ATI Scores Active",
                value: activeAti.length,
                color: "#4e8ef7",
                icon: "✔",
              },
              {
                label: "Platform Coverage",
                value: "Global",
                color: "#5dcaa5",
                icon: "✔",
              },
            ].map(({ label, value, color, icon }) => (
              <div
                key={label}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "0.5px solid rgba(245,194,66,0.12)",
                  borderRadius: 8,
                  padding: "20px 24px",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ color, fontSize: 12 }}>{icon}</span>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 400,
                      color,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. AIRCRAFT FINANCE ── */}
      <section
        style={{
          background: "#0a0f1a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            Aircraft Finance
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 32,
            }}
          >
            Full Financial Intelligence
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {[
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
            ].map(({ label, desc, icon: Icon }) => (
              <div
                key={label}
                style={{
                  background: "rgba(245,194,66,0.04)",
                  border: "0.5px solid rgba(245,194,66,0.18)",
                  borderRadius: 12,
                  padding: "20px 20px",
                }}
              >
                <Icon size={18} style={{ color: "#f5c242", marginBottom: 12 }} />
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
              </div>
            ))}
          </div>
          <Link
            to="/opex-calculator"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#f5c242",
              color: "#04060a",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Open OPEX Calculator <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── 6. FEATURED TOOLS 2x3 GRID ── */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
            }}
          >
            Platform Tools
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 32,
            }}
          >
            Built for Aviation Professionals
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                label: "ATI Score Engine",
                desc: "8-dimension aircraft intelligence score. Objective, deterministic, verifiable.",
                to: "/ati-passport",
                color: "#f5c242",
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
                color: "#4e8ef7",
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
                to: "/market-analytics",
                color: "#f5c242",
                Icon: TrendingUp,
              },
              {
                label: "Pre-Buy Inspection",
                desc: "AI-assisted inspection coordination with verified mechanics.",
                to: "/pre-buy-inspection",
                color: "#4e8ef7",
                Icon: CheckCircle,
              },
            ].map(({ label, desc, to, color, Icon }) => (
              <Link
                key={label}
                to={to}
                style={{
                  display: "block",
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "20px 20px",
                  transition: "border-color 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor =
                    "rgba(245,194,66,0.35)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.08)")
                }
              >
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. ENGINE DB + DEALER NETWORK TEASER ── */}
      <section
        style={{
          background: "#0a0f1a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <Cpu size={24} style={{ color: "#f5c242", marginBottom: 16 }} />
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#f5c242",
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
                color: "#f5c242",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Coming Soon <ArrowRight size={13} />
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 32,
            }}
          >
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
          </div>
        </div>
      </section>

      {/* ── 8. MARKETPLACE GRID ── */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#f5c242",
                  marginBottom: 8,
                }}
              >
                Marketplace
              </p>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: "#fff",
                }}
              >
                Featured Aircraft
              </h2>
            </div>
            <Link
              to="/listings"
              style={{
                fontSize: 12,
                color: "#f5c242",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              All listings <ArrowRight size={14} />
            </Link>
          </div>
          {listings.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {listings.slice(0, 6).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 40,
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: 13,
              }}
            >
              Loading marketplace...
            </div>
          )}
        </div>
      </section>

      {/* ── 9. WHY ABOS ── */}
      <section
        style={{
          background: "#0a0f1a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Why ABOS
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 48,
              textAlign: "center",
            }}
          >
            The Aviation Intelligence Standard
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
            }}
          >
            {[
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
            ].map(({ title, desc, icon: Icon }) => (
              <div key={title} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(245,194,66,0.08)",
                    border: "0.5px solid rgba(245,194,66,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon size={20} style={{ color: "#f5c242" }} />
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
        </div>
      </section>

      {/* ── 10. ENTERPRISE CTA ── */}
      <section
        style={{
          background: "#04060a",
          padding: "80px 0",
          borderTop: "1px solid rgba(245,194,66,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5c242",
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
              marginBottom: 16,
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
                background: "#f5c242",
                color: "#04060a",
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
      </section>

      {/* ── 11. FOOTER ── */}
      <SiteFooter />

    </div>
  );
}