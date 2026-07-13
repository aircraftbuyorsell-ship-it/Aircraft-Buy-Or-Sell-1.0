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
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #0d1118 0%, #080a0e 35%, #050608 70%, #030406 100%)",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <HomepageHeader />
      <NotificationStack />
      <div className="relative z-20 mx-auto w-full max-w-[1500px] px-4 pt-3 md:px-8">
        <AviationNewsTicker />
      </div>

      {/* 1. Hero */}
      <HomeHeroSection />

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