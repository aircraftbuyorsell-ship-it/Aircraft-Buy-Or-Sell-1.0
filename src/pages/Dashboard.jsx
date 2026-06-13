import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, Plane, Radar, Handshake, TrendingUp,
  ArrowRight, CheckCircle2, Users,
  ChevronUp, ChevronDown, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import MarketForecastCharts from "@/components/dashboard/MarketForecastCharts";
import LiveTrafficBadge from "@/components/dashboard/LiveTrafficBadge";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import RotatingGlobe from "@/components/dashboard/RotatingGlobe";
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

// ─── HUD Panel ───────────────────────────────────────────────────
function HudPanel({ children, className = "", accent = false, style = {}, isDark = true }) {
  const bg = isDark
    ? (accent ? "linear-gradient(135deg, rgba(0,245,255,0.08), rgba(122,0,255,0.06))" : "rgba(13,20,50,0.70)")
    : (accent ? "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(99,102,241,0.04))" : "rgba(255,255,255,0.85)");
  const border = isDark
    ? `1px solid ${accent ? "rgba(0,245,255,0.30)" : "rgba(0,245,255,0.12)"}`
    : `1px solid ${accent ? "rgba(37,99,235,0.20)" : "rgba(0,0,0,0.06)"}`;
  const shadow = isDark
    ? (accent ? "0 0 40px rgba(0,245,255,0.08), inset 0 1px 0 rgba(0,245,255,0.15)" : "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,245,255,0.08)")
    : (accent ? "0 4px 20px rgba(37,99,235,0.06), inset 0 1px 0 rgba(255,255,255,0.90)" : "0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.90)");
  const topLine = isDark
    ? "linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent)"
    : "linear-gradient(90deg, transparent, rgba(37,99,235,0.15), transparent)";
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: bg, backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border, boxShadow: shadow, ...style }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: topLine, pointerEvents: "none" }} />
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
  const textColor = isDark ? "#ffffff" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const subtleColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const accentViolet = isDark ? "#7a00ff" : "#7c3aed";
  const accentGold = "#E8A83A";
  const accentRed = isDark ? "#ff4d6d" : "#dc2626";

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
      <NotificationStack />
      <NotificationCenter />

      {/* ══════════════════════════════════════════════
          HERO — GLOBE + FLOATING HUD PANELS
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "540px", background: isDark ? "#0A081E" : "#f0f4ff" }}>
        <div className="absolute inset-0 pointer-events-none">
          <RotatingGlobe theme={isDark ? "dark" : "light"} className="absolute inset-0 w-full h-full" listings={listings} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: isDark
            ? "linear-gradient(120deg, rgba(10,8,30,0.92) 0%, rgba(10,8,30,0.70) 40%, rgba(10,8,30,0.35) 65%, rgba(10,8,30,0.15) 100%)"
            : "linear-gradient(120deg, rgba(240,244,255,0.92) 0%, rgba(240,244,255,0.75) 40%, rgba(240,244,255,0.45) 65%, rgba(240,244,255,0.20) 100%)"
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: isDark
            ? "linear-gradient(to bottom, transparent, rgba(10,8,30,0.95))"
            : "linear-gradient(to bottom, transparent, rgba(240,244,255,0.95))"
        }} />

        <div className="relative px-4 md:px-8 pt-8 pb-14">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: accentCyan }}>ABOS MarketSpace · Aviation Intelligence</p>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none mt-0.5" style={{ color: textColor }}>
                ABOS<br />
                <span style={{ background: `linear-gradient(90deg,${accentCyan},${accentViolet})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  MarketSpace
                </span>
              </h1>
              <p className="text-[11px] mt-1.5 font-medium tracking-wide" style={{ color: mutedColor }}>Buy. Sell. Verify.</p>
            </div>
            <SystemStatus isDark={isDark} />
          </div>

          <div className="h-12 mb-6 opacity-60">
            <FlowRibbon isDark={isDark} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: "1", label: "Listings", color: accentCyan, icon: Plane, metric: total_listings, sub: "On market", link: "/listings" },
              { n: "2", label: "ATI Intelligence", color: accentViolet, icon: ShieldCheck, metric: evaluated, sub: "Evaluated", delta: avg_ati ? `Avg ${avg_ati}` : "—", link: "/listings" },
              { n: "3", label: "ADS-B Radar", color: accentGold, icon: Radar, metric: "Live", sub: "ADS-B feed", link: "/traffic" },
              { n: "4", label: "Deal Radar", color: accentRed, icon: TrendingUp, metric: hot_deals, sub: "Score ≥ 8.5", link: "/deal-radar" },
            ].map((m) => (
              <Link key={m.n} to={m.link}>
                <HudPanel className="p-4 hover:scale-[1.02] transition-transform cursor-pointer h-full" accent={m.n === "1"} isDark={isDark}>
                  <p className="text-[8px] uppercase tracking-[0.2em] font-black mb-2" style={{ color: m.color }}>{m.n}. {m.label}</p>
                  <div className="flex items-end justify-between gap-2 mb-2">
                    <MetricWidget label={m.label} value={m.metric} sub={m.sub} delta={m.delta} deltaUp isDark={isDark} />
                    <m.icon className="w-7 h-7 opacity-25" style={{ color: m.color }} />
                  </div>
                  <Sparkline color={m.color} up={m.n !== "3"} />
                  <p className="text-[9px] font-semibold mt-1 flex items-center gap-1" style={{ color: m.color }}>
                    <span className="w-1 h-1 rounded-full animate-pulse inline-block" style={{ backgroundColor: m.color }} />Live
                  </p>
                </HudPanel>
              </Link>
            ))}
          </div>

          <div className="h-10 my-4 opacity-40">
            <FlowRibbon isDark={isDark} />
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-center">
            {[
              { label: "ATI Report", icon: ShieldCheck, link: "/listings", color: accentCyan },
              { label: "Pre-Buy AI", icon: Plane, link: "/pre-buy-inspection", color: accentGold },
              { label: "Live Tracking", icon: Radar, link: "/traffic", color: isDark ? "rgba(255,255,255,0.75)" : "#475569" },
              { label: "Secure Escrow", icon: Handshake, link: "/escrow", color: isDark ? "rgba(255,255,255,0.75)" : "#475569" },
            ].map((cta) => (
              <Link key={cta.label} to={cta.link}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95 glass-pill"
                style={{ color: cta.color }}>
                <cta.icon className="w-4 h-4" /> {cta.label}
              </Link>
            ))}
            <LiveTrafficBadge />
          </div>
        </div>
      </section>

      {/* KPI STRIP */}
      <section className="px-4 md:px-8 py-6">
        <HudPanel className="p-5 md:p-7" accent isDark={isDark}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-black" style={{ color: accentCyan }}>Aviation Intelligence Core</p>
                  <h3 className="text-lg font-black mt-0.5" style={{ color: textColor }}>Global Market Overview</h3>
                </div>
                <SystemStatus label="LIVE" isDark={isDark} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <MetricWidget label="Total Listings" value={total_listings.toLocaleString()} sub="Active aircraft" delta="+Live" deltaUp isDark={isDark} />
                <MetricWidget label="ATI Evaluated" value={`${evaluated}`} sub="Reports issued" delta={`${evaluated > 0 ? Math.round((evaluated/Math.max(total_listings,1))*100) : 0}%`} deltaUp isDark={isDark} />
                <MetricWidget label="Hot Deals" value={hot_deals} sub="Score ≥ 8.5" delta={hot_deals > 0 ? "Active" : "—"} deltaUp isDark={isDark} />
                <MetricWidget label="Avg ATI Score" value={avg_ati || "—"} sub="Platform average" delta={avg_ati >= 80 ? "Strong" : avg_ati > 0 ? "Fair" : "—"} deltaUp={avg_ati >= 80} isDark={isDark} />
              </div>
            </div>
            <div className="w-full md:w-64 h-24">
              <p className="text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: mutedColor }}>Market Activity</p>
              <div className="h-16"><Sparkline color={accentCyan} up /></div>
            </div>
          </div>
        </HudPanel>
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
            { n: "03", color: accentGold, icon: Plane, title: "AI Pre-Buy Inspection", body: "On-site with Max AI — live visual analysis of airframe, corrosion, interior and maintenance discrepancies.", link: "/pre-buy-inspection" },
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
              return (
                <Link key={l.id} to={`/ati-passport/${l.id}`}>
                  <HudPanel className="p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer" isDark={isDark} style={{ borderColor: score > 0 ? `${sc}30` : undefined }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.2em] font-black" style={{ color: accentCyan }}>ATI Report</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: mutedColor }}>{l.registration || "—"}</p>
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