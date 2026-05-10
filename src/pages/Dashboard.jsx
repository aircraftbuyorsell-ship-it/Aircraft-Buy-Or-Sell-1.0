import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Fingerprint, Percent, Users, Lock, TrendingUp, ArrowRight, CheckCircle2, Plane, Radar, Handshake, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import RotatingGlobe from "@/components/dashboard/RotatingGlobe";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import MarketPulse from "@/components/dashboard/MarketPulse";

// ———————————————————————————————————————————————
// Palette: Navy #0B2D5B · Amber #E8A83A · Deep #1A1814
// ———————————————————————————————————————————————

function NavyIcon({ icon: Icon, size = "md" }) {
  const s = size === "lg" ? "w-16 h-16" : "w-14 h-14";
  const i = size === "lg" ? "w-7 h-7" : "w-6 h-6";
  return (
    <div className={`${s} rounded-full bg-[#0B2D5B] flex items-center justify-center mx-auto shadow-md`}>
      <Icon className={`${i} text-white`} strokeWidth={2} />
    </div>);

}

function PillarCard({ icon, title, body }) {
  return (
    <div className="bg-white rounded-lg border border-black/[0.06] p-6 md:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
      <NavyIcon icon={icon} />
      <h3 className="bg-transparent text-[#0B2D5B] mt-5 text-base font-black text-center uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-[#4A4845] leading-relaxed mt-3">{body}</p>
    </div>);

}

