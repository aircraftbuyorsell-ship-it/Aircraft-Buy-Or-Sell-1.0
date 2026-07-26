import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationStack from "@/components/notifications/NotificationStack";
import HomepageHeader from "@/components/homepage/HomepageHeader";
import HomeHeroSection from "@/components/homepage/HomeHeroSection";
import HomeFeatureBar from "@/components/homepage/HomeFeatureBar";
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

      {/* 1. Hero (with Globe) */}
      <HomeHeroSection />

      <HomeFeatureBar />

      {/* Running news bar — directly below the globe */}
      <div className="relative z-20 mx-auto w-full max-w-[1500px] px-4 pt-3 md:px-8">
        <AviationNewsTicker />
      </div>

      {/* 2. Featured Aircraft */}
      <ListingsShowcase
        listings={listings}
        isLoading={listingsLoading}
        eyebrow="Featured Aircraft"
        title="Handpicked Aircraft from Verified Sellers"
        layout="carousel"
        actionTo="/listings"
        actionLabel="View all"
      />

      {/* 3. ATI Passport Verification */}
      <ATIPassportVerification />

      <AutomationAdvantage />

      {/* 4. Sales Pipeline */}
      <SalesPipelinePromo />

      {/* 5. Aircraft Value Estimator */}
      <ValueEstimator />

      {/* 5b. Monetization CTA — wraps featured tools with credit/fiat pricing */}
      <MonetizationCTA user={user} />

      {/* 5c. Featured Developer Tools — hides itself when no active tools */}
      <FeaturedToolsSection />

      {/* 6. Trusted Brokers */}
      <TrustedBrokers />

      {/* 7. Community */}
      <CommunitySection />

      {/* 8. Aviation News Feed — curated from FAA + AOPA */}
      <HomeNewsFeed />

      {/* 9. Market Intelligence — hides itself when the feed is unavailable */}
      <LiveMarketIntelligence />
    </div>
  );
}