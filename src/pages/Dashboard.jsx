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
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeTrafficControls from "@/components/dashboard/GlobeTrafficControls";
import TrafficMapSection from "@/components/dashboard/TrafficMapSection";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

// ─── Clean panel — minimal card with subtle border ────────────────
function Panel({ children, className = "", accent = false, style = {}, isDark = true }) {
  const bg = isDark ? "rgba(22,22,38,0.85)" : "#ffffff";
  const border = isDark
    ? `1px solid ${accent ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}`
    : `1px solid ${accent ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.06)"}`;
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: bg, border, boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)", ...style }}>
      {children}
    </div>
  );
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
      {delta != null && (
        <div className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: deltaUp ? upColor : downColor }}>
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
  const accentColor = isDark ? "#60a5fa" : "#3b82f6";
  return (
    <div className="mb-5">
      <p className="text-[10px] tracking-[0.15em] font-semibold mb-1" style={{ color: accentColor }}>{overline}</p>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>
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
  const [trafficView, setTrafficView] = useState("3d"); // "2d" | "3d"
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(100,116,139,0.9)";
  const subtleColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
  const accentCyan = isDark ? "#60a5fa" : "#3b82f6";
  const accentViolet = isDark ? "#a78bfa" : "#7c3aed";
  const accentGold = "#ca8a04";
  const accentRed = isDark ? "#f87171" : "#dc2626";

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

      <section className="px-4 md:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs tracking-wide font-medium" style={{ color: mutedColor }}>ABOS MarketSpace · Aviation Intelligence</p>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5" style={{ color: textColor }}>
              Aircraft <span style={{ color: mutedColor }}>Buy Or Sell</span>
            </h1>
          </div>
        </div>
      </section>

      {/* News Ticker */}
      <AviationNewsTicker />

      {/* ══════════════════════════════════════════════
          MAIN GRID — Unified Traffic Panel (2D/3D toggle) + Sidebar
      ══════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 pb-4">
        <div className="grid lg:grid-cols-[1fr_380px] gap-4">
          
          {/* LEFT — Unified Traffic Panel with 2D/3D toggle */}
          <div className="min-h-0 flex flex-col">
            {/* View toggle bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center rounded-lg overflow-hidden" style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"
              }}>
                <button
                  onClick={() => setTrafficView("2d")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
                  style={{
                    background: trafficView === "2d" 
                      ? (isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)")
                      : "transparent",
                    color: trafficView === "2d" 
                      ? (isDark ? "#60a5fa" : "#3b82f6")
                      : mutedColor
                  }}>
                  <Map className="w-3 h-3" /> Map
                </button>
                <button
                  onClick={() => setTrafficView("3d")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
                  style={{
                    background: trafficView === "3d"
                      ? (isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)")
                      : "transparent",
                    color: trafficView === "3d"
                      ? (isDark ? "#60a5fa" : "#3b82f6")
                      : mutedColor
                  }}>
                  <Globe className="w-3 h-3" /> Globe
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
            <div className="flex-1 relative rounded-xl overflow-hidden" style={{ 
              minHeight: "560px",
              background: trafficView === "3d" ? (isDark ? "#111120" : "#f1f5f9") : "transparent",
              border: trafficView === "3d" 
                ? (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)") 
                : "none",
              boxShadow: trafficView === "3d"
                ? (isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)")
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
                  <Panel className="p-3 h-full hover:scale-[1.02] transition-transform cursor-pointer" accent isDark={isDark} style={{ borderColor: `${m.color}35` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                        <m.icon className="w-3 h-3" style={{ color: m.color }} />
                      </div>
                      <p className="text-[8px] uppercase tracking-[0.15em] font-black" style={{ color: mutedColor }}>{m.label}</p>
                    </div>
                    <p className="text-base font-black leading-none" style={{ color: textColor }}>{m.value}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: mutedColor }}>{m.sub}</p>
                  </Panel>
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
            { icon: Zap, title: "ATI Quick Score", body: "Paste any listing text or N-number. Get an instant 8-dimension scorecard, OMVM range, deal score and a buyer alert — no document output.", link: "/ati-quick-score", badge: "Free · Instant" },
            { icon: FileText, title: "ATI Full Report", body: "Professional aircraft appraisal: 8-dimension scoring, executive summary, strengths, risks, recommendations, identity table and branded .docx export.", link: "/ati-full-report", badge: "Pro · Export" },
          ].map((m) => (
            <Link key={m.title} to={m.link}>
              <Panel className="p-5 h-full hover:bg-opacity-90 transition-colors cursor-pointer" isDark={isDark}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: isDark ? "rgba(59,130,246,0.1)" : "rgba(37,99,235,0.08)", border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.15)"}` }}>
                    <m.icon className="w-4 h-4" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }} />
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: isDark ? "rgba(59,130,246,0.1)" : "rgba(37,99,235,0.08)", color: isDark ? "#60a5fa" : "#3b82f6" }}>{m.badge}</span>
                </div>
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: textColor }}>{m.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{m.body}</p>
                <div className="mt-4 pt-3 border-t flex items-center gap-1 text-[10px] font-medium"
                  style={{ borderColor: `${m.color}20`, color: m.color }}>
                  Launch Tool <ArrowRight className="w-3 h-3" />
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      {/* 4-CAPABILITY MODULES */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Platform Capabilities" title="Integrated Intelligence Modules" isDark={isDark} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: ShieldCheck, title: "ATI Transaction Report", body: "8-dimension risk scoring — documentation integrity, engine condition, avionics, operational history, transaction readiness.", link: "/listings" },
            { icon: Radar, title: "ADS-B Surveillance", body: "Real-time aircraft tracking by N-number or Mode-S hex. Live position, altitude, speed and historical flight path.", link: "/traffic" },
            { icon: Plane, title: "Pre-Buy Inspection", body: "On-site with Max — live visual analysis of airframe, corrosion, interior and maintenance discrepancies.", link: "/pre-buy-inspection" },
            { icon: Handshake, title: "Escrow & Commission", body: "Protected buyer-seller escrow with automated commission splits, finder's fees and full payout audit trail.", link: "/escrow" },
          ].map((m) => (
            <Link key={m.title} to={m.link}>
              <Panel className="p-5 h-full hover:bg-opacity-90 transition-colors cursor-pointer" isDark={isDark}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: isDark ? "rgba(59,130,246,0.1)" : "rgba(37,99,235,0.08)", border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.15)"}` }}>
                    <m.icon className="w-4 h-4" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }} />
                  </div>
                </div>
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: textColor }}>{m.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{m.body}</p>
                <div className="mt-4 pt-3 border-t flex items-center gap-1 text-[10px] font-medium"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: isDark ? "#60a5fa" : "#3b82f6" }}>
                  Access Module <ArrowRight className="w-3 h-3" />
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      {/* AIRCRAFT LISTINGS */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <SectionHeader overline="Active Listings" title="ATI-Evaluated Aircraft" isDark={isDark} />
          <Link to="/listings" className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70 transition-opacity" style={{ color: accentCyan }}>
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
                  <Panel className="p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer" isDark={isDark} style={{ borderColor: score > 0 ? `${sc}30` : undefined }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[9px] tracking-wider font-medium" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>ATI Report</p>
                        <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1.5" style={{ color: mutedColor }}>
                          {l.registration || "—"}
                          {regType && (
                            <span className="text-[7px] font-medium px-1 py-0.5 rounded"
                              style={{ color: regColor, background: `${regColor}15`, border: `1px solid ${regColor}30` }}>
                              {regType === "faa" ? "N-Reg" : regType === "easa" ? "EASA" : ""}
                            </span>
                          )}
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
          <SectionHeader overline="Who We Serve" title="Built for Aviation Professionals" isDark={isDark} />
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, title: "Aircraft Dealers", body: "Manage your active inventory with verified ATI intelligence reports. Present aircraft professionally to institutional buyers." },
            { icon: Handshake, title: "Aviation Brokers", body: "Originate, structure and close deals with confidence. Secure escrow, automated commission management and deal pipeline." },
            { icon: TrendingUp, title: "Operators & Acquirers", body: "Source quality off-market aircraft, verify title and airworthiness, and execute acquisitions through a structured process." }
          ].map((x) => (
            <Panel key={x.title} className="p-5" isDark={isDark}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: isDark ? "rgba(59,130,246,0.08)" : "rgba(37,99,235,0.06)", border: `1px solid ${isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.12)"}` }}>
                <x.icon className="w-4.5 h-4.5" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }} />
              </div>
              <h4 className="text-sm font-semibold mb-1.5" style={{ color: textColor }}>{x.title}</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{x.body}</p>
            </Panel>
          ))}
        </div>
        <Panel className="p-5" isDark={isDark}>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {["ATI Transaction Reports", "Secure Escrow Execution", "Commission & Fee Management", "Verified Professional Network", "Real-Time ADS-B Surveillance", "Transparent Deal Pricing"].map((x) => (
              <div key={x} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: isDark ? "#60a5fa" : "#3b82f6", opacity: 0.6 }} />
                <span className="text-[11px] font-medium" style={{ color: mutedColor }}>{x}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* FOOTER CTA */}
      <section className="px-4 md:px-8 py-10 text-center">
        <Panel className="max-w-2xl mx-auto p-8 md:p-10" isDark={isDark}>
          <Lock className="w-6 h-6 mx-auto mb-4" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }} />
          <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-3" style={{ color: textColor }}>
            One Platform. <span style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>Institutional Standards.</span>{" "}
            Verified Results.
          </h2>
          <p className="text-sm mb-6 max-w-lg mx-auto leading-relaxed" style={{ color: mutedColor }}>
            ABOS is the private intelligence network trusted by aviation dealers and brokers for rigorous transaction due diligence, secure deal execution, and auditable outcomes.
          </p>
          <Link to="/listings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{ background: isDark ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.08)", border: `1px solid ${isDark ? "rgba(59,130,246,0.25)" : "rgba(37,99,235,0.18)"}`, color: isDark ? "#60a5fa" : "#3b82f6" }}>
            Enter the Platform <ArrowRight className="w-4 h-4" />
          </Link>
        </Panel>
      </section>

      <AircraftWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}