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
import Testimonials from "@/components/dashboard/sections/Testimonials";
import LiveMarketIntelligence from "@/components/dashboard/LiveMarketIntelligence";

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

  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground font-sans">
      <HomepageHeader />
      <NotificationStack />

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

      {/* 6. Trusted Brokers */}
      <TrustedBrokers />

      {/* 7. Community */}
      <CommunitySection />

      {/* 8. Testimonials */}
      <Testimonials />

      {/* 9. Market Intelligence — hides itself when the feed is unavailable */}
      <LiveMarketIntelligence />
    </div>
  );
}