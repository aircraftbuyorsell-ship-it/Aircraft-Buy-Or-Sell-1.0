import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Fingerprint, Percent, Users, Lock, TrendingUp, ArrowRight, CheckCircle2, Plane, Radar, Handshake, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import RotatingGlobe from "@/components/dashboard/RotatingGlobe";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import MarketPulse from "@/components/dashboard/MarketPulse";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import MarketForecastCharts from "@/components/dashboard/MarketForecastCharts";

function NavyIcon({ icon: Icon, size = "md" }) {
  const s = size === "lg" ? "w-16 h-16" : "w-14 h-14";
  const i = size === "lg" ? "w-7 h-7" : "w-6 h-6";
  return (
    <div className={`${s} rounded-2xl bg-[#0B2D5B]/90 flex items-center justify-center mx-auto`} style={{boxShadow:"0 4px 20px rgba(11,45,91,0.25)"}}>
      <Icon className={`${i} text-white`} strokeWidth={1.8} />
    </div>
  );
}

function PillarCard({ icon, title, body }) {
  return (
    <div className="glass-card p-6 md:p-8 text-center">
      <NavyIcon icon={icon} />
      <h3 className="text-[#0B2D5B] mt-5 text-base font-bold text-center uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-[#4A4845] leading-relaxed mt-3">{body}</p>
    </div>
  );
}

