import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, Plane, Radar, Handshake, TrendingUp,
  ArrowRight, CheckCircle2, Users,
  ChevronUp, ChevronDown, Lock, Zap, FileText, Globe, Map, Search,
  BarChart3, MessageCircle, Calculator } from
"lucide-react";
import DividerSection from "@/components/ui/DividerSection";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { detectRegType, getRegTypeColor } from "@/lib/regUtils";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import MarketForecastCharts from "@/components/dashboard/MarketForecastCharts";
import LiveTrafficBadge from "@/components/dashboard/LiveTrafficBadge";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeTrafficControls from "@/components/dashboard/GlobeTrafficControls";
import TrafficMapSection from "@/components/dashboard/TrafficMapSection";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

// ─── Clean panel — minimal card with subtle border ────────────────
function Panel({ children, className = "", accent = false, style = {}, isDark = true, translucent = false }) {
  const bg = translucent 
    ? (isDark ? "rgba(22,22,38,0.55)" : "rgba(255,255,255,0.65)")
    : (isDark ? "rgba(22,22,38,0.78)" : "#ffffff");
  const border = isDark ?
  `1px solid ${accent ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}` :
  `1px solid ${accent ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.06)"}`;
  return (
    <div className={`rounded-xl ${className}`}
    style={{ background: bg, border, boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", ...style }}>
      {children}
    </div>);

}

// ─── Metric widget ───────────────────────────────────────────────
function MetricWidget({ label, value, sub, delta, deltaUp, isDark = true }) {
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const upColor = isDark ? "#60a5fa" : "#3b82f6";
  const downColor = isDark ? "#f87171" : "#dc2626";
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] tracking-wide font-medium" style={{ color: muted }}>{label}</p>
      <p className="text-xl font-semibold leading-none" style={{ color: textColor }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: muted }}>{sub}</p>}
      {delta != null &&
      <div className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: deltaUp ? upColor : downColor }}>
          {deltaUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {delta}
        </div>
      }
    </div>);

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
    </svg>);

}

// ─── ATI Score Ring ──────────────────────────────────────────────
function ATIRing({ score, size = 56 }) {
  if (!score) return null;
  const color = score >= 90 ? "#2563eb" : score >= 72 ? "#7c3aed" : score >= 54 ? "#D4A017" : "#dc2626";
  const pct = score / 120 * 113.1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}20`} strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct} 113.1`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>);

}

