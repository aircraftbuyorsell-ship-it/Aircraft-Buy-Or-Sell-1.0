import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationStack from "@/components/notifications/NotificationStack";
import HomepageHeader from "@/components/homepage/HomepageHeader";
import HomeHeroSection from "@/components/homepage/HomeHeroSection";
import ListingsShowcase from "@/components/dashboard/sections/ListingsShowcase";
import SalesPipelinePromo from "@/components/dashboard/sections/SalesPipelinePromo";
import ATIPassportVerification from "@/components/dashboard/sections/ATIPassportVerification";
import ValueEstimator from "@/components/dashboard/sections/ValueEstimator";
import TrustedBrokers from "@/components/dashboard/sections/TrustedBrokers";
import CommunitySection from "@/components/dashboard/sections/CommunitySection";
import LiveMarketIntelligence from "@/components/dashboard/LiveMarketIntelligence";
import FeaturedToolsSection from "@/components/dashboard/sections/FeaturedToolsSection";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import HomeNewsFeed from "@/components/dashboard/sections/HomeNewsFeed";
import MonetizationCTA from "@/components/dashboard/sections/MonetizationCTA";
import AutomationAdvantage from "@/components/homepage/AutomationAdvantage";
import DashboardBand from "@/components/dashboard/DashboardBand";
import DashboardJumpBar from "@/components/dashboard/DashboardJumpBar";

export default function Dashboard() {
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["listings-hub"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-created_date",
        10
      ),
    staleTime: 30000,
  });

  const { data: user } = useQuery({
    queryKey: ["auth-me-dashboard"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 60000,
  });

  return (
    <div
      className="text-foreground"
      style={{
        background: "transparent",
        minHeight: "100vh",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <HomepageHeader />
      <NotificationStack />

      {/* Hero — globe + živý signál */}
      <HomeHeroSection />

      <DashboardJumpBar />

      {/* Band A — Živý signál */}
      <DashboardBand
        id="signal"
        eyebrow="Živý signál"
        title="Co se právě děje"
        intro="Živé letové signály, zprávy a tržní inteligence v reálném čase."
      >
        <div className="relative z-20 mx-auto w-full max-w-[1500px] px-4 md:px-8">
          <AviationNewsTicker />
        </div>
        <LiveMarketIntelligence />
      </DashboardBand>

      {/* Band B — Objevit & ověřit */}
      <DashboardBand
        id="discover"
        eyebrow="Objevit & ověřit"
        title="Najdi a ověř letadlo"
        intro="Procházejte ověřená letadla, kontrolujte ATI pasy a sledujte obchodní pipeline."
      >
        <ListingsShowcase
          listings={listings}
          isLoading={listingsLoading}
          eyebrow="Featured Aircraft"
          title="Handpicked Aircraft from Verified Sellers"
          layout="carousel"
          actionTo="/listings"
          actionLabel="View all"
        />
        <ATIPassportVerification />
        <SalesPipelinePromo />
      </DashboardBand>

      {/* Band C — Hodnotit & rozhodnout */}
      <DashboardBand
        id="value"
        eyebrow="Hodnotit & rozhodnout"
        title="Oceňování a nástroje"
        intro="Oceňujte letadla, odemykejte nástroje a automatizujte rozhodnutí."
      >
        <ValueEstimator />
        <MonetizationCTA user={user} />
        <FeaturedToolsSection />
        <AutomationAdvantage />
      </DashboardBand>

      {/* Band D — Komunita & přehled */}
      <DashboardBand
        id="community"
        eyebrow="Komunita & přehled"
        title="Síť a zprávy"
        intro="Ověření brokeři, komunita a kurátorované zprávy z FAA a AOPA."
      >
        <TrustedBrokers />
        <CommunitySection />
        <HomeNewsFeed />
      </DashboardBand>
    </div>
  );
}