function StatPill({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-black text-[#0B2D5B] leading-none">{value}</p>
      <p className="text-[10px] md:text-[11px] text-[#6B6560] uppercase tracking-[0.15em] font-semibold mt-1.5">{label}</p>
    </div>);

}

export default function Dashboard() {
  const [globeTheme, setGlobeTheme] = useState("light");
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
  const avg_ati = listings.length > 0 ?
  Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length) :
  0;
  const hot_deals = deals.filter((d) => (d.deal_score || 0) >= 8.5).length;
  const evaluated = listings.filter((l) => l.ati_score).length;

  return (
    <div className="min-h-screen bg-white">
      {/* ———————— HERO ———————— */}
      <section
        className="relative overflow-hidden border-b border-black/[0.06] transition-colors duration-500"
        style={{ backgroundColor: isDark ? "#0B1A33" : "#FFFFFF" }}>
        
        {/* Rotating globe background */}
        <RotatingGlobe theme={globeTheme} className="absolute inset-0 w-full h-full pointer-events-none opacity-90" />
        {/* Soft left-side fade so text stays readable over the globe */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: isDark ?
            "linear-gradient(90deg, rgba(11,26,51,0.92) 0%, rgba(11,26,51,0.70) 40%, rgba(11,26,51,0.15) 70%, rgba(11,26,51,0) 100%)" :
            "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 40%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%)"
          }} />
        

        {/* Theme toggle — affects globe only */}
        <button
          onClick={() => setGlobeTheme((t) => t === "light" ? "dark" : "light")}
          className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur text-[10px] font-black uppercase tracking-wider transition-colors ${
          isDark ?
          "bg-white/10 border-white/20 text-[#E8A83A] hover:bg-white/20" :
          "bg-white/70 border-black/10 text-[#0B2D5B] hover:bg-white"}`
          }
          aria-label="Toggle globe theme"
          title="Toggle globe theme">
          
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isDark ? "Light Globe" : "Dark Globe"}
        </button>

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-20 text-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border ${isDark ? "bg-white/10 border-white/20" : "bg-[#0B2D5B]/5 border-[#0B2D5B]/15"}`}>
            <Lock className={`w-3.5 h-3.5 ${isDark ? "text-[#E8A83A]" : "text-[#0B2D5B]"}`} />
            <p className={`text-[11px] uppercase tracking-[0.15em] font-black ${isDark ? "text-[#E8A83A]" : "text-[#0B2D5B]"}`}>Private · Verified Dealers & Brokers Only</p>
          </div>

          <h1 className={`text-2xl md:text-4xl lg:text-5xl font-black leading-[1.15] uppercase tracking-tight max-w-5xl mx-auto ${isDark ? "text-white" : "text-[#1A1814]"}`}>
            <span className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>Aircraft Intelligence Reports</span>, <span className="text-[#E8A83A]">Secure Escrow</span> & <span className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>Real-Time Tracking</span> — Professional Aviation Marketplace
          </h1>
          <p className={`text-sm md:text-base mt-5 max-w-3xl mx-auto leading-relaxed ${isDark ? "text-white/80" : "text-[#4A4845]"}`}>
            Generate comprehensive <b className={isDark ? "text-[#6FA3E8]" : "text-[#0B2D5B]"}>aircraft intelligence reports</b>, close transactions with protected <b className="text-[#E8A83A]">escrow services</b>, and track aircraft activity in real-time. The trusted platform for aviation professionals and brokers.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2.5 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm md:text-base px-6 py-3.5 rounded-md tracking-wider transition-colors">AIRCRAFT WIZARD



            </Link>
            <Link
              to="/escrow"
              className="inline-flex items-center gap-2.5 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] uppercase font-black text-sm md:text-base px-6 py-3.5 rounded-md tracking-wider transition-colors">
              
              <Handshake className="w-5 h-5" />
              Open Escrow Deal
            </Link>
            <Link
              to="/live-traffic"
              className="inline-flex items-center gap-2.5 bg-white border-2 border-[#0B2D5B] text-[#0B2D5B] hover:bg-[#0B2D5B] hover:text-white uppercase font-black text-sm md:text-base px-6 py-[13px] rounded-md tracking-wider transition-colors">
              
              <Radar className="w-5 h-5" />
              Track Aircraft Live
            </Link>
          </div>

          <p className={`text-[11px] uppercase tracking-wider mt-6 font-semibold ${isDark ? "text-white/60" : "text-[#6B6560]"}`}>
           <Link to="/rewards" className="text-[#E8A83A] hover:underline">🎁 Earn rewards</Link> — refer professionals and unlock benefits.
          </p>
        </div>
      </section>

      {/* ———————— MARKET PULSE ———————— */}
      <MarketPulse />

      {/* ———————— NOT ANOTHER valuation / WHAT IT IS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">Why Choose ABOS</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2 max-w-3xl mx-auto leading-tight">
          Professional-Grade Intelligence, Transparency & Results
        </h2>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          <PillarCard
            icon={ShieldCheck}
            title="Complete Aircraft Reports"
            body="Professional aircraft intelligence with verified ownership history, condition analysis, and valuation data — comprehensive evaluation in one report." />
          
          <PillarCard
            icon={Percent}
            title="Commission Management"
            body="Transparent commission tracking and payment processing. Manage finder's fees, broker percentages, and payouts securely within the platform." />
          
          <PillarCard
            icon={Handshake}
            title="Professional Network"
            body="Direct access to verified dealers, brokers, and operators. Lead management, deal tracking, and secure communication all in one place." />
          
        </div>
      </section>

      {/* ———————— LIVE ZONE STATS ———————— */}
      <section className="bg-[#F7F4EF] border-y border-black/[0.06] py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#E8A83A] font-semibold text-center">Platform Overview</p>
          <h3 className="text-xl md:text-2xl font-black text-[#0B2D5B] text-center mt-1 uppercase tracking-tight">
            Active Inventory & Intelligence
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            <StatPill value={total_listings} label="Aircraft Listed" />
            <StatPill value={evaluated} label="Reports Generated" />
            <StatPill value={hot_deals} label="Featured Deals" />
            <StatPill value={avg_ati || "—"} label="Avg Report Score" />
          </div>
        </div>
      </section>

      {/* ———————— HOW IT WORKS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">How It Works</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2">
          Simple Process, Professional Results
        </h2>

        <div className="grid md:grid-cols-4 gap-6 mt-12">
          {[
          { n: "01", title: "Add Aircraft", body: "Import or list an aircraft to the platform. Generate a comprehensive intelligence report with verified history and condition analysis." },
          { n: "02", title: "Set Commission", body: "Establish commission percentages and finder's fees. Secure, transparent tracking of all stakeholders in each transaction." },
          { n: "03", title: "Share with Buyers", body: "Distribute aircraft information to verified brokers and professionals within your network. Professional presentation and secure communication." },
          { n: "04", title: "Close & Settle", body: "When the aircraft sells, the platform processes and distributes commissions to all participants transparently and securely." }].
          map((s) =>
          <div key={s.n} className="relative">
              <p className="text-5xl font-black text-[#E8A83A] leading-none">{s.n}</p>
              <h4 className="text-base font-black text-[#0B2D5B] uppercase mt-3 tracking-tight">{s.title}</h4>
              <p className="text-sm text-[#4A4845] mt-2 leading-relaxed">{s.body}</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm px-8 py-4 rounded-md tracking-wider transition-colors">

            Start Using ABOS <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ———————— WHO IT'S FOR ———————— */}
      <section className="bg-[#0B2D5B] text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">For Aviation Professionals</p>
          <h2 className="text-2xl md:text-3xl font-black text-center uppercase tracking-tight mt-2">
            Built For Dealers, Brokers & Operators
          </h2>

          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {[
            { icon: Users, title: "Aircraft Dealers", body: "Manage your inventory with verified intelligence reports. Showcase aircraft professionally and attract qualified buyers." },
            { icon: Handshake, title: "Brokers", body: "Close deals faster with secure escrow and transparent commission management. Professional tools for every transaction." },
            { icon: TrendingUp, title: "Operators", body: "Find quality aircraft, verify ownership and condition, and execute transactions securely with professional support." }].
            map((x) =>
            <div key={x.title} className="bg-white/5 backdrop-blur rounded-lg border border-white/10 p-6">
                <div className="w-12 h-12 rounded-full bg-[#E8A83A] flex items-center justify-center">
                  <x.icon className="w-5 h-5 text-[#0B2D5B]" strokeWidth={2.5} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mt-4">{x.title}</h4>
                <p className="text-sm text-white/75 mt-2 leading-relaxed">{x.body}</p>
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
            "Verified aircraft reports",
            "Secure escrow services",
            "Commission management",
            "Professional network",
            "Real-time tracking",
            "Transparent pricing"].
            map((x) =>
            <div key={x} className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[#E8A83A]" />
                {x}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ———————— RECENT CARDS + AI INSIGHTS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Featured</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight mt-1">Aircraft Reports</h2>
          </div>
          <Link to="/listings" className="text-sm font-black text-[#0B2D5B] uppercase tracking-wider hover:text-[#E8A83A] transition-colors flex items-center gap-1">
            View All Cards <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
          {listings.slice(0, 6).map((l) => {
              const score = l.ati_score || 0;
              const color = score >= 85 ? "#0F7A56" : score >= 65 ? "#E8A83A" : score > 0 ? "#C0392B" : "#AAA49C";
              return (
                <Link key={l.id} to={`/ati-passport/${l.id}`} className="block bg-white border border-black/[0.08] rounded-lg p-5 hover:border-[#0B2D5B] hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[#E8A83A] font-black">ATI ID</p>
                    <p className="text-xs uppercase tracking-wider text-[#6B6560] font-semibold font-mono mt-0.5">{l.registration || "—"}</p>
                    <p className="text-lg font-black text-[#1A1814] mt-1 truncate">
                      {l.year} {l.make} {l.model}
                    </p>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: color }}>
                    {score || "—"}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black/[0.06] flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold">Finder's Fee</p>
                  <p className="text-base font-black text-[#0B2D5B]">%</p>
                </div>
              </Link>);

            })}
          {listings.length === 0 &&
            <div className="sm:col-span-2 text-center py-16 text-[#AAA49C]">
              <Plane className="w-10 h-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">No aircraft reports available yet.</p>
            </div>
            }
          </div>

          {/* AI Insights side panel */}
          <div className="lg:sticky lg:top-16 lg:self-start">
            <AIInsightsPanel />
          </div>
        </div>
      </section>

      {/* ———————— FOOTER CTA ———————— */}
      <section className="bg-[#F7F4EF] border-t border-black/[0.06] py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight">
          One Platform. <span className="text-[#0B2D5B]">Professional Standards.</span> <span className="text-[#E8A83A]">Results That Matter.</span>
        </h2>
        <p className="text-[#4A4845] text-sm md:text-base mt-3 max-w-2xl mx-auto">
          ABOS is the trusted platform for aviation professionals who demand transparency, efficiency, and results.
        </p>
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm px-8 py-4 rounded-md tracking-wider transition-colors mt-8">

          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>);

}