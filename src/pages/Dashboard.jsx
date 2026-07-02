import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationStack from "@/components/notifications/NotificationStack";
import SiteFooter from "@/components/SiteFooter";
import SectionShell from "@/components/dashboard/sections/SectionShell";
import HomepageHeader from "@/components/homepage/HomepageHeader";
import HomeHeroSection from "@/components/homepage/HomeHeroSection";
import ListingsShowcase from "@/components/dashboard/sections/ListingsShowcase";
import AircraftSearch from "@/components/dashboard/sections/AircraftSearch";
import ATIPassportVerification from "@/components/dashboard/sections/ATIPassportVerification";
import ValueEstimator from "@/components/dashboard/sections/ValueEstimator";
import TrustedBrokers from "@/components/dashboard/sections/TrustedBrokers";
import CommunitySection from "@/components/dashboard/sections/CommunitySection";
import Testimonials from "@/components/dashboard/sections/Testimonials";
import LiveMarketIntelligence from "@/components/dashboard/LiveMarketIntelligence";

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

  return (
    <div
      style={{
        background: "transparent",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <HomepageHeader />
      <NotificationStack />

      {/* 1. Hero */}
      <HomeHeroSection />

      {/* 2. Featured Aircraft */}
      <ListingsShowcase
        listings={listings}
        eyebrow="Featured Aircraft"
        title="Handpicked Aircraft from Verified Sellers"
        layout="carousel"
        actionTo="/listings"
        actionLabel="View all"
      />

      {/* 3. Aircraft Search */}
      <AircraftSearch />

      {/* 4. ATI Passport Verification */}
      <ATIPassportVerification />

      {/* 5. Aircraft Value Estimator */}
      <ValueEstimator />

      {/* 6. Trusted Brokers */}
      <TrustedBrokers />

      {/* 7. Community */}
      <CommunitySection />

      {/* 8. Testimonials */}
      <Testimonials />

      {/* 9. Market Intelligence */}
      <SectionShell
        eyebrow="Market Intelligence · Live"
        title="Real-Time Market Data Feed"
        subtitle="Live market pricing and availability across top manufacturers. Data automatically recalibrates OMVM valuations and ATI scoring."
      >
        <LiveMarketIntelligence />
      </SectionShell>

      {/* 10. Footer */}
      <SiteFooter />
    </div>
  );
}