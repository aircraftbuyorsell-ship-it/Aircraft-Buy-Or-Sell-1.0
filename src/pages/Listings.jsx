import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import ListingCard from "@/components/listings/ListingCard";
import ListingFilters from "@/components/listings/ListingFilters";
import ListingDrawer from "@/components/listings/ListingDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane } from "lucide-react";

export default function Listings() {
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    make: "",
    priceMin: 0,
    priceMax: 2000000,
    atiMin: 0,
    yearFrom: 1970,
    yearTo: new Date().getFullYear(),
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings-public"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-ati_score",
        100
      ),
  });

  const makes = useMemo(
    () => [...new Set(listings.map((l) => l.make).filter(Boolean))].sort(),
    [listings]
  );

  const maxPrice = useMemo(
    () => Math.max(...listings.map((l) => l.asking_price || 0), 2000000),
    [listings]
  );

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const q = filters.search.toLowerCase();
      if (
        q &&
        !`${l.make} ${l.model} ${l.registration}`.toLowerCase().includes(q)
      )
        return false;
      if (filters.make && l.make !== filters.make) return false;
      if (l.asking_price < filters.priceMin || l.asking_price > filters.priceMax)
        return false;
      if ((l.ati_score || 0) < filters.atiMin) return false;
      if (l.year && (l.year < filters.yearFrom || l.year > filters.yearTo))
        return false;
      return true;
    });
  }, [listings, filters]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <Plane className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">Aircraft Listings</h1>
          {!isLoading && (
            <span className="ml-2 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {filtered.length} results
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-0">
        {/* Filters sidebar */}
        <div className="xl:w-72 shrink-0 border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-900/40">
          <ListingFilters
            filters={filters}
            setFilters={setFilters}
            makes={makes}
            maxPrice={maxPrice}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Plane className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No listings match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} onClick={() => setSelected(l)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <ListingDrawer listing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}