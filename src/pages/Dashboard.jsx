import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, Plane, Radar, Handshake, TrendingUp,
  ArrowRight, CheckCircle2, Users,
  ChevronUp, ChevronDown, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import MarketForecastCharts from "@/components/dashboard/MarketForecastCharts";
import LiveTrafficBadge from "@/components/dashboard/LiveTrafficBadge";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import RotatingGlobe from "@/components/dashboard/RotatingGlobe";

// ─── Animated neon line SVG ─────────────────────────────────────
function FlowRibbon({ className = "" }) {
  return (
    <svg viewBox="0 0 600 120" className={`w-full ${className}`} preserveAspectRatio="none" style={{ filter: "drop-shadow(0 0 8px rgba(0,245,255,0.5))" }}>
      <defs>
        <linearGradient id="ribGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0,245,255,0)" />
          <stop offset="30%" stopColor="rgba(0,245,255,0.7)" />
          <stop offset="70%" stopColor="rgba(122,0,255,0.7)" />
          <stop offset="100%" stopColor="rgba(0,245,255,0)" />
        </linearGradient>
        <linearGradient id="ribGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0,245,255,0)" />
          <stop offset="40%" stopColor="rgba(0,245,255,0.4)" />
          <stop offset="60%" stopColor="rgba(122,0,255,0.5)" />
          <stop offset="100%" stopColor="rgba(0,245,255,0)" />
        </linearGradient>
      </defs>
      <path d="M0,60 C100,20 200,100 300,60 C400,20 500,80 600,60" stroke="url(#ribGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M0,70 C120,40 220,90 300,65 C380,40 480,90 600,70" stroke="url(#ribGrad2)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M0,50 C80,70 180,30 300,55 C420,80 520,35 600,50" stroke="url(#ribGrad2)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// ─── System Status Badge ─────────────────────────────────────────
function SystemStatus({ label = "OPTIMAL" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">System Status</span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.25)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" style={{ boxShadow: "0 0 6px rgba(0,245,255,0.9)" }} />
        <span className="text-[9px] uppercase tracking-[0.15em] text-[#00f5ff] font-black">{label}</span>
      </div>
    </div>
  );
}

// ─── HUD Panel (glassmorphism card with cyan border) ────────────
function HudPanel({ children, className = "", accent = false, style = {} }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(0,245,255,0.08) 0%, rgba(122,0,255,0.06) 100%)"
          : "rgba(13,20,50,0.70)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: `1px solid ${accent ? "rgba(0,245,255,0.30)" : "rgba(0,245,255,0.12)"}`,
        boxShadow: accent
          ? "0 0 40px rgba(0,245,255,0.08), inset 0 1px 0 rgba(0,245,255,0.15)"
          : "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,245,255,0.08)",
        ...style
      }}
    >
      {/* Top specular line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

// ─── Metric widget ───────────────────────────────────────────────
function MetricWidget({ label, value, sub, delta, deltaUp }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">{label}</p>
      <p className="text-2xl font-black text-white leading-none" style={{ textShadow: "0 0 20px rgba(0,245,255,0.3)" }}>{value}</p>
      {sub && <p className="text-[10px] text-white/40">{sub}</p>}
      {delta != null && (
        <div className={`flex items-center gap-0.5 text-[10px] font-bold ${deltaUp ? "text-[#00f5ff]" : "text-[#ff4d6d]"}`}>
          {deltaUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── Mini sparkline (pure CSS/SVG) ──────────────────────────────
function Sparkline({ color = "#00f5ff", up = true }) {
  const pts = up
    ? "0,28 15,22 30,24 45,16 60,18 75,10 90,12 105,4 120,6"
    : "0,6 15,12 30,8 45,18 60,16 75,22 90,20 105,26 120,28";
  return (
    <svg viewBox="0 0 120 32" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spk${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
}

// ─── ATI Score Ring ──────────────────────────────────────────────
function ATIRing({ score, size = 56 }) {
  if (!score) return null;
  const color = score >= 90 ? "#00f5ff" : score >= 72 ? "#7a00ff" : score >= 54 ? "#E8A83A" : "#ff4d6d";
  const pct = (score / 120) * 113.1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}25`} strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} 113.1`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────
function SectionHeader({ overline, title }) {
  return (
    <div className="mb-6">
      <p className="text-[9px] uppercase tracking-[0.3em] font-black text-[#00f5ff] mb-1">{overline}</p>
      <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight"
        style={{ textShadow: "0 0 30px rgba(0,245,255,0.2)" }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const [wizardOpen, setWizardOpen] = useState(false);

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
    <div className="min-h-screen" style={{ background: "transparent" }}>

      {/* ══════════════════════════════════════════════
          HERO — GLOBE + FLOATING HUD PANELS
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "540px" }}>
        {/* Full-bleed rotating globe */}
        <div className="absolute inset-0 pointer-events-none">
          <RotatingGlobe theme="dark" className="absolute inset-0 w-full h-full" />
        </div>

        {/* Deep gradient overlay — stronger on left/bottom, transparent on right where globe shines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(120deg, rgba(10,8,30,0.92) 0%, rgba(10,8,30,0.70) 40%, rgba(10,8,30,0.35) 65%, rgba(10,8,30,0.15) 100%)"
        }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: "linear-gradient(to bottom, transparent, rgba(10,8,30,0.95))"
        }} />

        {/* Ambient cyan/violet orbs */}
        <div className="absolute top-8 left-1/3 w-96 h-48 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(0,245,255,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative px-4 md:px-8 pt-8 pb-14">
          {/* Top status bar */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#00f5ff] font-black">ABOS · Aviation Intelligence Platform</p>
              <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight mt-0.5"
                style={{ textShadow: "0 0 40px rgba(0,245,255,0.30)" }}>
                Integrated Dashboard
              </h1>
            </div>
            <SystemStatus />
          </div>

          {/* Flow ribbon */}
          <div className="h-12 mb-6 opacity-60">
            <FlowRibbon />
          </div>

          {/* 4-module HUD grid — glass panels floating over globe */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Listings */}
            <Link to="/listings">
              <HudPanel className="p-4 hover:scale-[1.02] transition-transform cursor-pointer h-full" accent>
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#00f5ff] font-black mb-2">1. Listings</p>
                <div className="flex items-end justify-between gap-2 mb-2">
                  <MetricWidget label="Active Aircraft" value={total_listings} sub="On market" delta="+Live" deltaUp />
                  <Plane className="w-7 h-7 text-[#00f5ff] opacity-25" />
                </div>
                <Sparkline color="#00f5ff" up />
                <p className="text-[9px] text-[#00f5ff] font-semibold mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#00f5ff] animate-pulse inline-block" />Live inc
                </p>
              </HudPanel>
            </Link>

            {/* 2. ATI Intelligence */}
            <Link to="/listings">
              <HudPanel className="p-4 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#7a00ff] font-black mb-2">2. ATI Intelligence</p>
                <div className="flex items-end justify-between gap-2 mb-2">
                  <MetricWidget label="Reports Issued" value={evaluated} sub="Evaluated" delta={avg_ati ? `Avg ${avg_ati}` : "—"} deltaUp />
                  <ShieldCheck className="w-7 h-7 text-[#7a00ff] opacity-25" />
                </div>
                <Sparkline color="#7a00ff" up />
                <p className="text-[9px] text-[#7a00ff] font-semibold mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#7a00ff] animate-pulse inline-block" />Live inc
                </p>
              </HudPanel>
            </Link>

            {/* 3. ADS-B Radar */}
            <Link to="/traffic">
              <HudPanel className="p-4 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#E8A83A] font-black mb-2">3. ADS-B Radar</p>
                <div className="flex items-end justify-between gap-2 mb-2">
                  <MetricWidget label="Surveillance" value="Live" sub="ADS-B feed" />
                  <Radar className="w-7 h-7 text-[#E8A83A] opacity-25" />
                </div>
                <Sparkline color="#E8A83A" up={false} />
                <p className="text-[9px] text-[#E8A83A] font-semibold mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#E8A83A] animate-pulse inline-block" />Live inc
                </p>
              </HudPanel>
            </Link>

            {/* 4. Deal Radar */}
            <Link to="/deal-radar">
              <HudPanel className="p-4 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#ff4d6d] font-black mb-2">4. Deal Radar</p>
                <div className="flex items-end justify-between gap-2 mb-2">
                  <MetricWidget label="Hot Opportunities" value={hot_deals} sub="Score ≥ 8.5" delta="+Scanning" deltaUp />
                  <TrendingUp className="w-7 h-7 text-[#ff4d6d] opacity-25" />
                </div>
                <Sparkline color="#ff4d6d" up />
                <p className="text-[9px] text-[#ff4d6d] font-semibold mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#ff4d6d] animate-pulse inline-block" />Live inc
                </p>
              </HudPanel>
            </Link>
          </div>

          {/* Flow ribbon 2 */}
          <div className="h-10 my-4 opacity-40">
            <FlowRibbon />
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <Link to="/listings"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,rgba(0,245,255,0.18),rgba(0,245,255,0.06))", border: "1px solid rgba(0,245,255,0.40)", color: "#00f5ff", boxShadow: "0 0 24px rgba(0,245,255,0.15)", backdropFilter: "blur(16px)" }}>
              <ShieldCheck className="w-4 h-4" /> ATI Report
            </Link>
            <Link to="/pre-buy-inspection"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,rgba(232,168,58,0.22),rgba(232,168,58,0.08))", border: "1px solid rgba(232,168,58,0.45)", color: "#E8A83A", boxShadow: "0 0 20px rgba(232,168,58,0.12)", backdropFilter: "blur(16px)" }}>
              <Plane className="w-4 h-4" /> Pre-Buy AI
            </Link>
            <Link to="/traffic"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)" }}>
              <Radar className="w-4 h-4" /> Live Tracking
            </Link>
            <Link to="/escrow"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)" }}>
              <Handshake className="w-4 h-4" /> Secure Escrow
            </Link>
            <LiveTrafficBadge />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          GLOBAL LIQUIDITY CORE — KPI STRIP
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 py-6">
        <HudPanel className="p-5 md:p-7" accent>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-[#00f5ff] font-black">Aviation Intelligence Core</p>
                  <h3 className="text-lg font-black text-white mt-0.5">Global Market Overview</h3>
                </div>
                <SystemStatus label="LIVE" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <MetricWidget label="Total Listings" value={total_listings.toLocaleString()} sub="Active aircraft" delta="+Live" deltaUp />
                <MetricWidget label="ATI Evaluated" value={`${evaluated}`} sub="Reports issued" delta={`${evaluated > 0 ? Math.round((evaluated/Math.max(total_listings,1))*100) : 0}%`} deltaUp />
                <MetricWidget label="Hot Deals" value={hot_deals} sub="Score ≥ 8.5" delta={hot_deals > 0 ? "Active" : "—"} deltaUp />
                <MetricWidget label="Avg ATI Score" value={avg_ati || "—"} sub="Platform average" delta={avg_ati >= 80 ? "Strong" : avg_ati > 0 ? "Fair" : "—"} deltaUp={avg_ati >= 80} />
              </div>
            </div>
            <div className="w-full md:w-64 h-24">
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/30 mb-1">Market Activity</p>
              <div className="h-16">
                <Sparkline color="#00f5ff" up />
              </div>
            </div>
          </div>
        </HudPanel>
      </section>

      {/* ══════════════════════════════════════════════
          4-CAPABILITY MODULES
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Platform Capabilities" title="Integrated Intelligence Modules" />
          <SystemStatus label="OPTIMAL" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              n: "01", color: "#00f5ff", icon: ShieldCheck,
              title: "ATI Transaction Report",
              body: "8-dimension risk scoring — documentation integrity, engine condition, avionics, operational history, transaction readiness.",
              link: "/listings"
            },
            {
              n: "02", color: "#7a00ff", icon: Radar,
              title: "ADS-B Surveillance",
              body: "Real-time aircraft tracking by N-number or Mode-S hex. Live position, altitude, speed and 7-day operational history.",
              link: "/traffic"
            },
            {
              n: "03", color: "#E8A83A", icon: Plane,
              title: "AI Pre-Buy Inspection",
              body: "On-site with Max AI — live visual analysis of airframe, corrosion, interior and maintenance discrepancies.",
              link: "/pre-buy-inspection"
            },
            {
              n: "04", color: "#ff4d6d", icon: Handshake,
              title: "Escrow & Commission",
              body: "Protected buyer-seller escrow with automated commission splits, finder's fees and full payout audit trail.",
              link: "/escrow"
            }
          ].map((m) => (
            <Link key={m.n} to={m.link}>
              <HudPanel className="p-5 h-full hover:scale-[1.01] transition-transform cursor-pointer"
                style={{ borderColor: `${m.color}22` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${m.color}15`, border: `1px solid ${m.color}35`, boxShadow: `0 0 12px ${m.color}20` }}>
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <span className="text-4xl font-black leading-none" style={{ color: `${m.color}30` }}>{m.n}</span>
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-tight text-white mb-2">{m.title}</h4>
                <p className="text-[11px] text-white/45 leading-relaxed">{m.body}</p>
                <div className="mt-4 pt-3 border-t flex items-center gap-1 text-[10px] font-bold"
                  style={{ borderColor: `${m.color}15`, color: m.color }}>
                  Access Module <ArrowRight className="w-3 h-3" />
                </div>
              </HudPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          AIRCRAFT LISTINGS + AI INSIGHTS
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Active Listings" title="ATI-Evaluated Aircraft" />
          <Link to="/listings" className="flex items-center gap-1 text-[10px] text-[#00f5ff] font-black uppercase tracking-wider hover:opacity-80 transition-opacity">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {listings.slice(0, 6).map((l) => {
              const score = l.ati_score || 0;
              const color = score >= 90 ? "#00f5ff" : score >= 72 ? "#7a00ff" : score >= 54 ? "#E8A83A" : score > 0 ? "#ff4d6d" : "#ffffff30";
              return (
                <Link key={l.id} to={`/ati-passport/${l.id}`}>
                  <HudPanel className="p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer"
                    style={{ borderColor: score > 0 ? `${color}25` : undefined }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-[#00f5ff] font-black">ATI Report</p>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{l.registration || "—"}</p>
                        <p className="text-sm font-black text-white mt-1 truncate leading-tight">
                          {l.year} {l.make} {l.model}
                        </p>
                      </div>
                      <ATIRing score={score || null} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">
                        {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "On request"}
                      </p>
                      <p className="text-[9px] font-black" style={{ color: score >= 80 ? "#00f5ff" : score >= 60 ? "#E8A83A" : "#ff4d6d" }}>
                        {score >= 90 ? "EXCEPTIONAL" : score >= 75 ? "STRONG BUY" : score >= 60 ? "FAIR" : score > 0 ? "CAUTION" : "UNSCORED"}
                      </p>
                    </div>
                  </HudPanel>
                </Link>
              );
            })}
            {listings.length === 0 && (
              <div className="sm:col-span-2 xl:col-span-3 py-16 text-center text-white/20">
                <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No aircraft reports available yet.</p>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <AIInsightsPanel />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MARKET FORECAST
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 py-6">
        <SectionHeader overline="Market Intelligence" title="Aviation Market Forecast" />
        <MarketForecastCharts />
      </section>

      {/* ══════════════════════════════════════════════
          WHO WE SERVE — CORRELATION PANEL
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Who We Serve" title="Purpose-Built for Aviation Professionals" />
          <SystemStatus label="OPTIMAL" />
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, color: "#00f5ff", title: "Aircraft Dealers", body: "Manage your active inventory with verified ATI intelligence reports. Present aircraft professionally to institutional buyers." },
            { icon: Handshake, color: "#7a00ff", title: "Aviation Brokers", body: "Originate, structure and close deals with confidence. Secure escrow, automated commission management and deal pipeline." },
            { icon: TrendingUp, color: "#E8A83A", title: "Operators & Acquirers", body: "Source quality off-market aircraft, verify title and airworthiness, and execute acquisitions through a structured process." }
          ].map((x) => (
            <HudPanel key={x.title} className="p-5" style={{ borderColor: `${x.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${x.color}12`, border: `1px solid ${x.color}30`, boxShadow: `0 0 16px ${x.color}15` }}>
                <x.icon className="w-5 h-5" style={{ color: x.color }} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2">{x.title}</h4>
              <p className="text-[11px] text-white/45 leading-relaxed">{x.body}</p>
            </HudPanel>
          ))}
        </div>

        {/* Feature checklist */}
        <HudPanel className="p-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {["ATI Transaction Reports", "Secure Escrow Execution", "Commission & Fee Management", "Verified Professional Network", "Real-Time ADS-B Surveillance", "Transparent Deal Pricing"].map((x) => (
              <div key={x} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00f5ff]" style={{ filter: "drop-shadow(0 0 4px rgba(0,245,255,0.6))" }} />
                <span className="text-[11px] text-white/60 font-medium">{x}</span>
              </div>
            ))}
          </div>
        </HudPanel>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER CTA
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 py-10 text-center">
        <div className="h-12 mb-6 opacity-40">
          <FlowRibbon />
        </div>
        <HudPanel className="max-w-2xl mx-auto p-8 md:p-10" accent>
          <Lock className="w-8 h-8 text-[#00f5ff] mx-auto mb-4" style={{ filter: "drop-shadow(0 0 8px rgba(0,245,255,0.5))" }} />
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-3"
            style={{ textShadow: "0 0 30px rgba(0,245,255,0.2)" }}>
            One Platform. <span style={{ color: "#00f5ff" }}>Institutional Standards.</span>{" "}
            <span style={{ color: "#E8A83A" }}>Verified Results.</span>
          </h2>
          <p className="text-[12px] text-white/45 mb-6 max-w-lg mx-auto leading-relaxed">
            ABOS is the private intelligence network trusted by aviation dealers and brokers who require rigorous transaction due diligence, secure deal execution, and auditable outcomes.
          </p>
          <Link to="/listings"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.20), rgba(0,245,255,0.08))", border: "1px solid rgba(0,245,255,0.40)", color: "#00f5ff", boxShadow: "0 0 30px rgba(0,245,255,0.15)" }}>
            Enter the Platform <ArrowRight className="w-4 h-4" />
          </Link>
        </HudPanel>
      </section>

      <AircraftWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}