// ─── Section header ──────────────────────────────────────────────
function SectionHeader({ overline, title, isDark = true }) {
  const accentColor = isDark ? "#f48120" : "#e07310";
  return (
    <div className="mb-5">
      <p className="text-[10px] tracking-[0.2em] font-bold mb-1" style={{ color: accentColor }}>{overline}</p>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>
        {title}
      </h2>
    </div>);

}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const isDark = useTheme();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [trafficSearch, setTrafficSearch] = useState("");
  const [trafficRefreshKey, setTrafficRefreshKey] = useState(0);
  const [trafficView, setTrafficView] = useState("3d"); // "2d" | "3d"
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(100,116,139,0.9)";
  const subtleColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
  const accentOrange = isDark ? "#f48120" : "#e07310";
  const scoreTop = isDark ? "#22c55e" : "#16a34a";
  const scoreHigh = isDark ? "#3b82f6" : "#2563eb";
  const scoreMid = isDark ? "#eab308" : "#ca8a04";
  const scoreLow = isDark ? "#f87171" : "#dc2626";

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 5000)
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
  const faaCount = listings.filter((l) => detectRegType(l.registration) === "faa").length;
  const easaCount = listings.filter((l) => detectRegType(l.registration) === "easa").length;

  return (
    <div className="min-h-screen relative" style={{ background: "transparent" }}>
      <NotificationStack />
      <NotificationCenter />

      {/* ══════════════════════════════════════════════
         GLOBE — fixed full-viewport background
      ══════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-0">
        <SkyBossGlobe className="w-full h-full" listings={listings} onSelectListing={(l) => window.location.href = `/ati-passport/${l.id}`} />
      </div>

      {/* ══════════════════════════════════════════════
         CONTENT OVERLAY — scrolls on top of globe
      ══════════════════════════════════════════════ */}
      <div className="relative z-10">
        {/* Header */}
        <section className="px-4 md:px-8 pt-6 pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] tracking-[0.15em] font-semibold" style={{ color: accentOrange }}>ABOS MarketSpace · Aviation Intelligence</p>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5" style={{ color: textColor }}>
                Aircraft <span style={{ color: mutedColor }}>Buy Or Sell</span>
              </h1>
            </div>
          </div>
        </section>

        {/* Floating controls + News Ticker */}
        <section className="px-4 md:px-8 pb-2">
          <div className="flex items-center gap-2 mb-0 flex-wrap">
            <div className="flex items-center rounded-lg overflow-hidden" style={{
              background: isDark ? "rgba(22,22,38,0.7)" : "rgba(255,255,255,0.7)",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
              backdropFilter: "blur(12px)"
            }}>
              <button
                onClick={() => setTrafficView("2d")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: trafficView === "2d" ?
                  isDark ? "rgba(244,129,32,0.2)" : "rgba(244,129,32,0.12)" :
                  "transparent",
                  color: trafficView === "2d" ?
                  accentOrange :
                  mutedColor
                }}>
                <Map className="w-3 h-3" /> Map
              </button>
              <button
                onClick={() => setTrafficView("3d")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: trafficView === "3d" ?
                  isDark ? "rgba(244,129,32,0.2)" : "rgba(244,129,32,0.12)" :
                  "transparent",
                  color: trafficView === "3d" ?
                  accentOrange :
                  mutedColor
                }}>
                <Globe className="w-3 h-3" /> Globe
              </button>
            </div>
            <div className="flex-1" />
            <GlobeTrafficControls
              onSearch={(q) => setTrafficSearch(q)}
              onRefresh={() => setTrafficRefreshKey((k) => k + 1)}
              listingCount={listings.length}
              compact />
          </div>
          <AviationNewsTicker />
        </section>

        {/* Metric cards row */}
        <section className="px-4 md:px-8 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
            { icon: Plane, label: "Active Listings", value: total_listings.toLocaleString(), sub: `${evaluated} evaluated`, link: "/listings" },
            { icon: ShieldCheck, label: "ATI Scored", value: evaluated, sub: avg_ati ? `Avg score: ${avg_ati}` : "No scores yet", link: "/listings" },
            { icon: Radar, label: "ADS-B Feed", value: "Live", sub: "Real-time tracking", link: "/traffic" },
            { icon: TrendingUp, label: "Hot Deals", value: hot_deals, sub: "Score ≥ 8.5", link: "/deal-radar" }].
            map((m) =>
            <Link key={m.label} to={m.link}>
                <Panel className="p-4 h-full transition-colors cursor-pointer" isDark={isDark} translucent>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isDark ? "rgba(244,129,32,0.08)" : "rgba(244,129,32,0.06)", border: `1px solid ${isDark ? "rgba(244,129,32,0.18)" : "rgba(244,129,32,0.14)"}` }}>
                      <m.icon className="w-4 h-4" style={{ color: accentOrange }} />
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: mutedColor }}>{m.label}</p>
                  </div>
                  <p className="text-xl font-bold leading-none mb-1" style={{ color: textColor }}>{m.value}</p>
                  <p className="text-[11px] leading-tight" style={{ color: mutedColor }}>{m.sub}</p>
                </Panel>
              </Link>
            )}
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
          { icon: Zap, title: "ATI Quick Score", body: "Paste any listing text or N-number. Get an instant 8-dimension scorecard, OMVM range, deal score and a buyer alert — no document output.", link: "/ati-quick-score", badge: "Free · Instant" },
          { icon: FileText, title: "ATI Full Report", body: "Professional aircraft appraisal: 8-dimension scoring, executive summary, strengths, risks, recommendations, identity table and branded .docx export.", link: "/ati-full-report", badge: "Pro · Export" }].
          map((m) =>
          <Link key={m.title} to={m.link}>
              <Panel className="p-5 h-full transition-colors cursor-pointer" isDark={isDark} translucent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: isDark ? "rgba(244,129,32,0.08)" : "rgba(244,129,32,0.06)", border: `1px solid ${isDark ? "rgba(244,129,32,0.18)" : "rgba(244,129,32,0.14)"}` }}>
                    <m.icon className="w-4 h-4" style={{ color: accentOrange }} />
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: isDark ? "rgba(244,129,32,0.1)" : "rgba(244,129,32,0.08)", color: accentOrange }}>{m.badge}</span>
                </div>
                <h4 className="text-sm font-bold mb-1.5" style={{ color: textColor }}>{m.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{m.body}</p>
                <div className="mt-4 pt-3 border-t flex items-center gap-1 text-[10px] font-semibold"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: accentOrange }}>
                  Launch Tool <ArrowRight className="w-3 h-3" />
                </div>
              </Panel>
            </Link>
          )}
        </div>
      </section>

      {/* PLATFORM CAPABILITIES — Cloudflare-style dividers */}
      <section className="px-4 md:px-8 py-8">
        <SectionHeader overline="Platform Capabilities" title="Integrated Intelligence Modules" isDark={isDark} />
        <DividerSection
          columns={[
            {
              icon: ShieldCheck,
              label: "ATI Transaction Report",
              description: "8-dimension risk scoring — documentation integrity, engine condition, avionics, operational history, and transaction readiness.",
              link: "/listings",
              linkLabel: "Browse reports",
            },
            {
              icon: Radar,
              label: "ADS-B Surveillance",
              description: "Real-time aircraft tracking by N-number or Mode-S hex. Live position, altitude, speed, and historical flight path.",
              link: "/traffic",
              linkLabel: "Open tracker",
            },
            {
              icon: Handshake,
              label: "Escrow & Commission",
              description: "Protected buyer-seller escrow with automated commission splits, finder's fees, and full payout audit trail.",
              link: "/escrow",
              linkLabel: "Manage deals",
            },
          ]}
        />
      </section>

      {/* AIRCRAFT LISTINGS */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Active Listings" title="ATI-Evaluated Aircraft" isDark={isDark} />
          <Link to="/listings" className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-70 transition-opacity" style={{ color: accentOrange }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {listings.slice(0, 6).map((l) => {
              const score = l.ati_score || 0;
              const sc = score >= 90 ? scoreTop : score >= 72 ? scoreHigh : score >= 54 ? scoreMid : score > 0 ? scoreLow : subtleColor;
              const regType = detectRegType(l.registration);
              const regColor = getRegTypeColor(regType, isDark);
              return (
                <Link key={l.id} to={`/ati-passport/${l.id}`}>
                  <Panel className="p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer" isDark={isDark} translucent style={{ borderColor: score > 0 ? `${sc}30` : undefined }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[9px] tracking-wider font-semibold" style={{ color: accentOrange }}>ATI Report</p>
                        <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1.5" style={{ color: mutedColor }}>
                          {l.registration || "—"}
                          {regType &&
                          <span className="text-[7px] font-medium px-1 py-0.5 rounded"
                          style={{ color: regColor, background: `${regColor}15`, border: `1px solid ${regColor}30` }}>
                              {regType === "faa" ? "N-Reg" : regType === "easa" ? "EASA" : ""}
                            </span>
                          }
                        </p>
                        <p className="text-sm font-semibold mt-1 truncate leading-tight" style={{ color: textColor }}>{l.year} {l.make} {l.model}</p>
                      </div>
                      <ATIRing score={score || null} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                      <p className="text-[10px] font-medium" style={{ color: mutedColor }}>
                        {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "On request"}
                      </p>
                      <span className="text-[10px] font-semibold" style={{ color: sc }}>
                        {score >= 90 ? "Exceptional" : score >= 75 ? "Strong Buy" : score >= 60 ? "Fair" : score > 0 ? "Caution" : "Unscored"}
                      </span>
                    </div>
                  </Panel>
                </Link>);

            })}
            {listings.length === 0 &&
            <div className="sm:col-span-2 xl:col-span-3 py-16 text-center" style={{ color: subtleColor }}>
                <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No aircraft reports available yet.</p>
              </div>
            }
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

      {/* WHO WE SERVE — Cloudflare-style dividers */}
      <section className="px-4 md:px-8 py-8">
        <SectionHeader overline="Who We Serve" title="Built for Aviation Professionals" isDark={isDark} />
        <DividerSection
          columns={[
            {
              icon: Users,
              label: "Aircraft Dealers",
              description: "Manage your active inventory with verified ATI intelligence reports. Present aircraft professionally to institutional buyers.",
            },
            {
              icon: Handshake,
              label: "Aviation Brokers",
              description: "Originate, structure and close deals with confidence. Secure escrow, automated commission management, and deal pipeline.",
            },
            {
              icon: TrendingUp,
              label: "Operators & Acquirers",
              description: "Source quality off-market aircraft, verify title and airworthiness, and execute acquisitions through a structured process.",
            },
          ]}
        />
      </section>

      {/* FOOTER CTA — Cloudflare-style */}
      <section className="px-4 md:px-8 py-14 text-center">
        <p className="text-[10px] tracking-[0.2em] font-semibold mb-4" style={{ color: accentOrange }}>
          JOIN THE NETWORK
        </p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 max-w-2xl mx-auto" style={{ color: textColor }}>
          One Platform. Institutional Standards. Verified Results.
        </h2>
        <p className="text-[15px] mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: mutedColor }}>
          ABOS is the private intelligence network trusted by aviation dealers and brokers for rigorous transaction due diligence, secure deal execution, and auditable outcomes.
        </p>
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[14px] font-bold transition-all active:scale-95"
          style={{
            background: accentOrange,
            color: "#fff",
            boxShadow: `0 2px 16px ${accentOrange}40`,
          }}
        >
          Enter the Platform
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-8 text-[11px]" style={{ color: mutedColor }}>
          {["ATI Transaction Reports", "Secure Escrow", "Commission Management", "ADS-B Surveillance", "Transparent Pricing"].map((x) => (
            <div key={x} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" style={{ color: accentOrange, opacity: 0.6 }} />
              {x}
            </div>
          ))}
        </div>
      </section>

      {/* Close z-10 overlay */}
      </div>

      <AircraftWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>);

}