import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationStack from "@/components/notifications/NotificationStack";
import QuickAccessStrip from "@/components/dashboard/QuickAccessStrip";
import ATIOverviewCards from "@/components/dashboard/ATIOverviewCards";
import LiveMarketIntelligence from "@/components/dashboard/LiveMarketIntelligence";
import SiteFooter from "@/components/SiteFooter";
import SectionShell from "@/components/dashboard/sections/SectionShell";
import HeroSection from "@/components/dashboard/sections/HeroSection";
import PlatformStats from "@/components/dashboard/sections/PlatformStats";
import MarketCounters from "@/components/dashboard/sections/MarketCounters";
import AircraftFinance from "@/components/dashboard/sections/AircraftFinance";
import FeaturedTools from "@/components/dashboard/sections/FeaturedTools";
import EngineDealer from "@/components/dashboard/sections/EngineDealer";
import ListingsShowcase from "@/components/dashboard/sections/ListingsShowcase";
import WhyAbos from "@/components/dashboard/sections/WhyAbos";
import EnterpriseCTA from "@/components/dashboard/sections/EnterpriseCTA";

export default function Dashboard() {
  const { data: listings = [] } = useQuery({
    queryKey: ["listings-hub"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-created_date",
        10
      ),
    staleTime: 30000,
  });

  const { data: atiCards = [] } = useQuery({
    queryKey: ["ati-cards-hub"],
    queryFn: () => base44.entities.ATICard.list(),
    staleTime: 30000,
  });

  const { data: activeAti = [] } = useQuery({
    queryKey: ["ati-active-hub"],
    queryFn: () => base44.entities.ATICard.filter({ status: "active" }),
    staleTime: 30000,
  });

  return (
    <div
      style={{
        background: "transparent",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <NotificationStack />
      <HeroSection listings={listings} atiCards={atiCards} activeAti={activeAti} />
      <PlatformStats />
      <SectionShell
        eyebrow="ABOS Market Intelligence · Live"
        title="Live Market Data Feed"
        subtitle="Real-time market pricing and availability across top manufacturers. Data automatically recalibrates OMVM valuations and ATI scoring."
      >
        <LiveMarketIntelligence />
      </SectionShell>
      <SectionShell eyebrow="Quick Access" title="Everything you need, one click away">
        <QuickAccessStrip />
      </SectionShell>
      <ListingsShowcase
        listings={listings}
        eyebrow="Live Market"
        title="Latest Aircraft Listings"
        layout="carousel"
        actionTo="/listings"
        actionLabel="View all"
      />
      <SectionShell
        eyebrow="ATI Overview · Market Intelligence"
        title="Value Estimates by Aircraft Type"
        subtitle="ATI scores, OMVM value estimates, and market pricing automatically recalculated per aircraft type. Select a manufacturer to see live aggregated data."
      >
        <ATIOverviewCards />
      </SectionShell>
      <MarketCounters
        listings={listings}
        atiCards={atiCards}
        activeAti={activeAti}
      />
      <AircraftFinance />
      <FeaturedTools />
      <EngineDealer />
      <ListingsShowcase
        listings={listings}
        eyebrow="Marketplace"
        title="Featured Aircraft"
        layout="grid"
        actionTo="/listings"
        actionLabel="All listings"
      />
      <WhyAbos />
      <EnterpriseCTA />
      <SiteFooter />
    </div>
  );
}