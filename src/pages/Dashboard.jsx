import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import HomeHero from "@/components/home/HomeHero";
import StatStrip from "@/components/home/StatStrip";
import HubGrid from "@/components/home/HubGrid";
import CtaSection from "@/components/home/CtaSection";
import ListingsShowcase from "@/components/dashboard/sections/ListingsShowcase";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";

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
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero with globe + tail-number search */}
      <HomeHero />

      {/* 2. Live market stats */}
      <StatStrip />

      {/* 3. Four-hub navigation */}
      <HubGrid />

      {/* 4. Featured aircraft listings */}
      <ListingsShowcase
        listings={listings}
        isLoading={listingsLoading}
        eyebrow="Featured Aircraft"
        title="Browse Aircraft from Verified Sellers"
        layout="carousel"
        actionTo="/listings"
        actionLabel="Browse all aircraft"
      />

      {/* 5. Aviation news ticker */}
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-8">
        <AviationNewsTicker />
      </div>

      {/* 6. Closing CTA */}
      <CtaSection />
    </div>
  );
}