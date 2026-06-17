import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, Plane, Radar, TrendingUp,
  ArrowRight, Zap, FileText, Globe, Map,
  Database, Users, Store, Cpu, AlertTriangle } from
"lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeTrafficControls from "@/components/dashboard/GlobeTrafficControls";
import GlobeLayerFilter, { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import DatabaseCharts from "@/components/dashboard/DatabaseCharts";
import FaaRegistryPanel from "@/components/dashboard/FaaRegistryPanel";
import RocketMetrics from "@/components/dashboard/RocketMetrics";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export default function Dashboard() {
  const isDark = useTheme();
  const [trafficRefreshKey, setTrafficRefreshKey] = useState(0);
  const [trafficView, setTrafficView] = useState("3d");
  const [globeFilter, setGlobeFilter] = useState(DEFAULT_FILTER);

  const textColor = isDark ? "#e2e8f0" : "#1a1a1a";
  const mutedColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const accentOrange = isDark ? "#f48120" : "#e07310";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const panelBg = isDark ? "rgba(15,15,28,0.72)" : "rgba(255,255,255,0.78)";

  const panelBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)";

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 5000)
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ["listings-all"],
    queryFn: () => base44.entities.AircraftListing.list("-created_date", 5000)
  });

  const { data: faaAircraft = [] } = useQuery({
    queryKey: ["faa-aircraft-count"],
    queryFn: () => base44.entities.FAAAircraft.list("-created_date", 5000)
  });

  const { data: dealers = [] } = useQuery({
    queryKey: ["dealer-locations"],
    queryFn: () => base44.entities.DealerLocation.list("-created_date", 5000),
    staleTime: 60000,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.DealRadar.list("-created_date", 2000)
  });

  const { data: trafficAppearances = [] } = useQuery({
    queryKey: ["traffic-appearances-count"],
    queryFn: () => base44.entities.TrafficAppearance.list("-created_date", 1),
    staleTime: 30000,
  });

  const { data: faaSummary } = useQuery({
    queryKey: ["faa-summary-total"],
    queryFn: async () => {
      const res = await base44.functions.invoke("syncFaaFromSupabase", { mode: "registry_summary" });
      return res.data || {};
    },
    staleTime: 300000,
  });

  const faaRegistryTotal = faaSummary?.faaRegistryTotal || 308985;
  const faaAcftrefTotal = faaSummary?.faaAcftrefTotal || 93572;
  const faaAdTotal = faaSummary?.faaAdTotal || 187;
  const faaDealersTotal = faaSummary?.faaDealersTotal || 12507;
  const faaEngineTotal = faaSummary?.faaEngineTotal || 4743;

  const totalListings = allListings.length;
  const activeListings = listings.length;
  const faaSynced = faaSummary?.abosFaaAircraftCount || faaAircraft.length;
  const dealerCount = dealers.length;
  const matchedToFaa = listings.filter((l) => l.registration && /^N/i.test(l.registration)).length;
  const avgAti = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length)
    : 0;
  const hotDeals = deals.filter((d) => (d.deal_score || 0) >= 8.5).length;
  const evaluated = listings.filter((l) => l.ati_score).length;
  const engineEnriched = faaAircraft.filter((f) => f.engine_mfr).length;
  const historicTraffic = trafficAppearances.length > 0 ? "Active" : "—";

  const panelStyle = { background: panelBg, border: panelBorder, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" };

  // ─── ATI ring helper ────────────────────────────────────
  function ATIRing({ score, size = 48 }) {
    if (!score) return <div className="shrink-0 rounded-full flex items-center justify-center text-[9px] font-medium" style={{ width: size, height: size, color: mutedColor, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>—</div>;
    const color = score >= 90 ? "#16a34a" : score >= 72 ? "#2563eb" : score >= 54 ? "#ca8a04" : "#dc2626";
    const pct = score / 120 * 113.1;
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}18`} strokeWidth="3" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct} 113.1`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-extrabold" style={{ color }}>{score}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "transparent" }}>
      <NotificationStack />
      <NotificationCenter />

      {/* ── GLOBE BACKGROUND ──────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <SkyBossGlobe className="w-full h-full" listings={listings} filter={globeFilter} onSelectListing={(l) => window.location.href = `/ati-passport/${l.id}`} />
      </div>

      {/* ── OVERLAY CONTENT ────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── HEADER ──────────────────────────────────────── */}
        <section className="px-4 md:px-8 pt-6 pb-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <p className="text-[10px] tracking-[0.18em] font-bold" style={{ color: accentOrange }}>ABOS MarketSpace</p>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5" style={{ color: textColor }}>
                  Aviation Intelligence Dashboard
                </h1>
              </div>
              <SubscriptionBadge />
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg overflow-hidden" style={{
                background: isDark ? "rgba(15,15,28,0.7)" : "rgba(255,255,255,0.7)",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                backdropFilter: "blur(12px)"
              }}>
                <Link to="/traffic" className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors rounded-lg"
                  style={{ background: "transparent", color: mutedColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(244,129,32,0.12)" : "rgba(244,129,32,0.07)"; e.currentTarget.style.color = accentOrange; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = mutedColor; }}>
                  <Map className="w-3 h-3" /> Map
                </Link>
                <button onClick={() => setTrafficView("3d")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
                  style={{ background: trafficView === "3d" ? (isDark ? "rgba(244,129,32,0.18)" : "rgba(244,129,32,0.1)") : "transparent", color: trafficView === "3d" ? accentOrange : mutedColor }}>
                  <Globe className="w-3 h-3" /> Globe
                </button>
              </div>
              <div className="flex-1" />
              <GlobeLayerFilter filter={globeFilter} onChange={setGlobeFilter} />
              <GlobeTrafficControls
                onSearch={(q) => { }}
                onRefresh={() => setTrafficRefreshKey((k) => k + 1)}
                listingCount={listings.length}
                compact />
            </div>
            <div className="mt-2"><AviationNewsTicker /></div>
          </div>
        </section>

        {/* ── METRICS ROW ──────────────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto">
            <RocketMetrics metrics={[
              { icon: Plane, label: "Aircraft Register", value: activeListings.toLocaleString(), sub: `${totalListings.toLocaleString()} total · ${evaluated} ATI scored · avg ${avgAti}`, link: "/listings", color: accentOrange },
              { icon: Database, label: "FAA Registry Sync", value: `${faaSynced.toLocaleString()} / ${faaRegistryTotal.toLocaleString()}`, sub: `${matchedToFaa} N‑reg matched · ${faaSynced > 0 ? Math.round((faaSynced / faaRegistryTotal) * 100) : 0}% synced`, link: "/admin/supabase-sync", color: accentCyan },
              { icon: Store, label: "Dealer Network", value: dealerCount.toLocaleString(), sub: `ABOS sync · ${faaDealersTotal.toLocaleString()} FAA certified`, link: "/admin/supabase-sync", color: "#06b6d4" },
              { icon: Cpu, label: "Engine Enrichment", value: `${engineEnriched.toLocaleString()} / ${faaSynced.toLocaleString()}`, sub: `${faaSynced > 0 ? Math.round((engineEnriched / faaSynced) * 100) : 0}% with engine data`, link: "/admin/supabase-sync", color: "#8b5cf6" },
              { icon: TrendingUp, label: "ACFTREF Database", value: faaAcftrefTotal.toLocaleString(), sub: "Make / model codes · feeds listing enrichment", link: "/admin/supabase-sync", color: "#f59e0b" },
              { icon: Radar, label: "FAA Engine Specs", value: faaEngineTotal.toLocaleString(), sub: "Engine manufacturer + model data", link: "/admin/supabase-sync", color: "#22c55e" },
              { icon: AlertTriangle, label: "Airworthiness Dir.", value: faaAdTotal.toLocaleString(), sub: "FAA regulatory directives", link: "/admin/supabase-sync", color: "#ec4899" },
              { icon: Globe, label: "Global Live Traffic", value: "ADS‑B + DB", sub: "Real‑time tracking · globe + map", link: "/traffic", color: "#14b8a6" },
            ]} />
          </div>
        </section>

        {/* ── DATABASE CHARTS ──────────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] tracking-[0.18em] font-bold mb-3" style={{ color: accentOrange }}>DATABASE ANALYTICS</p>
            <div className="rounded-xl p-5" style={panelStyle}>
              <DatabaseCharts
                faaAircraft={faaAircraft}
                listings={listings}
                matchedCount={matchedToFaa}
                faaTotalRegistry={faaRegistryTotal}
                faaAcftrefTotal={faaAcftrefTotal}
                faaAdTotal={faaAdTotal}
                faaDealersTotal={faaDealersTotal}
                faaEngineTotal={faaEngineTotal}
              />
            </div>
          </div>
        </section>

        {/* ── FAA REGISTRY LIVE ───────────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] tracking-[0.18em] font-bold mb-3" style={{ color: accentOrange }}>LIVE FAA REGISTRY</p>
            <FaaRegistryPanel />
          </div>
        </section>

        {/* ── ATI QUICK TOOLS ───────────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] tracking-[0.18em] font-bold mb-3" style={{ color: accentOrange }}>ATI SCORING TOOLS</p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { icon: Zap, title: "Quick Score", body: "Paste listing text or N-number for an instant 8-dimension scorecard.", link: "/ati-quick-score", badge: "Free", cost: "0 credits" },
                { icon: FileText, title: "Full Report", body: "Professional appraisal with executive summary, strengths, risks and .docx export.", link: "/ati-full-report", badge: "Pro", cost: "~25 credits" },
              ].map((m) =>
                <Link key={m.title} to={m.link}>
                  <div className="rounded-xl p-5 h-full hover:scale-[1.01] transition-transform cursor-pointer" style={panelStyle}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: isDark ? "rgba(244,129,32,0.1)" : "rgba(244,129,32,0.07)", border: `1px solid ${isDark ? "rgba(244,129,32,0.2)" : "rgba(244,129,32,0.15)"}` }}>
                        <m.icon className="w-4 h-4" style={{ color: accentOrange }} />
                      </div>
                      <span className="text-[8px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                        style={{ background: isDark ? "rgba(244,129,32,0.12)" : "rgba(244,129,32,0.08)", color: accentOrange }}>{m.badge}</span>
                      <span className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                        style={{
                          background: m.badge === "Free" ? (isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)") : (isDark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.08)"),
                          color: m.badge === "Free" ? "#22c55e" : "#8b5cf6"
                        }}>{m.cost}</span>
                    </div>
                    <h4 className="text-sm font-bold mb-1.5" style={{ color: textColor }}>{m.title}</h4>
                    <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{m.body}</p>
                    <div className="mt-4 pt-3 flex items-center gap-1 text-[10px] font-semibold"
                      style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)", color: accentOrange }}>
                      Open Tool <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── PRICING CTA BANNER ──────────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto">
            <Link to="/pricing" className="block">
              <div className="rounded-xl p-5 flex items-center justify-between flex-wrap gap-4 hover:scale-[1.01] transition-transform cursor-pointer"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(212,160,23,0.10), rgba(166,124,0,0.05))"
                    : "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(166,124,0,0.03))",
                  border: `1px solid ${isDark ? "rgba(212,160,23,0.25)" : "rgba(212,160,23,0.18)"}`,
                  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isDark ? "rgba(212,160,23,0.15)" : "rgba(212,160,23,0.10)", border: `1px solid ${isDark ? "rgba(212,160,23,0.25)" : "rgba(212,160,23,0.15)"}` }}>
                    <Zap className="w-5 h-5 text-[#D4A017]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: textColor }}>Token-based pricing — pay only for what you use</p>
                    <p className="text-[11px]" style={{ color: mutedColor }}>Free Quick Score. Full ATI Report ~25 credits. Get 100 credits from $9.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold"
                  style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)", color: "#fff" }}>
                  See Plans <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── AIRCRAFT REGISTER ────────────────────────────────── */}
        <section className="px-4 md:px-8 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
              <p className="text-[10px] tracking-[0.18em] font-bold" style={{ color: accentOrange }}>AIRCRAFT REGISTER</p>
              <Link to="/listings" className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-70" style={{ color: accentOrange }}>
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {listings.slice(0, 6).map((l) => {
                const score = l.ati_score || 0;
                const sc = score >= 90 ? "#16a34a" : score >= 72 ? "#2563eb" : score >= 54 ? "#ca8a04" : score > 0 ? "#dc2626" : mutedColor;
                return (
                  <Link key={l.id} to={`/ati-passport/${l.id}`}>
                    <div className="rounded-xl p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer" style={{
                      ...panelStyle,
                      border: score > 0 ? `1px solid ${sc}30` : panelBorder,
                    }}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-[9px] tracking-wider font-semibold" style={{ color: accentOrange }}>ATI Report</p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: mutedColor }}>{l.registration || "—"}</p>
                          <p className="text-sm font-semibold mt-1 truncate leading-tight" style={{ color: textColor }}>{l.year} {l.make} {l.model}</p>
                        </div>
                        <ATIRing score={score || null} />
                      </div>
                      <div className="flex items-center justify-between pt-2" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)" }}>
                        <p className="text-[10px] font-medium" style={{ color: mutedColor }}>
                          {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "On request"}
                        </p>
                        <span className="text-[10px] font-semibold" style={{ color: sc }}>
                          {score >= 90 ? "Exceptional" : score >= 72 ? "Strong Buy" : score >= 54 ? "Fair" : score > 0 ? "Caution" : "Unscored"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {listings.length === 0 &&
                <div className="sm:col-span-2 xl:col-span-3 py-12 text-center rounded-xl" style={panelStyle}>
                  <Plane className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm" style={{ color: mutedColor }}>No aircraft in register yet.</p>
                </div>
              }
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}