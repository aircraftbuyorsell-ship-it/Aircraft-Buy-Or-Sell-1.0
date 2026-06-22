import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import BlackGlobeHUD from "@/components/dashboard/BlackGlobeHUD";
import DashboardNRegSearch from "@/components/dashboard/DashboardNRegSearch";
import ListingCard from "@/components/listings/ListingCard";
import SiteFooter from "@/components/SiteFooter";
import {
  Globe, Zap, TrendingUp, BarChart3, Wind, Database,
  Plane, Sliders, Code, Map, ArrowRight, Home, 
  Gauge, Calculator, Users, Zap as ZapIcon
} from "lucide-react";

const GOLD = "#C9A84D";
const BG_PRIMARY = "#05070B";
const BG_SECONDARY = "#0F1218";
const TEXT_WHITE = "#ffffff";
const TEXT_MUTED = "rgba(255,255,255,0.45)";

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function Dashboard() {
  // ─── QUERIES ───────────────────────────────────────────
  const { data: listingsActive = [] } = useQuery({
    queryKey: ["listings-active-dashboard"],
    queryFn: () => base44.entities.AircraftListing.filter(
      { status: "active", visibility: "public" },
      "-created_date",
      10
    ),
    staleTime: 30000,
  });

  const { data: listingsAllActive = [] } = useQuery({
    queryKey: ["listings-all-active"],
    queryFn: () =>
      base44.entities.AircraftListing.filter({ status: "active" }),
    staleTime: 30000,
  });

  const { data: atiCardsAll = [] } = useQuery({
    queryKey: ["ati-cards-all"],
    queryFn: () => base44.entities.ATICard.list("-created_date", 1000),
    staleTime: 30000,
  });

  const { data: atiCardsActive = [] } = useQuery({
    queryKey: ["ati-cards-active"],
    queryFn: () => base44.entities.ATICard.filter({ status: "active" }),
    staleTime: 30000,
  });

  const { data: listingsToday = [] } = useQuery({
    queryKey: ["listings-today"],
    queryFn: async () => {
      const ts = todayStart();
      return base44.entities.AircraftListing.filter({ status: "active" });
    },
    staleTime: 30000,
  });

  const { data: atiCardsToday = [] } = useQuery({
    queryKey: ["ati-cards-today"],
    queryFn: async () => {
      const ts = todayStart();
      return base44.entities.ATICard.filter({ status: "active" });
    },
    staleTime: 30000,
  });

  // ─── KPI COUNTS ────────────────────────────────────────
  const kpiListingsCount = listingsAllActive.length;
  const kpiAtiCardsCount = atiCardsAll.length;
  const kpiActiveAti = atiCardsActive.length;

  // ─── GRID LISTING (MARKETPLACE) ────────────────────────
  const marketplaceListings = listingsActive.slice(0, 6);

  // ─── ENGINES ───────────────────────────────────────────
  const engines = [
    { name: "Lycoming IO-540", type: "Piston" },
    { name: "Continental TSIO-550", type: "Piston" },
    { name: "Pratt & Whitney PT6A", type: "Turbine" },
    { name: "Williams FJ44", type: "Jet" },
    { name: "GE CF34", type: "Commercial" },
  ];

  return (
    <div style={{ background: BG_PRIMARY, color: TEXT_WHITE, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>
      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO (full viewport)
      ═══════════════════════════════════════════════════════ */}
      <div className="relative w-full" style={{ minHeight: "100vh" }}>
        {/* Globe background */}
        <div className="absolute inset-0 z-0">
          <BlackGlobeHUD
            listings={listingsActive}
            listingsCount={listingsActive.length}
            stats={{ adsbCount: 2315, liveDbCount: listingsActive.length, faaCount: 456 }}
            isDark={true}
            hideOverlayPills={true}
          />
        </div>

        {/* Gradient scrims for readability */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "28%",
            background: "linear-gradient(to bottom, rgba(5,7,11,0.85) 0%, transparent 40%, rgba(5,7,11,0.9) 75%, rgba(5,7,11,1) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "46%",
            background: "linear-gradient(to top, rgba(5,7,11,0.95) 0%, rgba(5,7,11,0.7) 35%, rgba(5,7,11,0.25) 70%, transparent 100%)",
          }}
        />

        {/* Center hero: headline + search + KPIs */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 md:px-8">
          <div className="max-w-2xl w-full">
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-light text-center mb-4" style={{ color: TEXT_WHITE }}>
              Global Aircraft Identity & Intelligence
            </h1>

            {/* N-Reg Search */}
            <div className="mb-12">
              <p className="text-center text-[9px] tracking-[0.22em] font-bold mb-3" style={{ color: GOLD }}>
                FAA N-REGISTRY LOOKUP
              </p>
              <DashboardNRegSearch />
            </div>

            {/* KPI Tiles */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
              {[
                { label: "Aircraft Listings", value: kpiListingsCount },
                { label: "ATI Cards", value: kpiAtiCardsCount },
                { label: "Active ATI", value: kpiActiveAti },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-4 py-5 text-center h-[88px] flex flex-col justify-center"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${GOLD}22`,
                  }}
                >
                  <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-1" style={{ color: GOLD }}>
                    {kpi.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-black" style={{ color: TEXT_WHITE }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — QUICK ACCESS (4 glass cards)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_SECONDARY }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
            Quick Access
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-12" style={{ color: TEXT_WHITE }}>
            Explore Core Modules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Globe, label: "MarketSpace", to: "/listings", desc: "Browse live listings" },
              { icon: Zap, label: "ATI Passport", to: "/ati-quick-score", desc: "Aircraft intelligence" },
              { icon: TrendingUp, label: "Valuation", to: "/valuation", desc: "OMVM scoring" },
              { icon: Wind, label: "OPEX Calc", to: "/opex-calculator", desc: "Operating costs" },
            ].map((item) => (
              <Link key={item.label} to={item.to}>
                <div
                  className="rounded-xl p-6 cursor-pointer group hover:border-[#C9A84D] hover:shadow-[0_0_24px_rgba(201,168,77,0.12)] transition-all h-full"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${GOLD}22`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="rounded-lg p-2.5"
                      style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}30` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: TEXT_WHITE }}>
                    {item.label}
                  </h3>
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>
                    {item.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — LIVE MARKET (horizontal scroll)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_PRIMARY }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
            Live Market
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-8" style={{ color: TEXT_WHITE }}>
            Recent Listings
          </h2>

          <div className="flex overflow-x-auto gap-4 pb-4">
            {listingsActive.map((listing) => (
              <div key={listing.id} className="flex-shrink-0 w-96">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — MARKET INTELLIGENCE (2 Bloomberg boxes)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_SECONDARY }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
            Market Intelligence
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-12" style={{ color: TEXT_WHITE }}>
            Today's Activity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Listings */}
            <div
              className="rounded-xl p-6"
              style={{
                background: `rgba(255,255,255,0.02)`,
                border: `1px solid ${GOLD}22`,
                fontFamily: "'Courier New', monospace",
              }}
            >
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-4" style={{ color: GOLD }}>
                NEW LISTINGS TODAY
              </p>
              <p className="text-4xl font-black mb-2" style={{ color: TEXT_WHITE }}>
                {listingsToday.length}
              </p>
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                Aircraft added to marketplace
              </p>
            </div>

            {/* New ATI Passports */}
            <div
              className="rounded-xl p-6"
              style={{
                background: `rgba(255,255,255,0.02)`,
                border: `1px solid ${GOLD}22`,
                fontFamily: "'Courier New', monospace",
              }}
            >
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-4" style={{ color: GOLD }}>
                NEW ATI PASSPORTS TODAY
              </p>
              <p className="text-4xl font-black mb-2" style={{ color: TEXT_WHITE }}>
                {atiCardsToday.length}
              </p>
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                Aircraft intelligence generated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — AIRCRAFT FINANCE STRIP
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 md:px-8" style={{ background: BG_PRIMARY }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-2" style={{ color: GOLD }}>
                Aircraft Finance
              </p>
              <h3 className="text-2xl md:text-3xl font-light mb-4" style={{ color: TEXT_WHITE }}>
                OPEX · CAPEX · Leasing · Insurance
              </h3>
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                Calculate operating costs, capital expenses, financing, and coverage for any aircraft.
              </p>
            </div>
            <Link
              to="/opex-calculator"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:gap-3"
              style={{
                background: GOLD,
                color: "#000",
              }}
            >
              Get Calculator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — FEATURED TOOLS (2x3 grid)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_SECONDARY }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
            Featured Tools
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-12" style={{ color: TEXT_WHITE }}>
            Accelerate Your Workflow
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Map, label: "Live Traffic", to: "/traffic" },
              { icon: Zap, label: "ATI Quick Score", to: "/ati-quick-score" },
              { icon: TrendingUp, label: "Valuation", to: "/valuation" },
              { icon: Database, label: "IntraZone", to: "/intrazone" },
              { icon: Database, label: "Data Hub", to: "/intrazone" },
              { icon: Code, label: "Developers", to: "/developers" },
            ].map((tool) => (
              <Link key={tool.label} to={tool.to}>
                <div
                  className="rounded-xl p-6 cursor-pointer group hover:border-[#C9A84D] transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${GOLD}22`,
                  }}
                >
                  <tool.icon className="w-8 h-8 mb-3" style={{ color: GOLD }} />
                  <p className="text-sm font-bold" style={{ color: TEXT_WHITE }}>
                    {tool.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — ENGINE DB + DEALER NETWORK (2-column split)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_PRIMARY }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
            Core Databases
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-12" style={{ color: TEXT_WHITE }}>
            Trusted Intelligence Sources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Engine DB */}
            <Link to="/intrazone">
              <div
                className="rounded-xl p-8 cursor-pointer group hover:border-[#C9A84D] transition-all h-full"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${GOLD}22`,
                }}
              >
                <Wind className="w-8 h-8 mb-4" style={{ color: GOLD }} />
                <h3 className="text-2xl font-bold mb-6" style={{ color: TEXT_WHITE }}>
                  Engine Database
                </h3>
                <div className="space-y-3">
                  {engines.map((e) => (
                    <div key={e.name} className="flex justify-between text-sm">
                      <span style={{ color: TEXT_WHITE }}>{e.name}</span>
                      <span style={{ color: TEXT_MUTED }}>{e.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Dealer Network */}
            <Link to="/intrazone">
              <div
                className="rounded-xl p-8 cursor-pointer group hover:border-[#C9A84D] transition-all h-full"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${GOLD}22`,
                }}
              >
                <Users className="w-8 h-8 mb-4" style={{ color: GOLD }} />
                <h3 className="text-2xl font-bold mb-6" style={{ color: TEXT_WHITE }}>
                  Verified Dealers
                </h3>
                <p className="text-4xl font-black mb-8" style={{ color: GOLD }}>
                  2,341
                </p>
                <div className="space-y-3">
                  {["Piper Dealer Network", "Cessna Authorized", "Cirrus Service", "Beechcraft Partners", "Diamond Specialists"].map(
                    (d) => (
                      <div key={d} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
                        <span style={{ color: TEXT_WHITE }}>{d}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8 — MARKETPLACE GRID (md:grid-cols-3)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_SECONDARY }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
            Marketplace
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-12" style={{ color: TEXT_WHITE }}>
            Featured Aircraft
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketplaceListings.map((listing) => (
              <div key={listing.id}>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9 — WHY ABOS (6 icons + text, centered)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-8" style={{ background: BG_PRIMARY }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: GOLD }}>
              Why ABOS
            </p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ color: TEXT_WHITE }}>
              Trust Data. Own Intelligence.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { icon: Database, label: "Aircraft Identity", desc: "Unified N-Reg database" },
              { icon: TrendingUp, label: "Aircraft Valuation", desc: "OMVM scoring engine" },
              { icon: Globe, label: "Aircraft Marketplace", desc: "Public listings hub" },
              { icon: Plane, label: "Aircraft Passport", desc: "Digital identity card" },
              { icon: Code, label: "Aircraft API", desc: "Developer toolkit" },
              { icon: BarChart3, label: "Aircraft Analytics", desc: "Market intelligence" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="flex justify-center mb-4">
                  <div
                    className="rounded-lg p-3"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}30` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: GOLD }} />
                  </div>
                </div>
                <h3 className="font-bold mb-2" style={{ color: TEXT_WHITE }}>
                  {item.label}
                </h3>
                <p className="text-sm" style={{ color: TEXT_MUTED }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 10 — ENTERPRISE STRIP (API + Partners)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 md:px-8" style={{ background: BG_SECONDARY }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: GOLD }}>
              Powered by ABOS API
            </p>
            <h3 className="text-2xl font-light mt-2" style={{ color: TEXT_WHITE }}>
              Enterprise Integrations
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {[
              "Aircraft Registry",
              "Live ADS-B",
              "FAA Database",
              "Insurance Partners",
              "Marketplace",
              "Analytics Engine",
            ].map((partner) => (
              <div
                key={partner}
                className="rounded-lg p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${GOLD}22`,
                }}
              >
                <p className="text-xs font-bold" style={{ color: TEXT_WHITE }}>
                  {partner}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/developers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:gap-3"
              style={{
                background: GOLD,
                color: "#000",
              }}
            >
              Explore API <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 11 — FOOTER
      ═══════════════════════════════════════════════════════ */}
      <SiteFooter />

      {/* ═══════════════════════════════════════════════════════
          SECTION 12 — MOBILE BOTTOM NAV
      ═══════════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-50 border-t"
        style={{
          background: BG_PRIMARY,
          borderColor: `${GOLD}22`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-around">
          {[
            { icon: Home, label: "Home", to: "/" },
            { icon: Globe, label: "Market", to: "/listings" },
            { icon: Zap, label: "ATI", to: "/ati-quick-score" },
            { icon: Gauge, label: "OPEX", to: "/opex-calculator" },
            { icon: Code, label: "API", to: "/developers" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-4 text-[10px] font-bold transition-colors"
              style={{
                color: TEXT_MUTED,
              }}
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Safe area spacer for mobile */}
      <div className="md:hidden h-20" />
    </div>
  );
}