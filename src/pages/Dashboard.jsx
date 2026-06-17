import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeTrafficControls from "@/components/dashboard/GlobeTrafficControls";
import GlobeLayerFilter, { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import NRegLookup from "@/components/dashboard/NRegLookup";
import QuickAccessStrip from "@/components/dashboard/QuickAccessStrip";
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

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 5000)
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-dashboard"],
    queryFn: async () => {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_email: me.email }, "-created_date", 1);
        return profiles[0] || null;
      } catch { return null; }
    },
    staleTime: 60000,
  });

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

        {/* ── N-REG LOOKUP HERO ───────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <NRegLookup userProfile={userProfile} />
          </div>
        </section>

        {/* ── QUICK ACCESS STRIP ──────────────────────────── */}
        <section className="px-4 md:px-8 pb-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] tracking-[0.18em] font-bold mb-3 text-center" style={{ color: accentOrange }}>AVIATION TOOLS</p>
            <QuickAccessStrip />
          </div>
        </section>

      </div>
    </div>
  );
}