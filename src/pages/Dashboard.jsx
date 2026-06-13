import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, Plane, Radar, Handshake, TrendingUp,
  ArrowRight, CheckCircle2, Users,
  ChevronUp, ChevronDown, Lock, Zap, FileText, Globe, Map
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { detectRegType, getRegTypeColor } from "@/lib/regUtils";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import MarketForecastCharts from "@/components/dashboard/MarketForecastCharts";
import LiveTrafficBadge from "@/components/dashboard/LiveTrafficBadge";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeTrafficControls from "@/components/dashboard/GlobeTrafficControls";
import TrafficMapSection from "@/components/dashboard/TrafficMapSection";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

// ─── Animated neon line SVG ─────────────────────────────────────
function FlowRibbon({ className = "", isDark = true }) {
  const c1 = isDark ? "rgba(0,245,255," : "rgba(37,99,235,";
  const c2 = isDark ? "rgba(122,0,255," : "rgba(99,102,241,";
  return (
    <svg viewBox="0 0 600 120" className={`w-full ${className}`} preserveAspectRatio="none" style={{ filter: isDark ? "drop-shadow(0 0 8px rgba(0,245,255,0.5))" : "none" }}>
      <defs>
        <linearGradient id="ribGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`${c1}0)`} />
          <stop offset="30%" stopColor={`${c1}0.7)`} />
          <stop offset="70%" stopColor={`${c2}0.7)`} />
          <stop offset="100%" stopColor={`${c1}0)`} />
        </linearGradient>
        <linearGradient id="ribGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`${c1}0)`} />
          <stop offset="40%" stopColor={`${c1}0.4)`} />
          <stop offset="60%" stopColor={`${c2}0.5)`} />
          <stop offset="100%" stopColor={`${c1}0)`} />
        </linearGradient>
      </defs>
      <path d="M0,60 C100,20 200,100 300,60 C400,20 500,80 600,60" stroke="url(#ribGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M0,70 C120,40 220,90 300,65 C380,40 480,90 600,70" stroke="url(#ribGrad2)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M0,50 C80,70 180,30 300,55 C420,80 520,35 600,50" stroke="url(#ribGrad2)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// ─── System Status Badge ─────────────────────────────────────────
function SystemStatus({ label = "OPTIMAL", isDark = true }) {
  const accentColor = isDark ? "#00f5ff" : "#2563eb";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>System Status</span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}90` }} />
        <span className="text-[9px] uppercase tracking-[0.15em] font-black" style={{ color: accentColor }}>{label}</span>
      </div>
    </div>
  );
}

// ─── HUD Panel — frosted glass with specular rim (ref: glass HUD style) ───
function HudPanel({ children, className = "", accent = false, style = {}, isDark = true }) {
  const bg = isDark
    ? (accent
        ? "linear-gradient(150deg, rgba(120,160,190,0.14) 0%, rgba(40,70,100,0.10) 40%, rgba(0,245,255,0.05) 100%)"
        : "linear-gradient(150deg, rgba(110,140,175,0.12) 0%, rgba(25,45,75,0.55) 45%, rgba(15,30,55,0.65) 100%)")
    : (accent
        ? "linear-gradient(150deg, rgba(255,255,255,0.85) 0%, rgba(225,235,248,0.70) 55%, rgba(210,228,245,0.60) 100%)"
        : "linear-gradient(150deg, rgba(255,255,255,0.90) 0%, rgba(238,244,252,0.78) 60%, rgba(228,238,250,0.70) 100%)");
  const border = isDark
    ? `1px solid ${accent ? "rgba(140,230,245,0.40)" : "rgba(150,200,225,0.22)"}`
    : `1px solid ${accent ? "rgba(120,170,220,0.45)" : "rgba(140,170,205,0.30)"}`;
  const shadow = isDark
    ? (accent
        ? "0 0 44px rgba(0,245,255,0.10), 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 1px rgba(220,250,255,0.35), inset 0 -1px 1px rgba(0,245,255,0.08)"
        : "0 24px 60px rgba(0,0,0,0.50), inset 0 1px 1px rgba(200,235,250,0.25), inset 0 -1px 1px rgba(120,180,210,0.06)")
    : (accent
        ? "0 8px 32px rgba(70,110,160,0.14), inset 0 1.5px 1px rgba(255,255,255,1), inset 0 -1px 1px rgba(150,185,220,0.25)"
        : "0 6px 24px rgba(70,110,160,0.10), inset 0 1.5px 1px rgba(255,255,255,1), inset 0 -1px 1px rgba(150,185,220,0.20)");
  const topLine = isDark
    ? "linear-gradient(90deg, transparent 5%, rgba(230,252,255,0.65) 30%, rgba(0,245,255,0.50) 60%, transparent 95%)"
    : "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.95) 30%, rgba(160,200,240,0.60) 60%, transparent 95%)";
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: bg, backdropFilter: "blur(28px) saturate(170%)", WebkitBackdropFilter: "blur(28px) saturate(170%)", border, boxShadow: shadow, ...style }}>
      {/* Specular top rim */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1.5px", background: topLine, pointerEvents: "none", zIndex: 1 }} />
      {/* Diagonal glass sheen */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: isDark
          ? "linear-gradient(115deg, rgba(210,240,250,0.10) 0%, rgba(210,240,250,0.03) 25%, transparent 45%)"
          : "linear-gradient(115deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.25) 25%, transparent 45%)",
      }} />
      {/* Corner glint */}
      <div style={{
        position: "absolute", top: "-20px", left: "8%", width: "90px", height: "40px", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(ellipse at center, rgba(230,252,255,0.22) 0%, transparent 70%)"
          : "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, transparent 70%)",
        filter: "blur(4px)",
      }} />
      {children}
    </div>
  );
}

// ─── Metric widget ───────────────────────────────────────────────
function MetricWidget({ label, value, sub, delta, deltaUp, isDark = true }) {
  const textColor = isDark ? "#ffffff" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
  const upColor = isDark ? "#00f5ff" : "#2563eb";
  const downColor = isDark ? "#ff4d6d" : "#dc2626";
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: muted }}>{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color: textColor }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: muted }}>{sub}</p>}
      {delta != null && (
        <div className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: deltaUp ? upColor : downColor }}>
          {deltaUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── Mini sparkline ──────────────────────────────────────────────
function Sparkline({ color = "#00f5ff", up = true }) {
  const pts = up ? "0,28 15,22 30,24 45,16 60,18 75,10 90,12 105,4 120,6" : "0,6 15,12 30,8 45,18 60,16 75,22 90,20 105,26 120,28";
  return (
    <svg viewBox="0 0 120 32" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spk${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── ATI Score Ring ──────────────────────────────────────────────
function ATIRing({ score, size = 56 }) {
  if (!score) return null;
  const color = score >= 90 ? "#2563eb" : score >= 72 ? "#7c3aed" : score >= 54 ? "#D4A017" : "#dc2626";
  const pct = (score / 120) * 113.1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}20`} strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct} 113.1`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────
function SectionHeader({ overline, title, isDark = true }) {
  return (
    <div className="mb-6">
      <p className="text-[9px] uppercase tracking-[0.3em] font-black mb-1" style={{ color: isDark ? "#00f5ff" : "#2563eb" }}>{overline}</p>
      <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight" style={{ color: isDark ? "#ffffff" : "#1e293b" }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const isDark = useTheme();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [trafficSearch, setTrafficSearch] = useState("");
  const [trafficRefreshKey, setTrafficRefreshKey] = useState(0);
  const [trafficView, setTrafficView] = useState("2d"); // "2d" | "3d"
  const textColor = isDark ? "#ffffff" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const subtleColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const accentViolet = isDark ? "#7a00ff" : "#7c3aed";
  const accentGold = "#E8A83A";
  const accentRed = isDark ? "#ff4d6d" : "#dc2626";

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 5000)
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
  const faaCount = listings.filter((l) => detectRegType(l.registration) === "faa").length;
  const easaCount = listings.filter((l) => detectRegType(l.registration) === "easa").length;

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <NotificationStack />
      <NotificationCenter />

      {/* ══════════════════════════════════════════════
          HEADER BAR
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: accentCyan }}>ABOS MarketSpace · Aviation Intelligence</p>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none mt-0.5" style={{ color: textColor }}>
              <span style={{ background: `linear-gradient(90deg,${accentCyan},${accentViolet})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                MarketSpace
              </span>
            </h1>
          </div>
          <SystemStatus isDark={isDark} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MAIN GRID — Unified Traffic Panel (2D/3D toggle) + Sidebar
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 pb-4">
        <div className="grid lg:grid-cols-[1fr_380px] gap-4">
          
          {/* LEFT — Unified Traffic Panel with 2D/3D toggle */}
          <div className="min-h-0 flex flex-col">
            {/* View toggle bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="glass-pill flex items-center p-0.5 gap-0.5" style={{
                background: isDark ? "rgba(122,0,255,0.06)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(0,245,255,0.12)" : "1px solid rgba(0,0,0,0.08)"
              }}>
                <button
                  onClick={() => setTrafficView("2d")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all"
                  style={{
                    background: trafficView === "2d" 
                      ? (isDark ? "rgba(0,245,255,0.15)" : "rgba(37,99,235,0.12)")
                      : "transparent",
                    color: trafficView === "2d" 
                      ? (isDark ? "#00f5ff" : "#2563eb")
                      : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)")
                  }}>
                  <Map className="w-3 h-3" /> 2D Map
                </button>
                <button
                  onClick={() => setTrafficView("3d")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all"
                  style={{
                    background: trafficView === "3d"
                      ? (isDark ? "rgba(0,245,255,0.15)" : "rgba(37,99,235,0.12)")
                      : "transparent",
                    color: trafficView === "3d"
                      ? (isDark ? "#00f5ff" : "#2563eb")
                      : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)")
                  }}>
                  <Globe className="w-3 h-3" /> 3D Globe
                </button>
              </div>
              <div className="flex-1" />
              <GlobeTrafficControls
                onSearch={(q) => setTrafficSearch(q)}
                onRefresh={() => setTrafficRefreshKey(k => k + 1)}
                listingCount={listings.length}
                compact
              />
            </div>

            {/* View content — 2D map or 3D globe */}
            <div className="flex-1 relative rounded-2xl overflow-hidden" style={{ 
              minHeight: "520px",
              background: trafficView === "3d" ? (isDark ? "#0A081E" : "#e8ecf4") : "transparent",
              border: trafficView === "3d" 
                ? (isDark ? "1px solid rgba(0,245,255,0.15)" : "1px solid rgba(0,0,0,0.08)") 
                : "none",
              boxShadow: trafficView === "3d"
                ? (isDark ? "0 12px 40px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.06)")
                : "none"
            }}>
              {trafficView === "2d" ? (
                <TrafficMapSection
                  key={trafficRefreshKey}
                  globalSearch={trafficSearch}
                  onClearSearch={() => setTrafficSearch("")}
                />
              ) : (
                <SkyBossGlobe className="absolute inset-0 w-full h-full" listings={listings} onSelectListing={(l) => window.location.href = `/ati-passport/${l.id}`} />
              )}
            </div>
          </div>

          {/* RIGHT — Metric sidebar */}
          <div className="flex flex-col gap-3">
            {/* Quick-link pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "ATI Report", icon: ShieldCheck, link: "/listings", color: accentCyan },
                { label: "Pre-Buy", icon: Plane, link: "/pre-buy-inspection", color: accentGold },
                { label: "Escrow", icon: Handshake, link: "/escrow", color: isDark ? "rgba(255,255,255,0.75)" : "#475569" },
              ].map((cta) => (
                <Link key={cta.label} to={cta.link}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 glass-pill"
                  style={{ color: cta.color }}>
                  <cta.icon className="w-3 h-3" /> {cta.label}
                </Link>
              ))}
              <LiveTrafficBadge />
            </div>

            {/* Metric cards stack */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { color: accentCyan, icon: Plane, label: "Active Listings", value: total_listings.toLocaleString(), sub: `${evaluated} evaluated`, link: "/listings" },
                { color: accentViolet, icon: ShieldCheck, label: "ATI Intel", value: evaluated, sub: avg_ati ? `Avg score: ${avg_ati}` : "No scores", link: "/listings" },
                { color: accentGold, icon: Radar, label: "ADS-B Feed", value: "Live", sub: "Real-time tracking", link: "/traffic" },
                { color: accentRed, icon: TrendingUp, label: "Hot Deals", value: hot_deals, sub: "Score ≥ 8.5", link: "/deal-radar" },
              ].map((m) => (
                <Link key={m.label} to={m.link}>
                  <HudPanel className="p-3 h-full hover:scale-[1.02] transition-transform cursor-pointer" accent isDark={isDark} style={{ borderColor: `${m.color}35` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                        <m.icon className="w-3 h-3" style={{ color: m.color }} />
                      </div>
                      <p className="text-[8px] uppercase tracking-[0.15em] font-black" style={{ color: mutedColor }}>{m.label}</p>
                    </div>
                    <p className="text-base font-black leading-none" style={{ color: textColor }}>{m.value}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: mutedColor }}>{m.sub}</p>
                  </HudPanel>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION STATUS */}
      <section className="px-4 md:px-8 pt-2 pb-4">
        <SubscriptionBadge />
      </section>

      {/* ATI TOOLS */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="ATI Scoring Tools" title="Instant Aircraft Intelligence" isDark={isDark} />
        </div>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          {[
            { n: "FREE", color: accentCyan, icon: Zap, title: "ATI Quick Score", body: "Paste any listing text or N-number. Get an instant 8-dimension scorecard, OMVM range, deal score and a single buyer alert — no document output.", link: "/ati-quick-score", badge: "Free · Instant" },
            { n: "PRO", color: accentGold, icon: FileText, title: "ATI Full Report", body: "Professional aircraft appraisal: 8-dimension scoring, executive summary, strengths, risks, recommendations, identity table and branded .docx export.", link: "/ati-full-report", badge: "Pro · Export" },
          ].map((m) => (
            <Link key={m.n} to={m.link}>
              <HudPanel className="p-5 h-full hover:scale-[1.01] transition-transform cursor-pointer" isDark={isDark} style={{ borderColor: `${m.color}35` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${m.color}15`, border: `1px solid ${m.color}35` }}>
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider"
                      style={{ background: `${m.color}15`, color: m.color }}>{m.badge}</span>
                  </div>
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-tight mb-2" style={{ color: textColor }}>{m.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{m.body}</p>
                <div className="mt-4 pt-3 border-t flex items-center gap-1 text-[10px] font-bold"
                  style={{ borderColor: `${m.color}20`, color: m.color }}>
                  Launch Tool <ArrowRight className="w-3 h-3" />
                </div>
              </HudPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* 4-CAPABILITY MODULES */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Platform Capabilities" title="Integrated Intelligence Modules" isDark={isDark} />
          <SystemStatus label="OPTIMAL" isDark={isDark} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { n: "01", color: accentCyan, icon: ShieldCheck, title: "ATI Transaction Report", body: "8-dimension risk scoring — documentation integrity, engine condition, avionics, operational history, transaction readiness.", link: "/listings" },
            { n: "02", color: accentViolet, icon: Radar, title: "ADS-B Surveillance", body: "Real-time aircraft tracking by N-number or Mode-S hex. Live position, altitude, speed and 7-day operational history.", link: "/traffic" },
            { n: "03", color: accentGold, icon: Plane, title: "Pre-Buy Inspection", body: "On-site with Max — live visual analysis of airframe, corrosion, interior and maintenance discrepancies.", link: "/pre-buy-inspection" },
            { n: "04", color: accentRed, icon: Handshake, title: "Escrow & Commission", body: "Protected buyer-seller escrow with automated commission splits, finder's fees and full payout audit trail.", link: "/escrow" },
          ].map((m) => (
            <Link key={m.n} to={m.link}>
              <HudPanel className="p-5 h-full hover:scale-[1.01] transition-transform cursor-pointer" isDark={isDark} style={{ borderColor: `${m.color}30` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${m.color}15`, border: `1px solid ${m.color}35` }}>
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <span className="text-4xl font-black leading-none" style={{ color: `${m.color}35` }}>{m.n}</span>
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-tight mb-2" style={{ color: textColor }}>{m.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{m.body}</p>
                <div className="mt-4 pt-3 border-t flex items-center gap-1 text-[10px] font-bold"
                  style={{ borderColor: `${m.color}20`, color: m.color }}>
                  Access Module <ArrowRight className="w-3 h-3" />
                </div>
              </HudPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* AIRCRAFT LISTINGS */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Active Listings" title="ATI-Evaluated Aircraft" isDark={isDark} />
          <Link to="/listings" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider hover:opacity-80 transition-opacity" style={{ color: accentCyan }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {listings.slice(0, 6).map((l) => {
              const score = l.ati_score || 0;
              const sc = score >= 90 ? accentCyan : score >= 72 ? accentViolet : score >= 54 ? accentGold : score > 0 ? accentRed : subtleColor;
              const regType = detectRegType(l.registration);
              const regColor = getRegTypeColor(regType, isDark);
              return (
                <Link key={l.id} to={`/ati-passport/${l.id}`}>
                  <HudPanel className="p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer" isDark={isDark} style={{ borderColor: score > 0 ? `${sc}30` : undefined }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.2em] font-black" style={{ color: accentCyan }}>ATI Report</p>
                        <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1.5" style={{ color: mutedColor }}>
                          {l.registration || "—"}
                          {regType && (
                            <span className="text-[7px] font-black px-1 py-0.5 rounded"
                              style={{ color: regColor, background: `${regColor}15`, border: `1px solid ${regColor}30` }}>
                              {regType === "faa" ? "N-Reg" : regType === "easa" ? "EASA" : ""}
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-black mt-1 truncate leading-tight" style={{ color: textColor }}>{l.year} {l.make} {l.model}</p>
                      </div>
                      <ATIRing score={score || null} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: mutedColor }}>
                        {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "On request"}
                      </p>
                      <p className="text-[9px] font-black" style={{ color: sc }}>
                        {score >= 90 ? "EXCEPTIONAL" : score >= 75 ? "STRONG BUY" : score >= 60 ? "FAIR" : score > 0 ? "CAUTION" : "UNSCORED"}
                      </p>
                    </div>
                  </HudPanel>
                </Link>
              );
            })}
            {listings.length === 0 && (
              <div className="sm:col-span-2 xl:col-span-3 py-16 text-center" style={{ color: subtleColor }}>
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

      {/* MARKET FORECAST */}
      <section className="px-4 md:px-8 py-6">
        <SectionHeader overline="Market Intelligence" title="Aviation Market Forecast" isDark={isDark} />
        <MarketForecastCharts />
      </section>

      {/* WHO WE SERVE */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Who We Serve" title="Purpose-Built for Aviation Professionals" isDark={isDark} />
          <SystemStatus label="OPTIMAL" isDark={isDark} />
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, color: accentCyan, title: "Aircraft Dealers", body: "Manage your active inventory with verified ATI intelligence reports. Present aircraft professionally to institutional buyers." },
            { icon: Handshake, color: accentViolet, title: "Aviation Brokers", body: "Originate, structure and close deals with confidence. Secure escrow, automated commission management and deal pipeline." },
            { icon: TrendingUp, color: accentGold, title: "Operators & Acquirers", body: "Source quality off-market aircraft, verify title and airworthiness, and execute acquisitions through a structured process." }
          ].map((x) => (
            <HudPanel key={x.title} className="p-5" isDark={isDark} style={{ borderColor: `${x.color}25` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${x.color}12`, border: `1px solid ${x.color}30` }}>
                <x.icon className="w-5 h-5" style={{ color: x.color }} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2" style={{ color: textColor }}>{x.title}</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{x.body}</p>
            </HudPanel>
          ))}
        </div>
        <HudPanel className="p-5" isDark={isDark}>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {["ATI Transaction Reports", "Secure Escrow Execution", "Commission & Fee Management", "Verified Professional Network", "Real-Time ADS-B Surveillance", "Transparent Deal Pricing"].map((x) => (
              <div key={x} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accentCyan }} />
                <span className="text-[11px] font-medium" style={{ color: mutedColor }}>{x}</span>
              </div>
            ))}
          </div>
        </HudPanel>
      </section>

      {/* FOOTER CTA */}
      <section className="px-4 md:px-8 py-10 text-center">
        <div className="h-12 mb-6 opacity-40">
          <FlowRibbon isDark={isDark} />
        </div>
        <HudPanel className="max-w-2xl mx-auto p-8 md:p-10" accent isDark={isDark}>
          <Lock className="w-8 h-8 mx-auto mb-4" style={{ color: accentCyan }} />
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3" style={{ color: textColor }}>
            One Platform. <span style={{ color: accentCyan }}>Institutional Standards.</span>{" "}
            <span style={{ color: accentGold }}>Verified Results.</span>
          </h2>
          <p className="text-[12px] mb-6 max-w-lg mx-auto leading-relaxed" style={{ color: mutedColor }}>
            ABOS is the private intelligence network trusted by aviation dealers and brokers who require rigorous transaction due diligence, secure deal execution, and auditable outcomes.
          </p>
          <Link to="/listings"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95"
            style={{ background: `${accentCyan}15`, border: `1px solid ${accentCyan}40`, color: accentCyan }}>
            Enter the Platform <ArrowRight className="w-4 h-4" />
          </Link>
        </HudPanel>
      </section>

      <AircraftWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}