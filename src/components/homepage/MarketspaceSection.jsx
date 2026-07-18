import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FeaturedAircraftGrid from "@/components/homepage/FeaturedAircraftGrid";
import LatestVerifiedListings from "@/components/homepage/LatestVerifiedListings";
import PopularManufacturers from "@/components/homepage/PopularManufacturers";

export default function MarketspaceSection() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["homepage-listings"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-created_date", 20),
    staleTime: 5 * 60 * 1000,
  });

  const withPhotos = (listings || []).filter((l) => l.photo_url);
  const featured = (withPhotos.length >= 3 ? withPhotos : listings || []).slice(0, 3);
  const featuredIds = new Set(featured.map((l) => l.id));
  const latest = (listings || []).filter((l) => !featuredIds.has(l.id)).slice(0, 4);

  return (
    <section className="bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1360px] px-5 py-20 sm:px-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-[#1a1a1a] sm:text-2xl">Featured Aircraft</h2>
          <Link to="/listings" className="text-[12px] font-bold text-[#D4A017] hover:underline">View all →</Link>
        </div>
        <div className="mt-6">
          <FeaturedAircraftGrid listings={featured} isLoading={isLoading} />
        </div>

        <div className="mt-16 flex items-baseline justify-between">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-[#1a1a1a] sm:text-2xl">Latest Verified Listings</h2>
          <Link to="/listings" className="text-[12px] font-bold text-[#D4A017] hover:underline">View all →</Link>
        </div>
        <div className="mt-6">
          <LatestVerifiedListings listings={latest} isLoading={isLoading} />
        </div>

        <h2 className="mt-16 text-lg font-bold tracking-[-0.01em] text-[#1a1a1a] sm:text-2xl">Popular Manufacturers</h2>
        <div className="mt-6">
          <PopularManufacturers />
        </div>
      </div>
    </section>
  );
}