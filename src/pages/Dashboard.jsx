import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeLayerFilter, { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import NRegLookup from "@/components/dashboard/NRegLookup";
import QuickAccessStrip from "@/components/dashboard/QuickAccessStrip";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export default function Dashboard() {
  const isDark = useTheme();
  const [globeFilter, setGlobeFilter] = useState(DEFAULT_FILTER);
  const [focusLocation, setFocusLocation] = useState(null);

  const textColor = isDark ? "#e2e8f0" : "#1a1a1a";
  const mutedColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const accentOrange = isDark ? "#f48120" : "#e07310";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const steelGlass = isDark
    ? "rgba(12,20,40,0.78)"
    : "rgba(230,240,255,0.82)";
  const steelBorder = isDark
    ? "1px solid rgba(0,180,255,0.14)"
    : "1px solid rgba(37,99,235,0.12)";

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
        <SkyBossGlobe className="w-full h-full" listings={listings} filter={globeFilter} focusLocation={focusLocation} onSelectListing={(l) => window.location.href = `/ati-passport/${l.id}`} />
      </div>

      {/* ── OVERLAY CONTENT ────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── HEADER ──────────────────────────────────────── */}
        <section className="px-4 md:px-8 pt-6 pb-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] tracking-[0.18em] font-bold" style={{ color: accentOrange }}>ABOS MarketSpace</p>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5" style={{ color: textColor }}>
                  Aviation Intelligence Dashboard
                </h1>
              </div>
              <SubscriptionBadge />
            </div>
            <div className="mt-3"><AviationNewsTicker /></div>
          </div>
        </section>

        {/* ── N-REG LOOKUP HERO ───────────────────────────── */}
        <section className="px-4 md:px-8 pb-5">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <div className="w-full rounded-2xl p-4 md:p-6"
              style={{ background: steelGlass, border: steelBorder, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }}>
              <NRegLookup userProfile={userProfile} onFocusLocation={setFocusLocation} />
            </div>
          </div>
        </section>

        {/* ── QUICK ACCESS STRIP ──────────────────────────── */}
        <section className="px-4 md:px-8 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl p-4 md:p-5"
              style={{ background: steelGlass, border: steelBorder, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }}>
              <p className="text-[10px] tracking-[0.18em] font-bold mb-3 text-center" style={{ color: accentOrange }}>AVIATION TOOLS</p>
              <QuickAccessStrip />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}