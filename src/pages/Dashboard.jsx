import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import Globe from "@/components/Globe";
import GlobeLayerFilter, { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import HeroSearch from "@/components/marketspace/HeroSearch";
import FeaturedStrip from "@/components/marketspace/FeaturedStrip";
import PathCards from "@/components/marketspace/PathCards";
import StatCounters from "@/components/marketspace/StatCounters";
import HowItWorks from "@/components/marketspace/HowItWorks";

export default function Dashboard() {
  const [globeFilter, setGlobeFilter] = useState(DEFAULT_FILTER);

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 200),
    staleTime: 30000,
  });

  // Featured = verified first, then highest ATI
  const featured = [...listings]
    .sort((a, b) => (b.owner_verified ? 1 : 0) - (a.owner_verified ? 1 : 0) || (b.ati_score || 0) - (a.ati_score || 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen relative" style={{ background: "transparent" }}>
      <NotificationStack />
      <NotificationCenter />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-12 space-y-10">

        {/* ── HERO SEARCH ── */}
        <HeroSearch />

        {/* ── STAT COUNTERS ── */}
        <StatCounters listings={listings} />

        {/* ── FEATURED INVENTORY ── */}
        <FeaturedStrip listings={featured} />

        {/* ── HOW IT WORKS ── */}
        <HowItWorks />

        {/* ── BUYER / SELLER PATHS ── */}
        <PathCards />

        {/* ── NEWS TICKER ── */}
        <AviationNewsTicker />

        {/* ── GLOBE (secondary intelligence) ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#8EB7DC" }}>
            Live Market Intelligence
          </p>
          <div className="relative rounded-3xl overflow-hidden"
            style={{ background: "#0C1620", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-full" style={{ maxHeight: "520px", aspectRatio: "1 / 1" }}>
              <Globe listings={listings} filter={globeFilter} />
            </div>
            <div className="absolute top-3 right-3 z-20">
              <GlobeLayerFilter filter={globeFilter} onChange={setGlobeFilter} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}