function StatPill({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-black text-[#0B2D5B] leading-none">{value}</p>
      <p className="text-[10px] md:text-[11px] text-[#6B6560] uppercase tracking-[0.15em] font-semibold mt-1.5">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [globeTheme, setGlobeTheme] = useState("light");
  const [wizardOpen, setWizardOpen] = useState(false);
  const isDark = globeTheme === "dark";

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" })
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.DealRadar.list()
  });

  const total_listings = listings.length;
  const avg_ati = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length)
    : 0;
  const hot_deals = deals.filter((d) => (d.deal_score || 0) >= 8.5).length;
  const evaluated = listings.filter((l) => l.ati_score).length;

  return (
    <div className="min-h-screen">

      {/* ———————— HERO ———————— */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: isDark ? "#060D1A" : "#EEF2F8" }}
      >
        <RotatingGlobe theme={globeTheme} className="absolute inset-0 w-full h-full pointer-events-none opacity-90" />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(90deg,rgba(6,13,26,0.94) 0%,rgba(6,13,26,0.72) 40%,rgba(6,13,26,0.18) 70%,transparent 100%)"
              : "linear-gradient(90deg,rgba(238,242,248,0.96) 0%,rgba(238,242,248,0.78) 40%,rgba(238,242,248,0.22) 70%,transparent 100%)"
          }}
        />

        {/* Globe theme toggle */}
        <button
          onClick={() => setGlobeTheme((t) => t === "light" ? "dark" : "light")}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
          style={{
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.70)",
            border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: isDark ? "#E8A83A" : "#0B2D5B"
          }}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isDark ? "Light Globe" : "Dark Globe"}
        </button>

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-14 md:pt-24 pb-18 md:pb-24 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
            style={{
              background: isDark ? "rgba(232,168,58,0.12)" : "rgba(11,45,91,0.06)",
              border: isDark ? "1px solid rgba(232,168,58,0.28)" : "1px solid rgba(11,45,91,0.12)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
          >
            <Lock className={`w-3.5 h-3.5 ${isDark ? "text-[#E8A83A]" : "text-[#0B2D5B]"}`} />
            <p className={`text-[11px] uppercase tracking-[0.15em] font-bold ${isDark ? "text-[#E8A83A]" : "text-[#0B2D5B]"}`}>
              Exclusive · Verified Aviation Professionals Only
            </p>
          </div>

          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-black leading-[1.12] uppercase tracking-tight max-w-5xl mx-auto ${isDark ? "text-white" : "text-[#1A1814]"}`}>
            <span className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>ATI Intelligence</span>
            {" · "}
            <span className="text-[#E8A83A]">ADS-B Surveillance</span>
            {" · "}
            <span className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>Pre-Buy Analysis</span>
            {" · "}
            <span className="text-[#E8A83A]">Secure Escrow</span>
          </h1>

          <p className={`text-sm md:text-base mt-5 max-w-3xl mx-auto leading-relaxed ${isDark ? "text-white/75" : "text-[#4A4845]"}`}>
            The private intelligence network for verified aviation dealers and brokers. Issue{" "}
            <b className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>ATI transaction intelligence reports</b>, surveil any aircraft{" "}
            <b className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>in real time via ADS-B</b>, conduct{" "}
            <b className="text-[#E8A83A]">AI-assisted pre-buy inspections with Max</b>, and execute transactions through{" "}
            <b className="text-[#E8A83A]">protected escrow with full commission management</b>.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 justify-center items-center">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2.5 text-white uppercase font-bold text-sm px-6 py-3.5 rounded-2xl tracking-wide transition-all active:scale-95"
              style={{background:"linear-gradient(135deg,#0B2D5B,#143C75)", boxShadow:"0 4px 20px rgba(11,45,91,0.35)"}}
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              Generate ATI Report
            </Link>
            <Link
              to="/pre-buy-inspection"
              className="inline-flex items-center gap-2.5 text-[#0B2D5B] uppercase font-bold text-sm px-6 py-3.5 rounded-2xl tracking-wide transition-all active:scale-95"
              style={{background:"linear-gradient(135deg,#E8A83A,#F5C842)", boxShadow:"0 4px 20px rgba(232,168,58,0.35)"}}
            >
              <Plane className="w-4.5 h-4.5" />
              AI Pre-Buy Inspection
            </Link>
            <Link
              to="/live-traffic"
              className="inline-flex items-center gap-2.5 uppercase font-bold text-sm px-6 py-3.5 rounded-2xl tracking-wide transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.60)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(11,45,91,0.20)",
                color: "#0B2D5B",
                boxShadow: "0 2px 12px rgba(0,0,0,0.10)"
              }}
            >
              <Radar className="w-4.5 h-4.5" />
              Live Tracking
            </Link>
            <Link
              to="/escrow"
              className="inline-flex items-center gap-2.5 uppercase font-bold text-sm px-6 py-3.5 rounded-2xl tracking-wide transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.60)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(232,168,58,0.35)",
                color: "#0B2D5B",
                boxShadow: "0 2px 12px rgba(0,0,0,0.10)"
              }}
            >
              <Handshake className="w-4.5 h-4.5" />
              Secure Escrow
            </Link>
          </div>

          <p className={`text-[11px] uppercase tracking-wider mt-6 font-medium ${isDark ? "text-white/50" : "text-[#6B6560]"}`}>
            <Link to="/rewards" className="text-[#E8A83A] hover:underline">Referral Program</Link> — introduce qualified professionals and earn revenue share.
          </p>
        </div>
      </section>

      {/* ———————— MARKET PULSE ———————— */}
      <MarketPulse />

      {/* ———————— PILLARS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#E8A83A] text-center">Platform Capabilities</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2 max-w-3xl mx-auto leading-tight">
          Institutional-Grade Transaction Intelligence for Aviation Professionals
        </h2>
        <div className="grid md:grid-cols-4 gap-4 mt-12">
          <PillarCard icon={ShieldCheck} title="ATI Transaction Report" body="Comprehensive aircraft intelligence scoring across 8 risk dimensions — documentation integrity, engine condition, avionics fit, operational history, and transaction readiness." />
          <PillarCard icon={Radar} title="ADS-B Surveillance" body="Real-time aircraft surveillance by N-number or Mode-S hex. Live position, altitude, ground speed, and 7-day operational history." />
          <PillarCard icon={TrendingUp} title="AI Pre-Buy Inspection" body="On-site AI inspection with Max — live visual analysis of airframe, corrosion, interior condition, and maintenance discrepancies delivered by voice." />
          <PillarCard icon={Handshake} title="Escrow & Commission Management" body="Protected buyer-seller escrow with automated commission splits, finder's fee allocation, and full payout audit trail." />
        </div>
      </section>

      {/* ———————— STATS ———————— */}
      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div
            className="rounded-3xl px-6 md:px-12 py-10"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(24px) saturate(160%)",
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.60)",
              boxShadow: "0 8px 40px rgba(11,45,91,0.08)"
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#E8A83A] font-bold text-center">Live Platform Metrics</p>
            <h3 className="text-xl md:text-2xl font-black text-[#0B2D5B] text-center mt-1 uppercase tracking-tight">
              Active Inventory & Transaction Intelligence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
              <StatPill value={total_listings} label="Aircraft On Market" />
              <StatPill value={evaluated} label="ATI Reports Issued" />
              <StatPill value={hot_deals} label="High-Value Opportunities" />
              <StatPill value={avg_ati || "—"} label="Avg ATI Score" />
            </div>
          </div>
        </div>
      </section>

      {/* ———————— HOW IT WORKS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#E8A83A] text-center">Transaction Workflow</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2">
          From Intelligence to Close — Four Professional Steps
        </h2>
        <div className="grid md:grid-cols-4 gap-5 mt-12">
          {[
            { n: "01", title: "Issue ATI Intelligence Report", body: "Add an aircraft registration and instantly generate a verified ATI transaction report scoring 8 risk dimensions — documentation, engine, avionics, and market readiness." },
            { n: "02", title: "Conduct AI Pre-Buy Inspection", body: "On-site with the aircraft? Engage Max AI for a live visual inspection — airframe condition, corrosion indicators, and maintenance status assessed in real time." },
            { n: "03", title: "Verify & Surveil via ADS-B", body: "Confirm operational status. Surveil the aircraft by N-number or Mode-S hex — live position, altitude, speed, and 7-day flight history." },
            { n: "04", title: "Execute via Secure Escrow", body: "Structured deal execution through protected escrow. Commission splits, finder's fees, buyer-seller funds flow, and payout audit managed on-platform." }
          ].map((s) => (
            <div key={s.n} className="glass-card p-6">
              <p className="text-4xl font-black text-[#E8A83A] leading-none">{s.n}</p>
              <h4 className="text-sm font-black text-[#0B2D5B] uppercase mt-3 tracking-tight">{s.title}</h4>
              <p className="text-sm text-[#4A4845] mt-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 text-white uppercase font-bold text-sm px-8 py-4 rounded-2xl tracking-wider transition-all active:scale-95"
            style={{background:"linear-gradient(135deg,#0B2D5B,#143C75)", boxShadow:"0 4px 24px rgba(11,45,91,0.30)"}}
          >
            Access the Platform <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ———————— WHO IT'S FOR ———————— */}
      <section className="py-16 md:py-20"
        style={{background:"linear-gradient(135deg,#0B2D5B 0%,#0d3566 50%,#0B2D5B 100%)"}}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#E8A83A] text-center">Who We Serve</p>
          <h2 className="text-2xl md:text-3xl font-black text-white text-center uppercase tracking-tight mt-2">
            Purpose-Built for Dealers, Brokers & Operators
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            {[
              { icon: Users, title: "Aircraft Dealers", body: "Manage your active inventory with verified ATI intelligence reports. Present aircraft professionally to qualified institutional buyers and accelerate your sales cycle." },
              { icon: Handshake, title: "Aviation Brokers", body: "Originate, structure and close deals with confidence. Secure escrow, automated commission management and deal pipeline tools for every transaction stage." },
              { icon: TrendingUp, title: "Operators & Acquirers", body: "Source quality off-market aircraft, verify title and airworthiness, and execute acquisitions through a structured, transparent transaction process." }
            ].map((x) => (
              <div
                key={x.title}
                className="p-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.12)"
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#E8A83A] flex items-center justify-center" style={{boxShadow:"0 4px 16px rgba(232,168,58,0.35)"}}>
                  <x.icon className="w-5 h-5 text-[#0B2D5B]" strokeWidth={2} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight text-white mt-4">{x.title}</h4>
                <p className="text-sm text-white/65 mt-2 leading-relaxed">{x.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {["ATI Transaction Reports","Secure Escrow Execution","Commission & Fee Management","Verified Professional Network","Real-Time ADS-B Surveillance","Transparent Deal Pricing"].map((x) => (
              <div key={x} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-[#E8A83A]" />
                {x}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ———————— MARKET FORECAST ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <MarketForecastCharts />
      </section>

      {/* ———————— AIRCRAFT REPORTS + AI INSIGHTS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#E8A83A]">Active Listings</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight mt-1">ATI-Evaluated Aircraft</h2>
          </div>
          <Link to="/listings" className="text-sm font-bold text-[#0B2D5B] uppercase tracking-wider hover:text-[#E8A83A] transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {listings.slice(0, 6).map((l) => {
              const score = l.ati_score || 0;
              const color = score >= 85 ? "#28C76F" : score >= 65 ? "#E8A83A" : score > 0 ? "#FF3B30" : "#AAA49C";
              return (
                <Link
                  key={l.id}
                  to={`/ati-passport/${l.id}`}
                  className="glass-card p-5 block"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#E8A83A] font-bold">ATI ID</p>
                      <p className="text-xs uppercase tracking-wider text-[#6B6560] font-medium font-mono mt-0.5">{l.registration || "—"}</p>
                      <p className="text-lg font-black text-[#1A1814] mt-1 truncate">{l.year} {l.make} {l.model}</p>
                    </div>
                    <div className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-xs" style={{background:color, boxShadow:`0 4px 12px ${color}55`}}>
                      {score || "—"}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-[#6B6560] font-medium">Finder's Fee</p>
                    <p className="text-base font-black text-[#0B2D5B]">%</p>
                  </div>
                </Link>
              );
            })}
            {listings.length === 0 && (
              <div className="sm:col-span-2 text-center py-16 text-[#AAA49C]">
                <Plane className="w-10 h-10 mx-auto opacity-30 mb-3" />
                <p className="text-sm">No aircraft reports available yet.</p>
              </div>
            )}
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <AIInsightsPanel />
          </div>
        </div>
      </section>

      {/* ———————— FOOTER CTA ———————— */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight">
            One Platform. <span className="text-[#0B2D5B]">Institutional Standards.</span>{" "}
            <span className="text-[#E8A83A]">Verified Results.</span>
          </h2>
          <p className="text-[#4A4845] text-sm md:text-base mt-3">
            ABOS is the private intelligence network trusted by aviation dealers and brokers who require rigorous transaction due diligence, secure deal execution, and auditable outcomes.
          </p>
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 text-white uppercase font-bold text-sm px-8 py-4 rounded-2xl tracking-wider transition-all active:scale-95 mt-8"
            style={{background:"linear-gradient(135deg,#0B2D5B,#143C75)", boxShadow:"0 4px 24px rgba(11,45,91,0.28)"}}
          >
            Enter the Platform <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <AircraftWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}